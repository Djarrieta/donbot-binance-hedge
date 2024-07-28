import { params } from "./Params";
import type { Candle } from "./sharedModels/Candle";
import { OrderType } from "./sharedModels/Order";
import type { PositionSide } from "./sharedModels/Position";
import type { Strategy, StrategyResponse } from "./strategies/Strategy";
import type { Symbol } from "./symbol/Symbol";
import type { User } from "./user/User";
import { cancelOrdersService } from "./user/services/cancelOrdersService";
import { openPositionService } from "./user/services/openPositionService";
import { protectPositionService } from "./user/services/protectPositionService";
import { quitPositionService } from "./user/services/quitPositionService";
import { securePositionService } from "./user/services/securePositionService";
import { getDate } from "./utils/getDate";
import { getVolatility } from "./utils/getVolatility";

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
	public static async resetInstance() {
		Context.instance = null;
	}
	async handleNewPosition({
		userName,
		pair,
		positionSide,
		sl,
		tp,
	}: {
		userName: string;
		pair: string;
		positionSide: PositionSide;
		sl: number;
		tp: number;
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
			sl,
			tp,
		});
	}
	async handleExistingPositions({
		userName,
		trades,
	}: {
		userName: string;
		trades?: StrategyResponse[];
	}) {
		console.log("Handling existing positions for " + userName);
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

		//Cancel orders when no open positions
		for (const pair of openOrdersUniquePairs) {
			if (openPosUniquePairs.includes(pair)) continue;
			await this.cancelOrders({ userName, pair });
		}

		//Cancel orders for Hedge positions
		const pairWithOpenOrderForHedgePos = this.userList[userIndex].openOrders
			.filter((o) => hedgePosUniquePairs.includes(o.pair))
			.map((o) => o.pair);
		for (const pair of pairWithOpenOrderForHedgePos) {
			await this.cancelOrders({
				userName: this.userList[userIndex].name,
				pair,
			});
		}

		//Protect unprotected positions
		const unprotectedPos = this.userList[userIndex].openPositions.filter(
			(p) => p.status === "UNPROTECTED"
		);
		for (const { pair, positionSide } of unprotectedPos) {
			await this.protectPosition({
				userName,
				pair,
				positionSide,
			});
		}

		//Quit if good Pnl
		for (const pair of hedgePosUniquePairs) {
			const openPosSamePair = this.userList[userIndex].openPositions.filter(
				(p) => p.pair === pair
			);
			const samePairOpenPosPnlPt = openPosSamePair.reduce((acc, pos) => {
				return acc + pos.pnl;
			}, 0);
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;

			if (
				this.userList[userIndex].totalPnlPt + samePairOpenPosPnlPt > 0 ||
				samePairOpenPosPnlPt > 0
			) {
				for (const pos of openPosSamePair) {
					if (!pos.coinQuantity) continue;
					console.log(
						"Quitting good pnl " +
							pos.positionSide +
							" position for" +
							this.userList[userIndex].name +
							" in " +
							symbol.pair
					);
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

		// Quit position if it is taking too long
		const positionsTakingTooLong = this.userList[
			userIndex
		].openPositions.filter(
			(p) =>
				(p.status === "PROTECTED" || p.status === "SECURED") &&
				Number(p.tradeLength) >= params.maxTradeLength
		);
		for (const {
			positionSide,
			coinQuantity = 0,
			pair,
		} of positionsTakingTooLong) {
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;
			console.log(
				"Quitting " +
					positionSide +
					" position taking too long for" +
					this.userList[userIndex].name +
					" in " +
					symbol.pair
			);
			this.quitPosition({
				userName,
				positionSide,
				pair,
				coinQuantity,
			});
		}

		// Quit unbalanced position
		const unbalancedPositions = this.userList[userIndex].openPositions.filter(
			(p) => p.isHedgeUnbalance
		);
		for (const {
			positionSide,
			coinQuantity = 0,
			pair,
		} of unbalancedPositions) {
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;
			console.log(
				"Quitting unbalanced " +
					positionSide +
					" position for" +
					this.userList[userIndex].name +
					" in " +
					symbol.pair
			);
			this.quitPosition({
				userName,
				positionSide,
				pair,
				coinQuantity,
			});
		}

		//Quit position if reverting direction
		const securedPositionsReverting = this.userList[
			userIndex
		].openPositions.filter((p) => {
			const tradesSamePairOppositeSide = trades?.filter(
				(t) =>
					t.pair === p.pair &&
					t.positionSide !== null &&
					t.positionSide !== p.positionSide
			);
			return p.status === "SECURED" && tradesSamePairOppositeSide?.length;
		});
		for (const {
			positionSide,
			coinQuantity = 0,
			pair,
		} of securedPositionsReverting) {
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;
			console.log(
				"Quitting " +
					positionSide +
					" position trending in opposite direction for " +
					this.userList[userIndex].name +
					" in " +
					symbol.pair
			);
			this.quitPosition({
				userName,
				positionSide,
				pair,
				coinQuantity,
			});
		}
	}
	checkForTrades({
		logs = true,
		checkSymbols = true,
	}: {
		logs?: boolean;
		checkSymbols?: boolean;
	}) {
		const response: {
			text: string;
			trades: StrategyResponse[];
		} = { text: "", trades: [] };
		if (checkSymbols) {
			this.checkSymbols();
		}
		for (
			let symbolIndex = 0;
			symbolIndex < this.symbolList.length;
			symbolIndex++
		) {
			const symbol = this.symbolList[symbolIndex];
			this.symbolList[symbolIndex].volatility = getVolatility({
				candlestick: symbol.candlestick,
			});
		}

		const readySymbols = [...this.symbolList]
			.filter((s) => s.isReady)
			.sort((a, b) => Number(b.volatility) - Number(a.volatility));

		if (logs && readySymbols.length) {
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

		for (const strategy of this.strategies) {
			for (const symbol of readySymbols) {
				const stgResponse = strategy?.validate({
					candlestick: symbol.candlestick,
					pair: symbol.pair,
				});
				if (stgResponse.positionSide) {
					response.trades.push(stgResponse);
				}
			}
		}

		if (response.trades.length > 4) {
			response.text =
				"+ Should trade " +
				response.trades[0].pair +
				", " +
				response.trades[1].pair +
				", ...(" +
				(response.trades.length - 2) +
				" more) ";
		}
		if (response.trades.length && response.trades.length <= 4) {
			response.text =
				"+ Should trade " +
				response.trades.map(
					(t) => " " + t.positionSide + " in " + t.pair + " with " + t.stgName
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

		const symbolIndex = this.symbolList.findIndex((s) => s.pair === pair);
		if (symbolIndex === -1) return;

		try {
			await quitPositionService({
				user: this.userList[userIndex],
				symbol: this.symbolList[symbolIndex],
				positionSide,
				coinQuantity,
			});

			this.clearPositions({ userName, pair });
		} catch (e) {
			console.error(e);
		}
	}
	async cancelOrders({ userName, pair }: { userName: string; pair: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;
		console.log(
			"Canceling orders for " + this.userList[userIndex].name + " in " + pair
		);
		try {
			await cancelOrdersService({ user: this.userList[userIndex], pair });
			this.clearOrders({ userName, pair });
		} catch (e) {
			console.error(e);
		}
	}
	async openPosition({
		userName,
		pair,
		positionSide,
		sl,
		tp,
	}: {
		userName: string;
		pair: string;
		positionSide: PositionSide;
		sl: number;
		tp: number;
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

		const slPrice =
			positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 - sl)
				: this.symbolList[symbolIndex].currentPrice * (1 + sl);

		const tpPrice =
			positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 + tp)
				: this.symbolList[symbolIndex].currentPrice * (1 - tp);

		const quantityUSDT = this.amountToTradeUSDT({ userName, sl });

		const coinQuantity = Math.max(
			quantityUSDT / this.symbolList[symbolIndex].currentPrice,
			quantityUSDT / tpPrice,
			quantityUSDT / slPrice
		);
		console.log(
			"Opening position for " + userName + " " + pair + " " + positionSide
		);
		try {
			await openPositionService({
				symbol: this.symbolList[symbolIndex],
				user: this.userList[userIndex],
				positionSide,
				coinQuantity,
				slPrice,
				tpPrice,
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
		} catch (e) {
			console.error(e);
		}
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

		const symbolIndex = this.symbolList.findIndex((s) => s.pair === pair);
		if (symbolIndex === -1) return;

		const openPosIndex = this.userList[userIndex].openPositions.findIndex(
			(p) => p.pair === pair
		);
		if (openPosIndex === -1) return;
		const openPos = this.userList[userIndex].openPositions[openPosIndex];

		await this.cancelOrders({ userName, pair });
		const slPrice =
			openPos.positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 - params.defaultSL)
				: this.symbolList[symbolIndex].currentPrice * (1 + params.defaultSL);

		const tpPrice =
			openPos.positionSide === "LONG"
				? this.symbolList[symbolIndex].currentPrice * (1 + params.defaultTP)
				: this.symbolList[symbolIndex].currentPrice * (1 - params.defaultTP);
		console.log(
			"Protecting position for " + userName + " " + pair + " " + positionSide
		);
		try {
			await protectPositionService({
				symbol: this.symbolList[symbolIndex],
				user: this.userList[userIndex],
				positionSide,
				coinQuantity: Number(openPos.coinQuantity),
				slPrice,
				tpPrice,
			});

			this.userList[userIndex].openPositions[openPosIndex].status = "PROTECTED";
		} catch (e) {
			console.error(e);
			await this.quitPosition({
				userName,
				pair,
				positionSide,
				coinQuantity: Number(openPos.coinQuantity),
			});
		}
	}
	async securePositions() {
		for (let userIndex = 0; userIndex < this.userList.length; userIndex++) {
			for (
				let posIndex = 0;
				posIndex < this.userList[userIndex].openPositions.length;
				posIndex++
			) {
				const pos = this.userList[userIndex].openPositions[posIndex];

				if (pos.status !== "PROTECTED" && pos.status !== "SECURED") continue;

				const symbol = this.symbolList.find((s) => s.pair === pos.pair);

				if (!symbol || !symbol.currentPrice) continue;
				const breakOrdersSameSymbol = this.userList[
					userIndex
				].openOrders.filter(
					(order) =>
						order.pair === pos.pair && order.orderType === OrderType.BREAK
				);

				const pnlGraph =
					pos.positionSide === "LONG"
						? (symbol.currentPrice - pos.entryPriceUSDT) / pos.entryPriceUSDT
						: (pos.entryPriceUSDT - symbol.currentPrice) / pos.entryPriceUSDT;
				for (
					let alertIndex = 0;
					alertIndex < params.breakEventAlerts.length;
					alertIndex++
				) {
					const alert = params.breakEventAlerts[alertIndex];
					if (
						pnlGraph > alert.alert &&
						Number(pos.tradeLength) >= alert.len &&
						breakOrdersSameSymbol.length <= alertIndex
					) {
						const bePrice =
							pos.positionSide === "LONG"
								? pos.entryPriceUSDT * (1 + alert.value)
								: pos.entryPriceUSDT * (1 - alert.value);
						console.log(
							"Securing position for " +
								this.userList[userIndex].name +
								" " +
								pos.pair +
								" " +
								pos.positionSide
						);
						try {
							await securePositionService({
								symbol,
								user: this.userList[userIndex],
								positionSide:
									this.userList[userIndex].openPositions[posIndex].positionSide,
								coinQuantity: Number(
									this.userList[userIndex].openPositions[posIndex].coinQuantity
								),
								bePrice,
							});

							this.userList[userIndex].openPositions[posIndex].status =
								"SECURED";
							breakOrdersSameSymbol.push({
								pair: pos.pair,
								orderType: OrderType.BREAK,
								price: bePrice,
								coinQuantity: 0,
								orderId: 0,
								clientOrderId: "",
							});
						} catch (e) {
							console.error(e);
						}
					}
				}
			}
		}
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
		if (!this.symbolList[symbolIndex].candlestick.length) return;

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
	amountToTradeUSDT({ userName, sl }: { userName: string; sl: number }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return 0;

		return Math.max(
			(this.userList[userIndex].balanceUSDT * params.riskPt) / sl,
			params.minAmountToTradeUSDT
		);
	}

	text() {
		const userText = `${this.userList.map((u) => u.text).join(`\n`)}`;
		const symbolText = `Symbols: ${
			this.symbolList.filter((s) => s.isReady).length
		} ready of ${this.symbolList.length}.`;

		const strategiesText = `Strategies: ${this.strategies
			.map((s) => s.stgName)
			.join(", ")}`;

		return `${userText}\n${symbolText}\n${strategiesText}`;
	}
}
