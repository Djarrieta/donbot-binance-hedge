import type { User } from "./user/User";
import type { Symbol } from "./symbol/Symbol";
import { params } from "./Params";
import { cancelOrdersService } from "./user/services/cancelOrdersService";
import type { PositionSide, Position } from "./models/Position";
import { protectPositionService } from "./user/services/protectPositionService";
import { openPositionService } from "./user/services/openPositionService";
import { quitPositionService } from "./user/services/quitPositionService";

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
}
