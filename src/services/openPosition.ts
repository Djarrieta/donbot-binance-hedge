import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { User } from "../models/User";
import { fixPrecision } from "../utils/fixPrecision";
import { protectPosition } from "./protectPosition";

export const openPosition = async ({
	user,
	symbol,
	shouldTrade,
	sl,
	tp,
	tr,
	callback,
}: {
	user: User;
	symbol: Symbol;
	shouldTrade: PositionSide;
	sl: number;
	tp: number;
	tr?: number;
	callback?: number;
}) => {
	console.log("Open  position for " + user.name + " in " + symbol.pair);

	const context = await Context.getInstance();

	const userIndex = context.userList.findIndex((u) => u.id === user.id);
	context.userList[userIndex].addingPosition = true;

	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	const pricesList = await authExchange.futuresPrices();
	const currentPrice = Number(pricesList[symbol.pair]) || 0;

	let quantityNumber =
		Math.max(
			Context.minAmountToTrade,
			Number(user.balanceUSDT) * Context.amountToTradeMultiplier
		) / currentPrice;

	const quantity = fixPrecision({
		value: quantityNumber,
		precision: Number(symbol.quantityPrecision),
	});

	return;

	try {
		await authExchange.futuresCancelAllOpenOrders({ symbol: symbol.pair });
		await protectPosition({
			user,
			symbol,
			shouldTrade,
			entryPrice: currentPrice,
			quantityNumber,
			sl,
			tp,
			tr,
			callback,
		});
		await authExchange.futuresOrder({
			type: "MARKET",
			side: shouldTrade === "LONG" ? "BUY" : "SELL",
			symbol: symbol.pair,
			quantity,
			recvWindow: 59999,
		});
	} catch (e) {
		console.log(
			"Problem opening position for " + user.name + " in " + symbol.pair
		);
		console.log(e);
	}
};
