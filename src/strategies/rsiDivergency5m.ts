import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"TRUUSDT",
		"XMRUSDT",
		"XRPUSDT",
		"1000LUNCUSDT",
		"BLURUSDT",
		"BICOUSDT",
		"DYDXUSDT",
		"IDUSDT",
		"LRCUSDT",
		"ENSUSDT",
		"ARBUSDT",
		"MASKUSDT",
		"HIFIUSDT",
		"1000BONKUSDT",
		"CKBUSDT",
		"ORDIUSDT",
		"1000SATSUSDT",
		"CFXUSDT",
		"JUPUSDT",
		"ZETAUSDT",
		"ACEUSDT",
		"USTCUSDT",
		"TNSRUSDT",
		"STRKUSDT",
		"PIXELUSDT",
		"NFPUSDT",
		"PORTALUSDT",
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

//Stats summary:
// ┌────┬─────────────────┬──────────────────────────┬──────────────────────┬──────────────────────┬───────────────────────┬───────────┬─────────────┬───────┐
// │    │ SL              │ QTY                      │ WINRATE              │ AVPNL                │ ACCPNL                │ DD badRun │ PerDay      │ pairs │
// ├────┼─────────────────┼──────────────────────────┼──────────────────────┼──────────────────────┼───────────────────────┼───────────┼─────────────┼───────┤
// │  0 │ sl tp/sl MaxLen │ ps  wp      acc      fwd │ wp      acc      fwd │ wp      acc      fwd │ wp      acc      fwd  │           │ pnl     Qty │       │
// │  1 │ 6.00% 6 100     │ 90205 5811 885 312       │ 51.28% 53.79% 54.81% │ 0.08% 0.11% 0.05%    │ 436.73% 93.25% 15.09% │ 18.07% 10 │ 0.22% 2.13  │ 26    │
// │  2 │ 7.00% 7 100     │ 90205 5846 873 302       │ 51.44% 53.26% 53.97% │ 0.07% 0.10% 0.04%    │ 436.21% 90.98% 11.84% │ 17.91% 7  │ 0.22% 2.10  │ 26    │
// │  3 │ 7.00% 8 100     │ 90205 5846 872 302       │ 51.39% 53.21% 53.97% │ 0.07% 0.10% 0.04%    │ 428.95% 88.68% 11.84% │ 18.57% 7  │ 0.21% 2.10  │ 26    │
// │  4 │ 7.00% 6 100     │ 90205 5846 874 302       │ 51.47% 53.20% 53.97% │ 0.07% 0.10% 0.04%    │ 433.39% 88.12% 11.84% │ 18.62% 9  │ 0.21% 2.11  │ 26    │
// │  5 │ 6.00% 7 100     │ 90205 6105 894 315       │ 51.22% 53.13% 54.60% │ 0.07% 0.10% 0.05%    │ 435.53% 87.93% 16.39% │ 19.04% 10 │ 0.21% 2.15  │ 27    │
// │  6 │ 7.00% 9 100     │ 90205 5846 872 302       │ 51.37% 53.21% 53.97% │ 0.07% 0.10% 0.04%    │ 426.73% 86.72% 11.84% │ 18.92% 10 │ 0.21% 2.10  │ 26    │
// │  7 │ 5.00% 7 100     │ 90205 6105 915 325       │ 50.70% 52.68% 53.23% │ 0.07% 0.09% 0.05%    │ 426.64% 86.30% 16.33% │ 19.55% 11 │ 0.21% 2.20  │ 27    │
// │  8 │ 6.00% 8 100     │ 90205 6105 893 315       │ 51.17% 53.08% 54.60% │ 0.07% 0.10% 0.05%    │ 428.84% 85.73% 16.39% │ 19.35% 15 │ 0.21% 2.15  │ 27    │
// │  9 │ 5.00% 6 100     │ 90205 6105 919 325       │ 50.73% 52.56% 53.23% │ 0.07% 0.09% 0.05%    │ 422.44% 85.44% 16.33% │ 19.83% 8  │ 0.21% 2.21  │ 27    │
// │ 10 │ 5.00% 8 100     │ 90205 6105 917 325       │ 50.65% 52.67% 53.23% │ 0.07% 0.09% 0.05%    │ 406.64% 84.69% 16.33% │ 19.21% 9  │ 0.20% 2.21  │ 27    │
// │ 11 │ 6.00% 9 100     │ 90205 6105 893 315       │ 51.15% 53.08% 54.60% │ 0.07% 0.09% 0.05%    │ 427.19% 84.10% 16.39% │ 19.12% 11 │ 0.20% 2.15  │ 27    │
// │ 12 │ 6.00% 5 100     │ 90205 6105 900 315       │ 51.32% 52.89% 54.60% │ 0.07% 0.09% 0.04%    │ 438.39% 83.93% 13.54% │ 19.93% 7  │ 0.20% 2.17  │ 27    │
// │ 13 │ 5.00% 9 100     │ 90205 6105 917 325       │ 50.63% 52.67% 53.23% │ 0.07% 0.09% 0.05%    │ 404.99% 82.76% 16.33% │ 20.05% 9  │ 0.20% 2.21  │ 27    │
// │ 14 │ 5.00% 5 100     │ 90205 6105 920 325       │ 50.79% 52.07% 53.23% │ 0.07% 0.09% 0.04%    │ 414.58% 80.79% 13.48% │ 20.17% 10 │ 0.19% 2.21  │ 27    │
// │ 15 │ 7.00% 5 100     │ 90205 5846 877 302       │ 51.54% 52.68% 53.97% │ 0.08% 0.09% 0.04%    │ 441.03% 79.53% 11.84% │ 20.61% 8  │ 0.19% 2.11  │ 26    │
// │ 16 │ 4.00% 7 100     │ 90205 5498 942 330       │ 49.45% 51.80% 50.00% │ 0.06% 0.07% 0.02%    │ 335.92% 63.17% 6.39%  │ 22.59% 13 │ 0.15% 2.27  │ 24    │
// │ 17 │ 4.00% 5 100     │ 90205 5498 950 330       │ 49.56% 51.47% 50.61% │ 0.06% 0.06% 0.02%    │ 337.67% 56.61% 8.05%  │ 23.88% 10 │ 0.14% 2.29  │ 24    │
// │ 18 │ 4.00% 8 100     │ 90205 5498 944 330       │ 49.40% 51.59% 50.00% │ 0.06% 0.06% 0.02%    │ 333.04% 56.37% 5.79%  │ 23.33% 7  │ 0.14% 2.27  │ 24    │
// │ 19 │ 4.00% 9 100     │ 90205 5498 944 330       │ 49.38% 51.59% 50.00% │ 0.06% 0.06% 0.02%    │ 323.87% 54.39% 5.79%  │ 23.52% 8  │ 0.13% 2.27  │ 24    │
// │ 20 │ 4.00% 6 100     │ 90205 5239 940 329       │ 49.40% 51.06% 49.24% │ 0.06% 0.05% 0.00%    │ 329.07% 50.65% 1.01%  │ 24.71% 16 │ 0.12% 2.26  │ 23    │
// └────┴─────────────────┴──────────────────────────┴──────────────────────┴──────────────────────┴───────────────────────┴───────────┴─────────────┴───────┘
