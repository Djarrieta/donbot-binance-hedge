import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { User } from "../models/User";
import { fixPrecision } from "../utils/fixPrecision";

export const manageAccounts = async ({ user }: { user: User }) => {
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});
	const context = await Context.getInstance();
	const userIndex = context.userList.findIndex((u) => u.id === user.id);

	const openPosUniquePairs = Array.from(
		new Set(user.openPositions.map((x) => x.pair))
	);
	const openOrdersUniquePairs = Array.from(
		new Set(user.openOrders.map((x) => x.pair))
	);

	// Cancel orders if no open positions
	if (openOrdersUniquePairs.length && !openPosUniquePairs.length) {
		for (const pair of openOrdersUniquePairs) {
			if (openPosUniquePairs.includes(pair)) continue;

			console.log("Canceling orders for " + user.name + " in " + pair);
			await authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});

			context.userList[userIndex].openOrders = context.userList[
				userIndex
			].openOrders.filter((o) => o.pair !== pair);
		}
		return;
	}

	//Cancel orders if Hedge is reached
	for (const pair of openPosUniquePairs) {
		const openPosPairLong = user.openPositions.filter(
			(p) => p.pair === pair && p.positionSide === "LONG"
		);
		const openPosPairShort = user.openPositions.filter(
			(p) => p.pair === pair && p.positionSide === "SHORT"
		);
		const openOrders = user.openOrders.filter((o) => o.pair === pair);

		if (
			openPosPairLong.length === 1 &&
			openPosPairShort.length === 1 &&
			openPosPairLong[0].coinQuantity === openPosPairShort[0].coinQuantity &&
			openOrders.length
		) {
			console.log("Canceling orders for " + user.name + " in " + pair);
			await authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});
			context.userList[userIndex].openOrders = context.userList[
				userIndex
			].openOrders.filter((o) => o.pair !== pair);
		}
	}

	//Protect positions with no orders and no Hedge
	for (const pair of openPosUniquePairs) {
		const openPos = user.openPositions.filter((p) => p.pair === pair);
		const openOrders = user.openOrders.filter((o) => o.pair === pair);

		if (openPos.length === 1 && openOrders.length === 0) {
			const symbol = context.symbolList.find((s) => s.pair === openPos[0].pair);
			if (!symbol) return;

			console.log("Non-protected position for " + user.name + " in " + pair);

			const SLPriceNumber =
				openPos[0].positionSide === "LONG"
					? symbol.currentPrice * (1 - Context.defaultSL)
					: symbol.currentPrice * (1 + Context.defaultSL);

			const SLPrice = fixPrecision({
				value: SLPriceNumber,
				precision: symbol.pricePrecision,
			});

			await authExchange.futuresOrder({
				type: "STOP_MARKET",
				side: openPos[0].positionSide === "LONG" ? "SELL" : "BUY",
				positionSide: openPos[0].positionSide,
				symbol: symbol.pair,
				quantity: openPos[0].coinQuantity,
				stopPrice: SLPrice,
				recvWindow: 59999,
				newClientOrderId: "SL-" + symbol.pair + "-" + SLPrice,
				timeInForce: "GTC",
				newOrderRespType: "FULL",
			});
			const TPPriceNumber =
				openPos[0].positionSide === "LONG"
					? symbol.currentPrice * (1 + Context.defaultSL)
					: symbol.currentPrice * (1 - Context.defaultSL);

			const TPPrice = fixPrecision({
				value: TPPriceNumber,
				precision: symbol.pricePrecision,
			});

			await authExchange.futuresOrder({
				type: "TAKE_PROFIT_MARKET",
				side: openPos[0].positionSide === "LONG" ? "SELL" : "BUY",
				positionSide: openPos[0].positionSide,
				symbol: symbol.pair,
				quantity: openPos[0].coinQuantity,
				stopPrice: TPPrice,
				recvWindow: 59999,
				newClientOrderId: "SL-" + symbol.pair + "-" + SLPrice,
				timeInForce: "GTC",
				newOrderRespType: "FULL",
			});
		}
	}
};
