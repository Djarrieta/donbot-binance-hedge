import { mfi } from "technicalindicators";
import { Strategy, StrategyResponse } from "../models/Strategy";
import { Context } from "../models/Context";
import { getVolatility } from "../services/getSymbolList";
import { Interval } from "../models/Interval";

const STG_NAME = "mfiDivergency1h";
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

		const MIN_MFI = 20;
		const CANDLESTICK_SIZE = 50;
		const MIN_VOL = 3 / 100;
		const MAX_VOL = 10 / 100;

		const volatility = getVolatility({ candlestick });
		const mfiArray = mfi({
			high: candlestick.map((item) => item.high),
			low: candlestick.map((item) => item.low),
			close: candlestick.map((item) => item.close),
			volume: candlestick.map((item) => item.volume),
			period: 14,
		});

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			mfiArray[mfiArray.length - 1] <= MIN_MFI &&
			mfiArray[mfiArray.length - 2] <= MIN_MFI &&
			mfiArray[mfiArray.length - 1] > mfiArray[mfiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...mfiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal > MIN_MFI);

			const firstRange = mfiArray.slice(-firstZeroCrossingIndex);
			const secondRange = mfiArray.slice(
				mfiArray.length - CANDLESTICK_SIZE,
				mfiArray.length - firstZeroCrossingIndex
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
			mfiArray[mfiArray.length - 1] >= 100 - MIN_MFI &&
			mfiArray[mfiArray.length - 2] >= 100 - MIN_MFI &&
			mfiArray[mfiArray.length - 1] < mfiArray[mfiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...mfiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal < 100 - MIN_MFI);

			const firstRange = mfiArray.slice(-firstZeroCrossingIndex);
			const secondRange = mfiArray.slice(
				mfiArray.length - CANDLESTICK_SIZE,
				mfiArray.length - firstZeroCrossingIndex
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
// │        stgName │ mfiDivergency1h     │
// │             sl │ 1.00%               │
// │             tp │ 1.00%               │
// │      startTime │ 2023 02 15 14:23:56 │
// │        endTime │ 2024 02 10 14:45:59 │
// │       lookBack │ 8640                │
// │       interval │ 1h                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 49.55%              │
// │          avPnl │ -0.06%              │
// │       totalPnl │ -27.03%             │
// │      tradesQty │ 448                 │
// │  avTradeLength │ 15                  │
// └────────────────┴─────────────────────┘

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ mfiDivergency1h     │
// │             sl │ 1.00%               │
// │             tp │ 0.50%               │
// │       lookBack │ 4320                │
// │      startTime │ 2023 08 14 13:28:17 │
// │       interval │ 1h                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 63.37%              │
// │          avPnl │ -0.10%              │
// │       totalPnl │ -26.90%             │
// │      tradesQty │ 273                 │
// │  avTradeLength │ 13                  │
// └────────────────┴─────────────────────┘

// ┌────────────────┬─────────────────────┐
// │                │ Values              │
// ├────────────────┼─────────────────────┤
// │        stgName │ mfiDivergency1h     │
// │             sl │ 0.50%               │
// │             tp │ 0.50%               │
// │      startTime │ 2023 02 16 10:56:34 │
// │        endTime │ 2024 02 11 11:17:45 │
// │       lookBack │ 8640                │
// │       interval │ 1h                  │
// │ maxTradeLength │ 1000                │
// │            fee │ 0.05%               │
// │      avWinRate │ 47.70%              │
// │          avPnl │ -0.07%              │
// │       totalPnl │ -33.74%             │
// │      tradesQty │ 457                 │
// │  avTradeLength │ 5                   │
// └────────────────┴─────────────────────┘
