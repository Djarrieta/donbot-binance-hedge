import Binance, { CandleChartInterval_LT } from "binance-api-node";
import { Candle } from "../models/Candle";
import { Interval } from "../models/Interval";
import { getDate } from "../utils/getDate";

export interface GetCandlestickProps {
	pair: string;
	interval: Interval;
	lookBackLength: number;
}

export const getCandlestick = async ({
	pair,
	interval,
	lookBackLength,
}: GetCandlestickProps) => {
	let candlestick: Candle[] = [];
	const API_LIMIT = 500;
	const exchange = Binance();

	let n = lookBackLength;

	do {
		const startTime = getDate(Date.now() - (n + 1) * interval).dateMs;
		const unformattedCandlestick = await exchange.futuresCandles({
			symbol: pair,
			interval: Interval[interval] as CandleChartInterval_LT,
			startTime,
			limit: Math.min(lookBackLength, API_LIMIT),
		});

		const formattedCandlestick = unformattedCandlestick.map(
			({ close, open, high, low, openTime, volume }) => {
				return {
					close: Number(close),
					open: Number(open),
					high: Number(high),
					low: Number(low),
					openTime: getDate(openTime).date,
					volume: Number(volume),
				};
			}
		);

		const firstCandle = formattedCandlestick.length
			? getDate(formattedCandlestick[0].openTime).dateMs
			: 0;
		const startTimeDiff = Math.abs(startTime - firstCandle) / interval;
		if (startTimeDiff <= 1) {
			candlestick.push(...formattedCandlestick);
		}

		n -= API_LIMIT;
	} while (n > 0);

	return candlestick;
};
