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
	cb?: number;
}
export const positionManageNew = async ({
	user,
	symbol,
	shouldTrade,
	sl,
	tp,
	tr,
	cb,
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

	console.log({
		openPosUniquePairs: openPosUniquePairs.length,
		hedgedPosUniquePairs: hedgedPosUniquePairs.length,
		isAddingPosition: user.isAddingPosition,
		includes: openPosUniquePairs.includes(symbol.pair),
	});

	if (
		(!hedgedPosUniquePairs.length && openPosUniquePairs.length >= 2) ||
		(hedgedPosUniquePairs.length >= 1 &&
			openPosUniquePairs.length - hedgedPosUniquePairs.length >= 1) ||
		hedgedPosUniquePairs.length >= 3 ||
		user.isAddingPosition ||
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
		tr,
		cb,
		price: symbol.currentPrice,
		quantity,
		symbol,
	});
};
