import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { PositionSide } from "../models/Position";
import { fixPrecision } from "../utils/fixPrecision";
import { Binance as IBinance } from "binance-api-node";
import { Symbol } from "../models/Symbol";

interface PositionProtectProps {
	symbol: Symbol;
	price: number;
	sl: number;
	tp: number;
	shouldTrade: PositionSide;
	authExchange: IBinance;
	quantity: string;
}
export const positionProtect = async ({
	symbol,
	shouldTrade,
	authExchange,
	quantity,
	price,
	sl,
	tp,
}: PositionProtectProps) => {
	try {
		const HEPriceNumber =
			shouldTrade === "LONG" ? price * (1 - sl) : price * (1 + sl);

		const HEPrice = fixPrecision({
			value: HEPriceNumber,
			precision: symbol.pricePrecision,
		});
		await authExchange.futuresCancelAllOpenOrders({
			symbol: symbol.pair,
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: shouldTrade === "LONG" ? "SELL" : "BUY",
			positionSide: shouldTrade === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: HEPrice,
			recvWindow: 59999,
			newClientOrderId: OrderType.HEDGE + ORDER_ID_DIV + HEPrice,
			timeInForce: "GTC",
		});

		const TPPriceNumber =
			shouldTrade === "LONG" ? price * (1 + tp) : price * (1 - tp);

		const TPPrice = fixPrecision({
			value: TPPriceNumber,
			precision: symbol.pricePrecision,
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: shouldTrade === "LONG" ? "BUY" : "SELL",
			positionSide: shouldTrade === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: TPPrice,
			recvWindow: 59999,
			newClientOrderId: OrderType.HEDGE + ORDER_ID_DIV + TPPrice,
			timeInForce: "GTC",
		});
	} catch (e) {
		console.log(
			"Problem protecting " + shouldTrade + " position for " + symbol.pair
		);
		console.log(e);
	}
};
