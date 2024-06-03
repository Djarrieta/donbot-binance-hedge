import { type CandleChartInterval_LT } from "binance-api-node";
import OldBinance from "node-binance-api";
import { Interval } from "../../models/Interval";
import { Context } from "../../Context";
import { getDate } from "../../utils/getDate";

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
	if (!context) return;
	const symbol = context.symbolList.find((s) => s.pair === data.s);
	if (!symbol) return;

	if (!data.k.x) {
		context.updateSymbol({ pair: data.s, currentPrice: data.k.c });
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
	const currentCandlestick = symbol.candlestick;
	const newCandlestick = [...currentCandlestick.slice(1), newCandle];
	context.updateSymbol({
		pair: data.s,
		candlestick: newCandlestick,
	});
};
