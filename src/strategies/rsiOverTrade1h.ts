import { rsi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Interval } from "../models/Interval";

import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "rsiOverTrade1h";
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: Context.lookBackLength,
	interval: Interval["1h"],
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultSL,
			tp: Context.defaultTP,
			stgName: STG_NAME,
		};

		if (candlestick.length < Context.lookBackLength) return response;

		const MIN_VOL = 3 / 100;
		const MAX_VOL = 30 / 100;

		const MIN_RSI = 30;

		const volatility = getVolatility({ candlestick });
		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		if (
			volatility >= MIN_VOL &&
			volatility <= MAX_VOL &&
			rsiArray[rsiArray.length - 1] >= MIN_RSI &&
			rsiArray[rsiArray.length - 3] < MIN_RSI &&
			rsiArray[rsiArray.length - 4] < MIN_RSI &&
			rsiArray[rsiArray.length - 5] < MIN_RSI
		) {
			response.shouldTrade = "SHORT";
		}
		if (
			volatility >= MIN_VOL &&
			volatility <= MAX_VOL &&
			rsiArray[rsiArray.length - 1] <= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 3] > 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 4] > 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 5] > 100 - MIN_RSI
		) {
			response.shouldTrade = "LONG";
		}

		return response;
	},
};

export default stg;

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ rsiOverTrade1h      │
// │             sl │ 1.00%               │
// │             tp │ 1.00%               │
// │      startTime │ 2023 02 18 12:01:40 │
// │        endTime │ 2024 02 13 12:23:01 │
// │       lookBack │ 8640                │
// │       interval │ 1h                  │
// │ maxTradeLength │ 100                 │
// │            fee │ 0.05%               │
// │      avWinRate │ 51.44%              │
// │          avPnl │ -0.02%              │
// │       totalPnl │ -379.79%            │
// │      tradesQty │ 17923               │
// │  avTradeLength │ 4                   │
// └────────────────┴─────────────────────┘
