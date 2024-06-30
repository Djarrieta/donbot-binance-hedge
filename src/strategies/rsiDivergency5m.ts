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
// Snapshot data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬────────┬─────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ avPnl  │ winRate │
// ├───┼───────┼────────┼────────────────┼───────────┼────────┼─────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 1330      │ -0.32% │ 15.49%  │
// └───┴───────┴────────┴────────────────┴───────────┴────────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬─────────┬─────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl  │ minDrawdown │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼─────────┼─────────────┼─────────┼───────────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 194       │ 21.69%    │ -33.69%   │ -19.70% │ -55.38%     │ 17.53%  │ 29.62         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴─────────┴─────────────┴─────────┴───────────────┘
// ┌─────┬───────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬─────────┬────────────┬─────────────────┐
// │     │ pair          │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl  │ entryPrice │ stgName         │
// ├─────┼───────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼─────────┼────────────┼─────────────────┤
// │   0 │ TLMUSDT       │ 2024 05 31 12:25:00 │ 2024 05 31 12:30:00 │ SHORT        │ -1.05% │ -1.05%  │ 0.02       │ rsiDivergency5m │
// │   1 │ FXSUSDT       │ 2024 05 31 17:05:00 │ 2024 05 31 17:10:00 │ SHORT        │ -1.05% │ -2.10%  │ 4.85       │ rsiDivergency5m │
// │   2 │ FXSUSDT       │ 2024 05 31 17:15:00 │ 2024 06 01 01:35:00 │ SHORT        │ 6.00%  │ 3.90%   │ 4.89       │ rsiDivergency5m │
// │   3 │ HIGHUSDT      │ 2024 06 01 02:30:00 │ 2024 06 01 03:05:00 │ LONG         │ -1.05% │ 2.85%   │ 6.69       │ rsiDivergency5m │
// │   4 │ PIXELUSDT     │ 2024 06 01 08:05:00 │ 2024 06 01 15:05:00 │ SHORT        │ -1.05% │ 0.75%   │ 0.46       │ rsiDivergency5m │
// │   5 │ ENSUSDT       │ 2024 06 01 17:50:00 │ 2024 06 01 20:35:00 │ SHORT        │ -1.05% │ -1.35%  │ 29.34      │ rsiDivergency5m │
// │   6 │ PIXELUSDT     │ 2024 06 01 21:10:00 │ 2024 06 01 21:25:00 │ SHORT        │ -1.05% │ -2.40%  │ 0.50       │ rsiDivergency5m │
// │   7 │ TNSRUSDT      │ 2024 06 01 22:45:00 │ 2024 06 01 23:00:00 │ SHORT        │ -1.05% │ -3.45%  │ 1.25       │ rsiDivergency5m │
// │   8 │ TNSRUSDT      │ 2024 06 01 23:10:00 │ 2024 06 02 00:10:00 │ SHORT        │ -1.05% │ -4.50%  │ 1.27       │ rsiDivergency5m │
// │   9 │ PORTALUSDT    │ 2024 06 02 01:30:00 │ 2024 06 02 03:55:00 │ SHORT        │ -1.05% │ -6.60%  │ 0.98       │ rsiDivergency5m │
// │  10 │ PORTALUSDT    │ 2024 06 02 04:10:00 │ 2024 06 02 10:00:00 │ SHORT        │ -1.05% │ -7.65%  │ 1.00       │ rsiDivergency5m │
// │  11 │ KLAYUSDT      │ 2024 06 02 20:05:00 │ 2024 06 02 20:25:00 │ SHORT        │ -1.05% │ -9.75%  │ 0.24       │ rsiDivergency5m │
// │  12 │ KLAYUSDT      │ 2024 06 02 20:35:00 │ 2024 06 02 20:45:00 │ SHORT        │ -1.05% │ -10.80% │ 0.25       │ rsiDivergency5m │
// │  13 │ KLAYUSDT      │ 2024 06 02 20:50:00 │ 2024 06 02 21:15:00 │ SHORT        │ -1.05% │ -11.85% │ 0.25       │ rsiDivergency5m │
// │  14 │ KLAYUSDT      │ 2024 06 02 21:40:00 │ 2024 06 03 02:55:00 │ SHORT        │ 9.95%  │ -1.90%  │ 0.26       │ rsiDivergency5m │
// │  15 │ WIFUSDT       │ 2024 06 03 03:25:00 │ 2024 06 03 05:40:00 │ SHORT        │ -1.05% │ -2.95%  │ 3.43       │ rsiDivergency5m │
// │  16 │ AGLDUSDT      │ 2024 06 03 07:45:00 │ 2024 06 03 12:00:00 │ SHORT        │ -1.05% │ -4.00%  │ 1.67       │ rsiDivergency5m │
// │  17 │ KASUSDT       │ 2024 06 03 13:05:00 │ 2024 06 03 13:10:00 │ SHORT        │ -1.05% │ -5.05%  │ 0.17       │ rsiDivergency5m │
// │  18 │ KASUSDT       │ 2024 06 03 13:15:00 │ 2024 06 03 13:35:00 │ SHORT        │ -1.05% │ -6.10%  │ 0.17       │ rsiDivergency5m │
// │  19 │ OMUSDT        │ 2024 06 03 16:45:00 │ 2024 06 03 18:05:00 │ SHORT        │ -1.05% │ -7.15%  │ 0.91       │ rsiDivergency5m │
// │  20 │ PORTALUSDT    │ 2024 06 03 18:45:00 │ 2024 06 03 20:00:00 │ LONG         │ -1.05% │ -8.20%  │ 1.04       │ rsiDivergency5m │
// │  21 │ GTCUSDT       │ 2024 06 03 20:00:00 │ 2024 06 03 20:25:00 │ SHORT        │ -1.05% │ -9.25%  │ 1.79       │ rsiDivergency5m │
// │  22 │ ZECUSDT       │ 2024 06 04 15:55:00 │ 2024 06 05 00:15:00 │ SHORT        │ 3.15%  │ -8.20%  │ 28.12      │ rsiDivergency5m │
// │  23 │ RSRUSDT       │ 2024 06 05 01:45:00 │ 2024 06 05 10:05:00 │ SHORT        │ 2.28%  │ -5.92%  │ 0.01       │ rsiDivergency5m │
// │  24 │ GMXUSDT       │ 2024 06 05 10:20:00 │ 2024 06 05 11:05:00 │ SHORT        │ -1.05% │ -6.97%  │ 40.26      │ rsiDivergency5m │
// │  25 │ GMXUSDT       │ 2024 06 05 11:10:00 │ 2024 06 05 12:00:00 │ SHORT        │ -1.05% │ -8.02%  │ 40.61      │ rsiDivergency5m │
// │  26 │ STXUSDT       │ 2024 06 05 12:05:00 │ 2024 06 05 12:35:00 │ SHORT        │ -1.05% │ -9.07%  │ 2.39       │ rsiDivergency5m │
// │  27 │ GMXUSDT       │ 2024 06 05 13:05:00 │ 2024 06 05 16:00:00 │ SHORT        │ -1.05% │ -10.12% │ 42.39      │ rsiDivergency5m │
// │  28 │ REZUSDT       │ 2024 06 05 22:05:00 │ 2024 06 06 06:25:00 │ SHORT        │ 8.35%  │ -1.77%  │ 0.18       │ rsiDivergency5m │
// │  29 │ LQTYUSDT      │ 2024 06 06 07:55:00 │ 2024 06 06 08:00:00 │ SHORT        │ -1.05% │ -2.82%  │ 1.47       │ rsiDivergency5m │
// │  30 │ REZUSDT       │ 2024 06 06 09:45:00 │ 2024 06 06 10:30:00 │ SHORT        │ -1.05% │ -3.87%  │ 0.18       │ rsiDivergency5m │
// │  31 │ MYROUSDT      │ 2024 06 06 18:25:00 │ 2024 06 06 21:35:00 │ LONG         │ -1.05% │ -5.97%  │ 0.27       │ rsiDivergency5m │
// │  32 │ IOTAUSDT      │ 2024 06 06 21:50:00 │ 2024 06 07 00:45:00 │ SHORT        │ -1.05% │ -7.02%  │ 0.25       │ rsiDivergency5m │
// │  33 │ USTCUSDT      │ 2024 06 07 04:15:00 │ 2024 06 07 06:00:00 │ LONG         │ -1.05% │ -8.07%  │ 0.02       │ rsiDivergency5m │
// │  34 │ HIGHUSDT      │ 2024 06 07 08:45:00 │ 2024 06 07 08:55:00 │ SHORT        │ -1.05% │ -9.12%  │ 8.30       │ rsiDivergency5m │
// │  35 │ HIGHUSDT      │ 2024 06 07 09:05:00 │ 2024 06 07 09:15:00 │ SHORT        │ -1.05% │ -10.17% │ 8.40       │ rsiDivergency5m │
// │  36 │ WUSDT         │ 2024 06 07 09:30:00 │ 2024 06 07 13:00:00 │ SHORT        │ 9.95%  │ -0.22%  │ 0.74       │ rsiDivergency5m │
// │  37 │ AGLDUSDT      │ 2024 06 07 13:05:00 │ 2024 06 07 13:10:00 │ LONG         │ -1.05% │ -1.27%  │ 1.53       │ rsiDivergency5m │
// │  38 │ MAGICUSDT     │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 2.97%  │ 1.70%   │ 0.80       │ rsiDivergency5m │
// │  39 │ BICOUSDT      │ 2024 06 07 22:35:00 │ 2024 06 08 00:40:00 │ SHORT        │ -1.05% │ 0.65%   │ 0.55       │ rsiDivergency5m │
// │  40 │ ALPHAUSDT     │ 2024 06 08 00:35:00 │ 2024 06 08 03:35:00 │ LONG         │ -1.05% │ -0.40%  │ 0.12       │ rsiDivergency5m │
// │  41 │ ORDIUSDT      │ 2024 06 08 04:00:00 │ 2024 06 08 12:20:00 │ SHORT        │ 1.59%  │ 1.19%   │ 62.27      │ rsiDivergency5m │
// │  42 │ LITUSDT       │ 2024 06 08 12:35:00 │ 2024 06 08 17:15:00 │ LONG         │ -1.05% │ 0.14%   │ 1.10       │ rsiDivergency5m │
// │  43 │ BICOUSDT      │ 2024 06 08 19:45:00 │ 2024 06 08 19:55:00 │ SHORT        │ -1.05% │ -0.91%  │ 0.60       │ rsiDivergency5m │
// │  44 │ NOTUSDT       │ 2024 06 08 21:25:00 │ 2024 06 08 21:30:00 │ LONG         │ -1.05% │ -1.96%  │ 0.02       │ rsiDivergency5m │
// │  45 │ TRUUSDT       │ 2024 06 08 21:50:00 │ 2024 06 09 03:40:00 │ LONG         │ 9.95%  │ 7.99%   │ 0.19       │ rsiDivergency5m │
// │  46 │ ARKUSDT       │ 2024 06 09 04:00:00 │ 2024 06 09 04:55:00 │ SHORT        │ -1.05% │ 6.94%   │ 0.84       │ rsiDivergency5m │
// │  47 │ CHZUSDT       │ 2024 06 09 13:25:00 │ 2024 06 09 21:45:00 │ SHORT        │ 3.30%  │ 13.15%  │ 0.13       │ rsiDivergency5m │
// │  48 │ HIFIUSDT      │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 4.97%  │ 18.12%  │ 0.75       │ rsiDivergency5m │
// │  49 │ INJUSDT       │ 2024 06 10 10:35:00 │ 2024 06 10 18:55:00 │ SHORT        │ 0.40%  │ 18.51%  │ 29.47      │ rsiDivergency5m │
// │  50 │ POLYXUSDT     │ 2024 06 10 20:55:00 │ 2024 06 11 05:15:00 │ LONG         │ 2.04%  │ 20.55%  │ 0.49       │ rsiDivergency5m │
// │  51 │ 1000BONKUSDT  │ 2024 06 11 05:25:00 │ 2024 06 11 06:40:00 │ SHORT        │ -1.05% │ 19.50%  │ 0.03       │ rsiDivergency5m │
// │  52 │ PEOPLEUSDT    │ 2024 06 11 08:45:00 │ 2024 06 11 11:20:00 │ LONG         │ -1.05% │ 18.45%  │ 0.11       │ rsiDivergency5m │
// │  53 │ INJUSDT       │ 2024 06 11 11:30:00 │ 2024 06 11 11:35:00 │ LONG         │ -1.05% │ 17.40%  │ 26.25      │ rsiDivergency5m │
// │  54 │ INJUSDT       │ 2024 06 11 11:40:00 │ 2024 06 11 12:05:00 │ LONG         │ -1.05% │ 16.35%  │ 26.05      │ rsiDivergency5m │
// │  55 │ SAGAUSDT      │ 2024 06 11 12:25:00 │ 2024 06 11 20:45:00 │ LONG         │ 1.51%  │ 17.86%  │ 1.92       │ rsiDivergency5m │
// │  56 │ ZETAUSDT      │ 2024 06 11 20:45:00 │ 2024 06 12 05:05:00 │ LONG         │ 3.83%  │ 21.69%  │ 1.05       │ rsiDivergency5m │
// │  57 │ KSMUSDT       │ 2024 06 12 07:10:00 │ 2024 06 12 07:30:00 │ SHORT        │ -1.05% │ 20.64%  │ 29.89      │ rsiDivergency5m │
// │  58 │ BAKEUSDT      │ 2024 06 12 07:35:00 │ 2024 06 12 07:40:00 │ SHORT        │ -1.05% │ 19.59%  │ 0.34       │ rsiDivergency5m │
// │  59 │ OMNIUSDT      │ 2024 06 12 08:00:00 │ 2024 06 12 08:45:00 │ SHORT        │ -1.05% │ 18.54%  │ 16.80      │ rsiDivergency5m │
// │  60 │ DOGEUSDT      │ 2024 06 12 09:25:00 │ 2024 06 12 11:15:00 │ SHORT        │ -1.05% │ 17.49%  │ 0.15       │ rsiDivergency5m │
// │  61 │ ARKUSDT       │ 2024 06 12 11:45:00 │ 2024 06 12 12:20:00 │ SHORT        │ -1.05% │ 16.44%  │ 0.88       │ rsiDivergency5m │
// │  62 │ AGLDUSDT      │ 2024 06 12 13:55:00 │ 2024 06 12 14:45:00 │ LONG         │ -1.05% │ 15.39%  │ 1.55       │ rsiDivergency5m │
// │  63 │ DUSKUSDT      │ 2024 06 12 14:55:00 │ 2024 06 12 16:30:00 │ LONG         │ -1.05% │ 14.34%  │ 0.43       │ rsiDivergency5m │
// │  64 │ DUSKUSDT      │ 2024 06 12 17:25:00 │ 2024 06 12 18:40:00 │ LONG         │ -1.05% │ 13.29%  │ 0.42       │ rsiDivergency5m │
// │  65 │ DUSKUSDT      │ 2024 06 12 21:15:00 │ 2024 06 12 21:40:00 │ LONG         │ -1.05% │ 12.24%  │ 0.41       │ rsiDivergency5m │
// │  66 │ OMUSDT        │ 2024 06 12 22:05:00 │ 2024 06 13 06:25:00 │ LONG         │ 2.48%  │ 14.72%  │ 0.81       │ rsiDivergency5m │
// │  67 │ POLYXUSDT     │ 2024 06 13 10:45:00 │ 2024 06 13 10:55:00 │ LONG         │ -1.05% │ 13.67%  │ 0.46       │ rsiDivergency5m │
// │  68 │ TOKENUSDT     │ 2024 06 13 11:00:00 │ 2024 06 13 19:15:00 │ LONG         │ -1.05% │ 12.62%  │ 0.10       │ rsiDivergency5m │
// │  69 │ KNCUSDT       │ 2024 06 13 19:25:00 │ 2024 06 13 22:05:00 │ LONG         │ -1.05% │ 11.57%  │ 0.72       │ rsiDivergency5m │
// │  70 │ ARUSDT        │ 2024 06 13 23:30:00 │ 2024 06 13 23:45:00 │ SHORT        │ -1.05% │ 10.52%  │ 31.08      │ rsiDivergency5m │
// │  71 │ NOTUSDT       │ 2024 06 14 01:25:00 │ 2024 06 14 01:45:00 │ SHORT        │ -1.05% │ 9.47%   │ 0.02       │ rsiDivergency5m │
// │  72 │ KNCUSDT       │ 2024 06 14 04:30:00 │ 2024 06 14 05:20:00 │ SHORT        │ -1.05% │ 8.42%   │ 0.79       │ rsiDivergency5m │
// │  73 │ ONDOUSDT      │ 2024 06 14 06:00:00 │ 2024 06 14 07:50:00 │ LONG         │ -1.05% │ 7.37%   │ 1.25       │ rsiDivergency5m │
// │  74 │ ARUSDT        │ 2024 06 14 08:05:00 │ 2024 06 14 09:15:00 │ LONG         │ -1.05% │ 6.32%   │ 30.01      │ rsiDivergency5m │
// │  75 │ BNXUSDT       │ 2024 06 14 09:50:00 │ 2024 06 14 10:05:00 │ LONG         │ -1.05% │ 5.27%   │ 1.11       │ rsiDivergency5m │
// │  76 │ BLZUSDT       │ 2024 06 14 10:40:00 │ 2024 06 14 10:50:00 │ LONG         │ -1.05% │ 4.22%   │ 0.27       │ rsiDivergency5m │
// │  77 │ BLZUSDT       │ 2024 06 14 10:55:00 │ 2024 06 14 11:05:00 │ LONG         │ -1.05% │ 3.17%   │ 0.27       │ rsiDivergency5m │
// │  78 │ CHZUSDT       │ 2024 06 14 11:10:00 │ 2024 06 14 11:35:00 │ LONG         │ -1.05% │ 2.12%   │ 0.11       │ rsiDivergency5m │
// │  79 │ WLDUSDT       │ 2024 06 14 11:45:00 │ 2024 06 14 12:05:00 │ LONG         │ -1.05% │ 1.07%   │ 3.39       │ rsiDivergency5m │
// │  80 │ CHZUSDT       │ 2024 06 14 12:05:00 │ 2024 06 14 19:50:00 │ LONG         │ -1.05% │ 0.02%   │ 0.11       │ rsiDivergency5m │
// │  81 │ OMNIUSDT      │ 2024 06 14 20:10:00 │ 2024 06 14 21:50:00 │ SHORT        │ -1.05% │ -1.03%  │ 17.18      │ rsiDivergency5m │
// │  82 │ 1000FLOKIUSDT │ 2024 06 14 23:10:00 │ 2024 06 14 23:50:00 │ SHORT        │ -1.05% │ -2.08%  │ 0.21       │ rsiDivergency5m │
// │  83 │ 1000SHIBUSDT  │ 2024 06 14 23:55:00 │ 2024 06 15 08:15:00 │ SHORT        │ -0.24% │ -2.32%  │ 0.02       │ rsiDivergency5m │
// │  84 │ RIFUSDT       │ 2024 06 15 15:20:00 │ 2024 06 15 23:40:00 │ LONG         │ 2.72%  │ 0.40%   │ 0.11       │ rsiDivergency5m │
// │  85 │ LDOUSDT       │ 2024 06 16 10:10:00 │ 2024 06 16 10:45:00 │ SHORT        │ -1.05% │ -0.65%  │ 2.17       │ rsiDivergency5m │
// │  86 │ LDOUSDT       │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 4.03%  │ 3.38%   │ 2.24       │ rsiDivergency5m │
// │  87 │ IOUSDT        │ 2024 06 16 11:45:00 │ 2024 06 16 19:50:00 │ LONG         │ -1.05% │ -11.35% │ 5.33       │ rsiDivergency5m │
// │  88 │ UNFIUSDT      │ 2024 06 16 20:45:00 │ 2024 06 16 20:55:00 │ SHORT        │ -1.05% │ 2.33%   │ 4.05       │ rsiDivergency5m │
// │  89 │ UNFIUSDT      │ 2024 06 16 21:00:00 │ 2024 06 16 21:05:00 │ SHORT        │ -1.05% │ 1.28%   │ 4.09       │ rsiDivergency5m │
// │  90 │ UNFIUSDT      │ 2024 06 16 21:10:00 │ 2024 06 16 21:15:00 │ SHORT        │ -1.05% │ 0.23%   │ 4.09       │ rsiDivergency5m │
// │  91 │ ORBSUSDT      │ 2024 06 16 21:30:00 │ 2024 06 17 01:00:00 │ LONG         │ -1.05% │ -0.82%  │ 0.02       │ rsiDivergency5m │
// │  92 │ TURBOUSDT     │ 2024 06 17 01:10:00 │ 2024 06 17 02:10:00 │ LONG         │ -1.05% │ -1.87%  │ 0.00       │ rsiDivergency5m │
// │  93 │ KNCUSDT       │ 2024 06 17 01:55:00 │ 2024 06 17 02:10:00 │ LONG         │ -1.05% │ -2.92%  │ 0.68       │ rsiDivergency5m │
// │  94 │ OMNIUSDT      │ 2024 06 17 02:45:00 │ 2024 06 17 03:30:00 │ LONG         │ -1.05% │ -3.97%  │ 16.28      │ rsiDivergency5m │
// │  95 │ REZUSDT       │ 2024 06 17 03:40:00 │ 2024 06 17 04:45:00 │ LONG         │ -1.05% │ -5.02%  │ 0.11       │ rsiDivergency5m │
// │  96 │ POLYXUSDT     │ 2024 06 17 04:50:00 │ 2024 06 17 08:50:00 │ LONG         │ -1.05% │ -6.07%  │ 0.36       │ rsiDivergency5m │
// │  97 │ INJUSDT       │ 2024 06 17 08:55:00 │ 2024 06 17 10:05:00 │ LONG         │ -1.05% │ -7.12%  │ 22.25      │ rsiDivergency5m │
// │  98 │ INJUSDT       │ 2024 06 17 10:15:00 │ 2024 06 17 10:25:00 │ LONG         │ -1.05% │ -8.17%  │ 22.01      │ rsiDivergency5m │
// │  99 │ BNXUSDT       │ 2024 06 17 10:55:00 │ 2024 06 17 11:15:00 │ LONG         │ -1.05% │ -9.22%  │ 0.96       │ rsiDivergency5m │
// │ 100 │ 1000BONKUSDT  │ 2024 06 17 13:35:00 │ 2024 06 17 14:00:00 │ SHORT        │ -1.05% │ -10.27% │ 0.02       │ rsiDivergency5m │
// │ 101 │ IOTXUSDT      │ 2024 06 17 14:15:00 │ 2024 06 17 18:05:00 │ SHORT        │ -1.05% │ -11.32% │ 0.05       │ rsiDivergency5m │
// │ 102 │ TNSRUSDT      │ 2024 06 17 18:30:00 │ 2024 06 17 18:45:00 │ LONG         │ -1.05% │ -12.37% │ 0.72       │ rsiDivergency5m │
// │ 103 │ OMNIUSDT      │ 2024 06 17 19:10:00 │ 2024 06 17 19:15:00 │ LONG         │ -1.05% │ -13.42% │ 14.84      │ rsiDivergency5m │
// │ 104 │ LDOUSDT       │ 2024 06 17 19:50:00 │ 2024 06 17 20:15:00 │ LONG         │ -1.05% │ -14.47% │ 1.94       │ rsiDivergency5m │
// │ 105 │ 1000SATSUSDT  │ 2024 06 17 20:25:00 │ 2024 06 17 20:30:00 │ LONG         │ -1.05% │ -15.52% │ 0.00       │ rsiDivergency5m │
// │ 106 │ OMGUSDT       │ 2024 06 17 20:25:00 │ 2024 06 17 20:35:00 │ LONG         │ -1.05% │ -16.57% │ 0.35       │ rsiDivergency5m │
// │ 107 │ BLURUSDT      │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 1.81%  │ -14.76% │ 0.25       │ rsiDivergency5m │
// │ 108 │ IOTXUSDT      │ 2024 06 18 05:05:00 │ 2024 06 18 05:15:00 │ LONG         │ -1.05% │ -15.81% │ 0.05       │ rsiDivergency5m │
// │ 109 │ MTLUSDT       │ 2024 06 18 05:50:00 │ 2024 06 18 14:10:00 │ SHORT        │ 5.68%  │ -10.13% │ 1.05       │ rsiDivergency5m │
// │ 110 │ CRVUSDT       │ 2024 06 18 15:50:00 │ 2024 06 18 16:30:00 │ SHORT        │ -1.05% │ -11.18% │ 0.32       │ rsiDivergency5m │
// │ 111 │ CRVUSDT       │ 2024 06 18 17:20:00 │ 2024 06 18 18:35:00 │ SHORT        │ -1.05% │ -12.23% │ 0.33       │ rsiDivergency5m │
// │ 112 │ ORBSUSDT      │ 2024 06 18 20:05:00 │ 2024 06 18 20:10:00 │ SHORT        │ -1.05% │ -13.28% │ 0.02       │ rsiDivergency5m │
// │ 113 │ ORBSUSDT      │ 2024 06 18 20:15:00 │ 2024 06 18 20:20:00 │ SHORT        │ -1.05% │ -14.33% │ 0.02       │ rsiDivergency5m │
// │ 114 │ ENSUSDT       │ 2024 06 18 20:20:00 │ 2024 06 18 21:00:00 │ SHORT        │ -1.05% │ -15.38% │ 26.62      │ rsiDivergency5m │
// │ 115 │ BNXUSDT       │ 2024 06 18 21:05:00 │ 2024 06 18 21:45:00 │ SHORT        │ -1.05% │ -16.43% │ 1.03       │ rsiDivergency5m │
// │ 116 │ BNXUSDT       │ 2024 06 18 22:10:00 │ 2024 06 19 05:40:00 │ SHORT        │ -1.05% │ -17.48% │ 1.05       │ rsiDivergency5m │
// │ 117 │ UNFIUSDT      │ 2024 06 19 08:50:00 │ 2024 06 19 11:00:00 │ SHORT        │ -1.05% │ -18.53% │ 4.42       │ rsiDivergency5m │
// │ 118 │ JUPUSDT       │ 2024 06 19 11:50:00 │ 2024 06 19 12:05:00 │ SHORT        │ -1.05% │ -19.58% │ 0.78       │ rsiDivergency5m │
// │ 119 │ FETUSDT       │ 2024 06 19 12:25:00 │ 2024 06 19 12:50:00 │ SHORT        │ -1.05% │ -20.63% │ 1.45       │ rsiDivergency5m │
// │ 120 │ EDUUSDT       │ 2024 06 19 20:20:00 │ 2024 06 20 04:40:00 │ SHORT        │ 2.55%  │ -18.08% │ 0.65       │ rsiDivergency5m │
// │ 121 │ NEARUSDT      │ 2024 06 20 06:10:00 │ 2024 06 20 14:30:00 │ SHORT        │ 2.96%  │ -15.12% │ 5.49       │ rsiDivergency5m │
// │ 122 │ ZKUSDT        │ 2024 06 20 09:05:00 │ 2024 06 20 09:15:00 │ LONG         │ -1.05% │ 1.80%   │ 0.20       │ rsiDivergency5m │
// │ 123 │ MYROUSDT      │ 2024 06 20 18:30:00 │ 2024 06 20 19:05:00 │ LONG         │ -1.05% │ -16.17% │ 0.14       │ rsiDivergency5m │
// │ 124 │ RNDRUSDT      │ 2024 06 20 19:55:00 │ 2024 06 21 03:05:00 │ LONG         │ -1.05% │ -17.22% │ 7.41       │ rsiDivergency5m │
// │ 125 │ ZKUSDT        │ 2024 06 21 02:50:00 │ 2024 06 21 03:05:00 │ LONG         │ -1.05% │ -5.55%  │ 0.18       │ rsiDivergency5m │
// │ 126 │ 1000BONKUSDT  │ 2024 06 21 04:00:00 │ 2024 06 21 12:20:00 │ LONG         │ 0.92%  │ -16.30% │ 0.02       │ rsiDivergency5m │
// │ 127 │ IOUSDT        │ 2024 06 21 08:50:00 │ 2024 06 21 17:10:00 │ LONG         │ 2.91%  │ 9.85%   │ 3.62       │ rsiDivergency5m │
// │ 128 │ ONGUSDT       │ 2024 06 21 13:05:00 │ 2024 06 21 21:25:00 │ LONG         │ 6.65%  │ -9.64%  │ 0.34       │ rsiDivergency5m │
// │ 129 │ 1000LUNCUSDT  │ 2024 06 21 23:30:00 │ 2024 06 21 23:40:00 │ LONG         │ -1.05% │ -10.69% │ 0.08       │ rsiDivergency5m │
// │ 130 │ 1000LUNCUSDT  │ 2024 06 21 23:55:00 │ 2024 06 22 00:20:00 │ LONG         │ -1.05% │ -11.74% │ 0.08       │ rsiDivergency5m │
// │ 131 │ 1000LUNCUSDT  │ 2024 06 22 01:05:00 │ 2024 06 22 01:10:00 │ LONG         │ -1.05% │ -12.79% │ 0.08       │ rsiDivergency5m │
// │ 132 │ UNFIUSDT      │ 2024 06 22 03:10:00 │ 2024 06 22 03:15:00 │ LONG         │ -1.05% │ -13.84% │ 4.24       │ rsiDivergency5m │
// │ 133 │ 1000RATSUSDT  │ 2024 06 22 08:45:00 │ 2024 06 22 09:00:00 │ SHORT        │ -1.05% │ -14.89% │ 0.09       │ rsiDivergency5m │
// │ 134 │ 1000RATSUSDT  │ 2024 06 22 09:10:00 │ 2024 06 22 09:15:00 │ SHORT        │ -1.05% │ -15.94% │ 0.09       │ rsiDivergency5m │
// │ 135 │ 1000RATSUSDT  │ 2024 06 22 09:30:00 │ 2024 06 22 09:35:00 │ SHORT        │ -1.05% │ -16.99% │ 0.09       │ rsiDivergency5m │
// │ 136 │ 1000RATSUSDT  │ 2024 06 22 09:40:00 │ 2024 06 22 09:45:00 │ SHORT        │ -1.05% │ -18.04% │ 0.09       │ rsiDivergency5m │
// │ 137 │ 1000SATSUSDT  │ 2024 06 22 11:40:00 │ 2024 06 22 11:45:00 │ SHORT        │ -1.05% │ -19.09% │ 0.00       │ rsiDivergency5m │
// │ 138 │ LISTAUSDT     │ 2024 06 22 11:45:00 │ 2024 06 22 12:05:00 │ SHORT        │ -1.05% │ -0.30%  │ 0.67       │ rsiDivergency5m │
// │ 139 │ 1000SATSUSDT  │ 2024 06 22 12:00:00 │ 2024 06 22 20:20:00 │ SHORT        │ 1.92%  │ -17.18% │ 0.00       │ rsiDivergency5m │
// │ 140 │ PEOPLEUSDT    │ 2024 06 22 22:45:00 │ 2024 06 22 23:15:00 │ SHORT        │ -1.05% │ -18.23% │ 0.09       │ rsiDivergency5m │
// │ 141 │ PEOPLEUSDT    │ 2024 06 22 23:50:00 │ 2024 06 22 23:55:00 │ SHORT        │ -1.05% │ -19.28% │ 0.09       │ rsiDivergency5m │
// │ 142 │ MTLUSDT       │ 2024 06 23 01:00:00 │ 2024 06 23 01:05:00 │ SHORT        │ -1.05% │ -20.33% │ 1.25       │ rsiDivergency5m │
// │ 143 │ TURBOUSDT     │ 2024 06 23 05:50:00 │ 2024 06 23 06:00:00 │ LONG         │ -1.05% │ -21.38% │ 0.01       │ rsiDivergency5m │
// │ 144 │ ZROUSDT       │ 2024 06 23 06:25:00 │ 2024 06 23 10:45:00 │ LONG         │ -1.05% │ -8.70%  │ 2.91       │ rsiDivergency5m │
// │ 145 │ BAKEUSDT      │ 2024 06 23 08:35:00 │ 2024 06 23 09:00:00 │ LONG         │ -1.05% │ -22.43% │ 0.36       │ rsiDivergency5m │
// │ 146 │ BAKEUSDT      │ 2024 06 23 09:30:00 │ 2024 06 23 10:00:00 │ LONG         │ -1.05% │ -23.48% │ 0.35       │ rsiDivergency5m │
// │ 147 │ BAKEUSDT      │ 2024 06 23 10:05:00 │ 2024 06 23 10:55:00 │ LONG         │ -1.05% │ -24.53% │ 0.35       │ rsiDivergency5m │
// │ 148 │ BAKEUSDT      │ 2024 06 23 11:00:00 │ 2024 06 23 11:20:00 │ LONG         │ -1.05% │ -25.58% │ 0.34       │ rsiDivergency5m │
// │ 149 │ BAKEUSDT      │ 2024 06 23 11:30:00 │ 2024 06 23 11:50:00 │ LONG         │ -1.05% │ -26.63% │ 0.34       │ rsiDivergency5m │
// │ 150 │ TRUUSDT       │ 2024 06 23 12:00:00 │ 2024 06 23 15:30:00 │ LONG         │ -1.05% │ -27.68% │ 0.13       │ rsiDivergency5m │
// │ 151 │ JASMYUSDT     │ 2024 06 23 15:35:00 │ 2024 06 23 18:50:00 │ LONG         │ -1.05% │ -28.73% │ 0.03       │ rsiDivergency5m │
// │ 152 │ PENDLEUSDT    │ 2024 06 23 19:00:00 │ 2024 06 23 21:40:00 │ LONG         │ -1.05% │ -29.78% │ 5.66       │ rsiDivergency5m │
// │ 153 │ PENDLEUSDT    │ 2024 06 23 23:30:00 │ 2024 06 24 00:15:00 │ LONG         │ -1.05% │ -30.83% │ 5.51       │ rsiDivergency5m │
// │ 154 │ 1000SATSUSDT  │ 2024 06 24 00:45:00 │ 2024 06 24 04:30:00 │ LONG         │ -1.05% │ -31.88% │ 0.00       │ rsiDivergency5m │
// │ 155 │ STRKUSDT      │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 6.32%  │ -25.56% │ 0.66       │ rsiDivergency5m │
// │ 156 │ LDOUSDT       │ 2024 06 24 15:55:00 │ 2024 06 24 16:00:00 │ SHORT        │ -1.05% │ -26.61% │ 2.40       │ rsiDivergency5m │
// │ 157 │ LDOUSDT       │ 2024 06 24 16:05:00 │ 2024 06 24 16:10:00 │ SHORT        │ -1.05% │ -27.66% │ 2.40       │ rsiDivergency5m │
// │ 158 │ LDOUSDT       │ 2024 06 24 16:20:00 │ 2024 06 24 16:30:00 │ SHORT        │ -1.05% │ -28.71% │ 2.42       │ rsiDivergency5m │
// │ 159 │ INJUSDT       │ 2024 06 24 17:10:00 │ 2024 06 24 18:50:00 │ SHORT        │ -1.05% │ -29.76% │ 22.54      │ rsiDivergency5m │
// │ 160 │ ARKMUSDT      │ 2024 06 24 18:55:00 │ 2024 06 24 19:50:00 │ SHORT        │ -1.05% │ -30.81% │ 1.94       │ rsiDivergency5m │
// │ 161 │ PEOPLEUSDT    │ 2024 06 24 19:55:00 │ 2024 06 24 22:10:00 │ SHORT        │ -1.05% │ -31.86% │ 0.09       │ rsiDivergency5m │
// │ 162 │ LISTAUSDT     │ 2024 06 24 20:15:00 │ 2024 06 24 20:25:00 │ SHORT        │ -1.05% │ -10.30% │ 0.71       │ rsiDivergency5m │
// │ 163 │ 1000RATSUSDT  │ 2024 06 24 22:20:00 │ 2024 06 24 22:25:00 │ SHORT        │ -1.05% │ -32.91% │ 0.11       │ rsiDivergency5m │
// │ 164 │ TNSRUSDT      │ 2024 06 24 22:40:00 │ 2024 06 25 07:00:00 │ SHORT        │ 2.76%  │ -30.15% │ 0.63       │ rsiDivergency5m │
// │ 165 │ STXUSDT       │ 2024 06 25 07:00:00 │ 2024 06 25 08:30:00 │ SHORT        │ -1.05% │ -31.20% │ 1.71       │ rsiDivergency5m │
// │ 166 │ TOKENUSDT     │ 2024 06 25 08:40:00 │ 2024 06 25 17:00:00 │ LONG         │ 2.59%  │ -28.60% │ 0.09       │ rsiDivergency5m │
// │ 167 │ STXUSDT       │ 2024 06 25 17:05:00 │ 2024 06 25 21:15:00 │ SHORT        │ -1.05% │ -29.65% │ 1.79       │ rsiDivergency5m │
// │ 168 │ FETUSDT       │ 2024 06 25 23:25:00 │ 2024 06 25 23:55:00 │ SHORT        │ -1.05% │ -30.70% │ 1.73       │ rsiDivergency5m │
// │ 169 │ ONGUSDT       │ 2024 06 26 11:55:00 │ 2024 06 26 12:05:00 │ LONG         │ -1.05% │ -31.75% │ 0.34       │ rsiDivergency5m │
// │ 170 │ ONGUSDT       │ 2024 06 26 12:10:00 │ 2024 06 26 20:30:00 │ LONG         │ 1.21%  │ -30.54% │ 0.34       │ rsiDivergency5m │
// │ 171 │ FETUSDT       │ 2024 06 26 21:10:00 │ 2024 06 26 21:30:00 │ LONG         │ -1.05% │ -31.59% │ 1.67       │ rsiDivergency5m │
// │ 172 │ FETUSDT       │ 2024 06 26 21:35:00 │ 2024 06 26 21:45:00 │ LONG         │ -1.05% │ -32.64% │ 1.66       │ rsiDivergency5m │
// │ 173 │ ENSUSDT       │ 2024 06 27 04:30:00 │ 2024 06 27 04:55:00 │ SHORT        │ -1.05% │ -33.69% │ 25.94      │ rsiDivergency5m │
// │ 174 │ BBUSDT        │ 2024 06 27 05:30:00 │ 2024 06 27 13:50:00 │ SHORT        │ 8.25%  │ -25.44% │ 0.47       │ rsiDivergency5m │
// │ 175 │ LISTAUSDT     │ 2024 06 27 11:30:00 │ 2024 06 27 13:15:00 │ LONG         │ -1.05% │ -4.92%  │ 0.70       │ rsiDivergency5m │
// │ 176 │ LEVERUSDT     │ 2024 06 27 14:00:00 │ 2024 06 27 14:05:00 │ SHORT        │ -1.05% │ -26.49% │ 0.00       │ rsiDivergency5m │
// │ 177 │ LEVERUSDT     │ 2024 06 27 14:10:00 │ 2024 06 27 22:30:00 │ SHORT        │ -0.01% │ -26.50% │ 0.00       │ rsiDivergency5m │
// │ 178 │ FETUSDT       │ 2024 06 28 00:10:00 │ 2024 06 28 08:30:00 │ LONG         │ 1.73%  │ -24.78% │ 1.45       │ rsiDivergency5m │
// │ 179 │ BNXUSDT       │ 2024 06 28 09:00:00 │ 2024 06 28 10:00:00 │ LONG         │ -1.05% │ -25.83% │ 1.08       │ rsiDivergency5m │
// │ 180 │ BNXUSDT       │ 2024 06 28 10:15:00 │ 2024 06 28 10:55:00 │ LONG         │ -1.05% │ -26.88% │ 1.06       │ rsiDivergency5m │
// │ 181 │ BNXUSDT       │ 2024 06 28 14:40:00 │ 2024 06 28 15:00:00 │ LONG         │ -1.05% │ -27.93% │ 1.01       │ rsiDivergency5m │
// │ 182 │ BNXUSDT       │ 2024 06 28 16:40:00 │ 2024 06 28 16:55:00 │ LONG         │ -1.05% │ -28.98% │ 0.98       │ rsiDivergency5m │
// │ 183 │ GASUSDT       │ 2024 06 28 17:25:00 │ 2024 06 28 19:20:00 │ LONG         │ -1.05% │ -30.03% │ 3.71       │ rsiDivergency5m │
// │ 184 │ BAKEUSDT      │ 2024 06 28 20:35:00 │ 2024 06 28 22:00:00 │ SHORT        │ -1.05% │ -31.08% │ 0.28       │ rsiDivergency5m │
// │ 185 │ MAVIAUSDT     │ 2024 06 29 06:25:00 │ 2024 06 29 14:45:00 │ SHORT        │ 8.77%  │ -22.30% │ 1.87       │ rsiDivergency5m │
// │ 186 │ BONDUSDT      │ 2024 06 29 15:50:00 │ 2024 06 29 16:15:00 │ LONG         │ -1.05% │ -23.35% │ 2.21       │ rsiDivergency5m │
// │ 187 │ BONDUSDT      │ 2024 06 29 16:20:00 │ 2024 06 29 17:10:00 │ LONG         │ -1.05% │ -24.40% │ 2.19       │ rsiDivergency5m │
// │ 188 │ BLZUSDT       │ 2024 06 29 18:55:00 │ 2024 06 29 19:05:00 │ LONG         │ -1.05% │ -25.45% │ 0.24       │ rsiDivergency5m │
// │ 189 │ ARPAUSDT      │ 2024 06 29 19:15:00 │ 2024 06 29 19:50:00 │ LONG         │ -1.05% │ -26.50% │ 0.04       │ rsiDivergency5m │
// │ 190 │ ARPAUSDT      │ 2024 06 29 19:55:00 │ 2024 06 29 20:00:00 │ LONG         │ -1.05% │ -27.55% │ 0.04       │ rsiDivergency5m │
// │ 191 │ ARPAUSDT      │ 2024 06 29 20:05:00 │ 2024 06 30 03:05:00 │ LONG         │ 9.95%  │ -17.60% │ 0.04       │ rsiDivergency5m │
// │ 192 │ NTRNUSDT      │ 2024 06 30 06:35:00 │ 2024 06 30 07:30:00 │ LONG         │ -1.05% │ -18.65% │ 0.48       │ rsiDivergency5m │
// │ 193 │ UNFIUSDT      │ 2024 06 30 07:50:00 │ 2024 06 30 08:40:00 │ SHORT        │ -1.05% │ -19.70% │ 4.97       │ rsiDivergency5m │
// └─────┴───────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴─────────┴────────────┴─────────────────┘
