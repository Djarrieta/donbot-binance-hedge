import { rsi, EMA } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "emaTrend";
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair }) => {
		const lastOpen = candlestick[candlestick.length - 1].openTime;
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultSL,
			tp: Context.defaultTP, // undefined to have dynamic tp with quitCriteria
			stgName: STG_NAME,
		};

		if (candlestick.length < Context.lookBackLength) return response;

		const MIN_VOL = 2 / 100;
		const MAX_VOL = 10 / 100;
		const MIN_AV_DIFF = 0.5 / 100;

		const closePrices = candlestick.map((candle) => candle.close);
		const ema20Array = EMA.calculate({ period: 20, values: closePrices });
		const ema200Array = EMA.calculate({ period: 200, values: closePrices });
		const rsiArray = rsi({ period: 14, values: closePrices });
		const volatility = getVolatility({ candlestick });

		const currentPrice = candlestick[candlestick.length - 1].close;

		const ema200DiffPt =
			(currentPrice - ema200Array[ema200Array.length - 1]) / currentPrice;
		const average =
			candlestick
				.map((c) => c.close + c.high + c.low + c.open)
				.reduce((acc, val) => acc + val, 0) /
			candlestick.length /
			4;

		const avDiff = (currentPrice - average) / currentPrice;

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			currentPrice < ema20Array[ema20Array.length - 1] &&
			rsiArray[rsiArray.length - 1] > rsiArray[rsiArray.length - 2] &&
			avDiff > MIN_AV_DIFF / 100 &&
			currentPrice > average
		) {
			response.shouldTrade = "LONG";
		}

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			currentPrice > ema20Array[ema20Array.length - 1] &&
			rsiArray[rsiArray.length - 1] < rsiArray[rsiArray.length - 2] &&
			avDiff < -MIN_AV_DIFF / 100 &&
			currentPrice < average
		) {
			response.shouldTrade = "SHORT";
		}

		return response;
	},
};

export default stg;
// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ emaTrend            │
// │             sl │ 1.00%               │
// │             tp │ 1.00%               │
// │       lookBack │ 576                 │
// │      startTime │ 2024 02 01 13:02:42 │
// │       interval │ 5m                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 43.99%              │
// │          avPnl │ -0.12%              │
// │       totalPnl │ -971.40%            │
// │      tradesQty │ 7948                │
// │  avTradeLength │ 46                  │
// └────────────────┴─────────────────────┘
