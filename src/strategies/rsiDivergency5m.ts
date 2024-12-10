import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const rsiDivergency5m = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"HOOKUSDT",
		"PIXELUSDT",
		"PORTALUSDT",
		"OMNIUSDT",
		"XRPUSDT",
		"LRCUSDT",
		"1000SATSUSDT",
		"ENAUSDT",
		"USTCUSDT",
		"CAKEUSDT",
		"1000SHIBUSDT",
		"CKBUSDT",
		"LUNA2USDT",
		"LINAUSDT",
		"BLURUSDT",
		"UMAUSDT",
		"ARKMUSDT",
		"ALGOUSDT",
		"ZETAUSDT",
		"BIGTIMEUSDT",
		"GMXUSDT",
		"MASKUSDT",
		"C98USDT",
		"MYROUSDT",
		"MKRUSDT",
		"GASUSDT",
		"ACEUSDT",
		"1000LUNCUSDT",
		"NEOUSDT",
		"HIFIUSDT",
		"KAVAUSDT",
		"VETUSDT",
		"ADAUSDT",
		"DENTUSDT",
		"WUSDT",
		"FXSUSDT",
		"BNTUSDT",
		"XMRUSDT",
		"APEUSDT",
		"ENSUSDT",
		"RSRUSDT",
		"STXUSDT",
		"ATAUSDT",
		"1000RATSUSDT",
		"SFPUSDT",
		"ALICEUSDT",
		"TRUUSDT",
		"HIGHUSDT",
		"SUIUSDT",
		"TNSRUSDT",
		"BEAMXUSDT",
		"ICXUSDT",
		"TUSDT",
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
// ┌───┬─────────────────────┬─────────────────────┬──────────────────────┬───────────────────┬───────────────────────┬─────────────────────┬───────┐
// │   │ SL TPSLRatio MaxLen │ QTY ps wp acc fwd   │ WINRATE wp acc fwd   │ AVPNL wp acc fwd  │ ACCPNL wp acc fwd     │ DD badRun pnlPerDay │ pairs │
// ├───┼─────────────────────┼─────────────────────┼──────────────────────┼───────────────────┼───────────────────────┼─────────────────────┼───────┤
// │ 0 │ 1.00% 9 100         │ 11769 8294 1031 357 │ 29.06% 29.10% 26.05% │ 0.06% 0.07% 0.04% │ 523.01% 68.00% 13.87% │ 34.71% 19 0.33%     │ 53    │
// └───┴─────────────────────┴─────────────────────┴──────────────────────┴───────────────────┴───────────────────────┴─────────────────────┴───────┘
// Stats per pair
// ┌────┬──────────────┬─────┬───────┬──────────┬─────────┬────────────┬────────┬───────────┬─────────────┐
// │    │ pair         │ qty │ avPnl │ avPnlAcc │ winRate │ winRateAcc │ accPnl │ accPnlAcc │ drawdownAcc │
// ├────┼──────────────┼─────┼───────┼──────────┼─────────┼────────────┼────────┼───────────┼─────────────┤
// │  0 │ HOOKUSDT     │ 153 │ 0.18% │ 0.21%    │ 33.33%  │ 33.64%     │ 26.96% │ 22.78%    │ 10.03%      │
// │  1 │ PIXELUSDT    │ 144 │ 0.07% │ 0.17%    │ 23.61%  │ 27.88%     │ 9.65%  │ 17.33%    │ 12.27%      │
// │  2 │ PORTALUSDT   │ 161 │ 0.12% │ 0.16%    │ 27.33%  │ 26.77%     │ 18.78% │ 20.07%    │ 13.11%      │
// │  3 │ OMNIUSDT     │ 124 │ 0.09% │ 0.14%    │ 25.81%  │ 26.26%     │ 11.23% │ 14.16%    │ 12.75%      │
// │  4 │ XRPUSDT      │ 147 │ 0.14% │ 0.14%    │ 43.54%  │ 42.99%     │ 19.98% │ 14.74%    │ 7.83%       │
// │  5 │ LRCUSDT      │ 120 │ 0.12% │ 0.13%    │ 38.33%  │ 35.48%     │ 14.42% │ 12.53%    │ 9.79%       │
// │  6 │ 1000SATSUSDT │ 137 │ 0.06% │ 0.13%    │ 24.09%  │ 26.09%     │ 8.03%  │ 15.38%    │ 13.58%      │
// │  7 │ ENAUSDT      │ 168 │ 0.09% │ 0.13%    │ 25.00%  │ 26.40%     │ 15.85% │ 16.17%    │ 15.13%      │
// │  8 │ USTCUSDT     │ 114 │ 0.08% │ 0.12%    │ 25.44%  │ 27.37%     │ 8.81%  │ 11.82%    │ 13.05%      │
// │  9 │ CAKEUSDT     │ 175 │ 0.15% │ 0.12%    │ 40.57%  │ 37.98%     │ 25.64% │ 15.19%    │ 10.35%      │
// │ 10 │ 1000SHIBUSDT │ 140 │ 0.10% │ 0.11%    │ 35.00%  │ 33.65%     │ 13.42% │ 11.52%    │ 11.50%      │
// │ 11 │ CKBUSDT      │ 179 │ 0.07% │ 0.11%    │ 22.91%  │ 24.09%     │ 13.09% │ 14.66%    │ 15.56%      │
// │ 12 │ LUNA2USDT    │ 109 │ 0.05% │ 0.10%    │ 23.85%  │ 24.71%     │ 5.71%  │ 8.68%     │ 13.62%      │
// │ 13 │ LINAUSDT     │ 100 │ 0.05% │ 0.10%    │ 24.00%  │ 25.30%     │ 4.91%  │ 8.26%     │ 12.35%      │
// │ 14 │ BLURUSDT     │ 185 │ 0.10% │ 0.09%    │ 29.19%  │ 30.07%     │ 19.16% │ 13.48%    │ 14.49%      │
// │ 15 │ UMAUSDT      │ 160 │ 0.04% │ 0.09%    │ 25.62%  │ 28.32%     │ 6.44%  │ 10.35%    │ 13.52%      │
// │ 16 │ ARKMUSDT     │ 144 │ 0.11% │ 0.09%    │ 23.61%  │ 23.64%     │ 16.53% │ 9.86%     │ 14.63%      │
// │ 17 │ ALGOUSDT     │ 119 │ 0.06% │ 0.09%    │ 35.29%  │ 35.29%     │ 6.56%  │ 7.51%     │ 11.07%      │
// │ 18 │ ZETAUSDT     │ 164 │ 0.10% │ 0.08%    │ 31.10%  │ 29.23%     │ 15.61% │ 10.35%    │ 15.42%      │
// │ 19 │ BIGTIMEUSDT  │ 112 │ 0.06% │ 0.08%    │ 24.11%  │ 24.72%     │ 7.18%  │ 6.73%     │ 13.33%      │
// │ 20 │ GMXUSDT      │ 227 │ 0.09% │ 0.07%    │ 29.96%  │ 29.29%     │ 21.11% │ 10.05%    │ 15.57%      │
// │ 21 │ MASKUSDT     │ 180 │ 0.05% │ 0.07%    │ 34.44%  │ 33.87%     │ 8.25%  │ 8.11%     │ 12.70%      │
// │ 22 │ C98USDT      │ 125 │ 0.10% │ 0.06%    │ 32.00%  │ 31.25%     │ 12.05% │ 6.23%     │ 11.72%      │
// │ 23 │ MYROUSDT     │ 168 │ 0.03% │ 0.06%    │ 20.24%  │ 20.74%     │ 4.30%  │ 8.35%     │ 19.15%      │
// │ 24 │ MKRUSDT      │ 196 │ 0.01% │ 0.06%    │ 30.10%  │ 31.15%     │ 2.68%  │ 7.54%     │ 13.23%      │
// │ 25 │ GASUSDT      │ 135 │ 0.09% │ 0.06%    │ 37.78%  │ 34.29%     │ 11.95% │ 6.18%     │ 11.79%      │
// │ 26 │ ACEUSDT      │ 177 │ 0.09% │ 0.06%    │ 27.68%  │ 24.81%     │ 15.52% │ 7.15%     │ 17.33%      │
// │ 27 │ 1000LUNCUSDT │ 131 │ 0.05% │ 0.05%    │ 27.48%  │ 26.53%     │ 7.11%  │ 4.96%     │ 14.64%      │
// │ 28 │ NEOUSDT      │ 161 │ 0.00% │ 0.05%    │ 26.71%  │ 27.87%     │ 0.00%  │ 5.73%     │ 15.28%      │
// │ 29 │ HIFIUSDT     │ 189 │ 0.01% │ 0.05%    │ 25.93%  │ 27.08%     │ 2.44%  │ 6.61%     │ 17.65%      │
// │ 30 │ KAVAUSDT     │ 165 │ 0.04% │ 0.04%    │ 31.52%  │ 31.03%     │ 5.86%  │ 5.16%     │ 12.89%      │
// │ 31 │ VETUSDT      │ 148 │ 0.04% │ 0.04%    │ 31.76%  │ 30.69%     │ 6.16%  │ 4.38%     │ 13.21%      │
// │ 32 │ ADAUSDT      │ 151 │ 0.04% │ 0.04%    │ 35.76%  │ 36.54%     │ 5.87%  │ 3.97%     │ 11.69%      │
// │ 33 │ DENTUSDT     │ 117 │ 0.04% │ 0.04%    │ 29.06%  │ 28.00%     │ 5.20%  │ 3.76%     │ 14.88%      │
// │ 34 │ WUSDT        │ 155 │ 0.02% │ 0.04%    │ 21.29%  │ 22.12%     │ 3.63%  │ 4.10%     │ 17.53%      │
// │ 35 │ FXSUSDT      │ 179 │ 0.09% │ 0.03%    │ 34.64%  │ 31.09%     │ 16.48% │ 3.95%     │ 15.28%      │
// │ 36 │ BNTUSDT      │ 136 │ 0.02% │ 0.03%    │ 38.24%  │ 39.18%     │ 3.37%  │ 2.96%     │ 11.49%      │
// │ 37 │ XMRUSDT      │ 227 │ 0.09% │ 0.03%    │ 39.65%  │ 38.02%     │ 19.61% │ 3.43%     │ 11.98%      │
// │ 38 │ APEUSDT      │ 137 │ 0.02% │ 0.02%    │ 30.66%  │ 29.52%     │ 2.31%  │ 2.25%     │ 14.39%      │
// │ 39 │ ENSUSDT      │ 136 │ 0.05% │ 0.02%    │ 29.41%  │ 28.16%     │ 6.26%  │ 2.11%     │ 13.80%      │
// │ 40 │ RSRUSDT      │ 222 │ 0.06% │ 0.02%    │ 25.68%  │ 22.98%     │ 14.04% │ 3.00%     │ 21.03%      │
// │ 41 │ STXUSDT      │ 159 │ 0.07% │ 0.02%    │ 28.30%  │ 26.05%     │ 11.61% │ 2.21%     │ 17.33%      │
// │ 42 │ ATAUSDT      │ 138 │ 0.03% │ 0.01%    │ 24.64%  │ 23.64%     │ 3.66%  │ 1.30%     │ 17.24%      │
// │ 43 │ 1000RATSUSDT │ 188 │ 0.06% │ 0.01%    │ 19.15%  │ 17.72%     │ 11.96% │ 0.91%     │ 25.32%      │
// │ 44 │ SFPUSDT      │ 179 │ 0.00% │ 0.00%    │ 31.84%  │ 32.11%     │ 0.85%  │ 0.48%     │ 14.49%      │
// │ 45 │ ALICEUSDT    │ 116 │ 0.04% │ -0.00%   │ 30.17%  │ 27.66%     │ 4.87%  │ -0.32%    │ 14.59%      │
// │ 46 │ TRUUSDT      │ 200 │ 0.02% │ -0.01%   │ 23.50%  │ 20.39%     │ 4.08%  │ -1.89%    │ 23.19%      │
// │ 47 │ HIGHUSDT     │ 180 │ 0.08% │ -0.02%   │ 26.11%  │ 22.52%     │ 15.19% │ -2.37%    │ 21.75%      │
// │ 48 │ SUIUSDT      │ 178 │ 0.05% │ -0.02%   │ 26.97%  │ 24.62%     │ 8.44%  │ -2.99%    │ 19.07%      │
// │ 49 │ TNSRUSDT     │ 167 │ 0.03% │ -0.02%   │ 21.56%  │ 20.17%     │ 5.35%  │ -2.95%    │ 20.69%      │
// │ 50 │ BEAMXUSDT    │ 199 │ 0.04% │ -0.03%   │ 25.13%  │ 22.82%     │ 8.56%  │ -3.86%    │ 23.36%      │
// │ 51 │ ICXUSDT      │ 126 │ 0.00% │ -0.03%   │ 32.54%  │ 29.55%     │ 0.45%  │ -2.68%    │ 14.21%      │
// │ 52 │ TUSDT        │ 147 │ 0.04% │ -0.06%   │ 30.61%  │ 23.64%     │ 5.85%  │ -6.11%    │ 18.55%      │
// └────┴──────────────┴─────┴───────┴──────────┴─────────┴────────────┴────────┴───────────┴─────────────┘
