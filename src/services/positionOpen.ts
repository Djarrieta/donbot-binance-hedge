import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { PlacePosition } from "../models/Position";
import { fixPrecision } from "../utils/fixPrecision";

export const positionOpen = async ({
	symbol,
	shouldTrade,
	authExchange,
	quantity,
	price,
	sl,
	tp,
	tr,
	cb,
}: PlacePosition) => {
	try {
		await authExchange.futuresCancelAllOpenOrders({
			symbol: symbol.pair,
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
		if (sl) {
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
		}

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

		if (tr && cb) {
			const TRPriceNumber =
				shouldTrade === "LONG" ? price * (1 + tr) : price * (1 - tr);

			const TRPrice = fixPrecision({
				value: TRPriceNumber,
				precision: symbol.pricePrecision,
			});

			await authExchange.futuresOrder({
				type: "TRAILING_STOP_MARKET",
				side: shouldTrade === "LONG" ? "SELL" : "BUY",
				positionSide: shouldTrade,
				symbol: symbol.pair,
				quantity,
				callbackRate: (cb * 100).toFixed(1),
				activationPrice: TRPrice,
				recvWindow: 59999,
				newClientOrderId: OrderType.TRAILING + ORDER_ID_DIV + TRPrice,
			});
		}
	} catch (e) {
		console.log(
			"Problem opening " + shouldTrade + " position for " + symbol.pair
		);
		console.log(e);
	}
};
