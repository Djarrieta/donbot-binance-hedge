import { rsi, EMA } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";

const STG_NAME = "emaTrend5m";
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

		const MIN_RSI = 30;
		const MIN_VOL = 10 / 100;
		const MAX_VOL = 30 / 100;

		const closePrices = candlestick.map((candle) => candle.close);
		const ema20Array = EMA.calculate({ period: 20, values: closePrices });
		const ema200Array = EMA.calculate({ period: 200, values: closePrices });
		const rsiArray = rsi({ period: 14, values: closePrices });

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		const { close: lastPrice } = candlestick[candlestick.length - 1];

		const volatility = getVolatility({ candlestick });

		const ema200DiffPt =
			(lastPrice - ema200Array[ema200Array.length - 1]) / lastPrice;

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			ema200DiffPt < 1 / 100 &&
			ema200DiffPt > 0 &&
			lastPrice < ema20Array[ema20Array.length - 1] &&
			rsiArray[rsiArray.length - 1] < MIN_RSI &&
			rsiArray[rsiArray.length - 2] < rsiArray[rsiArray.length - 1]
		) {
			response.shouldTrade = "LONG";
		}

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			ema200DiffPt > -1 / 100 &&
			ema200DiffPt < 0 &&
			lastPrice < ema200Array[ema200Array.length - 1] &&
			lastPrice > ema20Array[ema20Array.length - 1] &&
			rsiArray[rsiArray.length - 1] > 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 2] > rsiArray[rsiArray.length - 1]
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
// │        stgName │ emaTrend5m          │
// │             sl │ 5.00%               │
// │             tp │ 1.00%               │
// │      startTime │ 2023 12 24 17:44:01 │
// │        endTime │ 2024 02 22 18:29:44 │
// │       lookBack │ 17280               │
// │       interval │ 5m                  │
// │ maxTradeLength │ 200                 │
// │            fee │ 0.05%               │
// │      avWinRate │ 80.34%              │
// │          avPnl │ 0.08%               │
// │       totalPnl │ 37.00%              │
// │      tradesQty │ 473                 │
// │  avTradeLength │ 46                  │
// └────────────────┴─────────────────────┘
