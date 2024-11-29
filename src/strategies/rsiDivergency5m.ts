import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const rsiDivergency5m = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"LUNA2USDT",
		"LPTUSDT",
		"WLDUSDT",
		"USTCUSDT",
		"ARPAUSDT",
		"XRPUSDT",
		"ROSEUSDT",
		"GMXUSDT",
		"HOOKUSDT",
		"MTLUSDT",
		"XEMUSDT",
		"PHBUSDT",
		"XMRUSDT",
		"ZILUSDT",
		"1000XECUSDT",
		"FETUSDT",
		"ARKMUSDT",
		"LRCUSDT",
		"BLURUSDT",
		"SUIUSDT",
		"ALTUSDT",
		"THETAUSDT",
		"GASUSDT",
		"TNSRUSDT",
		"UMAUSDT",
		"QTUMUSDT",
		"CELOUSDT",
		"IOUSDT",
		"ASTRUSDT",
		"PIXELUSDT",
		"XTZUSDT",
		"RAREUSDT",
		"VOXELUSDT",
		"VIDTUSDT",
		"FLUXUSDT",
		"AERGOUSDT",
		"FIDAUSDT",
		"GHSTUSDT",
		"HMSTRUSDT",
		"COSUSDT",
	],

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

// ┌───┬──────────────────┬────────────────────┬──────────────────────┬─────────────────────┬───────────────────┬───────┐
// │   │ sl tp maxLen     │ positions          │ winRate              │ avPnl               │ accPnl            │ pairs │
// ├───┼──────────────────┼────────────────────┼──────────────────────┼─────────────────────┼───────────────────┼───────┤
// │ 0 │ 2.00% 10.00% 100 │ 36145 3062 379 140 │ 43.31% 43.54% 44.29% │ 0.02% 0.01% 0.01%   │ 0.00% 0.00% 0.00% │ 40    │
// │ 1 │ 1.00% 9.00% 100  │ 36145 3433 564 211 │ 30.06% 30.67% 27.49% │ 0.04% 0.04% -0.00%  │ 0.00% 0.00% 0.00% │ 44    │
// │ 2 │ 2.00% 11.00% 100 │ 36145 3421 416 151 │ 42.44% 41.11% 40.40% │ 0.02% 0.01% -0.01%  │ 0.00% 0.00% 0.00% │ 44    │
// │ 3 │ 2.00% 9.00% 100  │ 36145 3411 396 145 │ 43.30% 42.93% 42.07% │ 0.02% 0.01% -0.02%  │ 0.00% 0.00% 0.00% │ 43    │
// │ 4 │ 1.00% 10.00% 100 │ 36145 3625 555 223 │ 30.23% 30.63% 25.56% │ 0.04% 0.03% -0.03%  │ 0.00% 0.00% 0.00% │ 48    │
// │ 5 │ 1.00% 11.00% 100 │ 36145 3728 558 221 │ 30.20% 30.65% 25.79% │ 0.04% 0.03% -0.03%  │ 0.00% 0.00% 0.00% │ 48    │
// │ 6 │ 3.00% 9.00% 100  │ 36145 1971 305 107 │ 49.52% 48.20% 36.45% │ 0.02% -0.00% -0.05% │ 0.00% 0.00% 0.00% │ 27    │
// │ 7 │ 3.00% 10.00% 100 │ 36145 1856 305 112 │ 49.73% 46.89% 33.93% │ 0.02% -0.00% -0.06% │ 0.00% 0.00% 0.00% │ 26    │
// │ 8 │ 3.00% 11.00% 100 │ 36145 2049 317 121 │ 48.61% 47.00% 30.58% │ 0.02% 0.00% -0.09%  │ 0.00% 0.00% 0.00% │ 28    │
// └───┴──────────────────┴────────────────────┴──────────────────────┴─────────────────────┴───────────────────┴───────┘
