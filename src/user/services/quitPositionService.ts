import Binance from "binance-api-node";
import type { PositionSide } from "../../sharedModels/Position";
import type { Symbol } from "../../symbol/Symbol";
import { fixPrecision } from "../../utils/fixPrecision";
import type { User } from "../User";

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
	if (!coinQuantity) {
		throw new Error("No coin quantity");
	}
	const quantity = fixPrecision({
		value: Number(coinQuantity),
		precision: symbol.quantityPrecision,
	});

	const authExchange = Binance({
		apiKey: user.binanceApiKey,
		apiSecret: user.binanceApiSecret || "",
	});
	await authExchange.futuresOrder({
		type: "MARKET",
		side: positionSide === "LONG" ? "SELL" : "BUY",
		positionSide: positionSide === "LONG" ? "SHORT" : "LONG",
		symbol: symbol.pair,
		quantity,
		recvWindow: 59999,
	});
};
