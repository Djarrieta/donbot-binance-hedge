import { rsi } from "technicalindicators";
import { Context } from "../models/Context";
import { Interval } from "../models/Interval";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { getVolatility } from "../services/getSymbolList";

const stg: Strategy = {
	lookBackLength: Interval["1d"] / Interval["5m"],
	interval: Interval["5m"],
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultTP,
			tp: Context.defaultTP,
			stgName: "rsiOverTrade",
		};

		if (candlestick.length < Interval["1d"] / Interval["5m"]) return response;
		const MIN_VOL = 10 / 100;
		const volatility = getVolatility({ candlestick });

		const prices = candlestick.map((candle) => candle.close);

		const rsi8 = rsi({ period: 8, values: prices });
		const rsi200 = rsi({ period: 200, values: prices });

		const overboughtRsi = 70;
		const middleRsi = 50;
		const areRsiOverbought =
			rsi8[rsi8.length - 2] <= overboughtRsi &&
			rsi8[rsi8.length - 1] > overboughtRsi &&
			rsi200[rsi200.length - 1] < middleRsi;

		if (volatility > MIN_VOL && areRsiOverbought) {
			response.shouldTrade = "LONG";
		}

		const oversoldRsi = 30;
		const areRsiOversold =
			rsi8[rsi8.length - 2] >= oversoldRsi &&
			rsi8[rsi8.length - 1] < oversoldRsi &&
			rsi200[rsi200.length - 1] > middleRsi;

		if (volatility > MIN_VOL && areRsiOversold) {
			response.shouldTrade = "SHORT";
		}

		return response;
	},
};

export default stg;

// {
// 	strategy: "trendWithEma8",
// 	sl: "1.00%",
// 	tp: "10.00%",
// 	backTestLookBackDays: 30,
// 	lookBackLength: 8640,
// 	startTime: "2023 12 16 15:28:17",
// 	interval: "5m",
// 	maxTradeLength: 1000,
// 	fee: "0.05%",
// 	avWinRate: "11.07%",
// 	avPnl: "0.11%",
// 	totalPnl: "1860.26%",
// 	tradesQty: 17612,
// 	avTradeLength: 94,
//   }
