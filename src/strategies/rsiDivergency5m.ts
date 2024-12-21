import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
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
// ┌───┬─────────────────────┬───────────────────┬──────────────────────┬───────────────────┬──────────────────────┬───────────┬────────────────┬───────┐
// │   │ SL TPSLRatio MaxLen │ QTY ps wp acc fwd │ WINRATE wp acc fwd   │ AVPNL wp acc fwd  │ ACCPNL wp acc fwd    │ DD badRun │ PerDay pnl Qty │ pairs │
// ├───┼─────────────────────┼───────────────────┼──────────────────────┼───────────────────┼──────────────────────┼───────────┼────────────────┼───────┤
// │ 0 │ 1.00% 9 100         │ 11224 8376 108 49 │ 28.70% 47.22% 30.61% │ 0.04% 0.17% 0.09% │ 359.39% 18.85% 4.32% │ 6.30% 6   │ 0.09%  0.52    │ 53    │
// └───┴─────────────────────┴───────────────────┴──────────────────────┴───────────────────┴──────────────────────┴───────────┴────────────────┴───────┘
// Stats per pair
// ┌────┬──────────────┬─────┬────────┬──────────┬─────────┬────────────┬────────┬───────────┬─────────────┐
// │    │ pair         │ qty │ avPnl  │ avPnlAcc │ winRate │ winRateAcc │ accPnl │ accPnlAcc │ drawdownAcc │
// ├────┼──────────────┼─────┼────────┼──────────┼─────────┼────────────┼────────┼───────────┼─────────────┤
// │  0 │ HOOKUSDT     │ 151 │ 0.14%  │ 0.20%    │ 31.79%  │ 33.02%     │ 20.88% │ 20.86%    │ 10.24%      │
// │  1 │ XRPUSDT      │ 143 │ 0.20%  │ 0.19%    │ 48.95%  │ 47.57%     │ 28.46% │ 19.13%    │ 6.52%       │
// │  2 │ USTCUSDT     │ 121 │ 0.10%  │ 0.15%    │ 25.62%  │ 27.45%     │ 12.03% │ 15.04%    │ 12.63%      │
// │  3 │ PORTALUSDT   │ 164 │ 0.11%  │ 0.14%    │ 27.44%  │ 26.72%     │ 18.09% │ 18.86%    │ 13.10%      │
// │  4 │ ENAUSDT      │ 179 │ 0.13%  │ 0.14%    │ 25.70%  │ 26.12%     │ 22.66% │ 18.91%    │ 15.09%      │
// │  5 │ OMNIUSDT     │ 140 │ 0.08%  │ 0.12%    │ 25.71%  │ 25.45%     │ 10.91% │ 13.14%    │ 13.42%      │
// │  6 │ LRCUSDT      │ 117 │ 0.10%  │ 0.12%    │ 38.46%  │ 35.96%     │ 11.64% │ 10.27%    │ 9.47%       │
// │  7 │ LUNA2USDT    │ 109 │ 0.05%  │ 0.11%    │ 23.85%  │ 25.00%     │ 5.71%  │ 9.21%     │ 13.21%      │
// │  8 │ MASKUSDT     │ 181 │ 0.07%  │ 0.11%    │ 35.91%  │ 35.54%     │ 13.07% │ 13.10%    │ 11.55%      │
// │  9 │ BLURUSDT     │ 177 │ 0.11%  │ 0.11%    │ 29.38%  │ 30.37%     │ 20.05% │ 14.37%    │ 13.39%      │
// │ 10 │ PIXELUSDT    │ 144 │ 0.02%  │ 0.10%    │ 22.92%  │ 26.92%     │ 3.00%  │ 10.68%    │ 12.95%      │
// │ 11 │ MKRUSDT      │ 183 │ 0.05%  │ 0.10%    │ 32.24%  │ 33.91%     │ 8.63%  │ 11.63%    │ 11.73%      │
// │ 12 │ CAKEUSDT     │ 181 │ 0.11%  │ 0.09%    │ 39.23%  │ 36.92%     │ 20.37% │ 11.07%    │ 11.10%      │
// │ 13 │ NEOUSDT      │ 166 │ 0.05%  │ 0.08%    │ 30.12%  │ 30.65%     │ 7.50%  │ 10.50%    │ 13.58%      │
// │ 14 │ UMAUSDT      │ 159 │ 0.07%  │ 0.08%    │ 26.42%  │ 28.07%     │ 10.93% │ 9.02%     │ 13.80%      │
// │ 15 │ FXSUSDT      │ 180 │ 0.08%  │ 0.08%    │ 33.89%  │ 32.77%     │ 14.92% │ 9.04%     │ 13.55%      │
// │ 16 │ APEUSDT      │ 146 │ 0.05%  │ 0.07%    │ 31.51%  │ 31.25%     │ 7.20%  │ 8.18%     │ 12.68%      │
// │ 17 │ CKBUSDT      │ 182 │ 0.02%  │ 0.06%    │ 22.53%  │ 23.94%     │ 3.53%  │ 8.81%     │ 17.30%      │
// │ 18 │ 1000SATSUSDT │ 142 │ -0.00% │ 0.06%    │ 23.24%  │ 24.58%     │ -0.32% │ 6.52%     │ 15.58%      │
// │ 19 │ ZETAUSDT     │ 171 │ 0.06%  │ 0.05%    │ 29.82%  │ 28.68%     │ 9.81%  │ 7.47%     │ 16.80%      │
// │ 20 │ ADAUSDT      │ 153 │ 0.04%  │ 0.05%    │ 35.29%  │ 36.79%     │ 5.94%  │ 5.42%     │ 11.18%      │
// │ 21 │ BNTUSDT      │ 136 │ 0.03%  │ 0.05%    │ 37.50%  │ 38.95%     │ 3.73%  │ 4.37%     │ 10.93%      │
// │ 22 │ LINAUSDT     │ 89  │ -0.01% │ 0.04%    │ 22.47%  │ 23.94%     │ -0.78% │ 3.10%     │ 12.64%      │
// │ 23 │ GMXUSDT      │ 233 │ 0.07%  │ 0.04%    │ 28.76%  │ 27.97%     │ 15.69% │ 6.22%     │ 16.91%      │
// │ 24 │ GASUSDT      │ 142 │ 0.08%  │ 0.04%    │ 37.32%  │ 33.33%     │ 11.08% │ 4.66%     │ 12.55%      │
// │ 25 │ BIGTIMEUSDT  │ 113 │ -0.04% │ 0.04%    │ 22.12%  │ 23.91%     │ -4.30% │ 3.72%     │ 13.79%      │
// │ 26 │ C98USDT      │ 113 │ 0.07%  │ 0.04%    │ 31.86%  │ 31.03%     │ 8.12%  │ 3.07%     │ 12.02%      │
// │ 27 │ XMRUSDT      │ 221 │ 0.10%  │ 0.03%    │ 41.18%  │ 38.84%     │ 23.12% │ 4.23%     │ 11.52%      │
// │ 28 │ MYROUSDT     │ 178 │ -0.01% │ 0.03%    │ 19.10%  │ 19.72%     │ -0.97% │ 4.67%     │ 21.34%      │
// │ 29 │ ALGOUSDT     │ 120 │ -0.01% │ 0.03%    │ 33.33%  │ 34.09%     │ -0.79% │ 2.34%     │ 12.23%      │
// │ 30 │ WUSDT        │ 159 │ 0.01%  │ 0.02%    │ 20.75%  │ 21.37%     │ 1.52%  │ 2.00%     │ 18.68%      │
// │ 31 │ ARKMUSDT     │ 147 │ 0.06%  │ 0.02%    │ 22.45%  │ 21.74%     │ 9.54%  │ 1.81%     │ 17.24%      │
// │ 32 │ VETUSDT      │ 147 │ 0.01%  │ 0.02%    │ 29.93%  │ 29.29%     │ 1.55%  │ 1.53%     │ 14.55%      │
// │ 33 │ RSRUSDT      │ 227 │ 0.03%  │ 0.01%    │ 25.11%  │ 23.03%     │ 6.97%  │ 1.22%     │ 21.57%      │
// │ 34 │ HIGHUSDT     │ 176 │ 0.09%  │ 0.00%    │ 27.27%  │ 23.97%     │ 16.64% │ 0.68%     │ 19.96%      │
// │ 35 │ HIFIUSDT     │ 189 │ -0.02% │ 0.00%    │ 25.40%  │ 26.57%     │ -4.21% │ 0.50%     │ 18.18%      │
// │ 36 │ DENTUSDT     │ 115 │ 0.02%  │ -0.00%   │ 28.70%  │ 27.27%     │ 1.95%  │ -0.02%    │ 15.23%      │
// │ 37 │ 1000LUNCUSDT │ 131 │ -0.01% │ -0.01%   │ 27.48%  │ 26.80%     │ -1.65% │ -0.58%    │ 14.66%      │
// │ 38 │ SUIUSDT      │ 181 │ 0.07%  │ -0.01%   │ 27.62%  │ 25.19%     │ 12.33% │ -1.01%    │ 18.43%      │
// │ 39 │ ACEUSDT      │ 177 │ 0.03%  │ -0.01%   │ 25.99%  │ 23.26%     │ 5.22%  │ -1.26%    │ 21.03%      │
// │ 40 │ TRUUSDT      │ 191 │ 0.02%  │ -0.02%   │ 23.04%  │ 19.73%     │ 3.60%  │ -2.45%    │ 23.39%      │
// │ 41 │ ALICEUSDT    │ 113 │ 0.00%  │ -0.02%   │ 29.20%  │ 27.66%     │ 0.43%  │ -1.63%    │ 14.63%      │
// │ 42 │ TUSDT        │ 149 │ 0.06%  │ -0.02%   │ 30.87%  │ 24.55%     │ 8.73%  │ -2.18%    │ 16.85%      │
// │ 43 │ 1000RATSUSDT │ 192 │ 0.04%  │ -0.02%   │ 18.23%  │ 16.77%     │ 6.98%  │ -3.54%    │ 27.54%      │
// │ 44 │ 1000SHIBUSDT │ 139 │ -0.00% │ -0.02%   │ 33.09%  │ 30.39%     │ -0.29% │ -2.54%    │ 15.51%      │
// │ 45 │ SFPUSDT      │ 178 │ 0.01%  │ -0.03%   │ 33.71%  │ 31.53%     │ 1.45%  │ -2.78%    │ 15.74%      │
// │ 46 │ KAVAUSDT     │ 165 │ -0.02% │ -0.03%   │ 30.30%  │ 28.45%     │ -2.51% │ -3.04%    │ 16.22%      │
// │ 47 │ ATAUSDT      │ 144 │ -0.02% │ -0.03%   │ 23.61%  │ 22.81%     │ -2.36% │ -3.67%    │ 19.09%      │
// │ 48 │ ENSUSDT      │ 148 │ -0.01% │ -0.04%   │ 29.05%  │ 27.27%     │ -0.86% │ -4.54%    │ 16.54%      │
// │ 49 │ ICXUSDT      │ 131 │ -0.02% │ -0.04%   │ 31.30%  │ 28.26%     │ -2.16% │ -4.06%    │ 14.66%      │
// │ 50 │ TNSRUSDT     │ 183 │ -0.01% │ -0.06%   │ 20.22%  │ 19.08%     │ -1.54% │ -7.74%    │ 22.88%      │
// │ 51 │ STXUSDT      │ 157 │ -0.02% │ -0.07%   │ 25.48%  │ 23.53%     │ -3.06% │ -8.47%    │ 22.26%      │
// │ 52 │ BEAMXUSDT    │ 203 │ -0.04% │ -0.11%   │ 22.17%  │ 20.53%     │ -8.78% │ -16.52%   │ 29.60%      │
// └────┴──────────────┴─────┴────────┴──────────┴─────────┴────────────┴────────┴───────────┴─────────────┘
