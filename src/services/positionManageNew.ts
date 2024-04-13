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

	const openPosUnsecuredUniquePairs = Array.from(
		new Set(
			user.openPositions
				.filter((p) => p.status !== "SECURED")
				.map((x) => x.pair)
		)
	);

	const tooManyOpenWithoutHedge =
		!hedgedPosUniquePairs.length &&
		openPosUnsecuredUniquePairs.length >=
			Context.expositionLevel * Context.maxProtectedPositions;

	const tooManyOpenWithHedge =
		hedgedPosUniquePairs.length &&
		openPosUnsecuredUniquePairs.length - hedgedPosUniquePairs.length >=
			Context.expositionLevel * Context.maxProtectedPositions;

	const tooManyHedge =
		hedgedPosUniquePairs.length >=
		Context.maxHedgePositions * Context.expositionLevel;

	if (
		tooManyOpenWithoutHedge ||
		tooManyOpenWithHedge ||
		tooManyHedge ||
		user.isAddingPosition ||
		openPosUniquePairs.includes(symbol.pair) ||
		Context.shouldStop
	) {
		return;
	}

	context.userList[userIndex].isAddingPosition = true;

	const quantityUSDT =
		Math.max(
			Context.minAmountToTrade,
			(user.balanceUSDT + user.openPosPnlPt * user.balanceUSDT) *
				Context.amountToTradePt
		) / symbol.currentPrice;

	if (quantityUSDT < Context.minAmountToTrade) {
		console.log("Not ideal balance to open position");
	}

	console.log(
		"Open  position for " +
			user.name +
			" in " +
			symbol.pair +
			" with $" +
			quantityUSDT.toFixed(2)
	);

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
};
