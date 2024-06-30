import { mfi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "mfiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"ZECUSDT",
	"ATOMUSDT",
	"VETUSDT",
	"NEOUSDT",
	"ZILUSDT",
	"KNCUSDT",
	"OMGUSDT",
	"DEFIUSDT",
	"RUNEUSDT",
	"EGLDUSDT",
	"FLMUSDT",
	"RENUSDT",
	"NEARUSDT",
	"BELUSDT",
	"AXSUSDT",
	"ZENUSDT",
	"GRTUSDT",
	"CHZUSDT",
	"LITUSDT",
	"UNFIUSDT",
	"CHRUSDT",
	"MANAUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"BAKEUSDT",
	"GTCUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"ENSUSDT",
	"PEOPLEUSDT",
	"ROSEUSDT",
	"DUSKUSDT",
	"IMXUSDT",
	"JASMYUSDT",
	"GALUSDT",
	"STGUSDT",
	"LDOUSDT",
	"FETUSDT",
	"FXSUSDT",
	"RNDRUSDT",
	"MINAUSDT",
	"STXUSDT",
	"BNXUSDT",
	"ACHUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"PERPUSDT",
	"TRUUSDT",
	"ARBUSDT",
	"JOEUSDT",
	"TLMUSDT",
	"RDNTUSDT",
	"EDUUSDT",
	"SUIUSDT",
	"1000FLOKIUSDT",
	"KEYUSDT",
	"COMBOUSDT",
	"XVGUSDT",
	"PENDLEUSDT",
	"ARKMUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"CYBERUSDT",
	"LOOMUSDT",
	"BIGTIMEUSDT",
	"BONDUSDT",
	"POWRUSDT",
	"TOKENUSDT",
	"BADGERUSDT",
	"KASUSDT",
	"BEAMXUSDT",
	"ONGUSDT",
	"JTOUSDT",
	"1000SATSUSDT",
	"1000RATSUSDT",
	"ACEUSDT",
	"MOVRUSDT",
	"XAIUSDT",
	"WIFUSDT",
	"JUPUSDT",
	"STRKUSDT",
	"MAVIAUSDT",
	"TONUSDT",
	"AXLUSDT",
	"VANRYUSDT",
	"BOMEUSDT",
	"WUSDT",
	"BBUSDT",
	"NOTUSDT",
];
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: params.lookBackLength,
	interval: params.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: 1 / 100,
			tp: 10 / 100,
			stgName: STG_NAME,
			pair,
		};

		if (candlestick.length < params.lookBackLength) return response;
		if (ALLOWED_PAIRS.length && !ALLOWED_PAIRS.includes(pair)) return response;

		const MIN_MFI = 20;
		const CANDLESTICK_SIZE = 50;
		const MIN_VOL = 10 / 100;
		const MAX_VOL = 25 / 100;

		const mfiArray = mfi({
			high: candlestick.map((item) => item.high),
			low: candlestick.map((item) => item.low),
			close: candlestick.map((item) => item.close),
			volume: candlestick.map((item) => item.volume),
			period: 14,
		});

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		const volatility = getVolatility({ candlestick });

		if (
			volatility > MIN_VOL &&
			volatility < MAX_VOL &&
			mfiArray[mfiArray.length - 1] <= MIN_MFI &&
			mfiArray[mfiArray.length - 2] <= MIN_MFI &&
			mfiArray[mfiArray.length - 1] > mfiArray[mfiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...mfiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal > MIN_MFI);

			const firstRange = mfiArray.slice(-firstZeroCrossingIndex);
			const secondRange = mfiArray.slice(
				mfiArray.length - CANDLESTICK_SIZE,
				mfiArray.length - firstZeroCrossingIndex
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
			mfiArray[mfiArray.length - 1] >= 100 - MIN_MFI &&
			mfiArray[mfiArray.length - 2] >= 100 - MIN_MFI &&
			mfiArray[mfiArray.length - 1] < mfiArray[mfiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...mfiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal < 100 - MIN_MFI);

			const firstRange = mfiArray.slice(-firstZeroCrossingIndex);
			const secondRange = mfiArray.slice(
				mfiArray.length - CANDLESTICK_SIZE,
				mfiArray.length - firstZeroCrossingIndex
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
// │ 0 │ 1.00% │ 10.00% │ 100            │ 1824      │ -0.04% │ 23.57%  │
// └───┴───────┴────────┴────────────────┴───────────┴────────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬─────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ minDrawdown │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼─────────────┼─────────┼───────────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 170       │ 33.81%    │ -1.05%    │ 12.42% │ -28.19%     │ 20.59%  │ 35.08         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴─────────────┴─────────┴───────────────┘

// Closed positions for the first result:
// ┌─────┬───────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬────────┬────────────┬─────────────────┐
// │     │ pair          │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl │ entryPrice │ stgName         │
// ├─────┼───────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼────────┼────────────┼─────────────────┤
// │   0 │ BBUSDT        │ 2024 05 31 10:45:00 │ 2024 05 31 10:55:00 │ LONG         │ -1.05% │ -1.05% │ 0.61       │ mfiDivergency5m │
// │   1 │ PEOPLEUSDT    │ 2024 05 31 11:40:00 │ 2024 05 31 20:00:00 │ LONG         │ 3.81%  │ 2.76%  │ 0.08       │ mfiDivergency5m │
// │   2 │ JASMYUSDT     │ 2024 05 31 23:05:00 │ 2024 06 01 07:25:00 │ SHORT        │ 6.71%  │ 9.47%  │ 0.04       │ mfiDivergency5m │
// │   3 │ TURBOUSDT     │ 2024 06 01 08:40:00 │ 2024 06 01 10:30:00 │ LONG         │ -1.05% │ 8.42%  │ 0.01       │ mfiDivergency5m │
// │   4 │ MYROUSDT      │ 2024 06 01 13:15:00 │ 2024 06 01 13:20:00 │ SHORT        │ -1.05% │ 7.37%  │ 0.28       │ mfiDivergency5m │
// │   5 │ MYROUSDT      │ 2024 06 01 13:25:00 │ 2024 06 01 13:40:00 │ SHORT        │ -1.05% │ 6.32%  │ 0.28       │ mfiDivergency5m │
// │   6 │ MYROUSDT      │ 2024 06 01 14:00:00 │ 2024 06 01 14:45:00 │ SHORT        │ -1.05% │ 5.27%  │ 0.28       │ mfiDivergency5m │
// │   7 │ MYROUSDT      │ 2024 06 01 15:40:00 │ 2024 06 02 00:00:00 │ SHORT        │ 3.33%  │ 8.60%  │ 0.29       │ mfiDivergency5m │
// │   8 │ REZUSDT       │ 2024 06 02 01:15:00 │ 2024 06 02 01:20:00 │ SHORT        │ -1.05% │ 5.45%  │ 0.17       │ mfiDivergency5m │
// │   9 │ ACEUSDT       │ 2024 06 02 01:30:00 │ 2024 06 02 03:20:00 │ SHORT        │ -1.05% │ 4.40%  │ 6.17       │ mfiDivergency5m │
// │  10 │ AEVOUSDT      │ 2024 06 02 05:50:00 │ 2024 06 02 06:00:00 │ SHORT        │ -1.05% │ 3.35%  │ 1.00       │ mfiDivergency5m │
// │  11 │ BBUSDT        │ 2024 06 02 06:20:00 │ 2024 06 02 06:25:00 │ LONG         │ -1.05% │ 2.30%  │ 0.71       │ mfiDivergency5m │
// │  12 │ VANRYUSDT     │ 2024 06 02 08:05:00 │ 2024 06 02 11:20:00 │ LONG         │ 9.95%  │ 12.25% │ 0.21       │ mfiDivergency5m │
// │  13 │ DYMUSDT       │ 2024 06 02 11:35:00 │ 2024 06 02 18:30:00 │ SHORT        │ -1.05% │ 11.20% │ 3.30       │ mfiDivergency5m │
// │  14 │ KLAYUSDT      │ 2024 06 02 20:50:00 │ 2024 06 02 21:15:00 │ SHORT        │ -1.05% │ 10.15% │ 0.25       │ mfiDivergency5m │
// │  15 │ PORTALUSDT    │ 2024 06 02 21:50:00 │ 2024 06 02 21:55:00 │ SHORT        │ -1.05% │ 9.10%  │ 1.14       │ mfiDivergency5m │
// │  16 │ OMUSDT        │ 2024 06 02 22:05:00 │ 2024 06 02 22:30:00 │ LONG         │ -1.05% │ 8.05%  │ 0.88       │ mfiDivergency5m │
// │  17 │ OMUSDT        │ 2024 06 02 22:45:00 │ 2024 06 03 00:40:00 │ LONG         │ -1.05% │ 7.00%  │ 0.87       │ mfiDivergency5m │
// │  18 │ WIFUSDT       │ 2024 06 03 03:05:00 │ 2024 06 03 05:40:00 │ SHORT        │ -1.05% │ 5.95%  │ 3.43       │ mfiDivergency5m │
// │  19 │ AEVOUSDT      │ 2024 06 03 06:40:00 │ 2024 06 03 09:35:00 │ LONG         │ -1.05% │ 4.90%  │ 0.98       │ mfiDivergency5m │
// │  20 │ CTSIUSDT      │ 2024 06 03 09:50:00 │ 2024 06 03 09:55:00 │ LONG         │ -1.05% │ 3.85%  │ 0.25       │ mfiDivergency5m │
// │  21 │ OMNIUSDT      │ 2024 06 03 10:50:00 │ 2024 06 03 11:45:00 │ SHORT        │ -1.05% │ 2.80%  │ 20.68      │ mfiDivergency5m │
// │  22 │ HIGHUSDT      │ 2024 06 03 12:35:00 │ 2024 06 03 12:40:00 │ LONG         │ -1.05% │ 1.75%  │ 7.04       │ mfiDivergency5m │
// │  23 │ YGGUSDT       │ 2024 06 03 13:25:00 │ 2024 06 03 21:45:00 │ LONG         │ 0.56%  │ 2.31%  │ 1.12       │ mfiDivergency5m │
// │  24 │ HIGHUSDT      │ 2024 06 03 23:05:00 │ 2024 06 04 06:20:00 │ SHORT        │ 9.95%  │ 12.26% │ 6.64       │ mfiDivergency5m │
// │  25 │ TNSRUSDT      │ 2024 06 04 06:30:00 │ 2024 06 04 06:40:00 │ LONG         │ -1.05% │ 11.21% │ 1.30       │ mfiDivergency5m │
// │  26 │ WUSDT         │ 2024 06 04 06:45:00 │ 2024 06 04 15:05:00 │ LONG         │ 1.22%  │ 12.43% │ 0.64       │ mfiDivergency5m │
// │  27 │ DODOXUSDT     │ 2024 06 04 15:10:00 │ 2024 06 04 22:30:00 │ LONG         │ -1.05% │ 11.38% │ 0.22       │ mfiDivergency5m │
// │  28 │ YGGUSDT       │ 2024 06 04 23:10:00 │ 2024 06 05 07:30:00 │ SHORT        │ 0.53%  │ 11.92% │ 1.06       │ mfiDivergency5m │
// │  29 │ TONUSDT       │ 2024 06 05 08:15:00 │ 2024 06 05 16:35:00 │ LONG         │ 1.92%  │ 13.84% │ 7.21       │ mfiDivergency5m │
// │  30 │ LQTYUSDT      │ 2024 06 06 00:40:00 │ 2024 06 06 00:45:00 │ SHORT        │ -1.05% │ 10.69% │ 1.35       │ mfiDivergency5m │
// │  31 │ LQTYUSDT      │ 2024 06 06 01:05:00 │ 2024 06 06 01:35:00 │ SHORT        │ -1.05% │ 9.64%  │ 1.37       │ mfiDivergency5m │
// │  32 │ BBUSDT        │ 2024 06 06 01:50:00 │ 2024 06 06 03:05:00 │ LONG         │ -1.05% │ 8.59%  │ 0.76       │ mfiDivergency5m │
// │  33 │ 1000RATSUSDT  │ 2024 06 06 14:15:00 │ 2024 06 06 14:40:00 │ LONG         │ -1.05% │ 6.49%  │ 0.17       │ mfiDivergency5m │
// │  34 │ JASMYUSDT     │ 2024 06 06 19:55:00 │ 2024 06 07 00:25:00 │ SHORT        │ -1.05% │ 4.39%  │ 0.04       │ mfiDivergency5m │
// │  35 │ CKBUSDT       │ 2024 06 07 01:55:00 │ 2024 06 07 02:05:00 │ SHORT        │ -1.05% │ 3.34%  │ 0.02       │ mfiDivergency5m │
// │  36 │ TRUUSDT       │ 2024 06 07 02:40:00 │ 2024 06 07 03:05:00 │ SHORT        │ -1.05% │ 2.29%  │ 0.20       │ mfiDivergency5m │
// │  37 │ BIGTIMEUSDT   │ 2024 06 07 07:40:00 │ 2024 06 07 12:05:00 │ LONG         │ -1.05% │ 1.24%  │ 0.21       │ mfiDivergency5m │
// │  38 │ 1000FLOKIUSDT │ 2024 06 07 12:45:00 │ 2024 06 07 12:55:00 │ LONG         │ -1.05% │ 0.19%  │ 0.30       │ mfiDivergency5m │
// │  39 │ SUIUSDT       │ 2024 06 07 13:15:00 │ 2024 06 07 21:35:00 │ LONG         │ 6.40%  │ 6.58%  │ 1.03       │ mfiDivergency5m │
// │  40 │ ASTRUSDT      │ 2024 06 07 22:00:00 │ 2024 06 08 02:40:00 │ SHORT        │ -1.05% │ 5.53%  │ 0.09       │ mfiDivergency5m │
// │  41 │ DODOXUSDT     │ 2024 06 08 02:50:00 │ 2024 06 08 11:10:00 │ SHORT        │ 3.16%  │ 8.69%  │ 0.19       │ mfiDivergency5m │
// │  42 │ PHBUSDT       │ 2024 06 08 11:10:00 │ 2024 06 08 11:20:00 │ LONG         │ -1.05% │ 7.64%  │ 2.29       │ mfiDivergency5m │
// │  43 │ MOVRUSDT      │ 2024 06 08 11:30:00 │ 2024 06 08 12:30:00 │ LONG         │ -1.05% │ 6.59%  │ 16.24      │ mfiDivergency5m │
// │  44 │ JASMYUSDT     │ 2024 06 08 14:10:00 │ 2024 06 08 16:55:00 │ LONG         │ -1.05% │ 5.54%  │ 0.04       │ mfiDivergency5m │
// │  45 │ ACEUSDT       │ 2024 06 08 17:30:00 │ 2024 06 09 01:50:00 │ LONG         │ 1.06%  │ 6.60%  │ 4.94       │ mfiDivergency5m │
// │  46 │ NOTUSDT       │ 2024 06 09 08:05:00 │ 2024 06 09 11:15:00 │ SHORT        │ -1.05% │ 5.55%  │ 0.02       │ mfiDivergency5m │
// │  47 │ HIFIUSDT      │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 4.97%  │ 10.47% │ 0.75       │ mfiDivergency5m │
// │  48 │ TOKENUSDT     │ 2024 06 10 09:05:00 │ 2024 06 10 17:25:00 │ LONG         │ 0.56%  │ 11.03% │ 0.13       │ mfiDivergency5m │
// │  49 │ BICOUSDT      │ 2024 06 10 17:30:00 │ 2024 06 10 18:30:00 │ LONG         │ -1.05% │ 9.98%  │ 0.56       │ mfiDivergency5m │
// │  50 │ WUSDT         │ 2024 06 10 18:50:00 │ 2024 06 10 20:50:00 │ LONG         │ -1.05% │ 8.93%  │ 0.55       │ mfiDivergency5m │
// │  51 │ NOTUSDT       │ 2024 06 10 21:20:00 │ 2024 06 10 21:30:00 │ LONG         │ -1.05% │ 7.88%  │ 0.02       │ mfiDivergency5m │
// │  52 │ NOTUSDT       │ 2024 06 10 21:35:00 │ 2024 06 10 22:20:00 │ LONG         │ -1.05% │ 6.83%  │ 0.02       │ mfiDivergency5m │
// │  53 │ JASMYUSDT     │ 2024 06 10 22:15:00 │ 2024 06 10 23:25:00 │ LONG         │ -1.05% │ 5.78%  │ 0.04       │ mfiDivergency5m │
// │  54 │ JASMYUSDT     │ 2024 06 10 23:55:00 │ 2024 06 11 08:15:00 │ LONG         │ -0.38% │ 5.40%  │ 0.04       │ mfiDivergency5m │
// │  55 │ AIUSDT        │ 2024 06 11 08:50:00 │ 2024 06 11 10:30:00 │ LONG         │ -1.05% │ 4.35%  │ 0.92       │ mfiDivergency5m │
// │  56 │ ARUSDT        │ 2024 06 11 10:45:00 │ 2024 06 11 19:05:00 │ LONG         │ 2.60%  │ 6.95%  │ 32.30      │ mfiDivergency5m │
// │  57 │ LPTUSDT       │ 2024 06 11 19:50:00 │ 2024 06 11 20:15:00 │ LONG         │ -1.05% │ 5.90%  │ 19.36      │ mfiDivergency5m │
// │  58 │ OMUSDT        │ 2024 06 11 20:25:00 │ 2024 06 12 04:45:00 │ LONG         │ 4.56%  │ 10.45% │ 0.84       │ mfiDivergency5m │
// │  59 │ OMNIUSDT      │ 2024 06 12 04:55:00 │ 2024 06 12 05:05:00 │ SHORT        │ -1.05% │ 9.40%  │ 15.41      │ mfiDivergency5m │
// │  60 │ FETUSDT       │ 2024 06 12 07:05:00 │ 2024 06 12 07:30:00 │ SHORT        │ -1.05% │ 8.35%  │ 1.62       │ mfiDivergency5m │
// │  61 │ JTOUSDT       │ 2024 06 12 07:45:00 │ 2024 06 12 08:00:00 │ SHORT        │ -1.05% │ 7.30%  │ 3.18       │ mfiDivergency5m │
// │  62 │ BBUSDT        │ 2024 06 12 08:10:00 │ 2024 06 12 14:45:00 │ SHORT        │ 9.95%  │ 17.25% │ 0.57       │ mfiDivergency5m │
// │  63 │ KASUSDT       │ 2024 06 12 14:55:00 │ 2024 06 12 23:15:00 │ LONG         │ 0.84%  │ 18.10% │ 0.17       │ mfiDivergency5m │
// │  64 │ OMNIUSDT      │ 2024 06 12 23:35:00 │ 2024 06 13 00:00:00 │ SHORT        │ -1.05% │ 17.05% │ 15.95      │ mfiDivergency5m │
// │  65 │ BLZUSDT       │ 2024 06 13 00:20:00 │ 2024 06 13 03:30:00 │ SHORT        │ -1.05% │ 16.00% │ 0.27       │ mfiDivergency5m │
// │  66 │ TAOUSDT       │ 2024 06 13 08:00:00 │ 2024 06 13 10:30:00 │ LONG         │ -1.05% │ 14.95% │ 322.30     │ mfiDivergency5m │
// │  67 │ TAOUSDT       │ 2024 06 13 10:45:00 │ 2024 06 13 10:55:00 │ LONG         │ -1.05% │ 13.90% │ 318.99     │ mfiDivergency5m │
// │  68 │ MEMEUSDT      │ 2024 06 13 10:55:00 │ 2024 06 13 19:15:00 │ LONG         │ 2.17%  │ 16.07% │ 0.02       │ mfiDivergency5m │
// │  69 │ KNCUSDT       │ 2024 06 13 19:55:00 │ 2024 06 14 04:15:00 │ LONG         │ 7.82%  │ 23.88% │ 0.72       │ mfiDivergency5m │
// │  70 │ ROSEUSDT      │ 2024 06 14 04:55:00 │ 2024 06 14 05:10:00 │ SHORT        │ -1.05% │ 22.83% │ 0.13       │ mfiDivergency5m │
// │  71 │ ROSEUSDT      │ 2024 06 14 05:20:00 │ 2024 06 14 05:35:00 │ SHORT        │ -1.05% │ 21.78% │ 0.13       │ mfiDivergency5m │
// │  72 │ ROSEUSDT      │ 2024 06 14 05:45:00 │ 2024 06 14 13:20:00 │ SHORT        │ 9.95%  │ 31.73% │ 0.13       │ mfiDivergency5m │
// │  73 │ DYDXUSDT      │ 2024 06 14 13:25:00 │ 2024 06 14 21:45:00 │ LONG         │ 1.81%  │ 33.55% │ 1.50       │ mfiDivergency5m │
// │  74 │ TOKENUSDT     │ 2024 06 14 22:35:00 │ 2024 06 15 01:00:00 │ SHORT        │ -1.05% │ 32.50% │ 0.10       │ mfiDivergency5m │
// │  75 │ HOTUSDT       │ 2024 06 15 01:10:00 │ 2024 06 15 09:30:00 │ SHORT        │ 1.31%  │ 33.81% │ 0.00       │ mfiDivergency5m │
// │  76 │ ROSEUSDT      │ 2024 06 15 14:10:00 │ 2024 06 15 15:20:00 │ LONG         │ -1.05% │ 32.76% │ 0.12       │ mfiDivergency5m │
// │  77 │ XEMUSDT       │ 2024 06 16 01:35:00 │ 2024 06 16 03:45:00 │ LONG         │ -1.05% │ 29.61% │ 0.02       │ mfiDivergency5m │
// │  78 │ BAKEUSDT      │ 2024 06 16 10:40:00 │ 2024 06 16 11:35:00 │ LONG         │ -1.05% │ 28.56% │ 0.45       │ mfiDivergency5m │
// │  79 │ POLYXUSDT     │ 2024 06 16 20:45:00 │ 2024 06 16 21:25:00 │ LONG         │ -1.05% │ 27.51% │ 0.38       │ mfiDivergency5m │
// │  80 │ XEMUSDT       │ 2024 06 16 21:40:00 │ 2024 06 16 21:45:00 │ LONG         │ -1.05% │ 26.46% │ 0.02       │ mfiDivergency5m │
// │  81 │ STMXUSDT      │ 2024 06 16 23:10:00 │ 2024 06 17 00:50:00 │ LONG         │ -1.05% │ 25.41% │ 0.01       │ mfiDivergency5m │
// │  82 │ TRUUSDT       │ 2024 06 17 01:10:00 │ 2024 06 17 01:50:00 │ LONG         │ -1.05% │ 24.36% │ 0.17       │ mfiDivergency5m │
// │  83 │ USTCUSDT      │ 2024 06 17 02:05:00 │ 2024 06 17 02:40:00 │ LONG         │ -1.05% │ 23.31% │ 0.02       │ mfiDivergency5m │
// │  84 │ FETUSDT       │ 2024 06 17 02:45:00 │ 2024 06 17 03:05:00 │ LONG         │ -1.05% │ 22.26% │ 1.34       │ mfiDivergency5m │
// │  85 │ FETUSDT       │ 2024 06 17 03:10:00 │ 2024 06 17 03:25:00 │ LONG         │ -1.05% │ 21.21% │ 1.33       │ mfiDivergency5m │
// │  86 │ LOOMUSDT      │ 2024 06 17 03:40:00 │ 2024 06 17 04:45:00 │ LONG         │ -1.05% │ 20.16% │ 0.06       │ mfiDivergency5m │
// │  87 │ WOOUSDT       │ 2024 06 17 04:55:00 │ 2024 06 17 05:05:00 │ LONG         │ -1.05% │ 19.11% │ 0.23       │ mfiDivergency5m │
// │  88 │ TUSDT         │ 2024 06 17 05:10:00 │ 2024 06 17 11:15:00 │ LONG         │ -1.05% │ 18.06% │ 0.02       │ mfiDivergency5m │
// │  89 │ BEAMXUSDT     │ 2024 06 17 12:10:00 │ 2024 06 17 12:35:00 │ SHORT        │ -1.05% │ 17.01% │ 0.02       │ mfiDivergency5m │
// │  90 │ RUNEUSDT      │ 2024 06 17 12:30:00 │ 2024 06 17 13:00:00 │ SHORT        │ -1.05% │ 15.96% │ 4.40       │ mfiDivergency5m │
// │  91 │ ORDIUSDT      │ 2024 06 17 13:15:00 │ 2024 06 17 13:30:00 │ SHORT        │ -1.05% │ 14.91% │ 42.62      │ mfiDivergency5m │
// │  92 │ JTOUSDT       │ 2024 06 17 13:35:00 │ 2024 06 17 20:40:00 │ SHORT        │ 9.95%  │ 24.86% │ 2.77       │ mfiDivergency5m │
// │  93 │ ACEUSDT       │ 2024 06 17 20:50:00 │ 2024 06 17 21:05:00 │ LONG         │ -1.05% │ 23.81% │ 3.34       │ mfiDivergency5m │
// │  94 │ ACEUSDT       │ 2024 06 17 21:10:00 │ 2024 06 18 05:30:00 │ LONG         │ 5.62%  │ 29.43% │ 3.34       │ mfiDivergency5m │
// │  95 │ ENSUSDT       │ 2024 06 18 05:30:00 │ 2024 06 18 06:10:00 │ LONG         │ -1.05% │ 28.38% │ 22.34      │ mfiDivergency5m │
// │  96 │ APTUSDT       │ 2024 06 18 06:15:00 │ 2024 06 18 06:35:00 │ LONG         │ -1.05% │ 27.33% │ 6.74       │ mfiDivergency5m │
// │  97 │ GMTUSDT       │ 2024 06 18 06:40:00 │ 2024 06 18 07:20:00 │ LONG         │ -1.05% │ 26.28% │ 0.16       │ mfiDivergency5m │
// │  98 │ XEMUSDT       │ 2024 06 18 07:20:00 │ 2024 06 18 08:30:00 │ LONG         │ -1.05% │ 25.23% │ 0.01       │ mfiDivergency5m │
// │  99 │ TWTUSDT       │ 2024 06 18 09:05:00 │ 2024 06 18 17:25:00 │ LONG         │ 2.92%  │ 28.15% │ 0.96       │ mfiDivergency5m │
// │ 100 │ ORBSUSDT      │ 2024 06 18 17:40:00 │ 2024 06 18 19:05:00 │ SHORT        │ -1.05% │ 27.10% │ 0.02       │ mfiDivergency5m │
// │ 101 │ GLMUSDT       │ 2024 06 18 20:35:00 │ 2024 06 18 21:25:00 │ SHORT        │ -1.05% │ 26.05% │ 0.37       │ mfiDivergency5m │
// │ 102 │ BNXUSDT       │ 2024 06 18 22:00:00 │ 2024 06 19 05:40:00 │ SHORT        │ -1.05% │ 25.00% │ 1.05       │ mfiDivergency5m │
// │ 103 │ UNFIUSDT      │ 2024 06 19 06:10:00 │ 2024 06 19 14:30:00 │ LONG         │ 6.47%  │ 31.48% │ 4.20       │ mfiDivergency5m │
// │ 104 │ NMRUSDT       │ 2024 06 20 00:40:00 │ 2024 06 20 00:55:00 │ SHORT        │ -1.05% │ 30.43% │ 19.87      │ mfiDivergency5m │
// │ 105 │ ARKMUSDT      │ 2024 06 20 03:05:00 │ 2024 06 20 05:55:00 │ SHORT        │ -1.05% │ 29.38% │ 1.89       │ mfiDivergency5m │
// │ 106 │ EDUUSDT       │ 2024 06 20 07:25:00 │ 2024 06 20 08:05:00 │ LONG         │ -1.05% │ 28.33% │ 0.63       │ mfiDivergency5m │
// │ 107 │ EDUUSDT       │ 2024 06 20 08:10:00 │ 2024 06 20 08:20:00 │ LONG         │ -1.05% │ 27.28% │ 0.62       │ mfiDivergency5m │
// │ 108 │ 1000FLOKIUSDT │ 2024 06 20 08:25:00 │ 2024 06 20 08:30:00 │ LONG         │ -1.05% │ 26.23% │ 0.18       │ mfiDivergency5m │
// │ 109 │ WLDUSDT       │ 2024 06 20 08:35:00 │ 2024 06 20 08:50:00 │ LONG         │ -1.05% │ 25.18% │ 3.02       │ mfiDivergency5m │
// │ 110 │ RLCUSDT       │ 2024 06 20 08:55:00 │ 2024 06 20 09:00:00 │ LONG         │ -1.05% │ 24.13% │ 2.24       │ mfiDivergency5m │
// │ 111 │ 1000PEPEUSDT  │ 2024 06 20 09:10:00 │ 2024 06 20 09:20:00 │ LONG         │ -1.05% │ 23.08% │ 0.01       │ mfiDivergency5m │
// │ 112 │ ARUSDT        │ 2024 06 20 09:25:00 │ 2024 06 20 09:35:00 │ LONG         │ -1.05% │ 22.03% │ 27.25      │ mfiDivergency5m │
// │ 113 │ NOTUSDT       │ 2024 06 20 09:55:00 │ 2024 06 20 11:00:00 │ LONG         │ -1.05% │ 20.98% │ 0.01       │ mfiDivergency5m │
// │ 114 │ RLCUSDT       │ 2024 06 20 11:25:00 │ 2024 06 20 19:45:00 │ LONG         │ -0.22% │ 20.75% │ 2.17       │ mfiDivergency5m │
// │ 115 │ WUSDT         │ 2024 06 20 21:05:00 │ 2024 06 21 05:00:00 │ SHORT        │ -1.05% │ 19.70% │ 0.35       │ mfiDivergency5m │
// │ 116 │ ZKUSDT        │ 2024 06 21 02:35:00 │ 2024 06 21 02:45:00 │ LONG         │ -1.05% │ 7.55%  │ 0.18       │ mfiDivergency5m │
// │ 117 │ ZKUSDT        │ 2024 06 21 02:50:00 │ 2024 06 21 03:05:00 │ LONG         │ -1.05% │ 6.50%  │ 0.18       │ mfiDivergency5m │
// │ 118 │ CRVUSDT       │ 2024 06 21 10:25:00 │ 2024 06 21 10:35:00 │ LONG         │ -1.05% │ 18.65% │ 0.34       │ mfiDivergency5m │
// │ 119 │ GASUSDT       │ 2024 06 21 12:30:00 │ 2024 06 21 16:30:00 │ LONG         │ -1.05% │ 17.60% │ 3.84       │ mfiDivergency5m │
// │ 120 │ AXLUSDT       │ 2024 06 21 16:35:00 │ 2024 06 21 18:20:00 │ LONG         │ -1.05% │ 16.55% │ 0.61       │ mfiDivergency5m │
// │ 121 │ AXLUSDT       │ 2024 06 21 18:45:00 │ 2024 06 21 19:20:00 │ LONG         │ -1.05% │ 15.50% │ 0.61       │ mfiDivergency5m │
// │ 122 │ AXLUSDT       │ 2024 06 21 19:30:00 │ 2024 06 21 19:40:00 │ LONG         │ -1.05% │ 14.45% │ 0.60       │ mfiDivergency5m │
// │ 123 │ ARKMUSDT      │ 2024 06 21 19:40:00 │ 2024 06 22 04:00:00 │ LONG         │ 2.24%  │ 16.70% │ 1.88       │ mfiDivergency5m │
// │ 124 │ UNFIUSDT      │ 2024 06 22 04:05:00 │ 2024 06 22 10:00:00 │ LONG         │ -1.05% │ 15.65% │ 4.14       │ mfiDivergency5m │
// │ 125 │ SAGAUSDT      │ 2024 06 22 12:25:00 │ 2024 06 22 12:35:00 │ SHORT        │ -1.05% │ 14.60% │ 1.49       │ mfiDivergency5m │
// │ 126 │ TURBOUSDT     │ 2024 06 22 15:30:00 │ 2024 06 22 18:55:00 │ LONG         │ -1.05% │ 13.55% │ 0.01       │ mfiDivergency5m │
// │ 127 │ TURBOUSDT     │ 2024 06 22 19:05:00 │ 2024 06 22 21:35:00 │ LONG         │ -1.05% │ 12.50% │ 0.01       │ mfiDivergency5m │
// │ 128 │ PEOPLEUSDT    │ 2024 06 22 23:50:00 │ 2024 06 22 23:55:00 │ SHORT        │ -1.05% │ 11.45% │ 0.09       │ mfiDivergency5m │
// │ 129 │ UNFIUSDT      │ 2024 06 23 08:10:00 │ 2024 06 23 08:30:00 │ LONG         │ -1.05% │ 10.40% │ 4.76       │ mfiDivergency5m │
// │ 130 │ BBUSDT        │ 2024 06 23 08:55:00 │ 2024 06 23 09:15:00 │ LONG         │ -1.05% │ 9.35%  │ 0.39       │ mfiDivergency5m │
// │ 131 │ VANRYUSDT     │ 2024 06 23 10:50:00 │ 2024 06 23 11:45:00 │ LONG         │ -1.05% │ 8.30%  │ 0.14       │ mfiDivergency5m │
// │ 132 │ NTRNUSDT      │ 2024 06 23 12:00:00 │ 2024 06 23 15:25:00 │ LONG         │ -1.05% │ 7.25%  │ 0.47       │ mfiDivergency5m │
// │ 133 │ GMXUSDT       │ 2024 06 23 15:35:00 │ 2024 06 23 18:35:00 │ LONG         │ -1.05% │ 6.20%  │ 27.52      │ mfiDivergency5m │
// │ 134 │ REEFUSDT      │ 2024 06 23 19:50:00 │ 2024 06 24 04:10:00 │ SHORT        │ 2.02%  │ 8.21%  │ 0.00       │ mfiDivergency5m │
// │ 135 │ FRONTUSDT     │ 2024 06 24 05:45:00 │ 2024 06 24 14:05:00 │ SHORT        │ -0.29% │ 7.92%  │ 0.82       │ mfiDivergency5m │
// │ 136 │ 1000RATSUSDT  │ 2024 06 24 15:40:00 │ 2024 06 24 20:50:00 │ LONG         │ 9.95%  │ 17.87% │ 0.10       │ mfiDivergency5m │
// │ 137 │ ZKUSDT        │ 2024 06 24 19:50:00 │ 2024 06 24 19:55:00 │ LONG         │ -1.05% │ 12.79% │ 0.17       │ mfiDivergency5m │
// │ 138 │ ZKUSDT        │ 2024 06 24 20:05:00 │ 2024 06 25 01:10:00 │ LONG         │ -1.05% │ 11.74% │ 0.17       │ mfiDivergency5m │
// │ 139 │ RSRUSDT       │ 2024 06 24 20:50:00 │ 2024 06 24 22:10:00 │ SHORT        │ -1.05% │ 16.82% │ 0.01       │ mfiDivergency5m │
// │ 140 │ RNDRUSDT      │ 2024 06 24 22:20:00 │ 2024 06 24 22:30:00 │ SHORT        │ -1.05% │ 15.77% │ 7.71       │ mfiDivergency5m │
// │ 141 │ RNDRUSDT      │ 2024 06 24 22:40:00 │ 2024 06 25 07:00:00 │ SHORT        │ 0.56%  │ 16.33% │ 7.85       │ mfiDivergency5m │
// │ 142 │ JUPUSDT       │ 2024 06 25 07:10:00 │ 2024 06 25 15:30:00 │ LONG         │ 2.86%  │ 19.19% │ 0.80       │ mfiDivergency5m │
// │ 143 │ MKRUSDT       │ 2024 06 25 15:40:00 │ 2024 06 25 18:10:00 │ LONG         │ -1.05% │ 18.14% │ 2383.70    │ mfiDivergency5m │
// │ 144 │ ZKUSDT        │ 2024 06 25 18:20:00 │ 2024 06 25 19:40:00 │ LONG         │ -1.05% │ 5.44%  │ 0.17       │ mfiDivergency5m │
// │ 145 │ TURBOUSDT     │ 2024 06 25 20:05:00 │ 2024 06 25 23:45:00 │ LONG         │ -1.05% │ 17.09% │ 0.01       │ mfiDivergency5m │
// │ 146 │ ONGUSDT       │ 2024 06 26 12:10:00 │ 2024 06 26 20:30:00 │ LONG         │ 1.21%  │ 18.30% │ 0.34       │ mfiDivergency5m │
// │ 147 │ BIGTIMEUSDT   │ 2024 06 27 00:55:00 │ 2024 06 27 01:45:00 │ LONG         │ -1.05% │ 17.25% │ 0.11       │ mfiDivergency5m │
// │ 148 │ ENSUSDT       │ 2024 06 27 05:25:00 │ 2024 06 27 07:20:00 │ SHORT        │ -1.05% │ 16.20% │ 26.25      │ mfiDivergency5m │
// │ 149 │ JUPUSDT       │ 2024 06 27 08:20:00 │ 2024 06 27 08:35:00 │ SHORT        │ -1.05% │ 15.15% │ 0.85       │ mfiDivergency5m │
// │ 150 │ 1000BONKUSDT  │ 2024 06 27 09:10:00 │ 2024 06 27 09:20:00 │ SHORT        │ -1.05% │ 14.10% │ 0.02       │ mfiDivergency5m │
// │ 151 │ LISTAUSDT     │ 2024 06 27 09:15:00 │ 2024 06 27 09:50:00 │ LONG         │ -1.05% │ 7.54%  │ 0.74       │ mfiDivergency5m │
// │ 152 │ JTOUSDT       │ 2024 06 27 11:25:00 │ 2024 06 27 12:50:00 │ LONG         │ -1.05% │ 13.05% │ 2.54       │ mfiDivergency5m │
// │ 153 │ FETUSDT       │ 2024 06 27 13:30:00 │ 2024 06 27 13:50:00 │ LONG         │ -1.05% │ 12.00% │ 1.53       │ mfiDivergency5m │
// │ 154 │ JTOUSDT       │ 2024 06 27 15:05:00 │ 2024 06 27 23:25:00 │ LONG         │ -0.47% │ 11.53% │ 2.50       │ mfiDivergency5m │
// │ 155 │ IOUSDT        │ 2024 06 27 23:10:00 │ 2024 06 27 23:20:00 │ LONG         │ -1.05% │ 31.71% │ 3.56       │ mfiDivergency5m │
// │ 156 │ LSKUSDT       │ 2024 06 28 00:40:00 │ 2024 06 28 09:00:00 │ LONG         │ 1.43%  │ 12.97% │ 1.05       │ mfiDivergency5m │
// │ 157 │ IOUSDT        │ 2024 06 28 03:10:00 │ 2024 06 28 05:15:00 │ LONG         │ -1.05% │ 30.66% │ 3.45       │ mfiDivergency5m │
// │ 158 │ BNXUSDT       │ 2024 06 28 10:55:00 │ 2024 06 28 11:05:00 │ LONG         │ -1.05% │ 11.92% │ 1.05       │ mfiDivergency5m │
// │ 159 │ JTOUSDT       │ 2024 06 28 12:10:00 │ 2024 06 28 12:35:00 │ LONG         │ -1.05% │ 10.87% │ 2.33       │ mfiDivergency5m │
// │ 160 │ ENAUSDT       │ 2024 06 28 12:50:00 │ 2024 06 28 16:00:00 │ LONG         │ -1.05% │ 9.82%  │ 0.52       │ mfiDivergency5m │
// │ 161 │ CHRUSDT       │ 2024 06 28 16:35:00 │ 2024 06 28 19:15:00 │ LONG         │ -1.05% │ 8.77%  │ 0.22       │ mfiDivergency5m │
// │ 162 │ XEMUSDT       │ 2024 06 29 09:25:00 │ 2024 06 29 14:30:00 │ LONG         │ -1.05% │ 7.72%  │ 0.01       │ mfiDivergency5m │
// │ 163 │ XEMUSDT       │ 2024 06 29 14:40:00 │ 2024 06 29 15:40:00 │ LONG         │ -1.05% │ 6.67%  │ 0.01       │ mfiDivergency5m │
// │ 164 │ XEMUSDT       │ 2024 06 29 15:50:00 │ 2024 06 29 17:10:00 │ LONG         │ -1.05% │ 5.62%  │ 0.01       │ mfiDivergency5m │
// │ 165 │ BNXUSDT       │ 2024 06 29 17:25:00 │ 2024 06 30 01:10:00 │ LONG         │ 9.95%  │ 15.57% │ 0.66       │ mfiDivergency5m │
// │ 166 │ NTRNUSDT      │ 2024 06 30 02:25:00 │ 2024 06 30 02:35:00 │ SHORT        │ -1.05% │ 14.52% │ 0.52       │ mfiDivergency5m │
// │ 167 │ UNFIUSDT      │ 2024 06 30 07:20:00 │ 2024 06 30 07:40:00 │ SHORT        │ -1.05% │ 13.47% │ 4.86       │ mfiDivergency5m │
// │ 168 │ BNXUSDT       │ 2024 06 30 08:45:00 │ 2024 06 30 09:05:00 │ SHORT        │ -1.05% │ 12.42% │ 0.84       │ mfiDivergency5m │
// │ 169 │ ZROUSDT       │ 2024 06 30 10:20:00 │ 2024 06 30 10:20:00 │ SHORT        │ -0.05% │ 5.50%  │ 3.29       │ mfiDivergency5m │
// └─────┴───────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴────────┴────────────┴─────────────────┘
