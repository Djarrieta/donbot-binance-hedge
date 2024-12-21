import { EMA } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";
import { getSuperTrend } from "../utils/getSupertrend";

export const stg = new Strategy({
	stgName: "supertrend5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"SUPERUSDT",
		"1000XECUSDT",
		"POLYXUSDT",
		"BTCDOMUSDT",
		"BATUSDT",
		"ASTRUSDT",
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

		const ema200Array = EMA.calculate({
			period: 200,
			values: candlestick.map((candle) => candle.close),
		});

		const stA1 = getSuperTrend({
			candlestick,
			multiplier: 3,
			period: 12,
		});
		const stA2 = getSuperTrend({
			candlestick,
			multiplier: 2,
			period: 11,
		});
		const stA3 = getSuperTrend({
			candlestick,
			multiplier: 1,
			period: 10,
		});

		const lastPrice = candlestick[candlestick.length - 1].close;

		if (
			lastPrice > ema200Array[ema200Array.length - 1] &&
			lastPrice > stA3[stA3.length - 2] &&
			stA3[stA3.length - 2] > stA2[stA2.length - 2] &&
			stA2[stA2.length - 2] > stA1[stA1.length - 2] &&
			stA1[stA1.length - 3] > stA2[stA2.length - 3] &&
			stA2[stA2.length - 3] > stA3[stA3.length - 3] &&
			stA1[stA1.length - 4] > stA2[stA2.length - 4] &&
			stA2[stA2.length - 4] > stA3[stA3.length - 4] &&
			stA1[stA1.length - 6] > stA2[stA2.length - 6] &&
			stA2[stA2.length - 6] > stA3[stA3.length - 6] &&
			stA1[stA1.length - 8] > stA2[stA2.length - 8] &&
			stA2[stA2.length - 8] > stA3[stA3.length - 8] &&
			stA1[stA1.length - 10] > stA2[stA2.length - 10] &&
			stA2[stA2.length - 10] > stA3[stA3.length - 10]
		) {
			const minPrevPrice = Math.min(
				...candlestick.slice(-20).map((candle) => candle.low)
			);
			let sl = (lastPrice - minPrevPrice) / lastPrice;

			response.positionSide = "LONG";
			response.sl = sl;
		}

		if (
			lastPrice < ema200Array[ema200Array.length - 1] &&
			lastPrice < stA3[stA3.length - 2] &&
			stA3[stA3.length - 2] < stA2[stA2.length - 2] &&
			stA2[stA2.length - 2] < stA1[stA1.length - 2] &&
			stA1[stA1.length - 3] < stA2[stA2.length - 3] &&
			stA2[stA2.length - 3] < stA3[stA3.length - 3] &&
			stA1[stA1.length - 4] < stA2[stA2.length - 4] &&
			stA2[stA2.length - 4] < stA3[stA3.length - 4] &&
			stA1[stA1.length - 6] < stA2[stA2.length - 6] &&
			stA2[stA2.length - 6] < stA3[stA3.length - 6] &&
			stA1[stA1.length - 8] < stA2[stA2.length - 8] &&
			stA2[stA2.length - 8] < stA3[stA3.length - 8] &&
			stA1[stA1.length - 10] < stA2[stA2.length - 10] &&
			stA2[stA2.length - 10] < stA3[stA3.length - 10]
		) {
			const maxPrevPrice = Math.max(
				...candlestick.slice(-20).map((candle) => candle.high)
			);

			let sl = (maxPrevPrice - lastPrice) / lastPrice;
			response.sl = sl;
			response.positionSide = "SHORT";
		}

		return response;
	},
});

// Stats summary:
// ┌───┬─────────────────────┬───────────────────┬──────────────────────┬────────────────────┬───────────────────────┬───────────┬────────────────┬───────┐
// │   │ SL TPSLRatio MaxLen │ QTY ps wp acc fwd │ WINRATE wp acc fwd   │ AVPNL wp acc fwd   │ ACCPNL wp acc fwd     │ DD badRun │ PerDay pnl Qty │ pairs │
// ├───┼─────────────────────┼───────────────────┼──────────────────────┼────────────────────┼───────────────────────┼───────────┼────────────────┼───────┤
// │ 0 │ 2.00% 7 100         │ 26381 616 321 92  │ 44.64% 47.35% 31.52% │ 0.05% 0.11% -0.20% │ 31.20% 34.40% -18.76% │ 18.41% 7  │ 0.17%  1.55    │ 6     │
// └───┴─────────────────────┴───────────────────┴──────────────────────┴────────────────────┴───────────────────────┴───────────┴────────────────┴───────┘
// Stats per pair
// ┌───┬─────────────┬─────┬───────┬──────────┬─────────┬────────────┬────────┬───────────┬─────────────┐
// │   │ pair        │ qty │ avPnl │ avPnlAcc │ winRate │ winRateAcc │ accPnl │ accPnlAcc │ drawdownAcc │
// ├───┼─────────────┼─────┼───────┼──────────┼─────────┼────────────┼────────┼───────────┼─────────────┤
// │ 0 │ SUPERUSDT   │ 102 │ 0.09% │ 0.10%    │ 40.20%  │ 40.21%     │ 8.96%  │ 9.84%     │ 16.11%      │
// │ 1 │ 1000XECUSDT │ 101 │ 0.02% │ 0.07%    │ 46.53%  │ 47.73%     │ 2.29%  │ 5.84%     │ 11.26%      │
// │ 2 │ POLYXUSDT   │ 100 │ 0.10% │ 0.05%    │ 44.00%  │ 41.76%     │ 10.09% │ 4.70%     │ 15.83%      │
// │ 3 │ BTCDOMUSDT  │ 109 │ 0.04% │ 0.03%    │ 47.71%  │ 46.74%     │ 4.51%  │ 3.12%     │ 6.87%       │
// │ 4 │ BATUSDT     │ 101 │ 0.03% │ 0.03%    │ 47.52%  │ 48.89%     │ 3.07%  │ 2.55%     │ 11.39%      │
// │ 5 │ ASTRUSDT    │ 103 │ 0.02% │ -0.01%   │ 41.75%  │ 41.94%     │ 2.28%  │ -0.91%    │ 16.05%      │
// └───┴─────────────┴─────┴───────┴──────────┴─────────┴────────────┴────────┴───────────┴─────────────┘
