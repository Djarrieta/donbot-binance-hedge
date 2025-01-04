import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
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
// │ 0 │ 5.00% 3 100         │ 18234 12963 1157 375 │ 49.19% 48.92% 52.53% │ 0.02% 0.01% 0.05% │ 201.37% 15.80% 18.92% │ 40.46% 9  │ 0.04%  2.78    │ 52    │
// └───┴─────────────────────┴──────────────────────┴──────────────────────┴───────────────────┴───────────────────────┴───────────┴────────────────┴───────┘
// Stats per pair
// ┌────┬──────────────┬─────┬────────┬──────────┬─────────┬────────────┬─────────┬───────────┬─────────────┐
// │    │ pair         │ qty │ avPnl  │ avPnlAcc │ winRate │ winRateAcc │ accPnl  │ accPnlAcc │ drawdownAcc │
// ├────┼──────────────┼─────┼────────┼──────────┼─────────┼────────────┼─────────┼───────────┼─────────────┤
// │  0 │ PORTALUSDT   │ 133 │ 0.18%  │ 0.18%    │ 62.41%  │ 63.10%     │ 23.45%  │ 15.29%    │ 8.27%       │
// │  1 │ PIXELUSDT    │ 129 │ 0.12%  │ 0.14%    │ 51.94%  │ 52.50%     │ 16.07%  │ 11.58%    │ 8.18%       │
// │  2 │ 1000LUNCUSDT │ 229 │ 0.09%  │ 0.14%    │ 51.97%  │ 53.25%     │ 20.53%  │ 21.83%    │ 10.14%      │
// │  3 │ ZETAUSDT     │ 149 │ 0.11%  │ 0.13%    │ 53.02%  │ 52.48%     │ 16.17%  │ 13.27%    │ 8.26%       │
// │  4 │ XRPUSDT      │ 238 │ 0.07%  │ 0.10%    │ 55.88%  │ 56.25%     │ 17.54%  │ 15.72%    │ 6.59%       │
// │  5 │ TRUUSDT      │ 354 │ 0.10%  │ 0.09%    │ 56.21%  │ 52.34%     │ 35.83%  │ 18.79%    │ 13.35%      │
// │  6 │ BLURUSDT     │ 325 │ 0.11%  │ 0.08%    │ 51.69%  │ 50.00%     │ 36.98%  │ 17.15%    │ 13.75%      │
// │  7 │ LRCUSDT      │ 227 │ 0.11%  │ 0.08%    │ 51.10%  │ 50.31%     │ 24.19%  │ 12.79%    │ 11.06%      │
// │  8 │ SUIUSDT      │ 367 │ 0.09%  │ 0.08%    │ 55.04%  │ 53.85%     │ 32.32%  │ 17.00%    │ 12.72%      │
// │  9 │ BIGTIMEUSDT  │ 214 │ 0.15%  │ 0.07%    │ 47.20%  │ 44.76%     │ 31.13%  │ 10.34%    │ 16.30%      │
// │ 10 │ CAKEUSDT     │ 207 │ 0.11%  │ 0.07%    │ 60.87%  │ 59.26%     │ 22.26%  │ 8.85%     │ 9.75%       │
// │ 11 │ HIFIUSDT     │ 279 │ 0.02%  │ 0.06%    │ 51.97%  │ 53.76%     │ 5.81%   │ 9.52%     │ 12.87%      │
// │ 12 │ WUSDT        │ 115 │ -0.05% │ 0.05%    │ 44.35%  │ 48.44%     │ -5.80%  │ 3.28%     │ 10.75%      │
// │ 13 │ ENSUSDT      │ 294 │ 0.02%  │ 0.05%    │ 51.02%  │ 52.30%     │ 4.91%   │ 8.58%     │ 13.24%      │
// │ 14 │ ACEUSDT      │ 179 │ 0.14%  │ 0.04%    │ 53.63%  │ 50.52%     │ 24.50%  │ 4.04%     │ 14.12%      │
// │ 15 │ LINAUSDT     │ 191 │ 0.10%  │ 0.03%    │ 55.50%  │ 51.59%     │ 18.42%  │ 3.91%     │ 13.03%      │
// │ 16 │ TNSRUSDT     │ 125 │ 0.13%  │ 0.03%    │ 49.60%  │ 48.53%     │ 16.59%  │ 2.10%     │ 11.24%      │
// │ 17 │ SFPUSDT      │ 339 │ -0.01% │ 0.03%    │ 49.85%  │ 50.00%     │ -2.34%  │ 5.37%     │ 12.59%      │
// │ 18 │ XMRUSDT      │ 332 │ 0.07%  │ 0.03%    │ 57.23%  │ 54.91%     │ 23.10%  │ 4.97%     │ 9.03%       │
// │ 19 │ HIGHUSDT     │ 267 │ 0.01%  │ 0.03%    │ 49.81%  │ 51.96%     │ 3.68%   │ 4.52%     │ 16.73%      │
// │ 20 │ 1000SATSUSDT │ 154 │ 0.02%  │ 0.02%    │ 45.45%  │ 45.28%     │ 3.46%   │ 2.02%     │ 15.34%      │
// │ 21 │ BEAMXUSDT    │ 274 │ 0.02%  │ 0.02%    │ 47.08%  │ 46.67%     │ 4.48%   │ 2.34%     │ 17.03%      │
// │ 22 │ HOOKUSDT     │ 318 │ 0.02%  │ 0.01%    │ 45.91%  │ 44.89%     │ 6.99%   │ 2.59%     │ 14.97%      │
// │ 23 │ MYROUSDT     │ 123 │ -0.08% │ 0.01%    │ 46.34%  │ 50.00%     │ -9.88%  │ 1.12%     │ 15.29%      │
// │ 24 │ ENAUSDT      │ 124 │ -0.04% │ 0.01%    │ 42.74%  │ 45.33%     │ -4.49%  │ 0.55%     │ 13.85%      │
// │ 25 │ GASUSDT      │ 204 │ 0.01%  │ 0.01%    │ 48.04%  │ 46.77%     │ 1.44%   │ 0.67%     │ 15.14%      │
// │ 26 │ C98USDT      │ 210 │ 0.06%  │ 0.00%    │ 51.43%  │ 47.22%     │ 13.02%  │ 0.68%     │ 14.39%      │
// │ 27 │ ALICEUSDT    │ 197 │ 0.10%  │ -0.00%   │ 58.38%  │ 53.44%     │ 20.10%  │ -0.03%    │ 12.62%      │
// │ 28 │ MASKUSDT     │ 259 │ 0.02%  │ -0.00%   │ 52.51%  │ 50.63%     │ 5.71%   │ -0.24%    │ 13.23%      │
// │ 29 │ USTCUSDT     │ 150 │ 0.02%  │ -0.00%   │ 44.67%  │ 41.35%     │ 2.71%   │ -0.36%    │ 14.72%      │
// │ 30 │ ICXUSDT      │ 271 │ 0.00%  │ -0.00%   │ 47.60%  │ 47.34%     │ 0.70%   │ -0.75%    │ 14.17%      │
// │ 31 │ STXUSDT      │ 291 │ -0.05% │ -0.01%   │ 47.77%  │ 48.92%     │ -14.93% │ -1.11%    │ 17.15%      │
// │ 32 │ VETUSDT      │ 267 │ -0.01% │ -0.01%   │ 50.94%  │ 49.03%     │ -3.54%  │ -1.15%    │ 14.35%      │
// │ 33 │ CKBUSDT      │ 296 │ 0.01%  │ -0.01%   │ 46.62%  │ 46.20%     │ 2.90%   │ -1.88%    │ 18.43%      │
// │ 34 │ APEUSDT      │ 210 │ 0.04%  │ -0.01%   │ 49.05%  │ 45.65%     │ 9.42%   │ -1.71%    │ 13.48%      │
// │ 35 │ ALGOUSDT     │ 235 │ 0.03%  │ -0.01%   │ 46.81%  │ 43.07%     │ 6.38%   │ -1.74%    │ 15.50%      │
// │ 36 │ UMAUSDT      │ 300 │ 0.04%  │ -0.02%   │ 52.67%  │ 49.42%     │ 10.64%  │ -3.85%    │ 18.40%      │
// │ 37 │ 1000RATSUSDT │ 221 │ -0.08% │ -0.03%   │ 38.46%  │ 41.55%     │ -18.10% │ -3.71%    │ 22.93%      │
// │ 38 │ FXSUSDT      │ 418 │ -0.02% │ -0.03%   │ 47.13%  │ 46.15%     │ -9.29%  │ -6.71%    │ 20.69%      │
// │ 39 │ 1000SHIBUSDT │ 270 │ -0.01% │ -0.04%   │ 50.00%  │ 45.40%     │ -3.81%  │ -6.23%    │ 16.24%      │
// │ 40 │ KAVAUSDT     │ 349 │ -0.01% │ -0.04%   │ 50.43%  │ 48.36%     │ -3.55%  │ -8.00%    │ 16.78%      │
// │ 41 │ BNTUSDT      │ 249 │ -0.03% │ -0.04%   │ 48.19%  │ 46.00%     │ -6.41%  │ -6.00%    │ 15.67%      │
// │ 42 │ ADAUSDT      │ 270 │ -0.01% │ -0.04%   │ 47.41%  │ 44.91%     │ -1.77%  │ -7.24%    │ 16.04%      │
// │ 43 │ DENTUSDT     │ 186 │ -0.10% │ -0.06%   │ 43.01%  │ 44.26%     │ -18.63% │ -7.29%    │ 17.70%      │
// │ 44 │ NEOUSDT      │ 348 │ -0.01% │ -0.07%   │ 45.40%  │ 44.67%     │ -3.16%  │ -12.81%   │ 21.83%      │
// │ 45 │ MKRUSDT      │ 357 │ -0.10% │ -0.07%   │ 38.66%  │ 41.41%     │ -36.38% │ -13.01%   │ 21.79%      │
// │ 46 │ ATAUSDT      │ 222 │ -0.02% │ -0.07%   │ 45.50%  │ 45.07%     │ -5.23%  │ -9.53%    │ 23.48%      │
// │ 47 │ RSRUSDT      │ 323 │ -0.02% │ -0.07%   │ 50.46%  │ 48.11%     │ -5.17%  │ -13.01%   │ 25.04%      │
// │ 48 │ GMXUSDT      │ 429 │ -0.09% │ -0.08%   │ 43.12%  │ 43.67%     │ -37.08% │ -17.70%   │ 27.88%      │
// │ 49 │ ARKMUSDT     │ 270 │ -0.11% │ -0.09%   │ 40.74%  │ 44.38%     │ -29.44% │ -15.20%   │ 25.68%      │
// │ 50 │ LUNA2USDT    │ 219 │ -0.10% │ -0.10%   │ 43.38%  │ 41.61%     │ -21.42% │ -15.08%   │ 25.14%      │
// │ 51 │ TUSDT        │ 256 │ -0.08% │ -0.11%   │ 46.09%  │ 41.61%     │ -19.63% │ -17.21%   │ 25.07%      │
// └────┴──────────────┴─────┴────────┴──────────┴─────────┴────────────┴─────────┴───────────┴─────────────┘
