import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const rsiDivergency5m = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"ALTUSDT",
		"TNSRUSDT",
		"ARPAUSDT",
		"SUIUSDT",
		"WLDUSDT",
		"LPTUSDT",
		"FETUSDT",
		"UMAUSDT",
		"ARKMUSDT",
		"XRPUSDT",
		"CELOUSDT",
		"HOOKUSDT",
		"BLURUSDT",
		"LRCUSDT",
		"GMXUSDT",
		"THETAUSDT",
		"MTLUSDT",
		"GASUSDT",
		"IOUSDT",
		"ROSEUSDT",
		"1000XECUSDT",
		"ASTRUSDT",
		"LUNA2USDT",
		"USTCUSDT",
		"PIXELUSDT",
		"XMRUSDT",
		"QTUMUSDT",
		"ZILUSDT",
		"PHBUSDT",
		"XTZUSDT",
		"XEMUSDT",
		"RAREUSDT",
		"VOXELUSDT",
		"VIDTUSDT",
		"FLUXUSDT",
		"AERGOUSDT",
		"GHSTUSDT",
		"HMSTRUSDT",
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

// Stats summary:
// ┌────┬──────────────────┬───────────────────┬──────────────────────┬────────────────────┬────────────────────────┬───────────┬───────┐
// │    │ sl tp maxLen     │ QTY ps wp acc fwd │ WINRATE wp acc fwd   │ AVPNL wp acc fwd   │ ACCPNL wp acc fwd      │ DD badRun │ pairs │
// ├────┼──────────────────┼───────────────────┼──────────────────────┼────────────────────┼────────────────────────┼───────────┼───────┤
// │  0 │ 2.00% 13.00% 100 │ 4336 3069 384 146 │ 47.44% 48.70% 41.78% │ 0.24% 0.28% 0.09%  │ 741.92% 107.50% 12.54% │ 20.82% 12 │ 38    │
// │  1 │ 2.00% 13.00% 120 │ 4336 3069 384 146 │ 47.44% 48.70% 41.78% │ 0.24% 0.28% 0.09%  │ 741.92% 107.50% 12.54% │ 20.49% 15 │ 38    │
// │  2 │ 2.00% 12.00% 100 │ 4336 3069 385 147 │ 47.44% 48.57% 41.50% │ 0.24% 0.27% 0.07%  │ 738.93% 104.45% 10.49% │ 20.65% 7  │ 38    │
// │  3 │ 2.00% 12.00% 120 │ 4336 3069 385 147 │ 47.44% 48.57% 41.50% │ 0.24% 0.27% 0.07%  │ 738.93% 104.45% 10.49% │ 20.57% 7  │ 38    │
// │  4 │ 2.00% 14.00% 100 │ 4336 3069 383 146 │ 47.44% 48.83% 41.78% │ 0.24% 0.27% 0.08%  │ 742.67% 102.11% 11.95% │ 20.86% 9  │ 38    │
// │  5 │ 2.00% 14.00% 120 │ 4336 3069 383 146 │ 47.44% 48.83% 41.78% │ 0.24% 0.27% 0.08%  │ 742.67% 102.11% 11.95% │ 20.92% 10 │ 38    │
// │  6 │ 3.00% 12.00% 100 │ 4336 3057 339 130 │ 52.57% 51.33% 46.15% │ 0.17% 0.14% -0.00% │ 507.96% 48.05% -0.33%  │ 16.83% 9  │ 37    │
// │  7 │ 3.00% 12.00% 120 │ 4336 3057 339 130 │ 52.57% 51.33% 46.15% │ 0.17% 0.14% -0.00% │ 507.96% 48.05% -0.33%  │ 17.80% 8  │ 37    │
// │  8 │ 3.00% 13.00% 100 │ 4336 3057 339 129 │ 52.57% 51.33% 45.74% │ 0.17% 0.14% -0.01% │ 512.29% 46.95% -0.67%  │ 16.89% 6  │ 37    │
// │  9 │ 3.00% 13.00% 120 │ 4336 3057 339 129 │ 52.57% 51.33% 45.74% │ 0.17% 0.14% -0.01% │ 512.29% 46.95% -0.67%  │ 17.33% 10 │ 37    │
// │ 10 │ 3.00% 14.00% 100 │ 4336 3057 339 129 │ 52.57% 51.33% 45.74% │ 0.17% 0.13% -0.01% │ 511.02% 44.14% -1.07%  │ 17.79% 9  │ 37    │
// │ 11 │ 3.00% 14.00% 120 │ 4336 3057 339 129 │ 52.57% 51.33% 45.74% │ 0.17% 0.13% -0.01% │ 511.02% 44.14% -1.07%  │ 16.85% 8  │ 37    │
// └────┴──────────────────┴───────────────────┴──────────────────────┴────────────────────┴────────────────────────┴───────────┴───────┘
