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
	symbolList: Symbol[] = [];
	userList: User[] = [];

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
