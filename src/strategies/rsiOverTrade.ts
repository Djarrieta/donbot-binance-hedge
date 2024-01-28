import { rsi } from "technicalindicators";
import { Context } from "../models/Context";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { getVolatility } from "../services/getSymbolList";

const stg: Strategy = {
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultTP,
			tp: Context.defaultTP,
			stgName: "rsiOverTrade",
		};

		if (candlestick.length < Context.interval) return response;
		const MIN_VOL = 10 / 100;
		const MIN_RSI = 30;

		const volatility = getVolatility({ candlestick });
		const prices = candlestick.map((candle) => candle.close);
		const rsi8 = rsi({ period: 8, values: prices });
		const rsi200 = rsi({ period: 200, values: prices });

		if (
			volatility > MIN_VOL &&
			rsi8[rsi8.length - 2] <= 100 - MIN_RSI &&
			rsi8[rsi8.length - 1] > 100 - MIN_RSI &&
			rsi200[rsi200.length - 1] < 50
		) {
			response.shouldTrade = "LONG";
		}

		if (
			volatility > MIN_VOL &&
			rsi8[rsi8.length - 2] >= MIN_RSI &&
			rsi8[rsi8.length - 1] < MIN_RSI &&
			rsi200[rsi200.length - 1] < 50
		) {
			response.shouldTrade = "SHORT";
		}

		return response;
	},
};

export default stg;
