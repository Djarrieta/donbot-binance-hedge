import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [
		"XMRUSDT",
		"TRUUSDT",
		"BLURUSDT",
		"CKBUSDT",
		"BICOUSDT",
		"MASKUSDT",
		"ENSUSDT",
		"CFXUSDT",
		"XRPUSDT",
		"LRCUSDT",
		"1000LUNCUSDT",
		"ZETAUSDT",
		"OGNUSDT",
		"ENAUSDT",
		"NFPUSDT",
		"MYROUSDT",
		"PORTALUSDT",
		"STRKUSDT",
		"PIXELUSDT",
		"WUSDT",
		"USTCUSDT",
		"1000SATSUSDT",
		"OMNIUSDT",
		"FLOWUSDT",
		"SYNUSDT",
		"BANANAUSDT",
		"VIDTUSDT",
		"FLUXUSDT",
		"VOXELUSDT",
		"GHSTUSDT",
		"LOKAUSDT",
		"REIUSDT",
		"AERGOUSDT",
		"TROYUSDT",
		"FIDAUSDT",
		"1000CHEEMSUSDT",
		"1000XUSDT",
		"HIPPOUSDT",
		"RAYSOLUSDT",
		"AKTUSDT",
		"USUALUSDT",
		"SLERFUSDT",
		"DEGOUSDT",
		"SWARMSUSDT",
		"ZEREBROUSDT",
		"ORCAUSDT",
		"BIOUSDT",
		"ARCUSDT"
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


// ┌───┬─────────────────┬────────────────────────┬─────────────────────────┬─────────────────────────┬───────────────┬────────┬─────────────┐
// │   │ SL              │ WINRATE                │ AVPNL                   │ ACCPNL                  │ Drawdown      │ BadRun │ PerDay      │
// ├───┼─────────────────┼────────────────────────┼─────────────────────────┼─────────────────────────┼───────────────┼────────┼─────────────┤
// │ 0 │ sl tp/sl MaxLen │ all     accWP      fwd │ all      accWP      fwd │ all      accWP      fwd │ DD MC         │ BR MC  │ pnl     Qty │
// │ 1 │ 7.00% 5 100     │ 52.08% 51.99% 48.45%   │ 0.06% 0.05% 0.00%       │ 421.45% 55.01% 1.36%    │ 21.27% 26.78% │ 11 8   │ 0.11% 2.08  │
// └───┴─────────────────┴────────────────────────┴─────────────────────────┴─────────────────────────┴───────────────┴────────┴─────────────┘