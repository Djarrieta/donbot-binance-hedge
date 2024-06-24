import type { User } from "../User";
import type { Position, PositionSide } from "../../sharedModels/Position";
import type { Symbol } from "../../symbol/Symbol";
import Binance from "binance-api-node";
import { fixPrecision } from "../../utils/fixPrecision";

export const quitPositionService = async ({
	user,
	positionSide,
	symbol,
	coinQuantity,
}: {
	user: User;
	symbol: Symbol;
	positionSide: PositionSide;
	coinQuantity: number;
}) => {
	console.log("Quit position for user: " + user.name + "in " + symbol.pair);

	const quantity = fixPrecision({
		value: Number(coinQuantity) * symbol.currentPrice,
		precision: symbol.quantityPrecision,
	});

	const authExchange = Binance({
		apiKey: user.binanceApiKey,
		apiSecret: user.binanceApiSecret || "",
	});
	await authExchange.futuresOrder({
		type: "MARKET",
		side: positionSide === "LONG" ? "BUY" : "SELL",
		positionSide: positionSide === "LONG" ? "SHORT" : "LONG",
		symbol: symbol.pair,
		quantity,
		recvWindow: 59999,
	});
};
