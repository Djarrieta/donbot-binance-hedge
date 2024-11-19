import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"1000BONKUSDT",
	"STXUSDT",
	"ATOMUSDT",
	"KASUSDT",
	"BIGTIMEUSDT",
	"FLMUSDT",
	"EDUUSDT",
	"TLMUSDT",
	"SXPUSDT",
	"ZILUSDT",
	"1000SHIBUSDT",
	"1000FLOKIUSDT",
	"SNXUSDT",
	"TUSDT",
	"KAVAUSDT",
	"CRVUSDT",
	"KSMUSDT",
	"WAXPUSDT",
	"INJUSDT",
	"XTZUSDT",
	"FILUSDT",
	"CAKEUSDT",
	"POWRUSDT",
	"XAIUSDT",
	"ICXUSDT",
	"1000LUNCUSDT",
	"HIFIUSDT",
	"ZETAUSDT",
	"EOSUSDT",
	"PORTALUSDT",
	"IOUSDT",
	"RENDERUSDT",
];
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: params.lookBackLength,
	interval: params.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: params.defaultSL,
			tp: params.defaultTP,
			stgName: STG_NAME,
			pair,
		};

		if (candlestick.length < params.lookBackLength) return response;
		if (ALLOWED_PAIRS.length && !ALLOWED_PAIRS.includes(pair)) return response;

		const MIN_RSI = 30;
		const CANDLESTICK_SIZE = 50;
		const MIN_VOL = 10 / 100;
		const MAX_VOL = 25 / 100;

		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		const volatility = getVolatility({ candlestick });

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
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
				response.positionSide = "LONG";
			}
		}

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
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
				response.positionSide = "SHORT";
			}
		}

		return response;
	},
};

export default stg;
// Backtest data available for XRPUSDT, EOSUSDT, TRXUSDT and 241 other pairs.
// Data for 360.8 days from 2023 07 22 03:15:00 to 2024 07 16 23:25:00
// ┌────────────────┬────────┐
// │                │ Values │
// ├────────────────┼────────┤
// │             tp │ 10.00% │
// │             sl │ 2.00%  │
// │ maxTradeLength │ 100    │
// │           risk │ 0.50%  │
// └────────────────┴────────┘
// Snapshot
// ┌───┬───────┬────────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼────────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 8612      │ 0.07% │ 38.81%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬──────────┬────────────────────┬──────────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ drawdown │ drawdownMonteCarlo │ badRunMonteCarlo │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼──────────┼────────────────────┼──────────────────┼─────────┼───────────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 1232      │ 35.65%    │ -18.71%   │ 22.99% │ 21.89%   │ 39.80%             │ 12               │ 34.17%  │ 50.30         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴──────────┴────────────────────┴──────────────────┴─────────┴───────────────┘
// ┌──────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬─────────┬────────────┬─────────────────┐
// │      │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl  │ entryPrice │ stgName         │
// ├──────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼─────────┼────────────┼─────────────────┤
// │    0 │ DENTUSDT     │ 2023 07 23 00:45:00 │ 2023 07 23 09:05:00 │ SHORT        │ 2.03%  │ 2.03%   │ 0.00       │ rsiDivergency5m │
// │    1 │ COMPUSDT     │ 2023 07 23 23:10:00 │ 2023 07 24 04:50:00 │ LONG         │ -0.55% │ 1.48%   │ 66.83      │ rsiDivergency5m │
// │    2 │ 1INCHUSDT    │ 2023 07 24 05:25:00 │ 2023 07 24 10:05:00 │ LONG         │ -0.55% │ 0.93%   │ 0.30       │ rsiDivergency5m │
// │    3 │ KNCUSDT      │ 2023 07 24 20:10:00 │ 2023 07 24 20:55:00 │ SHORT        │ -0.55% │ 0.38%   │ 0.68       │ rsiDivergency5m │
// │    4 │ XVGUSDT      │ 2023 07 24 21:05:00 │ 2023 07 24 21:10:00 │ SHORT        │ -0.55% │ -0.17%  │ 0.01       │ rsiDivergency5m │
// │    5 │ DOGEUSDT     │ 2023 07 25 13:10:00 │ 2023 07 25 21:30:00 │ SHORT        │ 1.04%  │ 0.87%   │ 0.08       │ rsiDivergency5m │
// │    6 │ COMPUSDT     │ 2023 07 25 22:10:00 │ 2023 07 25 22:25:00 │ SHORT        │ -0.55% │ 0.32%   │ 67.51      │ rsiDivergency5m │
// │    7 │ OGNUSDT      │ 2023 07 26 07:40:00 │ 2023 07 26 07:45:00 │ SHORT        │ -0.55% │ -0.23%  │ 0.10       │ rsiDivergency5m │
// │    8 │ OGNUSDT      │ 2023 07 26 07:50:00 │ 2023 07 26 07:55:00 │ SHORT        │ -0.55% │ -0.78%  │ 0.10       │ rsiDivergency5m │
// │    9 │ OGNUSDT      │ 2023 07 26 08:15:00 │ 2023 07 26 08:25:00 │ SHORT        │ -0.55% │ -1.33%  │ 0.10       │ rsiDivergency5m │
// │   10 │ OGNUSDT      │ 2023 07 26 08:30:00 │ 2023 07 26 09:00:00 │ SHORT        │ -0.55% │ -1.88%  │ 0.10       │ rsiDivergency5m │
// │   11 │ OGNUSDT      │ 2023 07 26 09:15:00 │ 2023 07 26 09:25:00 │ SHORT        │ -0.55% │ -2.43%  │ 0.11       │ rsiDivergency5m │
// │   12 │ COMPUSDT     │ 2023 07 26 09:40:00 │ 2023 07 26 11:05:00 │ SHORT        │ -0.55% │ -2.98%  │ 70.93      │ rsiDivergency5m │
// │   13 │ SNXUSDT      │ 2023 07 26 21:55:00 │ 2023 07 27 04:00:00 │ SHORT        │ -0.55% │ -3.53%  │ 2.94       │ rsiDivergency5m │
// │   14 │ KNCUSDT      │ 2023 07 27 10:50:00 │ 2023 07 27 19:10:00 │ LONG         │ 0.07%  │ -3.45%  │ 0.66       │ rsiDivergency5m │
// │   15 │ UMAUSDT      │ 2023 07 28 00:10:00 │ 2023 07 28 08:30:00 │ SHORT        │ 1.81%  │ -1.65%  │ 1.75       │ rsiDivergency5m │
// │   16 │ CRVUSDT      │ 2023 07 30 14:25:00 │ 2023 07 30 14:30:00 │ LONG         │ -0.55% │ -2.20%  │ 0.66       │ rsiDivergency5m │
// │   17 │ CRVUSDT      │ 2023 07 30 14:40:00 │ 2023 07 30 14:45:00 │ LONG         │ -0.55% │ -2.75%  │ 0.64       │ rsiDivergency5m │
// │   18 │ CRVUSDT      │ 2023 07 30 14:55:00 │ 2023 07 30 15:05:00 │ LONG         │ -0.55% │ -3.30%  │ 0.62       │ rsiDivergency5m │
// │   19 │ XVGUSDT      │ 2023 07 30 23:30:00 │ 2023 07 31 01:30:00 │ SHORT        │ -0.55% │ -3.85%  │ 0.01       │ rsiDivergency5m │
// │   20 │ XVGUSDT      │ 2023 07 31 01:35:00 │ 2023 07 31 04:00:00 │ SHORT        │ -0.55% │ -4.40%  │ 0.01       │ rsiDivergency5m │
// │   21 │ XVGUSDT      │ 2023 07 31 04:10:00 │ 2023 07 31 04:20:00 │ SHORT        │ -0.55% │ -4.95%  │ 0.01       │ rsiDivergency5m │
// │   22 │ XVGUSDT      │ 2023 07 31 04:55:00 │ 2023 07 31 13:15:00 │ SHORT        │ 0.90%  │ -4.04%  │ 0.01       │ rsiDivergency5m │
// │   23 │ XVGUSDT      │ 2023 07 31 21:30:00 │ 2023 07 31 22:05:00 │ LONG         │ -0.55% │ -4.59%  │ 0.00       │ rsiDivergency5m │
// │   24 │ MAVUSDT      │ 2023 07 31 22:35:00 │ 2023 08 01 06:55:00 │ LONG         │ 0.11%  │ -4.48%  │ 0.29       │ rsiDivergency5m │
// │   25 │ COTIUSDT     │ 2023 08 01 23:40:00 │ 2023 08 02 01:55:00 │ LONG         │ -0.55% │ -5.03%  │ 0.05       │ rsiDivergency5m │
// │   26 │ OGNUSDT      │ 2023 08 02 02:25:00 │ 2023 08 02 10:45:00 │ SHORT        │ 0.27%  │ -4.76%  │ 0.11       │ rsiDivergency5m │
// │   27 │ KNCUSDT      │ 2023 08 04 02:10:00 │ 2023 08 04 10:30:00 │ LONG         │ 0.11%  │ -4.65%  │ 0.68       │ rsiDivergency5m │
// │   28 │ LPTUSDT      │ 2023 08 07 01:05:00 │ 2023 08 07 01:15:00 │ SHORT        │ -0.55% │ -5.20%  │ 5.09       │ rsiDivergency5m │
// │   29 │ DARUSDT      │ 2023 08 07 10:10:00 │ 2023 08 07 11:10:00 │ LONG         │ -0.55% │ -5.75%  │ 0.11       │ rsiDivergency5m │
// │   30 │ DARUSDT      │ 2023 08 07 11:20:00 │ 2023 08 07 19:40:00 │ LONG         │ 0.45%  │ -5.30%  │ 0.11       │ rsiDivergency5m │
// │   31 │ LPTUSDT      │ 2023 08 08 01:30:00 │ 2023 08 08 08:50:00 │ SHORT        │ 2.45%  │ -2.85%  │ 5.56       │ rsiDivergency5m │
// │   32 │ LPTUSDT      │ 2023 08 08 11:25:00 │ 2023 08 08 19:00:00 │ LONG         │ -0.55% │ -3.40%  │ 4.69       │ rsiDivergency5m │
// │   33 │ C98USDT      │ 2023 08 09 03:10:00 │ 2023 08 09 08:00:00 │ SHORT        │ 2.45%  │ -0.95%  │ 0.20       │ rsiDivergency5m │
// │   34 │ C98USDT      │ 2023 08 09 11:30:00 │ 2023 08 09 12:00:00 │ LONG         │ -0.55% │ -1.50%  │ 0.17       │ rsiDivergency5m │
// │   35 │ YGGUSDT      │ 2023 08 09 13:05:00 │ 2023 08 09 21:25:00 │ LONG         │ 0.62%  │ -0.88%  │ 0.32       │ rsiDivergency5m │
// │   36 │ HFTUSDT      │ 2023 08 09 22:35:00 │ 2023 08 10 06:55:00 │ SHORT        │ 2.11%  │ 1.23%   │ 0.40       │ rsiDivergency5m │
// │   37 │ LPTUSDT      │ 2023 08 11 00:40:00 │ 2023 08 11 00:50:00 │ SHORT        │ -0.55% │ 0.68%   │ 5.48       │ rsiDivergency5m │
// │   38 │ LPTUSDT      │ 2023 08 11 01:15:00 │ 2023 08 11 01:25:00 │ SHORT        │ -0.55% │ 0.13%   │ 5.84       │ rsiDivergency5m │
// │   39 │ LPTUSDT      │ 2023 08 11 01:30:00 │ 2023 08 11 04:50:00 │ SHORT        │ -0.55% │ -0.42%  │ 5.86       │ rsiDivergency5m │
// │   40 │ 1000SHIBUSDT │ 2023 08 11 21:30:00 │ 2023 08 12 05:50:00 │ SHORT        │ 0.87%  │ 0.45%   │ 0.01       │ rsiDivergency5m │
// │   41 │ LPTUSDT      │ 2023 08 12 12:20:00 │ 2023 08 12 14:45:00 │ SHORT        │ -0.55% │ -0.10%  │ 6.80       │ rsiDivergency5m │
// │   42 │ LEVERUSDT    │ 2023 08 13 10:35:00 │ 2023 08 13 13:30:00 │ SHORT        │ -0.55% │ -0.65%  │ 0.00       │ rsiDivergency5m │
// │   43 │ FETUSDT      │ 2023 08 13 16:25:00 │ 2023 08 14 00:45:00 │ SHORT        │ -0.16% │ -0.81%  │ 0.22       │ rsiDivergency5m │
// │   44 │ LEVERUSDT    │ 2023 08 14 03:35:00 │ 2023 08 14 04:30:00 │ SHORT        │ -0.55% │ -1.36%  │ 0.00       │ rsiDivergency5m │
// │   45 │ DODOXUSDT    │ 2023 08 14 08:15:00 │ 2023 08 14 16:35:00 │ LONG         │ 0.43%  │ -0.93%  │ 0.12       │ rsiDivergency5m │
// │   46 │ LEVERUSDT    │ 2023 08 14 22:10:00 │ 2023 08 15 06:00:00 │ SHORT        │ -0.55% │ -1.48%  │ 0.00       │ rsiDivergency5m │
// │   47 │ LEVERUSDT    │ 2023 08 15 08:20:00 │ 2023 08 15 10:45:00 │ SHORT        │ 2.45%  │ 0.97%   │ 0.00       │ rsiDivergency5m │
// │   48 │ LDOUSDT      │ 2023 08 15 14:10:00 │ 2023 08 15 22:30:00 │ LONG         │ 0.77%  │ 1.74%   │ 1.69       │ rsiDivergency5m │
// │   49 │ LEVERUSDT    │ 2023 08 15 22:35:00 │ 2023 08 16 01:30:00 │ SHORT        │ -0.55% │ 1.19%   │ 0.00       │ rsiDivergency5m │
// │   50 │ CELRUSDT     │ 2023 08 16 01:35:00 │ 2023 08 16 07:25:00 │ LONG         │ -0.55% │ 0.64%   │ 0.01       │ rsiDivergency5m │
// │   51 │ LINAUSDT     │ 2023 08 16 08:30:00 │ 2023 08 16 15:25:00 │ LONG         │ -0.55% │ 0.09%   │ 0.01       │ rsiDivergency5m │
// │   52 │ STXUSDT      │ 2023 08 16 15:40:00 │ 2023 08 16 16:10:00 │ LONG         │ -0.55% │ -0.46%  │ 0.51       │ rsiDivergency5m │
// │   53 │ MAVUSDT      │ 2023 08 16 16:15:00 │ 2023 08 17 00:35:00 │ LONG         │ 0.76%  │ 0.30%   │ 0.23       │ rsiDivergency5m │
// │   54 │ CFXUSDT      │ 2023 08 17 05:45:00 │ 2023 08 17 10:35:00 │ LONG         │ -0.55% │ -0.25%  │ 0.16       │ rsiDivergency5m │
// │   55 │ HFTUSDT      │ 2023 08 17 17:00:00 │ 2023 08 18 01:20:00 │ LONG         │ 0.73%  │ 0.47%   │ 0.31       │ rsiDivergency5m │
// │   56 │ 1000SHIBUSDT │ 2023 08 18 01:40:00 │ 2023 08 18 06:40:00 │ SHORT        │ -0.55% │ -0.08%  │ 0.01       │ rsiDivergency5m │
// │   57 │ APTUSDT      │ 2023 08 18 06:50:00 │ 2023 08 18 15:10:00 │ SHORT        │ -0.07% │ -0.15%  │ 5.80       │ rsiDivergency5m │
// │   58 │ LEVERUSDT    │ 2023 08 19 11:20:00 │ 2023 08 19 19:40:00 │ SHORT        │ -0.11% │ -0.26%  │ 0.00       │ rsiDivergency5m │
// │   59 │ SFPUSDT      │ 2023 08 20 03:20:00 │ 2023 08 20 11:00:00 │ LONG         │ 2.45%  │ 2.19%   │ 0.40       │ rsiDivergency5m │
// │   60 │ SFPUSDT      │ 2023 08 20 13:10:00 │ 2023 08 20 13:15:00 │ SHORT        │ -0.55% │ 1.64%   │ 0.48       │ rsiDivergency5m │
// │   61 │ SFPUSDT      │ 2023 08 20 13:20:00 │ 2023 08 20 13:30:00 │ SHORT        │ -0.55% │ 1.09%   │ 0.49       │ rsiDivergency5m │
// │   62 │ SFPUSDT      │ 2023 08 20 13:35:00 │ 2023 08 20 15:00:00 │ SHORT        │ -0.55% │ 0.54%   │ 0.49       │ rsiDivergency5m │
// │   63 │ TRUUSDT      │ 2023 08 20 15:25:00 │ 2023 08 20 23:45:00 │ SHORT        │ 0.80%  │ 1.34%   │ 0.03       │ rsiDivergency5m │
// │   64 │ SFPUSDT      │ 2023 08 21 08:25:00 │ 2023 08 21 10:20:00 │ LONG         │ -0.55% │ 0.79%   │ 0.43       │ rsiDivergency5m │
// │   65 │ LEVERUSDT    │ 2023 08 21 19:35:00 │ 2023 08 22 02:20:00 │ SHORT        │ -0.55% │ 0.24%   │ 0.00       │ rsiDivergency5m │
// │   66 │ LEVERUSDT    │ 2023 08 22 09:40:00 │ 2023 08 22 11:15:00 │ LONG         │ -0.55% │ -0.31%  │ 0.00       │ rsiDivergency5m │
// │   67 │ COMPUSDT     │ 2023 08 22 12:55:00 │ 2023 08 22 21:15:00 │ LONG         │ 0.98%  │ 0.67%   │ 40.56      │ rsiDivergency5m │
// │   68 │ TRUUSDT      │ 2023 08 23 00:00:00 │ 2023 08 23 01:40:00 │ SHORT        │ -0.55% │ 0.12%   │ 0.03       │ rsiDivergency5m │
// │   69 │ TRUUSDT      │ 2023 08 23 01:45:00 │ 2023 08 23 02:10:00 │ SHORT        │ -0.55% │ -0.43%  │ 0.03       │ rsiDivergency5m │
// │   70 │ LPTUSDT      │ 2023 08 23 03:15:00 │ 2023 08 23 11:00:00 │ SHORT        │ -0.55% │ -0.98%  │ 6.53       │ rsiDivergency5m │
// │   71 │ SFPUSDT      │ 2023 08 23 11:55:00 │ 2023 08 23 12:10:00 │ SHORT        │ -0.55% │ -1.53%  │ 0.56       │ rsiDivergency5m │
// │   72 │ XVGUSDT      │ 2023 08 23 12:20:00 │ 2023 08 23 14:45:00 │ SHORT        │ -0.55% │ -2.08%  │ 0.00       │ rsiDivergency5m │
// │   73 │ YGGUSDT      │ 2023 08 23 14:50:00 │ 2023 08 23 23:10:00 │ SHORT        │ 1.00%  │ -1.08%  │ 0.27       │ rsiDivergency5m │
// │   74 │ XVGUSDT      │ 2023 08 24 01:20:00 │ 2023 08 24 09:40:00 │ LONG         │ 0.35%  │ -0.73%  │ 0.00       │ rsiDivergency5m │
// │   75 │ YGGUSDT      │ 2023 08 24 22:30:00 │ 2023 08 25 06:50:00 │ LONG         │ -0.09% │ -0.82%  │ 0.22       │ rsiDivergency5m │
// │   76 │ SSVUSDT      │ 2023 08 26 04:50:00 │ 2023 08 26 13:10:00 │ LONG         │ -0.12% │ -0.94%  │ 14.34      │ rsiDivergency5m │
// │   77 │ WLDUSDT      │ 2023 08 29 05:40:00 │ 2023 08 29 06:40:00 │ LONG         │ -0.55% │ -1.49%  │ 1.13       │ rsiDivergency5m │
// │   78 │ STXUSDT      │ 2023 08 29 11:15:00 │ 2023 08 29 19:00:00 │ SHORT        │ -0.55% │ -2.04%  │ 0.52       │ rsiDivergency5m │
// │   79 │ COTIUSDT     │ 2023 08 29 20:25:00 │ 2023 08 30 04:45:00 │ LONG         │ -0.21% │ -2.25%  │ 0.04       │ rsiDivergency5m │
// │   80 │ WLDUSDT      │ 2023 08 30 11:50:00 │ 2023 08 30 20:00:00 │ LONG         │ -0.55% │ -2.80%  │ 1.20       │ rsiDivergency5m │
// │   81 │ STXUSDT      │ 2023 08 31 16:10:00 │ 2023 09 01 00:30:00 │ LONG         │ 0.28%  │ -2.51%  │ 0.49       │ rsiDivergency5m │
// │   82 │ PENDLEUSDT   │ 2023 09 02 13:35:00 │ 2023 09 02 21:55:00 │ LONG         │ 0.25%  │ -2.26%  │ 0.60       │ rsiDivergency5m │
// │   83 │ OXTUSDT      │ 2023 09 04 00:50:00 │ 2023 09 04 09:10:00 │ LONG         │ -0.42% │ -2.68%  │ 0.06       │ rsiDivergency5m │
// │   84 │ HOOKUSDT     │ 2023 09 05 13:45:00 │ 2023 09 05 22:05:00 │ SHORT        │ 0.45%  │ -2.23%  │ 0.82       │ rsiDivergency5m │
// │   85 │ NEOUSDT      │ 2023 09 06 00:15:00 │ 2023 09 06 08:35:00 │ LONG         │ 0.12%  │ -2.10%  │ 7.29       │ rsiDivergency5m │
// │   86 │ WLDUSDT      │ 2023 09 06 12:55:00 │ 2023 09 06 14:15:00 │ SHORT        │ -0.55% │ -2.65%  │ 1.28       │ rsiDivergency5m │
// │   87 │ LEVERUSDT    │ 2023 09 07 06:30:00 │ 2023 09 07 14:50:00 │ LONG         │ 1.53%  │ -1.12%  │ 0.00       │ rsiDivergency5m │
// │   88 │ HFTUSDT      │ 2023 09 08 01:15:00 │ 2023 09 08 05:05:00 │ LONG         │ -0.55% │ -1.67%  │ 0.35       │ rsiDivergency5m │
// │   89 │ NMRUSDT      │ 2023 09 08 05:15:00 │ 2023 09 08 13:35:00 │ LONG         │ -0.01% │ -1.68%  │ 13.77      │ rsiDivergency5m │
// │   90 │ SFPUSDT      │ 2023 09 09 06:15:00 │ 2023 09 09 14:35:00 │ LONG         │ -0.30% │ -1.98%  │ 0.58       │ rsiDivergency5m │
// │   91 │ XVGUSDT      │ 2023 09 09 18:05:00 │ 2023 09 09 20:15:00 │ LONG         │ -0.55% │ -2.53%  │ 0.00       │ rsiDivergency5m │
// │   92 │ OGNUSDT      │ 2023 09 09 21:25:00 │ 2023 09 09 23:20:00 │ LONG         │ -0.55% │ -3.08%  │ 0.09       │ rsiDivergency5m │
// │   93 │ DODOXUSDT    │ 2023 09 09 23:25:00 │ 2023 09 10 07:45:00 │ LONG         │ 0.46%  │ -2.62%  │ 0.09       │ rsiDivergency5m │
// │   94 │ FLMUSDT      │ 2023 09 10 12:15:00 │ 2023 09 10 14:15:00 │ LONG         │ -0.55% │ -3.17%  │ 0.09       │ rsiDivergency5m │
// │   95 │ XVSUSDT      │ 2023 09 10 15:30:00 │ 2023 09 10 22:25:00 │ SHORT        │ -0.55% │ -3.72%  │ 4.31       │ rsiDivergency5m │
// │   96 │ XVGUSDT      │ 2023 09 11 05:05:00 │ 2023 09 11 05:20:00 │ LONG         │ -0.55% │ -4.27%  │ 0.00       │ rsiDivergency5m │
// │   97 │ TLMUSDT      │ 2023 09 11 05:30:00 │ 2023 09 11 13:50:00 │ LONG         │ -0.21% │ -4.48%  │ 0.01       │ rsiDivergency5m │
// │   98 │ RDNTUSDT     │ 2023 09 11 14:25:00 │ 2023 09 11 22:45:00 │ LONG         │ 0.85%  │ -3.63%  │ 0.19       │ rsiDivergency5m │
// │   99 │ YGGUSDT      │ 2023 09 12 06:30:00 │ 2023 09 12 14:50:00 │ SHORT        │ 0.92%  │ -2.70%  │ 0.21       │ rsiDivergency5m │
// │  100 │ ENJUSDT      │ 2023 09 12 21:10:00 │ 2023 09 13 05:30:00 │ LONG         │ 0.42%  │ -2.29%  │ 0.22       │ rsiDivergency5m │
// │  101 │ OGNUSDT      │ 2023 09 14 03:55:00 │ 2023 09 14 12:15:00 │ SHORT        │ 2.00%  │ -0.29%  │ 0.10       │ rsiDivergency5m │
// │  102 │ OXTUSDT      │ 2023 09 14 20:35:00 │ 2023 09 14 21:30:00 │ SHORT        │ -0.55% │ -0.84%  │ 0.08       │ rsiDivergency5m │
// │  103 │ OXTUSDT      │ 2023 09 14 21:55:00 │ 2023 09 14 22:10:00 │ SHORT        │ -0.55% │ -1.39%  │ 0.08       │ rsiDivergency5m │
// │  104 │ NMRUSDT      │ 2023 09 14 23:05:00 │ 2023 09 15 07:25:00 │ SHORT        │ 0.94%  │ -0.45%  │ 13.88      │ rsiDivergency5m │
// │  105 │ WLDUSDT      │ 2023 09 15 13:35:00 │ 2023 09 15 13:45:00 │ SHORT        │ -0.55% │ -1.00%  │ 1.24       │ rsiDivergency5m │
// │  106 │ KNCUSDT      │ 2023 09 15 20:00:00 │ 2023 09 15 20:10:00 │ SHORT        │ -0.55% │ -1.55%  │ 0.62       │ rsiDivergency5m │
// │  107 │ KNCUSDT      │ 2023 09 15 20:15:00 │ 2023 09 16 01:00:00 │ SHORT        │ -0.55% │ -2.10%  │ 0.64       │ rsiDivergency5m │
// │  108 │ OXTUSDT      │ 2023 09 16 05:30:00 │ 2023 09 16 06:05:00 │ LONG         │ -0.55% │ -2.65%  │ 0.07       │ rsiDivergency5m │
// │  109 │ OXTUSDT      │ 2023 09 16 06:55:00 │ 2023 09 16 07:10:00 │ LONG         │ -0.55% │ -3.20%  │ 0.07       │ rsiDivergency5m │
// │  110 │ OXTUSDT      │ 2023 09 16 07:15:00 │ 2023 09 16 14:20:00 │ LONG         │ -0.55% │ -3.75%  │ 0.07       │ rsiDivergency5m │
// │  111 │ KNCUSDT      │ 2023 09 16 20:00:00 │ 2023 09 17 04:20:00 │ LONG         │ 0.46%  │ -3.29%  │ 0.59       │ rsiDivergency5m │
// │  112 │ OGNUSDT      │ 2023 09 18 00:30:00 │ 2023 09 18 01:00:00 │ SHORT        │ -0.55% │ -3.84%  │ 0.10       │ rsiDivergency5m │
// │  113 │ OGNUSDT      │ 2023 09 18 01:10:00 │ 2023 09 18 01:35:00 │ SHORT        │ -0.55% │ -4.39%  │ 0.10       │ rsiDivergency5m │
// │  114 │ SPELLUSDT    │ 2023 09 19 05:05:00 │ 2023 09 19 05:20:00 │ SHORT        │ -0.55% │ -4.94%  │ 0.00       │ rsiDivergency5m │
// │  115 │ SPELLUSDT    │ 2023 09 19 05:25:00 │ 2023 09 19 05:55:00 │ SHORT        │ -0.55% │ -5.49%  │ 0.00       │ rsiDivergency5m │
// │  116 │ HIFIUSDT     │ 2023 09 20 07:35:00 │ 2023 09 20 09:15:00 │ LONG         │ -0.55% │ -6.04%  │ 0.79       │ rsiDivergency5m │
// │  117 │ WLDUSDT      │ 2023 09 20 17:25:00 │ 2023 09 20 19:45:00 │ SHORT        │ -0.55% │ -6.59%  │ 1.56       │ rsiDivergency5m │
// │  118 │ WLDUSDT      │ 2023 09 20 19:50:00 │ 2023 09 21 01:05:00 │ SHORT        │ 2.45%  │ -4.14%  │ 1.61       │ rsiDivergency5m │
// │  119 │ SPELLUSDT    │ 2023 09 21 04:35:00 │ 2023 09 21 12:55:00 │ LONG         │ -0.04% │ -4.18%  │ 0.00       │ rsiDivergency5m │
// │  120 │ RENUSDT      │ 2023 09 21 16:10:00 │ 2023 09 22 00:30:00 │ LONG         │ -0.09% │ -4.27%  │ 0.05       │ rsiDivergency5m │
// │  121 │ FLMUSDT      │ 2023 09 22 01:05:00 │ 2023 09 22 05:20:00 │ SHORT        │ -0.55% │ -4.82%  │ 0.11       │ rsiDivergency5m │
// │  122 │ CRVUSDT      │ 2023 09 22 12:35:00 │ 2023 09 22 20:55:00 │ SHORT        │ 0.10%  │ -4.72%  │ 0.49       │ rsiDivergency5m │
// │  123 │ LEVERUSDT    │ 2023 09 23 05:35:00 │ 2023 09 23 13:55:00 │ SHORT        │ 0.33%  │ -4.39%  │ 0.00       │ rsiDivergency5m │
// │  124 │ SXPUSDT      │ 2023 09 23 20:25:00 │ 2023 09 24 04:45:00 │ SHORT        │ 0.75%  │ -3.64%  │ 0.31       │ rsiDivergency5m │
// │  125 │ CRVUSDT      │ 2023 09 24 09:00:00 │ 2023 09 24 09:15:00 │ SHORT        │ -0.55% │ -4.19%  │ 0.52       │ rsiDivergency5m │
// │  126 │ KNCUSDT      │ 2023 09 24 09:20:00 │ 2023 09 24 17:40:00 │ LONG         │ 0.08%  │ -4.11%  │ 0.68       │ rsiDivergency5m │
// │  127 │ KNCUSDT      │ 2023 09 24 19:05:00 │ 2023 09 24 19:35:00 │ LONG         │ -0.55% │ -4.66%  │ 0.66       │ rsiDivergency5m │
// │  128 │ WLDUSDT      │ 2023 09 25 12:05:00 │ 2023 09 25 20:25:00 │ SHORT        │ 0.02%  │ -4.64%  │ 1.75       │ rsiDivergency5m │
// │  129 │ FRONTUSDT    │ 2023 09 26 12:15:00 │ 2023 09 26 13:10:00 │ SHORT        │ -0.55% │ -5.19%  │ 0.49       │ rsiDivergency5m │
// │  130 │ FRONTUSDT    │ 2023 09 26 13:35:00 │ 2023 09 26 14:00:00 │ SHORT        │ -0.55% │ -5.74%  │ 0.51       │ rsiDivergency5m │
// │  131 │ FRONTUSDT    │ 2023 09 26 14:25:00 │ 2023 09 26 17:25:00 │ SHORT        │ -0.55% │ -6.29%  │ 0.52       │ rsiDivergency5m │
// │  132 │ COMPUSDT     │ 2023 09 28 08:55:00 │ 2023 09 28 09:00:00 │ SHORT        │ -0.55% │ -6.84%  │ 46.44      │ rsiDivergency5m │
// │  133 │ COMPUSDT     │ 2023 09 28 09:35:00 │ 2023 09 28 10:20:00 │ SHORT        │ -0.55% │ -7.39%  │ 47.74      │ rsiDivergency5m │
// │  134 │ COMPUSDT     │ 2023 09 28 10:35:00 │ 2023 09 28 11:20:00 │ SHORT        │ -0.55% │ -7.94%  │ 48.97      │ rsiDivergency5m │
// │  135 │ COMPUSDT     │ 2023 09 28 11:25:00 │ 2023 09 28 19:45:00 │ SHORT        │ 0.70%  │ -7.24%  │ 49.71      │ rsiDivergency5m │
// │  136 │ SUIUSDT      │ 2023 09 29 05:55:00 │ 2023 09 29 14:15:00 │ SHORT        │ 0.42%  │ -6.82%  │ 0.49       │ rsiDivergency5m │
// │  137 │ OGNUSDT      │ 2023 09 29 14:45:00 │ 2023 09 29 23:05:00 │ SHORT        │ 0.02%  │ -6.80%  │ 0.11       │ rsiDivergency5m │
// │  138 │ YGGUSDT      │ 2023 09 30 17:25:00 │ 2023 10 01 01:45:00 │ SHORT        │ -0.24% │ -7.04%  │ 0.26       │ rsiDivergency5m │
// │  139 │ TRUUSDT      │ 2023 10 01 01:55:00 │ 2023 10 01 10:15:00 │ SHORT        │ 0.37%  │ -6.67%  │ 0.04       │ rsiDivergency5m │
// │  140 │ LPTUSDT      │ 2023 10 01 11:15:00 │ 2023 10 01 11:40:00 │ SHORT        │ -0.55% │ -7.22%  │ 6.82       │ rsiDivergency5m │
// │  141 │ OGNUSDT      │ 2023 10 02 00:55:00 │ 2023 10 02 09:15:00 │ SHORT        │ 1.80%  │ -5.42%  │ 0.15       │ rsiDivergency5m │
// │  142 │ RENUSDT      │ 2023 10 02 14:10:00 │ 2023 10 02 22:30:00 │ LONG         │ 0.34%  │ -5.07%  │ 0.05       │ rsiDivergency5m │
// │  143 │ LPTUSDT      │ 2023 10 03 00:20:00 │ 2023 10 03 02:30:00 │ LONG         │ -0.55% │ -5.62%  │ 6.32       │ rsiDivergency5m │
// │  144 │ LPTUSDT      │ 2023 10 03 02:40:00 │ 2023 10 03 07:15:00 │ LONG         │ -0.55% │ -6.17%  │ 6.17       │ rsiDivergency5m │
// │  145 │ LEVERUSDT    │ 2023 10 03 11:00:00 │ 2023 10 03 11:05:00 │ LONG         │ -0.55% │ -6.72%  │ 0.00       │ rsiDivergency5m │
// │  146 │ OXTUSDT      │ 2023 10 03 15:05:00 │ 2023 10 03 18:50:00 │ LONG         │ -0.55% │ -7.27%  │ 0.07       │ rsiDivergency5m │
// │  147 │ OGNUSDT      │ 2023 10 03 19:15:00 │ 2023 10 03 19:30:00 │ LONG         │ -0.55% │ -7.82%  │ 0.12       │ rsiDivergency5m │
// │  148 │ OGNUSDT      │ 2023 10 03 20:00:00 │ 2023 10 04 04:20:00 │ LONG         │ 1.31%  │ -6.51%  │ 0.12       │ rsiDivergency5m │
// │  149 │ LQTYUSDT     │ 2023 10 04 07:35:00 │ 2023 10 04 11:30:00 │ SHORT        │ 2.45%  │ -4.06%  │ 1.15       │ rsiDivergency5m │
// │  150 │ DODOXUSDT    │ 2023 10 05 12:05:00 │ 2023 10 05 20:25:00 │ LONG         │ 0.16%  │ -3.90%  │ 0.10       │ rsiDivergency5m │
// │  151 │ OGNUSDT      │ 2023 10 07 02:05:00 │ 2023 10 07 10:25:00 │ LONG         │ 0.18%  │ -3.73%  │ 0.12       │ rsiDivergency5m │
// │  152 │ LQTYUSDT     │ 2023 10 07 13:25:00 │ 2023 10 07 21:45:00 │ SHORT        │ 0.22%  │ -3.51%  │ 1.20       │ rsiDivergency5m │
// │  153 │ COTIUSDT     │ 2023 10 08 17:55:00 │ 2023 10 08 18:20:00 │ SHORT        │ -0.55% │ -4.06%  │ 0.04       │ rsiDivergency5m │
// │  154 │ NMRUSDT      │ 2023 10 08 22:25:00 │ 2023 10 09 03:35:00 │ LONG         │ -0.55% │ -4.61%  │ 12.71      │ rsiDivergency5m │
// │  155 │ GALAUSDT     │ 2023 10 09 04:55:00 │ 2023 10 09 11:25:00 │ LONG         │ -0.55% │ -5.16%  │ 0.01       │ rsiDivergency5m │
// │  156 │ HOOKUSDT     │ 2023 10 09 11:45:00 │ 2023 10 09 20:05:00 │ LONG         │ 0.13%  │ -5.03%  │ 0.73       │ rsiDivergency5m │
// │  157 │ OGNUSDT      │ 2023 10 10 04:25:00 │ 2023 10 10 12:45:00 │ LONG         │ 0.06%  │ -4.97%  │ 0.12       │ rsiDivergency5m │
// │  158 │ FRONTUSDT    │ 2023 10 11 01:10:00 │ 2023 10 11 09:30:00 │ LONG         │ -0.08% │ -5.05%  │ 0.29       │ rsiDivergency5m │
// │  159 │ YGGUSDT      │ 2023 10 12 00:20:00 │ 2023 10 12 08:40:00 │ SHORT        │ 0.29%  │ -4.76%  │ 0.24       │ rsiDivergency5m │
// │  160 │ TUSDT        │ 2023 10 12 20:40:00 │ 2023 10 12 21:05:00 │ SHORT        │ -0.55% │ -5.31%  │ 0.02       │ rsiDivergency5m │
// │  161 │ TUSDT        │ 2023 10 12 21:10:00 │ 2023 10 13 03:35:00 │ SHORT        │ -0.55% │ -5.86%  │ 0.02       │ rsiDivergency5m │
// │  162 │ LQTYUSDT     │ 2023 10 13 08:25:00 │ 2023 10 13 09:05:00 │ LONG         │ -0.55% │ -6.41%  │ 1.36       │ rsiDivergency5m │
// │  163 │ LQTYUSDT     │ 2023 10 13 09:10:00 │ 2023 10 13 10:15:00 │ LONG         │ -0.55% │ -6.96%  │ 1.34       │ rsiDivergency5m │
// │  164 │ HOTUSDT      │ 2023 10 13 14:35:00 │ 2023 10 13 14:45:00 │ SHORT        │ -0.55% │ -7.51%  │ 0.00       │ rsiDivergency5m │
// │  165 │ HOTUSDT      │ 2023 10 13 16:40:00 │ 2023 10 13 16:50:00 │ SHORT        │ -0.55% │ -8.06%  │ 0.00       │ rsiDivergency5m │
// │  166 │ BIGTIMEUSDT  │ 2023 10 14 14:30:00 │ 2023 10 14 14:45:00 │ SHORT        │ -0.55% │ -8.61%  │ 0.25       │ rsiDivergency5m │
// │  167 │ TUSDT        │ 2023 10 15 03:15:00 │ 2023 10 15 08:50:00 │ LONG         │ -0.55% │ -9.16%  │ 0.02       │ rsiDivergency5m │
// │  168 │ HOTUSDT      │ 2023 10 16 00:50:00 │ 2023 10 16 03:00:00 │ SHORT        │ -0.55% │ -9.71%  │ 0.00       │ rsiDivergency5m │
// │  169 │ BIGTIMEUSDT  │ 2023 10 16 12:20:00 │ 2023 10 16 16:20:00 │ LONG         │ -0.55% │ -10.26% │ 0.23       │ rsiDivergency5m │
// │  170 │ BIGTIMEUSDT  │ 2023 10 17 00:50:00 │ 2023 10 17 05:35:00 │ LONG         │ -0.55% │ -10.81% │ 0.21       │ rsiDivergency5m │
// │  171 │ IOTAUSDT     │ 2023 10 17 08:50:00 │ 2023 10 17 17:10:00 │ LONG         │ 0.40%  │ -10.41% │ 0.14       │ rsiDivergency5m │
// │  172 │ OGNUSDT      │ 2023 10 17 20:25:00 │ 2023 10 17 21:15:00 │ LONG         │ -0.55% │ -10.96% │ 0.11       │ rsiDivergency5m │
// │  173 │ BIGTIMEUSDT  │ 2023 10 18 12:20:00 │ 2023 10 18 13:25:00 │ LONG         │ 2.45%  │ -8.51%  │ 0.14       │ rsiDivergency5m │
// │  174 │ HFTUSDT      │ 2023 10 18 14:10:00 │ 2023 10 18 16:05:00 │ LONG         │ -0.55% │ -9.06%  │ 0.22       │ rsiDivergency5m │
// │  175 │ WLDUSDT      │ 2023 10 18 18:40:00 │ 2023 10 18 20:40:00 │ LONG         │ -0.55% │ -9.61%  │ 1.46       │ rsiDivergency5m │
// │  176 │ WLDUSDT      │ 2023 10 18 20:50:00 │ 2023 10 18 21:35:00 │ LONG         │ -0.55% │ -10.16% │ 1.43       │ rsiDivergency5m │
// │  177 │ TUSDT        │ 2023 10 18 22:45:00 │ 2023 10 19 07:05:00 │ LONG         │ 0.03%  │ -10.13% │ 0.02       │ rsiDivergency5m │
// │  178 │ KNCUSDT      │ 2023 10 19 11:40:00 │ 2023 10 19 19:05:00 │ LONG         │ -0.55% │ -10.68% │ 0.63       │ rsiDivergency5m │
// │  179 │ FRONTUSDT    │ 2023 10 20 01:15:00 │ 2023 10 20 09:35:00 │ SHORT        │ 0.23%  │ -10.46% │ 0.28       │ rsiDivergency5m │
// │  180 │ LQTYUSDT     │ 2023 10 20 15:20:00 │ 2023 10 20 23:40:00 │ LONG         │ 0.31%  │ -10.15% │ 1.35       │ rsiDivergency5m │
// │  181 │ ICXUSDT      │ 2023 10 21 03:35:00 │ 2023 10 21 07:55:00 │ SHORT        │ -0.55% │ -10.70% │ 0.21       │ rsiDivergency5m │
// │  182 │ APTUSDT      │ 2023 10 21 19:10:00 │ 2023 10 22 02:15:00 │ LONG         │ 2.45%  │ -8.25%  │ 5.52       │ rsiDivergency5m │
// │  183 │ LQTYUSDT     │ 2023 10 22 05:30:00 │ 2023 10 22 13:50:00 │ LONG         │ 0.46%  │ -7.79%  │ 1.33       │ rsiDivergency5m │
// │  184 │ LQTYUSDT     │ 2023 10 22 15:45:00 │ 2023 10 22 20:05:00 │ SHORT        │ -0.55% │ -8.34%  │ 1.37       │ rsiDivergency5m │
// │  185 │ WLDUSDT      │ 2023 10 23 04:30:00 │ 2023 10 23 04:40:00 │ LONG         │ -0.55% │ -8.89%  │ 1.51       │ rsiDivergency5m │
// │  186 │ WLDUSDT      │ 2023 10 23 04:50:00 │ 2023 10 23 13:10:00 │ LONG         │ 0.64%  │ -8.25%  │ 1.50       │ rsiDivergency5m │
// │  187 │ WLDUSDT      │ 2023 10 23 18:30:00 │ 2023 10 23 18:55:00 │ SHORT        │ -0.55% │ -8.80%  │ 1.63       │ rsiDivergency5m │
// │  188 │ DOTUSDT      │ 2023 10 23 19:00:00 │ 2023 10 24 03:20:00 │ SHORT        │ 0.46%  │ -8.34%  │ 4.35       │ rsiDivergency5m │
// │  189 │ YGGUSDT      │ 2023 10 24 04:40:00 │ 2023 10 24 06:55:00 │ SHORT        │ -0.55% │ -8.89%  │ 0.28       │ rsiDivergency5m │
// │  190 │ LINAUSDT     │ 2023 10 24 07:15:00 │ 2023 10 24 07:40:00 │ SHORT        │ -0.55% │ -9.44%  │ 0.01       │ rsiDivergency5m │
// │  191 │ APTUSDT      │ 2023 10 24 07:45:00 │ 2023 10 24 16:05:00 │ SHORT        │ 1.22%  │ -8.22%  │ 6.42       │ rsiDivergency5m │
// │  192 │ DYDXUSDT     │ 2023 10 25 02:50:00 │ 2023 10 25 11:10:00 │ LONG         │ 1.21%  │ -7.01%  │ 2.26       │ rsiDivergency5m │
// │  193 │ APEUSDT      │ 2023 10 25 16:15:00 │ 2023 10 26 00:35:00 │ LONG         │ 0.49%  │ -6.52%  │ 1.30       │ rsiDivergency5m │
// │  194 │ FRONTUSDT    │ 2023 10 26 01:10:00 │ 2023 10 26 01:35:00 │ SHORT        │ -0.55% │ -7.07%  │ 0.34       │ rsiDivergency5m │
// │  195 │ FRONTUSDT    │ 2023 10 26 01:45:00 │ 2023 10 26 02:10:00 │ SHORT        │ -0.55% │ -7.62%  │ 0.35       │ rsiDivergency5m │
// │  196 │ GALAUSDT     │ 2023 10 26 02:15:00 │ 2023 10 26 02:20:00 │ SHORT        │ -0.55% │ -8.17%  │ 0.02       │ rsiDivergency5m │
// │  197 │ GALAUSDT     │ 2023 10 26 02:25:00 │ 2023 10 26 02:35:00 │ SHORT        │ -0.55% │ -8.72%  │ 0.02       │ rsiDivergency5m │
// │  198 │ MAVUSDT      │ 2023 10 26 03:00:00 │ 2023 10 26 11:20:00 │ SHORT        │ 1.56%  │ -7.16%  │ 0.27       │ rsiDivergency5m │
// │  199 │ WAXPUSDT     │ 2023 10 26 14:40:00 │ 2023 10 26 14:50:00 │ SHORT        │ -0.55% │ -7.71%  │ 0.06       │ rsiDivergency5m │
// │  200 │ WAXPUSDT     │ 2023 10 26 14:55:00 │ 2023 10 26 16:05:00 │ SHORT        │ -0.55% │ -8.26%  │ 0.06       │ rsiDivergency5m │
// │  201 │ LQTYUSDT     │ 2023 10 26 16:15:00 │ 2023 10 27 00:35:00 │ SHORT        │ 2.05%  │ -6.21%  │ 2.03       │ rsiDivergency5m │
// │  202 │ NEOUSDT      │ 2023 10 27 03:45:00 │ 2023 10 27 04:30:00 │ SHORT        │ -0.55% │ -6.76%  │ 8.78       │ rsiDivergency5m │
// │  203 │ NEOUSDT      │ 2023 10 27 08:00:00 │ 2023 10 27 16:20:00 │ SHORT        │ 0.90%  │ -5.86%  │ 9.09       │ rsiDivergency5m │
// │  204 │ GASUSDT      │ 2023 10 27 17:20:00 │ 2023 10 27 18:00:00 │ SHORT        │ -0.55% │ -6.41%  │ 3.56       │ rsiDivergency5m │
// │  205 │ GASUSDT      │ 2023 10 27 18:20:00 │ 2023 10 27 20:25:00 │ SHORT        │ -0.55% │ -6.96%  │ 3.66       │ rsiDivergency5m │
// │  206 │ GASUSDT      │ 2023 10 27 20:30:00 │ 2023 10 27 20:40:00 │ SHORT        │ -0.55% │ -7.51%  │ 3.82       │ rsiDivergency5m │
// │  207 │ ONTUSDT      │ 2023 10 28 03:25:00 │ 2023 10 28 06:50:00 │ SHORT        │ -0.55% │ -8.06%  │ 0.21       │ rsiDivergency5m │
// │  208 │ POLYXUSDT    │ 2023 10 28 10:40:00 │ 2023 10 28 11:20:00 │ SHORT        │ -0.55% │ -8.61%  │ 0.27       │ rsiDivergency5m │
// │  209 │ HIFIUSDT     │ 2023 10 28 20:15:00 │ 2023 10 29 04:35:00 │ SHORT        │ 0.44%  │ -8.18%  │ 0.69       │ rsiDivergency5m │
// │  210 │ POLYXUSDT    │ 2023 10 29 04:50:00 │ 2023 10 29 07:25:00 │ SHORT        │ -0.55% │ -8.73%  │ 0.29       │ rsiDivergency5m │
// │  211 │ GASUSDT      │ 2023 10 29 10:15:00 │ 2023 10 29 16:25:00 │ LONG         │ 2.45%  │ -6.28%  │ 4.44       │ rsiDivergency5m │
// │  212 │ GASUSDT      │ 2023 10 29 17:15:00 │ 2023 10 29 18:05:00 │ SHORT        │ -0.55% │ -6.83%  │ 4.97       │ rsiDivergency5m │
// │  213 │ POLYXUSDT    │ 2023 10 30 03:55:00 │ 2023 10 30 04:05:00 │ SHORT        │ -0.55% │ -7.38%  │ 0.36       │ rsiDivergency5m │
// │  214 │ POLYXUSDT    │ 2023 10 30 04:10:00 │ 2023 10 30 07:05:00 │ SHORT        │ -0.55% │ -7.93%  │ 0.36       │ rsiDivergency5m │
// │  215 │ SKLUSDT      │ 2023 10 30 07:30:00 │ 2023 10 30 15:50:00 │ SHORT        │ 0.58%  │ -7.35%  │ 0.03       │ rsiDivergency5m │
// │  216 │ HOOKUSDT     │ 2023 10 30 15:55:00 │ 2023 10 31 00:15:00 │ SHORT        │ 0.49%  │ -6.86%  │ 1.00       │ rsiDivergency5m │
// │  217 │ HIFIUSDT     │ 2023 10 31 08:55:00 │ 2023 10 31 10:10:00 │ LONG         │ -0.55% │ -7.41%  │ 0.62       │ rsiDivergency5m │
// │  218 │ WAXPUSDT     │ 2023 10 31 10:20:00 │ 2023 10 31 18:40:00 │ LONG         │ 2.17%  │ -5.23%  │ 0.06       │ rsiDivergency5m │
// │  219 │ ICXUSDT      │ 2023 10 31 18:50:00 │ 2023 11 01 03:10:00 │ SHORT        │ 0.65%  │ -4.59%  │ 0.22       │ rsiDivergency5m │
// │  220 │ INJUSDT      │ 2023 11 01 03:40:00 │ 2023 11 01 07:55:00 │ SHORT        │ -0.55% │ -5.14%  │ 14.03      │ rsiDivergency5m │
// │  221 │ TUSDT        │ 2023 11 01 08:25:00 │ 2023 11 01 16:45:00 │ LONG         │ 1.31%  │ -3.83%  │ 0.02       │ rsiDivergency5m │
// │  222 │ MANAUSDT     │ 2023 11 01 19:55:00 │ 2023 11 01 20:05:00 │ SHORT        │ -0.55% │ -4.38%  │ 0.39       │ rsiDivergency5m │
// │  223 │ GMTUSDT      │ 2023 11 01 21:00:00 │ 2023 11 02 05:20:00 │ SHORT        │ 0.80%  │ -3.58%  │ 0.20       │ rsiDivergency5m │
// │  224 │ FLMUSDT      │ 2023 11 02 10:15:00 │ 2023 11 02 18:35:00 │ LONG         │ 0.17%  │ -3.42%  │ 0.08       │ rsiDivergency5m │
// │  225 │ POWRUSDT     │ 2023 11 02 20:20:00 │ 2023 11 03 04:40:00 │ LONG         │ 0.07%  │ -3.35%  │ 0.21       │ rsiDivergency5m │
// │  226 │ POLYXUSDT    │ 2023 11 03 07:40:00 │ 2023 11 03 11:00:00 │ SHORT        │ -0.55% │ -3.90%  │ 0.23       │ rsiDivergency5m │
// │  227 │ SSVUSDT      │ 2023 11 03 20:15:00 │ 2023 11 03 23:05:00 │ SHORT        │ -0.55% │ -4.45%  │ 15.19      │ rsiDivergency5m │
// │  228 │ GMTUSDT      │ 2023 11 04 02:45:00 │ 2023 11 04 11:05:00 │ SHORT        │ 0.83%  │ -3.62%  │ 0.20       │ rsiDivergency5m │
// │  229 │ IMXUSDT      │ 2023 11 04 11:35:00 │ 2023 11 04 19:00:00 │ SHORT        │ -0.55% │ -4.17%  │ 0.83       │ rsiDivergency5m │
// │  230 │ IMXUSDT      │ 2023 11 04 21:35:00 │ 2023 11 04 21:55:00 │ SHORT        │ -0.55% │ -4.72%  │ 0.90       │ rsiDivergency5m │
// │  231 │ DODOXUSDT    │ 2023 11 04 23:40:00 │ 2023 11 05 01:00:00 │ SHORT        │ -0.55% │ -5.27%  │ 0.13       │ rsiDivergency5m │
// │  232 │ DODOXUSDT    │ 2023 11 05 01:10:00 │ 2023 11 05 02:30:00 │ SHORT        │ -0.55% │ -5.82%  │ 0.13       │ rsiDivergency5m │
// │  233 │ NEOUSDT      │ 2023 11 05 06:50:00 │ 2023 11 05 07:00:00 │ SHORT        │ -0.55% │ -6.37%  │ 13.65      │ rsiDivergency5m │
// │  234 │ LRCUSDT      │ 2023 11 05 07:35:00 │ 2023 11 05 15:55:00 │ SHORT        │ 1.19%  │ -5.18%  │ 0.23       │ rsiDivergency5m │
// │  235 │ GMTUSDT      │ 2023 11 05 21:10:00 │ 2023 11 05 21:25:00 │ SHORT        │ -0.55% │ -5.73%  │ 0.22       │ rsiDivergency5m │
// │  236 │ GMTUSDT      │ 2023 11 05 21:50:00 │ 2023 11 06 06:10:00 │ SHORT        │ -0.55% │ -6.28%  │ 0.24       │ rsiDivergency5m │
// │  237 │ YGGUSDT      │ 2023 11 06 06:35:00 │ 2023 11 06 14:20:00 │ SHORT        │ -0.55% │ -6.83%  │ 0.33       │ rsiDivergency5m │
// │  238 │ ADAUSDT      │ 2023 11 06 16:05:00 │ 2023 11 07 00:25:00 │ SHORT        │ 1.23%  │ -5.59%  │ 0.37       │ rsiDivergency5m │
// │  239 │ FETUSDT      │ 2023 11 07 10:35:00 │ 2023 11 07 18:55:00 │ LONG         │ 0.91%  │ -4.68%  │ 0.35       │ rsiDivergency5m │
// │  240 │ TLMUSDT      │ 2023 11 08 03:40:00 │ 2023 11 08 12:00:00 │ SHORT        │ 0.04%  │ -4.64%  │ 0.01       │ rsiDivergency5m │
// │  241 │ BIGTIMEUSDT  │ 2023 11 08 15:25:00 │ 2023 11 08 16:10:00 │ SHORT        │ -0.55% │ -5.19%  │ 0.17       │ rsiDivergency5m │
// │  242 │ RSRUSDT      │ 2023 11 08 16:55:00 │ 2023 11 09 01:15:00 │ SHORT        │ 0.58%  │ -4.60%  │ 0.00       │ rsiDivergency5m │
// │  243 │ MINAUSDT     │ 2023 11 09 04:10:00 │ 2023 11 09 09:00:00 │ LONG         │ -0.55% │ -5.15%  │ 0.69       │ rsiDivergency5m │
// │  244 │ FETUSDT      │ 2023 11 09 09:35:00 │ 2023 11 09 11:10:00 │ SHORT        │ 2.45%  │ -2.70%  │ 0.41       │ rsiDivergency5m │
// │  245 │ C98USDT      │ 2023 11 09 14:25:00 │ 2023 11 09 22:45:00 │ LONG         │ 1.32%  │ -1.39%  │ 0.17       │ rsiDivergency5m │
// │  246 │ BONDUSDT     │ 2023 11 10 01:05:00 │ 2023 11 10 01:15:00 │ SHORT        │ -0.55% │ -1.94%  │ 4.70       │ rsiDivergency5m │
// │  247 │ BONDUSDT     │ 2023 11 10 01:25:00 │ 2023 11 10 03:10:00 │ SHORT        │ -0.55% │ -2.49%  │ 4.76       │ rsiDivergency5m │
// │  248 │ SUIUSDT      │ 2023 11 10 03:15:00 │ 2023 11 10 11:35:00 │ LONG         │ 0.12%  │ -2.36%  │ 0.54       │ rsiDivergency5m │
// │  249 │ INJUSDT      │ 2023 11 10 11:55:00 │ 2023 11 10 13:40:00 │ SHORT        │ -0.55% │ -2.91%  │ 18.38      │ rsiDivergency5m │
// │  250 │ SUIUSDT      │ 2023 11 10 16:30:00 │ 2023 11 10 18:05:00 │ SHORT        │ -0.55% │ -3.46%  │ 0.61       │ rsiDivergency5m │
// │  251 │ FETUSDT      │ 2023 11 10 18:20:00 │ 2023 11 10 18:55:00 │ SHORT        │ -0.55% │ -4.01%  │ 0.43       │ rsiDivergency5m │
// │  252 │ FETUSDT      │ 2023 11 10 19:00:00 │ 2023 11 11 03:10:00 │ SHORT        │ -0.55% │ -4.56%  │ 0.44       │ rsiDivergency5m │
// │  253 │ ORDIUSDT     │ 2023 11 11 09:25:00 │ 2023 11 11 09:35:00 │ SHORT        │ -0.55% │ -5.11%  │ 19.24      │ rsiDivergency5m │
// │  254 │ WLDUSDT      │ 2023 11 11 09:40:00 │ 2023 11 11 17:10:00 │ LONG         │ -0.55% │ -5.66%  │ 1.95       │ rsiDivergency5m │
// │  255 │ MAVUSDT      │ 2023 11 11 19:40:00 │ 2023 11 12 04:00:00 │ LONG         │ 1.56%  │ -4.11%  │ 0.26       │ rsiDivergency5m │
// │  256 │ HOOKUSDT     │ 2023 11 12 04:05:00 │ 2023 11 12 05:40:00 │ SHORT        │ -0.55% │ -4.66%  │ 0.99       │ rsiDivergency5m │
// │  257 │ KLAYUSDT     │ 2023 11 12 05:55:00 │ 2023 11 12 13:50:00 │ SHORT        │ -0.55% │ -5.21%  │ 0.16       │ rsiDivergency5m │
// │  258 │ MATICUSDT    │ 2023 11 12 23:15:00 │ 2023 11 13 07:20:00 │ LONG         │ -0.55% │ -5.76%  │ 0.88       │ rsiDivergency5m │
// │  259 │ ICXUSDT      │ 2023 11 13 09:45:00 │ 2023 11 13 16:10:00 │ LONG         │ -0.55% │ -6.31%  │ 0.28       │ rsiDivergency5m │
// │  260 │ GASUSDT      │ 2023 11 13 19:15:00 │ 2023 11 13 22:10:00 │ LONG         │ 2.45%  │ -3.86%  │ 7.92       │ rsiDivergency5m │
// │  261 │ SUIUSDT      │ 2023 11 13 23:45:00 │ 2023 11 14 00:55:00 │ SHORT        │ -0.55% │ -4.41%  │ 0.62       │ rsiDivergency5m │
// │  262 │ HOOKUSDT     │ 2023 11 14 01:00:00 │ 2023 11 14 09:20:00 │ SHORT        │ 0.86%  │ -3.54%  │ 1.02       │ rsiDivergency5m │
// │  263 │ GASUSDT      │ 2023 11 14 16:05:00 │ 2023 11 15 00:25:00 │ SHORT        │ 0.55%  │ -2.99%  │ 8.35       │ rsiDivergency5m │
// │  264 │ LDOUSDT      │ 2023 11 15 00:40:00 │ 2023 11 15 03:00:00 │ SHORT        │ -0.55% │ -3.54%  │ 2.44       │ rsiDivergency5m │
// │  265 │ HFTUSDT      │ 2023 11 15 03:45:00 │ 2023 11 15 06:00:00 │ SHORT        │ -0.55% │ -4.09%  │ 0.29       │ rsiDivergency5m │
// │  266 │ FETUSDT      │ 2023 11 15 06:10:00 │ 2023 11 15 14:30:00 │ SHORT        │ -0.55% │ -4.64%  │ 0.42       │ rsiDivergency5m │
// │  267 │ SKLUSDT      │ 2023 11 15 16:30:00 │ 2023 11 15 22:30:00 │ SHORT        │ -0.55% │ -5.19%  │ 0.03       │ rsiDivergency5m │
// │  268 │ ADAUSDT      │ 2023 11 16 03:40:00 │ 2023 11 16 12:00:00 │ SHORT        │ 1.53%  │ -3.65%  │ 0.41       │ rsiDivergency5m │
// │  269 │ HOOKUSDT     │ 2023 11 16 13:50:00 │ 2023 11 16 14:20:00 │ LONG         │ -0.55% │ -4.20%  │ 0.97       │ rsiDivergency5m │
// │  270 │ SUIUSDT      │ 2023 11 16 14:35:00 │ 2023 11 16 22:55:00 │ LONG         │ 1.13%  │ -3.07%  │ 0.56       │ rsiDivergency5m │
// │  271 │ WLDUSDT      │ 2023 11 17 05:25:00 │ 2023 11 17 13:45:00 │ LONG         │ 0.63%  │ -2.45%  │ 1.99       │ rsiDivergency5m │
// │  272 │ ORDIUSDT     │ 2023 11 17 20:45:00 │ 2023 11 18 01:15:00 │ SHORT        │ 2.45%  │ 0.00%   │ 26.25      │ rsiDivergency5m │
// │  273 │ ARPAUSDT     │ 2023 11 18 01:40:00 │ 2023 11 18 02:00:00 │ LONG         │ -0.55% │ -0.55%  │ 0.05       │ rsiDivergency5m │
// │  274 │ TOKENUSDT    │ 2023 11 18 02:05:00 │ 2023 11 18 10:25:00 │ LONG         │ 1.78%  │ 1.24%   │ 0.03       │ rsiDivergency5m │
// │  275 │ FETUSDT      │ 2023 11 18 10:35:00 │ 2023 11 18 11:00:00 │ SHORT        │ -0.55% │ 0.69%   │ 0.45       │ rsiDivergency5m │
// │  276 │ ARPAUSDT     │ 2023 11 18 11:05:00 │ 2023 11 18 19:25:00 │ SHORT        │ 2.07%  │ 2.76%   │ 0.05       │ rsiDivergency5m │
// │  277 │ DOGEUSDT     │ 2023 11 18 20:35:00 │ 2023 11 19 04:55:00 │ LONG         │ 0.42%  │ 3.18%   │ 0.08       │ rsiDivergency5m │
// │  278 │ ORDIUSDT     │ 2023 11 19 09:15:00 │ 2023 11 19 10:05:00 │ LONG         │ -0.55% │ 2.63%   │ 21.86      │ rsiDivergency5m │
// │  279 │ ARUSDT       │ 2023 11 19 11:55:00 │ 2023 11 19 13:15:00 │ SHORT        │ -0.55% │ 2.08%   │ 8.91       │ rsiDivergency5m │
// │  280 │ SKLUSDT      │ 2023 11 19 13:40:00 │ 2023 11 19 14:00:00 │ SHORT        │ -0.55% │ 1.53%   │ 0.04       │ rsiDivergency5m │
// │  281 │ SNXUSDT      │ 2023 11 19 14:20:00 │ 2023 11 19 15:15:00 │ SHORT        │ -0.55% │ 0.98%   │ 3.35       │ rsiDivergency5m │
// │  282 │ FETUSDT      │ 2023 11 19 22:30:00 │ 2023 11 20 02:30:00 │ SHORT        │ -0.55% │ 0.43%   │ 0.54       │ rsiDivergency5m │
// │  283 │ LDOUSDT      │ 2023 11 20 04:50:00 │ 2023 11 20 09:15:00 │ SHORT        │ -0.55% │ -0.12%  │ 2.50       │ rsiDivergency5m │
// │  284 │ POWRUSDT     │ 2023 11 20 19:50:00 │ 2023 11 20 22:25:00 │ LONG         │ -0.55% │ -0.67%  │ 0.28       │ rsiDivergency5m │
// │  285 │ POWRUSDT     │ 2023 11 20 22:30:00 │ 2023 11 21 06:15:00 │ LONG         │ -0.55% │ -1.22%  │ 0.28       │ rsiDivergency5m │
// │  286 │ YGGUSDT      │ 2023 11 21 09:10:00 │ 2023 11 21 10:10:00 │ LONG         │ -0.55% │ -1.77%  │ 0.37       │ rsiDivergency5m │
// │  287 │ NTRNUSDT     │ 2023 11 21 10:15:00 │ 2023 11 21 12:45:00 │ LONG         │ -0.55% │ -2.32%  │ 0.43       │ rsiDivergency5m │
// │  288 │ CAKEUSDT     │ 2023 11 21 12:50:00 │ 2023 11 21 13:00:00 │ LONG         │ -0.55% │ -2.87%  │ 2.42       │ rsiDivergency5m │
// │  289 │ NTRNUSDT     │ 2023 11 21 13:05:00 │ 2023 11 21 21:25:00 │ LONG         │ 0.57%  │ -2.30%  │ 0.41       │ rsiDivergency5m │
// │  290 │ SSVUSDT      │ 2023 11 21 23:00:00 │ 2023 11 22 00:15:00 │ SHORT        │ -0.55% │ -2.85%  │ 16.93      │ rsiDivergency5m │
// │  291 │ INJUSDT      │ 2023 11 22 01:15:00 │ 2023 11 22 04:40:00 │ SHORT        │ -0.55% │ -3.40%  │ 15.10      │ rsiDivergency5m │
// │  292 │ INJUSDT      │ 2023 11 22 16:10:00 │ 2023 11 23 00:30:00 │ SHORT        │ 0.71%  │ -2.69%  │ 16.48      │ rsiDivergency5m │
// │  293 │ SSVUSDT      │ 2023 11 23 04:45:00 │ 2023 11 23 09:40:00 │ SHORT        │ -0.55% │ -3.24%  │ 19.40      │ rsiDivergency5m │
// │  294 │ GASUSDT      │ 2023 11 23 11:15:00 │ 2023 11 23 19:35:00 │ LONG         │ 1.45%  │ -1.79%  │ 8.60       │ rsiDivergency5m │
// │  295 │ GASUSDT      │ 2023 11 23 19:40:00 │ 2023 11 23 19:50:00 │ SHORT        │ -0.55% │ -2.34%  │ 9.12       │ rsiDivergency5m │
// │  296 │ FETUSDT      │ 2023 11 24 00:50:00 │ 2023 11 24 03:10:00 │ SHORT        │ -0.55% │ -2.89%  │ 0.54       │ rsiDivergency5m │
// │  297 │ DARUSDT      │ 2023 11 24 14:55:00 │ 2023 11 24 15:00:00 │ SHORT        │ -0.55% │ -3.44%  │ 0.13       │ rsiDivergency5m │
// │  298 │ DARUSDT      │ 2023 11 24 15:20:00 │ 2023 11 24 23:40:00 │ SHORT        │ 0.62%  │ -2.82%  │ 0.13       │ rsiDivergency5m │
// │  299 │ GMTUSDT      │ 2023 11 25 01:40:00 │ 2023 11 25 02:15:00 │ SHORT        │ -0.55% │ -3.37%  │ 0.33       │ rsiDivergency5m │
// │  300 │ GMTUSDT      │ 2023 11 25 02:35:00 │ 2023 11 25 10:35:00 │ SHORT        │ -0.55% │ -3.92%  │ 0.34       │ rsiDivergency5m │
// │  301 │ KLAYUSDT     │ 2023 11 25 21:00:00 │ 2023 11 26 05:20:00 │ LONG         │ -0.50% │ -4.42%  │ 0.22       │ rsiDivergency5m │
// │  302 │ ROSEUSDT     │ 2023 11 26 05:25:00 │ 2023 11 26 13:45:00 │ SHORT        │ 0.78%  │ -3.64%  │ 0.08       │ rsiDivergency5m │
// │  303 │ GMTUSDT      │ 2023 11 26 22:20:00 │ 2023 11 26 22:35:00 │ LONG         │ -0.55% │ -4.19%  │ 0.30       │ rsiDivergency5m │
// │  304 │ TLMUSDT      │ 2023 11 26 23:25:00 │ 2023 11 27 02:00:00 │ LONG         │ -0.55% │ -4.74%  │ 0.02       │ rsiDivergency5m │
// │  305 │ TLMUSDT      │ 2023 11 27 02:25:00 │ 2023 11 27 10:45:00 │ LONG         │ 0.02%  │ -4.72%  │ 0.01       │ rsiDivergency5m │
// │  306 │ BEAMXUSDT    │ 2023 11 27 13:30:00 │ 2023 11 27 21:50:00 │ LONG         │ 0.67%  │ -4.05%  │ 0.01       │ rsiDivergency5m │
// │  307 │ ALPHAUSDT    │ 2023 11 27 23:35:00 │ 2023 11 28 00:00:00 │ LONG         │ -0.55% │ -4.60%  │ 0.10       │ rsiDivergency5m │
// │  308 │ BIGTIMEUSDT  │ 2023 11 28 00:10:00 │ 2023 11 28 02:15:00 │ LONG         │ -0.55% │ -5.15%  │ 0.20       │ rsiDivergency5m │
// │  309 │ 1000BONKUSDT │ 2023 11 28 06:40:00 │ 2023 11 28 09:05:00 │ SHORT        │ -0.55% │ -5.70%  │ 0.00       │ rsiDivergency5m │
// │  310 │ 1000BONKUSDT │ 2023 11 28 09:15:00 │ 2023 11 28 17:35:00 │ SHORT        │ 0.65%  │ -5.06%  │ 0.00       │ rsiDivergency5m │
// │  311 │ SSVUSDT      │ 2023 11 28 20:25:00 │ 2023 11 29 04:45:00 │ SHORT        │ 0.67%  │ -4.39%  │ 25.86      │ rsiDivergency5m │
// │  312 │ ONGUSDT      │ 2023 11 29 07:30:00 │ 2023 11 29 07:40:00 │ LONG         │ -0.55% │ -4.94%  │ 0.43       │ rsiDivergency5m │
// │  313 │ TRUUSDT      │ 2023 11 29 20:00:00 │ 2023 11 30 01:10:00 │ LONG         │ -0.55% │ -5.49%  │ 0.06       │ rsiDivergency5m │
// │  314 │ BIGTIMEUSDT  │ 2023 12 01 12:30:00 │ 2023 12 01 13:00:00 │ SHORT        │ -0.55% │ -6.04%  │ 0.27       │ rsiDivergency5m │
// │  315 │ BIGTIMEUSDT  │ 2023 12 01 13:10:00 │ 2023 12 01 13:25:00 │ SHORT        │ -0.55% │ -6.59%  │ 0.28       │ rsiDivergency5m │
// │  316 │ BIGTIMEUSDT  │ 2023 12 01 13:35:00 │ 2023 12 01 14:45:00 │ SHORT        │ -0.55% │ -7.14%  │ 0.28       │ rsiDivergency5m │
// │  317 │ ORDIUSDT     │ 2023 12 01 22:45:00 │ 2023 12 02 00:35:00 │ SHORT        │ -0.55% │ -7.69%  │ 23.27      │ rsiDivergency5m │
// │  318 │ IOTAUSDT     │ 2023 12 02 04:10:00 │ 2023 12 02 09:35:00 │ SHORT        │ -0.55% │ -8.24%  │ 0.28       │ rsiDivergency5m │
// │  319 │ ORDIUSDT     │ 2023 12 02 09:40:00 │ 2023 12 02 10:25:00 │ SHORT        │ -0.55% │ -8.79%  │ 26.94      │ rsiDivergency5m │
// │  320 │ ORDIUSDT     │ 2023 12 02 10:50:00 │ 2023 12 02 11:00:00 │ SHORT        │ -0.55% │ -9.34%  │ 27.86      │ rsiDivergency5m │
// │  321 │ 1000BONKUSDT │ 2023 12 02 19:55:00 │ 2023 12 02 20:00:00 │ SHORT        │ -0.55% │ -9.89%  │ 0.01       │ rsiDivergency5m │
// │  322 │ IDUSDT       │ 2023 12 02 22:30:00 │ 2023 12 03 06:50:00 │ SHORT        │ 0.53%  │ -9.36%  │ 0.31       │ rsiDivergency5m │
// │  323 │ XVSUSDT      │ 2023 12 03 07:30:00 │ 2023 12 03 07:55:00 │ SHORT        │ -0.55% │ -9.91%  │ 8.14       │ rsiDivergency5m │
// │  324 │ XVSUSDT      │ 2023 12 03 08:05:00 │ 2023 12 03 08:20:00 │ SHORT        │ -0.55% │ -10.46% │ 8.47       │ rsiDivergency5m │
// │  325 │ XVSUSDT      │ 2023 12 03 08:25:00 │ 2023 12 03 08:35:00 │ SHORT        │ -0.55% │ -11.01% │ 8.61       │ rsiDivergency5m │
// │  326 │ BEAMXUSDT    │ 2023 12 03 11:35:00 │ 2023 12 03 19:55:00 │ SHORT        │ 0.33%  │ -10.68% │ 0.01       │ rsiDivergency5m │
// │  327 │ RENUSDT      │ 2023 12 03 22:45:00 │ 2023 12 03 22:50:00 │ SHORT        │ -0.55% │ -11.23% │ 0.06       │ rsiDivergency5m │
// │  328 │ RENUSDT      │ 2023 12 03 22:55:00 │ 2023 12 03 23:05:00 │ SHORT        │ -0.55% │ -11.78% │ 0.06       │ rsiDivergency5m │
// │  329 │ IOTAUSDT     │ 2023 12 03 23:30:00 │ 2023 12 04 00:15:00 │ SHORT        │ -0.55% │ -12.33% │ 0.36       │ rsiDivergency5m │
// │  330 │ PENDLEUSDT   │ 2023 12 04 01:50:00 │ 2023 12 04 02:15:00 │ SHORT        │ -0.55% │ -12.88% │ 1.34       │ rsiDivergency5m │
// │  331 │ SSVUSDT      │ 2023 12 04 06:00:00 │ 2023 12 04 06:10:00 │ LONG         │ -0.55% │ -13.43% │ 26.78      │ rsiDivergency5m │
// │  332 │ STGUSDT      │ 2023 12 04 06:50:00 │ 2023 12 04 10:30:00 │ LONG         │ -0.55% │ -13.98% │ 0.56       │ rsiDivergency5m │
// │  333 │ CFXUSDT      │ 2023 12 04 13:30:00 │ 2023 12 04 14:15:00 │ SHORT        │ -0.55% │ -14.53% │ 0.20       │ rsiDivergency5m │
// │  334 │ CFXUSDT      │ 2023 12 04 14:25:00 │ 2023 12 04 17:00:00 │ SHORT        │ -0.55% │ -15.08% │ 0.20       │ rsiDivergency5m │
// │  335 │ 1000SHIBUSDT │ 2023 12 04 17:25:00 │ 2023 12 05 01:45:00 │ SHORT        │ -0.07% │ -15.15% │ 0.01       │ rsiDivergency5m │
// │  336 │ STXUSDT      │ 2023 12 05 10:40:00 │ 2023 12 05 19:00:00 │ SHORT        │ 1.35%  │ -13.80% │ 1.24       │ rsiDivergency5m │
// │  337 │ FRONTUSDT    │ 2023 12 05 20:05:00 │ 2023 12 06 04:25:00 │ SHORT        │ 1.42%  │ -12.37% │ 0.38       │ rsiDivergency5m │
// │  338 │ BONDUSDT     │ 2023 12 06 06:25:00 │ 2023 12 06 06:35:00 │ LONG         │ -0.55% │ -12.92% │ 3.65       │ rsiDivergency5m │
// │  339 │ HIFIUSDT     │ 2023 12 06 06:40:00 │ 2023 12 06 12:20:00 │ LONG         │ 2.45%  │ -10.47% │ 0.74       │ rsiDivergency5m │
// │  340 │ HIFIUSDT     │ 2023 12 06 20:10:00 │ 2023 12 07 04:30:00 │ SHORT        │ 0.55%  │ -9.92%  │ 0.82       │ rsiDivergency5m │
// │  341 │ MAVUSDT      │ 2023 12 07 10:40:00 │ 2023 12 07 13:00:00 │ SHORT        │ -0.55% │ -10.47% │ 0.38       │ rsiDivergency5m │
// │  342 │ INJUSDT      │ 2023 12 07 13:05:00 │ 2023 12 07 21:25:00 │ SHORT        │ 0.14%  │ -10.33% │ 18.58      │ rsiDivergency5m │
// │  343 │ SSVUSDT      │ 2023 12 07 22:15:00 │ 2023 12 08 01:55:00 │ LONG         │ -0.55% │ -10.88% │ 26.48      │ rsiDivergency5m │
// │  344 │ HOTUSDT      │ 2023 12 08 03:40:00 │ 2023 12 08 12:00:00 │ SHORT        │ 0.96%  │ -9.92%  │ 0.00       │ rsiDivergency5m │
// │  345 │ ORDIUSDT     │ 2023 12 08 15:20:00 │ 2023 12 08 15:50:00 │ SHORT        │ -0.55% │ -10.47% │ 50.43      │ rsiDivergency5m │
// │  346 │ ORDIUSDT     │ 2023 12 08 16:10:00 │ 2023 12 08 19:45:00 │ SHORT        │ -0.55% │ -11.02% │ 52.01      │ rsiDivergency5m │
// │  347 │ ORDIUSDT     │ 2023 12 08 19:50:00 │ 2023 12 08 20:00:00 │ SHORT        │ -0.55% │ -11.57% │ 53.38      │ rsiDivergency5m │
// │  348 │ ADAUSDT      │ 2023 12 08 22:20:00 │ 2023 12 08 23:00:00 │ SHORT        │ -0.55% │ -12.12% │ 0.57       │ rsiDivergency5m │
// │  349 │ IMXUSDT      │ 2023 12 09 00:50:00 │ 2023 12 09 01:00:00 │ SHORT        │ -0.55% │ -12.67% │ 1.68       │ rsiDivergency5m │
// │  350 │ IMXUSDT      │ 2023 12 09 02:10:00 │ 2023 12 09 02:35:00 │ SHORT        │ -0.55% │ -13.22% │ 1.77       │ rsiDivergency5m │
// │  351 │ 1000BONKUSDT │ 2023 12 09 03:20:00 │ 2023 12 09 05:50:00 │ SHORT        │ -0.55% │ -13.77% │ 0.01       │ rsiDivergency5m │
// │  352 │ ALGOUSDT     │ 2023 12 09 09:15:00 │ 2023 12 09 12:15:00 │ SHORT        │ 2.45%  │ -11.32% │ 0.22       │ rsiDivergency5m │
// │  353 │ BEAMXUSDT    │ 2023 12 09 13:35:00 │ 2023 12 09 14:50:00 │ SHORT        │ -0.55% │ -11.87% │ 0.02       │ rsiDivergency5m │
// │  354 │ USTCUSDT     │ 2023 12 09 19:10:00 │ 2023 12 10 02:45:00 │ LONG         │ 2.45%  │ -9.42%  │ 0.04       │ rsiDivergency5m │
// │  355 │ HOTUSDT      │ 2023 12 10 03:00:00 │ 2023 12 10 11:20:00 │ SHORT        │ 0.76%  │ -8.67%  │ 0.00       │ rsiDivergency5m │
// │  356 │ POWRUSDT     │ 2023 12 10 13:40:00 │ 2023 12 10 16:10:00 │ SHORT        │ -0.55% │ -9.22%  │ 0.39       │ rsiDivergency5m │
// │  357 │ INJUSDT      │ 2023 12 10 18:50:00 │ 2023 12 10 21:10:00 │ SHORT        │ 2.45%  │ -6.77%  │ 21.35      │ rsiDivergency5m │
// │  358 │ PENDLEUSDT   │ 2023 12 10 22:00:00 │ 2023 12 11 00:45:00 │ LONG         │ -0.55% │ -7.32%  │ 1.14       │ rsiDivergency5m │
// │  359 │ WLDUSDT      │ 2023 12 11 01:20:00 │ 2023 12 11 09:40:00 │ LONG         │ -0.26% │ -7.57%  │ 2.47       │ rsiDivergency5m │
// │  360 │ NTRNUSDT     │ 2023 12 11 10:20:00 │ 2023 12 11 10:30:00 │ SHORT        │ -0.55% │ -8.12%  │ 0.65       │ rsiDivergency5m │
// │  361 │ NTRNUSDT     │ 2023 12 11 10:35:00 │ 2023 12 11 12:05:00 │ SHORT        │ -0.55% │ -8.67%  │ 0.66       │ rsiDivergency5m │
// │  362 │ LINAUSDT     │ 2023 12 11 13:30:00 │ 2023 12 11 21:50:00 │ LONG         │ 1.15%  │ -7.52%  │ 0.01       │ rsiDivergency5m │
// │  363 │ HOOKUSDT     │ 2023 12 11 22:00:00 │ 2023 12 12 06:20:00 │ SHORT        │ 0.22%  │ -7.30%  │ 1.20       │ rsiDivergency5m │
// │  364 │ POWRUSDT     │ 2023 12 12 07:00:00 │ 2023 12 12 15:20:00 │ LONG         │ 1.73%  │ -5.58%  │ 0.37       │ rsiDivergency5m │
// │  365 │ BONDUSDT     │ 2023 12 12 18:10:00 │ 2023 12 12 18:30:00 │ SHORT        │ -0.55% │ -6.13%  │ 4.14       │ rsiDivergency5m │
// │  366 │ ALICEUSDT    │ 2023 12 12 18:40:00 │ 2023 12 13 03:00:00 │ SHORT        │ 1.47%  │ -4.66%  │ 1.35       │ rsiDivergency5m │
// │  367 │ ALICEUSDT    │ 2023 12 13 04:55:00 │ 2023 12 13 13:15:00 │ SHORT        │ 1.35%  │ -3.31%  │ 1.31       │ rsiDivergency5m │
// │  368 │ HFTUSDT      │ 2023 12 13 13:50:00 │ 2023 12 13 14:15:00 │ SHORT        │ -0.55% │ -3.86%  │ 0.36       │ rsiDivergency5m │
// │  369 │ NTRNUSDT     │ 2023 12 13 14:35:00 │ 2023 12 13 14:55:00 │ SHORT        │ -0.55% │ -4.41%  │ 0.85       │ rsiDivergency5m │
// │  370 │ COTIUSDT     │ 2023 12 13 15:10:00 │ 2023 12 13 15:35:00 │ SHORT        │ -0.55% │ -4.96%  │ 0.07       │ rsiDivergency5m │
// │  371 │ INJUSDT      │ 2023 12 13 15:55:00 │ 2023 12 13 19:05:00 │ SHORT        │ -0.55% │ -5.51%  │ 29.28      │ rsiDivergency5m │
// │  372 │ FRONTUSDT    │ 2023 12 13 19:15:00 │ 2023 12 14 03:35:00 │ SHORT        │ 1.53%  │ -3.97%  │ 0.38       │ rsiDivergency5m │
// │  373 │ SKLUSDT      │ 2023 12 14 05:25:00 │ 2023 12 14 13:45:00 │ SHORT        │ 0.43%  │ -3.55%  │ 0.05       │ rsiDivergency5m │
// │  374 │ NTRNUSDT     │ 2023 12 14 16:40:00 │ 2023 12 15 01:00:00 │ SHORT        │ 1.55%  │ -2.00%  │ 1.09       │ rsiDivergency5m │
// │  375 │ POWRUSDT     │ 2023 12 15 02:10:00 │ 2023 12 15 10:30:00 │ LONG         │ -0.17% │ -2.17%  │ 0.37       │ rsiDivergency5m │
// │  376 │ FRONTUSDT    │ 2023 12 15 11:25:00 │ 2023 12 15 11:30:00 │ SHORT        │ -0.55% │ -2.72%  │ 0.41       │ rsiDivergency5m │
// │  377 │ INJUSDT      │ 2023 12 15 11:35:00 │ 2023 12 15 18:20:00 │ SHORT        │ 2.45%  │ -0.27%  │ 34.17      │ rsiDivergency5m │
// │  378 │ BEAMXUSDT    │ 2023 12 15 18:25:00 │ 2023 12 15 19:30:00 │ LONG         │ -0.55% │ -0.82%  │ 0.02       │ rsiDivergency5m │
// │  379 │ BEAMXUSDT    │ 2023 12 15 19:35:00 │ 2023 12 16 03:55:00 │ LONG         │ 1.19%  │ 0.38%   │ 0.02       │ rsiDivergency5m │
// │  380 │ DYDXUSDT     │ 2023 12 16 07:40:00 │ 2023 12 16 11:50:00 │ SHORT        │ -0.55% │ -0.17%  │ 3.13       │ rsiDivergency5m │
// │  381 │ INJUSDT      │ 2023 12 16 12:10:00 │ 2023 12 16 14:45:00 │ SHORT        │ 2.45%  │ 2.28%   │ 32.48      │ rsiDivergency5m │
// │  382 │ 1000SHIBUSDT │ 2023 12 16 15:05:00 │ 2023 12 16 15:15:00 │ SHORT        │ -0.55% │ 1.73%   │ 0.01       │ rsiDivergency5m │
// │  383 │ 1000SHIBUSDT │ 2023 12 16 18:35:00 │ 2023 12 16 19:05:00 │ SHORT        │ -0.55% │ 1.18%   │ 0.01       │ rsiDivergency5m │
// │  384 │ ARUSDT       │ 2023 12 17 01:40:00 │ 2023 12 17 04:10:00 │ LONG         │ -0.55% │ 0.63%   │ 10.26      │ rsiDivergency5m │
// │  385 │ IDUSDT       │ 2023 12 17 06:40:00 │ 2023 12 17 15:00:00 │ SHORT        │ 1.38%  │ 2.01%   │ 0.32       │ rsiDivergency5m │
// │  386 │ XVSUSDT      │ 2023 12 17 18:20:00 │ 2023 12 17 21:00:00 │ LONG         │ -0.55% │ 1.46%   │ 9.81       │ rsiDivergency5m │
// │  387 │ DARUSDT      │ 2023 12 17 21:05:00 │ 2023 12 17 21:35:00 │ LONG         │ -0.55% │ 0.91%   │ 0.14       │ rsiDivergency5m │
// │  388 │ HIGHUSDT     │ 2023 12 17 21:40:00 │ 2023 12 18 02:50:00 │ LONG         │ -0.55% │ 0.36%   │ 1.65       │ rsiDivergency5m │
// │  389 │ IDUSDT       │ 2023 12 18 02:55:00 │ 2023 12 18 04:20:00 │ LONG         │ -0.55% │ -0.19%  │ 0.27       │ rsiDivergency5m │
// │  390 │ BEAMXUSDT    │ 2023 12 18 04:25:00 │ 2023 12 18 05:25:00 │ LONG         │ -0.55% │ -0.74%  │ 0.02       │ rsiDivergency5m │
// │  391 │ YGGUSDT      │ 2023 12 18 05:35:00 │ 2023 12 18 13:55:00 │ LONG         │ 0.65%  │ -0.09%  │ 0.36       │ rsiDivergency5m │
// │  392 │ VETUSDT      │ 2023 12 18 14:05:00 │ 2023 12 18 16:05:00 │ SHORT        │ -0.55% │ -0.64%  │ 0.03       │ rsiDivergency5m │
// │  393 │ USTCUSDT     │ 2023 12 18 16:30:00 │ 2023 12 18 20:50:00 │ SHORT        │ -0.55% │ -1.19%  │ 0.03       │ rsiDivergency5m │
// │  394 │ 1000BONKUSDT │ 2023 12 18 21:00:00 │ 2023 12 18 21:05:00 │ SHORT        │ -0.55% │ -1.74%  │ 0.02       │ rsiDivergency5m │
// │  395 │ 1000BONKUSDT │ 2023 12 18 21:10:00 │ 2023 12 19 02:30:00 │ SHORT        │ 2.45%  │ 0.71%   │ 0.02       │ rsiDivergency5m │
// │  396 │ ROSEUSDT     │ 2023 12 19 04:20:00 │ 2023 12 19 06:05:00 │ SHORT        │ -0.55% │ 0.16%   │ 0.09       │ rsiDivergency5m │
// │  397 │ UMAUSDT      │ 2023 12 19 06:45:00 │ 2023 12 19 15:05:00 │ SHORT        │ 0.52%  │ 0.68%   │ 2.28       │ rsiDivergency5m │
// │  398 │ SUPERUSDT    │ 2023 12 19 18:20:00 │ 2023 12 20 02:40:00 │ LONG         │ 0.31%  │ 1.00%   │ 0.57       │ rsiDivergency5m │
// │  399 │ OXTUSDT      │ 2023 12 20 03:40:00 │ 2023 12 20 04:35:00 │ SHORT        │ -0.55% │ 0.45%   │ 0.11       │ rsiDivergency5m │
// │  400 │ LPTUSDT      │ 2023 12 20 07:00:00 │ 2023 12 20 09:00:00 │ SHORT        │ -0.55% │ -0.10%  │ 8.76       │ rsiDivergency5m │
// │  401 │ SKLUSDT      │ 2023 12 20 09:40:00 │ 2023 12 20 11:00:00 │ SHORT        │ -0.55% │ -0.65%  │ 0.05       │ rsiDivergency5m │
// │  402 │ BIGTIMEUSDT  │ 2023 12 20 12:05:00 │ 2023 12 20 12:55:00 │ SHORT        │ -0.55% │ -1.20%  │ 0.58       │ rsiDivergency5m │
// │  403 │ LEVERUSDT    │ 2023 12 20 18:45:00 │ 2023 12 20 18:55:00 │ SHORT        │ -0.55% │ -1.75%  │ 0.00       │ rsiDivergency5m │
// │  404 │ BIGTIMEUSDT  │ 2023 12 21 00:40:00 │ 2023 12 21 09:00:00 │ LONG         │ -0.24% │ -2.00%  │ 0.54       │ rsiDivergency5m │
// │  405 │ ORDIUSDT     │ 2023 12 21 09:15:00 │ 2023 12 21 11:35:00 │ LONG         │ -0.55% │ -2.55%  │ 52.32      │ rsiDivergency5m │
// │  406 │ OXTUSDT      │ 2023 12 21 11:50:00 │ 2023 12 21 20:10:00 │ LONG         │ 0.30%  │ -2.25%  │ 0.09       │ rsiDivergency5m │
// │  407 │ SKLUSDT      │ 2023 12 21 23:10:00 │ 2023 12 22 07:30:00 │ SHORT        │ 1.22%  │ -1.03%  │ 0.06       │ rsiDivergency5m │
// │  408 │ DODOXUSDT    │ 2023 12 22 10:50:00 │ 2023 12 22 19:10:00 │ SHORT        │ 0.49%  │ -0.54%  │ 0.19       │ rsiDivergency5m │
// │  409 │ APTUSDT      │ 2023 12 22 19:15:00 │ 2023 12 22 19:30:00 │ SHORT        │ -0.55% │ -1.09%  │ 9.62       │ rsiDivergency5m │
// │  410 │ STXUSDT      │ 2023 12 22 19:40:00 │ 2023 12 22 21:05:00 │ SHORT        │ -0.55% │ -1.64%  │ 1.45       │ rsiDivergency5m │
// │  411 │ SSVUSDT      │ 2023 12 22 22:00:00 │ 2023 12 22 22:55:00 │ LONG         │ -0.55% │ -2.19%  │ 24.82      │ rsiDivergency5m │
// │  412 │ USTCUSDT     │ 2023 12 22 23:05:00 │ 2023 12 23 07:25:00 │ LONG         │ -0.08% │ -2.27%  │ 0.04       │ rsiDivergency5m │
// │  413 │ C98USDT      │ 2023 12 23 08:00:00 │ 2023 12 23 08:15:00 │ SHORT        │ -0.55% │ -2.82%  │ 0.27       │ rsiDivergency5m │
// │  414 │ SFPUSDT      │ 2023 12 23 11:15:00 │ 2023 12 23 11:45:00 │ SHORT        │ -0.55% │ -3.37%  │ 0.82       │ rsiDivergency5m │
// │  415 │ SUPERUSDT    │ 2023 12 23 19:55:00 │ 2023 12 24 04:15:00 │ LONG         │ 0.28%  │ -3.09%  │ 0.66       │ rsiDivergency5m │
// │  416 │ SPELLUSDT    │ 2023 12 24 08:10:00 │ 2023 12 24 08:50:00 │ SHORT        │ -0.55% │ -3.64%  │ 0.00       │ rsiDivergency5m │
// │  417 │ ARUSDT       │ 2023 12 24 09:35:00 │ 2023 12 24 09:40:00 │ SHORT        │ -0.55% │ -4.19%  │ 11.01      │ rsiDivergency5m │
// │  418 │ CELRUSDT     │ 2023 12 24 11:50:00 │ 2023 12 24 12:30:00 │ SHORT        │ -0.55% │ -4.74%  │ 0.02       │ rsiDivergency5m │
// │  419 │ NTRNUSDT     │ 2023 12 24 13:15:00 │ 2023 12 24 14:20:00 │ SHORT        │ -0.55% │ -5.29%  │ 1.19       │ rsiDivergency5m │
// │  420 │ HOTUSDT      │ 2023 12 24 16:50:00 │ 2023 12 24 17:15:00 │ LONG         │ -0.55% │ -5.84%  │ 0.00       │ rsiDivergency5m │
// │  421 │ INJUSDT      │ 2023 12 24 19:45:00 │ 2023 12 25 04:05:00 │ LONG         │ 0.38%  │ -5.46%  │ 39.90      │ rsiDivergency5m │
// │  422 │ LEVERUSDT    │ 2023 12 25 06:15:00 │ 2023 12 25 06:20:00 │ SHORT        │ -0.55% │ -6.01%  │ 0.00       │ rsiDivergency5m │
// │  423 │ WLDUSDT      │ 2023 12 25 06:30:00 │ 2023 12 25 07:55:00 │ SHORT        │ -0.55% │ -6.56%  │ 3.66       │ rsiDivergency5m │
// │  424 │ RENUSDT      │ 2023 12 25 08:15:00 │ 2023 12 25 10:00:00 │ SHORT        │ -0.55% │ -7.11%  │ 0.07       │ rsiDivergency5m │
// │  425 │ NTRNUSDT     │ 2023 12 25 20:45:00 │ 2023 12 25 21:15:00 │ SHORT        │ -0.55% │ -7.66%  │ 1.26       │ rsiDivergency5m │
// │  426 │ SANDUSDT     │ 2023 12 25 21:25:00 │ 2023 12 25 21:40:00 │ SHORT        │ -0.55% │ -8.21%  │ 0.65       │ rsiDivergency5m │
// │  427 │ WLDUSDT      │ 2023 12 25 22:20:00 │ 2023 12 25 22:40:00 │ SHORT        │ -0.55% │ -8.76%  │ 3.99       │ rsiDivergency5m │
// │  428 │ NTRNUSDT     │ 2023 12 26 00:20:00 │ 2023 12 26 00:50:00 │ SHORT        │ -0.55% │ -9.31%  │ 1.36       │ rsiDivergency5m │
// │  429 │ BEAMXUSDT    │ 2023 12 26 01:05:00 │ 2023 12 26 09:25:00 │ LONG         │ 1.02%  │ -8.29%  │ 0.02       │ rsiDivergency5m │
// │  430 │ 1000BONKUSDT │ 2023 12 26 12:15:00 │ 2023 12 26 12:35:00 │ LONG         │ -0.55% │ -8.84%  │ 0.02       │ rsiDivergency5m │
// │  431 │ STXUSDT      │ 2023 12 26 14:40:00 │ 2023 12 26 15:45:00 │ SHORT        │ -0.55% │ -9.39%  │ 1.62       │ rsiDivergency5m │
// │  432 │ TOKENUSDT    │ 2023 12 26 17:10:00 │ 2023 12 26 19:05:00 │ SHORT        │ -0.55% │ -9.94%  │ 0.04       │ rsiDivergency5m │
// │  433 │ CFXUSDT      │ 2023 12 26 19:20:00 │ 2023 12 27 03:40:00 │ SHORT        │ 0.64%  │ -9.30%  │ 0.20       │ rsiDivergency5m │
// │  434 │ 1000SATSUSDT │ 2023 12 27 04:45:00 │ 2023 12 27 13:05:00 │ SHORT        │ 1.09%  │ -8.21%  │ 0.00       │ rsiDivergency5m │
// │  435 │ LDOUSDT      │ 2023 12 27 17:10:00 │ 2023 12 27 19:35:00 │ SHORT        │ -0.55% │ -8.76%  │ 2.84       │ rsiDivergency5m │
// │  436 │ MINAUSDT     │ 2023 12 27 21:10:00 │ 2023 12 28 00:20:00 │ LONG         │ -0.55% │ -9.31%  │ 1.30       │ rsiDivergency5m │
// │  437 │ LEVERUSDT    │ 2023 12 28 01:55:00 │ 2023 12 28 07:55:00 │ LONG         │ -0.55% │ -9.86%  │ 0.00       │ rsiDivergency5m │
// │  438 │ RSRUSDT      │ 2023 12 28 08:45:00 │ 2023 12 28 09:05:00 │ LONG         │ -0.55% │ -10.41% │ 0.00       │ rsiDivergency5m │
// │  439 │ NTRNUSDT     │ 2023 12 28 09:10:00 │ 2023 12 28 09:35:00 │ LONG         │ -0.55% │ -10.96% │ 1.08       │ rsiDivergency5m │
// │  440 │ RSRUSDT      │ 2023 12 28 09:45:00 │ 2023 12 28 18:05:00 │ LONG         │ 0.06%  │ -10.90% │ 0.00       │ rsiDivergency5m │
// │  441 │ ARUSDT       │ 2023 12 28 19:55:00 │ 2023 12 29 04:15:00 │ LONG         │ 0.87%  │ -10.03% │ 9.57       │ rsiDivergency5m │
// │  442 │ MINAUSDT     │ 2023 12 29 04:20:00 │ 2023 12 29 05:00:00 │ SHORT        │ -0.55% │ -10.58% │ 1.34       │ rsiDivergency5m │
// │  443 │ 1000BONKUSDT │ 2023 12 29 05:05:00 │ 2023 12 29 11:55:00 │ SHORT        │ 2.45%  │ -8.13%  │ 0.02       │ rsiDivergency5m │
// │  444 │ ORDIUSDT     │ 2023 12 29 12:10:00 │ 2023 12 29 19:45:00 │ LONG         │ 2.45%  │ -5.68%  │ 72.25      │ rsiDivergency5m │
// │  445 │ HFTUSDT      │ 2023 12 29 20:10:00 │ 2023 12 30 03:50:00 │ LONG         │ -0.55% │ -6.23%  │ 0.38       │ rsiDivergency5m │
// │  446 │ WLDUSDT      │ 2023 12 30 07:55:00 │ 2023 12 30 08:35:00 │ SHORT        │ -0.55% │ -6.78%  │ 3.73       │ rsiDivergency5m │
// │  447 │ GMXUSDT      │ 2023 12 30 10:00:00 │ 2023 12 30 10:35:00 │ SHORT        │ -0.55% │ -7.33%  │ 55.51      │ rsiDivergency5m │
// │  448 │ ORDIUSDT     │ 2023 12 30 13:55:00 │ 2023 12 30 22:15:00 │ SHORT        │ 1.27%  │ -6.06%  │ 83.14      │ rsiDivergency5m │
// │  449 │ ARBUSDT      │ 2023 12 31 07:30:00 │ 2023 12 31 15:50:00 │ SHORT        │ 1.30%  │ -4.76%  │ 1.65       │ rsiDivergency5m │
// │  450 │ USTCUSDT     │ 2023 12 31 18:25:00 │ 2023 12 31 23:15:00 │ LONG         │ -0.55% │ -5.31%  │ 0.03       │ rsiDivergency5m │
// │  451 │ TOKENUSDT    │ 2023 12 31 23:30:00 │ 2024 01 01 07:50:00 │ LONG         │ -0.07% │ -5.39%  │ 0.03       │ rsiDivergency5m │
// │  452 │ DEFIUSDT     │ 2024 01 01 08:10:00 │ 2024 01 01 14:55:00 │ SHORT        │ -0.55% │ -5.94%  │ 985.30     │ rsiDivergency5m │
// │  453 │ ARBUSDT      │ 2024 01 01 15:00:00 │ 2024 01 01 19:25:00 │ SHORT        │ -0.55% │ -6.49%  │ 1.72       │ rsiDivergency5m │
// │  454 │ STXUSDT      │ 2024 01 01 20:30:00 │ 2024 01 01 21:55:00 │ SHORT        │ -0.55% │ -7.04%  │ 1.68       │ rsiDivergency5m │
// │  455 │ BIGTIMEUSDT  │ 2024 01 01 23:15:00 │ 2024 01 01 23:35:00 │ SHORT        │ -0.55% │ -7.59%  │ 0.50       │ rsiDivergency5m │
// │  456 │ LDOUSDT      │ 2024 01 02 00:10:00 │ 2024 01 02 08:30:00 │ SHORT        │ 0.64%  │ -6.95%  │ 3.15       │ rsiDivergency5m │
// │  457 │ GMTUSDT      │ 2024 01 02 14:40:00 │ 2024 01 02 23:00:00 │ SHORT        │ 1.63%  │ -5.32%  │ 0.38       │ rsiDivergency5m │
// │  458 │ OXTUSDT      │ 2024 01 03 01:10:00 │ 2024 01 03 03:10:00 │ LONG         │ -0.55% │ -5.87%  │ 0.11       │ rsiDivergency5m │
// │  459 │ LINAUSDT     │ 2024 01 03 07:40:00 │ 2024 01 03 09:15:00 │ LONG         │ -0.55% │ -6.42%  │ 0.01       │ rsiDivergency5m │
// │  460 │ FRONTUSDT    │ 2024 01 03 11:55:00 │ 2024 01 03 12:45:00 │ SHORT        │ -0.55% │ -6.97%  │ 0.42       │ rsiDivergency5m │
// │  461 │ FRONTUSDT    │ 2024 01 03 13:25:00 │ 2024 01 03 15:30:00 │ SHORT        │ -0.55% │ -7.52%  │ 0.43       │ rsiDivergency5m │
// │  462 │ NKNUSDT      │ 2024 01 03 17:00:00 │ 2024 01 03 18:25:00 │ SHORT        │ -0.55% │ -8.07%  │ 0.12       │ rsiDivergency5m │
// │  463 │ HIGHUSDT     │ 2024 01 03 23:50:00 │ 2024 01 04 08:10:00 │ SHORT        │ 0.41%  │ -7.66%  │ 1.54       │ rsiDivergency5m │
// │  464 │ APTUSDT      │ 2024 01 04 08:20:00 │ 2024 01 04 09:35:00 │ SHORT        │ -0.55% │ -8.21%  │ 10.65      │ rsiDivergency5m │
// │  465 │ ARBUSDT      │ 2024 01 04 10:20:00 │ 2024 01 04 10:55:00 │ SHORT        │ -0.55% │ -8.76%  │ 2.02       │ rsiDivergency5m │
// │  466 │ PENDLEUSDT   │ 2024 01 04 12:25:00 │ 2024 01 04 13:50:00 │ SHORT        │ -0.55% │ -9.31%  │ 1.49       │ rsiDivergency5m │
// │  467 │ APTUSDT      │ 2024 01 04 18:15:00 │ 2024 01 04 20:45:00 │ LONG         │ -0.55% │ -9.86%  │ 10.41      │ rsiDivergency5m │
// │  468 │ NTRNUSDT     │ 2024 01 05 03:35:00 │ 2024 01 05 11:00:00 │ SHORT        │ 2.45%  │ -7.41%  │ 1.41       │ rsiDivergency5m │
// │  469 │ NKNUSDT      │ 2024 01 05 11:10:00 │ 2024 01 05 16:05:00 │ LONG         │ -0.55% │ -7.96%  │ 0.13       │ rsiDivergency5m │
// │  470 │ NKNUSDT      │ 2024 01 05 17:40:00 │ 2024 01 06 02:00:00 │ SHORT        │ 2.02%  │ -5.94%  │ 0.13       │ rsiDivergency5m │
// │  471 │ MINAUSDT     │ 2024 01 06 02:05:00 │ 2024 01 06 10:25:00 │ LONG         │ 0.80%  │ -5.14%  │ 1.08       │ rsiDivergency5m │
// │  472 │ GMTUSDT      │ 2024 01 06 10:55:00 │ 2024 01 06 11:00:00 │ SHORT        │ -0.55% │ -5.69%  │ 0.31       │ rsiDivergency5m │
// │  473 │ SUPERUSDT    │ 2024 01 06 11:05:00 │ 2024 01 06 19:25:00 │ SHORT        │ 0.57%  │ -5.12%  │ 0.57       │ rsiDivergency5m │
// │  474 │ FRONTUSDT    │ 2024 01 06 22:30:00 │ 2024 01 07 01:15:00 │ LONG         │ 2.45%  │ -2.67%  │ 0.44       │ rsiDivergency5m │
// │  475 │ IOTAUSDT     │ 2024 01 07 03:25:00 │ 2024 01 07 11:45:00 │ SHORT        │ 2.45%  │ -0.22%  │ 0.28       │ rsiDivergency5m │
// │  476 │ IDUSDT       │ 2024 01 07 11:50:00 │ 2024 01 07 17:15:00 │ LONG         │ -0.55% │ -0.77%  │ 0.29       │ rsiDivergency5m │
// │  477 │ 1INCHUSDT    │ 2024 01 07 18:30:00 │ 2024 01 07 19:50:00 │ LONG         │ -0.55% │ -1.32%  │ 0.41       │ rsiDivergency5m │
// │  478 │ NTRNUSDT     │ 2024 01 07 20:00:00 │ 2024 01 07 21:15:00 │ LONG         │ -0.55% │ -1.87%  │ 1.36       │ rsiDivergency5m │
// │  479 │ ONTUSDT      │ 2024 01 07 21:20:00 │ 2024 01 07 21:35:00 │ LONG         │ -0.55% │ -2.42%  │ 0.22       │ rsiDivergency5m │
// │  480 │ BEAMXUSDT    │ 2024 01 07 21:40:00 │ 2024 01 07 21:50:00 │ LONG         │ -0.55% │ -2.97%  │ 0.02       │ rsiDivergency5m │
// │  481 │ HIFIUSDT     │ 2024 01 07 21:55:00 │ 2024 01 07 22:25:00 │ LONG         │ -0.55% │ -3.52%  │ 0.58       │ rsiDivergency5m │
// │  482 │ SNXUSDT      │ 2024 01 07 22:30:00 │ 2024 01 08 06:50:00 │ LONG         │ 1.57%  │ -1.95%  │ 3.12       │ rsiDivergency5m │
// │  483 │ ZILUSDT      │ 2024 01 08 07:05:00 │ 2024 01 08 07:55:00 │ SHORT        │ -0.55% │ -2.50%  │ 0.02       │ rsiDivergency5m │
// │  484 │ COTIUSDT     │ 2024 01 08 08:00:00 │ 2024 01 08 13:10:00 │ SHORT        │ -0.55% │ -3.05%  │ 0.06       │ rsiDivergency5m │
// │  485 │ USTCUSDT     │ 2024 01 08 13:25:00 │ 2024 01 08 14:20:00 │ SHORT        │ -0.55% │ -3.60%  │ 0.03       │ rsiDivergency5m │
// │  486 │ USTCUSDT     │ 2024 01 08 14:25:00 │ 2024 01 08 22:45:00 │ SHORT        │ 0.57%  │ -3.03%  │ 0.03       │ rsiDivergency5m │
// │  487 │ 1000BONKUSDT │ 2024 01 09 02:25:00 │ 2024 01 09 07:55:00 │ SHORT        │ 2.45%  │ -0.58%  │ 0.01       │ rsiDivergency5m │
// │  488 │ GMTUSDT      │ 2024 01 09 09:25:00 │ 2024 01 09 11:30:00 │ LONG         │ -0.55% │ -1.13%  │ 0.32       │ rsiDivergency5m │
// │  489 │ BONDUSDT     │ 2024 01 09 11:35:00 │ 2024 01 09 14:25:00 │ LONG         │ -0.55% │ -1.68%  │ 3.37       │ rsiDivergency5m │
// │  490 │ ARBUSDT      │ 2024 01 09 15:20:00 │ 2024 01 09 17:10:00 │ LONG         │ 2.45%  │ 0.77%   │ 1.64       │ rsiDivergency5m │
// │  491 │ SSVUSDT      │ 2024 01 09 17:20:00 │ 2024 01 09 19:35:00 │ SHORT        │ -0.55% │ 0.22%   │ 32.49      │ rsiDivergency5m │
// │  492 │ SSVUSDT      │ 2024 01 09 19:40:00 │ 2024 01 10 04:00:00 │ SHORT        │ 0.61%  │ 0.83%   │ 33.10      │ rsiDivergency5m │
// │  493 │ ARBUSDT      │ 2024 01 10 05:25:00 │ 2024 01 10 13:45:00 │ SHORT        │ 0.40%  │ 1.22%   │ 2.02       │ rsiDivergency5m │
// │  494 │ SUPERUSDT    │ 2024 01 10 16:15:00 │ 2024 01 10 16:20:00 │ SHORT        │ -0.55% │ 0.67%   │ 0.55       │ rsiDivergency5m │
// │  495 │ DOTUSDT      │ 2024 01 10 17:00:00 │ 2024 01 10 17:25:00 │ SHORT        │ -0.55% │ 0.12%   │ 7.83       │ rsiDivergency5m │
// │  496 │ ORDIUSDT     │ 2024 01 10 17:30:00 │ 2024 01 10 18:10:00 │ SHORT        │ -0.55% │ -0.43%  │ 74.95      │ rsiDivergency5m │
// │  497 │ MAVUSDT      │ 2024 01 10 18:15:00 │ 2024 01 11 01:50:00 │ SHORT        │ -0.55% │ -0.98%  │ 0.50       │ rsiDivergency5m │
// │  498 │ NTRNUSDT     │ 2024 01 11 01:55:00 │ 2024 01 11 05:15:00 │ LONG         │ 2.45%  │ 1.47%   │ 1.43       │ rsiDivergency5m │
// │  499 │ BEAMXUSDT    │ 2024 01 11 05:20:00 │ 2024 01 11 06:55:00 │ SHORT        │ -0.55% │ 0.92%   │ 0.02       │ rsiDivergency5m │
// │  500 │ ARPAUSDT     │ 2024 01 11 07:15:00 │ 2024 01 11 15:35:00 │ SHORT        │ 0.41%  │ 1.33%   │ 0.07       │ rsiDivergency5m │
// │  501 │ FRONTUSDT    │ 2024 01 11 18:40:00 │ 2024 01 12 03:00:00 │ SHORT        │ 0.20%  │ 1.53%   │ 0.50       │ rsiDivergency5m │
// │  502 │ SSVUSDT      │ 2024 01 12 07:30:00 │ 2024 01 12 08:00:00 │ SHORT        │ -0.55% │ 0.98%   │ 38.57      │ rsiDivergency5m │
// │  503 │ WLDUSDT      │ 2024 01 12 08:15:00 │ 2024 01 12 08:35:00 │ SHORT        │ -0.55% │ 0.43%   │ 3.01       │ rsiDivergency5m │
// │  504 │ SSVUSDT      │ 2024 01 12 08:40:00 │ 2024 01 12 12:15:00 │ SHORT        │ 2.45%  │ 2.88%   │ 39.82      │ rsiDivergency5m │
// │  505 │ SKLUSDT      │ 2024 01 12 12:20:00 │ 2024 01 12 16:40:00 │ LONG         │ -0.55% │ 2.33%   │ 0.09       │ rsiDivergency5m │
// │  506 │ APTUSDT      │ 2024 01 12 17:05:00 │ 2024 01 12 17:20:00 │ LONG         │ -0.55% │ 1.78%   │ 8.98       │ rsiDivergency5m │
// │  507 │ MASKUSDT     │ 2024 01 12 20:00:00 │ 2024 01 12 20:10:00 │ LONG         │ -0.55% │ 1.23%   │ 3.61       │ rsiDivergency5m │
// │  508 │ SSVUSDT      │ 2024 01 12 20:15:00 │ 2024 01 13 04:35:00 │ LONG         │ 1.10%  │ 2.33%   │ 34.74      │ rsiDivergency5m │
// │  509 │ ENSUSDT      │ 2024 01 13 05:55:00 │ 2024 01 13 07:25:00 │ SHORT        │ -0.55% │ 1.78%   │ 24.37      │ rsiDivergency5m │
// │  510 │ LPTUSDT      │ 2024 01 13 07:30:00 │ 2024 01 13 15:50:00 │ SHORT        │ 1.05%  │ 2.83%   │ 8.21       │ rsiDivergency5m │
// │  511 │ TUSDT        │ 2024 01 13 20:00:00 │ 2024 01 14 02:40:00 │ SHORT        │ -0.55% │ 2.28%   │ 0.04       │ rsiDivergency5m │
// │  512 │ ACEUSDT      │ 2024 01 14 03:55:00 │ 2024 01 14 08:35:00 │ SHORT        │ -0.55% │ 1.73%   │ 9.81       │ rsiDivergency5m │
// │  513 │ SSVUSDT      │ 2024 01 14 11:45:00 │ 2024 01 14 14:35:00 │ LONG         │ -0.55% │ 1.18%   │ 34.07      │ rsiDivergency5m │
// │  514 │ SUPERUSDT    │ 2024 01 15 01:25:00 │ 2024 01 15 03:55:00 │ SHORT        │ -0.55% │ 0.63%   │ 0.64       │ rsiDivergency5m │
// │  515 │ BIGTIMEUSDT  │ 2024 01 15 04:45:00 │ 2024 01 15 06:45:00 │ SHORT        │ -0.55% │ 0.08%   │ 0.45       │ rsiDivergency5m │
// │  516 │ BIGTIMEUSDT  │ 2024 01 15 06:50:00 │ 2024 01 15 08:30:00 │ SHORT        │ -0.55% │ -0.47%  │ 0.46       │ rsiDivergency5m │
// │  517 │ AIUSDT       │ 2024 01 15 13:35:00 │ 2024 01 15 15:05:00 │ SHORT        │ -0.55% │ -1.02%  │ 1.42       │ rsiDivergency5m │
// │  518 │ USTCUSDT     │ 2024 01 15 15:30:00 │ 2024 01 15 23:50:00 │ SHORT        │ 1.37%  │ 0.36%   │ 0.03       │ rsiDivergency5m │
// │  519 │ MAVUSDT      │ 2024 01 15 23:55:00 │ 2024 01 16 00:10:00 │ SHORT        │ -0.55% │ -0.19%  │ 0.55       │ rsiDivergency5m │
// │  520 │ ENSUSDT      │ 2024 01 16 03:05:00 │ 2024 01 16 09:40:00 │ LONG         │ -0.55% │ -0.74%  │ 21.82      │ rsiDivergency5m │
// │  521 │ PENDLEUSDT   │ 2024 01 16 16:35:00 │ 2024 01 17 00:55:00 │ SHORT        │ 1.01%  │ 0.27%   │ 2.13       │ rsiDivergency5m │
// │  522 │ MAVUSDT      │ 2024 01 17 05:30:00 │ 2024 01 17 12:50:00 │ SHORT        │ -0.55% │ -0.28%  │ 0.69       │ rsiDivergency5m │
// │  523 │ AIUSDT       │ 2024 01 17 15:10:00 │ 2024 01 17 22:20:00 │ SHORT        │ 2.45%  │ 2.17%   │ 1.40       │ rsiDivergency5m │
// │  524 │ GASUSDT      │ 2024 01 17 23:30:00 │ 2024 01 18 03:20:00 │ SHORT        │ -0.55% │ 1.62%   │ 7.21       │ rsiDivergency5m │
// │  525 │ ARPAUSDT     │ 2024 01 18 10:30:00 │ 2024 01 18 12:50:00 │ LONG         │ -0.55% │ 1.07%   │ 0.07       │ rsiDivergency5m │
// │  526 │ HIGHUSDT     │ 2024 01 18 12:55:00 │ 2024 01 18 14:55:00 │ LONG         │ -0.55% │ 0.52%   │ 1.52       │ rsiDivergency5m │
// │  527 │ NTRNUSDT     │ 2024 01 18 15:00:00 │ 2024 01 18 23:20:00 │ LONG         │ -0.15% │ 0.37%   │ 1.22       │ rsiDivergency5m │
// │  528 │ USTCUSDT     │ 2024 01 19 00:30:00 │ 2024 01 19 08:50:00 │ LONG         │ 0.35%  │ 0.72%   │ 0.03       │ rsiDivergency5m │
// │  529 │ GASUSDT      │ 2024 01 19 11:10:00 │ 2024 01 19 11:40:00 │ LONG         │ -0.55% │ 0.17%   │ 6.62       │ rsiDivergency5m │
// │  530 │ GASUSDT      │ 2024 01 19 12:00:00 │ 2024 01 19 12:05:00 │ LONG         │ -0.55% │ -0.38%  │ 6.40       │ rsiDivergency5m │
// │  531 │ DARUSDT      │ 2024 01 19 12:10:00 │ 2024 01 19 20:30:00 │ LONG         │ 2.06%  │ 1.68%   │ 0.11       │ rsiDivergency5m │
// │  532 │ NFPUSDT      │ 2024 01 19 21:20:00 │ 2024 01 20 05:40:00 │ SHORT        │ 0.63%  │ 2.31%   │ 0.56       │ rsiDivergency5m │
// │  533 │ DOGEUSDT     │ 2024 01 20 18:25:00 │ 2024 01 21 02:45:00 │ SHORT        │ 0.86%  │ 3.17%   │ 0.09       │ rsiDivergency5m │
// │  534 │ PENDLEUSDT   │ 2024 01 21 03:15:00 │ 2024 01 21 04:45:00 │ SHORT        │ -0.55% │ 2.62%   │ 2.24       │ rsiDivergency5m │
// │  535 │ PENDLEUSDT   │ 2024 01 21 05:05:00 │ 2024 01 21 06:00:00 │ SHORT        │ -0.55% │ 2.07%   │ 2.29       │ rsiDivergency5m │
// │  536 │ FRONTUSDT    │ 2024 01 21 06:05:00 │ 2024 01 21 07:00:00 │ SHORT        │ -0.55% │ 1.52%   │ 0.50       │ rsiDivergency5m │
// │  537 │ SUIUSDT      │ 2024 01 21 20:30:00 │ 2024 01 22 04:50:00 │ LONG         │ 0.06%  │ 1.59%   │ 1.02       │ rsiDivergency5m │
// │  538 │ UMAUSDT      │ 2024 01 22 05:10:00 │ 2024 01 22 05:20:00 │ LONG         │ -0.55% │ 1.04%   │ 5.01       │ rsiDivergency5m │
// │  539 │ MAVUSDT      │ 2024 01 22 08:10:00 │ 2024 01 22 08:20:00 │ SHORT        │ -0.55% │ 0.49%   │ 0.55       │ rsiDivergency5m │
// │  540 │ PENDLEUSDT   │ 2024 01 23 02:45:00 │ 2024 01 23 04:25:00 │ LONG         │ -0.55% │ -0.06%  │ 1.92       │ rsiDivergency5m │
// │  541 │ BIGTIMEUSDT  │ 2024 01 23 04:30:00 │ 2024 01 23 09:00:00 │ LONG         │ -0.55% │ -0.61%  │ 0.32       │ rsiDivergency5m │
// │  542 │ BEAMXUSDT    │ 2024 01 23 12:25:00 │ 2024 01 23 17:50:00 │ SHORT        │ -0.55% │ -1.16%  │ 0.02       │ rsiDivergency5m │
// │  543 │ USTCUSDT     │ 2024 01 23 17:55:00 │ 2024 01 23 19:45:00 │ SHORT        │ -0.55% │ -1.71%  │ 0.02       │ rsiDivergency5m │
// │  544 │ ORDIUSDT     │ 2024 01 23 19:55:00 │ 2024 01 24 04:15:00 │ SHORT        │ 0.47%  │ -1.24%  │ 55.87      │ rsiDivergency5m │
// │  545 │ PENDLEUSDT   │ 2024 01 24 04:45:00 │ 2024 01 24 05:00:00 │ SHORT        │ -0.55% │ -1.79%  │ 2.18       │ rsiDivergency5m │
// │  546 │ MANTAUSDT    │ 2024 01 24 07:40:00 │ 2024 01 24 11:30:00 │ SHORT        │ -0.55% │ -2.34%  │ 2.96       │ rsiDivergency5m │
// │  547 │ SKLUSDT      │ 2024 01 24 12:15:00 │ 2024 01 24 12:40:00 │ SHORT        │ -0.55% │ -2.89%  │ 0.07       │ rsiDivergency5m │
// │  548 │ MAVUSDT      │ 2024 01 24 14:45:00 │ 2024 01 24 16:40:00 │ LONG         │ -0.55% │ -3.44%  │ 0.56       │ rsiDivergency5m │
// │  549 │ MAVUSDT      │ 2024 01 25 00:15:00 │ 2024 01 25 07:50:00 │ LONG         │ -0.55% │ -3.99%  │ 0.53       │ rsiDivergency5m │
// │  550 │ ORDIUSDT     │ 2024 01 25 08:20:00 │ 2024 01 25 16:40:00 │ LONG         │ 0.68%  │ -3.31%  │ 49.79      │ rsiDivergency5m │
// │  551 │ UMAUSDT      │ 2024 01 26 02:40:00 │ 2024 01 26 11:00:00 │ SHORT        │ 2.10%  │ -1.21%  │ 5.69       │ rsiDivergency5m │
// │  552 │ SUIUSDT      │ 2024 01 26 11:50:00 │ 2024 01 26 12:45:00 │ SHORT        │ -0.55% │ -1.76%  │ 1.34       │ rsiDivergency5m │
// │  553 │ SUIUSDT      │ 2024 01 26 13:10:00 │ 2024 01 26 14:15:00 │ SHORT        │ -0.55% │ -2.31%  │ 1.41       │ rsiDivergency5m │
// │  554 │ 1000SATSUSDT │ 2024 01 26 20:35:00 │ 2024 01 27 04:55:00 │ SHORT        │ 0.77%  │ -1.54%  │ 0.00       │ rsiDivergency5m │
// │  555 │ MANTAUSDT    │ 2024 01 27 05:10:00 │ 2024 01 27 10:35:00 │ SHORT        │ -0.55% │ -2.09%  │ 3.61       │ rsiDivergency5m │
// │  556 │ BIGTIMEUSDT  │ 2024 01 27 14:05:00 │ 2024 01 27 22:25:00 │ SHORT        │ 0.58%  │ -1.51%  │ 0.39       │ rsiDivergency5m │
// │  557 │ MANTAUSDT    │ 2024 01 28 07:25:00 │ 2024 01 28 15:45:00 │ LONG         │ 0.41%  │ -1.11%  │ 3.46       │ rsiDivergency5m │
// │  558 │ 1000BONKUSDT │ 2024 01 28 18:10:00 │ 2024 01 29 02:30:00 │ LONG         │ 0.59%  │ -0.52%  │ 0.01       │ rsiDivergency5m │
// │  559 │ LSKUSDT      │ 2024 01 29 06:35:00 │ 2024 01 29 10:50:00 │ SHORT        │ -0.55% │ -1.07%  │ 1.46       │ rsiDivergency5m │
// │  560 │ SUIUSDT      │ 2024 01 29 12:35:00 │ 2024 01 29 20:25:00 │ SHORT        │ -0.55% │ -1.62%  │ 1.55       │ rsiDivergency5m │
// │  561 │ HIGHUSDT     │ 2024 01 29 21:35:00 │ 2024 01 30 05:55:00 │ SHORT        │ 0.78%  │ -0.84%  │ 1.59       │ rsiDivergency5m │
// │  562 │ MAVUSDT      │ 2024 01 30 10:00:00 │ 2024 01 30 10:15:00 │ SHORT        │ -0.55% │ -1.39%  │ 0.65       │ rsiDivergency5m │
// │  563 │ MAVUSDT      │ 2024 01 30 11:35:00 │ 2024 01 30 12:05:00 │ SHORT        │ -0.55% │ -1.94%  │ 0.69       │ rsiDivergency5m │
// │  564 │ AIUSDT       │ 2024 01 30 14:30:00 │ 2024 01 30 22:50:00 │ SHORT        │ 0.28%  │ -1.65%  │ 1.36       │ rsiDivergency5m │
// │  565 │ OGNUSDT      │ 2024 01 31 03:50:00 │ 2024 01 31 05:40:00 │ LONG         │ -0.55% │ -2.20%  │ 0.16       │ rsiDivergency5m │
// │  566 │ CKBUSDT      │ 2024 01 31 13:30:00 │ 2024 01 31 21:00:00 │ SHORT        │ 2.45%  │ 0.25%   │ 0.00       │ rsiDivergency5m │
// │  567 │ SUPERUSDT    │ 2024 02 01 02:30:00 │ 2024 02 01 09:25:00 │ SHORT        │ -0.55% │ -0.30%  │ 0.59       │ rsiDivergency5m │
// │  568 │ MAVUSDT      │ 2024 02 01 17:40:00 │ 2024 02 02 00:10:00 │ LONG         │ -0.55% │ -0.85%  │ 0.67       │ rsiDivergency5m │
// │  569 │ CKBUSDT      │ 2024 02 02 00:50:00 │ 2024 02 02 02:00:00 │ LONG         │ -0.55% │ -1.40%  │ 0.00       │ rsiDivergency5m │
// │  570 │ CKBUSDT      │ 2024 02 02 02:30:00 │ 2024 02 02 09:15:00 │ LONG         │ -0.55% │ -1.95%  │ 0.00       │ rsiDivergency5m │
// │  571 │ ROSEUSDT     │ 2024 02 02 11:00:00 │ 2024 02 02 11:50:00 │ SHORT        │ -0.55% │ -2.50%  │ 0.11       │ rsiDivergency5m │
// │  572 │ ROSEUSDT     │ 2024 02 02 12:10:00 │ 2024 02 02 16:30:00 │ SHORT        │ -0.55% │ -3.05%  │ 0.11       │ rsiDivergency5m │
// │  573 │ UMAUSDT      │ 2024 02 02 19:10:00 │ 2024 02 03 00:00:00 │ LONG         │ -0.55% │ -3.60%  │ 4.40       │ rsiDivergency5m │
// │  574 │ NMRUSDT      │ 2024 02 03 05:55:00 │ 2024 02 03 14:15:00 │ SHORT        │ 0.13%  │ -3.47%  │ 24.61      │ rsiDivergency5m │
// │  575 │ USTCUSDT     │ 2024 02 03 17:25:00 │ 2024 02 04 01:45:00 │ SHORT        │ 1.32%  │ -2.15%  │ 0.03       │ rsiDivergency5m │
// │  576 │ ROSEUSDT     │ 2024 02 04 17:55:00 │ 2024 02 05 02:15:00 │ LONG         │ -0.03% │ -2.18%  │ 0.11       │ rsiDivergency5m │
// │  577 │ ROSEUSDT     │ 2024 02 05 04:40:00 │ 2024 02 05 13:00:00 │ LONG         │ -0.22% │ -2.40%  │ 0.11       │ rsiDivergency5m │
// │  578 │ ENSUSDT      │ 2024 02 05 13:20:00 │ 2024 02 05 21:40:00 │ SHORT        │ -0.16% │ -2.56%  │ 20.28      │ rsiDivergency5m │
// │  579 │ NMRUSDT      │ 2024 02 06 01:05:00 │ 2024 02 06 01:50:00 │ LONG         │ -0.55% │ -3.11%  │ 26.97      │ rsiDivergency5m │
// │  580 │ NMRUSDT      │ 2024 02 06 02:50:00 │ 2024 02 06 10:45:00 │ LONG         │ -0.55% │ -3.66%  │ 25.79      │ rsiDivergency5m │
// │  581 │ OXTUSDT      │ 2024 02 06 12:40:00 │ 2024 02 06 21:00:00 │ LONG         │ 0.87%  │ -2.80%  │ 0.10       │ rsiDivergency5m │
// │  582 │ ZETAUSDT     │ 2024 02 07 02:45:00 │ 2024 02 07 10:45:00 │ LONG         │ 2.45%  │ -0.35%  │ 1.15       │ rsiDivergency5m │
// │  583 │ STGUSDT      │ 2024 02 07 13:30:00 │ 2024 02 07 21:35:00 │ SHORT        │ -0.55% │ -0.90%  │ 0.55       │ rsiDivergency5m │
// │  584 │ XMRUSDT      │ 2024 02 08 02:55:00 │ 2024 02 08 11:15:00 │ LONG         │ 0.94%  │ 0.05%   │ 119.16     │ rsiDivergency5m │
// │  585 │ ONDOUSDT     │ 2024 02 08 12:10:00 │ 2024 02 08 20:30:00 │ LONG         │ -0.20% │ -0.16%  │ 0.23       │ rsiDivergency5m │
// │  586 │ COTIUSDT     │ 2024 02 08 20:45:00 │ 2024 02 08 21:00:00 │ SHORT        │ -0.55% │ -0.71%  │ 0.08       │ rsiDivergency5m │
// │  587 │ IDUSDT       │ 2024 02 08 21:45:00 │ 2024 02 09 06:05:00 │ SHORT        │ 0.70%  │ -0.01%  │ 0.62       │ rsiDivergency5m │
// │  588 │ SUIUSDT      │ 2024 02 09 11:20:00 │ 2024 02 09 13:25:00 │ SHORT        │ -0.55% │ -0.56%  │ 1.70       │ rsiDivergency5m │
// │  589 │ SUIUSDT      │ 2024 02 09 13:45:00 │ 2024 02 09 15:00:00 │ SHORT        │ -0.55% │ -1.11%  │ 1.76       │ rsiDivergency5m │
// │  590 │ PENDLEUSDT   │ 2024 02 09 19:25:00 │ 2024 02 09 20:40:00 │ SHORT        │ -0.55% │ -1.66%  │ 3.22       │ rsiDivergency5m │
// │  591 │ PENDLEUSDT   │ 2024 02 09 20:55:00 │ 2024 02 09 23:05:00 │ SHORT        │ -0.55% │ -2.21%  │ 3.29       │ rsiDivergency5m │
// │  592 │ PENDLEUSDT   │ 2024 02 10 05:25:00 │ 2024 02 10 13:45:00 │ LONG         │ -0.39% │ -2.60%  │ 3.21       │ rsiDivergency5m │
// │  593 │ ZETAUSDT     │ 2024 02 10 15:25:00 │ 2024 02 10 23:45:00 │ SHORT        │ -0.14% │ -2.74%  │ 1.54       │ rsiDivergency5m │
// │  594 │ ZETAUSDT     │ 2024 02 10 23:50:00 │ 2024 02 11 01:00:00 │ SHORT        │ -0.55% │ -3.29%  │ 1.54       │ rsiDivergency5m │
// │  595 │ AIUSDT       │ 2024 02 11 02:55:00 │ 2024 02 11 03:20:00 │ SHORT        │ -0.55% │ -3.84%  │ 1.35       │ rsiDivergency5m │
// │  596 │ AIUSDT       │ 2024 02 11 03:25:00 │ 2024 02 11 07:30:00 │ SHORT        │ -0.55% │ -4.39%  │ 1.38       │ rsiDivergency5m │
// │  597 │ HIFIUSDT     │ 2024 02 11 08:40:00 │ 2024 02 11 09:00:00 │ SHORT        │ -0.55% │ -4.94%  │ 0.64       │ rsiDivergency5m │
// │  598 │ BEAMXUSDT    │ 2024 02 11 09:05:00 │ 2024 02 11 17:25:00 │ LONG         │ 0.26%  │ -4.68%  │ 0.02       │ rsiDivergency5m │
// │  599 │ COTIUSDT     │ 2024 02 11 21:40:00 │ 2024 02 12 01:00:00 │ LONG         │ -0.55% │ -5.23%  │ 0.08       │ rsiDivergency5m │
// │  600 │ UMAUSDT      │ 2024 02 12 06:30:00 │ 2024 02 12 07:30:00 │ SHORT        │ -0.55% │ -5.78%  │ 4.69       │ rsiDivergency5m │
// │  601 │ COTIUSDT     │ 2024 02 12 07:50:00 │ 2024 02 12 09:20:00 │ SHORT        │ -0.55% │ -6.33%  │ 0.09       │ rsiDivergency5m │
// │  602 │ IMXUSDT      │ 2024 02 12 11:30:00 │ 2024 02 12 13:05:00 │ SHORT        │ -0.55% │ -6.88%  │ 3.05       │ rsiDivergency5m │
// │  603 │ AIUSDT       │ 2024 02 12 13:50:00 │ 2024 02 12 22:10:00 │ SHORT        │ 1.70%  │ -5.19%  │ 1.53       │ rsiDivergency5m │
// │  604 │ NTRNUSDT     │ 2024 02 12 22:25:00 │ 2024 02 13 06:45:00 │ SHORT        │ 0.35%  │ -4.84%  │ 1.34       │ rsiDivergency5m │
// │  605 │ AIUSDT       │ 2024 02 13 06:50:00 │ 2024 02 13 15:10:00 │ SHORT        │ 0.29%  │ -4.55%  │ 1.63       │ rsiDivergency5m │
// │  606 │ VETUSDT      │ 2024 02 14 00:45:00 │ 2024 02 14 01:25:00 │ SHORT        │ -0.55% │ -5.10%  │ 0.03       │ rsiDivergency5m │
// │  607 │ ALTUSDT      │ 2024 02 14 01:30:00 │ 2024 02 14 03:45:00 │ SHORT        │ -0.55% │ -5.65%  │ 0.38       │ rsiDivergency5m │
// │  608 │ TRUUSDT      │ 2024 02 14 06:40:00 │ 2024 02 14 15:00:00 │ SHORT        │ 0.69%  │ -4.96%  │ 0.06       │ rsiDivergency5m │
// │  609 │ MANTAUSDT    │ 2024 02 14 15:10:00 │ 2024 02 14 17:40:00 │ SHORT        │ -0.55% │ -5.51%  │ 3.07       │ rsiDivergency5m │
// │  610 │ NTRNUSDT     │ 2024 02 14 19:50:00 │ 2024 02 15 04:00:00 │ SHORT        │ -0.55% │ -6.06%  │ 1.62       │ rsiDivergency5m │
// │  611 │ NTRNUSDT     │ 2024 02 15 04:50:00 │ 2024 02 15 05:10:00 │ SHORT        │ -0.55% │ -6.61%  │ 1.69       │ rsiDivergency5m │
// │  612 │ NTRNUSDT     │ 2024 02 15 05:15:00 │ 2024 02 15 05:35:00 │ SHORT        │ -0.55% │ -7.16%  │ 1.72       │ rsiDivergency5m │
// │  613 │ VETUSDT      │ 2024 02 15 06:25:00 │ 2024 02 15 06:30:00 │ SHORT        │ -0.55% │ -7.71%  │ 0.04       │ rsiDivergency5m │
// │  614 │ VETUSDT      │ 2024 02 15 06:45:00 │ 2024 02 15 06:55:00 │ SHORT        │ -0.55% │ -8.26%  │ 0.04       │ rsiDivergency5m │
// │  615 │ NEOUSDT      │ 2024 02 15 07:05:00 │ 2024 02 15 15:25:00 │ SHORT        │ 0.86%  │ -7.40%  │ 13.46      │ rsiDivergency5m │
// │  616 │ ARUSDT       │ 2024 02 15 16:05:00 │ 2024 02 15 18:35:00 │ SHORT        │ -0.55% │ -7.95%  │ 11.53      │ rsiDivergency5m │
// │  617 │ ARUSDT       │ 2024 02 15 18:45:00 │ 2024 02 15 18:50:00 │ SHORT        │ -0.55% │ -8.50%  │ 11.83      │ rsiDivergency5m │
// │  618 │ ARUSDT       │ 2024 02 15 19:05:00 │ 2024 02 15 19:10:00 │ SHORT        │ -0.55% │ -9.05%  │ 12.42      │ rsiDivergency5m │
// │  619 │ WLDUSDT      │ 2024 02 15 20:10:00 │ 2024 02 15 20:25:00 │ SHORT        │ -0.55% │ -9.60%  │ 3.49       │ rsiDivergency5m │
// │  620 │ WLDUSDT      │ 2024 02 15 20:30:00 │ 2024 02 15 21:20:00 │ SHORT        │ -0.55% │ -10.15% │ 3.54       │ rsiDivergency5m │
// │  621 │ NFPUSDT      │ 2024 02 16 01:20:00 │ 2024 02 16 05:25:00 │ SHORT        │ -0.55% │ -10.70% │ 0.67       │ rsiDivergency5m │
// │  622 │ TOKENUSDT    │ 2024 02 16 06:00:00 │ 2024 02 16 06:05:00 │ SHORT        │ -0.55% │ -11.25% │ 0.03       │ rsiDivergency5m │
// │  623 │ NFPUSDT      │ 2024 02 16 08:30:00 │ 2024 02 16 16:50:00 │ SHORT        │ 1.41%  │ -9.84%  │ 0.75       │ rsiDivergency5m │
// │  624 │ ONDOUSDT     │ 2024 02 17 09:35:00 │ 2024 02 17 17:55:00 │ LONG         │ 0.97%  │ -8.87%  │ 0.24       │ rsiDivergency5m │
// │  625 │ AIUSDT       │ 2024 02 17 20:40:00 │ 2024 02 17 21:35:00 │ SHORT        │ -0.55% │ -9.42%  │ 1.70       │ rsiDivergency5m │
// │  626 │ STGUSDT      │ 2024 02 17 23:30:00 │ 2024 02 18 00:30:00 │ SHORT        │ -0.55% │ -9.97%  │ 0.67       │ rsiDivergency5m │
// │  627 │ HOOKUSDT     │ 2024 02 18 00:45:00 │ 2024 02 18 09:05:00 │ SHORT        │ -0.20% │ -10.17% │ 1.07       │ rsiDivergency5m │
// │  628 │ CKBUSDT      │ 2024 02 18 09:50:00 │ 2024 02 18 10:00:00 │ SHORT        │ -0.55% │ -10.72% │ 0.01       │ rsiDivergency5m │
// │  629 │ LPTUSDT      │ 2024 02 18 11:30:00 │ 2024 02 18 12:40:00 │ SHORT        │ -0.55% │ -11.27% │ 19.14      │ rsiDivergency5m │
// │  630 │ ZETAUSDT     │ 2024 02 18 13:50:00 │ 2024 02 18 22:10:00 │ SHORT        │ 1.12%  │ -10.15% │ 2.75       │ rsiDivergency5m │
// │  631 │ NMRUSDT      │ 2024 02 18 23:30:00 │ 2024 02 19 04:15:00 │ SHORT        │ -0.55% │ -10.70% │ 34.97      │ rsiDivergency5m │
// │  632 │ ONDOUSDT     │ 2024 02 19 06:55:00 │ 2024 02 19 07:10:00 │ SHORT        │ -0.55% │ -11.25% │ 0.30       │ rsiDivergency5m │
// │  633 │ ARUSDT       │ 2024 02 19 07:40:00 │ 2024 02 19 07:50:00 │ SHORT        │ -0.55% │ -11.80% │ 13.64      │ rsiDivergency5m │
// │  634 │ ONDOUSDT     │ 2024 02 19 08:20:00 │ 2024 02 19 09:10:00 │ SHORT        │ -0.55% │ -12.35% │ 0.32       │ rsiDivergency5m │
// │  635 │ XMRUSDT      │ 2024 02 19 12:55:00 │ 2024 02 19 21:15:00 │ LONG         │ 1.14%  │ -11.21% │ 110.38     │ rsiDivergency5m │
// │  636 │ LPTUSDT      │ 2024 02 19 22:05:00 │ 2024 02 19 22:40:00 │ LONG         │ -0.55% │ -11.76% │ 15.96      │ rsiDivergency5m │
// │  637 │ WLDUSDT      │ 2024 02 19 23:20:00 │ 2024 02 20 07:40:00 │ LONG         │ 0.75%  │ -11.01% │ 6.68       │ rsiDivergency5m │
// │  638 │ NFPUSDT      │ 2024 02 20 09:40:00 │ 2024 02 20 10:15:00 │ LONG         │ -0.55% │ -11.56% │ 0.71       │ rsiDivergency5m │
// │  639 │ NFPUSDT      │ 2024 02 20 10:20:00 │ 2024 02 20 10:25:00 │ LONG         │ -0.55% │ -12.11% │ 0.70       │ rsiDivergency5m │
// │  640 │ ALICEUSDT    │ 2024 02 20 10:50:00 │ 2024 02 20 12:20:00 │ LONG         │ -0.55% │ -12.66% │ 1.29       │ rsiDivergency5m │
// │  641 │ C98USDT      │ 2024 02 20 12:40:00 │ 2024 02 20 21:00:00 │ LONG         │ 0.72%  │ -11.94% │ 0.33       │ rsiDivergency5m │
// │  642 │ HIGHUSDT     │ 2024 02 20 21:25:00 │ 2024 02 21 02:00:00 │ LONG         │ -0.55% │ -12.49% │ 1.61       │ rsiDivergency5m │
// │  643 │ IOTAUSDT     │ 2024 02 21 02:05:00 │ 2024 02 21 04:55:00 │ LONG         │ -0.55% │ -13.04% │ 0.28       │ rsiDivergency5m │
// │  644 │ DARUSDT      │ 2024 02 21 05:15:00 │ 2024 02 21 09:35:00 │ LONG         │ -0.55% │ -13.59% │ 0.14       │ rsiDivergency5m │
// │  645 │ STXUSDT      │ 2024 02 21 10:00:00 │ 2024 02 21 14:00:00 │ LONG         │ -0.55% │ -14.14% │ 2.61       │ rsiDivergency5m │
// │  646 │ WLDUSDT      │ 2024 02 21 17:50:00 │ 2024 02 21 18:20:00 │ SHORT        │ -0.55% │ -14.69% │ 6.90       │ rsiDivergency5m │
// │  647 │ BEAMXUSDT    │ 2024 02 21 18:50:00 │ 2024 02 22 03:10:00 │ SHORT        │ -0.33% │ -15.03% │ 0.03       │ rsiDivergency5m │
// │  648 │ DENTUSDT     │ 2024 02 22 03:20:00 │ 2024 02 22 04:00:00 │ SHORT        │ -0.55% │ -15.58% │ 0.00       │ rsiDivergency5m │
// │  649 │ RDNTUSDT     │ 2024 02 22 04:10:00 │ 2024 02 22 04:50:00 │ SHORT        │ -0.55% │ -16.13% │ 0.34       │ rsiDivergency5m │
// │  650 │ PENDLEUSDT   │ 2024 02 22 04:55:00 │ 2024 02 22 05:20:00 │ SHORT        │ -0.55% │ -16.68% │ 2.85       │ rsiDivergency5m │
// │  651 │ PENDLEUSDT   │ 2024 02 22 05:25:00 │ 2024 02 22 13:45:00 │ SHORT        │ 1.39%  │ -15.29% │ 2.90       │ rsiDivergency5m │
// │  652 │ ZETAUSDT     │ 2024 02 22 15:10:00 │ 2024 02 22 20:25:00 │ SHORT        │ -0.55% │ -15.84% │ 2.52       │ rsiDivergency5m │
// │  653 │ CKBUSDT      │ 2024 02 22 22:25:00 │ 2024 02 23 06:45:00 │ LONG         │ 0.14%  │ -15.70% │ 0.01       │ rsiDivergency5m │
// │  654 │ STRKUSDT     │ 2024 02 23 07:40:00 │ 2024 02 23 09:40:00 │ LONG         │ -0.55% │ -16.25% │ 1.98       │ rsiDivergency5m │
// │  655 │ ZETAUSDT     │ 2024 02 23 09:50:00 │ 2024 02 23 10:15:00 │ LONG         │ -0.55% │ -16.80% │ 2.27       │ rsiDivergency5m │
// │  656 │ ZETAUSDT     │ 2024 02 23 10:30:00 │ 2024 02 23 11:00:00 │ LONG         │ -0.55% │ -17.35% │ 2.22       │ rsiDivergency5m │
// │  657 │ ALTUSDT      │ 2024 02 23 11:05:00 │ 2024 02 23 18:00:00 │ LONG         │ -0.55% │ -17.90% │ 0.50       │ rsiDivergency5m │
// │  658 │ ZETAUSDT     │ 2024 02 23 20:15:00 │ 2024 02 24 04:35:00 │ LONG         │ 0.83%  │ -17.06% │ 2.14       │ rsiDivergency5m │
// │  659 │ TLMUSDT      │ 2024 02 24 05:55:00 │ 2024 02 24 06:00:00 │ SHORT        │ -0.55% │ -17.61% │ 0.02       │ rsiDivergency5m │
// │  660 │ TLMUSDT      │ 2024 02 24 06:10:00 │ 2024 02 24 07:20:00 │ SHORT        │ -0.55% │ -18.16% │ 0.02       │ rsiDivergency5m │
// │  661 │ TLMUSDT      │ 2024 02 24 07:40:00 │ 2024 02 24 07:45:00 │ SHORT        │ -0.55% │ -18.71% │ 0.02       │ rsiDivergency5m │
// │  662 │ TLMUSDT      │ 2024 02 24 07:50:00 │ 2024 02 24 16:10:00 │ SHORT        │ 1.54%  │ -17.17% │ 0.02       │ rsiDivergency5m │
// │  663 │ NTRNUSDT     │ 2024 02 24 18:50:00 │ 2024 02 25 03:10:00 │ SHORT        │ 0.69%  │ -16.48% │ 1.72       │ rsiDivergency5m │
// │  664 │ CKBUSDT      │ 2024 02 25 04:20:00 │ 2024 02 25 04:30:00 │ SHORT        │ -0.55% │ -17.03% │ 0.01       │ rsiDivergency5m │
// │  665 │ CKBUSDT      │ 2024 02 25 06:50:00 │ 2024 02 25 11:00:00 │ SHORT        │ -0.55% │ -17.58% │ 0.01       │ rsiDivergency5m │
// │  666 │ ZETAUSDT     │ 2024 02 25 12:05:00 │ 2024 02 25 13:20:00 │ SHORT        │ -0.55% │ -18.13% │ 2.48       │ rsiDivergency5m │
// │  667 │ C98USDT      │ 2024 02 25 14:40:00 │ 2024 02 25 23:00:00 │ SHORT        │ 1.42%  │ -16.71% │ 0.41       │ rsiDivergency5m │
// │  668 │ BIGTIMEUSDT  │ 2024 02 26 00:30:00 │ 2024 02 26 01:20:00 │ SHORT        │ -0.55% │ -17.26% │ 0.42       │ rsiDivergency5m │
// │  669 │ YGGUSDT      │ 2024 02 26 01:45:00 │ 2024 02 26 02:15:00 │ SHORT        │ -0.55% │ -17.81% │ 0.59       │ rsiDivergency5m │
// │  670 │ DODOXUSDT    │ 2024 02 26 04:10:00 │ 2024 02 26 12:30:00 │ SHORT        │ 0.31%  │ -17.50% │ 0.22       │ rsiDivergency5m │
// │  671 │ DENTUSDT     │ 2024 02 26 13:05:00 │ 2024 02 26 21:25:00 │ SHORT        │ 0.37%  │ -17.13% │ 0.00       │ rsiDivergency5m │
// │  672 │ NTRNUSDT     │ 2024 02 26 22:20:00 │ 2024 02 27 06:40:00 │ SHORT        │ 1.67%  │ -15.45% │ 1.92       │ rsiDivergency5m │
// │  673 │ ENJUSDT      │ 2024 02 27 06:50:00 │ 2024 02 27 12:10:00 │ SHORT        │ -0.55% │ -16.00% │ 0.40       │ rsiDivergency5m │
// │  674 │ ENJUSDT      │ 2024 02 27 12:35:00 │ 2024 02 27 13:05:00 │ SHORT        │ -0.55% │ -16.55% │ 0.41       │ rsiDivergency5m │
// │  675 │ GALAUSDT     │ 2024 02 27 13:40:00 │ 2024 02 27 14:40:00 │ SHORT        │ -0.55% │ -17.10% │ 0.04       │ rsiDivergency5m │
// │  676 │ GALAUSDT     │ 2024 02 27 14:55:00 │ 2024 02 27 17:50:00 │ SHORT        │ -0.55% │ -17.65% │ 0.04       │ rsiDivergency5m │
// │  677 │ GALAUSDT     │ 2024 02 27 17:55:00 │ 2024 02 28 01:10:00 │ SHORT        │ 2.45%  │ -15.20% │ 0.04       │ rsiDivergency5m │
// │  678 │ 1000BONKUSDT │ 2024 02 28 04:50:00 │ 2024 02 28 05:05:00 │ SHORT        │ -0.55% │ -15.75% │ 0.02       │ rsiDivergency5m │
// │  679 │ FETUSDT      │ 2024 02 28 08:05:00 │ 2024 02 28 08:15:00 │ SHORT        │ -0.55% │ -16.30% │ 1.19       │ rsiDivergency5m │
// │  680 │ WLDUSDT      │ 2024 02 28 09:55:00 │ 2024 02 28 10:10:00 │ SHORT        │ -0.55% │ -16.85% │ 8.21       │ rsiDivergency5m │
// │  681 │ C98USDT      │ 2024 02 28 13:10:00 │ 2024 02 28 13:20:00 │ LONG         │ -0.55% │ -17.40% │ 0.36       │ rsiDivergency5m │
// │  682 │ PIXELUSDT    │ 2024 02 28 13:25:00 │ 2024 02 28 20:30:00 │ LONG         │ 2.45%  │ -14.95% │ 0.48       │ rsiDivergency5m │
// │  683 │ CRVUSDT      │ 2024 02 28 20:40:00 │ 2024 02 28 23:05:00 │ SHORT        │ -0.55% │ -15.50% │ 0.62       │ rsiDivergency5m │
// │  684 │ GMTUSDT      │ 2024 02 28 23:15:00 │ 2024 02 29 03:20:00 │ SHORT        │ -0.55% │ -16.05% │ 0.30       │ rsiDivergency5m │
// │  685 │ EGLDUSDT     │ 2024 02 29 03:25:00 │ 2024 02 29 11:45:00 │ SHORT        │ 0.26%  │ -15.80% │ 62.66      │ rsiDivergency5m │
// │  686 │ HOTUSDT      │ 2024 02 29 16:25:00 │ 2024 02 29 17:35:00 │ LONG         │ -0.55% │ -16.35% │ 0.00       │ rsiDivergency5m │
// │  687 │ ZETAUSDT     │ 2024 02 29 17:40:00 │ 2024 03 01 02:00:00 │ LONG         │ 0.97%  │ -15.38% │ 2.18       │ rsiDivergency5m │
// │  688 │ FLMUSDT      │ 2024 03 01 03:35:00 │ 2024 03 01 04:10:00 │ SHORT        │ -0.55% │ -15.93% │ 0.11       │ rsiDivergency5m │
// │  689 │ NEOUSDT      │ 2024 03 01 04:15:00 │ 2024 03 01 04:20:00 │ SHORT        │ -0.55% │ -16.48% │ 15.18      │ rsiDivergency5m │
// │  690 │ NEOUSDT      │ 2024 03 01 04:55:00 │ 2024 03 01 05:05:00 │ SHORT        │ -0.55% │ -17.03% │ 15.68      │ rsiDivergency5m │
// │  691 │ FRONTUSDT    │ 2024 03 01 05:15:00 │ 2024 03 01 13:35:00 │ SHORT        │ 0.08%  │ -16.95% │ 0.63       │ rsiDivergency5m │
// │  692 │ PENDLEUSDT   │ 2024 03 01 14:20:00 │ 2024 03 01 22:40:00 │ SHORT        │ 1.57%  │ -15.38% │ 3.65       │ rsiDivergency5m │
// │  693 │ MAVUSDT      │ 2024 03 02 02:15:00 │ 2024 03 02 03:10:00 │ SHORT        │ -0.55% │ -15.93% │ 0.74       │ rsiDivergency5m │
// │  694 │ MAVUSDT      │ 2024 03 02 03:15:00 │ 2024 03 02 11:35:00 │ SHORT        │ 0.79%  │ -15.14% │ 0.76       │ rsiDivergency5m │
// │  695 │ ENJUSDT      │ 2024 03 02 16:35:00 │ 2024 03 02 20:50:00 │ SHORT        │ -0.55% │ -15.69% │ 0.52       │ rsiDivergency5m │
// │  696 │ ARBUSDT      │ 2024 03 03 00:25:00 │ 2024 03 03 02:25:00 │ SHORT        │ 2.45%  │ -13.24% │ 2.18       │ rsiDivergency5m │
// │  697 │ NTRNUSDT     │ 2024 03 03 02:30:00 │ 2024 03 03 04:50:00 │ LONG         │ 2.45%  │ -10.79% │ 1.40       │ rsiDivergency5m │
// │  698 │ NTRNUSDT     │ 2024 03 03 05:20:00 │ 2024 03 03 05:35:00 │ SHORT        │ -0.55% │ -11.34% │ 1.54       │ rsiDivergency5m │
// │  699 │ ENJUSDT      │ 2024 03 03 06:10:00 │ 2024 03 03 08:25:00 │ SHORT        │ -0.55% │ -11.89% │ 0.52       │ rsiDivergency5m │
// │  700 │ HFTUSDT      │ 2024 03 03 09:05:00 │ 2024 03 03 17:25:00 │ SHORT        │ 1.51%  │ -10.38% │ 0.53       │ rsiDivergency5m │
// │  701 │ ENJUSDT      │ 2024 03 03 18:10:00 │ 2024 03 03 19:45:00 │ LONG         │ -0.55% │ -10.93% │ 0.52       │ rsiDivergency5m │
// │  702 │ SXPUSDT      │ 2024 03 03 20:35:00 │ 2024 03 03 20:50:00 │ SHORT        │ -0.55% │ -11.48% │ 0.52       │ rsiDivergency5m │
// │  703 │ SXPUSDT      │ 2024 03 03 21:10:00 │ 2024 03 04 05:10:00 │ SHORT        │ 2.45%  │ -9.03%  │ 0.54       │ rsiDivergency5m │
// │  704 │ CRVUSDT      │ 2024 03 04 06:15:00 │ 2024 03 04 08:35:00 │ SHORT        │ -0.55% │ -9.58%  │ 0.74       │ rsiDivergency5m │
// │  705 │ ALTUSDT      │ 2024 03 04 11:20:00 │ 2024 03 04 11:55:00 │ LONG         │ -0.55% │ -10.13% │ 0.49       │ rsiDivergency5m │
// │  706 │ COTIUSDT     │ 2024 03 04 12:25:00 │ 2024 03 04 12:40:00 │ LONG         │ -0.55% │ -10.68% │ 0.20       │ rsiDivergency5m │
// │  707 │ SXPUSDT      │ 2024 03 04 12:50:00 │ 2024 03 04 21:10:00 │ LONG         │ 0.50%  │ -10.18% │ 0.46       │ rsiDivergency5m │
// │  708 │ SKLUSDT      │ 2024 03 04 21:20:00 │ 2024 03 05 05:40:00 │ LONG         │ 0.77%  │ -9.41%  │ 0.11       │ rsiDivergency5m │
// │  709 │ USTCUSDT     │ 2024 03 05 09:00:00 │ 2024 03 05 09:05:00 │ SHORT        │ -0.55% │ -9.96%  │ 0.04       │ rsiDivergency5m │
// │  710 │ USTCUSDT     │ 2024 03 05 09:15:00 │ 2024 03 05 09:20:00 │ SHORT        │ -0.55% │ -10.51% │ 0.04       │ rsiDivergency5m │
// │  711 │ USTCUSDT     │ 2024 03 05 09:25:00 │ 2024 03 05 09:30:00 │ SHORT        │ -0.55% │ -11.06% │ 0.04       │ rsiDivergency5m │
// │  712 │ MANTAUSDT    │ 2024 03 05 09:35:00 │ 2024 03 05 10:25:00 │ LONG         │ -0.55% │ -11.61% │ 2.94       │ rsiDivergency5m │
// │  713 │ DARUSDT      │ 2024 03 05 11:15:00 │ 2024 03 05 12:05:00 │ LONG         │ -0.55% │ -12.16% │ 0.20       │ rsiDivergency5m │
// │  714 │ REEFUSDT     │ 2024 03 05 12:15:00 │ 2024 03 05 12:35:00 │ LONG         │ -0.55% │ -12.71% │ 0.00       │ rsiDivergency5m │
// │  715 │ XVGUSDT      │ 2024 03 05 14:10:00 │ 2024 03 05 14:35:00 │ LONG         │ -0.55% │ -13.26% │ 0.01       │ rsiDivergency5m │
// │  716 │ XVSUSDT      │ 2024 03 05 15:20:00 │ 2024 03 05 15:35:00 │ LONG         │ -0.55% │ -13.81% │ 11.34      │ rsiDivergency5m │
// │  717 │ MASKUSDT     │ 2024 03 05 15:40:00 │ 2024 03 06 00:00:00 │ LONG         │ 1.63%  │ -12.18% │ 4.21       │ rsiDivergency5m │
// │  718 │ XRPUSDT      │ 2024 03 06 00:40:00 │ 2024 03 06 02:50:00 │ SHORT        │ -0.55% │ -12.73% │ 0.60       │ rsiDivergency5m │
// │  719 │ ALTUSDT      │ 2024 03 06 02:55:00 │ 2024 03 06 11:15:00 │ SHORT        │ 0.92%  │ -11.80% │ 0.50       │ rsiDivergency5m │
// │  720 │ C98USDT      │ 2024 03 06 12:25:00 │ 2024 03 06 16:30:00 │ SHORT        │ -0.55% │ -12.35% │ 0.39       │ rsiDivergency5m │
// │  721 │ C98USDT      │ 2024 03 06 16:45:00 │ 2024 03 06 19:30:00 │ SHORT        │ -0.55% │ -12.90% │ 0.40       │ rsiDivergency5m │
// │  722 │ C98USDT      │ 2024 03 06 19:40:00 │ 2024 03 06 20:50:00 │ SHORT        │ -0.55% │ -13.45% │ 0.41       │ rsiDivergency5m │
// │  723 │ C98USDT      │ 2024 03 06 20:55:00 │ 2024 03 07 05:15:00 │ SHORT        │ 0.44%  │ -13.02% │ 0.41       │ rsiDivergency5m │
// │  724 │ ALTUSDT      │ 2024 03 07 05:25:00 │ 2024 03 07 08:35:00 │ SHORT        │ -0.55% │ -13.57% │ 0.55       │ rsiDivergency5m │
// │  725 │ ALTUSDT      │ 2024 03 07 08:55:00 │ 2024 03 07 17:15:00 │ SHORT        │ 0.95%  │ -12.62% │ 0.57       │ rsiDivergency5m │
// │  726 │ SUPERUSDT    │ 2024 03 07 20:15:00 │ 2024 03 08 04:35:00 │ SHORT        │ 0.07%  │ -12.55% │ 1.55       │ rsiDivergency5m │
// │  727 │ 1000BONKUSDT │ 2024 03 08 05:55:00 │ 2024 03 08 06:05:00 │ SHORT        │ -0.55% │ -13.10% │ 0.03       │ rsiDivergency5m │
// │  728 │ TOKENUSDT    │ 2024 03 08 08:35:00 │ 2024 03 08 08:45:00 │ SHORT        │ -0.55% │ -13.65% │ 0.09       │ rsiDivergency5m │
// │  729 │ 1000SHIBUSDT │ 2024 03 08 09:05:00 │ 2024 03 08 10:30:00 │ SHORT        │ 2.45%  │ -11.20% │ 0.04       │ rsiDivergency5m │
// │  730 │ ALTUSDT      │ 2024 03 08 10:35:00 │ 2024 03 08 18:55:00 │ LONG         │ 0.54%  │ -10.66% │ 0.51       │ rsiDivergency5m │
// │  731 │ AIUSDT       │ 2024 03 08 21:25:00 │ 2024 03 08 21:35:00 │ SHORT        │ -0.55% │ -11.21% │ 2.13       │ rsiDivergency5m │
// │  732 │ APEUSDT      │ 2024 03 08 22:35:00 │ 2024 03 09 02:20:00 │ SHORT        │ -0.55% │ -11.76% │ 2.25       │ rsiDivergency5m │
// │  733 │ HIGHUSDT     │ 2024 03 09 02:25:00 │ 2024 03 09 06:05:00 │ SHORT        │ -0.55% │ -12.31% │ 2.28       │ rsiDivergency5m │
// │  734 │ PIXELUSDT    │ 2024 03 09 06:30:00 │ 2024 03 09 07:00:00 │ SHORT        │ -0.55% │ -12.86% │ 0.74       │ rsiDivergency5m │
// │  735 │ GALAUSDT     │ 2024 03 09 07:05:00 │ 2024 03 09 07:25:00 │ SHORT        │ -0.55% │ -13.41% │ 0.05       │ rsiDivergency5m │
// │  736 │ TOKENUSDT    │ 2024 03 09 12:25:00 │ 2024 03 09 20:45:00 │ LONG         │ 0.06%  │ -13.35% │ 0.08       │ rsiDivergency5m │
// │  737 │ IDUSDT       │ 2024 03 10 00:05:00 │ 2024 03 10 00:45:00 │ SHORT        │ -0.55% │ -13.90% │ 0.90       │ rsiDivergency5m │
// │  738 │ IDUSDT       │ 2024 03 10 01:15:00 │ 2024 03 10 01:30:00 │ SHORT        │ -0.55% │ -14.45% │ 0.94       │ rsiDivergency5m │
// │  739 │ IDUSDT       │ 2024 03 10 01:35:00 │ 2024 03 10 01:55:00 │ SHORT        │ -0.55% │ -15.00% │ 0.94       │ rsiDivergency5m │
// │  740 │ HIGHUSDT     │ 2024 03 10 03:40:00 │ 2024 03 10 12:00:00 │ SHORT        │ 0.51%  │ -14.49% │ 2.55       │ rsiDivergency5m │
// │  741 │ ALICEUSDT    │ 2024 03 10 13:20:00 │ 2024 03 10 19:50:00 │ SHORT        │ 2.45%  │ -12.04% │ 2.34       │ rsiDivergency5m │
// │  742 │ REEFUSDT     │ 2024 03 10 20:40:00 │ 2024 03 11 04:00:00 │ LONG         │ 2.45%  │ -9.59%  │ 0.00       │ rsiDivergency5m │
// │  743 │ BEAMXUSDT    │ 2024 03 11 04:15:00 │ 2024 03 11 12:35:00 │ SHORT        │ 1.37%  │ -8.22%  │ 0.04       │ rsiDivergency5m │
// │  744 │ TUSDT        │ 2024 03 11 13:20:00 │ 2024 03 11 19:15:00 │ SHORT        │ -0.55% │ -8.77%  │ 0.04       │ rsiDivergency5m │
// │  745 │ REEFUSDT     │ 2024 03 11 20:35:00 │ 2024 03 11 21:10:00 │ SHORT        │ -0.55% │ -9.32%  │ 0.00       │ rsiDivergency5m │
// │  746 │ XRPUSDT      │ 2024 03 11 23:05:00 │ 2024 03 12 07:25:00 │ LONG         │ -0.01% │ -9.33%  │ 0.69       │ rsiDivergency5m │
// │  747 │ ACEUSDT      │ 2024 03 12 12:20:00 │ 2024 03 12 20:40:00 │ LONG         │ 1.67%  │ -7.66%  │ 11.87      │ rsiDivergency5m │
// │  748 │ ZILUSDT      │ 2024 03 12 21:15:00 │ 2024 03 12 22:55:00 │ SHORT        │ -0.55% │ -8.21%  │ 0.04       │ rsiDivergency5m │
// │  749 │ KAVAUSDT     │ 2024 03 12 23:00:00 │ 2024 03 13 01:55:00 │ SHORT        │ -0.55% │ -8.76%  │ 1.10       │ rsiDivergency5m │
// │  750 │ ARBUSDT      │ 2024 03 13 02:20:00 │ 2024 03 13 04:20:00 │ SHORT        │ -0.55% │ -9.31%  │ 2.19       │ rsiDivergency5m │
// │  751 │ FRONTUSDT    │ 2024 03 13 05:25:00 │ 2024 03 13 05:45:00 │ SHORT        │ -0.55% │ -9.86%  │ 0.97       │ rsiDivergency5m │
// │  752 │ CAKEUSDT     │ 2024 03 13 06:30:00 │ 2024 03 13 08:00:00 │ SHORT        │ -0.55% │ -10.41% │ 4.82       │ rsiDivergency5m │
// │  753 │ WLDUSDT      │ 2024 03 13 10:00:00 │ 2024 03 13 18:20:00 │ LONG         │ 0.37%  │ -10.04% │ 9.42       │ rsiDivergency5m │
// │  754 │ LRCUSDT      │ 2024 03 13 21:05:00 │ 2024 03 14 02:20:00 │ SHORT        │ -0.55% │ -10.59% │ 0.49       │ rsiDivergency5m │
// │  755 │ LRCUSDT      │ 2024 03 14 03:25:00 │ 2024 03 14 06:30:00 │ SHORT        │ -0.55% │ -11.14% │ 0.52       │ rsiDivergency5m │
// │  756 │ ZETAUSDT     │ 2024 03 14 08:25:00 │ 2024 03 14 08:50:00 │ LONG         │ -0.55% │ -11.69% │ 2.21       │ rsiDivergency5m │
// │  757 │ KAVAUSDT     │ 2024 03 14 08:55:00 │ 2024 03 14 11:30:00 │ LONG         │ -0.55% │ -12.24% │ 1.05       │ rsiDivergency5m │
// │  758 │ RENUSDT      │ 2024 03 14 17:10:00 │ 2024 03 14 22:25:00 │ SHORT        │ 2.45%  │ -9.79%  │ 0.12       │ rsiDivergency5m │
// │  759 │ BIGTIMEUSDT  │ 2024 03 14 22:30:00 │ 2024 03 14 23:40:00 │ LONG         │ -0.55% │ -10.34% │ 0.45       │ rsiDivergency5m │
// │  760 │ CFXUSDT      │ 2024 03 15 02:50:00 │ 2024 03 15 04:10:00 │ SHORT        │ 2.45%  │ -7.89%  │ 0.40       │ rsiDivergency5m │
// │  761 │ BIGTIMEUSDT  │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 1.02%  │ -6.86%  │ 0.41       │ rsiDivergency5m │
// │  762 │ SNXUSDT      │ 2024 03 15 15:50:00 │ 2024 03 16 00:10:00 │ LONG         │ 0.45%  │ -6.42%  │ 4.17       │ rsiDivergency5m │
// │  763 │ BONDUSDT     │ 2024 03 16 01:25:00 │ 2024 03 16 08:50:00 │ SHORT        │ 2.45%  │ -3.97%  │ 5.33       │ rsiDivergency5m │
// │  764 │ 1000SHIBUSDT │ 2024 03 16 08:55:00 │ 2024 03 16 12:25:00 │ LONG         │ -0.55% │ -4.52%  │ 0.03       │ rsiDivergency5m │
// │  765 │ HOOKUSDT     │ 2024 03 16 12:30:00 │ 2024 03 16 12:40:00 │ LONG         │ -0.55% │ -5.07%  │ 1.42       │ rsiDivergency5m │
// │  766 │ HOOKUSDT     │ 2024 03 16 12:45:00 │ 2024 03 16 13:05:00 │ LONG         │ -0.55% │ -5.62%  │ 1.40       │ rsiDivergency5m │
// │  767 │ LPTUSDT      │ 2024 03 16 13:10:00 │ 2024 03 16 13:40:00 │ LONG         │ -0.55% │ -6.17%  │ 20.47      │ rsiDivergency5m │
// │  768 │ APTUSDT      │ 2024 03 16 13:45:00 │ 2024 03 16 13:55:00 │ LONG         │ -0.55% │ -6.72%  │ 13.51      │ rsiDivergency5m │
// │  769 │ APTUSDT      │ 2024 03 16 15:20:00 │ 2024 03 16 23:40:00 │ LONG         │ 2.13%  │ -4.59%  │ 13.10      │ rsiDivergency5m │
// │  770 │ PIXELUSDT    │ 2024 03 17 01:20:00 │ 2024 03 17 01:50:00 │ LONG         │ -0.55% │ -5.14%  │ 0.70       │ rsiDivergency5m │
// │  771 │ PIXELUSDT    │ 2024 03 17 02:20:00 │ 2024 03 17 10:30:00 │ LONG         │ 2.45%  │ -2.69%  │ 0.68       │ rsiDivergency5m │
// │  772 │ NMRUSDT      │ 2024 03 17 10:35:00 │ 2024 03 17 18:55:00 │ SHORT        │ 0.45%  │ -2.24%  │ 38.68      │ rsiDivergency5m │
// │  773 │ TRUUSDT      │ 2024 03 17 20:05:00 │ 2024 03 18 04:25:00 │ LONG         │ 0.10%  │ -2.14%  │ 0.08       │ rsiDivergency5m │
// │  774 │ ORDIUSDT     │ 2024 03 18 08:25:00 │ 2024 03 18 09:40:00 │ LONG         │ -0.55% │ -2.69%  │ 65.79      │ rsiDivergency5m │
// │  775 │ TRUUSDT      │ 2024 03 18 09:45:00 │ 2024 03 18 12:05:00 │ LONG         │ -0.55% │ -3.24%  │ 0.08       │ rsiDivergency5m │
// │  776 │ TRUUSDT      │ 2024 03 18 14:05:00 │ 2024 03 18 19:50:00 │ LONG         │ -0.55% │ -3.79%  │ 0.07       │ rsiDivergency5m │
// │  777 │ MASKUSDT     │ 2024 03 18 20:10:00 │ 2024 03 18 20:25:00 │ LONG         │ -0.55% │ -4.34%  │ 4.63       │ rsiDivergency5m │
// │  778 │ IDUSDT       │ 2024 03 18 20:35:00 │ 2024 03 19 00:10:00 │ LONG         │ -0.55% │ -4.89%  │ 1.51       │ rsiDivergency5m │
// │  779 │ LEVERUSDT    │ 2024 03 19 02:15:00 │ 2024 03 19 04:10:00 │ LONG         │ -0.55% │ -5.44%  │ 0.00       │ rsiDivergency5m │
// │  780 │ COTIUSDT     │ 2024 03 19 07:50:00 │ 2024 03 19 10:45:00 │ SHORT        │ -0.55% │ -5.99%  │ 0.18       │ rsiDivergency5m │
// │  781 │ TOKENUSDT    │ 2024 03 19 10:50:00 │ 2024 03 19 11:05:00 │ SHORT        │ -0.55% │ -6.54%  │ 0.06       │ rsiDivergency5m │
// │  782 │ TOKENUSDT    │ 2024 03 19 11:15:00 │ 2024 03 19 13:30:00 │ SHORT        │ -0.55% │ -7.09%  │ 0.06       │ rsiDivergency5m │
// │  783 │ ARBUSDT      │ 2024 03 19 13:50:00 │ 2024 03 19 22:10:00 │ SHORT        │ 0.62%  │ -6.47%  │ 1.67       │ rsiDivergency5m │
// │  784 │ SKLUSDT      │ 2024 03 19 22:40:00 │ 2024 03 20 02:30:00 │ SHORT        │ -0.55% │ -7.02%  │ 0.09       │ rsiDivergency5m │
// │  785 │ MAVUSDT      │ 2024 03 20 02:55:00 │ 2024 03 20 07:05:00 │ SHORT        │ -0.55% │ -7.57%  │ 0.51       │ rsiDivergency5m │
// │  786 │ WAXPUSDT     │ 2024 03 20 07:10:00 │ 2024 03 20 13:50:00 │ SHORT        │ -0.55% │ -8.12%  │ 0.08       │ rsiDivergency5m │
// │  787 │ MYROUSDT     │ 2024 03 20 14:00:00 │ 2024 03 20 14:40:00 │ SHORT        │ -0.55% │ -8.67%  │ 0.24       │ rsiDivergency5m │
// │  788 │ 1000BONKUSDT │ 2024 03 20 14:50:00 │ 2024 03 20 15:20:00 │ SHORT        │ -0.55% │ -9.22%  │ 0.02       │ rsiDivergency5m │
// │  789 │ HFTUSDT      │ 2024 03 20 15:25:00 │ 2024 03 20 23:45:00 │ SHORT        │ 0.25%  │ -8.97%  │ 0.44       │ rsiDivergency5m │
// │  790 │ WAXPUSDT     │ 2024 03 21 04:05:00 │ 2024 03 21 12:25:00 │ SHORT        │ 0.15%  │ -8.82%  │ 0.09       │ rsiDivergency5m │
// │  791 │ STXUSDT      │ 2024 03 21 23:10:00 │ 2024 03 21 23:20:00 │ SHORT        │ -0.55% │ -9.37%  │ 3.47       │ rsiDivergency5m │
// │  792 │ STXUSDT      │ 2024 03 22 01:55:00 │ 2024 03 22 10:15:00 │ SHORT        │ 1.27%  │ -8.10%  │ 3.65       │ rsiDivergency5m │
// │  793 │ ONDOUSDT     │ 2024 03 22 12:45:00 │ 2024 03 22 17:35:00 │ SHORT        │ 2.45%  │ -5.65%  │ 0.79       │ rsiDivergency5m │
// │  794 │ STXUSDT      │ 2024 03 22 19:30:00 │ 2024 03 23 03:50:00 │ SHORT        │ 0.40%  │ -5.24%  │ 3.56       │ rsiDivergency5m │
// │  795 │ WLDUSDT      │ 2024 03 23 06:05:00 │ 2024 03 23 14:25:00 │ SHORT        │ 0.63%  │ -4.62%  │ 8.92       │ rsiDivergency5m │
// │  796 │ ONGUSDT      │ 2024 03 23 19:50:00 │ 2024 03 23 22:25:00 │ SHORT        │ 2.45%  │ -2.17%  │ 0.42       │ rsiDivergency5m │
// │  797 │ TUSDT        │ 2024 03 23 22:35:00 │ 2024 03 24 06:55:00 │ LONG         │ 0.58%  │ -1.59%  │ 0.04       │ rsiDivergency5m │
// │  798 │ SKLUSDT      │ 2024 03 24 08:30:00 │ 2024 03 24 08:40:00 │ SHORT        │ -0.55% │ -2.14%  │ 0.11       │ rsiDivergency5m │
// │  799 │ SKLUSDT      │ 2024 03 24 09:05:00 │ 2024 03 24 09:15:00 │ SHORT        │ -0.55% │ -2.69%  │ 0.11       │ rsiDivergency5m │
// │  800 │ SKLUSDT      │ 2024 03 24 09:25:00 │ 2024 03 24 09:30:00 │ SHORT        │ -0.55% │ -3.24%  │ 0.11       │ rsiDivergency5m │
// │  801 │ LSKUSDT      │ 2024 03 24 09:55:00 │ 2024 03 24 18:15:00 │ SHORT        │ 0.56%  │ -2.68%  │ 2.05       │ rsiDivergency5m │
// │  802 │ DENTUSDT     │ 2024 03 24 18:30:00 │ 2024 03 25 02:50:00 │ SHORT        │ 1.27%  │ -1.41%  │ 0.00       │ rsiDivergency5m │
// │  803 │ ALTUSDT      │ 2024 03 25 03:55:00 │ 2024 03 25 09:55:00 │ SHORT        │ -0.55% │ -1.96%  │ 0.56       │ rsiDivergency5m │
// │  804 │ SKLUSDT      │ 2024 03 25 15:15:00 │ 2024 03 25 20:00:00 │ SHORT        │ -0.55% │ -2.51%  │ 0.12       │ rsiDivergency5m │
// │  805 │ TUSDT        │ 2024 03 25 20:10:00 │ 2024 03 25 22:50:00 │ SHORT        │ -0.55% │ -3.06%  │ 0.04       │ rsiDivergency5m │
// │  806 │ DARUSDT      │ 2024 03 25 22:55:00 │ 2024 03 25 23:20:00 │ SHORT        │ -0.55% │ -3.61%  │ 0.26       │ rsiDivergency5m │
// │  807 │ DARUSDT      │ 2024 03 25 23:35:00 │ 2024 03 26 07:55:00 │ SHORT        │ 0.65%  │ -2.96%  │ 0.27       │ rsiDivergency5m │
// │  808 │ ETHFIUSDT    │ 2024 03 26 18:55:00 │ 2024 03 26 19:45:00 │ SHORT        │ -0.55% │ -3.51%  │ 5.48       │ rsiDivergency5m │
// │  809 │ ETHFIUSDT    │ 2024 03 26 20:40:00 │ 2024 03 26 21:45:00 │ SHORT        │ -0.55% │ -4.06%  │ 5.87       │ rsiDivergency5m │
// │  810 │ SUIUSDT      │ 2024 03 26 23:10:00 │ 2024 03 27 07:05:00 │ SHORT        │ -0.55% │ -4.61%  │ 2.06       │ rsiDivergency5m │
// │  811 │ PENDLEUSDT   │ 2024 03 27 09:40:00 │ 2024 03 27 18:00:00 │ SHORT        │ 0.51%  │ -4.11%  │ 4.30       │ rsiDivergency5m │
// │  812 │ ALTUSDT      │ 2024 03 27 18:30:00 │ 2024 03 28 02:50:00 │ SHORT        │ 0.58%  │ -3.52%  │ 0.62       │ rsiDivergency5m │
// │  813 │ ONDOUSDT     │ 2024 03 28 03:10:00 │ 2024 03 28 11:30:00 │ SHORT        │ 1.13%  │ -2.39%  │ 0.95       │ rsiDivergency5m │
// │  814 │ MYROUSDT     │ 2024 03 28 13:00:00 │ 2024 03 28 13:05:00 │ SHORT        │ -0.55% │ -2.94%  │ 0.28       │ rsiDivergency5m │
// │  815 │ SPELLUSDT    │ 2024 03 28 13:15:00 │ 2024 03 28 13:25:00 │ SHORT        │ -0.55% │ -3.49%  │ 0.00       │ rsiDivergency5m │
// │  816 │ SPELLUSDT    │ 2024 03 28 13:30:00 │ 2024 03 28 18:35:00 │ SHORT        │ -0.55% │ -4.04%  │ 0.00       │ rsiDivergency5m │
// │  817 │ ARPAUSDT     │ 2024 03 28 19:10:00 │ 2024 03 28 20:40:00 │ SHORT        │ -0.55% │ -4.59%  │ 0.10       │ rsiDivergency5m │
// │  818 │ POLYXUSDT    │ 2024 03 28 21:10:00 │ 2024 03 28 23:00:00 │ LONG         │ -0.55% │ -5.14%  │ 0.54       │ rsiDivergency5m │
// │  819 │ TOKENUSDT    │ 2024 03 29 05:20:00 │ 2024 03 29 08:25:00 │ SHORT        │ 2.45%  │ -2.69%  │ 0.21       │ rsiDivergency5m │
// │  820 │ SUIUSDT      │ 2024 03 29 10:00:00 │ 2024 03 29 16:05:00 │ LONG         │ -0.55% │ -3.24%  │ 1.96       │ rsiDivergency5m │
// │  821 │ MAVUSDT      │ 2024 03 29 19:35:00 │ 2024 03 30 03:55:00 │ LONG         │ -0.11% │ -3.36%  │ 0.66       │ rsiDivergency5m │
// │  822 │ YGGUSDT      │ 2024 03 30 07:05:00 │ 2024 03 30 07:35:00 │ SHORT        │ -0.55% │ -3.91%  │ 1.28       │ rsiDivergency5m │
// │  823 │ YGGUSDT      │ 2024 03 30 07:50:00 │ 2024 03 30 08:00:00 │ SHORT        │ -0.55% │ -4.46%  │ 1.31       │ rsiDivergency5m │
// │  824 │ YGGUSDT      │ 2024 03 30 08:10:00 │ 2024 03 30 08:25:00 │ SHORT        │ -0.55% │ -5.01%  │ 1.33       │ rsiDivergency5m │
// │  825 │ YGGUSDT      │ 2024 03 30 10:10:00 │ 2024 03 30 18:30:00 │ SHORT        │ 1.27%  │ -3.74%  │ 1.43       │ rsiDivergency5m │
// │  826 │ 1000SATSUSDT │ 2024 03 30 21:15:00 │ 2024 03 31 05:35:00 │ SHORT        │ 1.08%  │ -2.66%  │ 0.00       │ rsiDivergency5m │
// │  827 │ LQTYUSDT     │ 2024 03 31 08:15:00 │ 2024 03 31 08:45:00 │ SHORT        │ -0.55% │ -3.21%  │ 1.82       │ rsiDivergency5m │
// │  828 │ TUSDT        │ 2024 03 31 09:50:00 │ 2024 03 31 18:10:00 │ LONG         │ 0.15%  │ -3.07%  │ 0.05       │ rsiDivergency5m │
// │  829 │ ONDOUSDT     │ 2024 03 31 19:40:00 │ 2024 03 31 20:45:00 │ LONG         │ -0.55% │ -3.62%  │ 0.95       │ rsiDivergency5m │
// │  830 │ TOKENUSDT    │ 2024 03 31 20:50:00 │ 2024 04 01 00:40:00 │ LONG         │ -0.55% │ -4.17%  │ 0.17       │ rsiDivergency5m │
// │  831 │ PENDLEUSDT   │ 2024 04 01 01:45:00 │ 2024 04 01 10:05:00 │ SHORT        │ 2.45%  │ -1.72%  │ 5.77       │ rsiDivergency5m │
// │  832 │ FLMUSDT      │ 2024 04 01 10:35:00 │ 2024 04 01 12:35:00 │ LONG         │ -0.55% │ -2.27%  │ 0.12       │ rsiDivergency5m │
// │  833 │ STGUSDT      │ 2024 04 01 12:40:00 │ 2024 04 01 21:00:00 │ LONG         │ 0.35%  │ -1.92%  │ 0.73       │ rsiDivergency5m │
// │  834 │ KAVAUSDT     │ 2024 04 01 22:25:00 │ 2024 04 02 03:50:00 │ LONG         │ -0.55% │ -2.47%  │ 0.98       │ rsiDivergency5m │
// │  835 │ XVSUSDT      │ 2024 04 02 05:10:00 │ 2024 04 02 13:30:00 │ LONG         │ 1.06%  │ -1.40%  │ 14.91      │ rsiDivergency5m │
// │  836 │ PENDLEUSDT   │ 2024 04 02 14:55:00 │ 2024 04 02 23:15:00 │ SHORT        │ 1.78%  │ 0.37%   │ 5.47       │ rsiDivergency5m │
// │  837 │ MAVUSDT      │ 2024 04 02 23:30:00 │ 2024 04 03 07:50:00 │ LONG         │ 0.13%  │ 0.51%   │ 0.65       │ rsiDivergency5m │
// │  838 │ NKNUSDT      │ 2024 04 03 08:45:00 │ 2024 04 03 09:45:00 │ LONG         │ 2.45%  │ 2.96%   │ 0.17       │ rsiDivergency5m │
// │  839 │ XVGUSDT      │ 2024 04 03 10:20:00 │ 2024 04 03 11:15:00 │ LONG         │ -0.55% │ 2.41%   │ 0.01       │ rsiDivergency5m │
// │  840 │ FRONTUSDT    │ 2024 04 03 12:00:00 │ 2024 04 03 12:30:00 │ LONG         │ -0.55% │ 1.86%   │ 1.13       │ rsiDivergency5m │
// │  841 │ TRUUSDT      │ 2024 04 03 13:30:00 │ 2024 04 03 15:20:00 │ LONG         │ -0.55% │ 1.31%   │ 0.12       │ rsiDivergency5m │
// │  842 │ TOKENUSDT    │ 2024 04 03 15:25:00 │ 2024 04 03 22:20:00 │ LONG         │ -0.55% │ 0.76%   │ 0.14       │ rsiDivergency5m │
// │  843 │ POLYXUSDT    │ 2024 04 03 23:25:00 │ 2024 04 04 07:45:00 │ LONG         │ 0.98%  │ 1.74%   │ 0.53       │ rsiDivergency5m │
// │  844 │ NMRUSDT      │ 2024 04 04 07:50:00 │ 2024 04 04 11:00:00 │ SHORT        │ -0.55% │ 1.19%   │ 34.60      │ rsiDivergency5m │
// │  845 │ PENDLEUSDT   │ 2024 04 04 11:30:00 │ 2024 04 04 11:50:00 │ SHORT        │ -0.55% │ 0.64%   │ 5.58       │ rsiDivergency5m │
// │  846 │ ALPHAUSDT    │ 2024 04 04 12:25:00 │ 2024 04 04 12:50:00 │ SHORT        │ -0.55% │ 0.09%   │ 0.15       │ rsiDivergency5m │
// │  847 │ SSVUSDT      │ 2024 04 04 12:55:00 │ 2024 04 04 21:15:00 │ SHORT        │ 0.91%  │ 1.00%   │ 53.20      │ rsiDivergency5m │
// │  848 │ XVGUSDT      │ 2024 04 04 22:10:00 │ 2024 04 05 06:30:00 │ LONG         │ 0.59%  │ 1.59%   │ 0.01       │ rsiDivergency5m │
// │  849 │ XVGUSDT      │ 2024 04 05 08:20:00 │ 2024 04 05 16:40:00 │ SHORT        │ 1.53%  │ 3.12%   │ 0.01       │ rsiDivergency5m │
// │  850 │ SKLUSDT      │ 2024 04 05 17:30:00 │ 2024 04 05 21:05:00 │ LONG         │ -0.55% │ 2.57%   │ 0.12       │ rsiDivergency5m │
// │  851 │ SKLUSDT      │ 2024 04 05 22:10:00 │ 2024 04 06 06:30:00 │ LONG         │ 0.09%  │ 2.65%   │ 0.12       │ rsiDivergency5m │
// │  852 │ PENDLEUSDT   │ 2024 04 06 12:05:00 │ 2024 04 06 14:30:00 │ LONG         │ -0.55% │ 2.10%   │ 6.74       │ rsiDivergency5m │
// │  853 │ PENDLEUSDT   │ 2024 04 06 15:10:00 │ 2024 04 06 23:30:00 │ LONG         │ -0.07% │ 2.04%   │ 6.57       │ rsiDivergency5m │
// │  854 │ NKNUSDT      │ 2024 04 07 05:20:00 │ 2024 04 07 05:30:00 │ SHORT        │ -0.55% │ 1.49%   │ 0.20       │ rsiDivergency5m │
// │  855 │ NKNUSDT      │ 2024 04 07 05:35:00 │ 2024 04 07 06:10:00 │ SHORT        │ -0.55% │ 0.94%   │ 0.21       │ rsiDivergency5m │
// │  856 │ NKNUSDT      │ 2024 04 07 06:25:00 │ 2024 04 07 07:10:00 │ SHORT        │ -0.55% │ 0.39%   │ 0.21       │ rsiDivergency5m │
// │  857 │ YGGUSDT      │ 2024 04 07 08:10:00 │ 2024 04 07 16:30:00 │ SHORT        │ 2.27%  │ 2.66%   │ 1.45       │ rsiDivergency5m │
// │  858 │ NKNUSDT      │ 2024 04 07 20:10:00 │ 2024 04 07 21:15:00 │ LONG         │ -0.55% │ 2.11%   │ 0.20       │ rsiDivergency5m │
// │  859 │ SFPUSDT      │ 2024 04 07 21:25:00 │ 2024 04 07 22:15:00 │ SHORT        │ -0.55% │ 1.56%   │ 0.80       │ rsiDivergency5m │
// │  860 │ SFPUSDT      │ 2024 04 07 22:25:00 │ 2024 04 07 22:45:00 │ SHORT        │ -0.55% │ 1.01%   │ 0.82       │ rsiDivergency5m │
// │  861 │ PENDLEUSDT   │ 2024 04 08 00:45:00 │ 2024 04 08 01:25:00 │ LONG         │ -0.55% │ 0.46%   │ 6.60       │ rsiDivergency5m │
// │  862 │ POLYXUSDT    │ 2024 04 08 01:45:00 │ 2024 04 08 10:05:00 │ SHORT        │ 1.18%  │ 1.65%   │ 0.59       │ rsiDivergency5m │
// │  863 │ SSVUSDT      │ 2024 04 08 11:35:00 │ 2024 04 08 19:55:00 │ SHORT        │ 0.15%  │ 1.80%   │ 55.96      │ rsiDivergency5m │
// │  864 │ LEVERUSDT    │ 2024 04 08 21:35:00 │ 2024 04 08 21:55:00 │ SHORT        │ -0.55% │ 1.25%   │ 0.00       │ rsiDivergency5m │
// │  865 │ LEVERUSDT    │ 2024 04 09 01:30:00 │ 2024 04 09 07:00:00 │ LONG         │ 2.45%  │ 3.70%   │ 0.00       │ rsiDivergency5m │
// │  866 │ TOKENUSDT    │ 2024 04 09 09:10:00 │ 2024 04 09 09:40:00 │ LONG         │ -0.55% │ 3.15%   │ 0.15       │ rsiDivergency5m │
// │  867 │ ONDOUSDT     │ 2024 04 09 10:10:00 │ 2024 04 09 18:30:00 │ LONG         │ -0.36% │ 2.79%   │ 0.77       │ rsiDivergency5m │
// │  868 │ LDOUSDT      │ 2024 04 09 18:55:00 │ 2024 04 09 21:45:00 │ LONG         │ -0.55% │ 2.24%   │ 2.68       │ rsiDivergency5m │
// │  869 │ APTUSDT      │ 2024 04 09 21:55:00 │ 2024 04 10 06:15:00 │ LONG         │ -0.22% │ 2.02%   │ 12.29      │ rsiDivergency5m │
// │  870 │ ALPHAUSDT    │ 2024 04 10 16:10:00 │ 2024 04 10 19:40:00 │ SHORT        │ -0.55% │ 1.47%   │ 0.19       │ rsiDivergency5m │
// │  871 │ NEOUSDT      │ 2024 04 10 19:55:00 │ 2024 04 11 01:00:00 │ SHORT        │ -0.55% │ 0.92%   │ 22.56      │ rsiDivergency5m │
// │  872 │ TNSRUSDT     │ 2024 04 11 03:00:00 │ 2024 04 11 06:20:00 │ LONG         │ -0.55% │ 0.37%   │ 1.50       │ rsiDivergency5m │
// │  873 │ CELRUSDT     │ 2024 04 11 07:05:00 │ 2024 04 11 07:15:00 │ SHORT        │ -0.55% │ -0.18%  │ 0.04       │ rsiDivergency5m │
// │  874 │ CELRUSDT     │ 2024 04 11 07:40:00 │ 2024 04 11 08:05:00 │ SHORT        │ -0.55% │ -0.73%  │ 0.04       │ rsiDivergency5m │
// │  875 │ CELRUSDT     │ 2024 04 11 08:15:00 │ 2024 04 11 16:35:00 │ SHORT        │ 1.90%  │ 1.17%   │ 0.04       │ rsiDivergency5m │
// │  876 │ PIXELUSDT    │ 2024 04 11 17:05:00 │ 2024 04 11 18:20:00 │ LONG         │ -0.55% │ 0.62%   │ 0.65       │ rsiDivergency5m │
// │  877 │ PIXELUSDT    │ 2024 04 11 18:30:00 │ 2024 04 12 02:50:00 │ LONG         │ -0.25% │ 0.36%   │ 0.63       │ rsiDivergency5m │
// │  878 │ SAGAUSDT     │ 2024 04 12 04:50:00 │ 2024 04 12 07:15:00 │ LONG         │ -0.55% │ -0.19%  │ 4.81       │ rsiDivergency5m │
// │  879 │ SAGAUSDT     │ 2024 04 12 07:30:00 │ 2024 04 12 08:35:00 │ LONG         │ -0.55% │ -0.74%  │ 4.70       │ rsiDivergency5m │
// │  880 │ ETHFIUSDT    │ 2024 04 12 08:40:00 │ 2024 04 12 12:25:00 │ LONG         │ -0.55% │ -1.29%  │ 4.87       │ rsiDivergency5m │
// │  881 │ YGGUSDT      │ 2024 04 12 12:30:00 │ 2024 04 12 13:00:00 │ LONG         │ -0.55% │ -1.84%  │ 1.12       │ rsiDivergency5m │
// │  882 │ SKLUSDT      │ 2024 04 12 13:05:00 │ 2024 04 12 13:25:00 │ LONG         │ -0.55% │ -2.39%  │ 0.10       │ rsiDivergency5m │
// │  883 │ SFPUSDT      │ 2024 04 12 13:40:00 │ 2024 04 12 15:10:00 │ LONG         │ 2.45%  │ 0.06%   │ 0.79       │ rsiDivergency5m │
// │  884 │ XMRUSDT      │ 2024 04 12 15:25:00 │ 2024 04 12 23:45:00 │ LONG         │ 1.50%  │ 1.57%   │ 118.62     │ rsiDivergency5m │
// │  885 │ NEOUSDT      │ 2024 04 13 00:10:00 │ 2024 04 13 08:30:00 │ SHORT        │ 1.18%  │ 2.74%   │ 20.33      │ rsiDivergency5m │
// │  886 │ GMTUSDT      │ 2024 04 13 10:35:00 │ 2024 04 13 14:55:00 │ SHORT        │ 2.45%  │ 5.19%   │ 0.27       │ rsiDivergency5m │
// │  887 │ ADAUSDT      │ 2024 04 13 15:00:00 │ 2024 04 13 15:05:00 │ LONG         │ -0.55% │ 4.64%   │ 0.45       │ rsiDivergency5m │
// │  888 │ SFPUSDT      │ 2024 04 14 04:10:00 │ 2024 04 14 12:10:00 │ SHORT        │ 2.45%  │ 7.09%   │ 0.86       │ rsiDivergency5m │
// │  889 │ XVGUSDT      │ 2024 04 14 16:20:00 │ 2024 04 14 16:45:00 │ LONG         │ -0.55% │ 6.54%   │ 0.01       │ rsiDivergency5m │
// │  890 │ SUPERUSDT    │ 2024 04 14 17:55:00 │ 2024 04 14 18:20:00 │ SHORT        │ -0.55% │ 5.99%   │ 0.96       │ rsiDivergency5m │
// │  891 │ WUSDT        │ 2024 04 14 18:25:00 │ 2024 04 15 02:45:00 │ SHORT        │ 1.36%  │ 7.36%   │ 0.71       │ rsiDivergency5m │
// │  892 │ LINAUSDT     │ 2024 04 15 02:50:00 │ 2024 04 15 11:10:00 │ SHORT        │ 1.36%  │ 8.71%   │ 0.01       │ rsiDivergency5m │
// │  893 │ POWRUSDT     │ 2024 04 15 11:25:00 │ 2024 04 15 12:25:00 │ LONG         │ -0.55% │ 8.16%   │ 0.30       │ rsiDivergency5m │
// │  894 │ IOSTUSDT     │ 2024 04 15 12:45:00 │ 2024 04 15 13:55:00 │ LONG         │ -0.55% │ 7.61%   │ 0.01       │ rsiDivergency5m │
// │  895 │ WUSDT        │ 2024 04 15 18:30:00 │ 2024 04 16 02:50:00 │ SHORT        │ 0.81%  │ 8.42%   │ 0.65       │ rsiDivergency5m │
// │  896 │ DARUSDT      │ 2024 04 16 03:00:00 │ 2024 04 16 11:20:00 │ SHORT        │ 1.09%  │ 9.51%   │ 0.15       │ rsiDivergency5m │
// │  897 │ ONTUSDT      │ 2024 04 16 11:25:00 │ 2024 04 16 16:20:00 │ LONG         │ 2.45%  │ 11.96%  │ 0.29       │ rsiDivergency5m │
// │  898 │ BEAMXUSDT    │ 2024 04 16 16:25:00 │ 2024 04 16 23:30:00 │ SHORT        │ -0.55% │ 11.41%  │ 0.03       │ rsiDivergency5m │
// │  899 │ TNSRUSDT     │ 2024 04 17 05:10:00 │ 2024 04 17 05:45:00 │ LONG         │ -0.55% │ 10.86%  │ 0.82       │ rsiDivergency5m │
// │  900 │ TAOUSDT      │ 2024 04 17 07:15:00 │ 2024 04 17 09:05:00 │ LONG         │ -0.55% │ 10.31%  │ 463.00     │ rsiDivergency5m │
// │  901 │ NEOUSDT      │ 2024 04 17 09:20:00 │ 2024 04 17 17:40:00 │ LONG         │ 0.39%  │ 10.71%  │ 17.48      │ rsiDivergency5m │
// │  902 │ ETHFIUSDT    │ 2024 04 17 19:35:00 │ 2024 04 18 02:30:00 │ LONG         │ -0.55% │ 10.16%  │ 3.43       │ rsiDivergency5m │
// │  903 │ ENAUSDT      │ 2024 04 18 02:40:00 │ 2024 04 18 06:20:00 │ LONG         │ 2.45%  │ 12.61%  │ 0.83       │ rsiDivergency5m │
// │  904 │ ONGUSDT      │ 2024 04 18 08:10:00 │ 2024 04 18 08:30:00 │ SHORT        │ -0.55% │ 12.06%  │ 0.55       │ rsiDivergency5m │
// │  905 │ TRUUSDT      │ 2024 04 18 09:25:00 │ 2024 04 18 10:10:00 │ SHORT        │ -0.55% │ 11.51%  │ 0.11       │ rsiDivergency5m │
// │  906 │ LPTUSDT      │ 2024 04 18 14:35:00 │ 2024 04 18 20:40:00 │ SHORT        │ 2.45%  │ 13.96%  │ 13.94      │ rsiDivergency5m │
// │  907 │ FRONTUSDT    │ 2024 04 18 21:00:00 │ 2024 04 18 21:25:00 │ LONG         │ -0.55% │ 13.41%  │ 0.69       │ rsiDivergency5m │
// │  908 │ ENAUSDT      │ 2024 04 18 21:30:00 │ 2024 04 19 01:35:00 │ LONG         │ 2.45%  │ 15.86%  │ 0.83       │ rsiDivergency5m │
// │  909 │ DODOXUSDT    │ 2024 04 19 03:10:00 │ 2024 04 19 11:30:00 │ SHORT        │ 0.00%  │ 15.86%  │ 0.16       │ rsiDivergency5m │
// │  910 │ TAOUSDT      │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.95%  │ 16.81%  │ 433.10     │ rsiDivergency5m │
// │  911 │ ONTUSDT      │ 2024 04 20 07:35:00 │ 2024 04 20 15:55:00 │ LONG         │ 0.22%  │ 17.04%  │ 0.36       │ rsiDivergency5m │
// │  912 │ 1000BONKUSDT │ 2024 04 20 16:15:00 │ 2024 04 20 17:20:00 │ SHORT        │ -0.55% │ 16.49%  │ 0.02       │ rsiDivergency5m │
// │  913 │ TRUUSDT      │ 2024 04 20 19:50:00 │ 2024 04 21 04:10:00 │ LONG         │ 0.17%  │ 16.66%  │ 0.13       │ rsiDivergency5m │
// │  914 │ ONGUSDT      │ 2024 04 21 06:55:00 │ 2024 04 21 07:00:00 │ SHORT        │ -0.55% │ 16.11%  │ 0.70       │ rsiDivergency5m │
// │  915 │ ONGUSDT      │ 2024 04 21 07:05:00 │ 2024 04 21 07:45:00 │ SHORT        │ -0.55% │ 15.56%  │ 0.71       │ rsiDivergency5m │
// │  916 │ ONGUSDT      │ 2024 04 21 07:50:00 │ 2024 04 21 07:55:00 │ SHORT        │ -0.55% │ 15.01%  │ 0.73       │ rsiDivergency5m │
// │  917 │ ONGUSDT      │ 2024 04 21 08:00:00 │ 2024 04 21 09:30:00 │ SHORT        │ -0.55% │ 14.46%  │ 0.76       │ rsiDivergency5m │
// │  918 │ OMNIUSDT     │ 2024 04 21 09:40:00 │ 2024 04 21 11:35:00 │ LONG         │ -0.55% │ 13.91%  │ 26.06      │ rsiDivergency5m │
// │  919 │ 1000SHIBUSDT │ 2024 04 21 11:45:00 │ 2024 04 21 20:05:00 │ LONG         │ 0.63%  │ 14.54%  │ 0.03       │ rsiDivergency5m │
// │  920 │ NTRNUSDT     │ 2024 04 21 23:10:00 │ 2024 04 21 23:15:00 │ SHORT        │ -0.55% │ 13.99%  │ 0.87       │ rsiDivergency5m │
// │  921 │ NTRNUSDT     │ 2024 04 21 23:35:00 │ 2024 04 22 07:55:00 │ SHORT        │ 0.82%  │ 14.81%  │ 0.88       │ rsiDivergency5m │
// │  922 │ DODOXUSDT    │ 2024 04 22 15:45:00 │ 2024 04 22 16:05:00 │ SHORT        │ -0.55% │ 14.26%  │ 0.20       │ rsiDivergency5m │
// │  923 │ TNSRUSDT     │ 2024 04 22 23:50:00 │ 2024 04 23 08:10:00 │ LONG         │ 1.24%  │ 15.50%  │ 1.10       │ rsiDivergency5m │
// │  924 │ TOKENUSDT    │ 2024 04 23 10:30:00 │ 2024 04 23 11:00:00 │ SHORT        │ -0.55% │ 14.95%  │ 0.13       │ rsiDivergency5m │
// │  925 │ TOKENUSDT    │ 2024 04 23 11:15:00 │ 2024 04 23 11:30:00 │ SHORT        │ -0.55% │ 14.40%  │ 0.13       │ rsiDivergency5m │
// │  926 │ TOKENUSDT    │ 2024 04 23 11:35:00 │ 2024 04 23 12:00:00 │ SHORT        │ -0.55% │ 13.85%  │ 0.14       │ rsiDivergency5m │
// │  927 │ ONTUSDT      │ 2024 04 23 16:50:00 │ 2024 04 23 18:05:00 │ LONG         │ -0.55% │ 13.30%  │ 0.43       │ rsiDivergency5m │
// │  928 │ TOKENUSDT    │ 2024 04 23 18:15:00 │ 2024 04 24 00:45:00 │ LONG         │ -0.55% │ 12.75%  │ 0.13       │ rsiDivergency5m │
// │  929 │ ONDOUSDT     │ 2024 04 24 06:00:00 │ 2024 04 24 14:20:00 │ SHORT        │ 1.27%  │ 14.02%  │ 0.91       │ rsiDivergency5m │
// │  930 │ FETUSDT      │ 2024 04 24 17:55:00 │ 2024 04 25 02:15:00 │ LONG         │ 0.14%  │ 14.17%  │ 2.25       │ rsiDivergency5m │
// │  931 │ WUSDT        │ 2024 04 25 08:30:00 │ 2024 04 25 08:45:00 │ SHORT        │ -0.55% │ 13.62%  │ 0.58       │ rsiDivergency5m │
// │  932 │ WUSDT        │ 2024 04 25 08:50:00 │ 2024 04 25 09:10:00 │ SHORT        │ -0.55% │ 13.07%  │ 0.59       │ rsiDivergency5m │
// │  933 │ WUSDT        │ 2024 04 25 09:25:00 │ 2024 04 25 09:35:00 │ SHORT        │ -0.55% │ 12.52%  │ 0.61       │ rsiDivergency5m │
// │  934 │ WUSDT        │ 2024 04 25 09:40:00 │ 2024 04 25 10:35:00 │ SHORT        │ -0.55% │ 11.97%  │ 0.62       │ rsiDivergency5m │
// │  935 │ WUSDT        │ 2024 04 25 10:50:00 │ 2024 04 25 11:55:00 │ SHORT        │ -0.55% │ 11.42%  │ 0.65       │ rsiDivergency5m │
// │  936 │ 1000BONKUSDT │ 2024 04 25 12:00:00 │ 2024 04 25 19:35:00 │ SHORT        │ 2.45%  │ 13.87%  │ 0.03       │ rsiDivergency5m │
// │  937 │ LSKUSDT      │ 2024 04 25 19:40:00 │ 2024 04 25 20:15:00 │ LONG         │ -0.55% │ 13.32%  │ 1.85       │ rsiDivergency5m │
// │  938 │ ZETAUSDT     │ 2024 04 25 20:20:00 │ 2024 04 26 04:40:00 │ LONG         │ 0.23%  │ 13.54%  │ 1.18       │ rsiDivergency5m │
// │  939 │ ALGOUSDT     │ 2024 04 26 07:55:00 │ 2024 04 26 16:15:00 │ LONG         │ 0.30%  │ 13.85%  │ 0.20       │ rsiDivergency5m │
// │  940 │ MYROUSDT     │ 2024 04 26 17:30:00 │ 2024 04 26 19:30:00 │ LONG         │ -0.55% │ 13.30%  │ 0.16       │ rsiDivergency5m │
// │  941 │ LSKUSDT      │ 2024 04 26 19:45:00 │ 2024 04 26 20:15:00 │ LONG         │ -0.55% │ 12.75%  │ 1.68       │ rsiDivergency5m │
// │  942 │ ALTUSDT      │ 2024 04 26 20:20:00 │ 2024 04 27 04:40:00 │ LONG         │ 0.30%  │ 13.05%  │ 0.35       │ rsiDivergency5m │
// │  943 │ 1000BONKUSDT │ 2024 04 27 18:10:00 │ 2024 04 28 00:20:00 │ LONG         │ 2.45%  │ 15.50%  │ 0.02       │ rsiDivergency5m │
// │  944 │ ZETAUSDT     │ 2024 04 28 00:25:00 │ 2024 04 28 08:45:00 │ SHORT        │ 1.44%  │ 16.94%  │ 1.30       │ rsiDivergency5m │
// │  945 │ ALTUSDT      │ 2024 04 28 12:45:00 │ 2024 04 28 21:05:00 │ SHORT        │ 1.01%  │ 17.95%  │ 0.41       │ rsiDivergency5m │
// │  946 │ WUSDT        │ 2024 04 28 21:40:00 │ 2024 04 28 22:30:00 │ LONG         │ -0.55% │ 17.40%  │ 0.61       │ rsiDivergency5m │
// │  947 │ POLYXUSDT    │ 2024 04 28 22:35:00 │ 2024 04 29 01:45:00 │ LONG         │ -0.55% │ 16.85%  │ 0.37       │ rsiDivergency5m │
// │  948 │ POLYXUSDT    │ 2024 04 29 01:50:00 │ 2024 04 29 08:50:00 │ LONG         │ -0.55% │ 16.30%  │ 0.37       │ rsiDivergency5m │
// │  949 │ ENAUSDT      │ 2024 04 29 11:00:00 │ 2024 04 29 12:30:00 │ SHORT        │ -0.55% │ 15.75%  │ 0.88       │ rsiDivergency5m │
// │  950 │ LEVERUSDT    │ 2024 04 29 18:05:00 │ 2024 04 30 02:25:00 │ SHORT        │ -0.10% │ 15.65%  │ 0.00       │ rsiDivergency5m │
// │  951 │ LEVERUSDT    │ 2024 04 30 04:25:00 │ 2024 04 30 07:05:00 │ LONG         │ -0.55% │ 15.10%  │ 0.00       │ rsiDivergency5m │
// │  952 │ ALTUSDT      │ 2024 04 30 07:10:00 │ 2024 04 30 10:40:00 │ LONG         │ -0.55% │ 14.55%  │ 0.35       │ rsiDivergency5m │
// │  953 │ CKBUSDT      │ 2024 04 30 10:45:00 │ 2024 04 30 11:05:00 │ LONG         │ -0.55% │ 14.00%  │ 0.02       │ rsiDivergency5m │
// │  954 │ MAVUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 0.78%  │ 14.78%  │ 0.35       │ rsiDivergency5m │
// │  955 │ HIGHUSDT     │ 2024 04 30 22:15:00 │ 2024 05 01 06:35:00 │ LONG         │ 1.73%  │ 16.51%  │ 3.26       │ rsiDivergency5m │
// │  956 │ MYROUSDT     │ 2024 05 01 07:00:00 │ 2024 05 01 07:10:00 │ SHORT        │ -0.55% │ 15.96%  │ 0.13       │ rsiDivergency5m │
// │  957 │ HOOKUSDT     │ 2024 05 01 07:25:00 │ 2024 05 01 13:35:00 │ SHORT        │ -0.55% │ 15.41%  │ 0.81       │ rsiDivergency5m │
// │  958 │ MYROUSDT     │ 2024 05 01 13:45:00 │ 2024 05 01 22:05:00 │ SHORT        │ 1.84%  │ 17.25%  │ 0.14       │ rsiDivergency5m │
// │  959 │ ONGUSDT      │ 2024 05 02 00:30:00 │ 2024 05 02 08:50:00 │ LONG         │ 0.07%  │ 17.32%  │ 0.52       │ rsiDivergency5m │
// │  960 │ ARUSDT       │ 2024 05 02 10:10:00 │ 2024 05 02 12:15:00 │ SHORT        │ -0.55% │ 16.77%  │ 33.12      │ rsiDivergency5m │
// │  961 │ ARUSDT       │ 2024 05 02 13:05:00 │ 2024 05 02 13:40:00 │ SHORT        │ -0.55% │ 16.22%  │ 34.20      │ rsiDivergency5m │
// │  962 │ ALTUSDT      │ 2024 05 02 13:50:00 │ 2024 05 02 20:35:00 │ SHORT        │ -0.55% │ 15.67%  │ 0.38       │ rsiDivergency5m │
// │  963 │ POLYXUSDT    │ 2024 05 02 21:55:00 │ 2024 05 03 06:15:00 │ SHORT        │ 1.28%  │ 16.95%  │ 0.37       │ rsiDivergency5m │
// │  964 │ ARUSDT       │ 2024 05 03 08:10:00 │ 2024 05 03 08:35:00 │ SHORT        │ -0.55% │ 16.40%  │ 37.20      │ rsiDivergency5m │
// │  965 │ ARUSDT       │ 2024 05 03 08:50:00 │ 2024 05 03 17:10:00 │ SHORT        │ 1.62%  │ 18.03%  │ 37.56      │ rsiDivergency5m │
// │  966 │ OMNIUSDT     │ 2024 05 03 17:15:00 │ 2024 05 04 01:35:00 │ SHORT        │ 0.66%  │ 18.68%  │ 19.84      │ rsiDivergency5m │
// │  967 │ LSKUSDT      │ 2024 05 04 04:35:00 │ 2024 05 04 12:55:00 │ SHORT        │ 1.26%  │ 19.94%  │ 2.07       │ rsiDivergency5m │
// │  968 │ WUSDT        │ 2024 05 04 22:30:00 │ 2024 05 05 06:50:00 │ LONG         │ -0.09% │ 19.85%  │ 0.67       │ rsiDivergency5m │
// │  969 │ HIGHUSDT     │ 2024 05 05 07:00:00 │ 2024 05 05 15:20:00 │ SHORT        │ 0.95%  │ 20.80%  │ 4.32       │ rsiDivergency5m │
// │  970 │ USTCUSDT     │ 2024 05 05 17:45:00 │ 2024 05 05 19:35:00 │ SHORT        │ -0.55% │ 20.25%  │ 0.02       │ rsiDivergency5m │
// │  971 │ ENAUSDT      │ 2024 05 06 00:30:00 │ 2024 05 06 03:15:00 │ SHORT        │ -0.55% │ 19.70%  │ 0.90       │ rsiDivergency5m │
// │  972 │ RSRUSDT      │ 2024 05 06 03:30:00 │ 2024 05 06 04:10:00 │ SHORT        │ -0.55% │ 19.15%  │ 0.01       │ rsiDivergency5m │
// │  973 │ NMRUSDT      │ 2024 05 06 04:40:00 │ 2024 05 06 04:45:00 │ SHORT        │ -0.55% │ 18.60%  │ 29.24      │ rsiDivergency5m │
// │  974 │ NMRUSDT      │ 2024 05 06 04:50:00 │ 2024 05 06 13:10:00 │ SHORT        │ 2.15%  │ 20.75%  │ 29.58      │ rsiDivergency5m │
// │  975 │ CKBUSDT      │ 2024 05 06 16:55:00 │ 2024 05 07 01:15:00 │ SHORT        │ 0.64%  │ 21.39%  │ 0.02       │ rsiDivergency5m │
// │  976 │ POWRUSDT     │ 2024 05 07 01:20:00 │ 2024 05 07 09:40:00 │ SHORT        │ 1.19%  │ 22.59%  │ 0.36       │ rsiDivergency5m │
// │  977 │ LEVERUSDT    │ 2024 05 07 10:20:00 │ 2024 05 07 11:05:00 │ LONG         │ -0.55% │ 22.04%  │ 0.00       │ rsiDivergency5m │
// │  978 │ TOKENUSDT    │ 2024 05 07 17:15:00 │ 2024 05 07 19:25:00 │ LONG         │ -0.55% │ 21.49%  │ 0.10       │ rsiDivergency5m │
// │  979 │ USTCUSDT     │ 2024 05 07 21:10:00 │ 2024 05 08 04:15:00 │ SHORT        │ 2.45%  │ 23.94%  │ 0.02       │ rsiDivergency5m │
// │  980 │ USTCUSDT     │ 2024 05 08 04:25:00 │ 2024 05 08 12:45:00 │ LONG         │ 0.89%  │ 24.83%  │ 0.02       │ rsiDivergency5m │
// │  981 │ ARPAUSDT     │ 2024 05 08 14:10:00 │ 2024 05 08 22:30:00 │ SHORT        │ 1.20%  │ 26.03%  │ 0.07       │ rsiDivergency5m │
// │  982 │ PORTALUSDT   │ 2024 05 09 10:40:00 │ 2024 05 09 19:00:00 │ SHORT        │ 0.91%  │ 26.93%  │ 0.85       │ rsiDivergency5m │
// │  983 │ IMXUSDT      │ 2024 05 09 20:35:00 │ 2024 05 10 04:55:00 │ SHORT        │ -0.38% │ 26.56%  │ 2.23       │ rsiDivergency5m │
// │  984 │ NFPUSDT      │ 2024 05 10 05:05:00 │ 2024 05 10 05:25:00 │ SHORT        │ -0.55% │ 26.01%  │ 0.52       │ rsiDivergency5m │
// │  985 │ UMAUSDT      │ 2024 05 10 07:15:00 │ 2024 05 10 11:00:00 │ SHORT        │ 2.45%  │ 28.46%  │ 3.91       │ rsiDivergency5m │
// │  986 │ XVGUSDT      │ 2024 05 10 11:05:00 │ 2024 05 10 19:25:00 │ LONG         │ 0.24%  │ 28.69%  │ 0.01       │ rsiDivergency5m │
// │  987 │ ACEUSDT      │ 2024 05 10 20:20:00 │ 2024 05 11 04:40:00 │ SHORT        │ 0.91%  │ 29.60%  │ 5.37       │ rsiDivergency5m │
// │  988 │ TNSRUSDT     │ 2024 05 11 08:45:00 │ 2024 05 11 09:00:00 │ SHORT        │ -0.55% │ 29.05%  │ 0.93       │ rsiDivergency5m │
// │  989 │ TNSRUSDT     │ 2024 05 11 10:20:00 │ 2024 05 11 10:30:00 │ SHORT        │ -0.55% │ 28.50%  │ 0.99       │ rsiDivergency5m │
// │  990 │ TNSRUSDT     │ 2024 05 11 10:35:00 │ 2024 05 11 10:45:00 │ SHORT        │ -0.55% │ 27.95%  │ 1.01       │ rsiDivergency5m │
// │  991 │ TNSRUSDT     │ 2024 05 11 10:50:00 │ 2024 05 11 11:05:00 │ SHORT        │ -0.55% │ 27.40%  │ 1.02       │ rsiDivergency5m │
// │  992 │ TNSRUSDT     │ 2024 05 11 11:10:00 │ 2024 05 11 19:30:00 │ SHORT        │ 1.45%  │ 28.84%  │ 1.03       │ rsiDivergency5m │
// │  993 │ PORTALUSDT   │ 2024 05 12 03:30:00 │ 2024 05 12 04:15:00 │ SHORT        │ -0.55% │ 28.29%  │ 0.89       │ rsiDivergency5m │
// │  994 │ PORTALUSDT   │ 2024 05 12 05:25:00 │ 2024 05 12 13:45:00 │ SHORT        │ 2.40%  │ 30.70%  │ 0.92       │ rsiDivergency5m │
// │  995 │ POWRUSDT     │ 2024 05 12 19:55:00 │ 2024 05 13 01:00:00 │ SHORT        │ -0.55% │ 30.15%  │ 0.33       │ rsiDivergency5m │
// │  996 │ FETUSDT      │ 2024 05 13 02:05:00 │ 2024 05 13 03:00:00 │ SHORT        │ -0.55% │ 29.60%  │ 2.11       │ rsiDivergency5m │
// │  997 │ BONDUSDT     │ 2024 05 13 03:50:00 │ 2024 05 13 05:00:00 │ SHORT        │ -0.55% │ 29.05%  │ 2.95       │ rsiDivergency5m │
// │  998 │ VANRYUSDT    │ 2024 05 13 05:05:00 │ 2024 05 13 06:20:00 │ SHORT        │ -0.55% │ 28.50%  │ 0.17       │ rsiDivergency5m │
// │  999 │ ARUSDT       │ 2024 05 13 09:15:00 │ 2024 05 13 17:35:00 │ SHORT        │ 1.03%  │ 29.52%  │ 40.91      │ rsiDivergency5m │
// │ 1000 │ UMAUSDT      │ 2024 05 13 17:50:00 │ 2024 05 13 19:05:00 │ SHORT        │ -0.55% │ 28.97%  │ 4.03       │ rsiDivergency5m │
// │ 1001 │ UMAUSDT      │ 2024 05 13 19:15:00 │ 2024 05 13 19:30:00 │ SHORT        │ -0.55% │ 28.42%  │ 4.11       │ rsiDivergency5m │
// │ 1002 │ SUPERUSDT    │ 2024 05 13 19:55:00 │ 2024 05 14 04:15:00 │ LONG         │ 0.13%  │ 28.55%  │ 0.91       │ rsiDivergency5m │
// │ 1003 │ UMAUSDT      │ 2024 05 14 08:55:00 │ 2024 05 14 17:15:00 │ LONG         │ -0.24% │ 28.31%  │ 3.70       │ rsiDivergency5m │
// │ 1004 │ WLDUSDT      │ 2024 05 14 19:30:00 │ 2024 05 14 20:15:00 │ SHORT        │ -0.55% │ 27.76%  │ 4.87       │ rsiDivergency5m │
// │ 1005 │ FRONTUSDT    │ 2024 05 14 20:50:00 │ 2024 05 15 05:10:00 │ SHORT        │ 0.66%  │ 28.42%  │ 1.20       │ rsiDivergency5m │
// │ 1006 │ LPTUSDT      │ 2024 05 15 05:20:00 │ 2024 05 15 07:30:00 │ SHORT        │ -0.55% │ 27.87%  │ 18.24      │ rsiDivergency5m │
// │ 1007 │ TOKENUSDT    │ 2024 05 15 08:20:00 │ 2024 05 15 08:30:00 │ SHORT        │ -0.55% │ 27.32%  │ 0.09       │ rsiDivergency5m │
// │ 1008 │ TOKENUSDT    │ 2024 05 15 08:35:00 │ 2024 05 15 09:55:00 │ SHORT        │ -0.55% │ 26.77%  │ 0.09       │ rsiDivergency5m │
// │ 1009 │ LPTUSDT      │ 2024 05 15 10:00:00 │ 2024 05 15 18:20:00 │ SHORT        │ 0.66%  │ 27.43%  │ 20.76      │ rsiDivergency5m │
// │ 1010 │ NTRNUSDT     │ 2024 05 15 21:15:00 │ 2024 05 16 05:35:00 │ SHORT        │ 0.06%  │ 27.49%  │ 0.69       │ rsiDivergency5m │
// │ 1011 │ VANRYUSDT    │ 2024 05 16 06:10:00 │ 2024 05 16 09:55:00 │ SHORT        │ 2.45%  │ 29.94%  │ 0.20       │ rsiDivergency5m │
// │ 1012 │ ENAUSDT      │ 2024 05 16 10:00:00 │ 2024 05 16 18:20:00 │ LONG         │ 0.20%  │ 30.13%  │ 0.66       │ rsiDivergency5m │
// │ 1013 │ BEAMXUSDT    │ 2024 05 17 01:20:00 │ 2024 05 17 05:10:00 │ LONG         │ -0.55% │ 29.58%  │ 0.02       │ rsiDivergency5m │
// │ 1014 │ TOKENUSDT    │ 2024 05 17 06:40:00 │ 2024 05 17 07:35:00 │ SHORT        │ -0.55% │ 29.03%  │ 0.11       │ rsiDivergency5m │
// │ 1015 │ TOKENUSDT    │ 2024 05 17 07:55:00 │ 2024 05 17 10:30:00 │ SHORT        │ -0.55% │ 28.48%  │ 0.11       │ rsiDivergency5m │
// │ 1016 │ STXUSDT      │ 2024 05 17 11:25:00 │ 2024 05 17 19:45:00 │ SHORT        │ 0.21%  │ 28.69%  │ 2.12       │ rsiDivergency5m │
// │ 1017 │ TRUUSDT      │ 2024 05 17 20:25:00 │ 2024 05 17 23:05:00 │ SHORT        │ -0.55% │ 28.14%  │ 0.13       │ rsiDivergency5m │
// │ 1018 │ POLYXUSDT    │ 2024 05 17 23:40:00 │ 2024 05 18 08:00:00 │ SHORT        │ 0.10%  │ 28.24%  │ 0.46       │ rsiDivergency5m │
// │ 1019 │ 1000BONKUSDT │ 2024 05 18 17:05:00 │ 2024 05 18 20:50:00 │ SHORT        │ -0.55% │ 27.69%  │ 0.03       │ rsiDivergency5m │
// │ 1020 │ TNSRUSDT     │ 2024 05 19 11:35:00 │ 2024 05 19 16:30:00 │ LONG         │ -0.55% │ 27.14%  │ 0.81       │ rsiDivergency5m │
// │ 1021 │ SAGAUSDT     │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 1.26%  │ 28.40%  │ 1.96       │ rsiDivergency5m │
// │ 1022 │ INJUSDT      │ 2024 05 20 12:25:00 │ 2024 05 20 13:35:00 │ SHORT        │ -0.55% │ 27.85%  │ 27.22      │ rsiDivergency5m │
// │ 1023 │ INJUSDT      │ 2024 05 20 13:45:00 │ 2024 05 20 20:45:00 │ SHORT        │ -0.55% │ 27.30%  │ 27.98      │ rsiDivergency5m │
// │ 1024 │ 1000BONKUSDT │ 2024 05 20 22:30:00 │ 2024 05 21 05:45:00 │ SHORT        │ -0.55% │ 26.75%  │ 0.03       │ rsiDivergency5m │
// │ 1025 │ ARUSDT       │ 2024 05 21 07:35:00 │ 2024 05 21 15:55:00 │ LONG         │ 0.37%  │ 27.13%  │ 43.70      │ rsiDivergency5m │
// │ 1026 │ USTCUSDT     │ 2024 05 22 07:05:00 │ 2024 05 22 15:25:00 │ SHORT        │ 1.46%  │ 28.59%  │ 0.02       │ rsiDivergency5m │
// │ 1027 │ HOOKUSDT     │ 2024 05 22 19:25:00 │ 2024 05 22 22:25:00 │ SHORT        │ -0.55% │ 28.04%  │ 0.96       │ rsiDivergency5m │
// │ 1028 │ MANTAUSDT    │ 2024 05 22 23:20:00 │ 2024 05 23 07:40:00 │ SHORT        │ 0.25%  │ 28.29%  │ 1.79       │ rsiDivergency5m │
// │ 1029 │ YGGUSDT      │ 2024 05 23 08:00:00 │ 2024 05 23 08:45:00 │ LONG         │ -0.55% │ 27.74%  │ 0.91       │ rsiDivergency5m │
// │ 1030 │ 1000SATSUSDT │ 2024 05 23 09:00:00 │ 2024 05 23 13:20:00 │ LONG         │ -0.55% │ 27.19%  │ 0.00       │ rsiDivergency5m │
// │ 1031 │ ORDIUSDT     │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 0.94%  │ 28.14%  │ 36.65      │ rsiDivergency5m │
// │ 1032 │ DEFIUSDT     │ 2024 05 23 23:40:00 │ 2024 05 24 08:00:00 │ SHORT        │ 0.11%  │ 28.25%  │ 1019.60    │ rsiDivergency5m │
// │ 1033 │ PENDLEUSDT   │ 2024 05 24 08:20:00 │ 2024 05 24 13:20:00 │ SHORT        │ -0.55% │ 27.70%  │ 6.42       │ rsiDivergency5m │
// │ 1034 │ RENUSDT      │ 2024 05 24 15:35:00 │ 2024 05 24 18:45:00 │ SHORT        │ -0.55% │ 27.15%  │ 0.07       │ rsiDivergency5m │
// │ 1035 │ UMAUSDT      │ 2024 05 24 19:30:00 │ 2024 05 25 03:50:00 │ SHORT        │ 0.69%  │ 27.84%  │ 3.67       │ rsiDivergency5m │
// │ 1036 │ MYROUSDT     │ 2024 05 25 06:35:00 │ 2024 05 25 14:55:00 │ SHORT        │ 0.03%  │ 27.87%  │ 0.26       │ rsiDivergency5m │
// │ 1037 │ ENSUSDT      │ 2024 05 25 15:50:00 │ 2024 05 26 00:10:00 │ LONG         │ 0.97%  │ 28.83%  │ 22.89      │ rsiDivergency5m │
// │ 1038 │ LDOUSDT      │ 2024 05 26 06:15:00 │ 2024 05 26 14:35:00 │ SHORT        │ 0.40%  │ 29.23%  │ 2.69       │ rsiDivergency5m │
// │ 1039 │ SNXUSDT      │ 2024 05 26 22:15:00 │ 2024 05 26 22:20:00 │ SHORT        │ -0.55% │ 28.68%  │ 3.22       │ rsiDivergency5m │
// │ 1040 │ VANRYUSDT    │ 2024 05 26 23:20:00 │ 2024 05 27 07:40:00 │ SHORT        │ 1.11%  │ 29.79%  │ 0.21       │ rsiDivergency5m │
// │ 1041 │ ENJUSDT      │ 2024 05 27 13:10:00 │ 2024 05 27 13:25:00 │ SHORT        │ -0.55% │ 29.24%  │ 0.38       │ rsiDivergency5m │
// │ 1042 │ ENJUSDT      │ 2024 05 27 13:35:00 │ 2024 05 27 20:05:00 │ SHORT        │ -0.55% │ 28.69%  │ 0.38       │ rsiDivergency5m │
// │ 1043 │ TNSRUSDT     │ 2024 05 28 05:25:00 │ 2024 05 28 13:45:00 │ SHORT        │ 1.82%  │ 30.51%  │ 1.23       │ rsiDivergency5m │
// │ 1044 │ 1000SHIBUSDT │ 2024 05 28 22:15:00 │ 2024 05 28 22:40:00 │ SHORT        │ -0.55% │ 29.96%  │ 0.03       │ rsiDivergency5m │
// │ 1045 │ TRUUSDT      │ 2024 05 29 00:55:00 │ 2024 05 29 01:00:00 │ SHORT        │ -0.55% │ 29.41%  │ 0.23       │ rsiDivergency5m │
// │ 1046 │ MYROUSDT     │ 2024 05 29 04:05:00 │ 2024 05 29 04:15:00 │ LONG         │ -0.55% │ 28.86%  │ 0.30       │ rsiDivergency5m │
// │ 1047 │ AIUSDT       │ 2024 05 29 23:25:00 │ 2024 05 30 07:45:00 │ SHORT        │ -0.02% │ 28.84%  │ 1.22       │ rsiDivergency5m │
// │ 1048 │ 1000BONKUSDT │ 2024 05 30 09:25:00 │ 2024 05 30 17:45:00 │ SHORT        │ 1.27%  │ 30.10%  │ 0.04       │ rsiDivergency5m │
// │ 1049 │ 1000SATSUSDT │ 2024 05 30 18:35:00 │ 2024 05 30 22:15:00 │ SHORT        │ -0.55% │ 29.55%  │ 0.00       │ rsiDivergency5m │
// │ 1050 │ TNSRUSDT     │ 2024 05 31 05:10:00 │ 2024 05 31 13:30:00 │ SHORT        │ 0.97%  │ 30.52%  │ 1.10       │ rsiDivergency5m │
// │ 1051 │ BEAMXUSDT    │ 2024 05 31 20:45:00 │ 2024 05 31 21:50:00 │ SHORT        │ -0.55% │ 29.97%  │ 0.03       │ rsiDivergency5m │
// │ 1052 │ HIGHUSDT     │ 2024 06 01 02:30:00 │ 2024 06 01 03:15:00 │ LONG         │ -0.55% │ 29.42%  │ 6.69       │ rsiDivergency5m │
// │ 1053 │ PIXELUSDT    │ 2024 06 01 08:05:00 │ 2024 06 01 16:25:00 │ SHORT        │ -0.55% │ 28.87%  │ 0.46       │ rsiDivergency5m │
// │ 1054 │ ENSUSDT      │ 2024 06 01 17:50:00 │ 2024 06 02 02:10:00 │ SHORT        │ 1.09%  │ 29.96%  │ 29.34      │ rsiDivergency5m │
// │ 1055 │ SPELLUSDT    │ 2024 06 02 02:40:00 │ 2024 06 02 11:00:00 │ LONG         │ 0.35%  │ 30.32%  │ 0.00       │ rsiDivergency5m │
// │ 1056 │ VANRYUSDT    │ 2024 06 02 11:30:00 │ 2024 06 02 19:50:00 │ SHORT        │ 1.31%  │ 31.63%  │ 0.23       │ rsiDivergency5m │
// │ 1057 │ KLAYUSDT     │ 2024 06 02 20:05:00 │ 2024 06 02 20:40:00 │ SHORT        │ -0.55% │ 31.08%  │ 0.24       │ rsiDivergency5m │
// │ 1058 │ KLAYUSDT     │ 2024 06 02 20:50:00 │ 2024 06 02 21:25:00 │ SHORT        │ -0.55% │ 30.53%  │ 0.25       │ rsiDivergency5m │
// │ 1059 │ KLAYUSDT     │ 2024 06 02 21:40:00 │ 2024 06 03 02:55:00 │ SHORT        │ 2.45%  │ 32.98%  │ 0.26       │ rsiDivergency5m │
// │ 1060 │ SPELLUSDT    │ 2024 06 03 08:05:00 │ 2024 06 03 08:10:00 │ SHORT        │ -0.55% │ 32.43%  │ 0.00       │ rsiDivergency5m │
// │ 1061 │ HIGHUSDT     │ 2024 06 03 09:20:00 │ 2024 06 03 11:05:00 │ LONG         │ -0.55% │ 31.88%  │ 7.24       │ rsiDivergency5m │
// │ 1062 │ MYROUSDT     │ 2024 06 03 17:10:00 │ 2024 06 04 01:30:00 │ LONG         │ 0.09%  │ 31.97%  │ 0.24       │ rsiDivergency5m │
// │ 1063 │ ALICEUSDT    │ 2024 06 04 08:00:00 │ 2024 06 04 16:20:00 │ LONG         │ 0.65%  │ 32.62%  │ 2.12       │ rsiDivergency5m │
// │ 1064 │ CKBUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 20:40:00 │ SHORT        │ -0.55% │ 32.07%  │ 0.02       │ rsiDivergency5m │
// │ 1065 │ TOKENUSDT    │ 2024 06 04 21:25:00 │ 2024 06 04 21:30:00 │ SHORT        │ -0.55% │ 31.52%  │ 0.16       │ rsiDivergency5m │
// │ 1066 │ TOKENUSDT    │ 2024 06 04 21:35:00 │ 2024 06 04 21:50:00 │ SHORT        │ -0.55% │ 30.97%  │ 0.16       │ rsiDivergency5m │
// │ 1067 │ TOKENUSDT    │ 2024 06 04 22:00:00 │ 2024 06 05 01:35:00 │ SHORT        │ -0.55% │ 30.42%  │ 0.17       │ rsiDivergency5m │
// │ 1068 │ RSRUSDT      │ 2024 06 05 01:45:00 │ 2024 06 05 10:05:00 │ SHORT        │ 0.53%  │ 30.95%  │ 0.01       │ rsiDivergency5m │
// │ 1069 │ GMXUSDT      │ 2024 06 05 10:20:00 │ 2024 06 05 12:00:00 │ SHORT        │ -0.55% │ 30.40%  │ 40.26      │ rsiDivergency5m │
// │ 1070 │ STXUSDT      │ 2024 06 05 12:05:00 │ 2024 06 05 12:55:00 │ SHORT        │ -0.55% │ 29.85%  │ 2.39       │ rsiDivergency5m │
// │ 1071 │ GMXUSDT      │ 2024 06 05 13:05:00 │ 2024 06 05 21:25:00 │ SHORT        │ -0.06% │ 29.79%  │ 42.39      │ rsiDivergency5m │
// │ 1072 │ REZUSDT      │ 2024 06 05 22:05:00 │ 2024 06 06 06:25:00 │ SHORT        │ 2.05%  │ 31.84%  │ 0.18       │ rsiDivergency5m │
// │ 1073 │ LQTYUSDT     │ 2024 06 06 07:55:00 │ 2024 06 06 08:05:00 │ SHORT        │ -0.55% │ 31.29%  │ 1.47       │ rsiDivergency5m │
// │ 1074 │ REZUSDT      │ 2024 06 06 09:45:00 │ 2024 06 06 18:05:00 │ SHORT        │ 0.95%  │ 32.24%  │ 0.18       │ rsiDivergency5m │
// │ 1075 │ MYROUSDT     │ 2024 06 06 18:25:00 │ 2024 06 07 02:45:00 │ LONG         │ 0.11%  │ 32.35%  │ 0.27       │ rsiDivergency5m │
// │ 1076 │ USTCUSDT     │ 2024 06 07 04:15:00 │ 2024 06 07 07:30:00 │ LONG         │ -0.55% │ 31.80%  │ 0.02       │ rsiDivergency5m │
// │ 1077 │ HIGHUSDT     │ 2024 06 07 08:45:00 │ 2024 06 07 09:00:00 │ SHORT        │ -0.55% │ 31.25%  │ 8.30       │ rsiDivergency5m │
// │ 1078 │ HIGHUSDT     │ 2024 06 07 09:05:00 │ 2024 06 07 13:30:00 │ SHORT        │ -0.55% │ 30.70%  │ 8.40       │ rsiDivergency5m │
// │ 1079 │ XVSUSDT      │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 1.94%  │ 32.64%  │ 10.01      │ rsiDivergency5m │
// │ 1080 │ NKNUSDT      │ 2024 06 07 23:55:00 │ 2024 06 08 06:40:00 │ LONG         │ -0.55% │ 32.09%  │ 0.11       │ rsiDivergency5m │
// │ 1081 │ CKBUSDT      │ 2024 06 08 07:30:00 │ 2024 06 08 08:20:00 │ LONG         │ -0.55% │ 31.54%  │ 0.02       │ rsiDivergency5m │
// │ 1082 │ SAGAUSDT     │ 2024 06 08 08:30:00 │ 2024 06 08 16:50:00 │ LONG         │ 0.07%  │ 31.61%  │ 2.29       │ rsiDivergency5m │
// │ 1083 │ TOKENUSDT    │ 2024 06 08 21:20:00 │ 2024 06 09 05:40:00 │ LONG         │ -0.03% │ 31.58%  │ 0.13       │ rsiDivergency5m │
// │ 1084 │ HIGHUSDT     │ 2024 06 09 11:40:00 │ 2024 06 09 20:00:00 │ SHORT        │ 1.87%  │ 33.45%  │ 4.83       │ rsiDivergency5m │
// │ 1085 │ HIFIUSDT     │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.20%  │ 34.65%  │ 0.75       │ rsiDivergency5m │
// │ 1086 │ INJUSDT      │ 2024 06 10 10:35:00 │ 2024 06 10 18:55:00 │ SHORT        │ 0.06%  │ 34.72%  │ 29.47      │ rsiDivergency5m │
// │ 1087 │ POLYXUSDT    │ 2024 06 10 20:55:00 │ 2024 06 11 05:15:00 │ LONG         │ 0.47%  │ 35.19%  │ 0.49       │ rsiDivergency5m │
// │ 1088 │ 1000BONKUSDT │ 2024 06 11 05:25:00 │ 2024 06 11 13:45:00 │ SHORT        │ 0.46%  │ 35.65%  │ 0.03       │ rsiDivergency5m │
// │ 1089 │ ROSEUSDT     │ 2024 06 11 15:00:00 │ 2024 06 11 21:35:00 │ SHORT        │ -0.55% │ 35.10%  │ 0.12       │ rsiDivergency5m │
// │ 1090 │ 1000BONKUSDT │ 2024 06 12 01:40:00 │ 2024 06 12 03:10:00 │ SHORT        │ -0.55% │ 34.55%  │ 0.03       │ rsiDivergency5m │
// │ 1091 │ ONGUSDT      │ 2024 06 12 05:05:00 │ 2024 06 12 06:00:00 │ SHORT        │ -0.55% │ 34.00%  │ 0.41       │ rsiDivergency5m │
// │ 1092 │ VANRYUSDT    │ 2024 06 12 07:35:00 │ 2024 06 12 10:25:00 │ SHORT        │ -0.55% │ 33.45%  │ 0.17       │ rsiDivergency5m │
// │ 1093 │ VANRYUSDT    │ 2024 06 12 12:15:00 │ 2024 06 12 12:45:00 │ SHORT        │ -0.55% │ 32.90%  │ 0.18       │ rsiDivergency5m │
// │ 1094 │ TNSRUSDT     │ 2024 06 12 22:10:00 │ 2024 06 13 06:30:00 │ LONG         │ 0.56%  │ 33.46%  │ 0.81       │ rsiDivergency5m │
// │ 1095 │ POLYXUSDT    │ 2024 06 13 10:45:00 │ 2024 06 13 11:00:00 │ LONG         │ -0.55% │ 32.91%  │ 0.46       │ rsiDivergency5m │
// │ 1096 │ TOKENUSDT    │ 2024 06 13 11:05:00 │ 2024 06 13 19:20:00 │ LONG         │ -0.55% │ 32.36%  │ 0.10       │ rsiDivergency5m │
// │ 1097 │ KNCUSDT      │ 2024 06 13 19:25:00 │ 2024 06 14 03:45:00 │ LONG         │ 1.59%  │ 33.95%  │ 0.72       │ rsiDivergency5m │
// │ 1098 │ KNCUSDT      │ 2024 06 14 04:30:00 │ 2024 06 14 07:15:00 │ SHORT        │ -0.55% │ 33.40%  │ 0.79       │ rsiDivergency5m │
// │ 1099 │ ARUSDT       │ 2024 06 14 08:05:00 │ 2024 06 14 09:25:00 │ LONG         │ -0.55% │ 32.85%  │ 30.01      │ rsiDivergency5m │
// │ 1100 │ ONGUSDT      │ 2024 06 14 10:50:00 │ 2024 06 14 11:05:00 │ LONG         │ -0.55% │ 32.30%  │ 0.37       │ rsiDivergency5m │
// │ 1101 │ ROSEUSDT     │ 2024 06 14 11:10:00 │ 2024 06 14 13:05:00 │ LONG         │ -0.55% │ 31.75%  │ 0.12       │ rsiDivergency5m │
// │ 1102 │ DODOXUSDT    │ 2024 06 14 13:10:00 │ 2024 06 14 21:30:00 │ LONG         │ 0.56%  │ 32.31%  │ 0.16       │ rsiDivergency5m │
// │ 1103 │ 1000SHIBUSDT │ 2024 06 14 23:55:00 │ 2024 06 15 08:15:00 │ SHORT        │ -0.10% │ 32.21%  │ 0.02       │ rsiDivergency5m │
// │ 1104 │ LDOUSDT      │ 2024 06 16 10:10:00 │ 2024 06 16 10:55:00 │ SHORT        │ -0.55% │ 31.66%  │ 2.17       │ rsiDivergency5m │
// │ 1105 │ LDOUSDT      │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 0.97%  │ 32.63%  │ 2.24       │ rsiDivergency5m │
// │ 1106 │ POLYXUSDT    │ 2024 06 16 21:05:00 │ 2024 06 17 02:10:00 │ LONG         │ -0.55% │ 32.08%  │ 0.38       │ rsiDivergency5m │
// │ 1107 │ HIFIUSDT     │ 2024 06 17 02:15:00 │ 2024 06 17 04:40:00 │ LONG         │ -0.55% │ 31.53%  │ 0.54       │ rsiDivergency5m │
// │ 1108 │ POLYXUSDT    │ 2024 06 17 04:50:00 │ 2024 06 17 10:30:00 │ LONG         │ -0.55% │ 30.98%  │ 0.36       │ rsiDivergency5m │
// │ 1109 │ KNCUSDT      │ 2024 06 17 10:55:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.55% │ 30.43%  │ 0.62       │ rsiDivergency5m │
// │ 1110 │ 1000BONKUSDT │ 2024 06 17 13:35:00 │ 2024 06 17 20:20:00 │ SHORT        │ 2.45%  │ 32.88%  │ 0.02       │ rsiDivergency5m │
// │ 1111 │ KNCUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.55% │ 32.33%  │ 0.55       │ rsiDivergency5m │
// │ 1112 │ ONGUSDT      │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 0.25%  │ 32.58%  │ 0.28       │ rsiDivergency5m │
// │ 1113 │ FETUSDT      │ 2024 06 18 05:20:00 │ 2024 06 18 06:10:00 │ LONG         │ -0.55% │ 32.03%  │ 1.16       │ rsiDivergency5m │
// │ 1114 │ NMRUSDT      │ 2024 06 18 06:30:00 │ 2024 06 18 09:05:00 │ LONG         │ -0.55% │ 31.48%  │ 17.53      │ rsiDivergency5m │
// │ 1115 │ FRONTUSDT    │ 2024 06 18 09:40:00 │ 2024 06 18 12:30:00 │ SHORT        │ 2.45%  │ 33.93%  │ 1.06       │ rsiDivergency5m │
// │ 1116 │ CRVUSDT      │ 2024 06 18 15:50:00 │ 2024 06 18 16:30:00 │ SHORT        │ -0.55% │ 33.38%  │ 0.32       │ rsiDivergency5m │
// │ 1117 │ CRVUSDT      │ 2024 06 18 17:20:00 │ 2024 06 18 19:45:00 │ SHORT        │ -0.55% │ 32.83%  │ 0.33       │ rsiDivergency5m │
// │ 1118 │ ENSUSDT      │ 2024 06 18 20:20:00 │ 2024 06 18 21:20:00 │ SHORT        │ -0.55% │ 32.28%  │ 26.62      │ rsiDivergency5m │
// │ 1119 │ ENAUSDT      │ 2024 06 18 21:30:00 │ 2024 06 18 23:00:00 │ SHORT        │ -0.55% │ 31.73%  │ 0.66       │ rsiDivergency5m │
// │ 1120 │ FETUSDT      │ 2024 06 18 23:10:00 │ 2024 06 19 01:10:00 │ SHORT        │ -0.55% │ 31.18%  │ 1.27       │ rsiDivergency5m │
// │ 1121 │ ENAUSDT      │ 2024 06 19 04:20:00 │ 2024 06 19 09:30:00 │ LONG         │ -0.55% │ 30.63%  │ 0.63       │ rsiDivergency5m │
// │ 1122 │ LDOUSDT      │ 2024 06 19 10:40:00 │ 2024 06 19 19:00:00 │ LONG         │ 0.80%  │ 31.43%  │ 2.25       │ rsiDivergency5m │
// │ 1123 │ BONDUSDT     │ 2024 06 19 22:35:00 │ 2024 06 19 23:20:00 │ SHORT        │ -0.55% │ 30.88%  │ 2.11       │ rsiDivergency5m │
// │ 1124 │ NMRUSDT      │ 2024 06 20 00:35:00 │ 2024 06 20 08:55:00 │ SHORT        │ 0.48%  │ 31.37%  │ 20.06      │ rsiDivergency5m │
// │ 1125 │ INJUSDT      │ 2024 06 20 11:10:00 │ 2024 06 20 19:20:00 │ LONG         │ -0.55% │ 30.82%  │ 20.76      │ rsiDivergency5m │
// │ 1126 │ 1INCHUSDT    │ 2024 06 20 19:55:00 │ 2024 06 21 02:45:00 │ LONG         │ -0.55% │ 30.27%  │ 0.42       │ rsiDivergency5m │
// │ 1127 │ 1000BONKUSDT │ 2024 06 21 04:00:00 │ 2024 06 21 12:20:00 │ LONG         │ 0.19%  │ 30.46%  │ 0.02       │ rsiDivergency5m │
// │ 1128 │ ONGUSDT      │ 2024 06 21 13:05:00 │ 2024 06 21 21:25:00 │ LONG         │ 1.63%  │ 32.09%  │ 0.34       │ rsiDivergency5m │
// │ 1129 │ GASUSDT      │ 2024 06 22 03:25:00 │ 2024 06 22 11:45:00 │ LONG         │ -0.02% │ 32.06%  │ 3.67       │ rsiDivergency5m │
// │ 1130 │ 1000SATSUSDT │ 2024 06 22 12:00:00 │ 2024 06 22 20:20:00 │ SHORT        │ 0.44%  │ 32.50%  │ 0.00       │ rsiDivergency5m │
// │ 1131 │ VANRYUSDT    │ 2024 06 23 10:25:00 │ 2024 06 23 11:55:00 │ LONG         │ -0.55% │ 31.95%  │ 0.14       │ rsiDivergency5m │
// │ 1132 │ TRUUSDT      │ 2024 06 23 12:00:00 │ 2024 06 23 17:05:00 │ LONG         │ -0.55% │ 31.40%  │ 0.13       │ rsiDivergency5m │
// │ 1133 │ TRUUSDT      │ 2024 06 23 17:10:00 │ 2024 06 23 18:15:00 │ LONG         │ -0.55% │ 30.85%  │ 0.13       │ rsiDivergency5m │
// │ 1134 │ TRUUSDT      │ 2024 06 23 18:20:00 │ 2024 06 24 00:05:00 │ LONG         │ -0.55% │ 30.30%  │ 0.13       │ rsiDivergency5m │
// │ 1135 │ 1000SATSUSDT │ 2024 06 24 00:45:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.55% │ 29.75%  │ 0.00       │ rsiDivergency5m │
// │ 1136 │ STRKUSDT     │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 1.54%  │ 31.30%  │ 0.66       │ rsiDivergency5m │
// │ 1137 │ LDOUSDT      │ 2024 06 24 15:55:00 │ 2024 06 24 16:15:00 │ SHORT        │ -0.55% │ 30.75%  │ 2.40       │ rsiDivergency5m │
// │ 1138 │ LDOUSDT      │ 2024 06 24 16:20:00 │ 2024 06 25 00:40:00 │ SHORT        │ 0.03%  │ 30.78%  │ 2.42       │ rsiDivergency5m │
// │ 1139 │ STXUSDT      │ 2024 06 25 07:00:00 │ 2024 06 25 09:20:00 │ SHORT        │ -0.55% │ 30.23%  │ 1.71       │ rsiDivergency5m │
// │ 1140 │ STXUSDT      │ 2024 06 25 17:05:00 │ 2024 06 26 01:25:00 │ SHORT        │ 0.79%  │ 31.01%  │ 1.79       │ rsiDivergency5m │
// │ 1141 │ ONGUSDT      │ 2024 06 26 11:55:00 │ 2024 06 26 20:15:00 │ LONG         │ 0.07%  │ 31.09%  │ 0.34       │ rsiDivergency5m │
// │ 1142 │ FETUSDT      │ 2024 06 26 21:10:00 │ 2024 06 26 21:55:00 │ LONG         │ -0.55% │ 30.54%  │ 1.67       │ rsiDivergency5m │
// │ 1143 │ ENSUSDT      │ 2024 06 27 04:30:00 │ 2024 06 27 05:30:00 │ SHORT        │ -0.55% │ 29.99%  │ 25.94      │ rsiDivergency5m │
// │ 1144 │ 1000SATSUSDT │ 2024 06 27 05:35:00 │ 2024 06 27 06:15:00 │ SHORT        │ -0.55% │ 29.44%  │ 0.00       │ rsiDivergency5m │
// │ 1145 │ 1000SATSUSDT │ 2024 06 27 06:20:00 │ 2024 06 27 06:55:00 │ SHORT        │ -0.55% │ 28.89%  │ 0.00       │ rsiDivergency5m │
// │ 1146 │ 1000SATSUSDT │ 2024 06 27 07:00:00 │ 2024 06 27 07:15:00 │ SHORT        │ -0.55% │ 28.34%  │ 0.00       │ rsiDivergency5m │
// │ 1147 │ LEVERUSDT    │ 2024 06 27 07:50:00 │ 2024 06 27 13:25:00 │ SHORT        │ -0.55% │ 27.79%  │ 0.00       │ rsiDivergency5m │
// │ 1148 │ LEVERUSDT    │ 2024 06 27 14:00:00 │ 2024 06 27 22:20:00 │ SHORT        │ -0.10% │ 27.69%  │ 0.00       │ rsiDivergency5m │
// │ 1149 │ FETUSDT      │ 2024 06 28 00:10:00 │ 2024 06 28 08:30:00 │ LONG         │ 0.39%  │ 28.09%  │ 1.45       │ rsiDivergency5m │
// │ 1150 │ GASUSDT      │ 2024 06 28 17:25:00 │ 2024 06 29 01:45:00 │ LONG         │ 0.28%  │ 28.37%  │ 3.71       │ rsiDivergency5m │
// │ 1151 │ BONDUSDT     │ 2024 06 29 13:05:00 │ 2024 06 29 14:30:00 │ LONG         │ -0.55% │ 27.82%  │ 2.27       │ rsiDivergency5m │
// │ 1152 │ BONDUSDT     │ 2024 06 29 15:50:00 │ 2024 06 29 17:15:00 │ LONG         │ -0.55% │ 27.27%  │ 2.21       │ rsiDivergency5m │
// │ 1153 │ ARPAUSDT     │ 2024 06 29 19:15:00 │ 2024 06 29 20:00:00 │ LONG         │ -0.55% │ 26.72%  │ 0.04       │ rsiDivergency5m │
// │ 1154 │ ARPAUSDT     │ 2024 06 29 20:05:00 │ 2024 06 30 03:05:00 │ LONG         │ 2.45%  │ 29.17%  │ 0.04       │ rsiDivergency5m │
// │ 1155 │ NTRNUSDT     │ 2024 06 30 06:35:00 │ 2024 06 30 08:00:00 │ LONG         │ -0.55% │ 28.62%  │ 0.48       │ rsiDivergency5m │
// │ 1156 │ NTRNUSDT     │ 2024 06 30 08:20:00 │ 2024 06 30 12:00:00 │ LONG         │ -0.55% │ 28.07%  │ 0.47       │ rsiDivergency5m │
// │ 1157 │ NTRNUSDT     │ 2024 06 30 12:05:00 │ 2024 06 30 16:10:00 │ LONG         │ -0.55% │ 27.52%  │ 0.46       │ rsiDivergency5m │
// │ 1158 │ ENSUSDT      │ 2024 06 30 17:40:00 │ 2024 06 30 18:20:00 │ SHORT        │ -0.55% │ 26.97%  │ 30.22      │ rsiDivergency5m │
// │ 1159 │ ENSUSDT      │ 2024 06 30 18:30:00 │ 2024 06 30 19:00:00 │ SHORT        │ -0.55% │ 26.42%  │ 30.62      │ rsiDivergency5m │
// │ 1160 │ ENSUSDT      │ 2024 06 30 19:05:00 │ 2024 06 30 19:15:00 │ SHORT        │ -0.55% │ 25.87%  │ 30.70      │ rsiDivergency5m │
// │ 1161 │ VANRYUSDT    │ 2024 06 30 20:25:00 │ 2024 06 30 20:40:00 │ SHORT        │ -0.55% │ 25.32%  │ 0.14       │ rsiDivergency5m │
// │ 1162 │ VANRYUSDT    │ 2024 06 30 20:45:00 │ 2024 06 30 20:55:00 │ SHORT        │ -0.55% │ 24.77%  │ 0.14       │ rsiDivergency5m │
// │ 1163 │ TRUUSDT      │ 2024 06 30 21:00:00 │ 2024 07 01 05:20:00 │ SHORT        │ 0.60%  │ 25.36%  │ 0.13       │ rsiDivergency5m │
// │ 1164 │ IOUSDT       │ 2024 07 01 06:25:00 │ 2024 07 01 08:10:00 │ LONG         │ -0.55% │ 24.81%  │ 3.12       │ rsiDivergency5m │
// │ 1165 │ PORTALUSDT   │ 2024 07 01 10:25:00 │ 2024 07 01 18:45:00 │ LONG         │ 0.17%  │ 24.98%  │ 0.44       │ rsiDivergency5m │
// │ 1166 │ FETUSDT      │ 2024 07 01 18:50:00 │ 2024 07 01 19:35:00 │ LONG         │ -0.55% │ 24.43%  │ 1.29       │ rsiDivergency5m │
// │ 1167 │ ETHFIUSDT    │ 2024 07 01 21:05:00 │ 2024 07 01 22:15:00 │ LONG         │ -0.55% │ 23.88%  │ 2.78       │ rsiDivergency5m │
// │ 1168 │ ETHFIUSDT    │ 2024 07 01 22:20:00 │ 2024 07 02 06:40:00 │ LONG         │ -0.07% │ 23.81%  │ 2.73       │ rsiDivergency5m │
// │ 1169 │ REZUSDT      │ 2024 07 02 06:55:00 │ 2024 07 02 15:15:00 │ LONG         │ 1.51%  │ 25.32%  │ 0.08       │ rsiDivergency5m │
// │ 1170 │ TAOUSDT      │ 2024 07 02 16:05:00 │ 2024 07 02 19:40:00 │ LONG         │ -0.55% │ 24.77%  │ 240.00     │ rsiDivergency5m │
// │ 1171 │ WLDUSDT      │ 2024 07 02 21:05:00 │ 2024 07 02 22:10:00 │ LONG         │ -0.55% │ 24.22%  │ 2.21       │ rsiDivergency5m │
// │ 1172 │ WLDUSDT      │ 2024 07 02 22:15:00 │ 2024 07 03 05:40:00 │ LONG         │ 2.45%  │ 26.67%  │ 2.17       │ rsiDivergency5m │
// │ 1173 │ INJUSDT      │ 2024 07 03 06:35:00 │ 2024 07 03 08:05:00 │ LONG         │ -0.55% │ 26.12%  │ 21.48      │ rsiDivergency5m │
// │ 1174 │ WLDUSDT      │ 2024 07 03 08:45:00 │ 2024 07 03 08:50:00 │ SHORT        │ -0.55% │ 25.57%  │ 2.50       │ rsiDivergency5m │
// │ 1175 │ MYROUSDT     │ 2024 07 03 10:05:00 │ 2024 07 03 13:45:00 │ LONG         │ -0.55% │ 25.02%  │ 0.12       │ rsiDivergency5m │
// │ 1176 │ 1000BONKUSDT │ 2024 07 03 14:10:00 │ 2024 07 03 22:30:00 │ LONG         │ 0.55%  │ 25.57%  │ 0.02       │ rsiDivergency5m │
// │ 1177 │ WLDUSDT      │ 2024 07 03 23:40:00 │ 2024 07 04 00:30:00 │ SHORT        │ -0.55% │ 25.02%  │ 2.33       │ rsiDivergency5m │
// │ 1178 │ MINAUSDT     │ 2024 07 04 01:55:00 │ 2024 07 04 03:40:00 │ LONG         │ -0.55% │ 24.47%  │ 0.48       │ rsiDivergency5m │
// │ 1179 │ ROSEUSDT     │ 2024 07 04 05:20:00 │ 2024 07 04 08:00:00 │ LONG         │ -0.55% │ 23.92%  │ 0.09       │ rsiDivergency5m │
// │ 1180 │ LRCUSDT      │ 2024 07 04 08:05:00 │ 2024 07 04 16:25:00 │ LONG         │ 0.26%  │ 24.18%  │ 0.15       │ rsiDivergency5m │
// │ 1181 │ FRONTUSDT    │ 2024 07 04 17:00:00 │ 2024 07 04 21:55:00 │ SHORT        │ 2.45%  │ 26.63%  │ 0.82       │ rsiDivergency5m │
// │ 1182 │ UMAUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.55% │ 26.08%  │ 1.76       │ rsiDivergency5m │
// │ 1183 │ LSKUSDT      │ 2024 07 04 22:10:00 │ 2024 07 05 06:30:00 │ LONG         │ 1.75%  │ 27.83%  │ 0.74       │ rsiDivergency5m │
// │ 1184 │ BONDUSDT     │ 2024 07 05 06:35:00 │ 2024 07 05 07:05:00 │ SHORT        │ -0.55% │ 27.28%  │ 2.12       │ rsiDivergency5m │
// │ 1185 │ TUSDT        │ 2024 07 05 07:25:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.55% │ 26.73%  │ 0.02       │ rsiDivergency5m │
// │ 1186 │ 1000BONKUSDT │ 2024 07 05 10:10:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.55% │ 26.18%  │ 0.02       │ rsiDivergency5m │
// │ 1187 │ KAVAUSDT     │ 2024 07 05 14:30:00 │ 2024 07 05 19:35:00 │ SHORT        │ -0.55% │ 25.63%  │ 0.36       │ rsiDivergency5m │
// │ 1188 │ SKLUSDT      │ 2024 07 05 19:45:00 │ 2024 07 06 04:05:00 │ SHORT        │ 0.83%  │ 26.46%  │ 0.04       │ rsiDivergency5m │
// │ 1189 │ HIGHUSDT     │ 2024 07 06 11:25:00 │ 2024 07 06 14:15:00 │ SHORT        │ -0.55% │ 25.91%  │ 1.54       │ rsiDivergency5m │
// │ 1190 │ REZUSDT      │ 2024 07 06 14:50:00 │ 2024 07 06 16:00:00 │ SHORT        │ -0.55% │ 25.36%  │ 0.06       │ rsiDivergency5m │
// │ 1191 │ REZUSDT      │ 2024 07 06 16:05:00 │ 2024 07 07 00:25:00 │ SHORT        │ 0.37%  │ 25.73%  │ 0.06       │ rsiDivergency5m │
// │ 1192 │ SAGAUSDT     │ 2024 07 07 03:20:00 │ 2024 07 07 03:45:00 │ SHORT        │ -0.55% │ 25.18%  │ 1.17       │ rsiDivergency5m │
// │ 1193 │ SAGAUSDT     │ 2024 07 07 03:55:00 │ 2024 07 07 04:55:00 │ SHORT        │ -0.55% │ 24.63%  │ 1.20       │ rsiDivergency5m │
// │ 1194 │ PORTALUSDT   │ 2024 07 07 05:05:00 │ 2024 07 07 05:30:00 │ SHORT        │ -0.55% │ 24.08%  │ 0.37       │ rsiDivergency5m │
// │ 1195 │ SAGAUSDT     │ 2024 07 07 07:10:00 │ 2024 07 07 07:20:00 │ SHORT        │ -0.55% │ 23.53%  │ 1.32       │ rsiDivergency5m │
// │ 1196 │ 1000SHIBUSDT │ 2024 07 07 08:40:00 │ 2024 07 07 17:00:00 │ LONG         │ 0.01%  │ 23.54%  │ 0.02       │ rsiDivergency5m │
// │ 1197 │ REZUSDT      │ 2024 07 07 18:00:00 │ 2024 07 07 19:35:00 │ LONG         │ -0.55% │ 22.99%  │ 0.06       │ rsiDivergency5m │
// │ 1198 │ ARBUSDT      │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.55% │ 22.44%  │ 0.62       │ rsiDivergency5m │
// │ 1199 │ ARBUSDT      │ 2024 07 07 20:15:00 │ 2024 07 08 03:50:00 │ LONG         │ 2.45%  │ 24.89%  │ 0.61       │ rsiDivergency5m │
// │ 1200 │ ACEUSDT      │ 2024 07 08 03:55:00 │ 2024 07 08 04:30:00 │ SHORT        │ -0.55% │ 24.34%  │ 2.91       │ rsiDivergency5m │
// │ 1201 │ BIGTIMEUSDT  │ 2024 07 08 04:35:00 │ 2024 07 08 12:55:00 │ SHORT        │ 0.95%  │ 25.29%  │ 0.10       │ rsiDivergency5m │
// │ 1202 │ TAOUSDT      │ 2024 07 09 06:00:00 │ 2024 07 09 09:05:00 │ SHORT        │ -0.55% │ 24.74%  │ 251.82     │ rsiDivergency5m │
// │ 1203 │ STGUSDT      │ 2024 07 09 12:00:00 │ 2024 07 09 13:30:00 │ SHORT        │ -0.55% │ 24.19%  │ 0.37       │ rsiDivergency5m │
// │ 1204 │ 1000SATSUSDT │ 2024 07 09 20:35:00 │ 2024 07 09 23:05:00 │ SHORT        │ -0.55% │ 23.64%  │ 0.00       │ rsiDivergency5m │
// │ 1205 │ WLDUSDT      │ 2024 07 10 09:55:00 │ 2024 07 10 10:40:00 │ SHORT        │ -0.55% │ 23.09%  │ 2.01       │ rsiDivergency5m │
// │ 1206 │ ETHFIUSDT    │ 2024 07 10 11:20:00 │ 2024 07 10 19:40:00 │ SHORT        │ 1.46%  │ 24.55%  │ 2.36       │ rsiDivergency5m │
// │ 1207 │ 1000SATSUSDT │ 2024 07 10 21:00:00 │ 2024 07 10 21:10:00 │ SHORT        │ -0.55% │ 24.00%  │ 0.00       │ rsiDivergency5m │
// │ 1208 │ STXUSDT      │ 2024 07 11 03:00:00 │ 2024 07 11 06:50:00 │ SHORT        │ -0.55% │ 23.45%  │ 1.65       │ rsiDivergency5m │
// │ 1209 │ 1000BONKUSDT │ 2024 07 11 13:10:00 │ 2024 07 11 15:10:00 │ LONG         │ -0.55% │ 22.90%  │ 0.02       │ rsiDivergency5m │
// │ 1210 │ TNSRUSDT     │ 2024 07 11 16:25:00 │ 2024 07 12 00:45:00 │ LONG         │ 1.47%  │ 24.37%  │ 0.42       │ rsiDivergency5m │
// │ 1211 │ 1000SATSUSDT │ 2024 07 12 02:20:00 │ 2024 07 12 03:30:00 │ SHORT        │ -0.55% │ 23.82%  │ 0.00       │ rsiDivergency5m │
// │ 1212 │ 1000SATSUSDT │ 2024 07 12 03:45:00 │ 2024 07 12 12:05:00 │ SHORT        │ 0.60%  │ 24.42%  │ 0.00       │ rsiDivergency5m │
// │ 1213 │ IOUSDT       │ 2024 07 12 12:15:00 │ 2024 07 12 20:35:00 │ SHORT        │ 1.48%  │ 25.90%  │ 2.67       │ rsiDivergency5m │
// │ 1214 │ SAGAUSDT     │ 2024 07 12 23:15:00 │ 2024 07 13 07:35:00 │ SHORT        │ 1.28%  │ 27.18%  │ 1.39       │ rsiDivergency5m │
// │ 1215 │ TRUUSDT      │ 2024 07 13 08:40:00 │ 2024 07 13 17:00:00 │ LONG         │ 0.12%  │ 27.30%  │ 0.12       │ rsiDivergency5m │
// │ 1216 │ FLMUSDT      │ 2024 07 13 19:25:00 │ 2024 07 13 19:45:00 │ SHORT        │ -0.55% │ 26.75%  │ 0.08       │ rsiDivergency5m │
// │ 1217 │ FLMUSDT      │ 2024 07 13 19:55:00 │ 2024 07 13 20:35:00 │ SHORT        │ -0.55% │ 26.20%  │ 0.08       │ rsiDivergency5m │
// │ 1218 │ FLMUSDT      │ 2024 07 13 20:45:00 │ 2024 07 13 21:00:00 │ SHORT        │ -0.55% │ 25.65%  │ 0.08       │ rsiDivergency5m │
// │ 1219 │ FLMUSDT      │ 2024 07 13 21:10:00 │ 2024 07 13 22:05:00 │ SHORT        │ -0.55% │ 25.10%  │ 0.08       │ rsiDivergency5m │
// │ 1220 │ FLMUSDT      │ 2024 07 13 22:15:00 │ 2024 07 13 22:25:00 │ SHORT        │ -0.55% │ 24.55%  │ 0.08       │ rsiDivergency5m │
// │ 1221 │ CKBUSDT      │ 2024 07 14 03:05:00 │ 2024 07 14 11:25:00 │ SHORT        │ 1.61%  │ 26.16%  │ 0.01       │ rsiDivergency5m │
// │ 1222 │ BONDUSDT     │ 2024 07 14 12:00:00 │ 2024 07 14 20:20:00 │ SHORT        │ 0.41%  │ 26.57%  │ 2.02       │ rsiDivergency5m │
// │ 1223 │ STXUSDT      │ 2024 07 14 20:55:00 │ 2024 07 15 02:35:00 │ SHORT        │ -0.55% │ 26.02%  │ 1.86       │ rsiDivergency5m │
// │ 1224 │ 1000SATSUSDT │ 2024 07 15 09:35:00 │ 2024 07 15 10:00:00 │ SHORT        │ -0.55% │ 25.47%  │ 0.00       │ rsiDivergency5m │
// │ 1225 │ TRUUSDT      │ 2024 07 15 16:40:00 │ 2024 07 16 01:00:00 │ SHORT        │ 0.82%  │ 26.29%  │ 0.14       │ rsiDivergency5m │
// │ 1226 │ IOUSDT       │ 2024 07 16 02:45:00 │ 2024 07 16 03:35:00 │ LONG         │ -0.55% │ 25.74%  │ 2.47       │ rsiDivergency5m │
// │ 1227 │ BONDUSDT     │ 2024 07 16 03:50:00 │ 2024 07 16 04:25:00 │ LONG         │ -0.55% │ 25.19%  │ 1.99       │ rsiDivergency5m │
// │ 1228 │ IOUSDT       │ 2024 07 16 07:30:00 │ 2024 07 16 09:25:00 │ SHORT        │ -0.55% │ 24.64%  │ 2.53       │ rsiDivergency5m │
// │ 1229 │ 1000SATSUSDT │ 2024 07 16 10:20:00 │ 2024 07 16 10:30:00 │ SHORT        │ -0.55% │ 24.09%  │ 0.00       │ rsiDivergency5m │
// │ 1230 │ CKBUSDT      │ 2024 07 16 10:40:00 │ 2024 07 16 11:00:00 │ SHORT        │ -0.55% │ 23.54%  │ 0.01       │ rsiDivergency5m │
// │ 1231 │ FRONTUSDT    │ 2024 07 16 11:20:00 │ 2024 07 16 12:25:00 │ SHORT        │ -0.55% │ 22.99%  │ 0.95       │ rsiDivergency5m │
// └──────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴─────────┴────────────┴─────────────────┘
