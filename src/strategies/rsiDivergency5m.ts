import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"LUNA2USDT",
		"FXSUSDT",
		"TRUUSDT",
		"HIGHUSDT",
		"GMXUSDT",
		"NEOUSDT",
		"TUSDT",
		"DENTUSDT",
		"VETUSDT",
		"KAVAUSDT",
		"CKBUSDT",
		"LRCUSDT",
		"RSRUSDT",
		"BLURUSDT",
		"APEUSDT",
		"MASKUSDT",
		"ADAUSDT",
		"UMAUSDT",
		"C98USDT",
		"ALICEUSDT",
		"ICXUSDT",
		"1000SHIBUSDT",
		"XMRUSDT",
		"ALGOUSDT",
		"ENSUSDT",
		"MKRUSDT",
		"XRPUSDT",
		"LINAUSDT",
		"ATAUSDT",
		"STXUSDT",
		"SUIUSDT",
		"HOOKUSDT",
		"1000LUNCUSDT",
		"SFPUSDT",
		"ARKMUSDT",
		"BNTUSDT",
		"HIFIUSDT",
		"BIGTIMEUSDT",
		"GASUSDT",
		"CAKEUSDT",
		"BEAMXUSDT",
		"USTCUSDT",
		"1000SATSUSDT",
		"1000RATSUSDT",
		"ACEUSDT",
		"ZETAUSDT",
		"PIXELUSDT",
		"MYROUSDT",
		"PORTALUSDT",
		"ENAUSDT",
		"WUSDT",
		"TNSRUSDT",
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

		const lastPrice = candlestickValues[candlestickValues.length - 1];

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
				const minPrevPrice = Math.min(
					...candlestick.slice(-CANDLESTICK_SIZE).map((candle) => candle.low)
				);
				let sl = (lastPrice - minPrevPrice) / lastPrice;

				response.positionSide = "LONG";
				response.sl = sl;
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
				const maxPrevPrice = Math.max(
					...candlestick.slice(-CANDLESTICK_SIZE).map((candle) => candle.high)
				);

				let sl = (maxPrevPrice - lastPrice) / lastPrice;

				response.sl = sl;
				response.positionSide = "SHORT";
			}
		}

		return response;
	},
});

// Stats summary:
// ┌───┬─────────────────────┬──────────────────────┬──────────────────────┬───────────────────┬───────────────────────┬───────────┬────────────────┬───────┐
// │   │ SL TPSLRatio MaxLen │ QTY ps wp acc fwd    │ WINRATE wp acc fwd   │ AVPNL wp acc fwd  │ ACCPNL wp acc fwd     │ DD badRun │ PerDay pnl Qty │ pairs │
// ├───┼─────────────────────┼──────────────────────┼──────────────────────┼───────────────────┼───────────────────────┼───────────┼────────────────┼───────┤
// │ 0 │ 5.00% 3 100         │ 18234 12963 1153 372 │ 49.09% 49.35% 53.23% │ 0.02% 0.02% 0.06% │ 197.35% 19.47% 22.17% │ 38.16% 9  │ 0.05%  2.77    │ 52    │
// └───┴─────────────────────┴──────────────────────┴──────────────────────┴───────────────────┴───────────────────────┴───────────┴────────────────┴───────┘
// Stats per pair
// ┌────┬──────────────┬─────┬────────┬──────────┬─────────┬────────────┬─────────┬───────────┬─────────────┐
// │    │ pair         │ qty │ avPnl  │ avPnlAcc │ winRate │ winRateAcc │ accPnl  │ accPnlAcc │ drawdownAcc │
// ├────┼──────────────┼─────┼────────┼──────────┼─────────┼────────────┼─────────┼───────────┼─────────────┤
// │  0 │ PORTALUSDT   │ 133 │ 0.16%  │ 0.16%    │ 61.65%  │ 62.20%     │ 21.79%  │ 13.27%    │ 8.63%       │
// │  1 │ 1000LUNCUSDT │ 229 │ 0.10%  │ 0.15%    │ 51.97%  │ 52.94%     │ 22.22%  │ 22.55%    │ 10.09%      │
// │  2 │ PIXELUSDT    │ 129 │ 0.12%  │ 0.14%    │ 51.94%  │ 52.50%     │ 16.07%  │ 11.58%    │ 8.35%       │
// │  3 │ ZETAUSDT     │ 149 │ 0.11%  │ 0.13%    │ 53.02%  │ 52.48%     │ 16.01%  │ 13.11%    │ 8.11%       │
// │  4 │ XRPUSDT      │ 238 │ 0.07%  │ 0.10%    │ 55.88%  │ 56.25%     │ 17.54%  │ 15.72%    │ 6.65%       │
// │  5 │ BLURUSDT     │ 325 │ 0.11%  │ 0.09%    │ 51.69%  │ 50.24%     │ 36.98%  │ 17.61%    │ 13.68%      │
// │  6 │ TRUUSDT      │ 354 │ 0.10%  │ 0.08%    │ 56.21%  │ 52.11%     │ 35.83%  │ 17.69%    │ 14.10%      │
// │  7 │ LRCUSDT      │ 227 │ 0.11%  │ 0.08%    │ 51.10%  │ 50.31%     │ 24.19%  │ 12.79%    │ 11.47%      │
// │  8 │ SUIUSDT      │ 367 │ 0.09%  │ 0.08%    │ 55.04%  │ 53.85%     │ 32.32%  │ 17.00%    │ 12.38%      │
// │  9 │ BIGTIMEUSDT  │ 214 │ 0.15%  │ 0.07%    │ 47.20%  │ 44.76%     │ 31.65%  │ 10.34%    │ 16.25%      │
// │ 10 │ CAKEUSDT     │ 207 │ 0.11%  │ 0.06%    │ 60.87%  │ 58.65%     │ 22.26%  │ 7.66%     │ 10.48%      │
// │ 11 │ HIFIUSDT     │ 279 │ 0.02%  │ 0.06%    │ 51.97%  │ 53.76%     │ 5.81%   │ 9.52%     │ 12.43%      │
// │ 12 │ ENSUSDT      │ 294 │ 0.02%  │ 0.05%    │ 51.02%  │ 52.30%     │ 4.91%   │ 8.58%     │ 12.95%      │
// │ 13 │ WUSDT        │ 115 │ -0.06% │ 0.05%    │ 43.48%  │ 47.62%     │ -7.46%  │ 2.85%     │ 10.89%      │
// │ 14 │ HOOKUSDT     │ 318 │ 0.03%  │ 0.04%    │ 45.60%  │ 45.14%     │ 8.59%   │ 6.23%     │ 14.23%      │
// │ 15 │ ACEUSDT      │ 179 │ 0.14%  │ 0.03%    │ 53.63%  │ 50.00%     │ 24.50%  │ 3.34%     │ 13.92%      │
// │ 16 │ TNSRUSDT     │ 125 │ 0.13%  │ 0.03%    │ 49.60%  │ 48.53%     │ 16.78%  │ 2.30%     │ 11.38%      │
// │ 17 │ LINAUSDT     │ 191 │ 0.10%  │ 0.03%    │ 55.50%  │ 51.59%     │ 18.42%  │ 3.91%     │ 13.00%      │
// │ 18 │ SFPUSDT      │ 339 │ -0.01% │ 0.03%    │ 49.85%  │ 50.00%     │ -2.34%  │ 5.37%     │ 12.18%      │
// │ 19 │ XMRUSDT      │ 332 │ 0.07%  │ 0.03%    │ 57.23%  │ 54.91%     │ 23.10%  │ 4.97%     │ 9.22%       │
// │ 20 │ HIGHUSDT     │ 267 │ 0.01%  │ 0.03%    │ 49.44%  │ 51.96%     │ 2.02%   │ 4.52%     │ 16.73%      │
// │ 21 │ BEAMXUSDT    │ 274 │ 0.01%  │ 0.02%    │ 46.72%  │ 46.98%     │ 2.81%   │ 3.58%     │ 16.57%      │
// │ 22 │ 1000SATSUSDT │ 154 │ 0.02%  │ 0.01%    │ 45.45%  │ 44.76%     │ 3.46%   │ 1.23%     │ 15.63%      │
// │ 23 │ MYROUSDT     │ 123 │ -0.07% │ 0.01%    │ 46.34%  │ 48.72%     │ -9.12%  │ 0.84%     │ 15.25%      │
// │ 24 │ ENAUSDT      │ 124 │ -0.04% │ 0.01%    │ 42.74%  │ 45.33%     │ -4.49%  │ 0.55%     │ 13.97%      │
// │ 25 │ C98USDT      │ 210 │ 0.06%  │ 0.00%    │ 51.43%  │ 47.22%     │ 13.02%  │ 0.68%     │ 14.29%      │
// │ 26 │ 1000RATSUSDT │ 221 │ -0.08% │ 0.00%    │ 37.56%  │ 41.30%     │ -17.75% │ 0.36%     │ 21.27%      │
// │ 27 │ GASUSDT      │ 204 │ -0.01% │ 0.00%    │ 46.57%  │ 45.97%     │ -1.35%  │ 0.08%     │ 15.25%      │
// │ 28 │ VETUSDT      │ 267 │ -0.01% │ 0.00%    │ 50.94%  │ 49.35%     │ -3.54%  │ 0.09%     │ 13.40%      │
// │ 29 │ USTCUSDT     │ 150 │ 0.02%  │ 0.00%    │ 44.67%  │ 41.35%     │ 3.13%   │ 0.06%     │ 14.62%      │
// │ 30 │ ALICEUSDT    │ 197 │ 0.10%  │ -0.00%   │ 58.38%  │ 53.44%     │ 20.10%  │ -0.03%    │ 12.40%      │
// │ 31 │ MASKUSDT     │ 259 │ 0.02%  │ -0.00%   │ 52.51%  │ 50.63%     │ 5.71%   │ -0.24%    │ 13.39%      │
// │ 32 │ ICXUSDT      │ 271 │ 0.00%  │ -0.00%   │ 47.60%  │ 47.34%     │ 0.70%   │ -0.75%    │ 14.24%      │
// │ 33 │ CKBUSDT      │ 296 │ 0.01%  │ -0.01%   │ 46.62%  │ 46.45%     │ 3.51%   │ -0.97%    │ 18.09%      │
// │ 34 │ STXUSDT      │ 291 │ -0.05% │ -0.01%   │ 47.77%  │ 48.37%     │ -14.45% │ -2.14%    │ 16.86%      │
// │ 35 │ APEUSDT      │ 210 │ 0.04%  │ -0.01%   │ 49.05%  │ 45.65%     │ 9.42%   │ -1.71%    │ 13.21%      │
// │ 36 │ ALGOUSDT     │ 235 │ 0.03%  │ -0.01%   │ 46.81%  │ 43.07%     │ 6.38%   │ -1.74%    │ 15.38%      │
// │ 37 │ UMAUSDT      │ 300 │ 0.04%  │ -0.02%   │ 52.67%  │ 49.42%     │ 10.74%  │ -3.85%    │ 18.30%      │
// │ 38 │ FXSUSDT      │ 418 │ -0.02% │ -0.03%   │ 47.13%  │ 46.15%     │ -9.29%  │ -6.71%    │ 20.21%      │
// │ 39 │ 1000SHIBUSDT │ 270 │ -0.01% │ -0.04%   │ 50.00%  │ 45.40%     │ -3.18%  │ -6.23%    │ 16.22%      │
// │ 40 │ KAVAUSDT     │ 349 │ -0.01% │ -0.04%   │ 50.43%  │ 48.36%     │ -3.55%  │ -8.00%    │ 16.26%      │
// │ 41 │ BNTUSDT      │ 249 │ -0.03% │ -0.04%   │ 48.19%  │ 46.00%     │ -6.41%  │ -6.00%    │ 15.35%      │
// │ 42 │ ADAUSDT      │ 270 │ -0.01% │ -0.04%   │ 47.41%  │ 44.91%     │ -1.77%  │ -7.24%    │ 15.98%      │
// │ 43 │ DENTUSDT     │ 186 │ -0.10% │ -0.06%   │ 43.01%  │ 44.26%     │ -18.63% │ -7.29%    │ 18.03%      │
// │ 44 │ NEOUSDT      │ 348 │ -0.01% │ -0.06%   │ 45.11%  │ 44.67%     │ -4.27%  │ -12.25%   │ 21.22%      │
// │ 45 │ MKRUSDT      │ 357 │ -0.10% │ -0.07%   │ 38.66%  │ 41.41%     │ -36.38% │ -13.01%   │ 22.40%      │
// │ 46 │ RSRUSDT      │ 323 │ -0.02% │ -0.07%   │ 50.46%  │ 48.09%     │ -5.17%  │ -13.50%   │ 25.41%      │
// │ 47 │ ATAUSDT      │ 222 │ -0.03% │ -0.08%   │ 45.05%  │ 44.37%     │ -6.37%  │ -10.67%   │ 23.34%      │
// │ 48 │ GMXUSDT      │ 429 │ -0.09% │ -0.08%   │ 43.12%  │ 43.67%     │ -37.08% │ -17.70%   │ 27.62%      │
// │ 49 │ ARKMUSDT     │ 270 │ -0.11% │ -0.09%   │ 40.74%  │ 44.38%     │ -29.44% │ -14.93%   │ 25.20%      │
// │ 50 │ LUNA2USDT    │ 219 │ -0.10% │ -0.10%   │ 43.38%  │ 41.61%     │ -20.95% │ -14.60%   │ 24.42%      │
// │ 51 │ TUSDT        │ 256 │ -0.08% │ -0.11%   │ 46.09%  │ 41.61%     │ -19.63% │ -17.21%   │ 25.52%      │
// └────┴──────────────┴─────┴────────┴──────────┴─────────┴────────────┴─────────┴───────────┴─────────────┘
