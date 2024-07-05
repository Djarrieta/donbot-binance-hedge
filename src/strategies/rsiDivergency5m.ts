import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"ZECUSDT",
	"KNCUSDT",
	"KAVAUSDT",
	"MKRUSDT",
	"RUNEUSDT",
	"SUSHIUSDT",
	"RSRUSDT",
	"AXSUSDT",
	"SKLUSDT",
	"MANAUSDT",
	"ALICEUSDT",
	"MTLUSDT",
	"OGNUSDT",
	"1000XECUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"LPTUSDT",
	"FLOWUSDT",
	"OPUSDT",
	"LDOUSDT",
	"FXSUSDT",
	"TUSDT",
	"PHBUSDT",
	"STXUSDT",
	"LQTYUSDT",
	"RDNTUSDT",
	"XVSUSDT",
	"1000PEPEUSDT",
	"1000FLOKIUSDT",
	"UMAUSDT",
	"HIFIUSDT",
	"BONDUSDT",
	"WAXPUSDT",
	"POLYXUSDT",
	"CAKEUSDT",
	"TWTUSDT",
	"SUPERUSDT",
	"ONGUSDT",
	"1000RATSUSDT",
	"XAIUSDT",
	"LSKUSDT",
	"JUPUSDT",
	"ZETAUSDT",
	"RONINUSDT",
	"STRKUSDT",
	"MAVIAUSDT",
	"AXLUSDT",
	"AEVOUSDT",
	"BOMEUSDT",
	"ENAUSDT",
	"WUSDT",
	"TAOUSDT",
	"OMNIUSDT",
	"REZUSDT",
	"BBUSDT",
	"IOUSDT",
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

// ┌─────────────────┬────────┐
// │                 │ Values │
// ├─────────────────┼────────┤
// │              tp │ 10.00% │
// │              sl │ 1.00%  │
// │  maxTradeLength │ 100    │
// │ amountToTradePt │ 25.00% │
// └─────────────────┴────────┘

// Snapshot data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼────────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 1181      │ 0.03% │ 22.69%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬─────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ minDrawdown │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼─────────────┼─────────┼───────────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 374       │ 33.82%    │ -3.41%    │ 28.44% │ -7.08%      │ 22.46%  │ 31.91         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴─────────────┴─────────┴───────────────┘

// ┌─────┬───────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬────────┬────────────┬─────────────────┐
// │     │ pair          │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl │ entryPrice │ stgName         │
// ├─────┼───────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼────────┼────────────┼─────────────────┤
// │   0 │ ENAUSDT       │ 2024 04 08 08:20:00 │ 2024 04 08 08:30:00 │ SHORT        │ -0.26% │ 1.28%  │ 1.31       │ rsiDivergency5m │
// │   1 │ OGNUSDT       │ 2024 04 09 03:10:00 │ 2024 04 09 09:35:00 │ LONG         │ -0.26% │ 0.75%  │ 0.23       │ rsiDivergency5m │
// │   2 │ 1000FLOKIUSDT │ 2024 04 09 10:10:00 │ 2024 04 09 12:10:00 │ LONG         │ -0.26% │ 0.49%  │ 0.20       │ rsiDivergency5m │
// │   3 │ AXLUSDT       │ 2024 04 10 22:15:00 │ 2024 04 10 22:35:00 │ SHORT        │ -0.26% │ 1.02%  │ 1.44       │ rsiDivergency5m │
// │   4 │ AXLUSDT       │ 2024 04 10 22:45:00 │ 2024 04 11 07:05:00 │ SHORT        │ 1.68%  │ 2.70%  │ 1.46       │ rsiDivergency5m │
// │   5 │ ONGUSDT       │ 2024 04 11 10:55:00 │ 2024 04 11 11:00:00 │ SHORT        │ -0.26% │ 2.44%  │ 0.52       │ rsiDivergency5m │
// │   6 │ 1000PEPEUSDT  │ 2024 04 11 12:15:00 │ 2024 04 11 15:40:00 │ SHORT        │ -0.26% │ 2.17%  │ 0.01       │ rsiDivergency5m │
// │   7 │ AEVOUSDT      │ 2024 04 12 08:10:00 │ 2024 04 12 08:20:00 │ LONG         │ -0.26% │ 1.39%  │ 2.20       │ rsiDivergency5m │
// │   8 │ 1000RATSUSDT  │ 2024 04 12 08:45:00 │ 2024 04 12 11:15:00 │ LONG         │ -0.26% │ 1.12%  │ 0.24       │ rsiDivergency5m │
// │   9 │ XAIUSDT       │ 2024 04 12 11:20:00 │ 2024 04 12 12:05:00 │ LONG         │ -0.26% │ 0.86%  │ 0.93       │ rsiDivergency5m │
// │  10 │ ALICEUSDT     │ 2024 04 12 12:05:00 │ 2024 04 12 12:20:00 │ LONG         │ -0.26% │ 0.34%  │ 1.65       │ rsiDivergency5m │
// │  11 │ WAXPUSDT      │ 2024 04 12 12:05:00 │ 2024 04 12 12:20:00 │ LONG         │ -0.26% │ 0.60%  │ 0.08       │ rsiDivergency5m │
// │  12 │ ZECUSDT       │ 2024 04 12 13:05:00 │ 2024 04 12 13:20:00 │ LONG         │ -0.26% │ -0.45% │ 24.93      │ rsiDivergency5m │
// │  13 │ LQTYUSDT      │ 2024 04 12 13:20:00 │ 2024 04 12 13:25:00 │ LONG         │ -0.26% │ -0.19% │ 1.28       │ rsiDivergency5m │
// │  14 │ AXLUSDT       │ 2024 04 12 13:25:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.26% │ 0.07%  │ 1.16       │ rsiDivergency5m │
// │  15 │ XVSUSDT       │ 2024 04 12 15:55:00 │ 2024 04 12 17:40:00 │ LONG         │ -0.26% │ -0.71% │ 13.46      │ rsiDivergency5m │
// │  16 │ CAKEUSDT      │ 2024 04 13 03:30:00 │ 2024 04 13 07:35:00 │ SHORT        │ -0.26% │ 0.01%  │ 3.26       │ rsiDivergency5m │
// │  17 │ ARPAUSDT      │ 2024 04 13 07:50:00 │ 2024 04 13 08:05:00 │ SHORT        │ -0.26% │ -0.25% │ 0.09       │ rsiDivergency5m │
// │  18 │ ARPAUSDT      │ 2024 04 13 08:10:00 │ 2024 04 13 12:15:00 │ SHORT        │ 2.49%  │ 2.24%  │ 0.09       │ rsiDivergency5m │
// │  19 │ OPUSDT        │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.26% │ 1.71%  │ 2.07       │ rsiDivergency5m │
// │  20 │ STRKUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.26% │ 1.98%  │ 1.28       │ rsiDivergency5m │
// │  21 │ RONINUSDT     │ 2024 04 14 02:00:00 │ 2024 04 14 03:15:00 │ SHORT        │ -0.26% │ 2.01%  │ 3.10       │ rsiDivergency5m │
// │  22 │ RONINUSDT     │ 2024 04 14 03:40:00 │ 2024 04 14 08:05:00 │ SHORT        │ -0.26% │ 1.74%  │ 3.15       │ rsiDivergency5m │
// │  23 │ STRKUSDT      │ 2024 04 14 09:05:00 │ 2024 04 14 12:15:00 │ LONG         │ -0.26% │ 1.48%  │ 1.40       │ rsiDivergency5m │
// │  24 │ TAOUSDT       │ 2024 04 14 22:35:00 │ 2024 04 15 06:55:00 │ LONG         │ 0.68%  │ 1.54%  │ 554.90     │ rsiDivergency5m │
// │  25 │ 1000XECUSDT   │ 2024 04 15 00:55:00 │ 2024 04 15 01:15:00 │ SHORT        │ -0.26% │ 1.95%  │ 0.06       │ rsiDivergency5m │
// │  26 │ AXLUSDT       │ 2024 04 15 02:20:00 │ 2024 04 15 05:45:00 │ SHORT        │ -0.26% │ 1.68%  │ 1.15       │ rsiDivergency5m │
// │  27 │ STRKUSDT      │ 2024 04 15 09:30:00 │ 2024 04 15 09:35:00 │ LONG         │ -0.26% │ 1.42%  │ 1.38       │ rsiDivergency5m │
// │  28 │ AEVOUSDT      │ 2024 04 15 12:45:00 │ 2024 04 15 13:15:00 │ LONG         │ -0.26% │ 1.16%  │ 1.62       │ rsiDivergency5m │
// │  29 │ LPTUSDT       │ 2024 04 15 12:45:00 │ 2024 04 15 13:15:00 │ LONG         │ -0.26% │ 0.90%  │ 11.83      │ rsiDivergency5m │
// │  30 │ SUPERUSDT     │ 2024 04 15 13:50:00 │ 2024 04 15 14:00:00 │ LONG         │ -0.26% │ 0.63%  │ 0.95       │ rsiDivergency5m │
// │  31 │ WUSDT         │ 2024 04 15 18:30:00 │ 2024 04 15 18:50:00 │ SHORT        │ -0.26% │ 0.37%  │ 0.65       │ rsiDivergency5m │
// │  32 │ SUSHIUSDT     │ 2024 04 16 02:05:00 │ 2024 04 16 02:30:00 │ SHORT        │ -0.26% │ -0.15% │ 0.97       │ rsiDivergency5m │
// │  33 │ ENAUSDT       │ 2024 04 16 10:40:00 │ 2024 04 16 16:25:00 │ LONG         │ 2.49%  │ 2.33%  │ 0.90       │ rsiDivergency5m │
// │  34 │ AXLUSDT       │ 2024 04 16 23:55:00 │ 2024 04 17 00:15:00 │ SHORT        │ -0.26% │ 1.81%  │ 1.15       │ rsiDivergency5m │
// │  35 │ TAOUSDT       │ 2024 04 17 07:15:00 │ 2024 04 17 08:05:00 │ LONG         │ -0.26% │ -0.04% │ 463.00     │ rsiDivergency5m │
// │  36 │ 1000RATSUSDT  │ 2024 04 17 13:45:00 │ 2024 04 17 22:05:00 │ SHORT        │ 0.43%  │ 1.71%  │ 0.13       │ rsiDivergency5m │
// │  37 │ XVSUSDT       │ 2024 04 17 23:05:00 │ 2024 04 17 23:10:00 │ SHORT        │ -0.26% │ 1.45%  │ 10.12      │ rsiDivergency5m │
// │  38 │ ENAUSDT       │ 2024 04 18 02:05:00 │ 2024 04 18 02:30:00 │ LONG         │ -0.26% │ 1.19%  │ 0.85       │ rsiDivergency5m │
// │  39 │ ENAUSDT       │ 2024 04 18 02:40:00 │ 2024 04 18 06:20:00 │ LONG         │ 2.49%  │ 3.67%  │ 0.83       │ rsiDivergency5m │
// │  40 │ ONGUSDT       │ 2024 04 18 08:10:00 │ 2024 04 18 08:20:00 │ SHORT        │ -0.26% │ 3.41%  │ 0.55       │ rsiDivergency5m │
// │  41 │ ONGUSDT       │ 2024 04 18 08:30:00 │ 2024 04 18 09:25:00 │ SHORT        │ -0.26% │ 3.15%  │ 0.55       │ rsiDivergency5m │
// │  42 │ 1000PEPEUSDT  │ 2024 04 18 09:20:00 │ 2024 04 18 17:40:00 │ SHORT        │ 0.52%  │ 3.66%  │ 0.01       │ rsiDivergency5m │
// │  43 │ 1000RATSUSDT  │ 2024 04 18 19:25:00 │ 2024 04 18 20:00:00 │ LONG         │ -0.26% │ 3.40%  │ 0.13       │ rsiDivergency5m │
// │  44 │ JUPUSDT       │ 2024 04 18 21:10:00 │ 2024 04 18 21:20:00 │ LONG         │ -0.26% │ 3.14%  │ 0.95       │ rsiDivergency5m │
// │  45 │ TAOUSDT       │ 2024 04 18 21:20:00 │ 2024 04 18 21:25:00 │ LONG         │ -0.26% │ 1.91%  │ 434.73     │ rsiDivergency5m │
// │  46 │ ENAUSDT       │ 2024 04 18 21:30:00 │ 2024 04 18 21:40:00 │ LONG         │ -0.26% │ 2.88%  │ 0.83       │ rsiDivergency5m │
// │  47 │ TAOUSDT       │ 2024 04 18 21:30:00 │ 2024 04 18 21:45:00 │ LONG         │ -0.26% │ 1.65%  │ 431.64     │ rsiDivergency5m │
// │  48 │ JUPUSDT       │ 2024 04 18 21:40:00 │ 2024 04 18 21:45:00 │ LONG         │ -0.26% │ 2.61%  │ 0.94       │ rsiDivergency5m │
// │  49 │ OMNIUSDT      │ 2024 04 19 05:00:00 │ 2024 04 19 05:40:00 │ SHORT        │ -0.26% │ -0.26% │ 26.47      │ rsiDivergency5m │
// │  50 │ OMNIUSDT      │ 2024 04 19 05:50:00 │ 2024 04 19 14:10:00 │ SHORT        │ 1.65%  │ 1.39%  │ 27.07      │ rsiDivergency5m │
// │  51 │ TAOUSDT       │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.99%  │ 0.28%  │ 433.10     │ rsiDivergency5m │
// │  52 │ STXUSDT       │ 2024 04 20 11:00:00 │ 2024 04 20 11:25:00 │ SHORT        │ -0.26% │ 2.09%  │ 2.67       │ rsiDivergency5m │
// │  53 │ RSRUSDT       │ 2024 04 20 11:30:00 │ 2024 04 20 12:15:00 │ SHORT        │ -0.26% │ 1.83%  │ 0.01       │ rsiDivergency5m │
// │  54 │ RSRUSDT       │ 2024 04 20 12:25:00 │ 2024 04 20 12:35:00 │ SHORT        │ -0.26% │ 1.56%  │ 0.01       │ rsiDivergency5m │
// │  55 │ RSRUSDT       │ 2024 04 20 12:45:00 │ 2024 04 20 13:00:00 │ SHORT        │ -0.26% │ 1.30%  │ 0.01       │ rsiDivergency5m │
// │  56 │ OMNIUSDT      │ 2024 04 20 14:40:00 │ 2024 04 20 18:25:00 │ SHORT        │ -0.26% │ 1.01%  │ 28.76      │ rsiDivergency5m │
// │  57 │ ENAUSDT       │ 2024 04 20 15:10:00 │ 2024 04 20 23:30:00 │ SHORT        │ 0.50%  │ 1.81%  │ 1.11       │ rsiDivergency5m │
// │  58 │ TAOUSDT       │ 2024 04 20 15:10:00 │ 2024 04 20 23:30:00 │ SHORT        │ 0.55%  │ 2.27%  │ 489.80     │ rsiDivergency5m │
// │  59 │ ONGUSDT       │ 2024 04 21 06:55:00 │ 2024 04 21 07:00:00 │ SHORT        │ -0.26% │ 1.54%  │ 0.70       │ rsiDivergency5m │
// │  60 │ ONGUSDT       │ 2024 04 21 07:05:00 │ 2024 04 21 07:45:00 │ SHORT        │ -0.26% │ 1.28%  │ 0.71       │ rsiDivergency5m │
// │  61 │ ONGUSDT       │ 2024 04 21 07:50:00 │ 2024 04 21 07:55:00 │ SHORT        │ -0.26% │ 1.02%  │ 0.73       │ rsiDivergency5m │
// │  62 │ ONGUSDT       │ 2024 04 21 08:00:00 │ 2024 04 21 08:05:00 │ SHORT        │ -0.26% │ 0.76%  │ 0.76       │ rsiDivergency5m │
// │  63 │ ONGUSDT       │ 2024 04 21 08:10:00 │ 2024 04 21 09:30:00 │ SHORT        │ -0.26% │ 0.49%  │ 0.76       │ rsiDivergency5m │
// │  64 │ 1000PEPEUSDT  │ 2024 04 21 11:40:00 │ 2024 04 21 20:00:00 │ LONG         │ 1.58%  │ 2.07%  │ 0.01       │ rsiDivergency5m │
// │  65 │ 1000PEPEUSDT  │ 2024 04 21 23:30:00 │ 2024 04 21 23:55:00 │ SHORT        │ -0.26% │ 1.81%  │ 0.01       │ rsiDivergency5m │
// │  66 │ 1000PEPEUSDT  │ 2024 04 22 00:00:00 │ 2024 04 22 00:10:00 │ SHORT        │ -0.26% │ 1.55%  │ 0.01       │ rsiDivergency5m │
// │  67 │ MAVIAUSDT     │ 2024 04 22 04:50:00 │ 2024 04 22 04:55:00 │ SHORT        │ -0.26% │ 1.29%  │ 3.99       │ rsiDivergency5m │
// │  68 │ MAVIAUSDT     │ 2024 04 22 09:10:00 │ 2024 04 22 09:20:00 │ SHORT        │ -0.26% │ 1.02%  │ 4.19       │ rsiDivergency5m │
// │  69 │ MAVIAUSDT     │ 2024 04 22 09:25:00 │ 2024 04 22 11:15:00 │ SHORT        │ -0.26% │ 0.76%  │ 4.22       │ rsiDivergency5m │
// │  70 │ 1000RATSUSDT  │ 2024 04 22 11:45:00 │ 2024 04 22 11:50:00 │ LONG         │ -0.26% │ 0.50%  │ 0.17       │ rsiDivergency5m │
// │  71 │ 1000RATSUSDT  │ 2024 04 22 11:55:00 │ 2024 04 22 14:00:00 │ LONG         │ -0.26% │ 0.24%  │ 0.17       │ rsiDivergency5m │
// │  72 │ 1000RATSUSDT  │ 2024 04 22 14:40:00 │ 2024 04 22 23:00:00 │ LONG         │ 0.22%  │ 0.46%  │ 0.17       │ rsiDivergency5m │
// │  73 │ 1000FLOKIUSDT │ 2024 04 23 08:45:00 │ 2024 04 23 09:05:00 │ SHORT        │ -0.26% │ 0.19%  │ 0.18       │ rsiDivergency5m │
// │  74 │ 1000FLOKIUSDT │ 2024 04 23 09:15:00 │ 2024 04 23 09:20:00 │ SHORT        │ -0.26% │ -0.07% │ 0.19       │ rsiDivergency5m │
// │  75 │ 1000FLOKIUSDT │ 2024 04 23 10:10:00 │ 2024 04 23 10:30:00 │ SHORT        │ -0.26% │ -0.33% │ 0.20       │ rsiDivergency5m │
// │  76 │ BOMEUSDT      │ 2024 04 23 11:45:00 │ 2024 04 23 20:05:00 │ SHORT        │ 0.51%  │ 0.18%  │ 0.01       │ rsiDivergency5m │
// │  77 │ XAIUSDT       │ 2024 04 23 23:25:00 │ 2024 04 23 23:55:00 │ SHORT        │ -0.26% │ -0.08% │ 0.85       │ rsiDivergency5m │
// │  78 │ XAIUSDT       │ 2024 04 24 00:10:00 │ 2024 04 24 08:30:00 │ SHORT        │ 1.33%  │ 1.25%  │ 0.86       │ rsiDivergency5m │
// │  79 │ AEVOUSDT      │ 2024 04 24 10:35:00 │ 2024 04 24 11:25:00 │ LONG         │ -0.26% │ 0.98%  │ 1.54       │ rsiDivergency5m │
// │  80 │ TAOUSDT       │ 2024 04 24 11:15:00 │ 2024 04 24 11:25:00 │ LONG         │ -0.26% │ 1.28%  │ 457.42     │ rsiDivergency5m │
// │  81 │ WUSDT         │ 2024 04 25 08:30:00 │ 2024 04 25 08:40:00 │ SHORT        │ -0.26% │ 0.46%  │ 0.58       │ rsiDivergency5m │
// │  82 │ WUSDT         │ 2024 04 25 08:45:00 │ 2024 04 25 09:05:00 │ SHORT        │ -0.26% │ 0.20%  │ 0.59       │ rsiDivergency5m │
// │  83 │ WUSDT         │ 2024 04 25 09:25:00 │ 2024 04 25 09:35:00 │ SHORT        │ -0.26% │ -0.07% │ 0.61       │ rsiDivergency5m │
// │  84 │ WUSDT         │ 2024 04 25 09:40:00 │ 2024 04 25 10:30:00 │ SHORT        │ -0.26% │ -0.33% │ 0.62       │ rsiDivergency5m │
// │  85 │ WUSDT         │ 2024 04 25 10:50:00 │ 2024 04 25 11:00:00 │ SHORT        │ -0.26% │ -0.59% │ 0.65       │ rsiDivergency5m │
// │  86 │ WUSDT         │ 2024 04 25 11:10:00 │ 2024 04 25 11:30:00 │ SHORT        │ -0.26% │ -0.85% │ 0.64       │ rsiDivergency5m │
// │  87 │ WUSDT         │ 2024 04 25 12:00:00 │ 2024 04 25 12:05:00 │ SHORT        │ -0.26% │ -1.12% │ 0.66       │ rsiDivergency5m │
// │  88 │ LSKUSDT       │ 2024 04 25 13:40:00 │ 2024 04 25 13:45:00 │ SHORT        │ -0.26% │ -1.38% │ 2.07       │ rsiDivergency5m │
// │  89 │ LQTYUSDT      │ 2024 04 25 15:25:00 │ 2024 04 25 16:20:00 │ SHORT        │ -0.26% │ -1.64% │ 1.12       │ rsiDivergency5m │
// │  90 │ LSKUSDT       │ 2024 04 25 18:50:00 │ 2024 04 25 19:20:00 │ LONG         │ -0.26% │ -1.90% │ 1.90       │ rsiDivergency5m │
// │  91 │ LSKUSDT       │ 2024 04 25 19:40:00 │ 2024 04 25 20:05:00 │ LONG         │ -0.26% │ -2.17% │ 1.85       │ rsiDivergency5m │
// │  92 │ HIFIUSDT      │ 2024 04 25 20:05:00 │ 2024 04 26 04:25:00 │ LONG         │ 0.07%  │ -2.10% │ 0.79       │ rsiDivergency5m │
// │  93 │ MAVIAUSDT     │ 2024 04 26 17:25:00 │ 2024 04 26 19:00:00 │ LONG         │ -0.26% │ -2.36% │ 3.39       │ rsiDivergency5m │
// │  94 │ LSKUSDT       │ 2024 04 26 19:45:00 │ 2024 04 26 20:00:00 │ LONG         │ -0.26% │ -2.62% │ 1.68       │ rsiDivergency5m │
// │  95 │ 1000PEPEUSDT  │ 2024 04 26 20:05:00 │ 2024 04 26 20:10:00 │ LONG         │ -0.26% │ -2.89% │ 0.01       │ rsiDivergency5m │
// │  96 │ 1000PEPEUSDT  │ 2024 04 26 20:25:00 │ 2024 04 27 01:30:00 │ LONG         │ -0.26% │ -3.15% │ 0.01       │ rsiDivergency5m │
// │  97 │ OPUSDT        │ 2024 04 27 13:55:00 │ 2024 04 27 20:35:00 │ SHORT        │ -0.26% │ -3.41% │ 2.63       │ rsiDivergency5m │
// │  98 │ TUSDT         │ 2024 04 27 21:05:00 │ 2024 04 28 05:25:00 │ SHORT        │ 1.58%  │ -1.83% │ 0.04       │ rsiDivergency5m │
// │  99 │ MAVIAUSDT     │ 2024 04 28 14:05:00 │ 2024 04 28 15:50:00 │ SHORT        │ -0.26% │ -2.10% │ 4.18       │ rsiDivergency5m │
// │ 100 │ WUSDT         │ 2024 04 28 21:40:00 │ 2024 04 28 21:45:00 │ LONG         │ -0.26% │ -2.36% │ 0.61       │ rsiDivergency5m │
// │ 101 │ WUSDT         │ 2024 04 28 21:50:00 │ 2024 04 28 22:25:00 │ LONG         │ -0.26% │ -2.62% │ 0.60       │ rsiDivergency5m │
// │ 102 │ POLYXUSDT     │ 2024 04 28 22:35:00 │ 2024 04 28 23:00:00 │ LONG         │ -0.26% │ -2.88% │ 0.37       │ rsiDivergency5m │
// │ 103 │ MAVIAUSDT     │ 2024 04 29 01:40:00 │ 2024 04 29 10:00:00 │ LONG         │ 1.18%  │ -1.71% │ 3.65       │ rsiDivergency5m │
// │ 104 │ ENAUSDT       │ 2024 04 29 11:00:00 │ 2024 04 29 12:25:00 │ SHORT        │ -0.26% │ -1.97% │ 0.88       │ rsiDivergency5m │
// │ 105 │ ENAUSDT       │ 2024 04 29 18:10:00 │ 2024 04 30 02:30:00 │ SHORT        │ 1.27%  │ -0.70% │ 0.94       │ rsiDivergency5m │
// │ 106 │ WUSDT         │ 2024 04 30 04:35:00 │ 2024 04 30 05:00:00 │ LONG         │ -0.26% │ -0.96% │ 0.64       │ rsiDivergency5m │
// │ 107 │ LQTYUSDT      │ 2024 04 30 05:00:00 │ 2024 04 30 05:10:00 │ LONG         │ -0.26% │ -1.22% │ 1.03       │ rsiDivergency5m │
// │ 108 │ LQTYUSDT      │ 2024 04 30 05:15:00 │ 2024 04 30 05:30:00 │ LONG         │ -0.26% │ -1.49% │ 1.03       │ rsiDivergency5m │
// │ 109 │ LQTYUSDT      │ 2024 04 30 05:35:00 │ 2024 04 30 06:00:00 │ LONG         │ -0.26% │ -1.75% │ 1.02       │ rsiDivergency5m │
// │ 110 │ LQTYUSDT      │ 2024 04 30 06:10:00 │ 2024 04 30 06:40:00 │ LONG         │ -0.26% │ -2.01% │ 1.01       │ rsiDivergency5m │
// │ 111 │ 1000RATSUSDT  │ 2024 04 30 07:10:00 │ 2024 04 30 07:15:00 │ LONG         │ -0.26% │ -2.27% │ 0.12       │ rsiDivergency5m │
// │ 112 │ RDNTUSDT      │ 2024 04 30 07:10:00 │ 2024 04 30 08:00:00 │ LONG         │ -0.26% │ -2.54% │ 0.18       │ rsiDivergency5m │
// │ 113 │ JUPUSDT       │ 2024 04 30 08:55:00 │ 2024 04 30 11:10:00 │ LONG         │ -0.26% │ -2.80% │ 0.90       │ rsiDivergency5m │
// │ 114 │ WAXPUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 0.27%  │ -2.53% │ 0.06       │ rsiDivergency5m │
// │ 115 │ OMNIUSDT      │ 2024 05 01 02:35:00 │ 2024 05 01 03:20:00 │ LONG         │ -0.26% │ 2.35%  │ 16.95      │ rsiDivergency5m │
// │ 116 │ 1000PEPEUSDT  │ 2024 05 01 03:05:00 │ 2024 05 01 03:20:00 │ LONG         │ -0.26% │ -2.79% │ 0.01       │ rsiDivergency5m │
// │ 117 │ PHBUSDT       │ 2024 05 01 03:30:00 │ 2024 05 01 11:50:00 │ LONG         │ 0.72%  │ -2.07% │ 1.45       │ rsiDivergency5m │
// │ 118 │ POLYXUSDT     │ 2024 05 01 13:45:00 │ 2024 05 01 13:50:00 │ SHORT        │ -0.26% │ -2.33% │ 0.35       │ rsiDivergency5m │
// │ 119 │ POLYXUSDT     │ 2024 05 01 13:55:00 │ 2024 05 01 22:15:00 │ SHORT        │ 0.96%  │ -1.37% │ 0.35       │ rsiDivergency5m │
// │ 120 │ ONGUSDT       │ 2024 05 02 00:30:00 │ 2024 05 02 08:50:00 │ LONG         │ 0.11%  │ -1.25% │ 0.52       │ rsiDivergency5m │
// │ 121 │ JUPUSDT       │ 2024 05 02 10:30:00 │ 2024 05 02 17:15:00 │ SHORT        │ -0.26% │ -1.52% │ 1.02       │ rsiDivergency5m │
// │ 122 │ 1000PEPEUSDT  │ 2024 05 03 09:05:00 │ 2024 05 03 17:25:00 │ SHORT        │ 0.36%  │ -0.20% │ 0.01       │ rsiDivergency5m │
// │ 123 │ REZUSDT       │ 2024 05 03 13:15:00 │ 2024 05 03 13:30:00 │ SHORT        │ -0.26% │ 1.12%  │ 0.17       │ rsiDivergency5m │
// │ 124 │ REZUSDT       │ 2024 05 03 13:35:00 │ 2024 05 03 14:20:00 │ SHORT        │ -0.26% │ 0.86%  │ 0.17       │ rsiDivergency5m │
// │ 125 │ STXUSDT       │ 2024 05 03 18:20:00 │ 2024 05 03 18:25:00 │ SHORT        │ -0.26% │ -0.46% │ 2.36       │ rsiDivergency5m │
// │ 126 │ 1000FLOKIUSDT │ 2024 05 03 19:35:00 │ 2024 05 03 20:25:00 │ SHORT        │ -0.26% │ -0.72% │ 0.18       │ rsiDivergency5m │
// │ 127 │ 1000PEPEUSDT  │ 2024 05 03 22:30:00 │ 2024 05 03 22:40:00 │ SHORT        │ -0.26% │ -0.98% │ 0.01       │ rsiDivergency5m │
// │ 128 │ BOMEUSDT      │ 2024 05 03 23:05:00 │ 2024 05 03 23:40:00 │ SHORT        │ -0.26% │ -1.25% │ 0.01       │ rsiDivergency5m │
// │ 129 │ 1000PEPEUSDT  │ 2024 05 03 23:35:00 │ 2024 05 04 05:30:00 │ SHORT        │ -0.26% │ -1.51% │ 0.01       │ rsiDivergency5m │
// │ 130 │ WUSDT         │ 2024 05 04 22:30:00 │ 2024 05 05 05:15:00 │ LONG         │ -0.26% │ -1.77% │ 0.67       │ rsiDivergency5m │
// │ 131 │ LPTUSDT       │ 2024 05 05 05:25:00 │ 2024 05 05 11:50:00 │ SHORT        │ -0.26% │ -2.03% │ 15.21      │ rsiDivergency5m │
// │ 132 │ PHBUSDT       │ 2024 05 05 12:25:00 │ 2024 05 05 12:45:00 │ SHORT        │ -0.26% │ -2.30% │ 2.01       │ rsiDivergency5m │
// │ 133 │ RSRUSDT       │ 2024 05 05 12:30:00 │ 2024 05 05 12:35:00 │ SHORT        │ -0.26% │ -2.56% │ 0.01       │ rsiDivergency5m │
// │ 134 │ RSRUSDT       │ 2024 05 05 12:50:00 │ 2024 05 05 21:10:00 │ SHORT        │ 2.08%  │ -0.48% │ 0.01       │ rsiDivergency5m │
// │ 135 │ ZETAUSDT      │ 2024 05 06 09:25:00 │ 2024 05 06 10:00:00 │ LONG         │ -0.26% │ 1.48%  │ 1.71       │ rsiDivergency5m │
// │ 136 │ STXUSDT       │ 2024 05 06 12:35:00 │ 2024 05 06 20:55:00 │ LONG         │ 0.40%  │ 1.88%  │ 2.20       │ rsiDivergency5m │
// │ 137 │ BOMEUSDT      │ 2024 05 07 18:05:00 │ 2024 05 07 18:55:00 │ LONG         │ -0.26% │ 1.36%  │ 0.01       │ rsiDivergency5m │
// │ 138 │ BOMEUSDT      │ 2024 05 07 19:00:00 │ 2024 05 07 19:25:00 │ LONG         │ -0.26% │ 1.09%  │ 0.01       │ rsiDivergency5m │
// │ 139 │ BOMEUSDT      │ 2024 05 07 19:30:00 │ 2024 05 08 01:10:00 │ LONG         │ -0.26% │ 0.83%  │ 0.01       │ rsiDivergency5m │
// │ 140 │ ARPAUSDT      │ 2024 05 08 14:10:00 │ 2024 05 08 22:30:00 │ SHORT        │ 1.24%  │ 1.54%  │ 0.07       │ rsiDivergency5m │
// │ 141 │ SUSHIUSDT     │ 2024 05 09 23:25:00 │ 2024 05 10 01:25:00 │ SHORT        │ -0.26% │ 1.02%  │ 1.14       │ rsiDivergency5m │
// │ 142 │ UMAUSDT       │ 2024 05 10 07:15:00 │ 2024 05 10 11:00:00 │ SHORT        │ 2.49%  │ 3.51%  │ 3.91       │ rsiDivergency5m │
// │ 143 │ RUNEUSDT      │ 2024 05 10 11:05:00 │ 2024 05 10 17:25:00 │ LONG         │ -0.26% │ 3.24%  │ 6.01       │ rsiDivergency5m │
// │ 144 │ BOMEUSDT      │ 2024 05 12 21:35:00 │ 2024 05 12 21:45:00 │ LONG         │ -0.26% │ 6.27%  │ 0.01       │ rsiDivergency5m │
// │ 145 │ 1000RATSUSDT  │ 2024 05 12 21:45:00 │ 2024 05 12 21:50:00 │ LONG         │ -0.26% │ 6.01%  │ 0.11       │ rsiDivergency5m │
// │ 146 │ TAOUSDT       │ 2024 05 12 21:50:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.26% │ -0.75% │ 344.76     │ rsiDivergency5m │
// │ 147 │ 1000RATSUSDT  │ 2024 05 12 21:55:00 │ 2024 05 12 22:00:00 │ LONG         │ -0.26% │ 5.74%  │ 0.11       │ rsiDivergency5m │
// │ 148 │ BONDUSDT      │ 2024 05 12 21:55:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.26% │ 5.48%  │ 2.74       │ rsiDivergency5m │
// │ 149 │ TAOUSDT       │ 2024 05 12 22:15:00 │ 2024 05 13 04:35:00 │ LONG         │ 2.49%  │ 1.74%  │ 341.12     │ rsiDivergency5m │
// │ 150 │ PHBUSDT       │ 2024 05 12 23:50:00 │ 2024 05 13 03:05:00 │ LONG         │ 2.49%  │ 7.97%  │ 2.20       │ rsiDivergency5m │
// │ 151 │ BONDUSDT      │ 2024 05 13 03:50:00 │ 2024 05 13 04:20:00 │ SHORT        │ -0.26% │ 7.71%  │ 2.95       │ rsiDivergency5m │
// │ 152 │ BONDUSDT      │ 2024 05 13 04:30:00 │ 2024 05 13 12:50:00 │ SHORT        │ 0.94%  │ 8.65%  │ 2.99       │ rsiDivergency5m │
// │ 153 │ REZUSDT       │ 2024 05 13 10:05:00 │ 2024 05 13 13:20:00 │ LONG         │ -0.26% │ 1.55%  │ 0.12       │ rsiDivergency5m │
// │ 154 │ UMAUSDT       │ 2024 05 13 13:25:00 │ 2024 05 13 19:30:00 │ LONG         │ 2.49%  │ 11.13% │ 3.81       │ rsiDivergency5m │
// │ 155 │ SUPERUSDT     │ 2024 05 13 19:55:00 │ 2024 05 14 04:15:00 │ LONG         │ 0.17%  │ 11.30% │ 0.91       │ rsiDivergency5m │
// │ 156 │ UMAUSDT       │ 2024 05 14 08:55:00 │ 2024 05 14 09:10:00 │ LONG         │ -0.26% │ 11.04% │ 3.70       │ rsiDivergency5m │
// │ 157 │ BOMEUSDT      │ 2024 05 14 16:25:00 │ 2024 05 14 19:45:00 │ LONG         │ -0.26% │ 10.78% │ 0.01       │ rsiDivergency5m │
// │ 158 │ 1000FLOKIUSDT │ 2024 05 15 02:05:00 │ 2024 05 15 02:35:00 │ SHORT        │ -0.26% │ 10.51% │ 0.21       │ rsiDivergency5m │
// │ 159 │ LPTUSDT       │ 2024 05 15 05:20:00 │ 2024 05 15 05:50:00 │ SHORT        │ -0.26% │ 10.25% │ 18.24      │ rsiDivergency5m │
// │ 160 │ AXLUSDT       │ 2024 05 15 08:15:00 │ 2024 05 15 08:25:00 │ SHORT        │ -0.26% │ 9.99%  │ 1.02       │ rsiDivergency5m │
// │ 161 │ AXLUSDT       │ 2024 05 15 08:30:00 │ 2024 05 15 08:45:00 │ SHORT        │ -0.26% │ 9.73%  │ 1.03       │ rsiDivergency5m │
// │ 162 │ AXLUSDT       │ 2024 05 15 08:50:00 │ 2024 05 15 09:20:00 │ SHORT        │ -0.26% │ 9.46%  │ 1.04       │ rsiDivergency5m │
// │ 163 │ AXLUSDT       │ 2024 05 15 09:25:00 │ 2024 05 15 09:35:00 │ SHORT        │ -0.26% │ 9.20%  │ 1.05       │ rsiDivergency5m │
// │ 164 │ AXLUSDT       │ 2024 05 15 09:50:00 │ 2024 05 15 10:45:00 │ SHORT        │ -0.26% │ 8.94%  │ 1.06       │ rsiDivergency5m │
// │ 165 │ RUNEUSDT      │ 2024 05 15 10:05:00 │ 2024 05 15 11:10:00 │ SHORT        │ -0.26% │ 8.68%  │ 6.05       │ rsiDivergency5m │
// │ 166 │ POLYXUSDT     │ 2024 05 15 12:45:00 │ 2024 05 15 15:05:00 │ SHORT        │ -0.26% │ 8.41%  │ 0.39       │ rsiDivergency5m │
// │ 167 │ SUSHIUSDT     │ 2024 05 15 15:45:00 │ 2024 05 15 16:00:00 │ SHORT        │ -0.26% │ 8.15%  │ 1.12       │ rsiDivergency5m │
// │ 168 │ ZETAUSDT      │ 2024 05 16 01:35:00 │ 2024 05 16 02:10:00 │ SHORT        │ -0.26% │ 7.89%  │ 1.70       │ rsiDivergency5m │
// │ 169 │ RSRUSDT       │ 2024 05 16 02:40:00 │ 2024 05 16 11:00:00 │ SHORT        │ 1.26%  │ 9.15%  │ 0.01       │ rsiDivergency5m │
// │ 170 │ 1000FLOKIUSDT │ 2024 05 16 23:15:00 │ 2024 05 16 23:20:00 │ SHORT        │ -0.26% │ 8.63%  │ 0.22       │ rsiDivergency5m │
// │ 171 │ POLYXUSDT     │ 2024 05 17 02:55:00 │ 2024 05 17 03:00:00 │ SHORT        │ -0.26% │ 8.36%  │ 0.42       │ rsiDivergency5m │
// │ 172 │ POLYXUSDT     │ 2024 05 17 03:10:00 │ 2024 05 17 04:30:00 │ SHORT        │ -0.26% │ 8.10%  │ 0.42       │ rsiDivergency5m │
// │ 173 │ RSRUSDT       │ 2024 05 17 04:55:00 │ 2024 05 17 05:20:00 │ SHORT        │ -0.26% │ 7.84%  │ 0.01       │ rsiDivergency5m │
// │ 174 │ OPUSDT        │ 2024 05 17 08:00:00 │ 2024 05 17 16:20:00 │ SHORT        │ 0.06%  │ 7.90%  │ 2.58       │ rsiDivergency5m │
// │ 175 │ POLYXUSDT     │ 2024 05 17 23:40:00 │ 2024 05 17 23:50:00 │ SHORT        │ -0.26% │ 7.64%  │ 0.46       │ rsiDivergency5m │
// │ 176 │ BBUSDT        │ 2024 05 18 14:30:00 │ 2024 05 18 14:40:00 │ SHORT        │ -0.26% │ -0.30% │ 0.36       │ rsiDivergency5m │
// │ 177 │ BBUSDT        │ 2024 05 18 14:55:00 │ 2024 05 18 23:15:00 │ SHORT        │ 1.58%  │ 1.28%  │ 0.37       │ rsiDivergency5m │
// │ 178 │ STRKUSDT      │ 2024 05 19 11:35:00 │ 2024 05 19 11:45:00 │ LONG         │ -0.26% │ 5.80%  │ 1.05       │ rsiDivergency5m │
// │ 179 │ STRKUSDT      │ 2024 05 19 11:55:00 │ 2024 05 19 20:15:00 │ LONG         │ -0.15% │ 5.65%  │ 1.04       │ rsiDivergency5m │
// │ 180 │ BONDUSDT      │ 2024 05 20 12:30:00 │ 2024 05 20 14:25:00 │ SHORT        │ -0.26% │ 7.45%  │ 3.13       │ rsiDivergency5m │
// │ 181 │ SUPERUSDT     │ 2024 05 20 14:40:00 │ 2024 05 20 18:15:00 │ SHORT        │ -0.26% │ 7.19%  │ 1.13       │ rsiDivergency5m │
// │ 182 │ OMNIUSDT      │ 2024 05 20 15:35:00 │ 2024 05 20 15:50:00 │ SHORT        │ -0.26% │ 0.57%  │ 15.35      │ rsiDivergency5m │
// │ 183 │ OMNIUSDT      │ 2024 05 20 15:55:00 │ 2024 05 20 16:35:00 │ SHORT        │ -0.26% │ 0.31%  │ 15.45      │ rsiDivergency5m │
// │ 184 │ STRKUSDT      │ 2024 05 20 18:30:00 │ 2024 05 20 19:15:00 │ SHORT        │ -0.26% │ 6.93%  │ 1.21       │ rsiDivergency5m │
// │ 185 │ ENAUSDT       │ 2024 05 20 19:35:00 │ 2024 05 20 22:30:00 │ SHORT        │ -0.26% │ 6.67%  │ 0.87       │ rsiDivergency5m │
// │ 186 │ STXUSDT       │ 2024 05 21 05:35:00 │ 2024 05 21 13:55:00 │ SHORT        │ 0.88%  │ 7.54%  │ 2.27       │ rsiDivergency5m │
// │ 187 │ 1000FLOKIUSDT │ 2024 05 21 18:00:00 │ 2024 05 21 18:10:00 │ SHORT        │ -0.26% │ 7.28%  │ 0.23       │ rsiDivergency5m │
// │ 188 │ 1000PEPEUSDT  │ 2024 05 21 18:40:00 │ 2024 05 21 19:15:00 │ SHORT        │ -0.26% │ 7.02%  │ 0.01       │ rsiDivergency5m │
// │ 189 │ 1000PEPEUSDT  │ 2024 05 21 19:25:00 │ 2024 05 21 21:15:00 │ SHORT        │ -0.26% │ 6.75%  │ 0.01       │ rsiDivergency5m │
// │ 190 │ AEVOUSDT      │ 2024 05 22 00:05:00 │ 2024 05 22 06:50:00 │ LONG         │ -0.26% │ 6.49%  │ 0.88       │ rsiDivergency5m │
// │ 191 │ ENAUSDT       │ 2024 05 22 10:45:00 │ 2024 05 22 19:05:00 │ SHORT        │ 0.18%  │ 6.67%  │ 0.86       │ rsiDivergency5m │
// │ 192 │ 1000PEPEUSDT  │ 2024 05 23 02:50:00 │ 2024 05 23 11:10:00 │ SHORT        │ 1.35%  │ 8.02%  │ 0.01       │ rsiDivergency5m │
// │ 193 │ WUSDT         │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.64%  │ 9.66%  │ 0.53       │ rsiDivergency5m │
// │ 194 │ ZECUSDT       │ 2024 05 23 22:45:00 │ 2024 05 23 23:15:00 │ SHORT        │ -0.26% │ 9.40%  │ 26.80      │ rsiDivergency5m │
// │ 195 │ SUSHIUSDT     │ 2024 05 23 23:25:00 │ 2024 05 23 23:35:00 │ SHORT        │ -0.26% │ 9.14%  │ 1.23       │ rsiDivergency5m │
// │ 196 │ ZECUSDT       │ 2024 05 23 23:50:00 │ 2024 05 24 08:10:00 │ SHORT        │ 0.02%  │ 9.16%  │ 27.13      │ rsiDivergency5m │
// │ 197 │ BBUSDT        │ 2024 05 24 03:20:00 │ 2024 05 24 03:25:00 │ LONG         │ -0.26% │ 0.11%  │ 0.33       │ rsiDivergency5m │
// │ 198 │ OMNIUSDT      │ 2024 05 24 03:30:00 │ 2024 05 24 11:50:00 │ LONG         │ 1.46%  │ 6.53%  │ 14.72      │ rsiDivergency5m │
// │ 199 │ LDOUSDT       │ 2024 05 24 09:55:00 │ 2024 05 24 18:15:00 │ SHORT        │ 1.25%  │ 10.41% │ 2.48       │ rsiDivergency5m │
// │ 200 │ UMAUSDT       │ 2024 05 24 19:30:00 │ 2024 05 24 20:10:00 │ SHORT        │ -0.26% │ 10.15% │ 3.67       │ rsiDivergency5m │
// │ 201 │ LDOUSDT       │ 2024 05 24 21:55:00 │ 2024 05 24 22:15:00 │ SHORT        │ -0.26% │ 9.89%  │ 2.46       │ rsiDivergency5m │
// │ 202 │ LDOUSDT       │ 2024 05 24 23:10:00 │ 2024 05 25 00:20:00 │ SHORT        │ -0.26% │ 9.62%  │ 2.57       │ rsiDivergency5m │
// │ 203 │ BBUSDT        │ 2024 05 25 00:40:00 │ 2024 05 25 01:15:00 │ SHORT        │ -0.26% │ 2.07%  │ 0.41       │ rsiDivergency5m │
// │ 204 │ LDOUSDT       │ 2024 05 25 08:25:00 │ 2024 05 25 14:15:00 │ LONG         │ -0.26% │ 9.36%  │ 2.48       │ rsiDivergency5m │
// │ 205 │ LDOUSDT       │ 2024 05 26 06:15:00 │ 2024 05 26 14:35:00 │ SHORT        │ 0.43%  │ 9.80%  │ 2.69       │ rsiDivergency5m │
// │ 206 │ KNCUSDT       │ 2024 05 26 23:50:00 │ 2024 05 27 00:40:00 │ SHORT        │ -0.26% │ 9.53%  │ 0.71       │ rsiDivergency5m │
// │ 207 │ 1000FLOKIUSDT │ 2024 05 27 01:25:00 │ 2024 05 27 01:40:00 │ SHORT        │ -0.26% │ 9.27%  │ 0.25       │ rsiDivergency5m │
// │ 208 │ LPTUSDT       │ 2024 05 27 02:50:00 │ 2024 05 27 05:10:00 │ LONG         │ -0.26% │ 9.01%  │ 21.16      │ rsiDivergency5m │
// │ 209 │ 1000RATSUSDT  │ 2024 05 27 11:40:00 │ 2024 05 27 11:50:00 │ SHORT        │ -0.26% │ 8.75%  │ 0.16       │ rsiDivergency5m │
// │ 210 │ 1000RATSUSDT  │ 2024 05 27 12:15:00 │ 2024 05 27 20:35:00 │ SHORT        │ 0.32%  │ 9.07%  │ 0.16       │ rsiDivergency5m │
// │ 211 │ XAIUSDT       │ 2024 05 27 21:10:00 │ 2024 05 27 22:35:00 │ LONG         │ -0.26% │ 8.80%  │ 0.76       │ rsiDivergency5m │
// │ 212 │ BOMEUSDT      │ 2024 05 28 05:55:00 │ 2024 05 28 07:25:00 │ SHORT        │ -0.26% │ 8.54%  │ 0.01       │ rsiDivergency5m │
// │ 213 │ 1000FLOKIUSDT │ 2024 05 30 02:00:00 │ 2024 05 30 02:20:00 │ LONG         │ -0.26% │ 9.00%  │ 0.25       │ rsiDivergency5m │
// │ 214 │ 1000PEPEUSDT  │ 2024 05 30 02:55:00 │ 2024 05 30 09:05:00 │ LONG         │ 2.49%  │ 11.49% │ 0.01       │ rsiDivergency5m │
// │ 215 │ OMNIUSDT      │ 2024 05 31 07:35:00 │ 2024 05 31 07:45:00 │ SHORT        │ -0.26% │ 6.33%  │ 20.62      │ rsiDivergency5m │
// │ 216 │ OMNIUSDT      │ 2024 05 31 08:00:00 │ 2024 05 31 08:05:00 │ SHORT        │ -0.26% │ 6.06%  │ 21.18      │ rsiDivergency5m │
// │ 217 │ FXSUSDT       │ 2024 05 31 17:05:00 │ 2024 05 31 17:10:00 │ SHORT        │ -0.26% │ 10.96% │ 4.85       │ rsiDivergency5m │
// │ 218 │ FXSUSDT       │ 2024 05 31 17:15:00 │ 2024 06 01 01:35:00 │ SHORT        │ 1.50%  │ 12.46% │ 4.89       │ rsiDivergency5m │
// │ 219 │ REZUSDT       │ 2024 06 01 23:35:00 │ 2024 06 02 00:40:00 │ SHORT        │ -0.26% │ 1.62%  │ 0.16       │ rsiDivergency5m │
// │ 220 │ WUSDT         │ 2024 06 02 03:15:00 │ 2024 06 02 03:20:00 │ SHORT        │ -0.26% │ 12.20% │ 0.66       │ rsiDivergency5m │
// │ 221 │ 1000RATSUSDT  │ 2024 06 02 06:15:00 │ 2024 06 02 12:15:00 │ LONG         │ -0.26% │ 11.94% │ 0.15       │ rsiDivergency5m │
// │ 222 │ LPTUSDT       │ 2024 06 02 12:40:00 │ 2024 06 02 13:00:00 │ LONG         │ -0.26% │ 11.68% │ 21.66      │ rsiDivergency5m │
// │ 223 │ KLAYUSDT      │ 2024 06 02 20:05:00 │ 2024 06 02 20:25:00 │ SHORT        │ -0.26% │ 10.89% │ 0.24       │ rsiDivergency5m │
// │ 224 │ KLAYUSDT      │ 2024 06 02 20:35:00 │ 2024 06 02 20:45:00 │ SHORT        │ -0.26% │ 10.63% │ 0.25       │ rsiDivergency5m │
// │ 225 │ KLAYUSDT      │ 2024 06 02 20:50:00 │ 2024 06 02 21:15:00 │ SHORT        │ -0.26% │ 10.36% │ 0.25       │ rsiDivergency5m │
// │ 226 │ KLAYUSDT      │ 2024 06 02 21:40:00 │ 2024 06 03 02:55:00 │ SHORT        │ 2.49%  │ 12.85% │ 0.26       │ rsiDivergency5m │
// │ 227 │ 1000FLOKIUSDT │ 2024 06 03 03:40:00 │ 2024 06 03 03:45:00 │ SHORT        │ -0.26% │ 12.59% │ 0.28       │ rsiDivergency5m │
// │ 228 │ ENAUSDT       │ 2024 06 03 20:20:00 │ 2024 06 04 04:40:00 │ SHORT        │ 2.26%  │ 14.85% │ 1.06       │ rsiDivergency5m │
// │ 229 │ ALICEUSDT     │ 2024 06 04 08:00:00 │ 2024 06 04 16:20:00 │ LONG         │ 0.68%  │ 15.53% │ 2.12       │ rsiDivergency5m │
// │ 230 │ CAKEUSDT      │ 2024 06 04 19:35:00 │ 2024 06 04 19:45:00 │ SHORT        │ -0.26% │ 15.27% │ 3.01       │ rsiDivergency5m │
// │ 231 │ RSRUSDT       │ 2024 06 05 01:45:00 │ 2024 06 05 10:05:00 │ SHORT        │ 0.57%  │ 15.58% │ 0.01       │ rsiDivergency5m │
// │ 232 │ STXUSDT       │ 2024 06 05 12:05:00 │ 2024 06 05 12:35:00 │ SHORT        │ -0.26% │ 15.31% │ 2.39       │ rsiDivergency5m │
// │ 233 │ REZUSDT       │ 2024 06 05 22:05:00 │ 2024 06 06 06:25:00 │ SHORT        │ 2.09%  │ 5.33%  │ 0.18       │ rsiDivergency5m │
// │ 234 │ REZUSDT       │ 2024 06 06 09:45:00 │ 2024 06 06 10:30:00 │ SHORT        │ -0.26% │ 5.07%  │ 0.18       │ rsiDivergency5m │
// │ 235 │ WUSDT         │ 2024 06 06 16:15:00 │ 2024 06 06 17:35:00 │ SHORT        │ -0.26% │ 16.06% │ 0.69       │ rsiDivergency5m │
// │ 236 │ LQTYUSDT      │ 2024 06 06 20:35:00 │ 2024 06 07 04:55:00 │ LONG         │ 0.01%  │ 16.07% │ 1.24       │ rsiDivergency5m │
// │ 237 │ WUSDT         │ 2024 06 07 09:30:00 │ 2024 06 07 13:00:00 │ SHORT        │ 2.49%  │ 18.55% │ 0.74       │ rsiDivergency5m │
// │ 238 │ FXSUSDT       │ 2024 06 07 12:45:00 │ 2024 06 07 12:55:00 │ LONG         │ -0.26% │ 18.29% │ 4.94       │ rsiDivergency5m │
// │ 239 │ XVSUSDT       │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 1.98%  │ 20.27% │ 10.01      │ rsiDivergency5m │
// │ 240 │ KAVAUSDT      │ 2024 06 08 01:40:00 │ 2024 06 08 10:00:00 │ SHORT        │ 0.75%  │ 21.02% │ 0.66       │ rsiDivergency5m │
// │ 241 │ POLYXUSDT     │ 2024 06 08 22:15:00 │ 2024 06 09 06:35:00 │ LONG         │ 2.00%  │ 23.02% │ 0.42       │ rsiDivergency5m │
// │ 242 │ HIFIUSDT      │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.24%  │ 24.27% │ 0.75       │ rsiDivergency5m │
// │ 243 │ BBUSDT        │ 2024 06 10 00:25:00 │ 2024 06 10 00:45:00 │ LONG         │ -0.26% │ -1.78% │ 0.61       │ rsiDivergency5m │
// │ 244 │ BBUSDT        │ 2024 06 10 02:10:00 │ 2024 06 10 02:35:00 │ LONG         │ -0.26% │ -2.04% │ 0.59       │ rsiDivergency5m │
// │ 245 │ OMNIUSDT      │ 2024 06 10 02:40:00 │ 2024 06 10 02:45:00 │ LONG         │ -0.26% │ 8.28%  │ 15.39      │ rsiDivergency5m │
// │ 246 │ BBUSDT        │ 2024 06 10 02:50:00 │ 2024 06 10 11:10:00 │ LONG         │ 1.48%  │ -0.56% │ 0.58       │ rsiDivergency5m │
// │ 247 │ OMNIUSDT      │ 2024 06 10 02:50:00 │ 2024 06 10 11:10:00 │ LONG         │ 0.50%  │ 8.78%  │ 15.29      │ rsiDivergency5m │
// │ 248 │ AXLUSDT       │ 2024 06 10 21:00:00 │ 2024 06 10 21:15:00 │ LONG         │ -0.26% │ 24.00% │ 0.79       │ rsiDivergency5m │
// │ 249 │ ENAUSDT       │ 2024 06 10 21:20:00 │ 2024 06 10 21:30:00 │ LONG         │ -0.26% │ 23.74% │ 0.75       │ rsiDivergency5m │
// │ 250 │ OMNIUSDT      │ 2024 06 10 21:25:00 │ 2024 06 11 05:45:00 │ LONG         │ 0.48%  │ 9.26%  │ 14.32      │ rsiDivergency5m │
// │ 251 │ XAIUSDT       │ 2024 06 10 21:35:00 │ 2024 06 11 05:55:00 │ LONG         │ 0.26%  │ 24.00% │ 0.67       │ rsiDivergency5m │
// │ 252 │ ZETAUSDT      │ 2024 06 11 20:00:00 │ 2024 06 11 20:10:00 │ LONG         │ -0.26% │ 25.96% │ 1.08       │ rsiDivergency5m │
// │ 253 │ AEVOUSDT      │ 2024 06 11 20:45:00 │ 2024 06 12 05:05:00 │ LONG         │ 1.57%  │ 27.53% │ 0.66       │ rsiDivergency5m │
// │ 254 │ ONGUSDT       │ 2024 06 12 05:05:00 │ 2024 06 12 05:10:00 │ SHORT        │ -0.26% │ 27.27% │ 0.41       │ rsiDivergency5m │
// │ 255 │ LDOUSDT       │ 2024 06 12 07:45:00 │ 2024 06 12 07:55:00 │ SHORT        │ -0.26% │ 27.01% │ 2.01       │ rsiDivergency5m │
// │ 256 │ OMNIUSDT      │ 2024 06 12 08:00:00 │ 2024 06 12 08:45:00 │ SHORT        │ -0.26% │ 11.22% │ 16.80      │ rsiDivergency5m │
// │ 257 │ LDOUSDT       │ 2024 06 12 08:10:00 │ 2024 06 12 10:00:00 │ SHORT        │ -0.26% │ 26.75% │ 2.03       │ rsiDivergency5m │
// │ 258 │ RUNEUSDT      │ 2024 06 12 10:05:00 │ 2024 06 12 11:05:00 │ SHORT        │ -0.26% │ 26.48% │ 5.37       │ rsiDivergency5m │
// │ 259 │ 1000PEPEUSDT  │ 2024 06 12 22:20:00 │ 2024 06 13 01:35:00 │ LONG         │ -0.26% │ 26.22% │ 0.01       │ rsiDivergency5m │
// │ 260 │ WUSDT         │ 2024 06 13 10:55:00 │ 2024 06 13 11:00:00 │ LONG         │ -0.26% │ 25.96% │ 0.48       │ rsiDivergency5m │
// │ 261 │ XVSUSDT       │ 2024 06 13 12:25:00 │ 2024 06 13 16:10:00 │ LONG         │ -0.26% │ 25.70% │ 8.21       │ rsiDivergency5m │
// │ 262 │ KNCUSDT       │ 2024 06 13 17:20:00 │ 2024 06 13 19:10:00 │ LONG         │ -0.26% │ 25.43% │ 0.73       │ rsiDivergency5m │
// │ 263 │ KNCUSDT       │ 2024 06 13 19:25:00 │ 2024 06 13 22:05:00 │ LONG         │ -0.26% │ 25.17% │ 0.72       │ rsiDivergency5m │
// │ 264 │ KNCUSDT       │ 2024 06 14 04:30:00 │ 2024 06 14 05:20:00 │ SHORT        │ -0.26% │ 24.91% │ 0.79       │ rsiDivergency5m │
// │ 265 │ ONGUSDT       │ 2024 06 14 10:50:00 │ 2024 06 14 11:05:00 │ LONG         │ -0.26% │ 24.65% │ 0.37       │ rsiDivergency5m │
// │ 266 │ 1000PEPEUSDT  │ 2024 06 14 11:10:00 │ 2024 06 14 11:25:00 │ LONG         │ -0.26% │ 24.38% │ 0.01       │ rsiDivergency5m │
// │ 267 │ 1000PEPEUSDT  │ 2024 06 14 11:30:00 │ 2024 06 14 11:40:00 │ LONG         │ -0.26% │ 24.12% │ 0.01       │ rsiDivergency5m │
// │ 268 │ RONINUSDT     │ 2024 06 14 12:05:00 │ 2024 06 14 12:45:00 │ LONG         │ -0.26% │ 23.86% │ 2.54       │ rsiDivergency5m │
// │ 269 │ RONINUSDT     │ 2024 06 14 12:50:00 │ 2024 06 14 21:10:00 │ LONG         │ -0.12% │ 23.74% │ 2.52       │ rsiDivergency5m │
// │ 270 │ OMNIUSDT      │ 2024 06 14 19:25:00 │ 2024 06 14 19:45:00 │ SHORT        │ -0.26% │ 11.41% │ 16.89      │ rsiDivergency5m │
// │ 271 │ OMNIUSDT      │ 2024 06 14 20:10:00 │ 2024 06 14 21:50:00 │ SHORT        │ -0.26% │ 11.15% │ 17.18      │ rsiDivergency5m │
// │ 272 │ 1000FLOKIUSDT │ 2024 06 14 23:10:00 │ 2024 06 14 23:50:00 │ SHORT        │ -0.26% │ 23.48% │ 0.21       │ rsiDivergency5m │
// │ 273 │ LDOUSDT       │ 2024 06 16 10:10:00 │ 2024 06 16 10:45:00 │ SHORT        │ -0.26% │ 23.21% │ 2.17       │ rsiDivergency5m │
// │ 274 │ LDOUSDT       │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 1.01%  │ 24.22% │ 2.24       │ rsiDivergency5m │
// │ 275 │ IOUSDT        │ 2024 06 16 11:45:00 │ 2024 06 16 19:50:00 │ LONG         │ -0.26% │ 0.23%  │ 5.33       │ rsiDivergency5m │
// │ 276 │ POLYXUSDT     │ 2024 06 16 21:05:00 │ 2024 06 16 21:25:00 │ LONG         │ -0.26% │ 23.96% │ 0.38       │ rsiDivergency5m │
// │ 277 │ BBUSDT        │ 2024 06 16 22:25:00 │ 2024 06 16 22:55:00 │ LONG         │ -0.26% │ 1.28%  │ 0.51       │ rsiDivergency5m │
// │ 278 │ WAXPUSDT      │ 2024 06 16 23:15:00 │ 2024 06 17 00:50:00 │ LONG         │ -0.26% │ 23.70% │ 0.04       │ rsiDivergency5m │
// │ 279 │ TUSDT         │ 2024 06 17 01:20:00 │ 2024 06 17 01:50:00 │ LONG         │ -0.26% │ 23.43% │ 0.02       │ rsiDivergency5m │
// │ 280 │ HIFIUSDT      │ 2024 06 17 02:15:00 │ 2024 06 17 03:30:00 │ LONG         │ -0.26% │ 23.17% │ 0.54       │ rsiDivergency5m │
// │ 281 │ OMNIUSDT      │ 2024 06 17 02:45:00 │ 2024 06 17 03:30:00 │ LONG         │ -0.26% │ 15.01% │ 16.28      │ rsiDivergency5m │
// │ 282 │ WUSDT         │ 2024 06 17 03:50:00 │ 2024 06 17 04:45:00 │ LONG         │ -0.26% │ 22.91% │ 0.41       │ rsiDivergency5m │
// │ 283 │ STRKUSDT      │ 2024 06 17 04:55:00 │ 2024 06 17 05:05:00 │ LONG         │ -0.26% │ 22.65% │ 0.83       │ rsiDivergency5m │
// │ 284 │ LSKUSDT       │ 2024 06 17 05:05:00 │ 2024 06 17 13:25:00 │ LONG         │ 1.45%  │ 24.09% │ 1.01       │ rsiDivergency5m │
// │ 285 │ JUPUSDT       │ 2024 06 17 13:35:00 │ 2024 06 17 20:35:00 │ SHORT        │ 2.49%  │ 26.58% │ 0.89       │ rsiDivergency5m │
// │ 286 │ OMNIUSDT      │ 2024 06 17 19:10:00 │ 2024 06 17 19:15:00 │ LONG         │ -0.26% │ 15.05% │ 14.84      │ rsiDivergency5m │
// │ 287 │ RDNTUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:30:00 │ LONG         │ -0.26% │ 26.32% │ 0.13       │ rsiDivergency5m │
// │ 288 │ ONGUSDT       │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 0.29%  │ 26.60% │ 0.28       │ rsiDivergency5m │
// │ 289 │ MTLUSDT       │ 2024 06 18 05:50:00 │ 2024 06 18 14:10:00 │ SHORT        │ 1.42%  │ 28.02% │ 1.05       │ rsiDivergency5m │
// │ 290 │ TAOUSDT       │ 2024 06 18 08:05:00 │ 2024 06 18 08:30:00 │ LONG         │ -0.26% │ 23.74% │ 263.13     │ rsiDivergency5m │
// │ 291 │ TAOUSDT       │ 2024 06 18 09:05:00 │ 2024 06 18 16:50:00 │ LONG         │ 2.49%  │ 26.22% │ 258.16     │ rsiDivergency5m │
// │ 292 │ JUPUSDT       │ 2024 06 18 16:40:00 │ 2024 06 18 21:55:00 │ SHORT        │ -0.26% │ 27.76% │ 0.75       │ rsiDivergency5m │
// │ 293 │ STXUSDT       │ 2024 06 18 23:15:00 │ 2024 06 19 07:35:00 │ SHORT        │ 0.57%  │ 28.33% │ 1.71       │ rsiDivergency5m │
// │ 294 │ LDOUSDT       │ 2024 06 19 10:40:00 │ 2024 06 19 19:00:00 │ LONG         │ 0.84%  │ 29.17% │ 2.25       │ rsiDivergency5m │
// │ 295 │ BONDUSDT      │ 2024 06 19 22:35:00 │ 2024 06 19 23:00:00 │ SHORT        │ -0.26% │ 28.91% │ 2.11       │ rsiDivergency5m │
// │ 296 │ BONDUSDT      │ 2024 06 20 00:40:00 │ 2024 06 20 00:50:00 │ SHORT        │ -0.26% │ 28.65% │ 2.25       │ rsiDivergency5m │
// │ 297 │ LPTUSDT       │ 2024 06 20 03:25:00 │ 2024 06 20 06:30:00 │ SHORT        │ -0.26% │ 28.38% │ 19.93      │ rsiDivergency5m │
// │ 298 │ BONDUSDT      │ 2024 06 20 08:30:00 │ 2024 06 20 09:15:00 │ LONG         │ -0.26% │ 28.12% │ 2.08       │ rsiDivergency5m │
// │ 299 │ WUSDT         │ 2024 06 20 11:10:00 │ 2024 06 20 19:30:00 │ LONG         │ 0.30%  │ 28.42% │ 0.34       │ rsiDivergency5m │
// │ 300 │ MTLUSDT       │ 2024 06 20 22:00:00 │ 2024 06 20 22:05:00 │ SHORT        │ -0.26% │ 28.16% │ 1.22       │ rsiDivergency5m │
// │ 301 │ MTLUSDT       │ 2024 06 20 23:45:00 │ 2024 06 20 23:50:00 │ SHORT        │ -0.26% │ 27.90% │ 1.26       │ rsiDivergency5m │
// │ 302 │ MTLUSDT       │ 2024 06 20 23:55:00 │ 2024 06 21 01:00:00 │ SHORT        │ -0.26% │ 27.63% │ 1.27       │ rsiDivergency5m │
// │ 303 │ MTLUSDT       │ 2024 06 21 02:10:00 │ 2024 06 21 10:20:00 │ SHORT        │ 2.49%  │ 30.12% │ 1.33       │ rsiDivergency5m │
// │ 304 │ IOUSDT        │ 2024 06 21 08:50:00 │ 2024 06 21 17:10:00 │ LONG         │ 0.73%  │ 2.21%  │ 3.62       │ rsiDivergency5m │
// │ 305 │ ONGUSDT       │ 2024 06 21 13:05:00 │ 2024 06 21 21:25:00 │ LONG         │ 1.66%  │ 31.79% │ 0.34       │ rsiDivergency5m │
// │ 306 │ 1000RATSUSDT  │ 2024 06 22 08:45:00 │ 2024 06 22 09:00:00 │ SHORT        │ -0.26% │ 31.52% │ 0.09       │ rsiDivergency5m │
// │ 307 │ 1000RATSUSDT  │ 2024 06 22 09:10:00 │ 2024 06 22 09:15:00 │ SHORT        │ -0.26% │ 31.26% │ 0.09       │ rsiDivergency5m │
// │ 308 │ 1000RATSUSDT  │ 2024 06 22 09:30:00 │ 2024 06 22 09:35:00 │ SHORT        │ -0.26% │ 31.00% │ 0.09       │ rsiDivergency5m │
// │ 309 │ 1000RATSUSDT  │ 2024 06 22 09:40:00 │ 2024 06 22 09:45:00 │ SHORT        │ -0.26% │ 30.74% │ 0.09       │ rsiDivergency5m │
// │ 310 │ MTLUSDT       │ 2024 06 23 01:00:00 │ 2024 06 23 01:05:00 │ SHORT        │ -0.26% │ 30.47% │ 1.25       │ rsiDivergency5m │
// │ 311 │ MTLUSDT       │ 2024 06 23 09:50:00 │ 2024 06 23 10:20:00 │ LONG         │ -0.26% │ 30.21% │ 1.22       │ rsiDivergency5m │
// │ 312 │ BBUSDT        │ 2024 06 23 17:35:00 │ 2024 06 23 23:10:00 │ LONG         │ -0.26% │ 8.89%  │ 0.37       │ rsiDivergency5m │
// │ 313 │ AEVOUSDT      │ 2024 06 23 18:35:00 │ 2024 06 23 21:55:00 │ LONG         │ -0.26% │ 29.95% │ 0.46       │ rsiDivergency5m │
// │ 314 │ ZETAUSDT      │ 2024 06 24 00:45:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.26% │ 29.69% │ 0.78       │ rsiDivergency5m │
// │ 315 │ CAKEUSDT      │ 2024 06 24 04:40:00 │ 2024 06 24 13:00:00 │ LONG         │ 0.40%  │ 30.09% │ 2.06       │ rsiDivergency5m │
// │ 316 │ LDOUSDT       │ 2024 06 24 15:55:00 │ 2024 06 24 16:00:00 │ SHORT        │ -0.26% │ 29.83% │ 2.40       │ rsiDivergency5m │
// │ 317 │ LDOUSDT       │ 2024 06 24 16:05:00 │ 2024 06 24 16:10:00 │ SHORT        │ -0.26% │ 29.56% │ 2.40       │ rsiDivergency5m │
// │ 318 │ LDOUSDT       │ 2024 06 24 16:20:00 │ 2024 06 24 16:30:00 │ SHORT        │ -0.26% │ 29.30% │ 2.42       │ rsiDivergency5m │
// │ 319 │ AXLUSDT       │ 2024 06 24 17:15:00 │ 2024 06 24 21:00:00 │ SHORT        │ -0.26% │ 29.04% │ 0.58       │ rsiDivergency5m │
// │ 320 │ 1000RATSUSDT  │ 2024 06 24 22:20:00 │ 2024 06 24 22:25:00 │ SHORT        │ -0.26% │ 28.78% │ 0.11       │ rsiDivergency5m │
// │ 321 │ BBUSDT        │ 2024 06 25 06:00:00 │ 2024 06 25 09:15:00 │ SHORT        │ -0.26% │ 7.38%  │ 0.41       │ rsiDivergency5m │
// │ 322 │ STXUSDT       │ 2024 06 25 07:00:00 │ 2024 06 25 08:30:00 │ SHORT        │ -0.26% │ 28.51% │ 1.71       │ rsiDivergency5m │
// │ 323 │ BBUSDT        │ 2024 06 25 09:45:00 │ 2024 06 25 10:15:00 │ SHORT        │ -0.26% │ 7.11%  │ 0.42       │ rsiDivergency5m │
// │ 324 │ 1000PEPEUSDT  │ 2024 06 25 10:00:00 │ 2024 06 25 10:20:00 │ SHORT        │ -0.26% │ 28.25% │ 0.01       │ rsiDivergency5m │
// │ 325 │ BBUSDT        │ 2024 06 25 11:20:00 │ 2024 06 25 11:25:00 │ SHORT        │ -0.26% │ 6.85%  │ 0.43       │ rsiDivergency5m │
// │ 326 │ BBUSDT        │ 2024 06 25 11:30:00 │ 2024 06 25 16:25:00 │ SHORT        │ -0.26% │ 6.59%  │ 0.44       │ rsiDivergency5m │
// │ 327 │ 1000RATSUSDT  │ 2024 06 25 21:10:00 │ 2024 06 25 21:15:00 │ SHORT        │ -0.26% │ 27.73% │ 0.13       │ rsiDivergency5m │
// │ 328 │ ONGUSDT       │ 2024 06 26 11:55:00 │ 2024 06 26 12:05:00 │ LONG         │ -0.26% │ 27.46% │ 0.34       │ rsiDivergency5m │
// │ 329 │ ONGUSDT       │ 2024 06 26 12:10:00 │ 2024 06 26 20:30:00 │ LONG         │ 0.30%  │ 27.77% │ 0.34       │ rsiDivergency5m │
// │ 330 │ BBUSDT        │ 2024 06 27 05:30:00 │ 2024 06 27 13:50:00 │ SHORT        │ 2.06%  │ 7.72%  │ 0.47       │ rsiDivergency5m │
// │ 331 │ 1000RATSUSDT  │ 2024 06 27 05:35:00 │ 2024 06 27 09:10:00 │ SHORT        │ 2.49%  │ 30.26% │ 0.15       │ rsiDivergency5m │
// │ 332 │ JUPUSDT       │ 2024 06 27 09:15:00 │ 2024 06 27 09:20:00 │ SHORT        │ -0.26% │ 29.99% │ 0.87       │ rsiDivergency5m │
// │ 333 │ JUPUSDT       │ 2024 06 27 09:25:00 │ 2024 06 27 17:45:00 │ SHORT        │ 0.72%  │ 30.72% │ 0.88       │ rsiDivergency5m │
// │ 334 │ MAVIAUSDT     │ 2024 06 29 06:25:00 │ 2024 06 29 14:45:00 │ SHORT        │ 2.19%  │ 32.38% │ 1.87       │ rsiDivergency5m │
// │ 335 │ BONDUSDT      │ 2024 06 29 15:50:00 │ 2024 06 29 16:15:00 │ LONG         │ -0.26% │ 32.12% │ 2.21       │ rsiDivergency5m │
// │ 336 │ BONDUSDT      │ 2024 06 29 16:20:00 │ 2024 06 29 17:10:00 │ LONG         │ -0.26% │ 31.86% │ 2.19       │ rsiDivergency5m │
// │ 337 │ ARPAUSDT      │ 2024 06 29 19:15:00 │ 2024 06 29 19:50:00 │ LONG         │ -0.26% │ 31.60% │ 0.04       │ rsiDivergency5m │
// │ 338 │ ARPAUSDT      │ 2024 06 29 19:55:00 │ 2024 06 29 20:00:00 │ LONG         │ -0.26% │ 31.33% │ 0.04       │ rsiDivergency5m │
// │ 339 │ ARPAUSDT      │ 2024 06 29 20:05:00 │ 2024 06 30 03:05:00 │ LONG         │ 2.49%  │ 33.82% │ 0.04       │ rsiDivergency5m │
// │ 340 │ 1000RATSUSDT  │ 2024 06 30 19:05:00 │ 2024 07 01 03:25:00 │ LONG         │ -0.00% │ 33.82% │ 0.14       │ rsiDivergency5m │
// │ 341 │ IOUSDT        │ 2024 07 01 06:25:00 │ 2024 07 01 08:05:00 │ LONG         │ -0.26% │ 0.72%  │ 3.12       │ rsiDivergency5m │
// │ 342 │ 1000RATSUSDT  │ 2024 07 01 10:40:00 │ 2024 07 01 11:00:00 │ LONG         │ -0.26% │ 33.56% │ 0.13       │ rsiDivergency5m │
// │ 343 │ XAIUSDT       │ 2024 07 01 18:20:00 │ 2024 07 01 21:00:00 │ LONG         │ -0.26% │ 33.30% │ 0.38       │ rsiDivergency5m │
// │ 344 │ XAIUSDT       │ 2024 07 01 21:25:00 │ 2024 07 01 23:10:00 │ LONG         │ -0.26% │ 33.03% │ 0.37       │ rsiDivergency5m │
// │ 345 │ REZUSDT       │ 2024 07 02 05:25:00 │ 2024 07 02 06:00:00 │ LONG         │ -0.26% │ 14.79% │ 0.08       │ rsiDivergency5m │
// │ 346 │ REZUSDT       │ 2024 07 02 06:55:00 │ 2024 07 02 07:05:00 │ LONG         │ -0.26% │ 14.53% │ 0.08       │ rsiDivergency5m │
// │ 347 │ REZUSDT       │ 2024 07 02 07:10:00 │ 2024 07 02 15:30:00 │ LONG         │ 1.80%  │ 16.32% │ 0.08       │ rsiDivergency5m │
// │ 348 │ XAIUSDT       │ 2024 07 02 08:40:00 │ 2024 07 02 09:20:00 │ SHORT        │ -0.26% │ 32.77% │ 0.39       │ rsiDivergency5m │
// │ 349 │ TAOUSDT       │ 2024 07 02 16:05:00 │ 2024 07 02 18:00:00 │ LONG         │ -0.26% │ 27.99% │ 240.00     │ rsiDivergency5m │
// │ 350 │ LDOUSDT       │ 2024 07 02 22:35:00 │ 2024 07 02 22:45:00 │ LONG         │ -0.26% │ 32.51% │ 1.84       │ rsiDivergency5m │
// │ 351 │ LDOUSDT       │ 2024 07 03 00:05:00 │ 2024 07 03 01:20:00 │ LONG         │ -0.26% │ 32.25% │ 1.77       │ rsiDivergency5m │
// │ 352 │ 1000FLOKIUSDT │ 2024 07 03 06:35:00 │ 2024 07 03 07:20:00 │ LONG         │ -0.26% │ 31.98% │ 0.17       │ rsiDivergency5m │
// │ 353 │ 1000PEPEUSDT  │ 2024 07 03 07:40:00 │ 2024 07 03 08:05:00 │ LONG         │ -0.26% │ 31.72% │ 0.01       │ rsiDivergency5m │
// │ 354 │ RUNEUSDT      │ 2024 07 03 07:40:00 │ 2024 07 03 14:20:00 │ LONG         │ -0.26% │ 31.46% │ 3.92       │ rsiDivergency5m │
// │ 355 │ 1000RATSUSDT  │ 2024 07 03 17:25:00 │ 2024 07 03 20:30:00 │ LONG         │ -0.26% │ 31.20% │ 0.12       │ rsiDivergency5m │
// │ 356 │ 1000RATSUSDT  │ 2024 07 03 20:55:00 │ 2024 07 03 21:00:00 │ LONG         │ -0.26% │ 30.93% │ 0.11       │ rsiDivergency5m │
// │ 357 │ SUPERUSDT     │ 2024 07 03 21:10:00 │ 2024 07 04 02:05:00 │ LONG         │ -0.26% │ 30.67% │ 0.59       │ rsiDivergency5m │
// │ 358 │ 1000FLOKIUSDT │ 2024 07 04 08:20:00 │ 2024 07 04 08:25:00 │ LONG         │ -0.26% │ 30.15% │ 0.15       │ rsiDivergency5m │
// │ 359 │ ONGUSDT       │ 2024 07 04 08:20:00 │ 2024 07 04 08:25:00 │ LONG         │ -0.26% │ 30.41% │ 0.29       │ rsiDivergency5m │
// │ 360 │ 1000PEPEUSDT  │ 2024 07 04 08:30:00 │ 2024 07 04 16:50:00 │ LONG         │ 1.18%  │ 31.33% │ 0.01       │ rsiDivergency5m │
// │ 361 │ BOMEUSDT      │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.26% │ 31.06% │ 0.01       │ rsiDivergency5m │
// │ 362 │ TAOUSDT       │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.26% │ 30.45% │ 210.81     │ rsiDivergency5m │
// │ 363 │ LSKUSDT       │ 2024 07 04 20:35:00 │ 2024 07 04 21:50:00 │ LONG         │ -0.26% │ 30.80% │ 0.79       │ rsiDivergency5m │
// │ 364 │ LSKUSDT       │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.26% │ 30.54% │ 0.75       │ rsiDivergency5m │
// │ 365 │ LSKUSDT       │ 2024 07 04 22:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.26% │ 30.28% │ 0.74       │ rsiDivergency5m │
// │ 366 │ 1000XECUSDT   │ 2024 07 04 23:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.26% │ 30.01% │ 0.03       │ rsiDivergency5m │
// │ 367 │ CAKEUSDT      │ 2024 07 05 05:30:00 │ 2024 07 05 06:10:00 │ SHORT        │ -0.26% │ 29.75% │ 1.64       │ rsiDivergency5m │
// │ 368 │ BONDUSDT      │ 2024 07 05 06:20:00 │ 2024 07 05 06:30:00 │ SHORT        │ -0.26% │ 29.49% │ 2.10       │ rsiDivergency5m │
// │ 369 │ BONDUSDT      │ 2024 07 05 06:35:00 │ 2024 07 05 06:40:00 │ SHORT        │ -0.26% │ 29.23% │ 2.12       │ rsiDivergency5m │
// │ 370 │ HIFIUSDT      │ 2024 07 05 06:45:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.26% │ 28.96% │ 0.35       │ rsiDivergency5m │
// │ 371 │ TAOUSDT       │ 2024 07 05 07:25:00 │ 2024 07 05 10:00:00 │ SHORT        │ -0.26% │ 30.19% │ 215.70     │ rsiDivergency5m │
// │ 372 │ LQTYUSDT      │ 2024 07 05 10:10:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.26% │ 28.70% │ 0.72       │ rsiDivergency5m │
// │ 373 │ KAVAUSDT      │ 2024 07 05 11:15:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.26% │ 28.44% │ 0.36       │ rsiDivergency5m │
// └─────┴───────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴────────┴────────────┴─────────────────┘
