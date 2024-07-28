import Binance from "binance-api-node";
import { OrderType } from "../../sharedModels/Order";
import type { PositionSide } from "../../sharedModels/Position";
import { type Symbol } from "../../symbol/Symbol";
import { fixPrecision } from "../../utils/fixPrecision";
import { orderIdNameGenerator } from "../../utils/orderIdNameGenerator";
import type { User } from "../User";

interface ProtectPositionServiceProps {
	user: User;
	symbol: Symbol;
	slPrice: number;
	tpPrice: number;
	positionSide: PositionSide;
	coinQuantity: number;
}
export const protectPositionService = async ({
	symbol,
	user,
	positionSide,
	coinQuantity,
	slPrice,
	tpPrice,
}: ProtectPositionServiceProps) => {
	const authExchange = Binance({
		apiKey: user.binanceApiKey,
		apiSecret: user.binanceApiSecret || "",
	});

	const HEPrice = fixPrecision({
		value: slPrice,
		precision: symbol.pricePrecision,
	});

	const quantity = fixPrecision({
		value: coinQuantity,
		precision: symbol.quantityPrecision,
	});

	await authExchange.futuresOrder({
		type: "STOP_MARKET",
		side: positionSide === "LONG" ? "SELL" : "BUY",
		positionSide: positionSide === "LONG" ? "SHORT" : "LONG",
		symbol: symbol.pair,
		quantity,
		stopPrice: HEPrice,
		recvWindow: 59999,
		newClientOrderId: orderIdNameGenerator({
			orderType: OrderType.HEDGE,
			positionSide,
			price: HEPrice,
		}).fullIdName,
		timeInForce: "GTC",
	});

	const TPPrice = fixPrecision({
		value: tpPrice,
		precision: symbol.pricePrecision,
	});

	await authExchange.futuresOrder({
		type: "STOP_MARKET",
		side: positionSide === "LONG" ? "BUY" : "SELL",
		positionSide: positionSide === "LONG" ? "SHORT" : "LONG",
		symbol: symbol.pair,
		quantity,
		stopPrice: TPPrice,
		recvWindow: 59999,
		newClientOrderId: orderIdNameGenerator({
			orderType: OrderType.HEDGE,
			positionSide,
			price: TPPrice,
		}).fullIdName,
		timeInForce: "GTC",
	});
};
