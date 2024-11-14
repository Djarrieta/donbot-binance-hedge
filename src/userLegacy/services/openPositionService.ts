import Binance from "binance-api-node";
import { OrderType } from "../../sharedModels/Order";
import type { PositionSide } from "../../sharedModels/Position";
import { type Symbol } from "../../symbolLegacy/Symbol";
import { fixPrecision } from "../../utils/fixPrecision";
import {
	ORDER_ID_DIV,
	orderIdNameGenerator,
} from "../../utils/orderIdNameGenerator";
import type { User } from "../User";

interface OpenPositionServiceProps {
	user: User;
	symbol: Symbol;
	slPrice: number;
	tpPrice: number;
	positionSide: PositionSide;
	coinQuantity: number;
}

export const openPositionService = async ({
	symbol,
	user,
	positionSide,
	coinQuantity,
	slPrice,
	tpPrice,
}: OpenPositionServiceProps) => {
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
		type: "TAKE_PROFIT_MARKET",
		side: positionSide === "LONG" ? "SELL" : "BUY",
		positionSide: positionSide,
		symbol: symbol.pair,
		quantity,
		stopPrice: TPPrice,
		recvWindow: 59999,
		newClientOrderId: orderIdNameGenerator({
			orderType: OrderType.PROFIT,
			positionSide,
			price: TPPrice,
		}).fullIdName,
	});

	await authExchange.futuresOrder({
		type: "MARKET",
		side: positionSide === "LONG" ? "BUY" : "SELL",
		positionSide: positionSide,
		symbol: symbol.pair,
		quantity,
		recvWindow: 59999,
		newClientOrderId: orderIdNameGenerator({
			orderType: OrderType.NEW,
			positionSide,
			price: symbol.currentPrice.toString(),
		}).fullIdName,
	});
};
