import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { User } from "../models/User";
import { fixPrecision } from "../utils/fixPrecision";

export const openPosition = async ({
	user,
	symbol,
	shouldTrade,
	sl,
	tp,
	tr,
	callback,
}: {
	user: User;
	symbol: Symbol;
	shouldTrade: PositionSide;
	sl: number;
	tp: number;
	tr?: number;
	callback?: number;
}) => {
	const context = await Context.getInstance();

	if (
		user.isAddingPosition ||
		Number(user.openPositions?.length) >= Context.maxOpenPos ||
		user.openPositions?.map((p) => p.pair).includes(symbol.pair)
	) {
		console.log(symbol.pair + ": Skip " + user.text);
		return;
	}

	console.log("Open  position for " + user.name + " in " + symbol.pair);

	const userIndex = context.userList.findIndex((u) => u.id === user.id);
	context.userList[userIndex].isAddingPosition = true;

	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	let quantityNumber =
		Math.max(
			1.1 * Context.minAmountToTrade,
			user.balanceUSDT * Context.amountToTradePt
		) / symbol.currentPrice;

	const quantity = fixPrecision({
		value: quantityNumber,
		precision: symbol.quantityPrecision,
	});

	const SLPriceNumber =
		shouldTrade === "LONG"
			? symbol.currentPrice * (1 - sl)
			: symbol.currentPrice * (1 + sl);

	const SLPrice = fixPrecision({
		value: SLPriceNumber,
		precision: symbol.pricePrecision,
	});

	try {
		await authExchange.futuresCancelAllOpenOrders({ symbol: symbol.pair });

		const slOrderResponse = await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: shouldTrade === "LONG" ? "SELL" : "BUY",
			positionSide: shouldTrade === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: SLPrice,
			recvWindow: 59999,
			newClientOrderId: "HE-" + symbol.pair + "-" + SLPrice,
			timeInForce: "GTC",
			newOrderRespType: "FULL",
		});
		console.log({ slOrder: slOrderResponse });

		if (tp) {
			const TPPriceNumber =
				shouldTrade === "LONG"
					? symbol.currentPrice * (1 + tp)
					: symbol.currentPrice * (1 - tp);

			const TPPrice = fixPrecision({
				value: TPPriceNumber,
				precision: symbol.pricePrecision,
			});

			const tpOrderResponse = await authExchange.futuresOrder({
				type: "TAKE_PROFIT_MARKET",
				side: shouldTrade === "LONG" ? "SELL" : "BUY",
				positionSide: shouldTrade,
				symbol: symbol.pair,
				quantity,
				stopPrice: TPPrice,
				recvWindow: 59999,
				newClientOrderId: "TP-" + symbol.pair + "-" + TPPrice,
				newOrderRespType: "FULL",
			});
			console.log({ tpOrderResponse });
		}
		const PosOrderResponse = await authExchange.futuresOrder({
			type: "MARKET",
			side: shouldTrade === "LONG" ? "BUY" : "SELL",
			positionSide: shouldTrade,
			symbol: symbol.pair,
			quantity,
			recvWindow: 59999,
			newClientOrderId: "PS-" + symbol.pair,
			newOrderRespType: "FULL",
		});
		console.log({ PosOrderResponse });
	} catch (e) {
		console.log(
			"Problem opening position for " + user.name + " in " + symbol.pair
		);
		console.log(e);
	}
};
