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
			sl: params.defaultSL,
			tp: params.defaultTP,
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
// ┌───┬───────┬────────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼────────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 2359      │ 0.10% │ 27.30%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬─────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ minDrawdown │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼─────────────┼─────────┼───────────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 527       │ 48.05%    │ -1.44%    │ 41.40% │ -7.89%      │ 23.34%  │ 32.47         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴─────────────┴─────────┴───────────────┘

// ┌─────┬───────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬────────┬────────────┬─────────────────┐
// │     │ pair          │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl │ entryPrice │ stgName         │
// ├─────┼───────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼────────┼────────────┼─────────────────┤
// │   0 │ PENDLEUSDT    │ 2024 04 06 22:35:00 │ 2024 04 07 06:55:00 │ LONG         │ 0.14%  │ 0.14%  │ 6.53       │ mfiDivergency5m │
// │   1 │ 1000RATSUSDT  │ 2024 04 07 17:05:00 │ 2024 04 07 19:20:00 │ LONG         │ -0.26% │ -1.18% │ 0.28       │ mfiDivergency5m │
// │   2 │ ZENUSDT       │ 2024 04 08 02:25:00 │ 2024 04 08 10:45:00 │ LONG         │ 0.91%  │ -0.53% │ 11.90      │ mfiDivergency5m │
// │   3 │ TONUSDT       │ 2024 04 08 15:10:00 │ 2024 04 08 15:30:00 │ SHORT        │ -0.26% │ -0.79% │ 6.28       │ mfiDivergency5m │
// │   4 │ ACHUSDT       │ 2024 04 08 15:15:00 │ 2024 04 08 20:10:00 │ LONG         │ -0.26% │ -1.05% │ 0.04       │ mfiDivergency5m │
// │   5 │ FLMUSDT       │ 2024 04 08 21:00:00 │ 2024 04 08 21:20:00 │ LONG         │ -0.26% │ -1.31% │ 0.15       │ mfiDivergency5m │
// │   6 │ PEOPLEUSDT    │ 2024 04 08 21:40:00 │ 2024 04 09 06:00:00 │ SHORT        │ 1.74%  │ 0.42%  │ 0.04       │ mfiDivergency5m │
// │   7 │ LDOUSDT       │ 2024 04 09 12:15:00 │ 2024 04 09 14:00:00 │ LONG         │ -0.26% │ -0.10% │ 2.73       │ mfiDivergency5m │
// │   8 │ WUSDT         │ 2024 04 09 15:40:00 │ 2024 04 09 16:00:00 │ LONG         │ -0.26% │ -0.36% │ 0.86       │ mfiDivergency5m │
// │   9 │ SSVUSDT       │ 2024 04 09 17:10:00 │ 2024 04 09 18:25:00 │ LONG         │ -0.26% │ -0.63% │ 49.23      │ mfiDivergency5m │
// │  10 │ LDOUSDT       │ 2024 04 09 18:55:00 │ 2024 04 09 20:20:00 │ LONG         │ -0.26% │ -0.89% │ 2.68       │ rsiDivergency5m │
// │  11 │ EDUUSDT       │ 2024 04 09 20:40:00 │ 2024 04 09 21:45:00 │ LONG         │ -0.26% │ -1.15% │ 0.86       │ mfiDivergency5m │
// │  12 │ XAIUSDT       │ 2024 04 09 22:10:00 │ 2024 04 10 06:30:00 │ LONG         │ 0.54%  │ -0.61% │ 1.01       │ mfiDivergency5m │
// │  13 │ NEOUSDT       │ 2024 04 10 18:25:00 │ 2024 04 10 18:35:00 │ SHORT        │ -0.26% │ 0.45%  │ 20.91      │ mfiDivergency5m │
// │  14 │ AXLUSDT       │ 2024 04 10 22:15:00 │ 2024 04 10 22:35:00 │ SHORT        │ -0.26% │ 0.18%  │ 1.44       │ rsiDivergency5m │
// │  15 │ AXLUSDT       │ 2024 04 10 22:45:00 │ 2024 04 11 07:05:00 │ SHORT        │ 1.68%  │ 1.86%  │ 1.46       │ rsiDivergency5m │
// │  16 │ CKBUSDT       │ 2024 04 11 06:50:00 │ 2024 04 11 07:10:00 │ LONG         │ -0.26% │ 1.60%  │ 0.03       │ mfiDivergency5m │
// │  17 │ PERPUSDT      │ 2024 04 11 09:30:00 │ 2024 04 11 11:00:00 │ LONG         │ 2.49%  │ 4.09%  │ 1.45       │ mfiDivergency5m │
// │  18 │ CKBUSDT       │ 2024 04 11 11:20:00 │ 2024 04 11 13:05:00 │ LONG         │ -0.26% │ 3.82%  │ 0.03       │ mfiDivergency5m │
// │  19 │ CKBUSDT       │ 2024 04 11 13:10:00 │ 2024 04 11 14:00:00 │ LONG         │ -0.26% │ 3.56%  │ 0.03       │ mfiDivergency5m │
// │  20 │ NEOUSDT       │ 2024 04 11 13:40:00 │ 2024 04 11 14:00:00 │ LONG         │ -0.26% │ 3.30%  │ 21.70      │ mfiDivergency5m │
// │  21 │ NEOUSDT       │ 2024 04 11 14:05:00 │ 2024 04 11 22:25:00 │ LONG         │ 0.39%  │ 3.69%  │ 21.40      │ mfiDivergency5m │
// │  22 │ TRUUSDT       │ 2024 04 12 01:15:00 │ 2024 04 12 02:45:00 │ LONG         │ -0.26% │ 3.43%  │ 0.13       │ mfiDivergency5m │
// │  23 │ AEVOUSDT      │ 2024 04 12 08:10:00 │ 2024 04 12 08:20:00 │ LONG         │ -0.26% │ 3.17%  │ 2.20       │ rsiDivergency5m │
// │  24 │ CYBERUSDT     │ 2024 04 12 08:25:00 │ 2024 04 12 09:10:00 │ LONG         │ -0.26% │ 2.64%  │ 12.21      │ mfiDivergency5m │
// │  25 │ WUSDT         │ 2024 04 12 08:25:00 │ 2024 04 12 08:35:00 │ LONG         │ -0.26% │ 2.91%  │ 0.73       │ mfiDivergency5m │
// │  26 │ CYBERUSDT     │ 2024 04 12 09:45:00 │ 2024 04 12 10:00:00 │ LONG         │ -0.26% │ 2.38%  │ 11.88      │ mfiDivergency5m │
// │  27 │ CYBERUSDT     │ 2024 04 12 10:10:00 │ 2024 04 12 11:20:00 │ LONG         │ -0.26% │ 2.12%  │ 11.75      │ mfiDivergency5m │
// │  28 │ XAIUSDT       │ 2024 04 12 11:35:00 │ 2024 04 12 12:00:00 │ LONG         │ -0.26% │ 1.86%  │ 0.93       │ mfiDivergency5m │
// │  29 │ XAIUSDT       │ 2024 04 12 12:05:00 │ 2024 04 12 12:20:00 │ LONG         │ -0.26% │ 1.59%  │ 0.93       │ mfiDivergency5m │
// │  30 │ 1000PEPEUSDT  │ 2024 04 12 12:10:00 │ 2024 04 12 12:20:00 │ LONG         │ -0.26% │ 1.33%  │ 0.01       │ rsiDivergency5m │
// │  31 │ JASMYUSDT     │ 2024 04 12 12:15:00 │ 2024 04 12 12:20:00 │ LONG         │ -0.26% │ 1.07%  │ 0.02       │ mfiDivergency5m │
// │  32 │ DEFIUSDT      │ 2024 04 12 12:35:00 │ 2024 04 12 12:55:00 │ LONG         │ -0.26% │ 0.54%  │ 1063.00    │ mfiDivergency5m │
// │  33 │ DODOXUSDT     │ 2024 04 12 12:35:00 │ 2024 04 12 13:00:00 │ LONG         │ -0.26% │ 0.81%  │ 0.21       │ mfiDivergency5m │
// │  34 │ SKLUSDT       │ 2024 04 12 13:05:00 │ 2024 04 12 13:15:00 │ LONG         │ -0.26% │ 0.28%  │ 0.10       │ rsiDivergency5m │
// │  35 │ RSRUSDT       │ 2024 04 12 13:20:00 │ 2024 04 12 13:25:00 │ LONG         │ -0.26% │ 0.02%  │ 0.01       │ rsiDivergency5m │
// │  36 │ ZECUSDT       │ 2024 04 12 13:20:00 │ 2024 04 12 13:25:00 │ LONG         │ -0.26% │ -0.24% │ 24.76      │ rsiDivergency5m │
// │  37 │ XVSUSDT       │ 2024 04 12 15:55:00 │ 2024 04 12 17:40:00 │ LONG         │ -0.26% │ -0.51% │ 13.46      │ rsiDivergency5m │
// │  38 │ ONGUSDT       │ 2024 04 12 18:10:00 │ 2024 04 12 18:40:00 │ LONG         │ -0.26% │ -0.77% │ 0.50       │ mfiDivergency5m │
// │  39 │ CAKEUSDT      │ 2024 04 13 03:30:00 │ 2024 04 13 07:35:00 │ SHORT        │ -0.26% │ -0.04% │ 3.26       │ rsiDivergency5m │
// │  40 │ ARPAUSDT      │ 2024 04 13 07:50:00 │ 2024 04 13 08:05:00 │ SHORT        │ -0.26% │ -0.30% │ 0.09       │ mfiDivergency5m │
// │  41 │ ARPAUSDT      │ 2024 04 13 08:10:00 │ 2024 04 13 12:15:00 │ SHORT        │ 2.49%  │ 2.18%  │ 0.09       │ rsiDivergency5m │
// │  42 │ CKBUSDT       │ 2024 04 13 12:30:00 │ 2024 04 13 12:35:00 │ LONG         │ -0.26% │ 1.92%  │ 0.02       │ mfiDivergency5m │
// │  43 │ LDOUSDT       │ 2024 04 13 12:40:00 │ 2024 04 13 13:05:00 │ LONG         │ -0.26% │ 1.66%  │ 1.92       │ mfiDivergency5m │
// │  44 │ OPUSDT        │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.26% │ 1.13%  │ 2.07       │ rsiDivergency5m │
// │  45 │ STRKUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.26% │ 1.40%  │ 1.28       │ rsiDivergency5m │
// │  46 │ RONINUSDT     │ 2024 04 14 02:00:00 │ 2024 04 14 03:15:00 │ SHORT        │ -0.26% │ 1.43%  │ 3.10       │ rsiDivergency5m │
// │  47 │ RONINUSDT     │ 2024 04 14 03:40:00 │ 2024 04 14 08:05:00 │ SHORT        │ -0.26% │ 1.16%  │ 3.15       │ rsiDivergency5m │
// │  48 │ NEOUSDT       │ 2024 04 14 07:30:00 │ 2024 04 14 15:50:00 │ SHORT        │ 1.45%  │ 2.62%  │ 18.54      │ mfiDivergency5m │
// │  49 │ SUPERUSDT     │ 2024 04 14 17:55:00 │ 2024 04 14 18:10:00 │ SHORT        │ -0.26% │ 2.36%  │ 0.96       │ rsiDivergency5m │
// │  50 │ BIGTIMEUSDT   │ 2024 04 14 18:10:00 │ 2024 04 14 18:20:00 │ SHORT        │ -0.26% │ 2.09%  │ 0.20       │ mfiDivergency5m │
// │  51 │ LDOUSDT       │ 2024 04 14 18:10:00 │ 2024 04 15 02:30:00 │ SHORT        │ 0.12%  │ 2.21%  │ 2.15       │ mfiDivergency5m │
// │  52 │ PHBUSDT       │ 2024 04 15 02:40:00 │ 2024 04 15 02:45:00 │ SHORT        │ -0.26% │ 1.95%  │ 1.61       │ rsiDivergency5m │
// │  53 │ CAKEUSDT      │ 2024 04 15 03:05:00 │ 2024 04 15 03:25:00 │ SHORT        │ -0.26% │ 1.69%  │ 2.96       │ rsiDivergency5m │
// │  54 │ RDNTUSDT      │ 2024 04 15 03:25:00 │ 2024 04 15 05:55:00 │ SHORT        │ -0.26% │ 1.42%  │ 0.23       │ rsiDivergency5m │
// │  55 │ OMGUSDT       │ 2024 04 15 05:30:00 │ 2024 04 15 13:15:00 │ SHORT        │ 2.49%  │ 3.91%  │ 0.69       │ mfiDivergency5m │
// │  56 │ JTOUSDT       │ 2024 04 15 14:05:00 │ 2024 04 15 19:25:00 │ LONG         │ -0.26% │ 3.65%  │ 2.65       │ mfiDivergency5m │
// │  57 │ CHZUSDT       │ 2024 04 15 18:55:00 │ 2024 04 15 19:20:00 │ LONG         │ -0.26% │ 3.39%  │ 0.10       │ mfiDivergency5m │
// │  58 │ DEFIUSDT      │ 2024 04 15 19:50:00 │ 2024 04 15 23:10:00 │ LONG         │ -0.26% │ 3.12%  │ 849.60     │ mfiDivergency5m │
// │  59 │ ONGUSDT       │ 2024 04 16 02:30:00 │ 2024 04 16 03:10:00 │ SHORT        │ -0.26% │ 2.86%  │ 0.54       │ mfiDivergency5m │
// │  60 │ MINAUSDT      │ 2024 04 16 03:00:00 │ 2024 04 16 04:25:00 │ SHORT        │ -0.26% │ 2.60%  │ 0.77       │ mfiDivergency5m │
// │  61 │ TAOUSDT       │ 2024 04 16 07:40:00 │ 2024 04 16 10:40:00 │ LONG         │ -0.26% │ 0.16%  │ 460.81     │ rsiDivergency5m │
// │  62 │ BEAMXUSDT     │ 2024 04 16 08:25:00 │ 2024 04 16 08:30:00 │ LONG         │ -0.26% │ 2.34%  │ 0.03       │ mfiDivergency5m │
// │  63 │ BEAMXUSDT     │ 2024 04 16 08:35:00 │ 2024 04 16 08:50:00 │ LONG         │ -0.26% │ 2.07%  │ 0.03       │ mfiDivergency5m │
// │  64 │ BEAMXUSDT     │ 2024 04 16 08:55:00 │ 2024 04 16 09:10:00 │ LONG         │ -0.26% │ 1.81%  │ 0.03       │ mfiDivergency5m │
// │  65 │ ENAUSDT       │ 2024 04 16 10:40:00 │ 2024 04 16 16:25:00 │ LONG         │ 2.49%  │ 4.30%  │ 0.90       │ rsiDivergency5m │
// │  66 │ TOKENUSDT     │ 2024 04 16 16:50:00 │ 2024 04 17 01:10:00 │ SHORT        │ 0.78%  │ 5.07%  │ 0.11       │ mfiDivergency5m │
// │  67 │ ARKMUSDT      │ 2024 04 17 07:40:00 │ 2024 04 17 09:15:00 │ LONG         │ -0.26% │ 4.81%  │ 1.47       │ mfiDivergency5m │
// │  68 │ HIFIUSDT      │ 2024 04 17 09:25:00 │ 2024 04 17 09:35:00 │ LONG         │ -0.26% │ 4.55%  │ 0.77       │ rsiDivergency5m │
// │  69 │ RUNEUSDT      │ 2024 04 17 09:25:00 │ 2024 04 17 09:35:00 │ LONG         │ -0.26% │ 4.29%  │ 4.74       │ rsiDivergency5m │
// │  70 │ 1000RATSUSDT  │ 2024 04 17 13:45:00 │ 2024 04 17 22:05:00 │ SHORT        │ 0.43%  │ 4.45%  │ 0.13       │ rsiDivergency5m │
// │  71 │ TRUUSDT       │ 2024 04 17 22:00:00 │ 2024 04 17 23:05:00 │ LONG         │ -0.26% │ 4.19%  │ 0.11       │ mfiDivergency5m │
// │  72 │ SUIUSDT       │ 2024 04 17 23:25:00 │ 2024 04 18 01:00:00 │ LONG         │ -0.26% │ 3.93%  │ 1.26       │ mfiDivergency5m │
// │  73 │ RUNEUSDT      │ 2024 04 18 01:45:00 │ 2024 04 18 10:05:00 │ LONG         │ 2.19%  │ 5.85%  │ 4.39       │ mfiDivergency5m │
// │  74 │ ENAUSDT       │ 2024 04 18 02:05:00 │ 2024 04 18 02:30:00 │ LONG         │ -0.26% │ 3.66%  │ 0.85       │ rsiDivergency5m │
// │  75 │ ACHUSDT       │ 2024 04 18 11:40:00 │ 2024 04 18 20:00:00 │ SHORT        │ 1.05%  │ 6.90%  │ 0.03       │ mfiDivergency5m │
// │  76 │ NEOUSDT       │ 2024 04 18 19:50:00 │ 2024 04 18 21:05:00 │ SHORT        │ 2.49%  │ 9.39%  │ 19.57      │ mfiDivergency5m │
// │  77 │ ARPAUSDT      │ 2024 04 18 21:35:00 │ 2024 04 18 21:45:00 │ LONG         │ -0.26% │ 9.12%  │ 0.06       │ mfiDivergency5m │
// │  78 │ AXSUSDT       │ 2024 04 18 21:40:00 │ 2024 04 18 21:45:00 │ LONG         │ -0.26% │ 8.86%  │ 6.54       │ mfiDivergency5m │
// │  79 │ XAIUSDT       │ 2024 04 19 00:20:00 │ 2024 04 19 08:40:00 │ LONG         │ 1.66%  │ 10.25% │ 0.66       │ mfiDivergency5m │
// │  80 │ JUPUSDT       │ 2024 04 19 12:50:00 │ 2024 04 19 21:10:00 │ SHORT        │ 0.95%  │ 11.20% │ 1.09       │ mfiDivergency5m │
// │  81 │ TAOUSDT       │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.99%  │ 0.22%  │ 433.10     │ rsiDivergency5m │
// │  82 │ MTLUSDT       │ 2024 04 19 21:30:00 │ 2024 04 19 23:35:00 │ SHORT        │ -0.26% │ 10.94% │ 1.65       │ mfiDivergency5m │
// │  83 │ WIFUSDT       │ 2024 04 20 05:30:00 │ 2024 04 20 12:25:00 │ LONG         │ 2.49%  │ 13.43% │ 2.74       │ mfiDivergency5m │
// │  84 │ XAIUSDT       │ 2024 04 20 12:30:00 │ 2024 04 20 18:25:00 │ SHORT        │ -0.26% │ 13.17% │ 0.76       │ rsiDivergency5m │
// │  85 │ TAOUSDT       │ 2024 04 20 15:10:00 │ 2024 04 20 23:30:00 │ SHORT        │ 0.55%  │ 1.69%  │ 489.80     │ rsiDivergency5m │
// │  86 │ MOVRUSDT      │ 2024 04 20 19:40:00 │ 2024 04 21 04:00:00 │ LONG         │ -0.06% │ 13.11% │ 13.75      │ mfiDivergency5m │
// │  87 │ ARKMUSDT      │ 2024 04 21 05:50:00 │ 2024 04 21 06:00:00 │ SHORT        │ -0.26% │ 12.85% │ 2.17       │ mfiDivergency5m │
// │  88 │ ONGUSDT       │ 2024 04 21 06:55:00 │ 2024 04 21 07:00:00 │ SHORT        │ -0.26% │ 12.58% │ 0.70       │ rsiDivergency5m │
// │  89 │ ONGUSDT       │ 2024 04 21 07:05:00 │ 2024 04 21 07:45:00 │ SHORT        │ -0.26% │ 12.32% │ 0.71       │ rsiDivergency5m │
// │  90 │ ONGUSDT       │ 2024 04 21 07:50:00 │ 2024 04 21 07:55:00 │ SHORT        │ -0.26% │ 12.06% │ 0.73       │ rsiDivergency5m │
// │  91 │ ONGUSDT       │ 2024 04 21 08:00:00 │ 2024 04 21 08:05:00 │ SHORT        │ -0.26% │ 11.80% │ 0.76       │ rsiDivergency5m │
// │  92 │ ONGUSDT       │ 2024 04 21 08:10:00 │ 2024 04 21 09:30:00 │ SHORT        │ -0.26% │ 11.53% │ 0.76       │ rsiDivergency5m │
// │  93 │ CKBUSDT       │ 2024 04 21 09:25:00 │ 2024 04 21 09:35:00 │ LONG         │ -0.26% │ 11.27% │ 0.02       │ mfiDivergency5m │
// │  94 │ CKBUSDT       │ 2024 04 21 09:40:00 │ 2024 04 21 11:05:00 │ LONG         │ -0.26% │ 11.01% │ 0.02       │ mfiDivergency5m │
// │  95 │ 1000PEPEUSDT  │ 2024 04 21 11:40:00 │ 2024 04 21 20:00:00 │ LONG         │ 1.58%  │ 12.59% │ 0.01       │ rsiDivergency5m │
// │  96 │ 1000PEPEUSDT  │ 2024 04 21 23:30:00 │ 2024 04 21 23:55:00 │ SHORT        │ -0.26% │ 12.33% │ 0.01       │ rsiDivergency5m │
// │  97 │ 1000PEPEUSDT  │ 2024 04 22 00:00:00 │ 2024 04 22 00:10:00 │ SHORT        │ -0.26% │ 12.06% │ 0.01       │ rsiDivergency5m │
// │  98 │ MAVIAUSDT     │ 2024 04 22 04:50:00 │ 2024 04 22 04:55:00 │ SHORT        │ -0.26% │ 11.80% │ 3.99       │ mfiDivergency5m │
// │  99 │ MAVIAUSDT     │ 2024 04 22 05:35:00 │ 2024 04 22 05:45:00 │ SHORT        │ -0.26% │ 11.54% │ 4.15       │ mfiDivergency5m │
// │ 100 │ MAVIAUSDT     │ 2024 04 22 07:35:00 │ 2024 04 22 07:45:00 │ LONG         │ -0.26% │ 11.28% │ 3.93       │ mfiDivergency5m │
// │ 101 │ PENDLEUSDT    │ 2024 04 22 08:10:00 │ 2024 04 22 16:30:00 │ SHORT        │ 1.10%  │ 12.37% │ 6.80       │ mfiDivergency5m │
// │ 102 │ 1000SATSUSDT  │ 2024 04 22 23:25:00 │ 2024 04 22 23:45:00 │ LONG         │ -0.26% │ 12.11% │ 0.00       │ mfiDivergency5m │
// │ 103 │ TONUSDT       │ 2024 04 23 02:05:00 │ 2024 04 23 03:05:00 │ LONG         │ -0.26% │ 11.85% │ 5.56       │ mfiDivergency5m │
// │ 104 │ 1000RATSUSDT  │ 2024 04 23 03:15:00 │ 2024 04 23 11:35:00 │ LONG         │ 1.28%  │ 13.13% │ 0.16       │ mfiDivergency5m │
// │ 105 │ BOMEUSDT      │ 2024 04 23 11:45:00 │ 2024 04 23 20:05:00 │ SHORT        │ 0.51%  │ 13.64% │ 0.01       │ rsiDivergency5m │
// │ 106 │ WIFUSDT       │ 2024 04 23 21:05:00 │ 2024 04 23 21:10:00 │ SHORT        │ -0.26% │ 13.38% │ 3.21       │ mfiDivergency5m │
// │ 107 │ WIFUSDT       │ 2024 04 23 21:20:00 │ 2024 04 23 22:40:00 │ SHORT        │ -0.26% │ 13.11% │ 3.23       │ mfiDivergency5m │
// │ 108 │ ARKMUSDT      │ 2024 04 23 22:55:00 │ 2024 04 24 07:15:00 │ LONG         │ 1.09%  │ 14.21% │ 2.14       │ mfiDivergency5m │
// │ 109 │ SSVUSDT       │ 2024 04 24 08:20:00 │ 2024 04 24 09:10:00 │ LONG         │ -0.26% │ 13.94% │ 46.81      │ mfiDivergency5m │
// │ 110 │ BOMEUSDT      │ 2024 04 24 09:45:00 │ 2024 04 24 09:55:00 │ LONG         │ -0.26% │ 13.68% │ 0.01       │ mfiDivergency5m │
// │ 111 │ BOMEUSDT      │ 2024 04 24 10:00:00 │ 2024 04 24 10:15:00 │ LONG         │ -0.26% │ 13.42% │ 0.01       │ mfiDivergency5m │
// │ 112 │ VANRYUSDT     │ 2024 04 24 10:20:00 │ 2024 04 24 10:35:00 │ LONG         │ -0.26% │ 13.16% │ 0.17       │ mfiDivergency5m │
// │ 113 │ 1000SATSUSDT  │ 2024 04 24 10:30:00 │ 2024 04 24 10:35:00 │ LONG         │ -0.26% │ 12.89% │ 0.00       │ mfiDivergency5m │
// │ 114 │ AEVOUSDT      │ 2024 04 24 10:50:00 │ 2024 04 24 11:25:00 │ LONG         │ -0.26% │ 12.63% │ 1.54       │ rsiDivergency5m │
// │ 115 │ TAOUSDT       │ 2024 04 24 11:15:00 │ 2024 04 24 11:25:00 │ LONG         │ -0.26% │ 4.02%  │ 457.42     │ rsiDivergency5m │
// │ 116 │ DODOXUSDT     │ 2024 04 24 11:35:00 │ 2024 04 24 11:40:00 │ LONG         │ -0.26% │ 12.37% │ 0.20       │ mfiDivergency5m │
// │ 117 │ MOVRUSDT      │ 2024 04 24 13:00:00 │ 2024 04 24 21:20:00 │ SHORT        │ 0.81%  │ 13.18% │ 13.37      │ mfiDivergency5m │
// │ 118 │ ACHUSDT       │ 2024 04 25 04:35:00 │ 2024 04 25 05:10:00 │ LONG         │ -0.26% │ 12.65% │ 0.03       │ mfiDivergency5m │
// │ 119 │ ACHUSDT       │ 2024 04 25 05:15:00 │ 2024 04 25 10:05:00 │ LONG         │ 2.49%  │ 15.14% │ 0.03       │ mfiDivergency5m │
// │ 120 │ WUSDT         │ 2024 04 25 10:50:00 │ 2024 04 25 11:00:00 │ SHORT        │ -0.26% │ 14.88% │ 0.65       │ rsiDivergency5m │
// │ 121 │ WUSDT         │ 2024 04 25 11:10:00 │ 2024 04 25 11:30:00 │ SHORT        │ -0.26% │ 14.62% │ 0.64       │ rsiDivergency5m │
// │ 122 │ MTLUSDT       │ 2024 04 25 11:25:00 │ 2024 04 25 11:40:00 │ SHORT        │ -0.26% │ 14.09% │ 1.69       │ rsiDivergency5m │
// │ 123 │ TOKENUSDT     │ 2024 04 25 11:40:00 │ 2024 04 25 11:50:00 │ SHORT        │ -0.26% │ 14.35% │ 0.12       │ mfiDivergency5m │
// │ 124 │ TOKENUSDT     │ 2024 04 25 12:30:00 │ 2024 04 25 12:50:00 │ SHORT        │ -0.26% │ 13.83% │ 0.12       │ mfiDivergency5m │
// │ 125 │ LSKUSDT       │ 2024 04 25 13:40:00 │ 2024 04 25 13:45:00 │ SHORT        │ -0.26% │ 13.57% │ 2.07       │ rsiDivergency5m │
// │ 126 │ VANRYUSDT     │ 2024 04 25 14:50:00 │ 2024 04 25 15:00:00 │ SHORT        │ -0.26% │ 13.30% │ 0.19       │ mfiDivergency5m │
// │ 127 │ LQTYUSDT      │ 2024 04 25 15:25:00 │ 2024 04 25 16:20:00 │ SHORT        │ -0.26% │ 13.04% │ 1.12       │ rsiDivergency5m │
// │ 128 │ VANRYUSDT     │ 2024 04 25 16:50:00 │ 2024 04 25 17:00:00 │ LONG         │ -0.26% │ 12.78% │ 0.18       │ mfiDivergency5m │
// │ 129 │ VANRYUSDT     │ 2024 04 25 18:40:00 │ 2024 04 25 19:40:00 │ LONG         │ -0.26% │ 12.52% │ 0.18       │ mfiDivergency5m │
// │ 130 │ LOOMUSDT      │ 2024 04 25 19:30:00 │ 2024 04 25 19:45:00 │ LONG         │ -0.26% │ 12.25% │ 0.09       │ mfiDivergency5m │
// │ 131 │ LOOMUSDT      │ 2024 04 25 19:50:00 │ 2024 04 25 20:05:00 │ LONG         │ -0.26% │ 11.99% │ 0.08       │ mfiDivergency5m │
// │ 132 │ LOOMUSDT      │ 2024 04 25 20:10:00 │ 2024 04 25 20:15:00 │ LONG         │ -0.26% │ 11.73% │ 0.08       │ mfiDivergency5m │
// │ 133 │ LOOMUSDT      │ 2024 04 25 20:20:00 │ 2024 04 26 04:40:00 │ LONG         │ 0.45%  │ 12.18% │ 0.08       │ mfiDivergency5m │
// │ 134 │ TOKENUSDT     │ 2024 04 26 06:00:00 │ 2024 04 26 08:05:00 │ LONG         │ -0.26% │ 11.92% │ 0.11       │ mfiDivergency5m │
// │ 135 │ MAVIAUSDT     │ 2024 04 26 17:25:00 │ 2024 04 26 19:00:00 │ LONG         │ -0.26% │ 11.66% │ 3.39       │ rsiDivergency5m │
// │ 136 │ LSKUSDT       │ 2024 04 26 19:45:00 │ 2024 04 26 20:00:00 │ LONG         │ -0.26% │ 11.39% │ 1.68       │ rsiDivergency5m │
// │ 137 │ WIFUSDT       │ 2024 04 26 20:20:00 │ 2024 04 26 21:00:00 │ LONG         │ -0.26% │ 11.13% │ 2.68       │ mfiDivergency5m │
// │ 138 │ RSRUSDT       │ 2024 04 26 20:25:00 │ 2024 04 27 04:45:00 │ LONG         │ 1.03%  │ 12.16% │ 0.01       │ rsiDivergency5m │
// │ 139 │ ARKMUSDT      │ 2024 04 27 05:45:00 │ 2024 04 27 13:00:00 │ LONG         │ 2.49%  │ 14.65% │ 1.98       │ mfiDivergency5m │
// │ 140 │ DODOXUSDT     │ 2024 04 27 13:10:00 │ 2024 04 27 21:30:00 │ SHORT        │ 0.50%  │ 15.15% │ 0.19       │ mfiDivergency5m │
// │ 141 │ STRKUSDT      │ 2024 04 27 21:55:00 │ 2024 04 27 22:05:00 │ SHORT        │ -0.26% │ 14.88% │ 1.32       │ rsiDivergency5m │
// │ 142 │ ZETAUSDT      │ 2024 04 27 22:05:00 │ 2024 04 28 00:15:00 │ SHORT        │ -0.26% │ 14.62% │ 1.28       │ rsiDivergency5m │
// │ 143 │ ZETAUSDT      │ 2024 04 28 00:25:00 │ 2024 04 28 08:45:00 │ SHORT        │ 1.48%  │ 16.10% │ 1.30       │ rsiDivergency5m │
// │ 144 │ ONGUSDT       │ 2024 04 28 10:15:00 │ 2024 04 28 17:35:00 │ LONG         │ -0.26% │ 15.84% │ 0.64       │ mfiDivergency5m │
// │ 145 │ ONGUSDT       │ 2024 04 28 17:50:00 │ 2024 04 28 18:05:00 │ LONG         │ -0.26% │ 15.57% │ 0.63       │ mfiDivergency5m │
// │ 146 │ WUSDT         │ 2024 04 28 20:20:00 │ 2024 04 28 21:25:00 │ LONG         │ -0.26% │ 15.31% │ 0.62       │ mfiDivergency5m │
// │ 147 │ WUSDT         │ 2024 04 28 21:40:00 │ 2024 04 28 21:45:00 │ LONG         │ -0.26% │ 15.05% │ 0.61       │ rsiDivergency5m │
// │ 148 │ WUSDT         │ 2024 04 28 21:50:00 │ 2024 04 28 22:25:00 │ LONG         │ -0.26% │ 14.79% │ 0.60       │ rsiDivergency5m │
// │ 149 │ POLYXUSDT     │ 2024 04 28 22:35:00 │ 2024 04 28 23:00:00 │ LONG         │ -0.26% │ 14.52% │ 0.37       │ rsiDivergency5m │
// │ 150 │ VANRYUSDT     │ 2024 04 29 00:50:00 │ 2024 04 29 01:10:00 │ LONG         │ -0.26% │ 14.26% │ 0.17       │ mfiDivergency5m │
// │ 151 │ MAVIAUSDT     │ 2024 04 29 01:40:00 │ 2024 04 29 10:00:00 │ LONG         │ 1.18%  │ 15.44% │ 3.65       │ rsiDivergency5m │
// │ 152 │ ENAUSDT       │ 2024 04 29 11:00:00 │ 2024 04 29 12:25:00 │ SHORT        │ -0.26% │ 15.18% │ 0.88       │ rsiDivergency5m │
// │ 153 │ ENAUSDT       │ 2024 04 29 18:10:00 │ 2024 04 30 02:30:00 │ SHORT        │ 1.27%  │ 16.45% │ 0.94       │ rsiDivergency5m │
// │ 154 │ VANRYUSDT     │ 2024 04 30 03:45:00 │ 2024 04 30 03:55:00 │ LONG         │ -0.26% │ 16.19% │ 0.16       │ mfiDivergency5m │
// │ 155 │ WUSDT         │ 2024 04 30 04:30:00 │ 2024 04 30 05:15:00 │ LONG         │ -0.26% │ 15.92% │ 0.64       │ mfiDivergency5m │
// │ 156 │ LQTYUSDT      │ 2024 04 30 05:00:00 │ 2024 04 30 05:10:00 │ LONG         │ -0.26% │ 15.66% │ 1.03       │ rsiDivergency5m │
// │ 157 │ LQTYUSDT      │ 2024 04 30 05:15:00 │ 2024 04 30 05:30:00 │ LONG         │ -0.26% │ 15.40% │ 1.03       │ rsiDivergency5m │
// │ 158 │ RDNTUSDT      │ 2024 04 30 05:40:00 │ 2024 04 30 06:05:00 │ LONG         │ -0.26% │ 15.14% │ 0.18       │ mfiDivergency5m │
// │ 159 │ LQTYUSDT      │ 2024 04 30 06:10:00 │ 2024 04 30 06:40:00 │ LONG         │ -0.26% │ 14.87% │ 1.01       │ rsiDivergency5m │
// │ 160 │ DUSKUSDT      │ 2024 04 30 06:40:00 │ 2024 04 30 07:10:00 │ LONG         │ -0.26% │ 14.61% │ 0.30       │ mfiDivergency5m │
// │ 161 │ VETUSDT       │ 2024 04 30 06:55:00 │ 2024 04 30 07:10:00 │ LONG         │ -0.26% │ 14.35% │ 0.04       │ mfiDivergency5m │
// │ 162 │ POLYXUSDT     │ 2024 04 30 08:05:00 │ 2024 04 30 08:20:00 │ LONG         │ -0.26% │ 13.82% │ 0.34       │ rsiDivergency5m │
// │ 163 │ BONDUSDT      │ 2024 04 30 08:40:00 │ 2024 04 30 08:50:00 │ LONG         │ -0.26% │ 13.56% │ 2.69       │ mfiDivergency5m │
// │ 164 │ IMXUSDT       │ 2024 04 30 08:40:00 │ 2024 04 30 08:50:00 │ LONG         │ -0.26% │ 13.30% │ 1.88       │ mfiDivergency5m │
// │ 165 │ LDOUSDT       │ 2024 04 30 08:55:00 │ 2024 04 30 09:05:00 │ LONG         │ -0.26% │ 13.04% │ 1.89       │ rsiDivergency5m │
// │ 166 │ RONINUSDT     │ 2024 04 30 11:10:00 │ 2024 04 30 11:15:00 │ LONG         │ -0.26% │ 12.25% │ 2.52       │ rsiDivergency5m │
// │ 167 │ WAXPUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 0.27%  │ 12.52% │ 0.06       │ rsiDivergency5m │
// │ 168 │ LDOUSDT       │ 2024 04 30 19:40:00 │ 2024 05 01 02:05:00 │ LONG         │ -0.26% │ 12.26% │ 1.85       │ mfiDivergency5m │
// │ 169 │ OMNIUSDT      │ 2024 05 01 02:35:00 │ 2024 05 01 03:20:00 │ LONG         │ -0.26% │ 8.60%  │ 16.95      │ rsiDivergency5m │
// │ 170 │ 1000PEPEUSDT  │ 2024 05 01 03:05:00 │ 2024 05 01 03:20:00 │ LONG         │ -0.26% │ 11.99% │ 0.01       │ rsiDivergency5m │
// │ 171 │ PHBUSDT       │ 2024 05 01 03:30:00 │ 2024 05 01 11:50:00 │ LONG         │ 0.72%  │ 12.72% │ 1.45       │ rsiDivergency5m │
// │ 172 │ CKBUSDT       │ 2024 05 01 13:45:00 │ 2024 05 01 13:50:00 │ SHORT        │ -0.26% │ 12.19% │ 0.02       │ mfiDivergency5m │
// │ 173 │ POLYXUSDT     │ 2024 05 01 13:45:00 │ 2024 05 01 13:50:00 │ SHORT        │ -0.26% │ 12.46% │ 0.35       │ rsiDivergency5m │
// │ 174 │ CKBUSDT       │ 2024 05 01 13:55:00 │ 2024 05 01 14:00:00 │ SHORT        │ -0.26% │ 11.93% │ 0.02       │ mfiDivergency5m │
// │ 175 │ AXSUSDT       │ 2024 05 01 14:00:00 │ 2024 05 01 22:20:00 │ SHORT        │ 0.32%  │ 12.25% │ 7.02       │ rsiDivergency5m │
// │ 176 │ WUSDT         │ 2024 05 02 00:10:00 │ 2024 05 02 05:00:00 │ LONG         │ 2.49%  │ 14.74% │ 0.63       │ mfiDivergency5m │
// │ 177 │ MAVIAUSDT     │ 2024 05 02 07:10:00 │ 2024 05 02 15:30:00 │ SHORT        │ 0.69%  │ 15.42% │ 3.67       │ rsiDivergency5m │
// │ 178 │ TONUSDT       │ 2024 05 02 19:25:00 │ 2024 05 03 03:45:00 │ LONG         │ 1.28%  │ 16.70% │ 5.12       │ mfiDivergency5m │
// │ 179 │ 1000PEPEUSDT  │ 2024 05 03 09:05:00 │ 2024 05 03 17:25:00 │ SHORT        │ 0.36%  │ 17.06% │ 0.01       │ rsiDivergency5m │
// │ 180 │ REZUSDT       │ 2024 05 03 13:15:00 │ 2024 05 03 13:30:00 │ SHORT        │ -0.26% │ -0.65% │ 0.17       │ rsiDivergency5m │
// │ 181 │ REZUSDT       │ 2024 05 03 13:35:00 │ 2024 05 03 14:20:00 │ SHORT        │ -0.26% │ -0.91% │ 0.17       │ rsiDivergency5m │
// │ 182 │ WIFUSDT       │ 2024 05 03 17:55:00 │ 2024 05 03 18:00:00 │ SHORT        │ -0.26% │ 16.80% │ 3.03       │ mfiDivergency5m │
// │ 183 │ STXUSDT       │ 2024 05 03 18:20:00 │ 2024 05 03 18:25:00 │ SHORT        │ -0.26% │ 16.54% │ 2.36       │ rsiDivergency5m │
// │ 184 │ 1000FLOKIUSDT │ 2024 05 03 19:35:00 │ 2024 05 03 20:25:00 │ SHORT        │ -0.26% │ 16.28% │ 0.18       │ rsiDivergency5m │
// │ 185 │ 1000PEPEUSDT  │ 2024 05 03 22:30:00 │ 2024 05 03 22:40:00 │ SHORT        │ -0.26% │ 16.01% │ 0.01       │ rsiDivergency5m │
// │ 186 │ BOMEUSDT      │ 2024 05 03 23:05:00 │ 2024 05 03 23:40:00 │ SHORT        │ -0.26% │ 15.75% │ 0.01       │ rsiDivergency5m │
// │ 187 │ 1000PEPEUSDT  │ 2024 05 03 23:35:00 │ 2024 05 04 05:30:00 │ SHORT        │ -0.26% │ 15.49% │ 0.01       │ rsiDivergency5m │
// │ 188 │ 1000FLOKIUSDT │ 2024 05 04 06:25:00 │ 2024 05 04 06:45:00 │ SHORT        │ -0.26% │ 15.23% │ 0.20       │ mfiDivergency5m │
// │ 189 │ ONGUSDT       │ 2024 05 04 10:45:00 │ 2024 05 04 16:30:00 │ LONG         │ -0.26% │ 14.96% │ 0.58       │ mfiDivergency5m │
// │ 190 │ ONGUSDT       │ 2024 05 04 17:40:00 │ 2024 05 05 02:00:00 │ LONG         │ 1.44%  │ 16.40% │ 0.57       │ mfiDivergency5m │
// │ 191 │ GRTUSDT       │ 2024 05 05 10:40:00 │ 2024 05 05 11:25:00 │ SHORT        │ -0.26% │ 18.63% │ 0.29       │ mfiDivergency5m │
// │ 192 │ PHBUSDT       │ 2024 05 05 12:25:00 │ 2024 05 05 12:45:00 │ SHORT        │ -0.26% │ 18.36% │ 2.01       │ rsiDivergency5m │
// │ 193 │ RSRUSDT       │ 2024 05 05 12:30:00 │ 2024 05 05 12:35:00 │ SHORT        │ -0.26% │ 18.10% │ 0.01       │ rsiDivergency5m │
// │ 194 │ RSRUSDT       │ 2024 05 05 12:50:00 │ 2024 05 05 21:10:00 │ SHORT        │ 2.08%  │ 20.18% │ 0.01       │ rsiDivergency5m │
// │ 195 │ JUPUSDT       │ 2024 05 06 07:25:00 │ 2024 05 06 07:45:00 │ LONG         │ -0.26% │ 22.14% │ 1.13       │ mfiDivergency5m │
// │ 196 │ 1000RATSUSDT  │ 2024 05 06 07:55:00 │ 2024 05 06 09:55:00 │ LONG         │ -0.26% │ 21.88% │ 0.13       │ mfiDivergency5m │
// │ 197 │ BOMEUSDT      │ 2024 05 06 11:40:00 │ 2024 05 06 20:00:00 │ LONG         │ 1.03%  │ 22.90% │ 0.01       │ mfiDivergency5m │
// │ 198 │ JTOUSDT       │ 2024 05 07 01:55:00 │ 2024 05 07 10:15:00 │ LONG         │ 0.89%  │ 23.54% │ 3.68       │ mfiDivergency5m │
// │ 199 │ BOMEUSDT      │ 2024 05 07 18:05:00 │ 2024 05 07 18:55:00 │ LONG         │ -0.26% │ 23.27% │ 0.01       │ rsiDivergency5m │
// │ 200 │ BOMEUSDT      │ 2024 05 07 19:00:00 │ 2024 05 07 19:25:00 │ LONG         │ -0.26% │ 23.01% │ 0.01       │ rsiDivergency5m │
// │ 201 │ BOMEUSDT      │ 2024 05 07 19:30:00 │ 2024 05 08 01:10:00 │ LONG         │ -0.26% │ 22.75% │ 0.01       │ rsiDivergency5m │
// │ 202 │ GALUSDT       │ 2024 05 08 01:55:00 │ 2024 05 08 04:35:00 │ LONG         │ -0.26% │ 22.49% │ 3.46       │ mfiDivergency5m │
// │ 203 │ ACEUSDT       │ 2024 05 08 09:50:00 │ 2024 05 08 10:25:00 │ SHORT        │ -0.26% │ 22.22% │ 5.60       │ mfiDivergency5m │
// │ 204 │ ARPAUSDT      │ 2024 05 08 14:10:00 │ 2024 05 08 22:30:00 │ SHORT        │ 1.24%  │ 22.93% │ 0.07       │ rsiDivergency5m │
// │ 205 │ RNDRUSDT      │ 2024 05 09 04:20:00 │ 2024 05 09 04:45:00 │ LONG         │ -0.26% │ 22.67% │ 10.36      │ mfiDivergency5m │
// │ 206 │ MOVRUSDT      │ 2024 05 09 05:20:00 │ 2024 05 09 09:10:00 │ LONG         │ 2.49%  │ 25.16% │ 13.77      │ mfiDivergency5m │
// │ 207 │ JTOUSDT       │ 2024 05 09 12:50:00 │ 2024 05 09 14:00:00 │ SHORT        │ -0.26% │ 24.90% │ 3.74       │ mfiDivergency5m │
// │ 208 │ CELRUSDT      │ 2024 05 09 19:30:00 │ 2024 05 10 03:50:00 │ LONG         │ 0.27%  │ 24.65% │ 0.03       │ mfiDivergency5m │
// │ 209 │ UMAUSDT       │ 2024 05 10 07:15:00 │ 2024 05 10 11:00:00 │ SHORT        │ 2.49%  │ 27.13% │ 3.91       │ rsiDivergency5m │
// │ 210 │ WUSDT         │ 2024 05 10 11:35:00 │ 2024 05 10 12:25:00 │ LONG         │ -0.26% │ 26.87% │ 0.60       │ mfiDivergency5m │
// │ 211 │ ENAUSDT       │ 2024 05 10 12:35:00 │ 2024 05 10 20:55:00 │ LONG         │ 0.65%  │ 27.52% │ 0.83       │ rsiDivergency5m │
// │ 212 │ BAKEUSDT      │ 2024 05 11 07:40:00 │ 2024 05 11 15:30:00 │ LONG         │ -0.26% │ 29.34% │ 0.27       │ mfiDivergency5m │
// │ 213 │ XVGUSDT       │ 2024 05 11 18:30:00 │ 2024 05 12 02:50:00 │ LONG         │ 0.76%  │ 30.11% │ 0.01       │ mfiDivergency5m │
// │ 214 │ JTOUSDT       │ 2024 05 12 09:25:00 │ 2024 05 12 09:45:00 │ LONG         │ -0.26% │ 29.84% │ 4.06       │ mfiDivergency5m │
// │ 215 │ BOMEUSDT      │ 2024 05 12 21:35:00 │ 2024 05 12 21:45:00 │ LONG         │ -0.26% │ 29.58% │ 0.01       │ rsiDivergency5m │
// │ 216 │ 1000RATSUSDT  │ 2024 05 12 21:45:00 │ 2024 05 12 21:50:00 │ LONG         │ -0.26% │ 29.32% │ 0.11       │ rsiDivergency5m │
// │ 217 │ TAOUSDT       │ 2024 05 12 21:50:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.26% │ 19.91% │ 344.76     │ rsiDivergency5m │
// │ 218 │ 1000RATSUSDT  │ 2024 05 12 21:55:00 │ 2024 05 12 22:00:00 │ LONG         │ -0.26% │ 29.06% │ 0.11       │ rsiDivergency5m │
// │ 219 │ BONDUSDT      │ 2024 05 12 21:55:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.26% │ 28.79% │ 2.74       │ rsiDivergency5m │
// │ 220 │ FETUSDT       │ 2024 05 12 22:00:00 │ 2024 05 13 06:20:00 │ LONG         │ 1.10%  │ 29.90% │ 2.04       │ mfiDivergency5m │
// │ 221 │ TAOUSDT       │ 2024 05 12 22:15:00 │ 2024 05 13 04:35:00 │ LONG         │ 2.49%  │ 22.40% │ 341.12     │ rsiDivergency5m │
// │ 222 │ 1000FLOKIUSDT │ 2024 05 13 08:00:00 │ 2024 05 13 08:15:00 │ SHORT        │ -0.26% │ 29.63% │ 0.18       │ rsiDivergency5m │
// │ 223 │ 1000FLOKIUSDT │ 2024 05 13 08:25:00 │ 2024 05 13 08:50:00 │ SHORT        │ -0.26% │ 29.37% │ 0.19       │ rsiDivergency5m │
// │ 224 │ 1000FLOKIUSDT │ 2024 05 13 09:15:00 │ 2024 05 13 11:20:00 │ SHORT        │ -0.26% │ 29.11% │ 0.19       │ rsiDivergency5m │
// │ 225 │ CHRUSDT       │ 2024 05 13 11:15:00 │ 2024 05 13 11:25:00 │ SHORT        │ -0.26% │ 28.58% │ 0.29       │ mfiDivergency5m │
// │ 226 │ 1000FLOKIUSDT │ 2024 05 13 11:25:00 │ 2024 05 13 11:30:00 │ SHORT        │ -0.26% │ 28.85% │ 0.19       │ rsiDivergency5m │
// │ 227 │ UMAUSDT       │ 2024 05 13 13:25:00 │ 2024 05 13 19:30:00 │ LONG         │ 2.49%  │ 31.07% │ 3.81       │ rsiDivergency5m │
// │ 228 │ SUPERUSDT     │ 2024 05 13 19:55:00 │ 2024 05 14 04:15:00 │ LONG         │ 0.17%  │ 31.24% │ 0.91       │ rsiDivergency5m │
// │ 229 │ UMAUSDT       │ 2024 05 14 08:55:00 │ 2024 05 14 09:10:00 │ LONG         │ -0.26% │ 30.98% │ 3.70       │ rsiDivergency5m │
// │ 230 │ BNXUSDT       │ 2024 05 14 13:50:00 │ 2024 05 14 19:40:00 │ LONG         │ -0.26% │ 30.71% │ 0.95       │ mfiDivergency5m │
// │ 231 │ PEOPLEUSDT    │ 2024 05 14 20:10:00 │ 2024 05 14 20:40:00 │ SHORT        │ -0.26% │ 30.45% │ 0.04       │ mfiDivergency5m │
// │ 232 │ 1000FLOKIUSDT │ 2024 05 15 02:05:00 │ 2024 05 15 02:35:00 │ SHORT        │ -0.26% │ 29.93% │ 0.21       │ rsiDivergency5m │
// │ 233 │ LPTUSDT       │ 2024 05 15 05:20:00 │ 2024 05 15 05:50:00 │ SHORT        │ -0.26% │ 29.66% │ 18.24      │ rsiDivergency5m │
// │ 234 │ AXLUSDT       │ 2024 05 15 08:15:00 │ 2024 05 15 08:25:00 │ SHORT        │ -0.26% │ 29.40% │ 1.02       │ rsiDivergency5m │
// │ 235 │ AXLUSDT       │ 2024 05 15 08:30:00 │ 2024 05 15 08:45:00 │ SHORT        │ -0.26% │ 29.14% │ 1.03       │ rsiDivergency5m │
// │ 236 │ NEARUSDT      │ 2024 05 15 08:40:00 │ 2024 05 15 09:30:00 │ SHORT        │ -0.26% │ 28.61% │ 7.59       │ mfiDivergency5m │
// │ 237 │ AXLUSDT       │ 2024 05 15 08:50:00 │ 2024 05 15 09:20:00 │ SHORT        │ -0.26% │ 28.88% │ 1.04       │ rsiDivergency5m │
// │ 238 │ LPTUSDT       │ 2024 05 15 09:45:00 │ 2024 05 15 09:50:00 │ SHORT        │ -0.26% │ 28.35% │ 20.64      │ rsiDivergency5m │
// │ 239 │ LPTUSDT       │ 2024 05 15 10:00:00 │ 2024 05 15 18:20:00 │ SHORT        │ 0.70%  │ 29.05% │ 20.76      │ rsiDivergency5m │
// │ 240 │ XVGUSDT       │ 2024 05 15 20:25:00 │ 2024 05 16 04:45:00 │ SHORT        │ 0.37%  │ 29.42% │ 0.01       │ mfiDivergency5m │
// │ 241 │ PEOPLEUSDT    │ 2024 05 16 17:25:00 │ 2024 05 16 17:35:00 │ SHORT        │ -0.26% │ 28.37% │ 0.05       │ mfiDivergency5m │
// │ 242 │ 1000FLOKIUSDT │ 2024 05 16 23:15:00 │ 2024 05 16 23:20:00 │ SHORT        │ -0.26% │ 28.10% │ 0.22       │ rsiDivergency5m │
// │ 243 │ STXUSDT       │ 2024 05 16 23:55:00 │ 2024 05 17 08:15:00 │ LONG         │ 0.77%  │ 28.87% │ 1.97       │ mfiDivergency5m │
// │ 244 │ TOKENUSDT     │ 2024 05 17 10:15:00 │ 2024 05 17 10:20:00 │ SHORT        │ -0.26% │ 28.61% │ 0.11       │ mfiDivergency5m │
// │ 245 │ SUPERUSDT     │ 2024 05 17 11:25:00 │ 2024 05 17 19:45:00 │ SHORT        │ 0.40%  │ 29.01% │ 1.08       │ rsiDivergency5m │
// │ 246 │ SSVUSDT       │ 2024 05 17 20:00:00 │ 2024 05 17 20:35:00 │ SHORT        │ -0.26% │ 28.74% │ 41.14      │ mfiDivergency5m │
// │ 247 │ JTOUSDT       │ 2024 05 17 22:45:00 │ 2024 05 17 23:40:00 │ LONG         │ -0.26% │ 28.48% │ 4.62       │ mfiDivergency5m │
// │ 248 │ POLYXUSDT     │ 2024 05 17 23:40:00 │ 2024 05 17 23:50:00 │ SHORT        │ -0.26% │ 28.22% │ 0.46       │ rsiDivergency5m │
// │ 249 │ BBUSDT        │ 2024 05 18 14:55:00 │ 2024 05 18 23:15:00 │ SHORT        │ 1.58%  │ 0.71%  │ 0.37       │ rsiDivergency5m │
// │ 250 │ 1000RATSUSDT  │ 2024 05 18 22:10:00 │ 2024 05 18 22:20:00 │ SHORT        │ -0.26% │ 26.91% │ 0.14       │ mfiDivergency5m │
// │ 251 │ NOTUSDT       │ 2024 05 19 01:00:00 │ 2024 05 19 01:15:00 │ LONG         │ -0.26% │ -0.13% │ 0.01       │ mfiDivergency5m │
// │ 252 │ NOTUSDT       │ 2024 05 19 02:15:00 │ 2024 05 19 04:00:00 │ LONG         │ -0.26% │ -0.39% │ 0.01       │ mfiDivergency5m │
// │ 253 │ BNXUSDT       │ 2024 05 19 05:05:00 │ 2024 05 19 05:45:00 │ SHORT        │ -0.26% │ 26.12% │ 1.09       │ mfiDivergency5m │
// │ 254 │ BIGTIMEUSDT   │ 2024 05 19 11:35:00 │ 2024 05 19 12:05:00 │ LONG         │ -0.26% │ 25.59% │ 0.16       │ mfiDivergency5m │
// │ 255 │ NOTUSDT       │ 2024 05 19 11:35:00 │ 2024 05 19 19:10:00 │ LONG         │ -0.26% │ -1.44% │ 0.01       │ mfiDivergency5m │
// │ 256 │ STRKUSDT      │ 2024 05 19 11:35:00 │ 2024 05 19 11:45:00 │ LONG         │ -0.26% │ 25.86% │ 1.05       │ rsiDivergency5m │
// │ 257 │ STRKUSDT      │ 2024 05 19 12:35:00 │ 2024 05 19 19:15:00 │ LONG         │ -0.26% │ 25.33% │ 1.05       │ mfiDivergency5m │
// │ 258 │ UNFIUSDT      │ 2024 05 19 20:05:00 │ 2024 05 19 22:55:00 │ SHORT        │ 2.49%  │ 27.82% │ 4.77       │ mfiDivergency5m │
// │ 259 │ UNFIUSDT      │ 2024 05 20 09:35:00 │ 2024 05 20 09:40:00 │ SHORT        │ -0.26% │ 29.62% │ 5.11       │ mfiDivergency5m │
// │ 260 │ BONDUSDT      │ 2024 05 20 12:30:00 │ 2024 05 20 14:25:00 │ SHORT        │ -0.26% │ 29.36% │ 3.13       │ rsiDivergency5m │
// │ 261 │ SUPERUSDT     │ 2024 05 20 14:40:00 │ 2024 05 20 18:15:00 │ SHORT        │ -0.26% │ 29.09% │ 1.13       │ rsiDivergency5m │
// │ 262 │ OMNIUSDT      │ 2024 05 20 15:35:00 │ 2024 05 20 15:50:00 │ SHORT        │ -0.26% │ 21.96% │ 15.35      │ rsiDivergency5m │
// │ 263 │ OMNIUSDT      │ 2024 05 20 15:55:00 │ 2024 05 20 16:35:00 │ SHORT        │ -0.26% │ 21.70% │ 15.45      │ rsiDivergency5m │
// │ 264 │ STRKUSDT      │ 2024 05 20 18:30:00 │ 2024 05 20 19:15:00 │ SHORT        │ -0.26% │ 28.83% │ 1.21       │ rsiDivergency5m │
// │ 265 │ STRKUSDT      │ 2024 05 20 19:30:00 │ 2024 05 20 19:45:00 │ SHORT        │ -0.26% │ 28.57% │ 1.24       │ mfiDivergency5m │
// │ 266 │ NEOUSDT       │ 2024 05 20 19:50:00 │ 2024 05 21 04:10:00 │ SHORT        │ 0.60%  │ 29.17% │ 16.48      │ mfiDivergency5m │
// │ 267 │ XAIUSDT       │ 2024 05 21 05:10:00 │ 2024 05 21 05:40:00 │ SHORT        │ -0.26% │ 28.91% │ 0.74       │ mfiDivergency5m │
// │ 268 │ STXUSDT       │ 2024 05 21 05:35:00 │ 2024 05 21 13:55:00 │ SHORT        │ 0.88%  │ 29.78% │ 2.27       │ rsiDivergency5m │
// │ 269 │ EDUUSDT       │ 2024 05 21 17:20:00 │ 2024 05 21 17:25:00 │ SHORT        │ -0.26% │ 29.52% │ 0.64       │ mfiDivergency5m │
// │ 270 │ 1000FLOKIUSDT │ 2024 05 21 18:00:00 │ 2024 05 21 18:10:00 │ SHORT        │ -0.26% │ 29.26% │ 0.23       │ rsiDivergency5m │
// │ 271 │ 1000PEPEUSDT  │ 2024 05 21 18:40:00 │ 2024 05 21 19:15:00 │ SHORT        │ -0.26% │ 29.00% │ 0.01       │ rsiDivergency5m │
// │ 272 │ LDOUSDT       │ 2024 05 21 19:10:00 │ 2024 05 21 19:55:00 │ LONG         │ -0.26% │ 28.73% │ 2.23       │ mfiDivergency5m │
// │ 273 │ 1000FLOKIUSDT │ 2024 05 21 20:10:00 │ 2024 05 21 20:35:00 │ SHORT        │ -0.26% │ 28.47% │ 0.24       │ rsiDivergency5m │
// │ 274 │ NOTUSDT       │ 2024 05 21 23:35:00 │ 2024 05 22 02:00:00 │ LONG         │ -0.26% │ -0.87% │ 0.01       │ mfiDivergency5m │
// │ 275 │ AEVOUSDT      │ 2024 05 22 00:05:00 │ 2024 05 22 06:50:00 │ LONG         │ -0.26% │ 28.21% │ 0.88       │ rsiDivergency5m │
// │ 276 │ 1000FLOKIUSDT │ 2024 05 22 08:00:00 │ 2024 05 22 08:10:00 │ LONG         │ -0.26% │ 27.95% │ 0.22       │ mfiDivergency5m │
// │ 277 │ BNXUSDT       │ 2024 05 22 08:50:00 │ 2024 05 22 09:00:00 │ SHORT        │ -0.26% │ 27.68% │ 1.25       │ mfiDivergency5m │
// │ 278 │ BNXUSDT       │ 2024 05 22 09:30:00 │ 2024 05 22 09:35:00 │ SHORT        │ -0.26% │ 27.42% │ 1.33       │ mfiDivergency5m │
// │ 279 │ BNXUSDT       │ 2024 05 22 09:40:00 │ 2024 05 22 09:45:00 │ SHORT        │ -0.26% │ 27.16% │ 1.33       │ mfiDivergency5m │
// │ 280 │ ENAUSDT       │ 2024 05 22 10:45:00 │ 2024 05 22 19:05:00 │ SHORT        │ 0.18%  │ 27.34% │ 0.86       │ rsiDivergency5m │
// │ 281 │ RNDRUSDT      │ 2024 05 22 20:15:00 │ 2024 05 23 04:35:00 │ LONG         │ 0.10%  │ 27.43% │ 10.44      │ mfiDivergency5m │
// │ 282 │ PHBUSDT       │ 2024 05 23 08:00:00 │ 2024 05 23 08:15:00 │ LONG         │ -0.26% │ 27.17% │ 2.77       │ rsiDivergency5m │
// │ 283 │ JUPUSDT       │ 2024 05 23 08:40:00 │ 2024 05 23 08:45:00 │ LONG         │ -0.26% │ 26.91% │ 1.14       │ rsiDivergency5m │
// │ 284 │ JUPUSDT       │ 2024 05 23 08:50:00 │ 2024 05 23 09:50:00 │ LONG         │ -0.26% │ 26.65% │ 1.13       │ rsiDivergency5m │
// │ 285 │ TAOUSDT       │ 2024 05 23 09:25:00 │ 2024 05 23 09:40:00 │ LONG         │ -0.26% │ 28.89% │ 450.05     │ rsiDivergency5m │
// │ 286 │ ACHUSDT       │ 2024 05 23 09:35:00 │ 2024 05 23 13:05:00 │ LONG         │ -0.26% │ 26.38% │ 0.03       │ mfiDivergency5m │
// │ 287 │ TAOUSDT       │ 2024 05 23 09:50:00 │ 2024 05 23 15:00:00 │ LONG         │ -0.26% │ 28.63% │ 441.26     │ rsiDivergency5m │
// │ 288 │ AXLUSDT       │ 2024 05 23 13:35:00 │ 2024 05 23 14:50:00 │ LONG         │ -0.26% │ 26.12% │ 0.89       │ mfiDivergency5m │
// │ 289 │ WUSDT         │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.64%  │ 27.77% │ 0.53       │ rsiDivergency5m │
// │ 290 │ ZECUSDT       │ 2024 05 23 22:45:00 │ 2024 05 23 23:15:00 │ SHORT        │ -0.26% │ 27.50% │ 26.80      │ rsiDivergency5m │
// │ 291 │ SUSHIUSDT     │ 2024 05 23 23:25:00 │ 2024 05 23 23:35:00 │ SHORT        │ -0.26% │ 27.24% │ 1.23       │ rsiDivergency5m │
// │ 292 │ ZECUSDT       │ 2024 05 23 23:50:00 │ 2024 05 24 08:10:00 │ SHORT        │ 0.02%  │ 27.26% │ 27.13      │ rsiDivergency5m │
// │ 293 │ LDOUSDT       │ 2024 05 24 09:55:00 │ 2024 05 24 18:15:00 │ SHORT        │ 1.25%  │ 28.51% │ 2.48       │ rsiDivergency5m │
// │ 294 │ UMAUSDT       │ 2024 05 24 19:30:00 │ 2024 05 24 20:10:00 │ SHORT        │ -0.26% │ 28.25% │ 3.67       │ rsiDivergency5m │
// │ 295 │ PENDLEUSDT    │ 2024 05 24 21:40:00 │ 2024 05 24 21:50:00 │ SHORT        │ -0.26% │ 27.99% │ 7.00       │ mfiDivergency5m │
// │ 296 │ LDOUSDT       │ 2024 05 24 21:55:00 │ 2024 05 24 22:15:00 │ SHORT        │ -0.26% │ 27.72% │ 2.46       │ rsiDivergency5m │
// │ 297 │ LDOUSDT       │ 2024 05 24 23:10:00 │ 2024 05 25 00:20:00 │ SHORT        │ -0.26% │ 27.46% │ 2.57       │ rsiDivergency5m │
// │ 298 │ BNXUSDT       │ 2024 05 25 07:05:00 │ 2024 05 25 08:10:00 │ LONG         │ -0.26% │ 27.20% │ 1.41       │ mfiDivergency5m │
// │ 299 │ LDOUSDT       │ 2024 05 25 08:25:00 │ 2024 05 25 14:15:00 │ LONG         │ -0.26% │ 26.94% │ 2.48       │ rsiDivergency5m │
// │ 300 │ CHZUSDT       │ 2024 05 26 01:45:00 │ 2024 05 26 01:55:00 │ SHORT        │ -0.26% │ 26.67% │ 0.14       │ mfiDivergency5m │
// │ 301 │ LDOUSDT       │ 2024 05 26 06:15:00 │ 2024 05 26 14:35:00 │ SHORT        │ 0.43%  │ 27.11% │ 2.69       │ rsiDivergency5m │
// │ 302 │ REZUSDT       │ 2024 05 26 10:45:00 │ 2024 05 26 11:00:00 │ SHORT        │ -0.26% │ 12.77% │ 0.15       │ rsiDivergency5m │
// │ 303 │ REZUSDT       │ 2024 05 26 11:10:00 │ 2024 05 26 11:45:00 │ SHORT        │ -0.26% │ 12.51% │ 0.15       │ rsiDivergency5m │
// │ 304 │ TRUUSDT       │ 2024 05 26 15:25:00 │ 2024 05 26 21:55:00 │ LONG         │ -0.26% │ 26.85% │ 0.16       │ mfiDivergency5m │
// │ 305 │ KNCUSDT       │ 2024 05 26 23:50:00 │ 2024 05 27 00:40:00 │ SHORT        │ -0.26% │ 26.58% │ 0.71       │ rsiDivergency5m │
// │ 306 │ 1000FLOKIUSDT │ 2024 05 27 01:25:00 │ 2024 05 27 01:40:00 │ SHORT        │ -0.26% │ 26.32% │ 0.25       │ rsiDivergency5m │
// │ 307 │ LPTUSDT       │ 2024 05 27 02:50:00 │ 2024 05 27 05:10:00 │ LONG         │ -0.26% │ 26.06% │ 21.16      │ rsiDivergency5m │
// │ 308 │ SSVUSDT       │ 2024 05 27 05:50:00 │ 2024 05 27 06:30:00 │ LONG         │ -0.26% │ 25.80% │ 47.15      │ mfiDivergency5m │
// │ 309 │ JASMYUSDT     │ 2024 05 27 07:05:00 │ 2024 05 27 07:10:00 │ LONG         │ -0.26% │ 25.53% │ 0.03       │ mfiDivergency5m │
// │ 310 │ JASMYUSDT     │ 2024 05 27 09:55:00 │ 2024 05 27 13:40:00 │ LONG         │ 2.49%  │ 28.02% │ 0.02       │ mfiDivergency5m │
// │ 311 │ BONDUSDT      │ 2024 05 27 17:45:00 │ 2024 05 27 23:10:00 │ LONG         │ -0.26% │ 26.97% │ 3.42       │ mfiDivergency5m │
// │ 312 │ XAIUSDT       │ 2024 05 27 23:45:00 │ 2024 05 28 08:05:00 │ LONG         │ 1.39%  │ 28.36% │ 0.74       │ mfiDivergency5m │
// │ 313 │ DUSKUSDT      │ 2024 05 28 08:00:00 │ 2024 05 28 08:25:00 │ SHORT        │ -0.26% │ 28.09% │ 0.43       │ mfiDivergency5m │
// │ 314 │ DUSKUSDT      │ 2024 05 28 09:40:00 │ 2024 05 28 13:30:00 │ LONG         │ -0.26% │ 27.83% │ 0.41       │ mfiDivergency5m │
// │ 315 │ TRUUSDT       │ 2024 05 28 14:50:00 │ 2024 05 28 18:20:00 │ SHORT        │ -0.26% │ 27.57% │ 0.19       │ mfiDivergency5m │
// │ 316 │ ARKMUSDT      │ 2024 05 29 09:40:00 │ 2024 05 29 11:30:00 │ SHORT        │ -0.26% │ 27.54% │ 2.48       │ mfiDivergency5m │
// │ 317 │ 1000RATSUSDT  │ 2024 05 29 15:10:00 │ 2024 05 29 16:10:00 │ LONG         │ -0.26% │ 27.28% │ 0.14       │ mfiDivergency5m │
// │ 318 │ BADGERUSDT    │ 2024 05 29 16:10:00 │ 2024 05 30 00:30:00 │ LONG         │ 0.78%  │ 28.06% │ 4.81       │ mfiDivergency5m │
// │ 319 │ TOKENUSDT     │ 2024 05 30 00:45:00 │ 2024 05 30 01:05:00 │ LONG         │ -0.26% │ 27.80% │ 0.14       │ mfiDivergency5m │
// │ 320 │ 1000FLOKIUSDT │ 2024 05 30 02:00:00 │ 2024 05 30 02:20:00 │ LONG         │ -0.26% │ 27.53% │ 0.25       │ rsiDivergency5m │
// │ 321 │ 1000PEPEUSDT  │ 2024 05 30 02:55:00 │ 2024 05 30 09:05:00 │ LONG         │ 2.49%  │ 30.02% │ 0.01       │ rsiDivergency5m │
// │ 322 │ GALUSDT       │ 2024 05 30 09:25:00 │ 2024 05 30 17:45:00 │ SHORT        │ 0.26%  │ 30.28% │ 3.77       │ mfiDivergency5m │
// │ 323 │ OMNIUSDT      │ 2024 05 31 07:35:00 │ 2024 05 31 07:45:00 │ SHORT        │ -0.26% │ 26.64% │ 20.62      │ rsiDivergency5m │
// │ 324 │ OMNIUSDT      │ 2024 05 31 08:00:00 │ 2024 05 31 08:05:00 │ SHORT        │ -0.26% │ 26.38% │ 21.18      │ rsiDivergency5m │
// │ 325 │ PEOPLEUSDT    │ 2024 05 31 11:40:00 │ 2024 05 31 20:00:00 │ LONG         │ 0.95%  │ 30.97% │ 0.08       │ mfiDivergency5m │
// │ 326 │ MTLUSDT       │ 2024 05 31 20:25:00 │ 2024 06 01 00:40:00 │ LONG         │ -0.26% │ 30.71% │ 1.70       │ rsiDivergency5m │
// │ 327 │ PEOPLEUSDT    │ 2024 06 01 04:20:00 │ 2024 06 01 04:55:00 │ SHORT        │ -0.26% │ 30.44% │ 0.10       │ mfiDivergency5m │
// │ 328 │ PEOPLEUSDT    │ 2024 06 01 18:00:00 │ 2024 06 01 20:15:00 │ SHORT        │ -0.26% │ 30.18% │ 0.11       │ mfiDivergency5m │
// │ 329 │ TOKENUSDT     │ 2024 06 01 21:10:00 │ 2024 06 02 01:15:00 │ SHORT        │ -0.26% │ 29.92% │ 0.16       │ mfiDivergency5m │
// │ 330 │ REZUSDT       │ 2024 06 01 23:35:00 │ 2024 06 02 00:40:00 │ SHORT        │ -0.26% │ 22.64% │ 0.16       │ rsiDivergency5m │
// │ 331 │ ACEUSDT       │ 2024 06 02 01:30:00 │ 2024 06 02 03:20:00 │ SHORT        │ -0.26% │ 29.66% │ 6.17       │ mfiDivergency5m │
// │ 332 │ 1000RATSUSDT  │ 2024 06 02 06:15:00 │ 2024 06 02 12:15:00 │ LONG         │ -0.26% │ 29.39% │ 0.15       │ rsiDivergency5m │
// │ 333 │ BBUSDT        │ 2024 06 02 06:20:00 │ 2024 06 02 06:25:00 │ LONG         │ -0.26% │ 12.92% │ 0.71       │ mfiDivergency5m │
// │ 334 │ LPTUSDT       │ 2024 06 02 12:40:00 │ 2024 06 02 13:00:00 │ LONG         │ -0.26% │ 29.13% │ 21.66      │ rsiDivergency5m │
// │ 335 │ GTCUSDT       │ 2024 06 02 18:15:00 │ 2024 06 02 18:30:00 │ SHORT        │ -0.26% │ 28.34% │ 1.67       │ mfiDivergency5m │
// │ 336 │ KLAYUSDT      │ 2024 06 02 20:05:00 │ 2024 06 02 20:25:00 │ SHORT        │ -0.26% │ 28.08% │ 0.24       │ rsiDivergency5m │
// │ 337 │ KLAYUSDT      │ 2024 06 02 20:35:00 │ 2024 06 02 20:45:00 │ SHORT        │ -0.26% │ 27.82% │ 0.25       │ rsiDivergency5m │
// │ 338 │ KLAYUSDT      │ 2024 06 02 20:50:00 │ 2024 06 02 21:15:00 │ SHORT        │ -0.26% │ 27.56% │ 0.25       │ mfiDivergency5m │
// │ 339 │ KLAYUSDT      │ 2024 06 02 21:40:00 │ 2024 06 03 02:55:00 │ SHORT        │ 2.49%  │ 30.04% │ 0.26       │ rsiDivergency5m │
// │ 340 │ WIFUSDT       │ 2024 06 03 03:40:00 │ 2024 06 03 05:40:00 │ SHORT        │ -0.26% │ 29.78% │ 3.42       │ mfiDivergency5m │
// │ 341 │ KASUSDT       │ 2024 06 03 16:50:00 │ 2024 06 03 17:00:00 │ SHORT        │ -0.26% │ 29.52% │ 0.17       │ mfiDivergency5m │
// │ 342 │ WUSDT         │ 2024 06 03 19:45:00 │ 2024 06 04 04:05:00 │ SHORT        │ 1.26%  │ 30.78% │ 0.69       │ mfiDivergency5m │
// │ 343 │ WUSDT         │ 2024 06 04 06:45:00 │ 2024 06 04 15:05:00 │ LONG         │ 0.31%  │ 31.09% │ 0.64       │ mfiDivergency5m │
// │ 344 │ DODOXUSDT     │ 2024 06 04 15:10:00 │ 2024 06 04 22:30:00 │ LONG         │ -0.26% │ 30.83% │ 0.22       │ mfiDivergency5m │
// │ 345 │ STXUSDT       │ 2024 06 04 23:30:00 │ 2024 06 05 00:50:00 │ SHORT        │ -0.26% │ 30.30% │ 2.23       │ mfiDivergency5m │
// │ 346 │ XAIUSDT       │ 2024 06 05 02:10:00 │ 2024 06 05 10:30:00 │ SHORT        │ 0.99%  │ 31.30% │ 0.93       │ mfiDivergency5m │
// │ 347 │ AGLDUSDT      │ 2024 06 05 11:40:00 │ 2024 06 05 15:20:00 │ SHORT        │ -0.26% │ 31.03% │ 1.72       │ mfiDivergency5m │
// │ 348 │ REZUSDT       │ 2024 06 05 22:05:00 │ 2024 06 06 06:25:00 │ SHORT        │ 2.09%  │ 29.61% │ 0.18       │ rsiDivergency5m │
// │ 349 │ COMBOUSDT     │ 2024 06 06 00:45:00 │ 2024 06 06 01:00:00 │ SHORT        │ -0.26% │ 30.77% │ 0.97       │ mfiDivergency5m │
// │ 350 │ HOTUSDT       │ 2024 06 06 02:00:00 │ 2024 06 06 10:20:00 │ LONG         │ 0.06%  │ 30.83% │ 0.00       │ mfiDivergency5m │
// │ 351 │ 1000RATSUSDT  │ 2024 06 06 14:15:00 │ 2024 06 06 14:40:00 │ LONG         │ -0.26% │ 30.57% │ 0.17       │ mfiDivergency5m │
// │ 352 │ WUSDT         │ 2024 06 06 16:15:00 │ 2024 06 06 17:35:00 │ SHORT        │ -0.26% │ 30.31% │ 0.69       │ rsiDivergency5m │
// │ 353 │ JASMYUSDT     │ 2024 06 06 19:55:00 │ 2024 06 07 00:25:00 │ SHORT        │ -0.26% │ 30.04% │ 0.04       │ mfiDivergency5m │
// │ 354 │ CKBUSDT       │ 2024 06 07 01:55:00 │ 2024 06 07 02:05:00 │ SHORT        │ -0.26% │ 29.78% │ 0.02       │ mfiDivergency5m │
// │ 355 │ TRUUSDT       │ 2024 06 07 02:40:00 │ 2024 06 07 03:05:00 │ SHORT        │ -0.26% │ 29.52% │ 0.20       │ mfiDivergency5m │
// │ 356 │ BIGTIMEUSDT   │ 2024 06 07 07:40:00 │ 2024 06 07 12:05:00 │ LONG         │ -0.26% │ 29.26% │ 0.21       │ mfiDivergency5m │
// │ 357 │ 1000FLOKIUSDT │ 2024 06 07 12:45:00 │ 2024 06 07 12:55:00 │ LONG         │ -0.26% │ 28.99% │ 0.30       │ mfiDivergency5m │
// │ 358 │ SUIUSDT       │ 2024 06 07 13:15:00 │ 2024 06 07 21:35:00 │ LONG         │ 1.60%  │ 30.59% │ 1.03       │ mfiDivergency5m │
// │ 359 │ TONUSDT       │ 2024 06 07 22:40:00 │ 2024 06 08 07:00:00 │ SHORT        │ 0.59%  │ 31.18% │ 7.39       │ mfiDivergency5m │
// │ 360 │ TRUUSDT       │ 2024 06 08 07:30:00 │ 2024 06 08 07:35:00 │ LONG         │ -0.26% │ 30.92% │ 0.20       │ mfiDivergency5m │
// │ 361 │ TRUUSDT       │ 2024 06 08 07:45:00 │ 2024 06 08 08:05:00 │ LONG         │ -0.26% │ 30.66% │ 0.20       │ mfiDivergency5m │
// │ 362 │ 1000FLOKIUSDT │ 2024 06 08 08:30:00 │ 2024 06 08 16:50:00 │ LONG         │ 1.35%  │ 32.00% │ 0.27       │ rsiDivergency5m │
// │ 363 │ ACEUSDT       │ 2024 06 08 17:30:00 │ 2024 06 09 01:50:00 │ LONG         │ 0.26%  │ 32.27% │ 4.94       │ mfiDivergency5m │
// │ 364 │ PEOPLEUSDT    │ 2024 06 09 15:35:00 │ 2024 06 09 21:50:00 │ LONG         │ -0.26% │ 32.00% │ 0.12       │ mfiDivergency5m │
// │ 365 │ HIFIUSDT      │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.24%  │ 33.25% │ 0.75       │ rsiDivergency5m │
// │ 366 │ OMNIUSDT      │ 2024 06 10 02:40:00 │ 2024 06 10 02:45:00 │ LONG         │ -0.26% │ 27.31% │ 15.39      │ rsiDivergency5m │
// │ 367 │ OMNIUSDT      │ 2024 06 10 02:50:00 │ 2024 06 10 11:10:00 │ LONG         │ 0.50%  │ 27.81% │ 15.29      │ rsiDivergency5m │
// │ 368 │ TOKENUSDT     │ 2024 06 10 09:05:00 │ 2024 06 10 17:25:00 │ LONG         │ 0.14%  │ 33.39% │ 0.13       │ mfiDivergency5m │
// │ 369 │ WUSDT         │ 2024 06 10 18:50:00 │ 2024 06 10 20:50:00 │ LONG         │ -0.26% │ 33.12% │ 0.55       │ mfiDivergency5m │
// │ 370 │ AXLUSDT       │ 2024 06 10 21:00:00 │ 2024 06 10 21:15:00 │ LONG         │ -0.26% │ 32.86% │ 0.79       │ rsiDivergency5m │
// │ 371 │ ENAUSDT       │ 2024 06 10 21:20:00 │ 2024 06 10 21:30:00 │ LONG         │ -0.26% │ 32.60% │ 0.75       │ rsiDivergency5m │
// │ 372 │ 1000RATSUSDT  │ 2024 06 10 21:30:00 │ 2024 06 11 05:50:00 │ LONG         │ 0.26%  │ 32.86% │ 0.13       │ mfiDivergency5m │
// │ 373 │ NOTUSDT       │ 2024 06 11 00:15:00 │ 2024 06 11 00:20:00 │ LONG         │ -0.26% │ 14.09% │ 0.02       │ mfiDivergency5m │
// │ 374 │ AXLUSDT       │ 2024 06 11 18:50:00 │ 2024 06 11 19:25:00 │ LONG         │ -0.26% │ 34.83% │ 0.75       │ mfiDivergency5m │
// │ 375 │ DUSKUSDT      │ 2024 06 11 18:55:00 │ 2024 06 11 19:45:00 │ LONG         │ -0.26% │ 34.56% │ 0.43       │ mfiDivergency5m │
// │ 376 │ BAKEUSDT      │ 2024 06 11 20:05:00 │ 2024 06 11 20:10:00 │ LONG         │ -0.26% │ 34.30% │ 0.29       │ mfiDivergency5m │
// │ 377 │ ZETAUSDT      │ 2024 06 11 20:45:00 │ 2024 06 12 05:05:00 │ LONG         │ 0.96%  │ 35.26% │ 1.05       │ rsiDivergency5m │
// │ 378 │ ONGUSDT       │ 2024 06 12 05:05:00 │ 2024 06 12 05:10:00 │ SHORT        │ -0.26% │ 35.00% │ 0.41       │ rsiDivergency5m │
// │ 379 │ FETUSDT       │ 2024 06 12 07:05:00 │ 2024 06 12 07:30:00 │ SHORT        │ -0.26% │ 34.73% │ 1.62       │ mfiDivergency5m │
// │ 380 │ OMNIUSDT      │ 2024 06 12 08:00:00 │ 2024 06 12 08:45:00 │ SHORT        │ -0.26% │ 30.02% │ 16.80      │ rsiDivergency5m │
// │ 381 │ AXLUSDT       │ 2024 06 12 08:10:00 │ 2024 06 12 16:30:00 │ SHORT        │ 0.87%  │ 35.60% │ 0.81       │ mfiDivergency5m │
// │ 382 │ BBUSDT        │ 2024 06 12 08:10:00 │ 2024 06 12 14:45:00 │ SHORT        │ 2.49%  │ 18.89% │ 0.57       │ mfiDivergency5m │
// │ 383 │ ARKMUSDT      │ 2024 06 12 16:15:00 │ 2024 06 12 17:50:00 │ SHORT        │ -0.26% │ 35.34% │ 2.24       │ mfiDivergency5m │
// │ 384 │ TOKENUSDT     │ 2024 06 12 19:55:00 │ 2024 06 13 04:15:00 │ SHORT        │ 0.75%  │ 36.09% │ 0.12       │ mfiDivergency5m │
// │ 385 │ TRUUSDT       │ 2024 06 13 09:55:00 │ 2024 06 13 10:00:00 │ SHORT        │ -0.26% │ 35.83% │ 0.22       │ mfiDivergency5m │
// │ 386 │ TOKENUSDT     │ 2024 06 13 10:45:00 │ 2024 06 13 10:55:00 │ LONG         │ -0.26% │ 35.57% │ 0.10       │ mfiDivergency5m │
// │ 387 │ WUSDT         │ 2024 06 13 12:30:00 │ 2024 06 13 13:00:00 │ SHORT        │ -0.26% │ 35.31% │ 0.48       │ mfiDivergency5m │
// │ 388 │ WUSDT         │ 2024 06 13 13:20:00 │ 2024 06 13 21:40:00 │ SHORT        │ 0.66%  │ 35.97% │ 0.49       │ mfiDivergency5m │
// │ 389 │ BNXUSDT       │ 2024 06 13 22:40:00 │ 2024 06 13 23:15:00 │ SHORT        │ -0.26% │ 35.70% │ 1.09       │ mfiDivergency5m │
// │ 390 │ TOKENUSDT     │ 2024 06 13 23:40:00 │ 2024 06 14 08:00:00 │ LONG         │ 0.66%  │ 36.36% │ 0.10       │ mfiDivergency5m │
// │ 391 │ BNXUSDT       │ 2024 06 14 10:25:00 │ 2024 06 14 11:05:00 │ LONG         │ -0.26% │ 36.10% │ 1.10       │ mfiDivergency5m │
// │ 392 │ 1000RATSUSDT  │ 2024 06 14 11:30:00 │ 2024 06 14 13:10:00 │ LONG         │ -0.26% │ 35.84% │ 0.10       │ mfiDivergency5m │
// │ 393 │ MTLUSDT       │ 2024 06 14 12:40:00 │ 2024 06 14 13:20:00 │ LONG         │ -0.26% │ 35.58% │ 1.21       │ rsiDivergency5m │
// │ 394 │ CHRUSDT       │ 2024 06 14 13:25:00 │ 2024 06 14 21:45:00 │ LONG         │ 0.56%  │ 36.13% │ 0.26       │ mfiDivergency5m │
// │ 395 │ OMNIUSDT      │ 2024 06 14 19:25:00 │ 2024 06 14 19:45:00 │ SHORT        │ -0.26% │ 28.87% │ 16.89      │ rsiDivergency5m │
// │ 396 │ OMNIUSDT      │ 2024 06 14 20:10:00 │ 2024 06 14 21:50:00 │ SHORT        │ -0.26% │ 28.61% │ 17.18      │ rsiDivergency5m │
// │ 397 │ TOKENUSDT     │ 2024 06 14 22:35:00 │ 2024 06 15 01:00:00 │ SHORT        │ -0.26% │ 35.87% │ 0.10       │ mfiDivergency5m │
// │ 398 │ DODOXUSDT     │ 2024 06 15 01:30:00 │ 2024 06 15 09:50:00 │ SHORT        │ 0.31%  │ 36.18% │ 0.16       │ mfiDivergency5m │
// │ 399 │ ROSEUSDT      │ 2024 06 15 14:10:00 │ 2024 06 15 15:20:00 │ LONG         │ -0.26% │ 35.91% │ 0.12       │ mfiDivergency5m │
// │ 400 │ LDOUSDT       │ 2024 06 16 10:10:00 │ 2024 06 16 10:45:00 │ SHORT        │ -0.26% │ 35.65% │ 2.17       │ rsiDivergency5m │
// │ 401 │ LDOUSDT       │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 1.01%  │ 36.66% │ 2.24       │ rsiDivergency5m │
// │ 402 │ POLYXUSDT     │ 2024 06 16 21:05:00 │ 2024 06 16 21:25:00 │ LONG         │ -0.26% │ 36.39% │ 0.38       │ rsiDivergency5m │
// │ 403 │ WAXPUSDT      │ 2024 06 16 23:15:00 │ 2024 06 17 00:50:00 │ LONG         │ -0.26% │ 36.13% │ 0.04       │ rsiDivergency5m │
// │ 404 │ TRUUSDT       │ 2024 06 17 01:10:00 │ 2024 06 17 01:50:00 │ LONG         │ -0.26% │ 35.87% │ 0.17       │ mfiDivergency5m │
// │ 405 │ HIFIUSDT      │ 2024 06 17 02:15:00 │ 2024 06 17 03:30:00 │ LONG         │ -0.26% │ 35.61% │ 0.54       │ rsiDivergency5m │
// │ 406 │ OMNIUSDT      │ 2024 06 17 02:45:00 │ 2024 06 17 03:30:00 │ LONG         │ -0.26% │ 30.56% │ 16.28      │ rsiDivergency5m │
// │ 407 │ WIFUSDT       │ 2024 06 17 03:45:00 │ 2024 06 17 05:05:00 │ LONG         │ -0.26% │ 35.34% │ 2.40       │ mfiDivergency5m │
// │ 408 │ XAIUSDT       │ 2024 06 17 05:10:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.26% │ 35.08% │ 0.55       │ mfiDivergency5m │
// │ 409 │ KNCUSDT       │ 2024 06 17 10:55:00 │ 2024 06 17 11:05:00 │ LONG         │ -0.26% │ 34.82% │ 0.62       │ rsiDivergency5m │
// │ 410 │ BEAMXUSDT     │ 2024 06 17 12:10:00 │ 2024 06 17 12:35:00 │ SHORT        │ -0.26% │ 34.56% │ 0.02       │ mfiDivergency5m │
// │ 411 │ AXLUSDT       │ 2024 06 17 13:10:00 │ 2024 06 17 20:40:00 │ SHORT        │ 2.49%  │ 37.04% │ 0.71       │ mfiDivergency5m │
// │ 412 │ RDNTUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:30:00 │ LONG         │ -0.26% │ 36.78% │ 0.13       │ rsiDivergency5m │
// │ 413 │ ACEUSDT       │ 2024 06 17 20:50:00 │ 2024 06 17 21:05:00 │ LONG         │ -0.26% │ 36.52% │ 3.34       │ mfiDivergency5m │
// │ 414 │ ACEUSDT       │ 2024 06 17 21:10:00 │ 2024 06 18 05:30:00 │ LONG         │ 1.41%  │ 37.93% │ 3.34       │ mfiDivergency5m │
// │ 415 │ ENSUSDT       │ 2024 06 18 05:20:00 │ 2024 06 18 06:25:00 │ LONG         │ -0.26% │ 37.66% │ 22.26      │ mfiDivergency5m │
// │ 416 │ TLMUSDT       │ 2024 06 18 06:40:00 │ 2024 06 18 07:25:00 │ LONG         │ -0.26% │ 37.40% │ 0.01       │ mfiDivergency5m │
// │ 417 │ RENUSDT       │ 2024 06 18 07:10:00 │ 2024 06 18 07:20:00 │ LONG         │ -0.26% │ 37.14% │ 0.05       │ mfiDivergency5m │
// │ 418 │ TAOUSDT       │ 2024 06 18 08:05:00 │ 2024 06 18 08:30:00 │ LONG         │ -0.26% │ 32.60% │ 263.13     │ rsiDivergency5m │
// │ 419 │ TAOUSDT       │ 2024 06 18 09:05:00 │ 2024 06 18 16:50:00 │ LONG         │ 2.49%  │ 35.09% │ 258.16     │ rsiDivergency5m │
// │ 420 │ BNTUSDT       │ 2024 06 18 09:10:00 │ 2024 06 18 14:00:00 │ LONG         │ -0.26% │ 36.88% │ 0.62       │ mfiDivergency5m │
// │ 421 │ COMBOUSDT     │ 2024 06 18 14:10:00 │ 2024 06 18 20:05:00 │ LONG         │ 2.49%  │ 39.36% │ 0.67       │ mfiDivergency5m │
// │ 422 │ ENAUSDT       │ 2024 06 18 21:30:00 │ 2024 06 18 22:25:00 │ SHORT        │ -0.26% │ 39.10% │ 0.66       │ rsiDivergency5m │
// │ 423 │ BNXUSDT       │ 2024 06 18 22:05:00 │ 2024 06 19 06:25:00 │ SHORT        │ 0.15%  │ 39.25% │ 1.05       │ mfiDivergency5m │
// │ 424 │ PENDLEUSDT    │ 2024 06 19 09:55:00 │ 2024 06 19 18:15:00 │ LONG         │ 0.81%  │ 40.06% │ 5.65       │ mfiDivergency5m │
// │ 425 │ BONDUSDT      │ 2024 06 19 22:35:00 │ 2024 06 19 23:00:00 │ SHORT        │ -0.26% │ 39.80% │ 2.11       │ rsiDivergency5m │
// │ 426 │ BONDUSDT      │ 2024 06 20 00:40:00 │ 2024 06 20 00:50:00 │ SHORT        │ -0.26% │ 39.54% │ 2.25       │ rsiDivergency5m │
// │ 427 │ ARKMUSDT      │ 2024 06 20 03:05:00 │ 2024 06 20 05:55:00 │ SHORT        │ -0.26% │ 39.27% │ 1.89       │ mfiDivergency5m │
// │ 428 │ EDUUSDT       │ 2024 06 20 07:25:00 │ 2024 06 20 08:05:00 │ LONG         │ -0.26% │ 38.75% │ 0.63       │ mfiDivergency5m │
// │ 429 │ EDUUSDT       │ 2024 06 20 08:10:00 │ 2024 06 20 08:20:00 │ LONG         │ -0.26% │ 38.49% │ 0.62       │ mfiDivergency5m │
// │ 430 │ ONGUSDT       │ 2024 06 20 08:35:00 │ 2024 06 20 09:00:00 │ LONG         │ -0.26% │ 38.22% │ 0.34       │ mfiDivergency5m │
// │ 431 │ EDUUSDT       │ 2024 06 20 09:15:00 │ 2024 06 20 10:55:00 │ LONG         │ -0.26% │ 37.96% │ 0.60       │ mfiDivergency5m │
// │ 432 │ NOTUSDT       │ 2024 06 20 09:25:00 │ 2024 06 20 09:45:00 │ LONG         │ -0.26% │ 24.63% │ 0.01       │ mfiDivergency5m │
// │ 433 │ NOTUSDT       │ 2024 06 20 09:55:00 │ 2024 06 20 11:00:00 │ LONG         │ -0.26% │ 24.37% │ 0.01       │ mfiDivergency5m │
// │ 434 │ TOKENUSDT     │ 2024 06 20 13:10:00 │ 2024 06 20 14:05:00 │ SHORT        │ -0.26% │ 37.70% │ 0.09       │ mfiDivergency5m │
// │ 435 │ MTLUSDT       │ 2024 06 20 23:45:00 │ 2024 06 20 23:50:00 │ SHORT        │ -0.26% │ 37.67% │ 1.26       │ rsiDivergency5m │
// │ 436 │ MTLUSDT       │ 2024 06 20 23:55:00 │ 2024 06 21 01:00:00 │ SHORT        │ -0.26% │ 37.41% │ 1.27       │ rsiDivergency5m │
// │ 437 │ MTLUSDT       │ 2024 06 21 02:10:00 │ 2024 06 21 10:20:00 │ SHORT        │ 2.49%  │ 39.89% │ 1.33       │ mfiDivergency5m │
// │ 438 │ ONGUSDT       │ 2024 06 21 13:05:00 │ 2024 06 21 21:25:00 │ LONG         │ 1.66%  │ 41.56% │ 0.34       │ rsiDivergency5m │
// │ 439 │ UNFIUSDT      │ 2024 06 22 03:25:00 │ 2024 06 22 03:45:00 │ LONG         │ -0.26% │ 41.30% │ 4.20       │ mfiDivergency5m │
// │ 440 │ UNFIUSDT      │ 2024 06 22 04:05:00 │ 2024 06 22 10:00:00 │ LONG         │ -0.26% │ 41.03% │ 4.14       │ mfiDivergency5m │
// │ 441 │ PEOPLEUSDT    │ 2024 06 22 23:50:00 │ 2024 06 22 23:55:00 │ SHORT        │ -0.26% │ 40.77% │ 0.09       │ mfiDivergency5m │
// │ 442 │ MTLUSDT       │ 2024 06 23 01:00:00 │ 2024 06 23 01:05:00 │ SHORT        │ -0.26% │ 40.51% │ 1.25       │ rsiDivergency5m │
// │ 443 │ UNFIUSDT      │ 2024 06 23 08:10:00 │ 2024 06 23 08:30:00 │ LONG         │ -0.26% │ 40.25% │ 4.76       │ mfiDivergency5m │
// │ 444 │ MTLUSDT       │ 2024 06 23 09:50:00 │ 2024 06 23 10:20:00 │ LONG         │ -0.26% │ 39.98% │ 1.22       │ rsiDivergency5m │
// │ 445 │ MTLUSDT       │ 2024 06 23 12:00:00 │ 2024 06 23 15:30:00 │ LONG         │ -0.26% │ 39.72% │ 1.17       │ mfiDivergency5m │
// │ 446 │ BBUSDT        │ 2024 06 23 12:10:00 │ 2024 06 23 15:20:00 │ LONG         │ -0.26% │ 29.15% │ 0.38       │ mfiDivergency5m │
// │ 447 │ AEVOUSDT      │ 2024 06 23 18:35:00 │ 2024 06 23 21:55:00 │ LONG         │ -0.26% │ 39.46% │ 0.46       │ rsiDivergency5m │
// │ 448 │ PENDLEUSDT    │ 2024 06 23 22:30:00 │ 2024 06 24 00:10:00 │ LONG         │ -0.26% │ 39.20% │ 5.54       │ mfiDivergency5m │
// │ 449 │ AXLUSDT       │ 2024 06 24 00:35:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.26% │ 38.93% │ 0.54       │ mfiDivergency5m │
// │ 450 │ STRKUSDT      │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 1.58%  │ 40.51% │ 0.66       │ rsiDivergency5m │
// │ 451 │ 1000RATSUSDT  │ 2024 06 24 15:40:00 │ 2024 06 24 20:50:00 │ LONG         │ 2.49%  │ 43.00% │ 0.10       │ mfiDivergency5m │
// │ 452 │ 1000FLOKIUSDT │ 2024 06 24 21:40:00 │ 2024 06 24 22:15:00 │ SHORT        │ -0.26% │ 42.74% │ 0.17       │ mfiDivergency5m │
// │ 453 │ RNDRUSDT      │ 2024 06 24 22:20:00 │ 2024 06 24 22:30:00 │ SHORT        │ -0.26% │ 42.48% │ 7.71       │ mfiDivergency5m │
// │ 454 │ RNDRUSDT      │ 2024 06 24 22:40:00 │ 2024 06 25 07:00:00 │ SHORT        │ 0.14%  │ 42.62% │ 7.85       │ mfiDivergency5m │
// │ 455 │ BBUSDT        │ 2024 06 25 06:00:00 │ 2024 06 25 09:15:00 │ SHORT        │ -0.26% │ 27.96% │ 0.41       │ rsiDivergency5m │
// │ 456 │ MKRUSDT       │ 2024 06 25 07:35:00 │ 2024 06 25 10:50:00 │ SHORT        │ -0.26% │ 42.35% │ 2345.80    │ rsiDivergency5m │
// │ 457 │ BBUSDT        │ 2024 06 25 09:45:00 │ 2024 06 25 10:15:00 │ SHORT        │ -0.26% │ 27.69% │ 0.42       │ rsiDivergency5m │
// │ 458 │ BBUSDT        │ 2024 06 25 11:20:00 │ 2024 06 25 11:25:00 │ SHORT        │ -0.26% │ 27.43% │ 0.43       │ rsiDivergency5m │
// │ 459 │ BBUSDT        │ 2024 06 25 11:30:00 │ 2024 06 25 16:25:00 │ SHORT        │ -0.26% │ 27.17% │ 0.44       │ rsiDivergency5m │
// │ 460 │ NOTUSDT       │ 2024 06 25 14:40:00 │ 2024 06 25 16:30:00 │ SHORT        │ -0.26% │ 30.19% │ 0.02       │ mfiDivergency5m │
// │ 461 │ 1000RATSUSDT  │ 2024 06 25 21:10:00 │ 2024 06 25 21:15:00 │ SHORT        │ -0.26% │ 41.83% │ 0.13       │ rsiDivergency5m │
// │ 462 │ ONGUSDT       │ 2024 06 26 11:55:00 │ 2024 06 26 12:05:00 │ LONG         │ -0.26% │ 41.57% │ 0.34       │ rsiDivergency5m │
// │ 463 │ ONGUSDT       │ 2024 06 26 12:10:00 │ 2024 06 26 20:30:00 │ LONG         │ 0.30%  │ 41.87% │ 0.34       │ mfiDivergency5m │
// │ 464 │ BIGTIMEUSDT   │ 2024 06 27 00:55:00 │ 2024 06 27 01:45:00 │ LONG         │ -0.26% │ 41.61% │ 0.11       │ mfiDivergency5m │
// │ 465 │ BBUSDT        │ 2024 06 27 05:30:00 │ 2024 06 27 13:50:00 │ SHORT        │ 2.06%  │ 29.88% │ 0.47       │ rsiDivergency5m │
// │ 466 │ 1000RATSUSDT  │ 2024 06 27 05:35:00 │ 2024 06 27 09:10:00 │ SHORT        │ 2.49%  │ 44.09% │ 0.15       │ rsiDivergency5m │
// │ 467 │ JUPUSDT       │ 2024 06 27 09:15:00 │ 2024 06 27 09:20:00 │ SHORT        │ -0.26% │ 43.83% │ 0.87       │ rsiDivergency5m │
// │ 468 │ JUPUSDT       │ 2024 06 27 09:25:00 │ 2024 06 27 17:45:00 │ SHORT        │ 0.72%  │ 44.56% │ 0.88       │ rsiDivergency5m │
// │ 469 │ UNFIUSDT      │ 2024 06 27 17:35:00 │ 2024 06 27 18:00:00 │ LONG         │ -0.26% │ 44.29% │ 5.10       │ mfiDivergency5m │
// │ 470 │ UNFIUSDT      │ 2024 06 27 20:10:00 │ 2024 06 27 21:10:00 │ LONG         │ -0.26% │ 44.03% │ 4.85       │ mfiDivergency5m │
// │ 471 │ FETUSDT       │ 2024 06 28 00:45:00 │ 2024 06 28 09:05:00 │ LONG         │ 0.09%  │ 44.13% │ 1.45       │ mfiDivergency5m │
// │ 472 │ BNXUSDT       │ 2024 06 28 10:55:00 │ 2024 06 28 11:05:00 │ LONG         │ -0.26% │ 43.86% │ 1.05       │ mfiDivergency5m │
// │ 473 │ JTOUSDT       │ 2024 06 28 12:10:00 │ 2024 06 28 12:35:00 │ LONG         │ -0.26% │ 43.60% │ 2.33       │ mfiDivergency5m │
// │ 474 │ JTOUSDT       │ 2024 06 28 12:55:00 │ 2024 06 28 21:15:00 │ LONG         │ 0.30%  │ 43.90% │ 2.30       │ mfiDivergency5m │
// │ 475 │ MAVIAUSDT     │ 2024 06 29 06:25:00 │ 2024 06 29 14:45:00 │ SHORT        │ 2.19%  │ 46.09% │ 1.87       │ rsiDivergency5m │
// │ 476 │ BONDUSDT      │ 2024 06 29 15:50:00 │ 2024 06 29 16:15:00 │ LONG         │ -0.26% │ 45.83% │ 2.21       │ rsiDivergency5m │
// │ 477 │ BONDUSDT      │ 2024 06 29 16:20:00 │ 2024 06 29 17:10:00 │ LONG         │ -0.26% │ 45.57% │ 2.19       │ rsiDivergency5m │
// │ 478 │ BNXUSDT       │ 2024 06 29 17:10:00 │ 2024 06 30 01:15:00 │ LONG         │ 2.49%  │ 48.05% │ 0.67       │ mfiDivergency5m │
// │ 479 │ ARPAUSDT      │ 2024 06 30 02:15:00 │ 2024 06 30 02:35:00 │ SHORT        │ -0.26% │ 47.79% │ 0.04       │ rsiDivergency5m │
// │ 480 │ UNFIUSDT      │ 2024 06 30 07:20:00 │ 2024 06 30 07:40:00 │ SHORT        │ -0.26% │ 47.53% │ 4.86       │ mfiDivergency5m │
// │ 481 │ BNXUSDT       │ 2024 06 30 08:45:00 │ 2024 06 30 09:05:00 │ SHORT        │ -0.26% │ 47.27% │ 0.84       │ mfiDivergency5m │
// │ 482 │ UNFIUSDT      │ 2024 06 30 15:25:00 │ 2024 06 30 17:35:00 │ SHORT        │ -0.26% │ 47.00% │ 5.08       │ mfiDivergency5m │
// │ 483 │ SSVUSDT       │ 2024 06 30 17:55:00 │ 2024 06 30 21:55:00 │ SHORT        │ -0.26% │ 46.74% │ 40.86      │ mfiDivergency5m │
// │ 484 │ IMXUSDT       │ 2024 06 30 22:15:00 │ 2024 07 01 05:20:00 │ LONG         │ -0.26% │ 46.48% │ 1.58       │ mfiDivergency5m │
// │ 485 │ 1000RATSUSDT  │ 2024 07 01 10:40:00 │ 2024 07 01 11:00:00 │ LONG         │ -0.26% │ 46.22% │ 0.13       │ rsiDivergency5m │
// │ 486 │ ZENUSDT       │ 2024 07 01 11:55:00 │ 2024 07 01 20:15:00 │ LONG         │ 0.12%  │ 46.34% │ 7.14       │ mfiDivergency5m │
// │ 487 │ XAIUSDT       │ 2024 07 01 21:25:00 │ 2024 07 01 23:10:00 │ LONG         │ -0.26% │ 46.07% │ 0.37       │ rsiDivergency5m │
// │ 488 │ ZENUSDT       │ 2024 07 02 00:40:00 │ 2024 07 02 01:15:00 │ SHORT        │ -0.26% │ 45.81% │ 7.30       │ mfiDivergency5m │
// │ 489 │ BNXUSDT       │ 2024 07 02 02:15:00 │ 2024 07 02 02:20:00 │ SHORT        │ -0.26% │ 45.55% │ 0.86       │ mfiDivergency5m │
// │ 490 │ BNXUSDT       │ 2024 07 02 02:30:00 │ 2024 07 02 08:30:00 │ SHORT        │ -0.26% │ 45.29% │ 0.87       │ mfiDivergency5m │
// │ 491 │ OMNIUSDT      │ 2024 07 02 10:35:00 │ 2024 07 02 10:55:00 │ SHORT        │ -0.26% │ 39.01% │ 15.39      │ rsiDivergency5m │
// │ 492 │ XAIUSDT       │ 2024 07 02 14:35:00 │ 2024 07 02 15:05:00 │ LONG         │ -0.26% │ 45.02% │ 0.38       │ mfiDivergency5m │
// │ 493 │ XAIUSDT       │ 2024 07 02 15:50:00 │ 2024 07 02 17:00:00 │ LONG         │ -0.26% │ 44.76% │ 0.37       │ mfiDivergency5m │
// │ 494 │ TAOUSDT       │ 2024 07 02 16:05:00 │ 2024 07 02 18:00:00 │ LONG         │ -0.26% │ 42.09% │ 240.00     │ rsiDivergency5m │
// │ 495 │ CHRUSDT       │ 2024 07 02 16:45:00 │ 2024 07 02 17:15:00 │ SHORT        │ -0.26% │ 44.50% │ 0.25       │ mfiDivergency5m │
// │ 496 │ PENDLEUSDT    │ 2024 07 02 17:55:00 │ 2024 07 02 19:20:00 │ LONG         │ -0.26% │ 44.24% │ 4.10       │ mfiDivergency5m │
// │ 497 │ OMNIUSDT      │ 2024 07 02 18:35:00 │ 2024 07 02 19:05:00 │ SHORT        │ -0.26% │ 37.44% │ 16.29      │ rsiDivergency5m │
// │ 498 │ OMNIUSDT      │ 2024 07 02 19:10:00 │ 2024 07 03 03:30:00 │ SHORT        │ 0.50%  │ 37.93% │ 16.39      │ rsiDivergency5m │
// │ 499 │ LDOUSDT       │ 2024 07 02 22:35:00 │ 2024 07 02 22:45:00 │ LONG         │ -0.26% │ 43.97% │ 1.84       │ rsiDivergency5m │
// │ 500 │ CHRUSDT       │ 2024 07 02 23:10:00 │ 2024 07 03 00:45:00 │ LONG         │ -0.26% │ 43.71% │ 0.25       │ mfiDivergency5m │
// │ 501 │ LDOUSDT       │ 2024 07 03 01:30:00 │ 2024 07 03 08:05:00 │ LONG         │ -0.26% │ 43.45% │ 1.75       │ mfiDivergency5m │
// │ 502 │ MKRUSDT       │ 2024 07 03 08:05:00 │ 2024 07 03 14:20:00 │ LONG         │ -0.26% │ 43.19% │ 2340.30    │ rsiDivergency5m │
// │ 503 │ ENSUSDT       │ 2024 07 03 16:20:00 │ 2024 07 03 17:25:00 │ LONG         │ -0.26% │ 42.92% │ 25.55      │ mfiDivergency5m │
// │ 504 │ 1000RATSUSDT  │ 2024 07 03 18:10:00 │ 2024 07 03 20:30:00 │ LONG         │ -0.26% │ 42.66% │ 0.11       │ mfiDivergency5m │
// │ 505 │ ARKMUSDT      │ 2024 07 03 20:20:00 │ 2024 07 03 20:30:00 │ LONG         │ -0.26% │ 42.40% │ 1.54       │ mfiDivergency5m │
// │ 506 │ GTCUSDT       │ 2024 07 03 20:45:00 │ 2024 07 03 21:00:00 │ LONG         │ -0.26% │ 41.61% │ 0.87       │ mfiDivergency5m │
// │ 507 │ ARKMUSDT      │ 2024 07 03 20:50:00 │ 2024 07 03 20:55:00 │ LONG         │ -0.26% │ 41.87% │ 1.52       │ mfiDivergency5m │
// │ 508 │ 1000RATSUSDT  │ 2024 07 03 20:55:00 │ 2024 07 03 21:00:00 │ LONG         │ -0.26% │ 42.14% │ 0.11       │ rsiDivergency5m │
// │ 509 │ MANAUSDT      │ 2024 07 03 21:05:00 │ 2024 07 04 03:40:00 │ LONG         │ -0.26% │ 41.35% │ 0.31       │ mfiDivergency5m │
// │ 510 │ HOTUSDT       │ 2024 07 04 03:55:00 │ 2024 07 04 04:05:00 │ LONG         │ -0.26% │ 41.09% │ 0.00       │ mfiDivergency5m │
// │ 511 │ HOTUSDT       │ 2024 07 04 04:20:00 │ 2024 07 04 08:00:00 │ LONG         │ -0.26% │ 40.82% │ 0.00       │ mfiDivergency5m │
// │ 512 │ 1000PEPEUSDT  │ 2024 07 04 08:30:00 │ 2024 07 04 16:50:00 │ LONG         │ 1.18%  │ 42.00% │ 0.01       │ rsiDivergency5m │
// │ 513 │ MAVIAUSDT     │ 2024 07 04 17:25:00 │ 2024 07 04 17:55:00 │ LONG         │ -0.26% │ 41.74% │ 1.40       │ mfiDivergency5m │
// │ 514 │ EDUUSDT       │ 2024 07 04 19:10:00 │ 2024 07 04 19:35:00 │ LONG         │ -0.26% │ 41.48% │ 0.50       │ mfiDivergency5m │
// │ 515 │ BBUSDT        │ 2024 07 04 19:45:00 │ 2024 07 04 20:20:00 │ LONG         │ -0.26% │ 27.76% │ 0.34       │ rsiDivergency5m │
// │ 516 │ POLYXUSDT     │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.26% │ 41.22% │ 0.21       │ rsiDivergency5m │
// │ 517 │ ARBUSDT       │ 2024 07 04 20:30:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.26% │ 40.95% │ 0.63       │ mfiDivergency5m │
// │ 518 │ BBUSDT        │ 2024 07 04 20:35:00 │ 2024 07 04 21:25:00 │ LONG         │ -0.26% │ 27.50% │ 0.33       │ rsiDivergency5m │
// │ 519 │ OPUSDT        │ 2024 07 04 20:35:00 │ 2024 07 04 21:50:00 │ LONG         │ -0.26% │ 40.69% │ 1.36       │ rsiDivergency5m │
// │ 520 │ BBUSDT        │ 2024 07 04 21:30:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.26% │ 27.23% │ 0.33       │ rsiDivergency5m │
// │ 521 │ BEAMXUSDT     │ 2024 07 04 22:15:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.26% │ 40.43% │ 0.01       │ mfiDivergency5m │
// │ 522 │ RNDRUSDT      │ 2024 07 04 23:05:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.26% │ 40.17% │ 5.85       │ mfiDivergency5m │
// │ 523 │ STGUSDT       │ 2024 07 04 23:15:00 │ 2024 07 05 07:35:00 │ LONG         │ 2.03%  │ 42.19% │ 0.31       │ mfiDivergency5m │
// │ 524 │ RONINUSDT     │ 2024 07 05 08:40:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.26% │ 41.93% │ 1.66       │ rsiDivergency5m │
// │ 525 │ LQTYUSDT      │ 2024 07 05 10:10:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.26% │ 41.67% │ 0.72       │ rsiDivergency5m │
// │ 526 │ KAVAUSDT      │ 2024 07 05 11:15:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.26% │ 41.40% │ 0.36       │ rsiDivergency5m │
// └─────┴───────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴────────┴────────────┴─────────────────┘
