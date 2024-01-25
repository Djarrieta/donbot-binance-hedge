import { EMA } from "technicalindicators";
import { Context } from "../models/Context";
import { QuitStrategy, QuitStrategyResponse } from "../models/QuitStrategy";

const stg: QuitStrategy = {
	name: "touchEma8",
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair, side }) => {
		const response: QuitStrategyResponse = {
			shouldQuit: false,
		};

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
