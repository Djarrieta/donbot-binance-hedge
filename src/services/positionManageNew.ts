import Binance from "binance-api-node";

import { Context } from "../models/Context";
import { PositionSide } from "../models/Position";
import { User } from "../models/User";
import { Symbol } from "../models/Symbol";
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

	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	const hedgedPosUniquePairs = Array.from(
		new Set(
			user.openPositions.filter((p) => p.status === "HEDGED").map((x) => x.pair)
		)
	);

	const openPosUniquePairs = Array.from(
		new Set(user.openPositions.map((x) => x.pair))
	);

	if (
		user.isAddingPosition ||
		hedgedPosUniquePairs.length >= Context.maxHedgePos ||
		openPosUniquePairs.length >= Context.maxOpenPos ||
		openPosUniquePairs.length - hedgedPosUniquePairs.length >= 1 ||
		openPosUniquePairs.includes(symbol.pair) ||
		Context.shouldStop
	) {
		return;
	}

	console.log("Open  position for " + user.name + " in " + symbol.pair);

	context.userList[userIndex].isAddingPosition = true;

	const quantityUSDT =
		Math.max(
			Context.minAmountToTrade,
			user.balanceUSDT * Context.amountToTradePt
		) / symbol.currentPrice;

	const quantity = fixPrecision({
		value: quantityUSDT,
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

	//Position keep
	// const openPosUniquePairs = Array.from(
	// 	new Set(
	// 		user.openPositions.filter((p) => p.status === "OPEN").map((x) => x.pair)
	// 	)
	// );
	// for (const pair of openPosUniquePairs) {
	// 	const openPosPairLong = user.openPositions.filter(
	// 		(p) => p.pair === pair && p.positionSide === "LONG"
	// 	);
	// 	const openPosPairShort = user.openPositions.filter(
	// 		(p) => p.pair === pair && p.positionSide === "SHORT"
	// 	);

	// 	if (
	// 		!user.isAddingPosition &&
	// 		symbol.pair === pair &&
	// 		openPosPairLong.length === 1 &&
	// 		openPosPairShort.length === 1 &&
	// 		openPosPairLong[0].coinQuantity === openPosPairShort[0].coinQuantity
	// 	) {
	// 		console.log(
	// 			"Keeping " + shouldTrade + " position for " + user.name + " in " + pair
	// 		);
	// 		//context.userList[userIndex].isAddingPosition = true;

	// 		// await positionKeep({
	// 		// 	authExchange,
	// 		// 	shouldTrade,
	// 		// 	sl,
	// 		// 	tp: tp * 2,
	// 		// 	price: symbol.currentPrice,
	// 		// 	quantity: openPosPairLong[0].coinQuantity,
	// 		// 	symbol,
	// 		// });
	// 	}
	// }
};
