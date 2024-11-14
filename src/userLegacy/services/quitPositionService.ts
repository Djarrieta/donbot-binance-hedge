import Binance from "binance-api-node";
import { OrderType } from "../../sharedModels/Order";
import type { PositionSide } from "../../sharedModels/Position";
import type { Symbol } from "../../symbolLegacy/Symbol";
import { fixPrecision } from "../../utils/fixPrecision";
import { orderIdNameGenerator } from "../../utils/orderIdNameGenerator";
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
		positionSide,
		symbol: symbol.pair,
		quantity,
		newClientOrderId: orderIdNameGenerator({
			orderType: OrderType.QUIT,
			positionSide,
			price: symbol.currentPrice.toString(),
		}).fullIdName,
		recvWindow: 59999,
	});
};
