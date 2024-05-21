import type { Candle } from "../models/Candle";

export const getVolatility = ({ candlestick }: { candlestick: Candle[] }) => {
	const { close: lastPrice } = candlestick[candlestick.length - 1];

	const array = [
		...candlestick.map((c) => c.high),
		...candlestick.map((c) => c.low),
	];

	const max = Math.max(...array);
	const min = Math.min(...array);

	const volatility = (max - min) / lastPrice;
	return volatility;
};
