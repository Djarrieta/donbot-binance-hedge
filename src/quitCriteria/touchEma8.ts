import { Interval } from "../models/Interval";
import { QuitStrategy, QuitStrategyResponse } from "../models/QuitStrategy";
import { rsi, EMA } from "technicalindicators";

const stg: QuitStrategy = {
	name: "touchEma8",
	lookBackLength: Interval["1d"] / Interval["5m"],
	interval: Interval["5m"],
	validate: ({ candlestick, pair, side }) => {
		const response: QuitStrategyResponse = {
			shouldQuit: false,
		};

		if (candlestick.length < Interval["1d"] / Interval["5m"]) return response;

		const ema5Array = EMA.calculate({
			period: 5,
			values: candlestick.map((candle) => candle.close),
		});
		const ema8Array = EMA.calculate({
			period: 8,
			values: candlestick.map((candle) => candle.close),
		});

		if (
			side === "LONG" &&
			ema5Array[ema5Array.length - 1] < ema8Array[ema8Array.length - 1]
		) {
			response.shouldQuit = true;
		}
		if (
			side === "SHORT" &&
			ema5Array[ema5Array.length - 1] > ema8Array[ema8Array.length - 1]
		) {
			response.shouldQuit = true;
		}

		return response;
	},
};

export default stg;
