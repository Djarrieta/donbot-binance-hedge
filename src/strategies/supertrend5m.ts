import { EMA } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";
import { getSuperTrend } from "../utils/getSupertrend";
import { getVolatility } from "../utils/getVolatility";

export const stg = new Strategy({
	stgName: "supertrend5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		
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

		const MIN_VOL = 10 / 100;
		const MAX_VOL = 25 / 100;
		const MIN_VOLUME_RATIO = 1.5;

		const ema200Array = EMA.calculate({
			period: 200,
			values: candlestick.map((candle) => candle.close),
		});

		const volatility = getVolatility({ candlestick });
		if (volatility < MIN_VOL || volatility > MAX_VOL) return response;

		const recentVolumes = candlestick.slice(-5).map(c => c.volume);
		const prevVolumes = candlestick.slice(-10, -5).map(c => c.volume);
		const avgRecentVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
		const avgPrevVolume = prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length;
		const volumeRatio = avgRecentVolume / avgPrevVolume;

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
			stA2[stA2.length - 10] > stA3[stA3.length - 10] &&
			volumeRatio >= MIN_VOLUME_RATIO
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
			stA2[stA2.length - 10] < stA3[stA3.length - 10] &&
			volumeRatio >= MIN_VOLUME_RATIO
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
