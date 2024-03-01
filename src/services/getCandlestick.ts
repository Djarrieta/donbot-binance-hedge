import Binance, { CandleChartInterval_LT } from "binance-api-node";
import { Candle } from "../models/Candle";
import { Interval } from "../models/Interval";
import { getDate } from "../utils/getDate";

interface GetCandlestickProps {
	pair: string;
	interval: Interval;
	lookBackLength: number;
	apiLimit: number;
}

export const getCandlestick = async ({
	pair,
	interval,
	lookBackLength,
	apiLimit,
}: GetCandlestickProps) => {
	let candlestick: Candle[] = [];

	const exchange = Binance();

	let n = lookBackLength;

	do {
		const startTime = getDate(getDate().dateMs - (n + 1) * interval).dateMs;
		const unformattedCandlestick = await exchange.futuresCandles({
			symbol: pair,
			interval: Interval[interval] as CandleChartInterval_LT,
			startTime,
			limit: Math.min(lookBackLength, apiLimit),
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

		n -= apiLimit;
	} while (n > 0);

	return candlestick;
};
