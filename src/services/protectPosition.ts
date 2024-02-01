import Binance from "binance-api-node";
import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { User } from "../models/User";
import { fixPrecision } from "../utils/fixPrecision";

export const protectPosition = async ({
	user,
	symbol,
	shouldTrade,
	entryPrice,
	quantityNumber,
	sl,
	tp,
	tr,
	callback,
}: {
	user: User;
	symbol: Symbol;
	shouldTrade: PositionSide;
	entryPrice: number;
	quantityNumber: number;
	sl: number;
	tp?: number;
	tr?: number;
	callback?: number;
}) => {
	console.log("Protecting position for " + user.name + " in " + symbol.pair);

	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	const { pair, pricePrecision, quantityPrecision } = symbol;

	const quantity = fixPrecision({
		value: quantityNumber * 2,
		precision: Number(quantityPrecision),
	});

	const SLPriceNumber =
		shouldTrade === "LONG"
			? Number(entryPrice) * (1 - sl)
			: Number(entryPrice) * (1 + sl);

	const SLPrice = fixPrecision({
		value: SLPriceNumber,
		precision: Number(pricePrecision),
	});

	authExchange.futuresOrder({
		type: "STOP_MARKET",
		side: shouldTrade === "LONG" ? "SELL" : "BUY",
		symbol: pair,
		quantity,
		stopPrice: SLPrice,
		recvWindow: 59999,
		reduceOnly: "true",
		newClientOrderId: "DonBotSL-" + pair + "-" + SLPrice,
	});

	if (tp) {
		const TPPriceNumber =
			shouldTrade === "LONG"
				? Number(entryPrice) * (1 + tp)
				: Number(entryPrice) * (1 - tp);

		const TPPrice = fixPrecision({
			value: TPPriceNumber,
			precision: Number(pricePrecision),
		});

		await authExchange.futuresOrder({
			type: "TAKE_PROFIT_MARKET",
			side: shouldTrade === "LONG" ? "SELL" : "BUY",
			symbol: pair,
			quantity,
			stopPrice: TPPrice,
			reduceOnly: "true",
			recvWindow: 59999,
			newClientOrderId: "DonBotTP-" + pair + "-" + TPPrice,
		});
	}
};
