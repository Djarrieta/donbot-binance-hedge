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
// ┌───┬─────────────────────┬───────────────────┬──────────────────────┬───────────────────┬──────────────────────┬─────────────────────┬───────┐
// │   │ SL TPSLRatio MaxLen │ QTY ps wp acc fwd │ WINRATE wp acc fwd   │ AVPNL wp acc fwd  │ ACCPNL wp acc fwd    │ DD badRun pnlPerDay │ pairs │
// ├───┼─────────────────────┼───────────────────┼──────────────────────┼───────────────────┼──────────────────────┼─────────────────────┼───────┤
// │ 0 │ 1.00% 9 100         │ 11119 8140 106 48 │ 28.45% 44.34% 35.42% │ 0.05% 0.16% 0.10% │ 436.51% 16.91% 5.03% │ 7.31% 6 0.08%       │ 51    │
// └───┴─────────────────────┴───────────────────┴──────────────────────┴───────────────────┴──────────────────────┴─────────────────────┴───────┘
// Stats per pair
// ┌────┬──────────────┬─────┬───────┬──────────┬─────────┬────────────┬────────┬───────────┬─────────────┐
// │    │ pair         │ qty │ avPnl │ avPnlAcc │ winRate │ winRateAcc │ accPnl │ accPnlAcc │ drawdownAcc │
// ├────┼──────────────┼─────┼───────┼──────────┼─────────┼────────────┼────────┼───────────┼─────────────┤
// │  0 │ HOOKUSDT     │ 152 │ 0.14% │ 0.19%    │ 31.58%  │ 32.71%     │ 20.58% │ 20.56%    │ 10.88%      │
// │  1 │ XRPUSDT      │ 146 │ 0.16% │ 0.16%    │ 45.21%  │ 44.34%     │ 23.77% │ 16.91%    │ 7.42%       │
// │  2 │ PORTALUSDT   │ 164 │ 0.10% │ 0.14%    │ 26.83%  │ 26.15%     │ 17.20% │ 18.49%    │ 13.66%      │
// │  3 │ PIXELUSDT    │ 148 │ 0.05% │ 0.14%    │ 22.97%  │ 26.85%     │ 7.54%  │ 15.22%    │ 13.56%      │
// │  4 │ CAKEUSDT     │ 175 │ 0.15% │ 0.13%    │ 40.57%  │ 38.28%     │ 26.25% │ 16.32%    │ 10.11%      │
// │  5 │ OMNIUSDT     │ 128 │ 0.07% │ 0.12%    │ 25.00%  │ 25.49%     │ 9.13%  │ 12.58%    │ 13.28%      │
// │  6 │ ENAUSDT      │ 174 │ 0.09% │ 0.10%    │ 24.71%  │ 25.38%     │ 15.33% │ 13.54%    │ 15.88%      │
// │  7 │ 1000SHIBUSDT │ 142 │ 0.09% │ 0.10%    │ 34.51%  │ 33.02%     │ 12.37% │ 10.47%    │ 12.42%      │
// │  8 │ LUNA2USDT    │ 111 │ 0.04% │ 0.09%    │ 23.42%  │ 24.42%     │ 4.66%  │ 8.15%     │ 13.74%      │
// │  9 │ CKBUSDT      │ 183 │ 0.06% │ 0.09%    │ 22.95%  │ 24.11%     │ 11.67% │ 13.24%    │ 16.84%      │
// │ 10 │ USTCUSDT     │ 119 │ 0.05% │ 0.09%    │ 24.37%  │ 26.00%     │ 6.18%  │ 9.19%     │ 13.80%      │
// │ 11 │ LRCUSDT      │ 125 │ 0.08% │ 0.09%    │ 36.00%  │ 32.99%     │ 10.00% │ 8.64%     │ 11.79%      │
// │ 12 │ UMAUSDT      │ 159 │ 0.07% │ 0.09%    │ 26.42%  │ 28.07%     │ 11.73% │ 9.83%     │ 14.01%      │
// │ 13 │ BLURUSDT     │ 181 │ 0.10% │ 0.08%    │ 28.73%  │ 29.29%     │ 17.94% │ 11.74%    │ 14.87%      │
// │ 14 │ 1000SATSUSDT │ 140 │ 0.01% │ 0.08%    │ 22.86%  │ 24.79%     │ 1.69%  │ 9.57%     │ 15.17%      │
// │ 15 │ LINAUSDT     │ 101 │ 0.02% │ 0.07%    │ 22.77%  │ 24.39%     │ 1.58%  │ 5.99%     │ 13.35%      │
// │ 16 │ NEOUSDT      │ 163 │ 0.01% │ 0.06%    │ 27.61%  │ 28.80%     │ 2.35%  │ 7.55%     │ 14.80%      │
// │ 17 │ MASKUSDT     │ 187 │ 0.03% │ 0.06%    │ 33.69%  │ 33.59%     │ 6.11%  │ 7.56%     │ 13.08%      │
// │ 18 │ FXSUSDT      │ 184 │ 0.10% │ 0.06%    │ 34.24%  │ 31.15%     │ 18.61% │ 7.13%     │ 14.27%      │
// │ 19 │ ZETAUSDT     │ 165 │ 0.08% │ 0.06%    │ 30.30%  │ 28.24%     │ 12.76% │ 7.50%     │ 16.50%      │
// │ 20 │ MKRUSDT      │ 193 │ 0.01% │ 0.06%    │ 30.05%  │ 31.15%     │ 2.29%  │ 6.87%     │ 13.76%      │
// │ 21 │ C98USDT      │ 123 │ 0.10% │ 0.06%    │ 31.71%  │ 30.53%     │ 11.69% │ 5.35%     │ 12.56%      │
// │ 22 │ MYROUSDT     │ 170 │ 0.02% │ 0.05%    │ 20.00%  │ 20.44%     │ 3.24%  │ 7.30%     │ 20.03%      │
// │ 23 │ ACEUSDT      │ 179 │ 0.08% │ 0.05%    │ 27.37%  │ 24.62%     │ 14.47% │ 6.62%     │ 18.04%      │
// │ 24 │ ARKMUSDT     │ 143 │ 0.09% │ 0.05%    │ 23.08%  │ 22.73%     │ 12.67% │ 5.47%     │ 16.02%      │
// │ 25 │ VETUSDT      │ 148 │ 0.04% │ 0.04%    │ 31.76%  │ 30.69%     │ 6.16%  │ 4.38%     │ 12.97%      │
// │ 26 │ GASUSDT      │ 138 │ 0.08% │ 0.04%    │ 36.96%  │ 33.33%     │ 10.37% │ 4.60%     │ 12.14%      │
// │ 27 │ HIFIUSDT     │ 190 │ 0.01% │ 0.04%    │ 25.79%  │ 26.90%     │ 1.91%  │ 6.09%     │ 18.19%      │
// │ 28 │ BIGTIMEUSDT  │ 114 │ 0.04% │ 0.04%    │ 23.68%  │ 23.91%     │ 4.69%  │ 3.72%     │ 13.83%      │
// │ 29 │ GMXUSDT      │ 231 │ 0.07% │ 0.04%    │ 29.00%  │ 27.78%     │ 16.74% │ 5.69%     │ 17.23%      │
// │ 30 │ XMRUSDT      │ 224 │ 0.10% │ 0.04%    │ 40.63%  │ 38.33%     │ 22.29% │ 4.39%     │ 11.66%      │
// │ 31 │ ADAUSDT      │ 153 │ 0.03% │ 0.03%    │ 35.29%  │ 36.19%     │ 4.81%  │ 3.44%     │ 11.77%      │
// │ 32 │ BNTUSDT      │ 138 │ 0.02% │ 0.03%    │ 36.96%  │ 38.14%     │ 2.18%  │ 2.82%     │ 11.66%      │
// │ 33 │ KAVAUSDT     │ 163 │ 0.01% │ 0.03%    │ 30.67%  │ 30.43%     │ 1.98%  │ 3.12%     │ 13.59%      │
// │ 34 │ WUSDT        │ 157 │ 0.02% │ 0.03%    │ 21.02%  │ 21.74%     │ 2.58%  │ 3.05%     │ 18.19%      │
// │ 35 │ RSRUSDT      │ 220 │ 0.07% │ 0.03%    │ 25.91%  │ 23.27%     │ 15.09% │ 4.05%     │ 20.56%      │
// │ 36 │ APEUSDT      │ 143 │ 0.01% │ 0.02%    │ 30.07%  │ 29.36%     │ 1.02%  │ 2.01%     │ 14.84%      │
// │ 37 │ STXUSDT      │ 159 │ 0.04% │ 0.01%    │ 27.04%  │ 25.62%     │ 6.63%  │ 1.23%     │ 17.74%      │
// │ 38 │ ENSUSDT      │ 142 │ 0.02% │ 0.00%    │ 28.17%  │ 27.10%     │ 3.10%  │ 0.01%     │ 15.29%      │
// │ 39 │ SFPUSDT      │ 178 │ 0.01% │ -0.00%   │ 32.02%  │ 31.82%     │ 1.38%  │ -0.04%    │ 15.62%      │
// │ 40 │ 1000RATSUSDT │ 191 │ 0.05% │ -0.00%   │ 18.85%  │ 17.50%     │ 10.38% │ -0.14%    │ 25.13%      │
// │ 41 │ ATAUSDT      │ 143 │ 0.01% │ -0.00%   │ 23.78%  │ 23.01%     │ 1.02%  │ -0.28%    │ 18.42%      │
// │ 42 │ 1000LUNCUSDT │ 134 │ 0.01% │ -0.00%   │ 26.12%  │ 25.25%     │ 0.77%  │ -0.33%    │ 15.37%      │
// │ 43 │ HIGHUSDT     │ 180 │ 0.08% │ -0.01%   │ 26.11%  │ 22.67%     │ 14.79% │ -1.17%    │ 21.11%      │
// │ 44 │ DENTUSDT     │ 117 │ 0.00% │ -0.01%   │ 28.21%  │ 27.00%     │ 0.44%  │ -1.01%    │ 16.21%      │
// │ 45 │ TRUUSDT      │ 198 │ 0.03% │ -0.01%   │ 23.74%  │ 20.39%     │ 5.13%  │ -1.89%    │ 23.13%      │
// │ 46 │ ALICEUSDT    │ 115 │ 0.02% │ -0.02%   │ 28.70%  │ 26.32%     │ 2.49%  │ -2.28%    │ 15.62%      │
// │ 47 │ TUSDT        │ 152 │ 0.05% │ -0.03%   │ 30.26%  │ 23.89%     │ 7.98%  │ -2.92%    │ 17.91%      │
// │ 48 │ SUIUSDT      │ 182 │ 0.03% │ -0.03%   │ 26.37%  │ 24.24%     │ 6.33%  │ -4.05%    │ 19.97%      │
// │ 49 │ TNSRUSDT     │ 173 │ 0.01% │ -0.05%   │ 20.81%  │ 19.35%     │ 2.19%  │ -5.58%    │ 22.07%      │
// │ 50 │ BEAMXUSDT    │ 202 │ 0.01% │ -0.07%   │ 24.26%  │ 21.71%     │ 2.22%  │ -10.20%   │ 26.04%      │
// └────┴──────────────┴─────┴───────┴──────────┴─────────┴────────────┴────────┴───────────┴─────────────┘
