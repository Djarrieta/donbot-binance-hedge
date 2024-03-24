import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { PositionSide } from "../models/Position";
import { fixPrecision } from "../utils/fixPrecision";
import { Binance as IBinance } from "binance-api-node";
import { Symbol } from "../models/Symbol";

interface PositionOpenProps {
	symbol: Symbol;
	price: number;
	sl: number;
	tp: number;
	shouldTrade: PositionSide;
	authExchange: IBinance;
	quantity: string;
}

export const positionOpen = async ({
	symbol,
	shouldTrade,
	authExchange,
	quantity,
	price,
	sl,
	tp,
}: PositionOpenProps) => {
	try {
		await authExchange.futuresCancelAllOpenOrders({
			symbol: symbol.pair,
		});

		const SLPriceNumber =
			shouldTrade === "LONG" ? price * (1 - sl) : price * (1 + sl);

		const SLPrice = fixPrecision({
			value: SLPriceNumber,
			precision: symbol.pricePrecision,
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: shouldTrade === "LONG" ? "SELL" : "BUY",
			positionSide: shouldTrade === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: SLPrice,
			recvWindow: 59999,
			newClientOrderId: OrderType.HEDGE + ORDER_ID_DIV + SLPrice,
			timeInForce: "GTC",
		});

		const TPPriceNumber =
			shouldTrade === "LONG" ? price * (1 + tp) : price * (1 - tp);

		const TPPrice = fixPrecision({
			value: TPPriceNumber,
			precision: symbol.pricePrecision,
		});

		await authExchange.futuresOrder({
			type: "TAKE_PROFIT_MARKET",
			side: shouldTrade === "LONG" ? "SELL" : "BUY",
			positionSide: shouldTrade,
			symbol: symbol.pair,
			quantity,
			stopPrice: TPPrice,
			recvWindow: 59999,
			newClientOrderId: OrderType.PROFIT + ORDER_ID_DIV + TPPrice,
		});

		await authExchange.futuresOrder({
			type: "MARKET",
			side: shouldTrade === "LONG" ? "BUY" : "SELL",
			positionSide: shouldTrade,
			symbol: symbol.pair,
			quantity,
			recvWindow: 59999,
			newClientOrderId: OrderType.NEW + ORDER_ID_DIV + symbol.currentPrice,
		});
	} catch (e) {
		console.log(
			"Problem opening " + shouldTrade + " position for " + symbol.pair
		);
		console.log(e);
	}
};
