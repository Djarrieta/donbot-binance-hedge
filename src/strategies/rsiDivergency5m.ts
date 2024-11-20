import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"1000BONKUSDT",
	"STXUSDT",
	"ATOMUSDT",
	"KASUSDT",
	"BIGTIMEUSDT",
	"FLMUSDT",
	"EDUUSDT",
	"TLMUSDT",
	"SXPUSDT",
	"ZILUSDT",
	"1000SHIBUSDT",
	"1000FLOKIUSDT",
	"SNXUSDT",
	"TUSDT",
	"KAVAUSDT",
	"CRVUSDT",
	"KSMUSDT",
	"WAXPUSDT",
	"INJUSDT",
	"XTZUSDT",
	"FILUSDT",
	"CAKEUSDT",
	"POWRUSDT",
	"XAIUSDT",
	"ICXUSDT",
	"1000LUNCUSDT",
	"HIFIUSDT",
	"ZETAUSDT",
	"EOSUSDT",
	"PORTALUSDT",
	"IOUSDT",
	"RENDERUSDT",
];
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: params.lookBackLength,
	interval: params.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: params.defaultSL,
			tp: params.defaultTP,
			stgName: STG_NAME,
			pair,
		};

		if (candlestick.length < params.lookBackLength) return response;
		if (ALLOWED_PAIRS.length && !ALLOWED_PAIRS.includes(pair)) return response;

		const MIN_RSI = 30;
		const CANDLESTICK_SIZE = 50;
		const MIN_VOL = 10 / 100;
		const MAX_VOL = 25 / 100;

		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		const volatility = getVolatility({ candlestick });

		if (
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
				response.positionSide = "LONG";
			}
		}

		if (
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
				response.positionSide = "SHORT";
			}
		}

		return response;
	},
};

export default stg;

// ┌───┬────────┬────────┬───────────┬───────────┬─────────────┬──────────────┬──────────────┬───────────┬────────────┬────────────┬─────────┬──────────┬──────────┬──────────────┐
// │   │ sl     │ tp     │ maxLength │ positions │ positionsWP │ positionsAcc │ positionsFwd │ winRateWP │ winRateAcc │ winRateFwd │ avPnlWP │ avPnlAcc │ avPnlFwd │ winningPairs │
// ├───┼────────┼────────┼───────────┼───────────┼─────────────┼──────────────┼──────────────┼───────────┼────────────┼────────────┼─────────┼──────────┼──────────┼──────────────┤
// │ 0 │ 1.00%  │ 1.00%  │ 200       │ 58039     │ 4370        │ 1423         │ 534          │ 57.14%    │ 55.31%     │ 49.06%     │ 0.02%   │ 0.00%    │ -0.06%   │ 32           │
// │ 1 │ 1.00%  │ 1.00%  │ 100       │ 58039     │ 4154        │ 1397         │ 535          │ 57.05%    │ 55.62%     │ 49.72%     │ 0.02%   │ 0.01%    │ -0.05%   │ 29           │
// │ 2 │ 1.00%  │ 10.00% │ 200       │ 58039     │ 12382       │ 799          │ 307          │ 22.28%    │ 21.90%     │ 20.52%     │ 0.09%   │ 0.07%    │ -0.05%   │ 79           │
// │ 3 │ 1.00%  │ 10.00% │ 100       │ 58039     │ 8723        │ 1066         │ 390          │ 28.87%    │ 27.95%     │ 33.08%     │ 0.06%   │ 0.06%    │ 0.04%    │ 58           │
// │ 4 │ 10.00% │ 1.00%  │ 200       │ 58039     │ 2189        │ 560          │ 225          │ 49.70%    │ 49.11%     │ 40.44%     │ 0.01%   │ 0.02%    │ -0.04%   │ 16           │
// │ 5 │ 10.00% │ 1.00%  │ 100       │ 58039     │ 645         │ 315          │ 155          │ 49.46%    │ 50.16%     │ 43.87%     │ 0.02%   │ 0.00%    │ -0.01%   │ 5            │
// │ 6 │ 10.00% │ 10.00% │ 200       │ 58039     │ 1491        │ 244          │ 103          │ 51.44%    │ 49.59%     │ 33.98%     │ 0.01%   │ 0.00%    │ -0.08%   │ 11           │
// │ 7 │ 10.00% │ 10.00% │ 100       │ 58039     │ 251         │ 134          │ 63           │ 51.79%    │ 48.51%     │ 50.79%     │ 0.01%   │ -0.02%   │ -0.02%   │ 2            │
