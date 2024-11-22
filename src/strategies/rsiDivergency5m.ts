import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const rsiDivergency5m = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [],

	validate({ candlestick, pair }) {
		const response: StrategyResponse = {
			positionSide: null,
			stgName: this.stgName,
			pair,
		};

		if (candlestick.length < this.lookBackLength) return response;
		if (this.allowedPairs?.length && !this.allowedPairs.includes(pair))
			return response;

		const MIN_RSI = 30;
		const CANDLESTICK_SIZE = 50;

		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

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
});

// ┌───┬──────────────────┬────────────────────┬──────────────────────┬────────────────────┬───────────────────┬───────┐
// │   │ sl tp maxLen     │ positions          │ winRate              │ avPnl              │ accPnl            │ pairs │
// ├───┼──────────────────┼────────────────────┼──────────────────────┼────────────────────┼───────────────────┼───────┤
// │ 0 │ 1.00% 10.00% 100 │ 15403 4350 266 134 │ 34.30% 31.20% 13.43% │ 0.14% 0.10% -0.22% │ 0.00% 0.00% 0.00% │ 113   │
// └───┴──────────────────┴────────────────────┴──────────────────────┴────────────────────┴───────────────────┴───────┘

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
// └───┴────────┴────────┴───────────┴───────────┴─────────────┴──────────────┴──────────────┴───────────┴────────────┴────────────┴─────────┴──────────┴──────────┴──────────────┘
