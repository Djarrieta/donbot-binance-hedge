import { PlacePosition, PosType } from "../models/Position";
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
			newClientOrderId: PosType.PS + "__" + symbol.currentPrice,
		});
		const HEPriceNumber =
			shouldTrade === "LONG" ? price * (1 - sl) : price * (1 + sl);

		const HEPrice = fixPrecision({
			value: HEPriceNumber,
			precision: symbol.pricePrecision,
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: shouldTrade === "LONG" ? "SELL" : "BUY",
			positionSide: shouldTrade === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: HEPrice,
			recvWindow: 59999,
			newClientOrderId: PosType.HE + "__" + HEPrice,
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
			newClientOrderId: PosType.TP + "__" + TPPrice,
		});

		// if (tr && cb) {
		// 	const TRPriceNumber =
		// 		shouldTrade === "LONG" ? price * (1 + tr) : price * (1 - tr);

		// 	const TRPrice = fixPrecision({
		// 		value: TRPriceNumber,
		// 		precision: symbol.pricePrecision,
		// 	});

		// 	await authExchange.futuresOrder({
		// 		type: "TRAILING_STOP_MARKET",
		// 		side: shouldTrade === "LONG" ? "SELL" : "BUY",
		// 		positionSide: shouldTrade,
		// 		symbol: symbol.pair,
		// 		quantity,
		// 		callbackRate: (cb * 100).toFixed(),
		// 		activationPrice: TRPrice,
		// 		recvWindow: 59999,
		// 		newClientOrderId: PosType.TR + "__" + TRPrice,
		// 	});
		// }
	} catch (e) {
		console.log(
			"Problem opening " + shouldTrade + " position for " + symbol.pair
		);
		console.log(e);
	}
};
