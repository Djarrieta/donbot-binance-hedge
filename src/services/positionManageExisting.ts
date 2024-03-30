import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { User } from "../models/User";
import { positionProtect } from "./positionProtect";
import { fixPrecision } from "../utils/fixPrecision";
import { ORDER_ID_DIV, OrderType } from "../models/Order";

export const positionManageExisting = async ({ user }: { user: User }) => {
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});
	const context = await Context.getInstance();
	const userIndex = context.userList.findIndex((u) => u.id === user.id);

	const openOrdersUniquePairs = Array.from(
		new Set(user.openOrders.map((x) => x.pair))
	);

	//Cancel orders when no open positions
	const openPosUniquePairs = Array.from(
		new Set(user.openPositions.map((x) => x.pair))
	);
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

	//Cancel orders if Hedge order is reached
	const hedgePosUniquePairs = Array.from(
		new Set(
			user.openPositions.filter((p) => p.status === "HEDGED").map((x) => x.pair)
		)
	);
	for (const pair of hedgePosUniquePairs) {
		const openOrders = user.openOrders.filter((o) => o.pair === pair);

		if (openOrders.length === 1) {
			console.log("Canceling orders for " + user.name + " in " + pair);
			await authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});
			context.userList[userIndex].openOrders = context.userList[
				userIndex
			].openOrders.filter((o) => o.pair !== pair);
		}
	}

	//Protect unprotected positions
	const unprotectedPosUniquePairs = Array.from(
		new Set(
			user.openPositions
				.filter((p) => p.status === "UNPROTECTED")
				.map((x) => x.pair)
		)
	);
	for (const pair of unprotectedPosUniquePairs) {
		const openPos = user.openPositions.filter((p) => p.pair === pair)[0];

		if (openPos.status === "UNPROTECTED") {
			console.log("Protecting position for " + openPos.pair);

			const symbol = context.symbolList.find((s) => s.pair === openPos.pair);
			if (!symbol) {
				console.log(
					"No information for " + openPos.pair + ". Unable to protect position."
				);
			} else {
				const slPrice =
					openPos.positionSide === "LONG"
						? symbol.currentPrice * (1 - Context.defaultSL)
						: symbol.currentPrice * (1 + Context.defaultSL);

				const quantityUSDT = Math.max(
					slPrice * Number(openPos.coinQuantity),
					Context.minAmountToTrade
				);
				const quantity = fixPrecision({
					value: quantityUSDT / symbol.currentPrice,
					precision: symbol.quantityPrecision,
				});

				await positionProtect({
					symbol,
					shouldTrade: openPos.positionSide,
					authExchange,
					quantity,
					price: symbol.currentPrice,
					sl: Context.defaultTP,
					tp: Context.defaultTP,
				});
			}
		}
	}

	//Quit if today Pnl > hedge open PosPnl
	for (const pair of hedgePosUniquePairs) {
		const openPosSamePair = user.openPositions.filter((p) => p.pair === pair);
		const samePairOpenPosPnlPt = openPosSamePair.reduce((acc, pos) => {
			return acc + pos.pnl;
		}, 0);

		if (user.todayPnlPt + samePairOpenPosPnlPt > 0) {
			for (const pos of openPosSamePair) {
				console.log("Quit Hedged position for " + pos.pair);
				await authExchange.futuresOrder({
					type: "MARKET",
					side: pos.positionSide === "LONG" ? "BUY" : "SELL",
					positionSide: pos.positionSide === "LONG" ? "SHORT" : "LONG",
					symbol: pos.pair,
					quantity: pos.coinQuantity,
					recvWindow: 59999,
				});
			}
			return;
		}
	}
	// Handle un balanced hedge positions
	for (const pair of hedgePosUniquePairs) {
		const openPosSamePair = user.openPositions.filter((p) => p.pair === pair);

		if (openPosSamePair.length !== 2) continue;

		const q1 = Number(openPosSamePair[0].coinQuantity);
		const q2 = Number(openPosSamePair[1].coinQuantity);

		if (q1 !== q2 && q1 > q2) {
			const symbol = context.symbolList.find(
				(s) => s.pair === openPosSamePair[0].pair
			);
			if (!symbol) continue;

			const quantity = fixPrecision({
				precision: symbol.quantityPrecision,
				value: q1 - q2,
			});
			console.log(
				"Balancing hedged positions for " + user.name + " in " + symbol.pair
			);
			await authExchange.futuresOrder({
				type: "MARKET",
				side: openPosSamePair[0].positionSide === "LONG" ? "SELL" : "BUY",
				positionSide: openPosSamePair[0].positionSide,
				symbol: openPosSamePair[0].pair,
				quantity,
				recvWindow: 59999,
			});
		}
		if (q1 !== q2 && q2 > q1) {
			const symbol = context.symbolList.find(
				(s) => s.pair === openPosSamePair[0].pair
			);
			if (!symbol) continue;

			const quantity = fixPrecision({
				precision: symbol.quantityPrecision,
				value: q2 - q1,
			});
			console.log(
				"Balancing hedged positions for " + user.name + " in " + symbol.pair
			);

			await authExchange.futuresOrder({
				type: "MARKET",
				side: openPosSamePair[1].positionSide === "LONG" ? "SELL" : "BUY",
				positionSide: openPosSamePair[1].positionSide,
				symbol: openPosSamePair[1].pair,
				quantity,
				recvWindow: 59999,
			});
		}
	}
	// Hedge position if protected position is taking too long
	for (let posIndex = 0; posIndex < user.openPositions.length; posIndex++) {
		const pos = user.openPositions[posIndex];
		if (pos.status !== "PROTECTED" || pos.len < Context.maxTradeLength)
			continue;
		console.log(
			"Hedged protected position taking too long for " +
				user.name +
				" in " +
				pos.pair
		);
		await authExchange.futuresOrder({
			type: "MARKET",
			side: pos.positionSide === "LONG" ? "SELL" : "BUY",
			positionSide: pos.positionSide === "LONG" ? "SHORT" : "LONG",
			symbol: pos.pair,
			quantity: pos.coinQuantity,
			recvWindow: 59999,
		});
		context.userList[userIndex].openPositions[posIndex].status = "HEDGED";

		await authExchange.futuresCancelAllOpenOrders({
			symbol: pos.pair,
		});
		context.userList[userIndex].openOrders = context.userList[
			userIndex
		].openOrders.filter((o) => o.pair !== pos.pair);
	}

	// Moving tp for risky positions
	for (let posIndex = 0; posIndex < user.openPositions.length; posIndex++) {
		const pos = user.openPositions[posIndex];
		if (pos.status !== "PROTECTED") continue;
		if (pos.len < 2) continue;
		const symbol = context.symbolList.find((s) => s.pair === pos.pair);
		if (!symbol) {
			continue;
		}
		const protectedOrders = user.openOrders.filter(
			(o) => o.pair === pos.pair && o.orderType === "PROFIT"
		);
		if (protectedOrders.length > 1) continue;

		const riskyValue =
			pos.positionSide === "LONG"
				? Math.min(...symbol.candlestick.slice(-pos.len).map((c) => c.low))
				: Math.max(...symbol.candlestick.slice(-pos.len).map((c) => c.high));

		const riskyValuePt =
			pos.positionSide === "LONG"
				? (riskyValue - pos.entryPriceUSDT) / pos.entryPriceUSDT
				: (pos.entryPriceUSDT - riskyValue) / pos.entryPriceUSDT;

		if (riskyValuePt < -Context.defaultSL / 2) {
			console.log({ riskyValuePt, entryPriceUSDT: pos.entryPriceUSDT });
			console.log(
				"Moving TP for risky protected position for " +
					user.name +
					" in " +
					pos.pair
			);

			const TPPriceNumber =
				pos.positionSide === "LONG"
					? pos.entryPriceUSDT * (1 + Context.defaultBE)
					: pos.entryPriceUSDT * (1 - Context.defaultBE);

			const TPPrice = fixPrecision({
				value: TPPriceNumber,
				precision: symbol.pricePrecision,
			});

			context.userList[userIndex].openOrders.push({
				price: Number(TPPrice),
				pair: symbol.pair,
				orderType: OrderType.PROFIT,
				orderId: 0,
				coinQuantity: Number(pos.coinQuantity),
				clientOrderId: OrderType.PROFIT + ORDER_ID_DIV + TPPrice,
			});

			await authExchange.futuresOrder({
				type: "TAKE_PROFIT_MARKET",
				side: pos.positionSide === "LONG" ? "SELL" : "BUY",
				positionSide: pos.positionSide,
				symbol: symbol.pair,
				quantity: pos.coinQuantity,
				stopPrice: TPPrice,
				recvWindow: 59999,
				newClientOrderId: OrderType.PROFIT + ORDER_ID_DIV + TPPrice,
			});
		}
	}
};
