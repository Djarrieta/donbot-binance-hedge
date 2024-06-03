import type { User } from "./user/User";
import type { Symbol } from "./symbol/Symbol";
import { params } from "./Params";
import { cancelOrdersService } from "./user/services/cancelOrdersService";
import type { PositionSide, Position } from "./models/Position";
import { protectPositionService } from "./user/services/protectPositionService";
import { openPositionService } from "./user/services/openPositionService";
import { quitPositionService } from "./user/services/quitPositionService";
import type { Candle } from "./models/Candle";
import { getDate } from "./utils/getDate";
import type { Order } from "./models/Order";

type constructorProps = {
	userList: User[];
	symbolList: Symbol[];
};
export class Context {
	private constructor({ userList, symbolList }: constructorProps) {
		this.userList = userList;
		this.symbolList = symbolList;
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

	symbolList: Symbol[] = [];
	userList: User[] = [];

	async manageExistingPositions({ userName }: { userName: string }) {
		const userIndex = this.userList.findIndex((x) => x.name === userName);
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
				await this.cancelOrders({ userName, pair });
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
			const symbol = this.symbolList.find((s) => s.pair === pair);
			if (!symbol) continue;
			await this.protectPosition({ userName, symbol, positionSide: "LONG" });
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
						user: this.userList[userIndex],
						positionSide: pos.positionSide,
						symbol,
						coinQuantity: pos.coinQuantity,
					});
				}
				return;
			}
		}
	}
	async quitPosition(props: {
		user: User;
		symbol: Symbol;
		positionSide: PositionSide;
		coinQuantity: number;
	}) {
		await quitPositionService(props);
	}

	async cancelOrders({ userName, pair }: { userName: string; pair: string }) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		await cancelOrdersService({ user: this.userList[userIndex], pair });
		this.userList[userIndex].openOrders = this.userList[
			userIndex
		].openOrders.filter((o) => o.pair !== pair);
	}
	async openPosition({
		userName,
		symbol,
		positionSide,
	}: {
		userName: string;
		symbol: Symbol;
		positionSide: PositionSide;
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		await this.cancelOrders({ userName, pair: symbol.pair });
		const sl =
			positionSide === "LONG"
				? symbol.currentPrice * (1 - params.defaultSL)
				: symbol.currentPrice * (1 + params.defaultSL);

		const tp =
			positionSide === "LONG"
				? symbol.currentPrice * (1 + params.defaultTP)
				: symbol.currentPrice * (1 - params.defaultTP);

		const coinQuantity = params.minAmountToTrade / symbol.currentPrice; // TODO
		await openPositionService({
			symbol,
			user: this.userList[userIndex],
			positionSide,
			coinQuantity,
			price: symbol.currentPrice,
			sl,
			tp,
		});
	}
	async protectPosition({
		userName,
		symbol,
		positionSide,
	}: {
		userName: string;
		symbol: Symbol;
		positionSide: PositionSide;
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;
		const openPosIndex = this.userList[userIndex].openPositions.findIndex(
			(p) => p.pair === symbol.pair
		);
		if (openPosIndex === -1) return;
		const openPos = this.userList[userIndex].openPositions[openPosIndex];

		await this.cancelOrders({ userName, pair: symbol.pair });
		const sl =
			openPos.positionSide === "LONG"
				? symbol.currentPrice * (1 - params.defaultSL)
				: symbol.currentPrice * (1 + params.defaultSL);

		const tp =
			openPos.positionSide === "LONG"
				? symbol.currentPrice * (1 + params.defaultTP)
				: symbol.currentPrice * (1 - params.defaultTP);

		await protectPositionService({
			symbol,
			user: this.userList[userIndex],
			positionSide,
			coinQuantity: Number(openPos.coinQuantity),
			price: symbol.currentPrice,
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
		const prevOpenTime = getDate(
			this.symbolList[symbolIndex].candlestick[
				this.symbolList[symbolIndex].candlestick.length - 1
			].openTime
		).dateString;
		const newOpenTime = getDate(
			candlestick?.[candlestick?.length - 1]?.openTime
		).dateString;
		if (
			candlestick?.length === this.symbolList[symbolIndex].candlestick.length &&
			newOpenTime !== prevOpenTime
		) {
			this.symbolList[symbolIndex].candlestick = candlestick;
			this.symbolList[symbolIndex].currentPrice =
				candlestick[candlestick.length - 1].close;
		}
		if (!candlestick?.length && currentPrice) {
			this.symbolList[symbolIndex].currentPrice = currentPrice;
		}

		if (!this.symbolList[symbolIndex].candlestick.length) {
			this.symbolList[symbolIndex].isReady = false;
			return;
		}

		const lastOpenTime =
			this.symbolList[symbolIndex].candlestick[
				this.symbolList[symbolIndex].candlestick.length - 1
			].openTime;
		const lastDiff =
			(getDate().dateMs - getDate(lastOpenTime).dateMs) / params.interval;

		if (lastDiff > 2) {
			this.symbolList[symbolIndex].isReady = false;
			return;
		}

		for (
			let index = 0;
			index < this.symbolList[symbolIndex].candlestick.length - 1;
			index++
		) {
			const currentCandle = this.symbolList[symbolIndex].candlestick[index];
			const nextCandle = this.symbolList[symbolIndex].candlestick[index + 1];

			const candlesDifference =
				(getDate(nextCandle.openTime).dateMs -
					getDate(currentCandle.openTime).dateMs) /
				params.interval;

			if (candlesDifference !== 1) {
				this.symbolList[symbolIndex].isReady = false;
				return;
			}
		}
	}
	updateUser({
		userName,
		newOpenPositions,
		newOpenOrders,
	}: {
		userName: string;
		newOpenPositions?: Position[];
		newOpenOrders?: Order[];
	}) {
		const userIndex = this.userList.findIndex((u) => u.name === userName);
		if (userIndex === -1) return;

		if (newOpenPositions) {
			this.userList[userIndex].openPositions = newOpenPositions;
		}

		if (newOpenOrders) {
			this.userList[userIndex].openOrders = newOpenOrders;
		}
	}
}
