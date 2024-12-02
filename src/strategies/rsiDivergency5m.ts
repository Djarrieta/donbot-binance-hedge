import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const rsiDivergency5m = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"BIGTIMEUSDT",
		"FXSUSDT",
		"CAKEUSDT",
		"DUSKUSDT",
		"1000SATSUSDT",
		"XLMUSDT",
		"SFPUSDT",
		"GMXUSDT",
		"1000RATSUSDT",
		"ORDIUSDT",
		"KAVAUSDT",
		"STMXUSDT",
		"ARKMUSDT",
		"1INCHUSDT",
		"USTCUSDT",
		"MKRUSDT",
		"EOSUSDT",
		"MASKUSDT",
		"BEAMXUSDT",
		"RDNTUSDT",
		"LRCUSDT",
		"XTZUSDT",
		"1000SHIBUSDT",
		"FILUSDT",
		"WLDUSDT",
		"SNXUSDT",
		"GASUSDT",
		"NTRNUSDT",
		"ACEUSDT",
		"STXUSDT",
		"ALGOUSDT",
		"XVSUSDT",
		"PENDLEUSDT",
		"1000LUNCUSDT",
		"DENTUSDT",
		"FLOWUSDT",
		"SUIUSDT",
		"TRUUSDT",
		"INJUSDT",
		"1000BONKUSDT",
		"XRPUSDT",
		"DEFIUSDT",
		"ICXUSDT",
		"ARPAUSDT",
		"ORBSUSDT",
		"C98USDT",
		"RSRUSDT",
		"TUSDT",
		"ATAUSDT",
		"ALICEUSDT",
		"HIFIUSDT",
		"BONDUSDT",
		"ZILUSDT",
		"LINAUSDT",
		"CELRUSDT",
		"SANDUSDT",
		"SXPUSDT",
		"ATOMUSDT",
		"RENUSDT",
		"OGNUSDT",
		"ARBUSDT",
		"XMRUSDT",
		"CFXUSDT",
		"BNTUSDT",
		"NEOUSDT",
		"HIGHUSDT",
		"CKBUSDT",
		"HOOKUSDT",
		"ENSUSDT",
		"NFPUSDT",
		"FLMUSDT",
		"BLURUSDT",
		"VETUSDT",
		"AIUSDT",
		"ZETAUSDT",
		"PIXELUSDT",
		"STRKUSDT",
		"MYROUSDT",
		"PORTALUSDT",
		"ENAUSDT",
		"TNSRUSDT",
		"OMNIUSDT",
		"IOUSDT",
		"RAREUSDT",
		"VOXELUSDT",
		"SUNUSDT",
		"GUSDT",
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
				if (sl < 1 / 100) sl = 1 / 100;
				if (sl > 10 / 100) sl = 10 / 100;
				const tp = sl * 2;

				response.positionSide = "LONG";
				response.sl = sl;
				response.tp = tp;
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
				if (sl < 1 / 100) sl = 1 / 100;
				if (sl > 10 / 100) sl = 10 / 100;
				const tp = sl * 2;

				response.sl = sl;
				response.tp = tp;
				response.positionSide = "SHORT";
			}
		}

		return response;
	},
});

// Stats summary:
// ┌────┬───────────────────┬──────────────────────┬──────────────────────┬─────────────────────┬─────────────────────────┬───────────┬───────┐
// │    │ sl tp maxLen      │ QTY ps wp acc fwd    │ WINRATE wp acc fwd   │ AVPNL wp acc fwd    │ ACCPNL wp acc fwd       │ DD badRun │ pairs │
// ├────┼───────────────────┼──────────────────────┼──────────────────────┼─────────────────────┼─────────────────────────┼───────────┼───────┤
// │  0 │ 1.00% 10.00% 100  │ 65442 15631 1411 437 │ 28.51% 27.92% 29.52% │ 0.14% 0.24% 0.15%   │ 2261.86% 340.20% 64.93% │ 64.44% 20 │ 87    │
// │  1 │ 1.00% 15.00% 100  │ 65442 16530 1417 443 │ 28.19% 27.03% 27.31% │ 0.15% 0.22% 0.02%   │ 2526.63% 305.43% 7.07%  │ 74.94% 23 │ 90    │
// │  2 │ 1.00% 3.00% 100   │ 65442 11967 1632 526 │ 33.70% 35.11% 32.32% │ 0.09% 0.15% 0.03%   │ 1047.17% 243.68% 16.22% │ 50.77% 17 │ 66    │
// │  3 │ 1.00% 7.00% 100   │ 65442 16012 1463 459 │ 28.59% 28.43% 30.07% │ 0.12% 0.16% 0.19%   │ 1993.80% 237.79% 87.40% │ 72.39% 17 │ 90    │
// │  4 │ 1.00% 5.00% 100   │ 65442 15458 1568 498 │ 29.42% 29.02% 29.32% │ 0.11% 0.13% 0.09%   │ 1651.51% 208.06% 42.87% │ 70.66% 25 │ 86    │
// │  5 │ 3.00% 10.00% 100  │ 65442 15956 849 270  │ 48.65% 49.71% 48.15% │ 0.07% 0.16% 0.01%   │ 1146.67% 136.08% 2.01%  │ 24.07% 10 │ 90    │
// │  6 │ 1.00% 1.00% 100   │ 65442 13207 2723 878 │ 55.04% 54.06% 52.39% │ 0.05% 0.03% -0.01%  │ 689.99% 90.40% -4.87%   │ 55.53% 11 │ 74    │
// │  7 │ 3.00% 7.00% 100   │ 65442 15010 882 281  │ 49.17% 47.96% 46.26% │ 0.07% 0.10% -0.04%  │ 1024.75% 85.83% -10.84% │ 28.60% 10 │ 87    │
// │  8 │ 3.00% 15.00% 100  │ 65442 17393 864 273  │ 48.33% 45.83% 47.25% │ 0.07% 0.09% -0.01%  │ 1256.79% 74.63% -3.71%  │ 34.92% 11 │ 96    │
// │  9 │ 3.00% 3.00% 100   │ 65442 9309 1000 330  │ 54.84% 55.40% 51.21% │ 0.05% 0.06% -0.03%  │ 440.37% 63.99% -10.58%  │ 24.19% 10 │ 58    │
// │ 10 │ 5.00% 15.00% 100  │ 65442 16371 727 242  │ 51.96% 53.92% 50.41% │ 0.05% 0.06% 0.01%   │ 851.12% 44.87% 2.74%    │ 20.51% 9  │ 94    │
// │ 11 │ 3.00% 5.00% 100   │ 65442 14841 939 303  │ 50.02% 48.78% 44.88% │ 0.05% 0.04% -0.09%  │ 773.80% 34.92% -28.15%  │ 37.28% 9  │ 87    │
// │ 12 │ 5.00% 10.00% 100  │ 65442 15026 734 243  │ 52.31% 53.81% 49.79% │ 0.05% 0.04% -0.00%  │ 733.66% 31.83% -0.34%   │ 22.34% 8  │ 87    │
// │ 13 │ 10.00% 15.00% 100 │ 65442 8369 618 207   │ 51.69% 53.07% 43.96% │ 0.02% 0.04% -0.06%  │ 183.60% 26.53% -11.77%  │ 10.28% 10 │ 53    │
// │ 14 │ 5.00% 7.00% 100   │ 65442 13673 746 242  │ 53.03% 52.82% 52.89% │ 0.05% 0.04% -0.01%  │ 670.94% 26.47% -2.20%   │ 23.32% 13 │ 80    │
// │ 15 │ 7.00% 10.00% 100  │ 65442 11164 669 222  │ 52.94% 53.96% 50.45% │ 0.03% 0.04% -0.00%  │ 388.01% 25.68% -0.21%   │ 17.02% 7  │ 70    │
// │ 16 │ 5.00% 3.00% 100   │ 65442 9276 862 299   │ 59.06% 59.05% 58.53% │ 0.03% 0.03% 0.00%   │ 309.37% 21.88% 0.90%    │ 20.71% 8  │ 60    │
// │ 17 │ 5.00% 5.00% 100   │ 65442 13137 776 250  │ 54.01% 53.48% 54.00% │ 0.04% 0.02% -0.00%  │ 554.94% 15.18% -0.21%   │ 24.81% 10 │ 77    │
// │ 18 │ 7.00% 15.00% 100  │ 65442 12321 676 221  │ 52.39% 51.92% 50.23% │ 0.04% 0.02% -0.04%  │ 468.99% 15.14% -9.69%   │ 21.92% 8  │ 76    │
// │ 19 │ 10.00% 10.00% 100 │ 65442 6699 596 203   │ 52.74% 53.19% 44.83% │ 0.02% 0.02% -0.04%  │ 144.08% 14.26% -8.76%   │ 11.32% 10 │ 45    │
// │ 20 │ 3.00% 1.00% 100   │ 65442 6419 1426 488  │ 77.44% 76.02% 69.67% │ 0.03% 0.01% -0.08%  │ 190.51% 13.60% -37.31%  │ 26.22% 4  │ 42    │
// │ 21 │ 7.00% 5.00% 100   │ 65442 10575 714 241  │ 54.51% 55.32% 50.21% │ 0.03% 0.02% -0.05%  │ 308.04% 13.40% -12.66%  │ 16.86% 10 │ 65    │
// │ 22 │ 7.00% 1.00% 100   │ 65442 2118 771 314   │ 83.66% 83.53% 77.07% │ 0.02% 0.01% -0.05%  │ 33.83% 11.06% -16.46%   │ 6.77% 4   │ 18    │
// │ 23 │ 7.00% 3.00% 100   │ 65442 6871 739 256   │ 59.34% 58.86% 53.52% │ 0.02% 0.01% -0.03%  │ 159.73% 10.14% -8.66%   │ 14.29% 9  │ 46    │
// │ 24 │ 7.00% 7.00% 100   │ 65442 11017 692 224  │ 53.31% 52.89% 51.34% │ 0.03% 0.01% -0.01%  │ 366.91% 8.92% -2.85%    │ 20.24% 11 │ 67    │
// │ 25 │ 5.00% 1.00% 100   │ 65442 3861 1025 387  │ 82.18% 80.68% 75.19% │ 0.02% 0.00% -0.05%  │ 84.26% 4.84% -20.16%    │ 15.89% 3  │ 29    │
// │ 26 │ 10.00% 1.00% 100  │ 65442 548 304 251    │ 91.97% 91.12% 78.09% │ 0.01% 0.01% -0.04%  │ 5.49% 2.93% -9.79%      │ 3.67% 2   │ 11    │
// │ 27 │ 15.00% 7.00% 100  │ 65442 2029 439 168   │ 53.03% 52.62% 46.43% │ 0.02% 0.00% -0.03%  │ 31.55% 0.87% -4.43%     │ 8.93% 9   │ 18    │
// │ 28 │ 15.00% 1.00% 100  │ 65442 56 31 222      │ 96.43% 93.55% 78.83% │ 0.02% 0.01% -0.04%  │ 0.88% 0.46% -8.33%      │ 0.02% 1   │ 8     │
// │ 29 │ 15.00% 3.00% 100  │ 65442 514 230 177    │ 64.20% 59.57% 53.67% │ 0.02% -0.01% -0.02% │ 9.25% -1.20% -3.99%     │ 5.72% 5   │ 11    │
// │ 30 │ 10.00% 7.00% 100  │ 65442 6849 625 209   │ 53.54% 51.04% 48.80% │ 0.02% -0.00% -0.01% │ 144.02% -2.61% -1.54%   │ 17.12% 8  │ 46    │
// │ 31 │ 15.00% 5.00% 100  │ 65442 1363 380 167   │ 55.83% 51.05% 46.71% │ 0.02% -0.01% -0.03% │ 21.43% -3.06% -5.29%    │ 9.44% 13  │ 15    │
// │ 32 │ 15.00% 15.00% 100 │ 65442 2415 447 168   │ 51.30% 46.98% 47.62% │ 0.02% -0.02% -0.02% │ 40.63% -6.91% -3.84%    │ 14.93% 7  │ 18    │
// │ 33 │ 15.00% 10.00% 100 │ 65442 1726 406 156   │ 53.19% 48.28% 49.36% │ 0.02% -0.02% -0.00% │ 30.76% -8.72% -0.07%    │ 15.07% 10 │ 14    │
// │ 34 │ 10.00% 3.00% 100  │ 65442 3136 571 213   │ 58.77% 55.17% 50.70% │ 0.01% -0.02% -0.05% │ 45.04% -10.64% -11.27%  │ 17.93% 8  │ 27    │
// │ 35 │ 10.00% 5.00% 100  │ 65442 5893 635 216   │ 54.71% 51.02% 47.69% │ 0.02% -0.03% -0.02% │ 112.35% -16.06% -5.26%  │ 24.72% 8  │ 41    │
// └────┴───────────────────┴──────────────────────┴──────────────────────┴─────────────────────┴─────────────────────────┴───────────┴───────┘
