import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"XMRUSDT",
		"ZENUSDT",
		"SANDUSDT",
		"XRPUSDT",
		"LRCUSDT",
		"CTSIUSDT",
		"C98USDT",
		"TRUUSDT",
		"PEOPLEUSDT",
		"SUIUSDT",
		"CKBUSDT",
		"BLURUSDT",
		"LITUSDT",
		"CFXUSDT",
		"ARBUSDT",
		"TLMUSDT",
		"BEAMXUSDT",
		"UMAUSDT",
		"1000LUNCUSDT",
		"TIAUSDT",
		"BICOUSDT",
		"1000BONKUSDT",
		"BIGTIMEUSDT",
		"ORDIUSDT",
		"ACEUSDT",
		"ZETAUSDT",
		"NFPUSDT",
		"ENAUSDT",
		"JUPUSDT",
		"TNSRUSDT",
		"MYROUSDT",
		"PORTALUSDT",
		"USTCUSDT",
		"PIXELUSDT",
		"STRKUSDT",
		"WUSDT",
		"1000SATSUSDT",
		"OMNIUSDT",
		"REZUSDT",
		"ETHFIUSDT",
		"SYNUSDT",
		"BANANAUSDT",
		"VIDTUSDT",
		"FLUXUSDT",
		"VOXELUSDT",
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

// ┌────┬─────────────────┬────────────────────────┬─────────────────────────┬─────────────────────────────┬───────────────┬────────┬─────────────┐
// │    │ SL              │ WINRATE                │ AVPNL                   │ ACCPNL                      │ Drawdown      │ BadRun │ PerDay      │
// ├────┼─────────────────┼────────────────────────┼─────────────────────────┼─────────────────────────────┼───────────────┼────────┼─────────────┤
// │  0 │ sl tp/sl MaxLen │ all     accWP      fwd │ all      accWP      fwd │ all      accWP      fwd     │ DD MC         │ BR MC  │ pnl     Qty │
// │  1 │ 7.00% 5 100     │ 46.49% 49.44% 47.18%   │ -0.05% 0.02% -0.02%     │ -3643.03% 346.83% -1245.16% │ 14.75% 17.71% │ 7 13   │ 0.34% 19.40 │
// │  2 │ 7.00% 7 100     │ 46.42% 49.15% 47.16%   │ -0.05% 0.02% -0.02%     │ -3674.45% 340.14% -1227.14% │ 15.34% 17.87% │ 7 7    │ 0.33% 17.09 │
// │  3 │ 6.00% 6 100     │ 46.18% 49.03% 46.89%   │ -0.05% 0.02% -0.03%     │ -3600.88% 331.74% -1362.18% │ 14.22% 16.35% │ 7 6    │ 0.32% 18.70 │
// │  4 │ 5.00% 7 100     │ 45.65% 48.36% 46.34%   │ -0.05% 0.02% -0.03%     │ -3653.37% 310.51% -1550.21% │ 15.10% 16.26% │ 7 8    │ 0.30% 18.74 │
// │  5 │ 6.00% 5 100     │ 46.23% 49.05% 46.90%   │ -0.05% 0.02% -0.03%     │ -3554.25% 294.36% -1375.40% │ 13.63% 16.18% │ 7 7    │ 0.29% 18.25 │
// │  6 │ 6.00% 7 100     │ 46.15% 49.02% 46.88%   │ -0.05% 0.01% -0.03%     │ -3640.09% 286.41% -1362.75% │ 14.22% 16.41% │ 7 8    │ 0.28% 19.72 │
// │  7 │ 7.00% 6 100     │ 46.44% 49.09% 47.17%   │ -0.05% 0.02% -0.02%     │ -3641.14% 281.55% -1238.21% │ 15.34% 18.66% │ 7 6    │ 0.27% 16.97 │
// │  8 │ 5.00% 6 100     │ 45.68% 48.45% 46.35%   │ -0.05% 0.01% -0.03%     │ -3571.51% 277.55% -1555.92% │ 15.10% 16.34% │ 7 8    │ 0.27% 18.29 │
// │  9 │ 5.00% 5 100     │ 45.73% 48.49% 46.37%   │ -0.05% 0.01% -0.03%     │ -3512.98% 254.16% -1561.59% │ 14.52% 16.07% │ 7 7    │ 0.25% 19.79 │
// │ 10 │ 4.00% 7 100     │ 44.59% 47.48% 45.12%   │ -0.05% 0.01% -0.03%     │ -3743.77% 176.55% -1810.66% │ 14.98% 16.61% │ 8 11   │ 0.17% 17.93 │
// │ 11 │ 4.00% 6 100     │ 44.62% 47.62% 45.13%   │ -0.05% 0.01% -0.03%     │ -3649.75% 174.62% -1818.42% │ 14.98% 16.84% │ 8 6    │ 0.17% 18.96 │
// │ 12 │ 4.00% 5 100     │ 44.66% 47.42% 45.14%   │ -0.05% 0.01% -0.04%     │ -3712.15% 137.05% -1828.27% │ 14.39% 17.02% │ 8 6    │ 0.13% 17.67 │
// └────┴─────────────────┴────────────────────────┴─────────────────────────┴─────────────────────────────┴───────────────┴────────┴─────────────┘
