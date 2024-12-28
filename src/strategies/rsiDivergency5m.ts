import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"PORTALUSDT",
		"PIXELUSDT",
		"HIFIUSDT",
		"ZETAUSDT",
		"BIGTIMEUSDT",
		"ACEUSDT",
		"ENAUSDT",
		"CAKEUSDT",
		"1000LUNCUSDT",
		"USTCUSDT",
		"HOOKUSDT",
		"BLURUSDT",
		"HIGHUSDT",
		"1000SATSUSDT",
		"C98USDT",
		"XRPUSDT",
		"LINAUSDT",
		"WUSDT",
		"SFPUSDT",
		"ICXUSDT",
		"APEUSDT",
		"ENSUSDT",
		"XMRUSDT",
		"VETUSDT",
		"MASKUSDT",
		"BNTUSDT",
		"DENTUSDT",
		"1000RATSUSDT",
		"1000SHIBUSDT",
		"TRUUSDT",
		"MKRUSDT",
		"TNSRUSDT",
		"LRCUSDT",
		"GMXUSDT",
		"BEAMXUSDT",
		"SUIUSDT",
		"ALGOUSDT",
		"CKBUSDT",
		"NEOUSDT",
		"FXSUSDT",
		"STXUSDT",
		"KAVAUSDT",
		"UMAUSDT",
		"ALICEUSDT",
		"RSRUSDT",
		"ATAUSDT",
		"ADAUSDT",
		"LUNA2USDT",
		"TUSDT",
		"GASUSDT",
		"MYROUSDT",
		"ARKMUSDT",
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
// │ 0 │ 1.00% 9 100         │ 18234 12963 1967 672 │ 28.54% 27.96% 27.68% │ 0.02% 0.01% 0.08% │ 195.77% 15.91% 56.27% │ 68.05% 26 │ 0.04%  4.73    │ 52    │
// └───┴─────────────────────┴──────────────────────┴──────────────────────┴───────────────────┴───────────────────────┴───────────┴────────────────┴───────┘
// Stats per pair
// ┌────┬──────────────┬─────┬────────┬──────────┬─────────┬────────────┬─────────┬───────────┬─────────────┐
// │    │ pair         │ qty │ avPnl  │ avPnlAcc │ winRate │ winRateAcc │ accPnl  │ accPnlAcc │ drawdownAcc │
// ├────┼──────────────┼─────┼────────┼──────────┼─────────┼────────────┼─────────┼───────────┼─────────────┤
// │  0 │ PORTALUSDT   │ 133 │ 0.16%  │ 0.20%    │ 29.32%  │ 28.30%     │ 21.10%  │ 21.46%    │ 11.66%      │
// │  1 │ PIXELUSDT    │ 129 │ 0.08%  │ 0.14%    │ 24.03%  │ 27.66%     │ 10.37%  │ 13.10%    │ 12.24%      │
// │  2 │ HIFIUSDT     │ 279 │ 0.07%  │ 0.11%    │ 27.96%  │ 29.52%     │ 18.70%  │ 23.41%    │ 16.58%      │
// │  3 │ ZETAUSDT     │ 149 │ 0.14%  │ 0.11%    │ 33.56%  │ 30.83%     │ 21.16%  │ 13.27%    │ 13.90%      │
// │  4 │ BIGTIMEUSDT  │ 214 │ 0.15%  │ 0.11%    │ 24.30%  │ 22.99%     │ 32.23%  │ 19.23%    │ 18.91%      │
// │  5 │ ACEUSDT      │ 179 │ 0.12%  │ 0.11%    │ 27.37%  │ 26.52%     │ 20.83%  │ 14.41%    │ 15.45%      │
// │  6 │ ENAUSDT      │ 124 │ 0.03%  │ 0.10%    │ 21.77%  │ 23.96%     │ 4.02%   │ 9.99%     │ 13.92%      │
// │  7 │ CAKEUSDT     │ 207 │ 0.14%  │ 0.10%    │ 40.58%  │ 37.50%     │ 29.30%  │ 16.51%    │ 12.36%      │
// │  8 │ 1000LUNCUSDT │ 229 │ 0.09%  │ 0.10%    │ 29.26%  │ 29.73%     │ 19.76%  │ 19.00%    │ 16.53%      │
// │  9 │ USTCUSDT     │ 150 │ 0.05%  │ 0.09%    │ 22.67%  │ 24.19%     │ 8.10%   │ 11.78%    │ 15.92%      │
// │ 10 │ HOOKUSDT     │ 318 │ 0.05%  │ 0.08%    │ 27.67%  │ 27.85%     │ 15.28%  │ 18.11%    │ 18.26%      │
// │ 11 │ BLURUSDT     │ 325 │ 0.10%  │ 0.07%    │ 28.00%  │ 27.09%     │ 31.27%  │ 18.01%    │ 21.13%      │
// │ 12 │ HIGHUSDT     │ 267 │ 0.08%  │ 0.05%    │ 25.47%  │ 25.23%     │ 21.16%  │ 11.10%    │ 21.26%      │
// │ 13 │ 1000SATSUSDT │ 154 │ -0.03% │ 0.05%    │ 18.18%  │ 20.16%     │ -5.12%  │ 6.01%     │ 19.67%      │
// │ 14 │ C98USDT      │ 210 │ 0.06%  │ 0.04%    │ 27.62%  │ 27.01%     │ 11.55%  │ 7.63%     │ 18.66%      │
// │ 15 │ XRPUSDT      │ 238 │ 0.05%  │ 0.04%    │ 41.18%  │ 40.54%     │ 12.96%  │ 7.81%     │ 13.89%      │
// │ 16 │ LINAUSDT     │ 191 │ 0.03%  │ 0.04%    │ 25.65%  │ 25.32%     │ 5.55%   │ 6.19%     │ 17.95%      │
// │ 17 │ WUSDT        │ 115 │ 0.04%  │ 0.04%    │ 20.87%  │ 21.18%     │ 4.31%   │ 3.32%     │ 15.44%      │
// │ 18 │ SFPUSDT      │ 339 │ 0.02%  │ 0.04%    │ 33.33%  │ 32.86%     │ 7.09%   │ 7.51%     │ 19.42%      │
// │ 19 │ ICXUSDT      │ 271 │ 0.03%  │ 0.03%    │ 32.47%  │ 31.84%     │ 8.11%   │ 5.94%     │ 18.19%      │
// │ 20 │ APEUSDT      │ 210 │ 0.00%  │ 0.02%    │ 29.52%  │ 29.63%     │ 0.20%   │ 3.48%     │ 17.77%      │
// │ 21 │ ENSUSDT      │ 294 │ 0.04%  │ 0.02%    │ 32.31%  │ 30.81%     │ 11.41%  │ 3.25%     │ 20.04%      │
// │ 22 │ XMRUSDT      │ 332 │ 0.07%  │ 0.01%    │ 40.36%  │ 37.69%     │ 21.93%  │ 2.51%     │ 15.25%      │
// │ 23 │ VETUSDT      │ 267 │ 0.00%  │ 0.00%    │ 29.59%  │ 28.65%     │ 0.51%   │ 0.45%     │ 20.17%      │
// │ 24 │ MASKUSDT     │ 259 │ 0.04%  │ 0.00%    │ 34.36%  │ 32.29%     │ 9.61%   │ 0.30%     │ 20.06%      │
// │ 25 │ BNTUSDT      │ 249 │ -0.02% │ -0.00%   │ 31.73%  │ 32.02%     │ -4.13%  │ -0.30%    │ 18.35%      │
// │ 26 │ DENTUSDT     │ 186 │ 0.01%  │ -0.00%   │ 30.11%  │ 28.10%     │ 1.36%   │ -0.45%    │ 19.43%      │
// │ 27 │ 1000RATSUSDT │ 221 │ -0.03% │ -0.00%   │ 16.29%  │ 16.49%     │ -5.72%  │ -0.68%    │ 28.36%      │
// │ 28 │ 1000SHIBUSDT │ 270 │ 0.02%  │ -0.00%   │ 35.93%  │ 32.02%     │ 6.51%   │ -0.91%    │ 20.76%      │
// │ 29 │ TRUUSDT      │ 354 │ 0.04%  │ -0.01%   │ 26.55%  │ 24.18%     │ 13.66%  │ -1.39%    │ 29.08%      │
// │ 30 │ MKRUSDT      │ 357 │ -0.03% │ -0.01%   │ 29.13%  │ 28.74%     │ -12.42% │ -1.56%    │ 23.28%      │
// │ 31 │ TNSRUSDT     │ 125 │ 0.04%  │ -0.01%   │ 20.80%  │ 19.10%     │ 5.36%   │ -0.82%    │ 16.78%      │
// │ 32 │ LRCUSDT      │ 227 │ 0.00%  │ -0.01%   │ 30.84%  │ 30.00%     │ 0.17%   │ -2.38%    │ 20.52%      │
// │ 33 │ GMXUSDT      │ 429 │ -0.01% │ -0.02%   │ 29.60%  │ 28.57%     │ -2.91%  │ -5.80%    │ 28.33%      │
// │ 34 │ BEAMXUSDT    │ 274 │ 0.02%  │ -0.02%   │ 21.90%  │ 20.40%     │ 4.17%   │ -4.21%    │ 28.18%      │
// │ 35 │ SUIUSDT      │ 367 │ -0.00% │ -0.03%   │ 28.61%  │ 27.51%     │ -1.45%  │ -7.26%    │ 28.15%      │
// │ 36 │ ALGOUSDT     │ 235 │ -0.02% │ -0.03%   │ 29.36%  │ 28.33%     │ -4.17%  │ -5.35%    │ 22.76%      │
// │ 37 │ CKBUSDT      │ 296 │ -0.03% │ -0.03%   │ 23.99%  │ 22.97%     │ -8.50%  │ -7.07%    │ 28.45%      │
// │ 38 │ NEOUSDT      │ 348 │ -0.01% │ -0.03%   │ 29.60%  │ 28.81%     │ -2.74%  │ -7.84%    │ 27.14%      │
// │ 39 │ FXSUSDT      │ 418 │ -0.02% │ -0.03%   │ 30.14%  │ 29.04%     │ -8.25%  │ -8.99%    │ 28.20%      │
// │ 40 │ STXUSDT      │ 291 │ -0.04% │ -0.03%   │ 24.74%  │ 25.11%     │ -11.13% │ -7.37%    │ 27.82%      │
// │ 41 │ KAVAUSDT     │ 349 │ -0.02% │ -0.04%   │ 34.38%  │ 32.41%     │ -7.18%  │ -10.20%   │ 25.41%      │
// │ 42 │ UMAUSDT      │ 300 │ -0.01% │ -0.04%   │ 29.00%  │ 26.89%     │ -4.01%  │ -8.77%    │ 27.62%      │
// │ 43 │ ALICEUSDT    │ 197 │ -0.00% │ -0.04%   │ 26.90%  │ 24.53%     │ -0.41%  │ -6.70%    │ 22.50%      │
// │ 44 │ RSRUSDT      │ 323 │ -0.04% │ -0.06%   │ 25.08%  │ 23.31%     │ -11.75% │ -13.86%   │ 32.36%      │
// │ 45 │ ATAUSDT      │ 222 │ -0.03% │ -0.06%   │ 25.23%  │ 22.78%     │ -7.05%  │ -11.23%   │ 27.72%      │
// │ 46 │ ADAUSDT      │ 270 │ -0.06% │ -0.06%   │ 30.37%  │ 30.88%     │ -15.35% │ -12.77%   │ 26.43%      │
// │ 47 │ LUNA2USDT    │ 219 │ -0.05% │ -0.06%   │ 25.57%  │ 23.67%     │ -10.68% │ -10.95%   │ 27.66%      │
// │ 48 │ TUSDT        │ 256 │ -0.02% │ -0.08%   │ 28.13%  │ 23.96%     │ -6.38%  │ -14.51%   │ 27.86%      │
// │ 49 │ GASUSDT      │ 204 │ -0.00% │ -0.08%   │ 27.94%  │ 23.72%     │ -0.11%  │ -12.47%   │ 25.38%      │
// │ 50 │ MYROUSDT     │ 123 │ -0.13% │ -0.11%   │ 14.63%  │ 15.38%     │ -16.48% │ -11.95%   │ 24.74%      │
// │ 51 │ ARKMUSDT     │ 270 │ -0.13% │ -0.13%   │ 17.41%  │ 18.81%     │ -36.03% │ -25.89%   │ 38.19%      │
// └────┴──────────────┴─────┴────────┴──────────┴─────────┴────────────┴─────────┴───────────┴─────────────┘
