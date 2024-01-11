import Binance from "node-binance-api";
import { CandleChartInterval_LT } from "binance-api-node";
import { Interval } from "../models/Interval";
import { Context } from "../models/Context";

export const updateSymbolList = async ({
	pair,
	interval,
}: {
	pair: string;
	interval: Interval;
}) => {
	const exchange = new Binance();
	const intervalText = Interval[interval] as CandleChartInterval_LT;

	exchange.futuresSubscribe(
		pair.toLocaleLowerCase() + "@kline_" + intervalText,
		handleSymbolUpdate
	);
};

const handleSymbolUpdate = async (data: any) => {
	const context = await Context.getInstance();
	const symbolIndex = context.symbolList.findIndex((s) => s.pair === data.s);
	context.symbolList[symbolIndex] = {
		...context.symbolList[symbolIndex],
		currentPrice: Number(data.k.c),
	};
};
