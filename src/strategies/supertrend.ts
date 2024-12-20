import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const rsiDivergency5m = new Strategy({
	stgName: "supertrend",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [],

	validate({ candlestick, pair }) {
		const response: StrategyResponse = {
			positionSide: null,
			stgName: this.stgName,
			pair,
		};

		if (candlestick.length < this.lookBackLength) return response;
		if (this.allowedPairs?.length && !this.allowedPairs.includes(pair))
			return response;

		const MIN_RSI = 30;

		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		if (rsiArray[rsiArray.length - 1] <= MIN_RSI) {
			response.positionSide = "LONG";
			response.sl = 1 / 100; // Optionally calculate and set the stop loss
			response.tp = 1 / 100; // Optionally calculate and set the take profit
		}

		if (rsiArray[rsiArray.length - 1] >= MIN_RSI) {
			response.positionSide = "SHORT";
			response.sl = 1 / 100; // Optionally calculate and set the stop loss
			response.tp = 1 / 100; // Optionally calculate and set the take profit
		}

		return response;
	},
});
