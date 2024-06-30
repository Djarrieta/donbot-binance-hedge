import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"EOSUSDT",
	"XMRUSDT",
	"DASHUSDT",
	"XTZUSDT",
	"ATOMUSDT",
	"IOTAUSDT",
	"VETUSDT",
	"IOSTUSDT",
	"THETAUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"SXPUSDT",
	"KAVAUSDT",
	"BANDUSDT",
	"SNXUSDT",
	"DOTUSDT",
	"DEFIUSDT",
	"SUSHIUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"ENJUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"AXSUSDT",
	"SKLUSDT",
	"GRTUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"UNFIUSDT",
	"XEMUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"DENTUSDT",
	"CELRUSDT",
	"MTLUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"ATAUSDT",
	"DYDXUSDT",
	"ARUSDT",
	"KLAYUSDT",
	"LPTUSDT",
	"ENSUSDT",
	"PEOPLEUSDT",
	"ROSEUSDT",
	"DUSKUSDT",
	"FLOWUSDT",
	"IMXUSDT",
	"API3USDT",
	"GMTUSDT",
	"APEUSDT",
	"JASMYUSDT",
	"DARUSDT",
	"OPUSDT",
	"STGUSDT",
	"1000LUNCUSDT",
	"LDOUSDT",
	"APTUSDT",
	"FETUSDT",
	"TUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"ASTRUSDT",
	"CFXUSDT",
	"STXUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"PERPUSDT",
	"TRUUSDT",
	"IDUSDT",
	"ARBUSDT",
	"JOEUSDT",
	"AMBUSDT",
	"LEVERUSDT",
	"RDNTUSDT",
	"HFTUSDT",
	"SUIUSDT",
	"UMAUSDT",
	"MAVUSDT",
	"WLDUSDT",
	"PENDLEUSDT",
	"AGLDUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"OXTUSDT",
	"SEIUSDT",
	"HIFIUSDT",
	"FRONTUSDT",
	"BICOUSDT",
	"BONDUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"POWRUSDT",
	"CAKEUSDT",
	"TWTUSDT",
	"BADGERUSDT",
	"NTRNUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"SUPERUSDT",
	"ONGUSDT",
	"ETHWUSDT",
	"JTOUSDT",
	"ACEUSDT",
	"NFPUSDT",
	"XAIUSDT",
	"MANTAUSDT",
	"ONDOUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"ZETAUSDT",
	"PIXELUSDT",
	"PORTALUSDT",
	"TONUSDT",
	"MYROUSDT",
	"BOMEUSDT",
	"ENAUSDT",
	"TAOUSDT",
	"OMNIUSDT",
	"IOUSDT",
	"LISTAUSDT",
	"ZROUSDT",
];
const stg: Strategy = {
	stgName: STG_NAME,
	lookBackLength: params.lookBackLength,
	interval: params.interval,
	validate: ({ candlestick, pair }) => {
		const response: StrategyResponse = {
			positionSide: null,
			sl: 7 / 100,
			tp: 7 / 100,
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

// ┌───┬───────┬───────┬────────────────┬───────────┬───────────┬───────────┬────────┬─────────────┬─────────┬───────────────┐
// │   │ sl    │ tp    │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ minDrawdown │ winRate │ avTradeLength │
// ├───┼───────┼───────┼────────────────┼───────────┼───────────┼───────────┼────────┼─────────────┼─────────┼───────────────┤
// │ 0 │ 7.00% │ 7.00% │ 100            │ 313       │ 169.16%   │ -27.12%   │ 97.74% │ -71.42%     │ 55.91%  │ 81.42         │
// └───┴───────┴───────┴────────────────┴───────────┴───────────┴───────────┴────────┴─────────────┴─────────┴───────────────┘
// ┌───┬───────┬───────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp    │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼───────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 7.00% │ 7.00% │ 100            │ 3362      │ 0.88% │ 61.72%  │
// └───┴───────┴───────┴────────────────┴───────────┴───────┴─────────┘

// ┌─────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬─────────┬────────────┬─────────────────┐
// │     │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl  │ entryPrice │ stgName         │
// ├─────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼─────────┼────────────┼─────────────────┤
// │   0 │ 1000LUNCUSDT │ 2024 03 01 17:40:00 │ 2024 03 02 00:35:00 │ SHORT        │ -7.05% │ -0.10%  │ 0.16       │ rsiDivergency5m │
// │   1 │ MAVUSDT      │ 2024 03 02 02:15:00 │ 2024 03 02 10:35:00 │ SHORT        │ 1.26%  │ 1.16%   │ 0.74       │ rsiDivergency5m │
// │   2 │ ENJUSDT      │ 2024 03 02 16:35:00 │ 2024 03 03 00:55:00 │ SHORT        │ 0.92%  │ 2.08%   │ 0.52       │ rsiDivergency5m │
// │   3 │ NTRNUSDT     │ 2024 03 03 02:30:00 │ 2024 03 03 04:15:00 │ LONG         │ 6.95%  │ 9.03%   │ 1.40       │ rsiDivergency5m │
// │   4 │ NTRNUSDT     │ 2024 03 03 05:20:00 │ 2024 03 03 13:40:00 │ SHORT        │ 1.79%  │ 10.83%  │ 1.54       │ rsiDivergency5m │
// │   5 │ POLYXUSDT    │ 2024 03 03 14:30:00 │ 2024 03 03 22:50:00 │ SHORT        │ 1.38%  │ 12.21%  │ 0.23       │ rsiDivergency5m │
// │   6 │ ICXUSDT      │ 2024 03 04 07:35:00 │ 2024 03 04 10:00:00 │ SHORT        │ 6.95%  │ 18.24%  │ 0.35       │ rsiDivergency5m │
// │   7 │ ALTUSDT      │ 2024 03 04 11:20:00 │ 2024 03 04 19:40:00 │ LONG         │ -1.21% │ 17.02%  │ 0.49       │ rsiDivergency5m │
// │   8 │ SEIUSDT      │ 2024 03 04 21:30:00 │ 2024 03 05 05:50:00 │ LONG         │ 5.40%  │ 22.42%  │ 0.76       │ rsiDivergency5m │
// │   9 │ MANTAUSDT    │ 2024 03 05 09:35:00 │ 2024 03 05 11:05:00 │ LONG         │ -7.05% │ 15.37%  │ 2.94       │ rsiDivergency5m │
// │  10 │ UMAUSDT      │ 2024 03 05 11:15:00 │ 2024 03 05 14:50:00 │ LONG         │ -7.05% │ 8.32%   │ 4.15       │ rsiDivergency5m │
// │  11 │ SKLUSDT      │ 2024 03 05 14:25:00 │ 2024 03 05 14:50:00 │ LONG         │ -7.05% │ 1.27%   │ 0.10       │ rsiDivergency5m │
// │  12 │ IMXUSDT      │ 2024 03 06 01:10:00 │ 2024 03 06 09:30:00 │ SHORT        │ 0.87%  │ 8.43%   │ 3.02       │ rsiDivergency5m │
// │  13 │ ONDOUSDT     │ 2024 03 06 14:10:00 │ 2024 03 06 17:00:00 │ SHORT        │ -7.05% │ 1.38%   │ 0.52       │ rsiDivergency5m │
// │  14 │ XAIUSDT      │ 2024 03 06 17:10:00 │ 2024 03 07 00:55:00 │ SHORT        │ -7.05% │ -5.67%  │ 1.38       │ rsiDivergency5m │
// │  15 │ XEMUSDT      │ 2024 03 07 03:55:00 │ 2024 03 07 12:15:00 │ SHORT        │ 3.37%  │ -2.30%  │ 0.06       │ rsiDivergency5m │
// │  16 │ ZETAUSDT     │ 2024 03 07 13:15:00 │ 2024 03 07 21:35:00 │ SHORT        │ 1.74%  │ -0.56%  │ 2.44       │ rsiDivergency5m │
// │  17 │ THETAUSDT    │ 2024 03 07 21:05:00 │ 2024 03 08 05:25:00 │ SHORT        │ 6.04%  │ 5.48%   │ 3.25       │ rsiDivergency5m │
// │  18 │ 1000SHIBUSDT │ 2024 03 08 09:05:00 │ 2024 03 08 10:25:00 │ SHORT        │ 6.95%  │ 12.43%  │ 0.04       │ rsiDivergency5m │
// │  19 │ SNXUSDT      │ 2024 03 08 10:35:00 │ 2024 03 08 18:55:00 │ LONG         │ 1.92%  │ 14.35%  │ 4.21       │ rsiDivergency5m │
// │  20 │ HFTUSDT      │ 2024 03 08 21:30:00 │ 2024 03 09 05:50:00 │ SHORT        │ -4.67% │ 9.68%   │ 0.49       │ rsiDivergency5m │
// │  21 │ PIXELUSDT    │ 2024 03 09 06:30:00 │ 2024 03 09 07:50:00 │ SHORT        │ -7.05% │ 2.63%   │ 0.74       │ rsiDivergency5m │
// │  22 │ AXSUSDT      │ 2024 03 09 07:05:00 │ 2024 03 09 15:25:00 │ SHORT        │ 1.29%  │ 3.92%   │ 12.47      │ rsiDivergency5m │
// │  23 │ MINAUSDT     │ 2024 03 09 20:25:00 │ 2024 03 10 04:45:00 │ SHORT        │ -0.52% │ 3.40%   │ 1.46       │ rsiDivergency5m │
// │  24 │ ETHWUSDT     │ 2024 03 10 05:25:00 │ 2024 03 10 08:20:00 │ SHORT        │ -7.05% │ -3.65%  │ 4.71       │ rsiDivergency5m │
// │  25 │ ARUSDT       │ 2024 03 10 08:30:00 │ 2024 03 10 16:50:00 │ LONG         │ -0.31% │ -3.96%  │ 40.79      │ rsiDivergency5m │
// │  26 │ 1000SHIBUSDT │ 2024 03 10 19:45:00 │ 2024 03 11 02:00:00 │ LONG         │ 6.95%  │ 2.99%   │ 0.03       │ rsiDivergency5m │
// │  27 │ JOEUSDT      │ 2024 03 11 02:30:00 │ 2024 03 11 05:15:00 │ SHORT        │ -7.05% │ -4.06%  │ 0.59       │ rsiDivergency5m │
// │  28 │ APTUSDT      │ 2024 03 11 05:25:00 │ 2024 03 11 13:45:00 │ SHORT        │ -0.26% │ -4.33%  │ 13.55      │ rsiDivergency5m │
// │  29 │ DASHUSDT     │ 2024 03 11 13:20:00 │ 2024 03 11 21:40:00 │ SHORT        │ 1.26%  │ -3.06%  │ 44.11      │ rsiDivergency5m │
// │  30 │ XRPUSDT      │ 2024 03 11 23:05:00 │ 2024 03 12 07:25:00 │ LONG         │ 0.12%  │ -2.94%  │ 0.69       │ rsiDivergency5m │
// │  31 │ CELRUSDT     │ 2024 03 13 04:05:00 │ 2024 03 13 12:25:00 │ SHORT        │ 2.80%  │ -4.68%  │ 0.04       │ rsiDivergency5m │
// │  32 │ 1000BONKUSDT │ 2024 03 13 14:20:00 │ 2024 03 13 22:15:00 │ SHORT        │ -7.05% │ -11.73% │ 0.03       │ rsiDivergency5m │
// │  33 │ 1000SHIBUSDT │ 2024 03 13 23:15:00 │ 2024 03 14 07:35:00 │ SHORT        │ 4.00%  │ -7.73%  │ 0.03       │ rsiDivergency5m │
// │  34 │ TONUSDT      │ 2024 03 14 03:30:00 │ 2024 03 14 11:50:00 │ SHORT        │ 2.51%  │ -0.43%  │ 4.23       │ rsiDivergency5m │
// │  35 │ ZETAUSDT     │ 2024 03 14 08:25:00 │ 2024 03 14 16:45:00 │ LONG         │ -0.67% │ -8.40%  │ 2.21       │ rsiDivergency5m │
// │  36 │ TONUSDT      │ 2024 03 14 14:20:00 │ 2024 03 14 22:25:00 │ LONG         │ -7.05% │ -7.48%  │ 3.91       │ rsiDivergency5m │
// │  37 │ HIFIUSDT     │ 2024 03 14 17:30:00 │ 2024 03 14 21:45:00 │ SHORT        │ 6.95%  │ -1.45%  │ 1.15       │ rsiDivergency5m │
// │  38 │ TWTUSDT      │ 2024 03 14 22:10:00 │ 2024 03 15 04:10:00 │ LONG         │ -7.05% │ -8.50%  │ 1.47       │ rsiDivergency5m │
// │  39 │ LSKUSDT      │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 4.19%  │ -4.31%  │ 1.82       │ rsiDivergency5m │
// │  40 │ AMBUSDT      │ 2024 03 15 14:45:00 │ 2024 03 15 18:50:00 │ SHORT        │ -7.05% │ -11.36% │ 0.02       │ rsiDivergency5m │
// │  41 │ API3USDT     │ 2024 03 15 18:45:00 │ 2024 03 16 03:05:00 │ SHORT        │ 0.39%  │ -10.98% │ 3.53       │ rsiDivergency5m │
// │  42 │ XAIUSDT      │ 2024 03 16 03:45:00 │ 2024 03 16 07:50:00 │ SHORT        │ 6.95%  │ -4.03%  │ 1.40       │ rsiDivergency5m │
// │  43 │ SSVUSDT      │ 2024 03 16 07:40:00 │ 2024 03 16 15:15:00 │ LONG         │ -7.05% │ -11.08% │ 46.10      │ rsiDivergency5m │
// │  44 │ APTUSDT      │ 2024 03 16 15:20:00 │ 2024 03 16 23:00:00 │ LONG         │ 6.95%  │ -4.13%  │ 13.10      │ rsiDivergency5m │
// │  45 │ PIXELUSDT    │ 2024 03 17 01:20:00 │ 2024 03 17 09:40:00 │ LONG         │ 4.62%  │ 0.50%   │ 0.70       │ rsiDivergency5m │
// │  46 │ SSVUSDT      │ 2024 03 17 09:35:00 │ 2024 03 17 17:55:00 │ SHORT        │ -1.65% │ -1.16%  │ 47.38      │ rsiDivergency5m │
// │  47 │ RIFUSDT      │ 2024 03 17 19:40:00 │ 2024 03 18 04:00:00 │ LONG         │ -1.44% │ -2.60%  │ 0.25       │ rsiDivergency5m │
// │  48 │ 1000BONKUSDT │ 2024 03 18 04:10:00 │ 2024 03 18 11:45:00 │ LONG         │ -7.05% │ -9.65%  │ 0.03       │ rsiDivergency5m │
// │  49 │ ATAUSDT      │ 2024 03 18 12:10:00 │ 2024 03 18 20:30:00 │ LONG         │ -5.42% │ -15.07% │ 0.17       │ rsiDivergency5m │
// │  50 │ GMTUSDT      │ 2024 03 18 20:50:00 │ 2024 03 19 02:15:00 │ LONG         │ -7.05% │ -22.12% │ 0.27       │ rsiDivergency5m │
// │  51 │ PEOPLEUSDT   │ 2024 03 19 02:15:00 │ 2024 03 19 10:35:00 │ LONG         │ 6.95%  │ -15.17% │ 0.03       │ rsiDivergency5m │
// │  52 │ FLOWUSDT     │ 2024 03 19 10:50:00 │ 2024 03 19 18:10:00 │ SHORT        │ 6.95%  │ -8.22%  │ 1.27       │ rsiDivergency5m │
// │  53 │ AMBUSDT      │ 2024 03 19 18:25:00 │ 2024 03 20 02:45:00 │ LONG         │ 4.29%  │ -3.93%  │ 0.01       │ rsiDivergency5m │
// │  54 │ MAVUSDT      │ 2024 03 20 02:55:00 │ 2024 03 20 11:15:00 │ SHORT        │ 0.60%  │ -3.33%  │ 0.51       │ rsiDivergency5m │
// │  55 │ RIFUSDT      │ 2024 03 20 13:55:00 │ 2024 03 20 22:15:00 │ SHORT        │ -5.64% │ -8.97%  │ 0.23       │ rsiDivergency5m │
// │  56 │ HIFIUSDT     │ 2024 03 20 22:55:00 │ 2024 03 20 23:50:00 │ SHORT        │ -7.05% │ -16.02% │ 1.06       │ rsiDivergency5m │
// │  57 │ TWTUSDT      │ 2024 03 21 00:10:00 │ 2024 03 21 08:30:00 │ LONG         │ 1.93%  │ -14.09% │ 1.32       │ rsiDivergency5m │
// │  58 │ RSRUSDT      │ 2024 03 21 08:25:00 │ 2024 03 21 09:30:00 │ SHORT        │ -7.05% │ -21.14% │ 0.01       │ rsiDivergency5m │
// │  59 │ JASMYUSDT    │ 2024 03 21 19:35:00 │ 2024 03 22 03:55:00 │ SHORT        │ 1.26%  │ -19.87% │ 0.02       │ rsiDivergency5m │
// │  60 │ SSVUSDT      │ 2024 03 22 04:10:00 │ 2024 03 22 06:00:00 │ SHORT        │ 6.95%  │ -12.92% │ 63.60      │ rsiDivergency5m │
// │  61 │ API3USDT     │ 2024 03 22 06:20:00 │ 2024 03 22 14:40:00 │ LONG         │ -3.44% │ -16.36% │ 3.62       │ rsiDivergency5m │
// │  62 │ 1000SHIBUSDT │ 2024 03 22 17:20:00 │ 2024 03 23 01:40:00 │ LONG         │ 5.18%  │ -11.18% │ 0.03       │ rsiDivergency5m │
// │  63 │ BADGERUSDT   │ 2024 03 23 02:45:00 │ 2024 03 23 06:25:00 │ SHORT        │ -7.05% │ -18.23% │ 5.73       │ rsiDivergency5m │
// │  64 │ 1000LUNCUSDT │ 2024 03 23 06:25:00 │ 2024 03 23 14:25:00 │ SHORT        │ 6.95%  │ -11.28% │ 0.17       │ rsiDivergency5m │
// │  65 │ ONGUSDT      │ 2024 03 23 19:50:00 │ 2024 03 23 20:30:00 │ SHORT        │ 6.95%  │ -4.33%  │ 0.42       │ rsiDivergency5m │
// │  66 │ DUSKUSDT     │ 2024 03 23 20:10:00 │ 2024 03 23 22:55:00 │ SHORT        │ 6.95%  │ 2.62%   │ 0.47       │ rsiDivergency5m │
// │  67 │ HIFIUSDT     │ 2024 03 23 23:25:00 │ 2024 03 24 07:45:00 │ LONG         │ 2.65%  │ 5.27%   │ 1.06       │ rsiDivergency5m │
// │  68 │ OPUSDT       │ 2024 03 24 07:55:00 │ 2024 03 24 16:15:00 │ SHORT        │ -0.06% │ 5.21%   │ 3.73       │ rsiDivergency5m │
// │  69 │ ONEUSDT      │ 2024 03 24 16:10:00 │ 2024 03 25 00:30:00 │ SHORT        │ 3.26%  │ 8.48%   │ 0.03       │ rsiDivergency5m │
// │  70 │ ALTUSDT      │ 2024 03 25 03:55:00 │ 2024 03 25 12:15:00 │ SHORT        │ -2.14% │ 6.34%   │ 0.56       │ rsiDivergency5m │
// │  71 │ SKLUSDT      │ 2024 03 25 15:15:00 │ 2024 03 25 22:00:00 │ SHORT        │ -7.05% │ -0.71%  │ 0.12       │ rsiDivergency5m │
// │  72 │ DARUSDT      │ 2024 03 25 22:55:00 │ 2024 03 26 07:15:00 │ SHORT        │ 0.90%  │ 0.19%   │ 0.26       │ rsiDivergency5m │
// │  73 │ API3USDT     │ 2024 03 26 10:20:00 │ 2024 03 26 18:40:00 │ LONG         │ 1.65%  │ 1.84%   │ 3.90       │ rsiDivergency5m │
// │  74 │ CFXUSDT      │ 2024 03 26 19:20:00 │ 2024 03 27 03:40:00 │ SHORT        │ 2.80%  │ 4.64%   │ 0.50       │ rsiDivergency5m │
// │  75 │ HIFIUSDT     │ 2024 03 27 04:05:00 │ 2024 03 27 12:25:00 │ LONG         │ 0.50%  │ 5.14%   │ 1.26       │ rsiDivergency5m │
// │  76 │ LDOUSDT      │ 2024 03 27 14:45:00 │ 2024 03 27 23:05:00 │ LONG         │ -1.10% │ 4.05%   │ 2.96       │ rsiDivergency5m │
// │  77 │ HIFIUSDT     │ 2024 03 28 00:05:00 │ 2024 03 28 08:25:00 │ SHORT        │ 1.91%  │ 5.95%   │ 1.24       │ rsiDivergency5m │
// │  78 │ 1000BONKUSDT │ 2024 03 28 09:30:00 │ 2024 03 28 17:50:00 │ SHORT        │ 1.85%  │ 7.80%   │ 0.03       │ rsiDivergency5m │
// │  79 │ POLYXUSDT    │ 2024 03 28 21:10:00 │ 2024 03 29 05:30:00 │ LONG         │ -1.37% │ 6.43%   │ 0.54       │ rsiDivergency5m │
// │  80 │ SKLUSDT      │ 2024 03 29 06:15:00 │ 2024 03 29 07:55:00 │ SHORT        │ -7.05% │ -0.62%  │ 0.13       │ rsiDivergency5m │
// │  81 │ SUIUSDT      │ 2024 03 29 10:00:00 │ 2024 03 29 18:20:00 │ LONG         │ -2.34% │ -2.95%  │ 1.96       │ rsiDivergency5m │
// │  82 │ MAVUSDT      │ 2024 03 29 19:35:00 │ 2024 03 30 03:55:00 │ LONG         │ -0.31% │ -3.26%  │ 0.66       │ rsiDivergency5m │
// │  83 │ UNFIUSDT     │ 2024 03 30 07:25:00 │ 2024 03 30 15:45:00 │ LONG         │ -4.35% │ -7.61%  │ 7.52       │ rsiDivergency5m │
// │  84 │ TUSDT        │ 2024 03 30 23:55:00 │ 2024 03 31 08:15:00 │ SHORT        │ 5.32%  │ -2.29%  │ 0.06       │ rsiDivergency5m │
// │  85 │ TUSDT        │ 2024 03 31 09:50:00 │ 2024 03 31 18:10:00 │ LONG         │ 0.73%  │ -1.56%  │ 0.05       │ rsiDivergency5m │
// │  86 │ ONDOUSDT     │ 2024 03 31 19:40:00 │ 2024 04 01 00:50:00 │ LONG         │ -7.05% │ -8.61%  │ 0.95       │ rsiDivergency5m │
// │  87 │ CFXUSDT      │ 2024 04 01 00:35:00 │ 2024 04 01 00:50:00 │ LONG         │ -7.05% │ -15.66% │ 0.44       │ rsiDivergency5m │
// │  88 │ PENDLEUSDT   │ 2024 04 01 01:45:00 │ 2024 04 01 08:00:00 │ SHORT        │ 6.95%  │ -8.71%  │ 5.77       │ rsiDivergency5m │
// │  89 │ PENDLEUSDT   │ 2024 04 01 10:00:00 │ 2024 04 01 18:20:00 │ LONG         │ 2.85%  │ -5.85%  │ 5.24       │ rsiDivergency5m │
// │  90 │ PENDLEUSDT   │ 2024 04 01 20:35:00 │ 2024 04 01 22:30:00 │ LONG         │ 6.95%  │ 1.10%   │ 5.08       │ rsiDivergency5m │
// │  91 │ OPUSDT       │ 2024 04 01 22:25:00 │ 2024 04 02 06:45:00 │ LONG         │ -3.99% │ -2.89%  │ 3.32       │ rsiDivergency5m │
// │  92 │ MTLUSDT      │ 2024 04 02 09:05:00 │ 2024 04 02 17:25:00 │ LONG         │ 2.78%  │ -0.11%  │ 1.99       │ rsiDivergency5m │
// │  93 │ JTOUSDT      │ 2024 04 02 20:25:00 │ 2024 04 03 00:20:00 │ LONG         │ 6.95%  │ 6.84%   │ 3.81       │ rsiDivergency5m │
// │  94 │ NKNUSDT      │ 2024 04 03 08:45:00 │ 2024 04 03 09:30:00 │ LONG         │ 6.95%  │ 14.40%  │ 0.17       │ rsiDivergency5m │
// │  95 │ AGLDUSDT     │ 2024 04 03 11:50:00 │ 2024 04 03 13:05:00 │ SHORT        │ 6.95%  │ 21.35%  │ 1.71       │ rsiDivergency5m │
// │  96 │ TRUUSDT      │ 2024 04 03 13:30:00 │ 2024 04 03 21:50:00 │ LONG         │ -1.32% │ 20.03%  │ 0.12       │ rsiDivergency5m │
// │  97 │ POLYXUSDT    │ 2024 04 03 23:25:00 │ 2024 04 04 07:45:00 │ LONG         │ 4.08%  │ 24.12%  │ 0.53       │ rsiDivergency5m │
// │  98 │ 1000BONKUSDT │ 2024 04 04 08:45:00 │ 2024 04 04 17:05:00 │ SHORT        │ 6.63%  │ 30.75%  │ 0.02       │ rsiDivergency5m │
// │  99 │ LSKUSDT      │ 2024 04 04 20:00:00 │ 2024 04 05 04:20:00 │ SHORT        │ -3.28% │ 27.47%  │ 1.99       │ rsiDivergency5m │
// │ 100 │ CKBUSDT      │ 2024 04 05 04:25:00 │ 2024 04 05 11:00:00 │ LONG         │ 6.95%  │ 34.42%  │ 0.02       │ rsiDivergency5m │
// │ 101 │ CKBUSDT      │ 2024 04 05 11:40:00 │ 2024 04 05 20:00:00 │ SHORT        │ -1.45% │ 32.98%  │ 0.02       │ rsiDivergency5m │
// │ 102 │ NKNUSDT      │ 2024 04 05 20:50:00 │ 2024 04 06 05:10:00 │ SHORT        │ -3.27% │ 29.71%  │ 0.18       │ rsiDivergency5m │
// │ 103 │ PENDLEUSDT   │ 2024 04 06 12:05:00 │ 2024 04 06 20:25:00 │ LONG         │ -0.61% │ 29.10%  │ 6.74       │ rsiDivergency5m │
// │ 104 │ TRUUSDT      │ 2024 04 06 22:50:00 │ 2024 04 07 07:10:00 │ SHORT        │ 2.96%  │ 32.05%  │ 0.16       │ rsiDivergency5m │
// │ 105 │ ALTUSDT      │ 2024 04 07 08:55:00 │ 2024 04 07 17:15:00 │ SHORT        │ -4.77% │ 27.28%  │ 0.60       │ rsiDivergency5m │
// │ 106 │ VETUSDT      │ 2024 04 08 05:15:00 │ 2024 04 08 13:35:00 │ SHORT        │ -1.66% │ 27.66%  │ 0.05       │ rsiDivergency5m │
// │ 107 │ ETHWUSDT     │ 2024 04 08 17:50:00 │ 2024 04 09 02:10:00 │ SHORT        │ 2.09%  │ 29.75%  │ 5.65       │ rsiDivergency5m │
// │ 108 │ HIGHUSDT     │ 2024 04 09 04:35:00 │ 2024 04 09 12:55:00 │ LONG         │ -3.23% │ 26.52%  │ 3.38       │ rsiDivergency5m │
// │ 109 │ LDOUSDT      │ 2024 04 09 18:55:00 │ 2024 04 10 03:15:00 │ LONG         │ -0.96% │ 25.56%  │ 2.68       │ rsiDivergency5m │
// │ 110 │ AGLDUSDT     │ 2024 04 10 08:15:00 │ 2024 04 10 16:35:00 │ LONG         │ -0.51% │ 25.05%  │ 1.43       │ rsiDivergency5m │
// │ 111 │ CELRUSDT     │ 2024 04 10 16:35:00 │ 2024 04 11 00:55:00 │ LONG         │ 4.85%  │ 29.91%  │ 0.03       │ rsiDivergency5m │
// │ 112 │ ATAUSDT      │ 2024 04 11 01:45:00 │ 2024 04 11 03:20:00 │ SHORT        │ -7.05% │ 22.86%  │ 0.23       │ rsiDivergency5m │
// │ 113 │ ATAUSDT      │ 2024 04 11 03:25:00 │ 2024 04 11 05:20:00 │ SHORT        │ -7.05% │ 15.81%  │ 0.25       │ rsiDivergency5m │
// │ 114 │ CKBUSDT      │ 2024 04 11 06:20:00 │ 2024 04 11 13:20:00 │ LONG         │ -7.05% │ 8.76%   │ 0.03       │ rsiDivergency5m │
// │ 115 │ ONDOUSDT     │ 2024 04 11 16:15:00 │ 2024 04 12 00:35:00 │ SHORT        │ -0.63% │ 8.13%   │ 0.83       │ rsiDivergency5m │
// │ 116 │ JASMYUSDT    │ 2024 04 12 07:50:00 │ 2024 04 12 12:25:00 │ LONG         │ -7.05% │ 1.08%   │ 0.02       │ rsiDivergency5m │
// │ 117 │ WLDUSDT      │ 2024 04 12 12:45:00 │ 2024 04 12 13:30:00 │ LONG         │ -7.05% │ -5.97%  │ 6.09       │ rsiDivergency5m │
// │ 118 │ DUSKUSDT     │ 2024 04 12 13:20:00 │ 2024 04 12 13:30:00 │ LONG         │ -7.05% │ -13.02% │ 0.39       │ rsiDivergency5m │
// │ 119 │ EOSUSDT      │ 2024 04 12 13:20:00 │ 2024 04 12 13:30:00 │ LONG         │ -7.05% │ -27.12% │ 1.02       │ rsiDivergency5m │
// │ 120 │ RSRUSDT      │ 2024 04 12 13:20:00 │ 2024 04 12 13:30:00 │ LONG         │ -7.05% │ -20.07% │ 0.01       │ rsiDivergency5m │
// │ 121 │ XMRUSDT      │ 2024 04 12 15:25:00 │ 2024 04 12 23:45:00 │ LONG         │ 6.16%  │ -20.96% │ 118.62     │ rsiDivergency5m │
// │ 122 │ TWTUSDT      │ 2024 04 13 01:10:00 │ 2024 04 13 09:30:00 │ SHORT        │ -0.88% │ -21.84% │ 1.11       │ rsiDivergency5m │
// │ 123 │ RIFUSDT      │ 2024 04 14 01:45:00 │ 2024 04 14 10:05:00 │ SHORT        │ 1.22%  │ -21.33% │ 0.20       │ rsiDivergency5m │
// │ 124 │ DUSKUSDT     │ 2024 04 14 11:25:00 │ 2024 04 14 12:20:00 │ SHORT        │ 6.95%  │ -14.38% │ 0.38       │ rsiDivergency5m │
// │ 125 │ ATAUSDT      │ 2024 04 14 16:05:00 │ 2024 04 14 17:35:00 │ LONG         │ 6.95%  │ -7.43%  │ 0.15       │ rsiDivergency5m │
// │ 126 │ PENDLEUSDT   │ 2024 04 14 18:00:00 │ 2024 04 15 02:20:00 │ SHORT        │ -1.69% │ -9.13%  │ 6.57       │ rsiDivergency5m │
// │ 127 │ PERPUSDT     │ 2024 04 15 02:20:00 │ 2024 04 15 10:40:00 │ SHORT        │ 4.74%  │ -4.39%  │ 1.11       │ rsiDivergency5m │
// │ 128 │ MANTAUSDT    │ 2024 04 15 11:30:00 │ 2024 04 15 14:10:00 │ LONG         │ 6.95%  │ 2.56%   │ 1.98       │ rsiDivergency5m │
// │ 129 │ API3USDT     │ 2024 04 15 14:05:00 │ 2024 04 15 22:25:00 │ LONG         │ 3.14%  │ 5.71%   │ 2.16       │ rsiDivergency5m │
// │ 130 │ POWRUSDT     │ 2024 04 16 02:10:00 │ 2024 04 16 10:30:00 │ SHORT        │ 3.44%  │ 9.14%   │ 0.29       │ rsiDivergency5m │
// │ 131 │ TAOUSDT      │ 2024 04 16 07:55:00 │ 2024 04 16 16:15:00 │ LONG         │ 6.30%  │ 7.57%   │ 462.42     │ rsiDivergency5m │
// │ 132 │ ZETAUSDT     │ 2024 04 16 11:30:00 │ 2024 04 16 19:50:00 │ LONG         │ 3.18%  │ 12.33%  │ 1.21       │ rsiDivergency5m │
// │ 133 │ JASMYUSDT    │ 2024 04 17 05:50:00 │ 2024 04 17 14:10:00 │ LONG         │ 0.88%  │ 6.16%   │ 0.02       │ rsiDivergency5m │
// │ 134 │ ONGUSDT      │ 2024 04 17 15:10:00 │ 2024 04 17 19:15:00 │ LONG         │ -7.05% │ -0.89%  │ 0.50       │ rsiDivergency5m │
// │ 135 │ CKBUSDT      │ 2024 04 18 05:50:00 │ 2024 04 18 09:15:00 │ LONG         │ 6.95%  │ 8.94%   │ 0.02       │ rsiDivergency5m │
// │ 136 │ TRUUSDT      │ 2024 04 18 09:25:00 │ 2024 04 18 14:20:00 │ SHORT        │ -7.05% │ 1.89%   │ 0.11       │ rsiDivergency5m │
// │ 137 │ LPTUSDT      │ 2024 04 18 14:35:00 │ 2024 04 18 20:10:00 │ SHORT        │ 6.95%  │ 8.84%   │ 13.94      │ rsiDivergency5m │
// │ 138 │ TONUSDT      │ 2024 04 18 15:10:00 │ 2024 04 18 23:30:00 │ SHORT        │ -7.05% │ 5.28%   │ 6.50       │ rsiDivergency5m │
// │ 139 │ FRONTUSDT    │ 2024 04 18 21:00:00 │ 2024 04 19 05:20:00 │ LONG         │ 4.41%  │ 13.25%  │ 0.69       │ rsiDivergency5m │
// │ 140 │ OMNIUSDT     │ 2024 04 19 05:00:00 │ 2024 04 19 08:05:00 │ SHORT        │ 6.95%  │ 6.95%   │ 26.47      │ rsiDivergency5m │
// │ 141 │ HIGHUSDT     │ 2024 04 19 05:55:00 │ 2024 04 19 14:15:00 │ SHORT        │ -0.90% │ 12.34%  │ 2.41       │ rsiDivergency5m │
// │ 142 │ JTOUSDT      │ 2024 04 21 05:55:00 │ 2024 04 21 08:45:00 │ SHORT        │ 6.95%  │ 26.52%  │ 4.14       │ rsiDivergency5m │
// │ 143 │ PENDLEUSDT   │ 2024 04 21 09:20:00 │ 2024 04 21 17:40:00 │ LONG         │ 0.44%  │ 26.96%  │ 5.88       │ rsiDivergency5m │
// │ 144 │ NTRNUSDT     │ 2024 04 21 23:10:00 │ 2024 04 22 07:30:00 │ SHORT        │ 2.25%  │ 29.22%  │ 0.87       │ rsiDivergency5m │
// │ 145 │ ATAUSDT      │ 2024 04 22 23:20:00 │ 2024 04 23 00:30:00 │ SHORT        │ -7.05% │ 23.92%  │ 0.21       │ rsiDivergency5m │
// │ 146 │ ATAUSDT      │ 2024 04 23 01:20:00 │ 2024 04 23 03:00:00 │ SHORT        │ 6.95%  │ 30.87%  │ 0.23       │ rsiDivergency5m │
// │ 147 │ BOMEUSDT     │ 2024 04 23 11:45:00 │ 2024 04 23 20:05:00 │ SHORT        │ 2.04%  │ 29.32%  │ 0.01       │ rsiDivergency5m │
// │ 148 │ 1000BONKUSDT │ 2024 04 23 19:45:00 │ 2024 04 24 04:05:00 │ SHORT        │ -2.02% │ 30.79%  │ 0.03       │ rsiDivergency5m │
// │ 149 │ ONDOUSDT     │ 2024 04 24 06:00:00 │ 2024 04 24 14:00:00 │ SHORT        │ 6.95%  │ 37.74%  │ 0.91       │ rsiDivergency5m │
// │ 150 │ API3USDT     │ 2024 04 24 14:00:00 │ 2024 04 24 22:20:00 │ LONG         │ -2.06% │ 35.68%  │ 2.46       │ rsiDivergency5m │
// │ 151 │ AMBUSDT      │ 2024 04 24 23:15:00 │ 2024 04 25 07:35:00 │ LONG         │ 2.99%  │ 38.67%  │ 0.01       │ rsiDivergency5m │
// │ 152 │ 1000BONKUSDT │ 2024 04 25 12:00:00 │ 2024 04 25 18:45:00 │ SHORT        │ 6.95%  │ 45.62%  │ 0.03       │ rsiDivergency5m │
// │ 153 │ MYROUSDT     │ 2024 04 25 12:00:00 │ 2024 04 25 19:45:00 │ SHORT        │ 6.95%  │ 19.29%  │ 0.18       │ rsiDivergency5m │
// │ 154 │ LSKUSDT      │ 2024 04 25 18:55:00 │ 2024 04 26 03:15:00 │ LONG         │ -2.45% │ 43.17%  │ 1.91       │ rsiDivergency5m │
// │ 155 │ MYROUSDT     │ 2024 04 25 19:50:00 │ 2024 04 26 04:10:00 │ LONG         │ 0.28%  │ 19.57%  │ 0.17       │ rsiDivergency5m │
// │ 156 │ LSKUSDT      │ 2024 04 26 19:45:00 │ 2024 04 27 04:05:00 │ LONG         │ -3.90% │ 46.22%  │ 1.68       │ rsiDivergency5m │
// │ 157 │ OPUSDT       │ 2024 04 27 13:55:00 │ 2024 04 27 22:15:00 │ SHORT        │ -2.04% │ 37.13%  │ 2.63       │ rsiDivergency5m │
// │ 158 │ ATAUSDT      │ 2024 04 27 22:15:00 │ 2024 04 28 06:35:00 │ SHORT        │ -2.79% │ 34.34%  │ 0.23       │ rsiDivergency5m │
// │ 159 │ FRONTUSDT    │ 2024 04 28 07:50:00 │ 2024 04 28 16:10:00 │ LONG         │ 1.62%  │ 35.97%  │ 0.91       │ rsiDivergency5m │
// │ 160 │ HIGHUSDT     │ 2024 04 28 18:30:00 │ 2024 04 29 02:50:00 │ LONG         │ 3.07%  │ 39.04%  │ 3.83       │ rsiDivergency5m │
// │ 161 │ PORTALUSDT   │ 2024 04 29 03:25:00 │ 2024 04 29 11:45:00 │ LONG         │ 1.37%  │ 40.41%  │ 0.85       │ rsiDivergency5m │
// │ 162 │ ATAUSDT      │ 2024 04 29 21:55:00 │ 2024 04 30 06:15:00 │ LONG         │ 3.40%  │ 40.26%  │ 0.22       │ rsiDivergency5m │
// │ 163 │ XAIUSDT      │ 2024 04 30 06:55:00 │ 2024 04 30 15:15:00 │ LONG         │ -0.64% │ 39.62%  │ 0.66       │ rsiDivergency5m │
// │ 164 │ TRUUSDT      │ 2024 04 30 16:20:00 │ 2024 05 01 00:40:00 │ SHORT        │ 0.23%  │ 39.85%  │ 0.10       │ rsiDivergency5m │
// │ 165 │ NFPUSDT      │ 2024 05 01 02:35:00 │ 2024 05 01 10:55:00 │ LONG         │ 2.71%  │ 42.56%  │ 0.38       │ rsiDivergency5m │
// │ 166 │ DOGEUSDT     │ 2024 05 01 10:20:00 │ 2024 05 01 13:15:00 │ LONG         │ 6.95%  │ 49.51%  │ 0.12       │ rsiDivergency5m │
// │ 167 │ JASMYUSDT    │ 2024 05 01 13:45:00 │ 2024 05 01 22:05:00 │ SHORT        │ 4.28%  │ 53.79%  │ 0.02       │ rsiDivergency5m │
// │ 168 │ MYROUSDT     │ 2024 05 01 13:45:00 │ 2024 05 01 15:15:00 │ SHORT        │ 6.95%  │ 50.12%  │ 0.14       │ rsiDivergency5m │
// │ 169 │ ONGUSDT      │ 2024 05 02 00:30:00 │ 2024 05 02 08:50:00 │ LONG         │ 0.45%  │ 54.24%  │ 0.52       │ rsiDivergency5m │
// │ 170 │ ARUSDT       │ 2024 05 02 10:10:00 │ 2024 05 02 14:45:00 │ SHORT        │ -7.05% │ 47.19%  │ 33.12      │ rsiDivergency5m │
// │ 171 │ ARUSDT       │ 2024 05 02 15:05:00 │ 2024 05 02 23:25:00 │ SHORT        │ 4.29%  │ 51.47%  │ 35.75      │ rsiDivergency5m │
// │ 172 │ UNFIUSDT     │ 2024 05 03 03:20:00 │ 2024 05 03 11:40:00 │ LONG         │ 3.90%  │ 55.38%  │ 3.69       │ rsiDivergency5m │
// │ 173 │ PENDLEUSDT   │ 2024 05 03 12:55:00 │ 2024 05 03 21:15:00 │ SHORT        │ 1.29%  │ 56.66%  │ 5.15       │ rsiDivergency5m │
// │ 174 │ AMBUSDT      │ 2024 05 04 00:45:00 │ 2024 05 04 09:05:00 │ SHORT        │ 2.01%  │ 58.67%  │ 0.01       │ rsiDivergency5m │
// │ 175 │ GRTUSDT      │ 2024 05 05 12:00:00 │ 2024 05 05 20:20:00 │ SHORT        │ 0.54%  │ 62.31%  │ 0.30       │ rsiDivergency5m │
// │ 176 │ ENAUSDT      │ 2024 05 06 00:30:00 │ 2024 05 06 08:50:00 │ SHORT        │ 0.62%  │ 7.45%   │ 0.90       │ rsiDivergency5m │
// │ 177 │ NFPUSDT      │ 2024 05 06 01:15:00 │ 2024 05 06 09:35:00 │ SHORT        │ 4.85%  │ 67.16%  │ 0.52       │ rsiDivergency5m │
// │ 178 │ POWRUSDT     │ 2024 05 07 01:20:00 │ 2024 05 07 09:40:00 │ SHORT        │ 4.92%  │ 79.03%  │ 0.36       │ rsiDivergency5m │
// │ 179 │ LEVERUSDT    │ 2024 05 07 10:20:00 │ 2024 05 07 18:40:00 │ LONG         │ 2.05%  │ 81.08%  │ 0.00       │ rsiDivergency5m │
// │ 180 │ PEOPLEUSDT   │ 2024 05 07 20:25:00 │ 2024 05 08 04:45:00 │ LONG         │ -1.17% │ 79.91%  │ 0.02       │ rsiDivergency5m │
// │ 181 │ FRONTUSDT    │ 2024 05 08 07:00:00 │ 2024 05 08 09:35:00 │ SHORT        │ -7.05% │ 72.86%  │ 1.55       │ rsiDivergency5m │
// │ 182 │ API3USDT     │ 2024 05 08 13:25:00 │ 2024 05 08 21:45:00 │ SHORT        │ 2.32%  │ 75.17%  │ 2.62       │ rsiDivergency5m │
// │ 183 │ PEOPLEUSDT   │ 2024 05 08 21:50:00 │ 2024 05 08 22:05:00 │ SHORT        │ -7.05% │ 68.12%  │ 0.03       │ rsiDivergency5m │
// │ 184 │ PEOPLEUSDT   │ 2024 05 08 22:55:00 │ 2024 05 09 02:25:00 │ SHORT        │ 6.95%  │ 75.07%  │ 0.03       │ rsiDivergency5m │
// │ 185 │ PORTALUSDT   │ 2024 05 09 10:40:00 │ 2024 05 09 19:00:00 │ SHORT        │ 3.78%  │ 78.85%  │ 0.85       │ rsiDivergency5m │
// │ 186 │ IMXUSDT      │ 2024 05 09 20:35:00 │ 2024 05 10 04:55:00 │ SHORT        │ -1.36% │ 77.49%  │ 2.23       │ rsiDivergency5m │
// │ 187 │ ARUSDT       │ 2024 05 10 05:25:00 │ 2024 05 10 09:50:00 │ SHORT        │ 6.95%  │ 84.44%  │ 44.72      │ rsiDivergency5m │
// │ 188 │ SSVUSDT      │ 2024 05 10 10:50:00 │ 2024 05 10 12:25:00 │ LONG         │ -7.05% │ 77.39%  │ 39.19      │ rsiDivergency5m │
// │ 189 │ UMAUSDT      │ 2024 05 10 12:35:00 │ 2024 05 10 20:55:00 │ LONG         │ 4.80%  │ 82.19%  │ 3.44       │ rsiDivergency5m │
// │ 190 │ PEOPLEUSDT   │ 2024 05 10 20:55:00 │ 2024 05 11 05:15:00 │ SHORT        │ -1.42% │ 80.76%  │ 0.03       │ rsiDivergency5m │
// │ 191 │ PORTALUSDT   │ 2024 05 12 03:30:00 │ 2024 05 12 11:50:00 │ SHORT        │ 3.73%  │ 84.50%  │ 0.89       │ rsiDivergency5m │
// │ 192 │ PEOPLEUSDT   │ 2024 05 12 23:25:00 │ 2024 05 13 03:20:00 │ LONG         │ 6.95%  │ 90.36%  │ 0.03       │ rsiDivergency5m │
// │ 193 │ BONDUSDT     │ 2024 05 13 03:50:00 │ 2024 05 13 12:10:00 │ SHORT        │ 1.04%  │ 91.39%  │ 2.95       │ rsiDivergency5m │
// │ 194 │ UMAUSDT      │ 2024 05 13 13:25:00 │ 2024 05 13 19:00:00 │ LONG         │ 6.95%  │ 98.34%  │ 3.81       │ rsiDivergency5m │
// │ 195 │ UMAUSDT      │ 2024 05 13 19:15:00 │ 2024 05 14 02:35:00 │ SHORT        │ 6.95%  │ 105.29% │ 4.11       │ rsiDivergency5m │
// │ 196 │ UMAUSDT      │ 2024 05 14 08:55:00 │ 2024 05 14 17:15:00 │ LONG         │ -0.81% │ 104.49% │ 3.70       │ rsiDivergency5m │
// │ 197 │ WLDUSDT      │ 2024 05 14 19:30:00 │ 2024 05 15 03:50:00 │ SHORT        │ 1.44%  │ 105.93% │ 4.87       │ rsiDivergency5m │
// │ 198 │ BOMEUSDT     │ 2024 05 15 02:50:00 │ 2024 05 15 11:10:00 │ SHORT        │ -3.55% │ 36.86%  │ 0.01       │ rsiDivergency5m │
// │ 199 │ BEAMXUSDT    │ 2024 05 15 14:35:00 │ 2024 05 15 22:55:00 │ SHORT        │ -2.59% │ 107.90% │ 0.02       │ rsiDivergency5m │
// │ 200 │ THETAUSDT    │ 2024 05 15 22:25:00 │ 2024 05 16 06:45:00 │ SHORT        │ 0.50%  │ 108.41% │ 2.16       │ rsiDivergency5m │
// │ 201 │ ENAUSDT      │ 2024 05 16 09:25:00 │ 2024 05 16 17:45:00 │ LONG         │ -0.72% │ -22.55% │ 0.67       │ rsiDivergency5m │
// │ 202 │ RIFUSDT      │ 2024 05 16 09:25:00 │ 2024 05 16 17:45:00 │ LONG         │ 0.48%  │ 108.89% │ 0.16       │ rsiDivergency5m │
// │ 203 │ PEOPLEUSDT   │ 2024 05 17 07:15:00 │ 2024 05 17 15:35:00 │ LONG         │ 2.85%  │ 113.66% │ 0.05       │ rsiDivergency5m │
// │ 204 │ CKBUSDT      │ 2024 05 17 17:50:00 │ 2024 05 18 02:10:00 │ SHORT        │ -2.71% │ 110.95% │ 0.02       │ rsiDivergency5m │
// │ 205 │ COTIUSDT     │ 2024 05 18 05:40:00 │ 2024 05 18 14:00:00 │ SHORT        │ 2.59%  │ 113.54% │ 0.14       │ rsiDivergency5m │
// │ 206 │ 1000BONKUSDT │ 2024 05 18 17:05:00 │ 2024 05 19 01:25:00 │ SHORT        │ -3.18% │ 110.36% │ 0.03       │ rsiDivergency5m │
// │ 207 │ ACEUSDT      │ 2024 05 19 11:55:00 │ 2024 05 19 20:15:00 │ LONG         │ -2.83% │ 114.48% │ 4.56       │ rsiDivergency5m │
// │ 208 │ UNFIUSDT     │ 2024 05 19 19:45:00 │ 2024 05 19 23:00:00 │ SHORT        │ 6.95%  │ 121.43% │ 4.57       │ rsiDivergency5m │
// │ 209 │ BONDUSDT     │ 2024 05 20 12:30:00 │ 2024 05 20 20:50:00 │ SHORT        │ -1.97% │ 119.73% │ 3.13       │ rsiDivergency5m │
// │ 210 │ BOMEUSDT     │ 2024 05 20 18:45:00 │ 2024 05 21 03:05:00 │ SHORT        │ 3.09%  │ 61.77%  │ 0.01       │ rsiDivergency5m │
// │ 211 │ ENAUSDT      │ 2024 05 20 19:35:00 │ 2024 05 21 03:55:00 │ SHORT        │ 2.88%  │ 1.99%   │ 0.87       │ rsiDivergency5m │
// │ 212 │ 1000BONKUSDT │ 2024 05 20 22:30:00 │ 2024 05 21 02:10:00 │ SHORT        │ 6.95%  │ 126.68% │ 0.03       │ rsiDivergency5m │
// │ 213 │ PIXELUSDT    │ 2024 05 21 04:25:00 │ 2024 05 21 12:45:00 │ SHORT        │ 2.50%  │ 129.18% │ 0.39       │ rsiDivergency5m │
// │ 214 │ 1000LUNCUSDT │ 2024 05 22 06:55:00 │ 2024 05 22 15:15:00 │ SHORT        │ 5.52%  │ 134.70% │ 0.12       │ rsiDivergency5m │
// │ 215 │ JASMYUSDT    │ 2024 05 22 16:40:00 │ 2024 05 23 01:00:00 │ SHORT        │ 2.16%  │ 136.87% │ 0.02       │ rsiDivergency5m │
// │ 216 │ 1000BONKUSDT │ 2024 05 23 06:55:00 │ 2024 05 23 08:50:00 │ SHORT        │ 6.95%  │ 143.82% │ 0.04       │ rsiDivergency5m │
// │ 217 │ ENJUSDT      │ 2024 05 23 09:10:00 │ 2024 05 23 15:00:00 │ LONG         │ -7.05% │ 136.77% │ 0.34       │ rsiDivergency5m │
// │ 218 │ CHZUSDT      │ 2024 05 23 15:10:00 │ 2024 05 23 23:30:00 │ LONG         │ 5.54%  │ 142.31% │ 0.11       │ rsiDivergency5m │
// │ 219 │ DEFIUSDT     │ 2024 05 23 23:40:00 │ 2024 05 24 08:00:00 │ SHORT        │ 0.59%  │ 142.90% │ 1019.60    │ rsiDivergency5m │
// │ 220 │ LDOUSDT      │ 2024 05 24 09:55:00 │ 2024 05 24 11:35:00 │ SHORT        │ 6.95%  │ 149.85% │ 2.48       │ rsiDivergency5m │
// │ 221 │ MYROUSDT     │ 2024 05 24 13:20:00 │ 2024 05 24 16:10:00 │ SHORT        │ 6.95%  │ 117.31% │ 0.23       │ rsiDivergency5m │
// │ 222 │ PENDLEUSDT   │ 2024 05 24 18:40:00 │ 2024 05 24 23:00:00 │ SHORT        │ -7.05% │ 142.80% │ 6.73       │ rsiDivergency5m │
// │ 223 │ LDOUSDT      │ 2024 05 24 23:10:00 │ 2024 05 25 07:30:00 │ SHORT        │ 2.99%  │ 145.79% │ 2.57       │ rsiDivergency5m │
// │ 224 │ MYROUSDT     │ 2024 05 25 06:35:00 │ 2024 05 25 14:55:00 │ SHORT        │ 0.27%  │ 121.69% │ 0.26       │ rsiDivergency5m │
// │ 225 │ LDOUSDT      │ 2024 05 25 08:25:00 │ 2024 05 25 16:45:00 │ LONG         │ -1.76% │ 144.03% │ 2.48       │ rsiDivergency5m │
// │ 226 │ ONDOUSDT     │ 2024 05 25 21:05:00 │ 2024 05 26 05:25:00 │ SHORT        │ 2.48%  │ 146.51% │ 1.32       │ rsiDivergency5m │
// │ 227 │ LDOUSDT      │ 2024 05 26 06:15:00 │ 2024 05 26 14:35:00 │ SHORT        │ 1.74%  │ 148.24% │ 2.69       │ rsiDivergency5m │
// │ 228 │ AGLDUSDT     │ 2024 05 26 20:50:00 │ 2024 05 26 22:35:00 │ SHORT        │ -7.05% │ 141.19% │ 1.34       │ rsiDivergency5m │
// │ 229 │ SNXUSDT      │ 2024 05 26 22:15:00 │ 2024 05 27 06:35:00 │ SHORT        │ 4.09%  │ 145.28% │ 3.22       │ rsiDivergency5m │
// │ 230 │ API3USDT     │ 2024 05 27 10:00:00 │ 2024 05 27 18:20:00 │ SHORT        │ -0.30% │ 144.98% │ 3.09       │ rsiDivergency5m │
// │ 231 │ XAIUSDT      │ 2024 05 27 21:10:00 │ 2024 05 28 05:30:00 │ LONG         │ 4.30%  │ 149.28% │ 0.76       │ rsiDivergency5m │
// │ 232 │ 1000BONKUSDT │ 2024 05 28 05:50:00 │ 2024 05 28 14:10:00 │ SHORT        │ 0.82%  │ 150.11% │ 0.04       │ rsiDivergency5m │
// │ 233 │ BOMEUSDT     │ 2024 05 28 05:55:00 │ 2024 05 28 14:15:00 │ SHORT        │ -1.09% │ 83.41%  │ 0.01       │ rsiDivergency5m │
// │ 234 │ JTOUSDT      │ 2024 05 28 19:30:00 │ 2024 05 29 01:30:00 │ LONG         │ 6.95%  │ 157.06% │ 3.66       │ rsiDivergency5m │
// │ 235 │ DUSKUSDT     │ 2024 05 29 04:15:00 │ 2024 05 29 12:35:00 │ SHORT        │ 4.07%  │ 161.13% │ 0.43       │ rsiDivergency5m │
// │ 236 │ JASMYUSDT    │ 2024 05 29 17:25:00 │ 2024 05 30 01:45:00 │ SHORT        │ 0.65%  │ 161.78% │ 0.03       │ rsiDivergency5m │
// │ 237 │ CHZUSDT      │ 2024 05 30 01:35:00 │ 2024 05 30 09:55:00 │ LONG         │ -4.26% │ 157.52% │ 0.15       │ rsiDivergency5m │
// │ 238 │ WLDUSDT      │ 2024 05 30 16:20:00 │ 2024 05 31 00:40:00 │ LONG         │ -1.47% │ 156.05% │ 4.91       │ rsiDivergency5m │
// │ 239 │ BEAMXUSDT    │ 2024 05 31 20:45:00 │ 2024 06 01 05:05:00 │ SHORT        │ -0.75% │ 155.30% │ 0.03       │ rsiDivergency5m │
// │ 240 │ PIXELUSDT    │ 2024 06 01 08:05:00 │ 2024 06 01 16:25:00 │ SHORT        │ -2.15% │ 153.15% │ 0.46       │ rsiDivergency5m │
// │ 241 │ ENSUSDT      │ 2024 06 01 17:50:00 │ 2024 06 02 02:10:00 │ SHORT        │ 4.52%  │ 157.67% │ 29.34      │ rsiDivergency5m │
// │ 242 │ PORTALUSDT   │ 2024 06 02 04:10:00 │ 2024 06 02 05:10:00 │ SHORT        │ 6.95%  │ 164.62% │ 1.00       │ rsiDivergency5m │
// │ 243 │ LPTUSDT      │ 2024 06 02 12:40:00 │ 2024 06 02 21:00:00 │ LONG         │ -0.27% │ 157.30% │ 21.66      │ rsiDivergency5m │
// │ 244 │ API3USDT     │ 2024 06 02 21:40:00 │ 2024 06 03 06:00:00 │ SHORT        │ 3.64%  │ 160.94% │ 3.42       │ rsiDivergency5m │
// │ 245 │ AGLDUSDT     │ 2024 06 03 07:45:00 │ 2024 06 03 08:00:00 │ SHORT        │ 6.95%  │ 167.89% │ 1.67       │ rsiDivergency5m │
// │ 246 │ HIGHUSDT     │ 2024 06 03 09:20:00 │ 2024 06 03 17:00:00 │ LONG         │ -7.05% │ 160.84% │ 7.24       │ rsiDivergency5m │
// │ 247 │ PORTALUSDT   │ 2024 06 03 18:45:00 │ 2024 06 04 01:30:00 │ LONG         │ 6.95%  │ 167.79% │ 1.04       │ rsiDivergency5m │
// │ 248 │ DUSKUSDT     │ 2024 06 04 09:05:00 │ 2024 06 04 17:25:00 │ SHORT        │ 1.37%  │ 169.16% │ 0.47       │ rsiDivergency5m │
// │ 249 │ RIFUSDT      │ 2024 06 04 18:30:00 │ 2024 06 05 02:50:00 │ SHORT        │ -0.91% │ 168.26% │ 0.18       │ rsiDivergency5m │
// │ 250 │ STXUSDT      │ 2024 06 05 12:05:00 │ 2024 06 05 20:25:00 │ SHORT        │ -1.59% │ 166.67% │ 2.39       │ rsiDivergency5m │
// │ 251 │ DENTUSDT     │ 2024 06 05 23:40:00 │ 2024 06 06 08:00:00 │ LONG         │ -0.52% │ 166.15% │ 0.00       │ rsiDivergency5m │
// │ 252 │ HIGHUSDT     │ 2024 06 07 08:45:00 │ 2024 06 07 13:30:00 │ SHORT        │ -7.05% │ 152.05% │ 8.30       │ rsiDivergency5m │
// │ 253 │ LEVERUSDT    │ 2024 06 07 20:40:00 │ 2024 06 08 05:00:00 │ SHORT        │ 1.09%  │ 153.14% │ 0.00       │ rsiDivergency5m │
// │ 254 │ CKBUSDT      │ 2024 06 08 07:30:00 │ 2024 06 08 15:50:00 │ LONG         │ -1.53% │ 151.61% │ 0.02       │ rsiDivergency5m │
// │ 255 │ BICOUSDT     │ 2024 06 08 19:45:00 │ 2024 06 09 01:25:00 │ SHORT        │ -7.05% │ 144.56% │ 0.60       │ rsiDivergency5m │
// │ 256 │ HIFIUSDT     │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 4.97%  │ 150.87% │ 0.75       │ rsiDivergency5m │
// │ 257 │ OMNIUSDT     │ 2024 06 10 02:40:00 │ 2024 06 10 11:00:00 │ LONG         │ 1.75%  │ 30.97%  │ 15.39      │ rsiDivergency5m │
// │ 258 │ LEVERUSDT    │ 2024 06 10 11:50:00 │ 2024 06 10 13:05:00 │ SHORT        │ -7.05% │ 143.82% │ 0.00       │ rsiDivergency5m │
// │ 259 │ LEVERUSDT    │ 2024 06 10 13:10:00 │ 2024 06 10 20:50:00 │ SHORT        │ 6.95%  │ 150.77% │ 0.00       │ rsiDivergency5m │
// │ 260 │ OMNIUSDT     │ 2024 06 10 21:25:00 │ 2024 06 11 05:45:00 │ LONG         │ 1.94%  │ 32.81%  │ 14.32      │ rsiDivergency5m │
// │ 261 │ XAIUSDT      │ 2024 06 10 21:25:00 │ 2024 06 11 05:45:00 │ LONG         │ 1.39%  │ 152.16% │ 0.67       │ rsiDivergency5m │
// │ 262 │ CKBUSDT      │ 2024 06 11 08:50:00 │ 2024 06 11 17:10:00 │ LONG         │ -0.52% │ 151.64% │ 0.01       │ rsiDivergency5m │
// │ 263 │ FETUSDT      │ 2024 06 11 19:35:00 │ 2024 06 12 03:55:00 │ LONG         │ 2.54%  │ 154.17% │ 1.52       │ rsiDivergency5m │
// │ 264 │ MYROUSDT     │ 2024 06 12 03:00:00 │ 2024 06 12 08:00:00 │ SHORT        │ -7.05% │ 159.10% │ 0.21       │ rsiDivergency5m │
// │ 265 │ ONGUSDT      │ 2024 06 12 05:05:00 │ 2024 06 12 13:25:00 │ SHORT        │ 2.02%  │ 156.20% │ 0.41       │ rsiDivergency5m │
// │ 266 │ AGLDUSDT     │ 2024 06 12 13:55:00 │ 2024 06 12 22:15:00 │ LONG         │ -5.72% │ 150.48% │ 1.55       │ rsiDivergency5m │
// │ 267 │ DUSKUSDT     │ 2024 06 12 22:10:00 │ 2024 06 13 06:30:00 │ LONG         │ 1.19%  │ 151.67% │ 0.40       │ rsiDivergency5m │
// │ 268 │ POLYXUSDT    │ 2024 06 13 10:45:00 │ 2024 06 13 19:05:00 │ LONG         │ -2.38% │ 149.29% │ 0.46       │ rsiDivergency5m │
// │ 269 │ ARUSDT       │ 2024 06 13 21:40:00 │ 2024 06 14 06:00:00 │ SHORT        │ 0.58%  │ 149.87% │ 30.52      │ rsiDivergency5m │
// │ 270 │ ARUSDT       │ 2024 06 14 08:05:00 │ 2024 06 14 11:05:00 │ LONG         │ -7.05% │ 142.82% │ 30.01      │ rsiDivergency5m │
// │ 271 │ MYROUSDT     │ 2024 06 14 11:10:00 │ 2024 06 14 19:30:00 │ LONG         │ 1.34%  │ 145.90% │ 0.18       │ rsiDivergency5m │
// │ 272 │ WLDUSDT      │ 2024 06 14 11:30:00 │ 2024 06 14 19:50:00 │ LONG         │ 2.24%  │ 145.06% │ 3.37       │ rsiDivergency5m │
// │ 273 │ OMNIUSDT     │ 2024 06 14 19:25:00 │ 2024 06 14 23:40:00 │ SHORT        │ -7.05% │ 39.17%  │ 16.89      │ rsiDivergency5m │
// │ 274 │ 1000SHIBUSDT │ 2024 06 14 23:55:00 │ 2024 06 15 08:15:00 │ SHORT        │ -0.24% │ 144.82% │ 0.02       │ rsiDivergency5m │
// │ 275 │ LDOUSDT      │ 2024 06 16 10:10:00 │ 2024 06 16 18:30:00 │ SHORT        │ 1.02%  │ 146.19% │ 2.17       │ rsiDivergency5m │
// │ 276 │ POLYXUSDT    │ 2024 06 16 21:05:00 │ 2024 06 17 05:25:00 │ LONG         │ -5.26% │ 140.93% │ 0.38       │ rsiDivergency5m │
// │ 277 │ ENAUSDT      │ 2024 06 17 05:05:00 │ 2024 06 17 13:25:00 │ LONG         │ 4.57%  │ 110.50% │ 0.69       │ rsiDivergency5m │
// │ 278 │ TAOUSDT      │ 2024 06 17 05:10:00 │ 2024 06 17 13:30:00 │ LONG         │ 6.95%  │ 74.11%  │ 283.79     │ rsiDivergency5m │
// │ 279 │ SUIUSDT      │ 2024 06 17 05:25:00 │ 2024 06 17 13:45:00 │ LONG         │ 4.11%  │ 145.04% │ 0.89       │ rsiDivergency5m │
// │ 280 │ LDOUSDT      │ 2024 06 17 19:50:00 │ 2024 06 17 20:40:00 │ LONG         │ -7.05% │ 137.99% │ 1.94       │ rsiDivergency5m │
// │ 281 │ BOMEUSDT     │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -7.05% │ 157.57% │ 0.01       │ rsiDivergency5m │
// │ 282 │ ASTRUSDT     │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 2.49%  │ 140.48% │ 0.07       │ rsiDivergency5m │
// │ 283 │ FETUSDT      │ 2024 06 18 05:20:00 │ 2024 06 18 13:40:00 │ LONG         │ 2.35%  │ 142.83% │ 1.16       │ rsiDivergency5m │
// │ 284 │ PENDLEUSDT   │ 2024 06 18 17:45:00 │ 2024 06 18 23:00:00 │ SHORT        │ -7.05% │ 135.78% │ 5.31       │ rsiDivergency5m │
// │ 285 │ ENAUSDT      │ 2024 06 18 21:30:00 │ 2024 06 19 05:50:00 │ SHORT        │ 1.92%  │ 110.80% │ 0.66       │ rsiDivergency5m │
// │ 286 │ FETUSDT      │ 2024 06 18 23:10:00 │ 2024 06 19 07:30:00 │ SHORT        │ -6.32% │ 129.46% │ 1.27       │ rsiDivergency5m │
// │ 287 │ UNFIUSDT     │ 2024 06 19 08:50:00 │ 2024 06 19 17:10:00 │ SHORT        │ -1.93% │ 127.53% │ 4.42       │ rsiDivergency5m │
// │ 288 │ BONDUSDT     │ 2024 06 19 22:35:00 │ 2024 06 20 00:15:00 │ SHORT        │ -7.05% │ 120.48% │ 2.11       │ rsiDivergency5m │
// │ 289 │ BONDUSDT     │ 2024 06 20 00:40:00 │ 2024 06 20 07:30:00 │ SHORT        │ 6.95%  │ 127.43% │ 2.25       │ rsiDivergency5m │
// │ 290 │ BONDUSDT     │ 2024 06 20 08:30:00 │ 2024 06 20 16:50:00 │ LONG         │ 2.59%  │ 130.02% │ 2.08       │ rsiDivergency5m │
// │ 291 │ MYROUSDT     │ 2024 06 20 18:30:00 │ 2024 06 21 02:50:00 │ LONG         │ -1.50% │ 143.32% │ 0.14       │ rsiDivergency5m │
// │ 292 │ JASMYUSDT    │ 2024 06 20 19:55:00 │ 2024 06 21 04:15:00 │ LONG         │ -3.28% │ 126.74% │ 0.03       │ rsiDivergency5m │
// │ 293 │ MYROUSDT     │ 2024 06 21 04:00:00 │ 2024 06 21 12:20:00 │ LONG         │ 1.85%  │ 145.17% │ 0.14       │ rsiDivergency5m │
// │ 294 │ UNFIUSDT     │ 2024 06 21 08:50:00 │ 2024 06 21 15:20:00 │ LONG         │ 6.95%  │ 133.69% │ 4.10       │ rsiDivergency5m │
// │ 295 │ UNFIUSDT     │ 2024 06 21 15:25:00 │ 2024 06 21 23:45:00 │ SHORT        │ -4.51% │ 129.18% │ 4.37       │ rsiDivergency5m │
// │ 296 │ 1000LUNCUSDT │ 2024 06 22 01:05:00 │ 2024 06 22 03:20:00 │ LONG         │ -7.05% │ 122.13% │ 0.08       │ rsiDivergency5m │
// │ 297 │ UNFIUSDT     │ 2024 06 22 03:10:00 │ 2024 06 22 11:30:00 │ LONG         │ -2.88% │ 119.25% │ 4.24       │ rsiDivergency5m │
// │ 298 │ JASMYUSDT    │ 2024 06 22 17:30:00 │ 2024 06 23 01:50:00 │ SHORT        │ -2.77% │ 116.48% │ 0.03       │ rsiDivergency5m │
// │ 299 │ MTLUSDT      │ 2024 06 23 09:50:00 │ 2024 06 23 18:10:00 │ LONG         │ -4.34% │ 112.14% │ 1.22       │ rsiDivergency5m │
// │ 300 │ BANDUSDT     │ 2024 06 23 18:20:00 │ 2024 06 24 02:40:00 │ LONG         │ 0.14%  │ 112.28% │ 1.05       │ rsiDivergency5m │
// │ 301 │ MTLUSDT      │ 2024 06 24 03:40:00 │ 2024 06 24 06:20:00 │ SHORT        │ 6.95%  │ 119.23% │ 1.50       │ rsiDivergency5m │
// │ 302 │ ALTUSDT      │ 2024 06 24 09:35:00 │ 2024 06 24 17:55:00 │ SHORT        │ -4.66% │ 114.57% │ 0.19       │ rsiDivergency5m │
// │ 303 │ UNFIUSDT     │ 2024 06 24 17:50:00 │ 2024 06 25 02:10:00 │ SHORT        │ -4.11% │ 110.46% │ 4.93       │ rsiDivergency5m │
// │ 304 │ LISTAUSDT    │ 2024 06 24 20:15:00 │ 2024 06 25 04:35:00 │ SHORT        │ -0.92% │ 11.29%  │ 0.71       │ rsiDivergency5m │
// │ 305 │ STXUSDT      │ 2024 06 25 07:00:00 │ 2024 06 25 15:20:00 │ SHORT        │ -3.40% │ 107.07% │ 1.71       │ rsiDivergency5m │
// │ 306 │ STXUSDT      │ 2024 06 25 17:05:00 │ 2024 06 26 01:25:00 │ SHORT        │ 3.30%  │ 110.36% │ 1.79       │ rsiDivergency5m │
// │ 307 │ ONGUSDT      │ 2024 06 26 11:55:00 │ 2024 06 26 20:15:00 │ LONG         │ 0.44%  │ 110.81% │ 0.34       │ rsiDivergency5m │
// │ 308 │ FETUSDT      │ 2024 06 26 21:10:00 │ 2024 06 27 05:30:00 │ LONG         │ -2.43% │ 108.38% │ 1.67       │ rsiDivergency5m │
// │ 309 │ LEVERUSDT    │ 2024 06 27 06:25:00 │ 2024 06 27 07:25:00 │ SHORT        │ -7.05% │ 101.33% │ 0.00       │ rsiDivergency5m │
// │ 310 │ LEVERUSDT    │ 2024 06 27 07:50:00 │ 2024 06 27 16:10:00 │ SHORT        │ -1.33% │ 100.00% │ 0.00       │ rsiDivergency5m │
// │ 311 │ 1000BONKUSDT │ 2024 06 27 17:25:00 │ 2024 06 28 01:45:00 │ SHORT        │ 4.79%  │ 104.79% │ 0.02       │ rsiDivergency5m │
// │ 312 │ NTRNUSDT     │ 2024 06 28 21:50:00 │ 2024 06 29 00:00:00 │ SHORT        │ -7.05% │ 97.74%  │ 0.43       │ rsiDivergency5m │
// └─────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴─────────┴────────────┴─────────────────┘
