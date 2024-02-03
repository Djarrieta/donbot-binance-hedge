import { rsi, EMA } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "rsiOverTrade";
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

		const MIN_VOL = 3 / 100;
		const MAX_VOL = 10 / 100;

		const MIN_RSI = 40;

		const volatility = getVolatility({ candlestick });
		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });
		const emaArray = EMA.calculate({ period: 200, values: closePrices });
		const currentPrice = candlestick[candlestick.length - 1].close;

		const average =
			candlestick
				.map((c) => c.close + c.high + c.low + c.open)
				.reduce((acc, val) => acc + val, 0) /
			candlestick.length /
			4;

		const avDiff = (currentPrice - average) / currentPrice;

		if (
			volatility >= MIN_VOL &&
			volatility <= MAX_VOL &&
			rsiArray[rsiArray.length - 1] >= MIN_RSI &&
			rsiArray[rsiArray.length - 2] < MIN_RSI
		) {
			response.shouldTrade = "LONG";
		}
		if (
			volatility >= MIN_VOL &&
			volatility <= MAX_VOL &&
			rsiArray[rsiArray.length - 1] <= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 2] > 100 - MIN_RSI
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
// │        stgName │ rsiOverTrade        │
// │             sl │ 0.50%               │
// │             tp │ 0.50%               │
// │       lookBack │ 1440                │
// │      startTime │ 2024 02 02 18:11:05 │
// │       interval │ 1m                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 47.13%              │
// │          avPnl │ -0.08%              │
// │       totalPnl │ -48.79%             │
// │      tradesQty │ 628                 │
// │  avTradeLength │ 10                  │
// └────────────────┴─────────────────────┘
