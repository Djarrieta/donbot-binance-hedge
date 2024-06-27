import type { Candle } from "../sharedModels/Candle";

export const getVolatility = ({ candlestick }: { candlestick: Candle[] }) => {
	if (!candlestick?.length || !candlestick[candlestick.length - 1].close)
		return 0;

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
