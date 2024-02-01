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

		const MIN_VOL = 5 / 100;
		const MIN_RSI = 60;

		const volatility = getVolatility({ candlestick });
		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });
		const emaArray = EMA.calculate({ period: 100, values: closePrices });
		const currentPrice = candlestick[candlestick.length - 1].close;

		if (
			volatility >= MIN_VOL &&
			rsiArray[rsiArray.length - 1] <= MIN_RSI &&
			emaArray[emaArray.length - 1] > currentPrice
		) {
			response.shouldTrade = "LONG";
		}
		if (
			volatility >= MIN_VOL &&
			rsiArray[rsiArray.length - 1] >= 100 - MIN_RSI &&
			emaArray[emaArray.length - 1] < currentPrice
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
// │        stgName │ rsiTest             │
// │             sl │ 0.50%               │
// │             tp │ 0.50%               │
// │       lookBack │ 1440                │
// │      startTime │ 2024 01 31 16:05:28 │
// │       interval │ 1m                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 50.92%              │
// │          avPnl │ -0.04%              │
// │       totalPnl │ -575.04%            │
// │      tradesQty │ 14094               │
// │  avTradeLength │ 7                   │
// └────────────────┴─────────────────────┘
