import Binance from "binance-api-node";

import { Context } from "../models/Context";
import { PositionSide } from "../models/Position";
import { User } from "../models/User";
import { Symbol } from "../models/Symbol";
import { positionKeep } from "./positionKeep";
import { positionOpen } from "./positionOpen";
import { fixPrecision } from "../utils/fixPrecision";

interface IPositionManageNew {
	user: User;
	symbol: Symbol;
	shouldTrade: PositionSide;
	sl: number;
	tp: number;
	tr?: number;
	callback?: number;
}
export const positionManageNew = async ({
	user,
	symbol,
	shouldTrade,
	sl,
	tp,
}: IPositionManageNew) => {
	const context = await Context.getInstance();
	const userIndex = context.userList.findIndex((u) => u.id === user.id);
	const openPosUniquePairs = Array.from(
		new Set(user.openPositions.map((x) => x.pair))
	);
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	for (const pair of openPosUniquePairs) {
		const openPosPairLong = user.openPositions.filter(
			(p) => p.pair === pair && p.positionSide === "LONG"
		);
		const openPosPairShort = user.openPositions.filter(
			(p) => p.pair === pair && p.positionSide === "SHORT"
		);

		if (
			symbol.pair === pair &&
			openPosPairLong.length === 1 &&
			openPosPairShort.length === 1 &&
			openPosPairLong[0].coinQuantity === openPosPairShort[0].coinQuantity
		) {
			console.log(
				"Keeping " + shouldTrade + " position for " + user.name + " in " + pair
			);
			context.userList[userIndex].isAddingPosition = true;
			await positionKeep({
				authExchange,
				shouldTrade,
				sl,
				tp,
				price: symbol.currentPrice,
				quantity: openPosPairLong[0].coinQuantity,
				symbol,
			});
		}
	}

	if (
		user.isAddingPosition ||
		openPosUniquePairs.length >= Context.maxOpenPos ||
		openPosUniquePairs.includes(symbol.pair)
	) {
		return;
	}

	console.log("Open  position for " + user.name + " in " + symbol.pair);

	context.userList[userIndex].isAddingPosition = true;

	let quantityNumber =
		Math.max(
			1.1 * Context.minAmountToTrade,
			user.balanceUSDT * Context.amountToTradePt
		) / symbol.currentPrice;

	const quantity = fixPrecision({
		value: quantityNumber,
		precision: symbol.quantityPrecision,
	});

	await positionOpen({
		authExchange,
		shouldTrade,
		sl,
		tp,
		price: symbol.currentPrice,
		quantity,
		symbol,
	});
};
