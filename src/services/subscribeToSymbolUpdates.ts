import Binance from "binance-api-node";
import OldBinance from "node-binance-api";
import { CandleChartInterval_LT } from "binance-api-node";
import { Interval } from "../models/Interval";
import { Context } from "../models/Context";
import { getDate } from "../utils/getDate";
import { fixPrecision } from "../utils/fixPrecision";
import { ORDER_ID_DIV, OrderType } from "../models/Order";

export const subscribeToSymbolUpdates = async ({
	pair,
	interval,
}: {
	pair: string;
	interval: Interval;
}) => {
	const exchange = new OldBinance();
	const intervalText = Interval[interval] as CandleChartInterval_LT;

	exchange.futuresSubscribe(
		pair.toLocaleLowerCase() + "@kline_" + intervalText,
		handleSymbolUpdate
	);
};

const handleSymbolUpdate = async (data: any) => {
	const context = await Context.getInstance();
	const symbolIndex = context.symbolList.findIndex((s) => s.pair === data.s);

	if (symbolIndex === -1) return;
	const symbol = context.symbolList[symbolIndex];

	if (!symbol.candlestick.length) {
		return;
	}

	const prevOpenTime = getDate(
		symbol.candlestick[symbol.candlestick.length - 1].openTime
	).dateString;
	const newOpenTime = getDate(Number(data.k.t)).dateString;

	if (!data.k.x || newOpenTime === prevOpenTime) {
		context.symbolList[symbolIndex].currentPrice = Number(data.k.c);
		context.symbolList[symbolIndex].isLoading = false;

		return;
	}

	const newCandle = {
		open: Number(data.k.o),
		high: Number(data.k.h),
		close: Number(data.k.c),
		low: Number(data.k.l),
		openTime: getDate(Number(data.k.t)).date,
		volume: Number(data.k.v),
	};

	const currentCandlestick = context.symbolList[symbolIndex].candlestick;
	const newCandlestick = [...currentCandlestick.slice(1), newCandle];

	context.symbolList[symbolIndex].candlestick = newCandlestick;
	context.symbolList[symbolIndex].isReady = true;

	for (let userIndex = 0; userIndex < context.userList.length; userIndex++) {
		const user = context.userList[userIndex];

		for (let posIndex = 0; posIndex < user.openPositions.length; posIndex++) {
			const pos = user.openPositions[posIndex];

			if (pos.status !== "PROTECTED" || pos.pair !== data.s) continue;

			const currentPrice = newCandlestick[newCandlestick.length - 1].close;

			const pnlGraph =
				pos.positionSide === "LONG"
					? (currentPrice - pos.entryPriceUSDT) / pos.entryPriceUSDT
					: (pos.entryPriceUSDT - currentPrice) / pos.entryPriceUSDT;

			if (pnlGraph >= Context.defaultSC) {
				context.userList[userIndex].openPositions[posIndex].status ===
					"SECURED";

				const SCPriceNumber =
					pos.positionSide === "LONG"
						? pos.entryPriceUSDT * (1 + Context.defaultSC)
						: pos.entryPriceUSDT * (1 - Context.defaultSC);

				const SCPrice = fixPrecision({
					value: SCPriceNumber,
					precision: symbol.pricePrecision,
				});

				const authExchange = Binance({
					apiKey: user.key,
					apiSecret: user.secret || "",
				});

				authExchange.futuresOrder({
					type: "STOP_MARKET",
					side: pos.positionSide === "LONG" ? "BUY" : "SELL",
					positionSide: pos.positionSide === "LONG" ? "SHORT" : "LONG",
					symbol: symbol.pair,
					quantity: pos.coinQuantity,
					stopPrice: SCPrice,
					recvWindow: 59999,
					newClientOrderId: OrderType.SECURE + ORDER_ID_DIV + SCPrice,
					timeInForce: "GTC",
				});
			}

			pos.entryPriceUSDT;
		}
	}
};
