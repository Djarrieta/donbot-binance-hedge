import { rsi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";
import { Interval } from "../models/Interval";

const STG_NAME = "rsiDivergency1h";
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

		const MIN_RSI = 30;
		const CANDLESTICK_SIZE = 50;
		const MIN_VOL = 3 / 100;
		const MAX_VOL = 10 / 100;

		const volatility = getVolatility({ candlestick });
		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			rsiArray[rsiArray.length - 1] <= MIN_RSI &&
			rsiArray[rsiArray.length - 2] <= MIN_RSI &&
			rsiArray[rsiArray.length - 1] > rsiArray[rsiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...rsiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal > MIN_RSI);

			const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
			const secondRange = rsiArray.slice(
				rsiArray.length - CANDLESTICK_SIZE,
				rsiArray.length - firstZeroCrossingIndex
			);

			const firstMin = Math.min(
				...firstRange.map((value) => Number(value) || 0)
			);
			const secondMin = Math.min(
				...secondRange.map((value) => Number(value) || 0)
			);

			if (firstMin !== 0 && secondMin !== 0 && firstMin > secondMin) {
				response.shouldTrade = "LONG";
			}
		}

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			rsiArray[rsiArray.length - 1] >= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 2] >= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 1] < rsiArray[rsiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...rsiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal < 100 - MIN_RSI);

			const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
			const secondRange = rsiArray.slice(
				rsiArray.length - CANDLESTICK_SIZE,
				rsiArray.length - firstZeroCrossingIndex
			);

			const firstMax = Math.max(
				...firstRange.map((value) => Number(value) || 0)
			);
			const secondMax = Math.max(
				...secondRange.map((value) => Number(value) || 0)
			);

			if (firstMax !== 0 && secondMax !== 0 && firstMax < secondMax) {
				response.shouldTrade = "SHORT";
			}
		}

		return response;
	},
};

export default stg;

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ rsiDivergency1h     │
// │             sl │ 1.00%               │
// │             tp │ 1.00%               │
// │      startTime │ 2023 02 15 14:02:16 │
// │        endTime │ 2024 02 10 14:23:56 │
// │       lookBack │ 8640                │
// │       interval │ 1h                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 47.65%              │
// │          avPnl │ -0.10%              │
// │       totalPnl │ -28.90%             │
// │      tradesQty │ 298                 │
// │  avTradeLength │ 7                   │
// └────────────────┴─────────────────────┘

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ rsiDivergency1h     │
// │             sl │ 1.00%               │
// │             tp │ 0.50%               │
// │       lookBack │ 4320                │
// │      startTime │ 2023 08 14 13:17:22 │
// │       interval │ 1h                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 63.49%              │
// │          avPnl │ -0.10%              │
// │       totalPnl │ -18.45%             │
// │      tradesQty │ 189                 │
// │  avTradeLength │ 3                   │
// └────────────────┴─────────────────────┘

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ rsiDivergency1h     │
// │             sl │ 0.50%               │
// │             tp │ 0.50%               │
// │      startTime │ 2023 02 16 10:35:10 │
// │        endTime │ 2024 02 11 10:56:34 │
// │       lookBack │ 8640                │
// │       interval │ 1h                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 48.66%              │
// │          avPnl │ -0.06%              │
// │       totalPnl │ -18.90%             │
// │      tradesQty │ 298                 │
// │  avTradeLength │ 3                   │
// └────────────────┴─────────────────────┘

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ rsiDivergency1h     │
// │             sl │ 1.00%               │
// │             tp │ 2.00%               │
// │      startTime │ 2023 02 18 16:29:41 │
// │        endTime │ 2024 02 13 16:49:28 │
// │       lookBack │ 8640                │
// │       interval │ 1h                  │
// │ maxTradeLength │ 100                 │
// │            fee │ 0.05%               │
// │      avWinRate │ 23.75%              │
// │          avPnl │ -0.34%              │
// │       totalPnl │ -100.23%            │
// │      tradesQty │ 299                 │
// │  avTradeLength │ 13                  │
// └────────────────┴─────────────────────┘

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ rsiDivergency1h     │
// │             sl │ 2.00%               │
// │             tp │ 2.00%               │
// │      startTime │ 2023 02 18 16:52:12 │
// │        endTime │ 2024 02 13 17:11:59 │
// │       lookBack │ 8640                │
// │       interval │ 1h                  │
// │ maxTradeLength │ 100                 │
// │            fee │ 0.05%               │
// │      avWinRate │ 38.46%              │
// │          avPnl │ -0.51%              │
// │       totalPnl │ -151.55%            │
// │      tradesQty │ 299                 │
// │  avTradeLength │ 22                  │
// └────────────────┴─────────────────────┘
