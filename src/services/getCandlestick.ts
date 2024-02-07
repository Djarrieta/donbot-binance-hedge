import Binance, { CandleChartInterval_LT } from "binance-api-node";
import { Candle } from "../models/Candle";
import { Interval } from "../models/Interval";
import { getDate } from "../utils/getDate";

export interface getCandlestickProps {
	pair: string;
	interval: Interval;
	lookBackLength: number;
}

export const getCandlestick: (
	props: getCandlestickProps
) => Promise<Candle[]> = async ({ pair, interval, lookBackLength }) => {
	let candlestick: Candle[] = [];
	const API_LIMIT = 500;
	const exchange = Binance();

	let n = lookBackLength;
	do {
		const newStick: Candle[] = (
			await exchange.futuresCandles({
				symbol: pair,
				interval: Interval[interval] as CandleChartInterval_LT,
				limit: Math.min(lookBackLength, API_LIMIT),
				startTime: Date.now() - (n + 1) * interval,
			})
		).map(({ close, open, high, low, openTime, volume }) => {
			return {
				close: Number(close),
				open: Number(open),
				high: Number(high),
				low: Number(low),
				openTime: getDate(openTime).date,
				volume: Number(volume),
			};
		});
		candlestick.push(...newStick);
		n -= API_LIMIT;
	} while (n > 0);

	return candlestick;
};
