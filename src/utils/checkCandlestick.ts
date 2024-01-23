import { Candle } from "../models/Candle";
import { Context } from "../models/Context";
import { getDate } from "./getDate";

export const checkCandlestick = ({
	candlestick,
}: {
	candlestick: Candle[];
}) => {
	const lastOpenTime = candlestick[candlestick.length - 1].openTime;
	const lastDiff =
		(getDate({}).dateMs - getDate({ date: lastOpenTime }).dateMs) /
		Context.interval;

	if (lastDiff > 2) {
		return false;
	}

	for (let index = 0; index < candlestick.length - 1; index++) {
		const currentCandle = candlestick[index];
		const nextCandle = candlestick[index + 1];

		const candlesDifference =
			(getDate({ date: nextCandle.openTime }).dateMs -
				getDate({ date: currentCandle.openTime }).dateMs) /
			Context.interval;

		if (candlesDifference !== 1) {
			return false;
		}
	}

	return true;
};
