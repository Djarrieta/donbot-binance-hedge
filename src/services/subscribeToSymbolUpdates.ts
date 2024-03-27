import { CandleChartInterval_LT } from "binance-api-node";
import OldBinance from "node-binance-api";
import { Context } from "../models/Context";
import { Interval } from "../models/Interval";
import { getDate } from "../utils/getDate";

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
};
