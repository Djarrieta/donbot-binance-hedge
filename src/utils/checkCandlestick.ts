import { Candle } from "../models/Candle";
import { Interval } from "../models/Interval";
import { getDate } from "./getDate";

export const checkCandlestick = ({
	candlestick,
	interval,
}: {
	candlestick: Candle[];
	interval: Interval;
}) => {
	if (!candlestick.length) return false;

	const lastOpenTime = candlestick[candlestick.length - 1].openTime;
	const lastDiff = (getDate().dateMs - getDate(lastOpenTime).dateMs) / interval;

	if (lastDiff > 2) return false;

	for (let index = 0; index < candlestick.length - 1; index++) {
		const currentCandle = candlestick[index];
		const nextCandle = candlestick[index + 1];

		const candlesDifference =
			(getDate(nextCandle.openTime).dateMs -
				getDate(currentCandle.openTime).dateMs) /
			interval;

		if (candlesDifference !== 1) return false;
	}

	return true;
};
