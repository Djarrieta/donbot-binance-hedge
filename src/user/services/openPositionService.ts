import Binance, { type Binance as IBinance } from "binance-api-node";
import { ORDER_ID_DIV, OrderType } from "../../sharedModels/Order";
import type { PositionSide } from "../../sharedModels/Position";
import { type Symbol } from "../../symbol/Symbol";
import { fixPrecision } from "../../utils/fixPrecision";
import type { User } from "../User";
import { params } from "../../Params";

interface OpenPositionServiceProps {
	user: User;
	symbol: Symbol;
	price: number;
	sl: number;
	tp: number;
	positionSide: PositionSide;
	coinQuantity: number;
}

export const openPositionService = async ({
	symbol,
	user,
	positionSide,
	coinQuantity,
	price,
	sl,
	tp,
}: OpenPositionServiceProps) => {
	const authExchange = Binance({
		apiKey: user.binanceApiKey,
		apiSecret: user.binanceApiSecret || "",
	});

	const HEPriceNumber =
		positionSide === "LONG" ? price * (1 - sl) : price * (1 + sl);

	const HEPrice = fixPrecision({
		value: HEPriceNumber,
		precision: symbol.pricePrecision,
	});

	const quantityUSDT = Math.max(
		HEPriceNumber * coinQuantity,
		params.minAmountToTrade
	);
	const quantity = fixPrecision({
		value: quantityUSDT / symbol.currentPrice,
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
		newClientOrderId: OrderType.HEDGE + ORDER_ID_DIV + HEPrice,
		timeInForce: "GTC",
	});

	const TPPriceNumber =
		positionSide === "LONG" ? price * (1 + tp) : price * (1 - tp);

	const TPPrice = fixPrecision({
		value: TPPriceNumber,
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
		newClientOrderId: OrderType.PROFIT + ORDER_ID_DIV + TPPrice,
	});

	await authExchange.futuresOrder({
		type: "MARKET",
		side: positionSide === "LONG" ? "BUY" : "SELL",
		positionSide: positionSide,
		symbol: symbol.pair,
		quantity,
		recvWindow: 59999,
		newClientOrderId: OrderType.NEW + ORDER_ID_DIV + symbol.currentPrice,
	});
};
