import { rsi, EMA } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "rsiOverTradeBack";
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: Context.lookBackLength,
	interval: Context.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			shouldTrade: null,
			sl: Context.defaultSL,
			tp: Context.defaultTP,
			stgName: STG_NAME,
		};

		if (candlestick.length < Context.lookBackLength) return response;

		const MIN_VOL = 5 / 100;
		const MIN_RSI = 30;

		const volatility = getVolatility({ candlestick });
		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		if (
			volatility >= MIN_VOL &&
			rsiArray[rsiArray.length - 1] < 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 2] > 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 3] > MIN_RSI
		) {
			response.shouldTrade = "SHORT";
		}
		if (
			volatility >= MIN_VOL &&
			rsiArray[rsiArray.length - 1] > MIN_RSI &&
			rsiArray[rsiArray.length - 2] < MIN_RSI &&
			rsiArray[rsiArray.length - 3] < MIN_RSI
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
// │        stgName │ rsiOverTradeBack    │
// │             sl │ 0.50%               │
// │             tp │ 0.50%               │
// │       lookBack │ 1440                │
// │      startTime │ 2024 01 31 17:29:39 │
// │       interval │ 1m                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 57.99%              │
// │          avPnl │ 0.03%               │
// │       totalPnl │ 6.55%               │
// │      tradesQty │ 219                 │
// │  avTradeLength │ 6                   │
// └────────────────┴─────────────────────┘
