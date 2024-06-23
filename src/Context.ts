import type { User } from "./user/User";
import type { Symbol } from "./symbol/Symbol";
import { params } from "./Params";
import { cancelOrdersService } from "./user/services/cancelOrdersService";
import type { PositionSide, Position } from "./sharedModels/Position";
import { protectPositionService } from "./user/services/protectPositionService";
import { openPositionService } from "./user/services/openPositionService";
import { quitPositionService } from "./user/services/quitPositionService";
import type { Candle } from "./sharedModels/Candle";
import { getDate } from "./utils/getDate";
import type { Order } from "./sharedModels/Order";
import type { Strategy, StrategyResponse } from "./strategies/Strategy";

type constructorProps = {
	userList: User[];
	symbolList: Symbol[];
	strategies: Strategy[];
};
export class Context {
	symbolList: Symbol[] = [];
	userList: User[] = [];
	strategies: Strategy[] = [];

	private constructor({ userList, symbolList, strategies }: constructorProps) {
		this.userList = userList;
		this.symbolList = symbolList;
		this.strategies = strategies;
	}
	private static instance: Context | null = null;
	public static async getInstance(props?: constructorProps) {
		if (Context.instance === null && props) {
			Context.instance = new Context(props);
		}
		if (Context.instance) {
			return Context.instance;
		}
	}

	async handleNewPosition({
		userName,
		pair,
		positionSide,
	}: {
		userName: string;
		pair: string;
		positionSide: PositionSide;
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;
		if (this.userList[userIndex].isAddingPosition) return;

		const hedgedPosUniquePairs = Array.from(
			new Set(
				this.userList[userIndex].openPositions
					.filter((p) => p.status === "HEDGED")
					.map((x) => x.pair)
			)
		);

		const openPosUniquePairs = Array.from(
			new Set(this.userList[userIndex].openPositions.map((x) => x.pair))
		);

		const openPosUnsecuredUniquePairs = Array.from(
			new Set(
				this.userList[userIndex].openPositions
					.filter((p) => p.status !== "SECURED")
					.map((x) => x.pair)
			)
		);

		const tooManyOpenWithoutHedge =
			!hedgedPosUniquePairs.length &&
			openPosUnsecuredUniquePairs.length >= params.maxProtectedPositions;

		const tooManyOpenWithHedge =
			hedgedPosUniquePairs.length &&
			openPosUnsecuredUniquePairs.length - hedgedPosUniquePairs.length >=
				params.maxProtectedPositions;

		const tooManyHedge =
			hedgedPosUniquePairs.length >= params.maxHedgePositions;

		if (
			tooManyOpenWithoutHedge ||
			tooManyOpenWithHedge ||
			tooManyHedge ||
			this.userList[userIndex].isAddingPosition ||
			openPosUniquePairs.includes(pair)
		) {
			return;
		}
		const symbol = this.symbolList.find((s) => s.pair === pair);

		if (!symbol) {
			return;
		}
		await this.openPosition({
			userName,
			pair,
			positionSide,
		});
	}

	async handleExistingPositions({ userName }: { userName: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		const openOrdersUniquePairs = Array.from(
			new Set(this.userList[userIndex].openOrders.map((x) => x.pair))
		);
		const openPosUniquePairs = Array.from(
			new Set(this.userList[userIndex].openPositions.map((x) => x.pair))
		);
		const hedgePosUniquePairs = Array.from(
			new Set(
				this.userList[userIndex].openPositions
					.filter((p) => p.status === "HEDGED")
					.map((x) => x.pair)
			)
		);
		const unprotectedPosUniquePairs = Array.from(
			new Set(
				this.userList[userIndex].openPositions
					.filter((p) => p.status === "UNPROTECTED")
					.map((x) => x.pair)
			)
		);

		//Cancel orders when no open positions
		for (const pair of openOrdersUniquePairs) {
			if (openPosUniquePairs.includes(pair)) continue;

			console.log(
				"Canceling orders for " + this.userList[userIndex].name + " in " + pair
			);
			await this.cancelOrders({ userName, pair });
		}

		//Cancel orders for Hedge positions
		for (const pair of hedgePosUniquePairs) {
			const openOrders = this.userList[userIndex].openOrders.filter(
				(o) => o.pair === pair
			);

			if (openOrders.length >= 1) {
				console.log(
					"Canceling orders for " +
						this.userList[userIndex].name +
						" in " +
						pair
				);
				await this.cancelOrders({
					userName: this.userList[userIndex].name,
					pair,
				});
			}
		}

		//Protect unprotected positions
		for (const pair of unprotectedPosUniquePairs) {
			console.log(
				"Protecting position for " +
					this.userList[userIndex].name +
					" in " +
					pair
			);
			await this.protectPosition({
				userName,
				pair,
				positionSide: "LONG",
			});
		}

		//Quit if total Pnl > hedge open PosPnl
		for (const pair of hedgePosUniquePairs) {
			const openPosSamePair = this.userList[userIndex].openPositions.filter(
				(p) => p.pair === pair
			);
			const samePairOpenPosPnlPt = openPosSamePair.reduce((acc, pos) => {
				return acc + pos.pnl;
			}, 0);
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;

			if (this.userList[userIndex].totalPnlPt + samePairOpenPosPnlPt > 0) {
				for (const pos of openPosSamePair) {
					if (!pos.coinQuantity) continue;
					console.log("Quit Hedged position for " + pos.pair);
					await this.quitPosition({
						userName,
						positionSide: pos.positionSide,
						pair,
						coinQuantity: pos.coinQuantity,
					});
				}
				return;
			}
		}
	}

	checkForTrades({ logs = true }: { logs?: boolean }) {
		const response: {
			text: string;
			tradeArray: { pair: string; stgResponse: StrategyResponse }[];
		} = { text: "", tradeArray: [] };
		this.checkSymbols();

		const readySymbols = this.symbolList
			.filter((s) => s.isReady)
			.sort((a, b) => Number(b.volatility) - Number(a.volatility));

		if (logs) {
			readySymbols.length > 4
				? console.log(
						"Checking for trades in  " +
							readySymbols[0].pair +
							", " +
							readySymbols[1].pair +
							", ...(" +
							(readySymbols.length - 2) +
							" more) "
				  )
				: console.log(
						"Checking for trades in  " +
							readySymbols.map((s) => s.pair).join(", ")
				  );
		}

		logs &&
			console.log(
				"Strategies: " + this.strategies.map((s) => s?.stgName).join(", ")
			);

		for (const strategy of this.strategies) {
			for (const symbol of readySymbols) {
				const stgResponse = strategy?.validate({
					candlestick: symbol.candlestick,
					pair: symbol.pair,
				});
				if (stgResponse && stgResponse.positionSide !== null) {
					response.tradeArray.push({ pair: symbol.pair, stgResponse });
				}
			}
		}

		if (response.tradeArray.length > 4) {
			response.text =
				"+ Should trade " +
				response.tradeArray[0].pair +
				", " +
				response.tradeArray[1].pair +
				", ...(" +
				(response.tradeArray.length - 2) +
				" more) ";
		}
		if (response.tradeArray.length && response.tradeArray.length <= 4) {
			response.text =
				"+ Should trade " +
				response.tradeArray.map(
					(t) =>
						t.stgResponse.positionSide +
						" in " +
						t.pair +
						" with " +
						t.stgResponse.stgName
				);
		}

		return response;
	}
	async quitPosition({
		userName,
		pair,
		positionSide,
		coinQuantity,
	}: {
		userName: string;
		pair: string;
		positionSide: PositionSide;
		coinQuantity: number;
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		const symbolIndex = this.userList[userIndex].openPositions.findIndex(
			(p) => p.pair === pair
		);
		if (symbolIndex === -1) return;

		await quitPositionService({
			user: this.userList[userIndex],
			symbol: this.symbolList[symbolIndex],
			positionSide,
			coinQuantity,
		});

		this.clearPositions({ userName, pair });
	}
	async cancelOrders({ userName, pair }: { userName: string; pair: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		await cancelOrdersService({ user: this.userList[userIndex], pair });
		this.clearOrders({ userName, pair });
	}
	async openPosition({
		userName,
		pair,
		positionSide,
	}: {
		userName: string;
		pair: string;
		positionSide: PositionSide;
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) {
			return;
		}

		const symbolIndex = this.symbolList.findIndex((p) => p.pair === pair);
		if (symbolIndex === -1) {
			return;
		}
		this.userList[userIndex].isAddingPosition = true;

		await this.cancelOrders({ userName, pair });

		const sl =
			positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 - params.defaultSL)
				: this.symbolList[symbolIndex].currentPrice * (1 + params.defaultSL);

		const tp =
			positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 + params.defaultTP)
				: this.symbolList[symbolIndex].currentPrice * (1 - params.defaultTP);

		const coinQuantity = Math.max(
			params.minAmountToTrade / this.symbolList[symbolIndex].currentPrice,
			params.minAmountToTrade / tp,
			params.minAmountToTrade / sl
		);

		await openPositionService({
			symbol: this.symbolList[symbolIndex],
			user: this.userList[userIndex],
			positionSide,
			coinQuantity,
			sl,
			tp,
		});
		this.userList[userIndex].openPositions.push({
			pair,
			positionSide,
			coinQuantity,
			startTime: getDate().date,
			status: "PROTECTED",
			pnl: 0,
			entryPriceUSDT: this.symbolList[symbolIndex].currentPrice,
		});
	}
	async protectPosition({
		userName,
		pair,
		positionSide,
	}: {
		userName: string;
		pair: string;
		positionSide: PositionSide;
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		const symbolIndex = this.userList[userIndex].openPositions.findIndex(
			(p) => p.pair === pair
		);
		if (symbolIndex === -1) return;

		const openPosIndex = this.userList[userIndex].openPositions.findIndex(
			(p) => p.pair === pair
		);
		if (openPosIndex === -1) return;
		const openPos = this.userList[userIndex].openPositions[openPosIndex];

		await this.cancelOrders({ userName, pair });
		const sl =
			openPos.positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 - params.defaultSL)
				: this.symbolList[symbolIndex].currentPrice * (1 + params.defaultSL);

		const tp =
			openPos.positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 + params.defaultTP)
				: this.symbolList[symbolIndex].currentPrice * (1 - params.defaultTP);

		await protectPositionService({
			symbol: this.symbolList[symbolIndex],
			user: this.userList[userIndex],
			positionSide,
			coinQuantity: Number(openPos.coinQuantity),
			sl,
			tp,
		});

		this.userList[userIndex].openPositions[openPosIndex].status = "PROTECTED";
	}
	updateSymbol({
		pair,
		candlestick,
		currentPrice,
	}: {
		pair: string;
		candlestick?: Candle[];
		currentPrice?: number;
	}) {
		const symbolIndex = this.symbolList.findIndex((s) => s.pair === pair);
		if (symbolIndex === -1) {
			return;
		}

		if (!candlestick?.length && currentPrice) {
			this.symbolList[symbolIndex].currentPrice = currentPrice;
			return;
		}

		const prevOpenTime = getDate(
			this.symbolList[symbolIndex].candlestick[
				this.symbolList[symbolIndex].candlestick.length - 1
			].openTime
		).dateString;
		const newOpenTime = getDate(
			candlestick?.[candlestick?.length - 1]?.openTime
		).dateString;

		if (
			!currentPrice &&
			candlestick?.length === this.symbolList[symbolIndex].candlestick.length &&
			newOpenTime !== prevOpenTime
		) {
			this.symbolList[symbolIndex].candlestick = candlestick;
			this.symbolList[symbolIndex].currentPrice =
				candlestick[candlestick.length - 1].close;
		}
	}
	checkSymbols() {
		for (
			let symbolIndex = 0;
			symbolIndex < this.symbolList.length;
			symbolIndex++
		) {
			const symbol = this.symbolList[symbolIndex];

			if (!symbol.candlestick.length) {
				this.symbolList[symbolIndex].isReady = false;
				continue;
			}

			const lastOpenTime =
				symbol.candlestick[symbol.candlestick.length - 1].openTime;
			const lastDiff =
				(getDate().dateMs - getDate(lastOpenTime).dateMs) / params.interval;

			if (lastDiff > 2) {
				this.symbolList[symbolIndex].isReady = false;
				continue;
			}

			for (let index = 0; index < symbol.candlestick.length - 1; index++) {
				const currentCandle = symbol.candlestick[index];
				const nextCandle = symbol.candlestick[index + 1];

				const candlesDifference =
					(getDate(nextCandle.openTime).dateMs -
						getDate(currentCandle.openTime).dateMs) /
					params.interval;

				if (candlesDifference !== 1) {
					this.symbolList[symbolIndex].isReady = false;
					continue;
				}
			}
			this.symbolList[symbolIndex].isReady = true;
		}
	}

	clearPositions({ userName, pair }: { userName: string; pair?: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;
		if (pair) {
			this.userList[userIndex].openPositions = this.userList[
				userIndex
			].openPositions.filter((p) => p.pair !== pair);
			return;
		}
		this.userList[userIndex].openPositions = [];
	}
	clearOrders({ userName, pair }: { userName: string; pair?: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;
		if (pair) {
			this.userList[userIndex].openOrders = this.userList[
				userIndex
			].openOrders.filter((p) => p.pair !== pair);
			return;
		}
		this.userList[userIndex].openOrders = [];
	}

	updateUsers({ userList }: { userList?: User[] }) {
		if (!userList) return;
		this.userList = userList;
	}
	text() {
		const userText = `Users: ${this.userList
			.map((u) => u.name?.split(" ")[0])
			.join(", ")}`;
		const symbolText = `Symbols: ${
			this.symbolList.filter((s) => s.isReady).length
		} ready of ${this.symbolList.length}.`;

		return `${userText}\n${symbolText}`;
	}
}
