import { rsi } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";

const STG_NAME = "rsiDivergency5m";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"EOSUSDT",
	"ADAUSDT",
	"XMRUSDT",
	"XTZUSDT",
	"ONTUSDT",
	"IOTAUSDT",
	"VETUSDT",
	"NEOUSDT",
	"IOSTUSDT",
	"ALGOUSDT",
	"ZILUSDT",
	"KNCUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"SXPUSDT",
	"KAVAUSDT",
	"MKRUSDT",
	"SNXUSDT",
	"DOTUSDT",
	"DEFIUSDT",
	"YFIUSDT",
	"CRVUSDT",
	"EGLDUSDT",
	"ICXUSDT",
	"FTMUSDT",
	"ENJUSDT",
	"FLMUSDT",
	"RENUSDT",
	"FILUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"MATICUSDT",
	"AXSUSDT",
	"ALPHAUSDT",
	"SKLUSDT",
	"1INCHUSDT",
	"SANDUSDT",
	"ANKRUSDT",
	"REEFUSDT",
	"SFPUSDT",
	"COTIUSDT",
	"MANAUSDT",
	"ALICEUSDT",
	"ONEUSDT",
	"LINAUSDT",
	"DENTUSDT",
	"CELRUSDT",
	"HOTUSDT",
	"MTLUSDT",
	"OGNUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"C98USDT",
	"MASKUSDT",
	"DYDXUSDT",
	"GALAUSDT",
	"ARUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"LPTUSDT",
	"ENSUSDT",
	"ROSEUSDT",
	"FLOWUSDT",
	"IMXUSDT",
	"GMTUSDT",
	"APEUSDT",
	"DARUSDT",
	"INJUSDT",
	"STGUSDT",
	"SPELLUSDT",
	"1000LUNCUSDT",
	"LDOUSDT",
	"APTUSDT",
	"FETUSDT",
	"FXSUSDT",
	"HOOKUSDT",
	"TUSDT",
	"RNDRUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"GMXUSDT",
	"CFXUSDT",
	"STXUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"TRUUSDT",
	"LQTYUSDT",
	"IDUSDT",
	"ARBUSDT",
	"TLMUSDT",
	"AMBUSDT",
	"LEVERUSDT",
	"RDNTUSDT",
	"HFTUSDT",
	"XVSUSDT",
	"SUIUSDT",
	"UMAUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"XVGUSDT",
	"WLDUSDT",
	"PENDLEUSDT",
	"YGGUSDT",
	"DODOXUSDT",
	"OXTUSDT",
	"HIFIUSDT",
	"FRONTUSDT",
	"LOOMUSDT",
	"BIGTIMEUSDT",
	"BONDUSDT",
	"WAXPUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"GASUSDT",
	"POWRUSDT",
	"CAKEUSDT",
	"TOKENUSDT",
	"ORDIUSDT",
	"NTRNUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"SUPERUSDT",
	"USTCUSDT",
	"ONGUSDT",
	"1000SATSUSDT",
	"ACEUSDT",
	"NFPUSDT",
	"AIUSDT",
	"MANTAUSDT",
	"ONDOUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"ZETAUSDT",
	"PIXELUSDT",
	"STRKUSDT",
	"PORTALUSDT",
	"MYROUSDT",
	"VANRYUSDT",
	"ETHFIUSDT",
	"ENAUSDT",
	"WUSDT",
	"TNSRUSDT",
	"SAGAUSDT",
	"TAOUSDT",
	"OMNIUSDT",
	"REZUSDT",
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
// Backtest data available for XRPUSDT, EOSUSDT, TRXUSDT and 245 other pairs.
// Data for 270.8 days from 2023 10 16 16:15:00 to 2024 07 13 11:40:00
// ┌─────────────────┬────────┐
// │                 │ Values │
// ├─────────────────┼────────┤
// │              tp │ 10.00% │
// │              sl │ 2.00%  │
// │  maxTradeLength │ 100    │
// │ amountToTradePt │ 25.00% │
// └─────────────────┴────────┘
// Snapshot data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼────────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 8076      │ 0.12% │ 39.45%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬──────────┬────────────────────┬──────────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ drawdown │ drawdownMonteCarlo │ badRunMonteCarlo │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼──────────┼────────────────────┼──────────────────┼─────────┼───────────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 1109      │ 58.85%    │ -3.44%    │ 55.15% │ 24.33%   │ 27.16%             │ 15               │ 35.80%  │ 50.20         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴──────────┴────────────────────┴──────────────────┴─────────┴───────────────┘
// ┌──────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬────────┬────────────┬─────────────────┐
// │      │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl │ entryPrice │ stgName         │
// ├──────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼────────┼────────────┼─────────────────┤
// │    0 │ HFTUSDT      │ 2023 10 17 12:40:00 │ 2023 10 17 19:25:00 │ LONG         │ -0.51% │ -0.51% │ 0.25       │ rsiDivergency5m │
// │    1 │ AMBUSDT      │ 2023 10 18 08:30:00 │ 2023 10 18 16:50:00 │ LONG         │ -0.11% │ -1.26% │ 0.01       │ rsiDivergency5m │
// │    2 │ ICXUSDT      │ 2023 10 21 03:35:00 │ 2023 10 21 07:55:00 │ SHORT        │ -0.51% │ -0.09% │ 0.21       │ rsiDivergency5m │
// │    3 │ LQTYUSDT     │ 2023 10 22 05:30:00 │ 2023 10 22 13:50:00 │ LONG         │ 0.50%  │ 0.56%  │ 1.33       │ rsiDivergency5m │
// │    4 │ FTMUSDT      │ 2023 10 22 22:50:00 │ 2023 10 22 23:15:00 │ SHORT        │ -0.51% │ 0.06%  │ 0.22       │ rsiDivergency5m │
// │    5 │ FTMUSDT      │ 2023 10 22 23:20:00 │ 2023 10 23 07:40:00 │ SHORT        │ 0.35%  │ 0.41%  │ 0.23       │ rsiDivergency5m │
// │    6 │ WLDUSDT      │ 2023 10 23 18:30:00 │ 2023 10 23 18:55:00 │ SHORT        │ -0.51% │ 0.00%  │ 1.63       │ rsiDivergency5m │
// │    7 │ MAVUSDT      │ 2023 10 23 19:35:00 │ 2023 10 23 21:25:00 │ SHORT        │ -0.51% │ -0.51% │ 0.24       │ rsiDivergency5m │
// │    8 │ COTIUSDT     │ 2023 10 24 07:45:00 │ 2023 10 24 16:05:00 │ SHORT        │ 1.08%  │ 1.05%  │ 0.04       │ rsiDivergency5m │
// │    9 │ DYDXUSDT     │ 2023 10 25 02:50:00 │ 2023 10 25 11:10:00 │ LONG         │ 1.25%  │ 5.23%  │ 2.26       │ rsiDivergency5m │
// │   10 │ GMXUSDT      │ 2023 10 25 23:00:00 │ 2023 10 26 07:20:00 │ SHORT        │ 0.84%  │ 6.77%  │ 45.76      │ rsiDivergency5m │
// │   11 │ HIGHUSDT     │ 2023 10 26 09:40:00 │ 2023 10 26 18:00:00 │ LONG         │ 0.67%  │ 6.93%  │ 1.21       │ rsiDivergency5m │
// │   12 │ WAXPUSDT     │ 2023 10 26 14:40:00 │ 2023 10 26 14:50:00 │ SHORT        │ -0.51% │ 2.51%  │ 0.06       │ rsiDivergency5m │
// │   13 │ RIFUSDT      │ 2023 10 26 14:50:00 │ 2023 10 26 23:10:00 │ SHORT        │ -0.11% │ -0.20% │ 0.12       │ rsiDivergency5m │
// │   14 │ WAXPUSDT     │ 2023 10 26 14:55:00 │ 2023 10 26 16:05:00 │ SHORT        │ -0.51% │ 2.00%  │ 0.06       │ rsiDivergency5m │
// │   15 │ NEOUSDT      │ 2023 10 26 16:50:00 │ 2023 10 26 17:55:00 │ SHORT        │ -0.51% │ 6.41%  │ 8.21       │ rsiDivergency5m │
// │   16 │ 1000LUNCUSDT │ 2023 10 26 20:55:00 │ 2023 10 27 05:15:00 │ LONG         │ 0.62%  │ 7.04%  │ 0.06       │ rsiDivergency5m │
// │   17 │ INJUSDT      │ 2023 10 27 08:30:00 │ 2023 10 27 12:15:00 │ SHORT        │ -0.51% │ 6.52%  │ 13.31      │ rsiDivergency5m │
// │   18 │ ONTUSDT      │ 2023 10 28 03:25:00 │ 2023 10 28 06:50:00 │ SHORT        │ -0.51% │ 6.05%  │ 0.21       │ rsiDivergency5m │
// │   19 │ HIFIUSDT     │ 2023 10 28 20:15:00 │ 2023 10 29 04:35:00 │ SHORT        │ 0.47%  │ 4.47%  │ 0.69       │ rsiDivergency5m │
// │   20 │ GALAUSDT     │ 2023 10 29 12:40:00 │ 2023 10 29 13:10:00 │ SHORT        │ -0.51% │ 8.93%  │ 0.02       │ rsiDivergency5m │
// │   21 │ HIFIUSDT     │ 2023 10 31 08:55:00 │ 2023 10 31 10:10:00 │ LONG         │ -0.51% │ 11.49% │ 0.62       │ rsiDivergency5m │
// │   22 │ WAXPUSDT     │ 2023 10 31 10:20:00 │ 2023 10 31 18:40:00 │ LONG         │ 2.21%  │ 10.12% │ 0.06       │ rsiDivergency5m │
// │   23 │ BIGTIMEUSDT  │ 2023 10 31 10:25:00 │ 2023 10 31 10:40:00 │ LONG         │ -0.51% │ 10.98% │ 0.17       │ rsiDivergency5m │
// │   24 │ LEVERUSDT    │ 2023 10 31 10:25:00 │ 2023 10 31 18:45:00 │ LONG         │ 0.35%  │ 11.33% │ 0.00       │ rsiDivergency5m │
// │   25 │ ICXUSDT      │ 2023 10 31 18:50:00 │ 2023 11 01 03:10:00 │ SHORT        │ 0.68%  │ 12.01% │ 0.22       │ rsiDivergency5m │
// │   26 │ HFTUSDT      │ 2023 11 01 13:55:00 │ 2023 11 01 14:20:00 │ SHORT        │ -0.51% │ 10.47% │ 0.28       │ rsiDivergency5m │
// │   27 │ HFTUSDT      │ 2023 11 01 14:30:00 │ 2023 11 01 15:15:00 │ SHORT        │ -0.51% │ 9.96%  │ 0.28       │ rsiDivergency5m │
// │   28 │ BONDUSDT     │ 2023 11 02 01:25:00 │ 2023 11 02 09:45:00 │ SHORT        │ 1.41%  │ 12.06% │ 4.56       │ rsiDivergency5m │
// │   29 │ FETUSDT      │ 2023 11 02 10:30:00 │ 2023 11 02 18:50:00 │ LONG         │ 0.40%  │ 12.46% │ 0.34       │ rsiDivergency5m │
// │   30 │ POWRUSDT     │ 2023 11 02 20:20:00 │ 2023 11 03 04:40:00 │ LONG         │ 0.11%  │ 0.52%  │ 0.21       │ rsiDivergency5m │
// │   31 │ NEOUSDT      │ 2023 11 02 20:40:00 │ 2023 11 03 05:00:00 │ LONG         │ 0.88%  │ 12.82% │ 9.10       │ rsiDivergency5m │
// │   32 │ GMTUSDT      │ 2023 11 04 02:45:00 │ 2023 11 04 11:05:00 │ SHORT        │ 0.87%  │ 12.44% │ 0.20       │ rsiDivergency5m │
// │   33 │ CAKEUSDT     │ 2023 11 04 05:15:00 │ 2023 11 04 13:35:00 │ SHORT        │ 0.39%  │ -0.13% │ 1.93       │ rsiDivergency5m │
// │   34 │ IMXUSDT      │ 2023 11 04 11:35:00 │ 2023 11 04 19:00:00 │ SHORT        │ -0.51% │ 11.92% │ 0.83       │ rsiDivergency5m │
// │   35 │ IMXUSDT      │ 2023 11 04 21:35:00 │ 2023 11 04 21:55:00 │ SHORT        │ -0.51% │ 10.90% │ 0.90       │ rsiDivergency5m │
// │   36 │ DODOXUSDT    │ 2023 11 04 23:40:00 │ 2023 11 05 01:00:00 │ SHORT        │ -0.51% │ 10.39% │ 0.13       │ rsiDivergency5m │
// │   37 │ DODOXUSDT    │ 2023 11 05 01:10:00 │ 2023 11 05 02:30:00 │ SHORT        │ -0.51% │ 9.87%  │ 0.13       │ rsiDivergency5m │
// │   38 │ LQTYUSDT     │ 2023 11 06 02:30:00 │ 2023 11 06 02:45:00 │ LONG         │ -0.51% │ 10.44% │ 1.67       │ rsiDivergency5m │
// │   39 │ LQTYUSDT     │ 2023 11 06 02:55:00 │ 2023 11 06 05:05:00 │ LONG         │ -0.51% │ 9.93%  │ 1.63       │ rsiDivergency5m │
// │   40 │ STGUSDT      │ 2023 11 06 22:25:00 │ 2023 11 06 23:45:00 │ SHORT        │ -0.51% │ 9.16%  │ 0.61       │ rsiDivergency5m │
// │   41 │ BIGTIMEUSDT  │ 2023 11 08 15:25:00 │ 2023 11 08 16:10:00 │ SHORT        │ -0.51% │ 9.43%  │ 0.17       │ rsiDivergency5m │
// │   42 │ RSRUSDT      │ 2023 11 08 16:55:00 │ 2023 11 09 01:15:00 │ SHORT        │ 0.62%  │ 10.05% │ 0.00       │ rsiDivergency5m │
// │   43 │ FETUSDT      │ 2023 11 09 09:35:00 │ 2023 11 09 11:10:00 │ SHORT        │ 2.49%  │ 11.51% │ 0.41       │ rsiDivergency5m │
// │   44 │ COMPUSDT     │ 2023 11 09 10:45:00 │ 2023 11 09 11:10:00 │ SHORT        │ 2.49%  │ 14.00% │ 57.62      │ rsiDivergency5m │
// │   45 │ SANDUSDT     │ 2023 11 09 20:55:00 │ 2023 11 10 05:15:00 │ SHORT        │ 0.24%  │ 14.11% │ 0.42       │ rsiDivergency5m │
// │   46 │ YFIUSDT      │ 2023 11 11 01:25:00 │ 2023 11 11 08:40:00 │ SHORT        │ -0.51% │ 13.52% │ 8756.00    │ rsiDivergency5m │
// │   47 │ WLDUSDT      │ 2023 11 11 11:05:00 │ 2023 11 11 19:15:00 │ LONG         │ -0.51% │ 13.01% │ 1.94       │ rsiDivergency5m │
// │   48 │ MAVUSDT      │ 2023 11 11 19:40:00 │ 2023 11 12 04:00:00 │ LONG         │ 1.59%  │ 14.60% │ 0.26       │ rsiDivergency5m │
// │   49 │ HOOKUSDT     │ 2023 11 12 03:40:00 │ 2023 11 12 05:40:00 │ SHORT        │ -0.51% │ 14.09% │ 0.99       │ rsiDivergency5m │
// │   50 │ ALICEUSDT    │ 2023 11 12 05:15:00 │ 2023 11 12 13:35:00 │ SHORT        │ -0.04% │ 14.05% │ 1.00       │ rsiDivergency5m │
// │   51 │ MATICUSDT    │ 2023 11 12 23:15:00 │ 2023 11 13 07:20:00 │ LONG         │ -0.51% │ 12.52% │ 0.88       │ rsiDivergency5m │
// │   52 │ TOKENUSDT    │ 2023 11 13 01:10:00 │ 2023 11 13 01:15:00 │ LONG         │ -0.51% │ 1.49%  │ 0.03       │ rsiDivergency5m │
// │   53 │ TOKENUSDT    │ 2023 11 13 01:20:00 │ 2023 11 13 06:00:00 │ LONG         │ 2.49%  │ 3.98%  │ 0.03       │ rsiDivergency5m │
// │   54 │ GALAUSDT     │ 2023 11 13 09:45:00 │ 2023 11 13 16:10:00 │ LONG         │ -0.51% │ 11.49% │ 0.02       │ rsiDivergency5m │
// │   55 │ BONDUSDT     │ 2023 11 13 10:15:00 │ 2023 11 13 10:40:00 │ SHORT        │ -0.51% │ 12.00% │ 4.60       │ rsiDivergency5m │
// │   56 │ ONEUSDT      │ 2023 11 13 16:35:00 │ 2023 11 13 17:55:00 │ LONG         │ -0.51% │ 10.98% │ 0.01       │ rsiDivergency5m │
// │   57 │ HFTUSDT      │ 2023 11 13 19:15:00 │ 2023 11 14 03:35:00 │ LONG         │ 0.56%  │ 11.54% │ 0.29       │ rsiDivergency5m │
// │   58 │ MATICUSDT    │ 2023 11 14 03:55:00 │ 2023 11 14 04:05:00 │ SHORT        │ -0.51% │ 11.03% │ 0.96       │ rsiDivergency5m │
// │   59 │ MATICUSDT    │ 2023 11 14 04:10:00 │ 2023 11 14 12:30:00 │ SHORT        │ 1.94%  │ 12.97% │ 0.98       │ rsiDivergency5m │
// │   60 │ STGUSDT      │ 2023 11 15 01:25:00 │ 2023 11 15 09:45:00 │ SHORT        │ 1.03%  │ 14.28% │ 0.59       │ rsiDivergency5m │
// │   61 │ RNDRUSDT     │ 2023 11 15 10:15:00 │ 2023 11 15 10:45:00 │ SHORT        │ -0.51% │ 13.77% │ 2.60       │ rsiDivergency5m │
// │   62 │ RNDRUSDT     │ 2023 11 15 10:50:00 │ 2023 11 15 11:40:00 │ SHORT        │ -0.51% │ 13.26% │ 2.63       │ rsiDivergency5m │
// │   63 │ RNDRUSDT     │ 2023 11 15 11:45:00 │ 2023 11 15 12:00:00 │ SHORT        │ -0.51% │ 12.75% │ 2.67       │ rsiDivergency5m │
// │   64 │ BIGTIMEUSDT  │ 2023 11 15 22:10:00 │ 2023 11 16 06:30:00 │ SHORT        │ 1.69%  │ 16.12% │ 0.24       │ rsiDivergency5m │
// │   65 │ YGGUSDT      │ 2023 11 16 07:25:00 │ 2023 11 16 08:15:00 │ LONG         │ -0.51% │ 15.61% │ 0.40       │ rsiDivergency5m │
// │   66 │ YGGUSDT      │ 2023 11 16 08:20:00 │ 2023 11 16 10:40:00 │ LONG         │ -0.51% │ 15.09% │ 0.39       │ rsiDivergency5m │
// │   67 │ HOOKUSDT     │ 2023 11 16 13:50:00 │ 2023 11 16 14:20:00 │ LONG         │ -0.51% │ 14.58% │ 0.97       │ rsiDivergency5m │
// │   68 │ HIGHUSDT     │ 2023 11 16 14:35:00 │ 2023 11 16 22:55:00 │ LONG         │ 0.84%  │ 15.42% │ 1.38       │ rsiDivergency5m │
// │   69 │ WLDUSDT      │ 2023 11 17 05:25:00 │ 2023 11 17 13:45:00 │ LONG         │ 0.66%  │ 15.57% │ 1.99       │ rsiDivergency5m │
// │   70 │ POWRUSDT     │ 2023 11 17 10:40:00 │ 2023 11 17 19:00:00 │ LONG         │ 1.61%  │ 10.76% │ 0.25       │ rsiDivergency5m │
// │   71 │ ALPHAUSDT    │ 2023 11 17 13:40:00 │ 2023 11 17 22:00:00 │ SHORT        │ 0.01%  │ 15.58% │ 0.09       │ rsiDivergency5m │
// │   72 │ FETUSDT      │ 2023 11 17 22:55:00 │ 2023 11 18 00:25:00 │ LONG         │ -0.51% │ 15.06% │ 0.42       │ rsiDivergency5m │
// │   73 │ CKBUSDT      │ 2023 11 18 00:50:00 │ 2023 11 18 02:00:00 │ LONG         │ -0.51% │ 14.55% │ 0.00       │ rsiDivergency5m │
// │   74 │ ARPAUSDT     │ 2023 11 18 01:40:00 │ 2023 11 18 02:00:00 │ LONG         │ -0.51% │ 14.04% │ 0.05       │ rsiDivergency5m │
// │   75 │ PENDLEUSDT   │ 2023 11 18 06:30:00 │ 2023 11 18 07:30:00 │ SHORT        │ -0.51% │ 13.53% │ 1.14       │ rsiDivergency5m │
// │   76 │ FETUSDT      │ 2023 11 18 10:15:00 │ 2023 11 18 10:45:00 │ SHORT        │ -0.51% │ 12.50% │ 0.45       │ rsiDivergency5m │
// │   77 │ RNDRUSDT     │ 2023 11 18 11:15:00 │ 2023 11 18 19:35:00 │ SHORT        │ 0.51%  │ 13.01% │ 3.48       │ rsiDivergency5m │
// │   78 │ TOKENUSDT    │ 2023 11 18 14:05:00 │ 2023 11 18 22:25:00 │ SHORT        │ 0.58%  │ 11.39% │ 0.03       │ rsiDivergency5m │
// │   79 │ DOGEUSDT     │ 2023 11 18 20:35:00 │ 2023 11 19 04:55:00 │ LONG         │ 0.46%  │ 13.47% │ 0.08       │ rsiDivergency5m │
// │   80 │ ARUSDT       │ 2023 11 19 11:55:00 │ 2023 11 19 13:15:00 │ SHORT        │ -0.51% │ 15.45% │ 8.91       │ rsiDivergency5m │
// │   81 │ SNXUSDT      │ 2023 11 19 12:35:00 │ 2023 11 19 13:00:00 │ SHORT        │ -0.51% │ 14.93% │ 3.16       │ rsiDivergency5m │
// │   82 │ SKLUSDT      │ 2023 11 19 13:40:00 │ 2023 11 19 14:00:00 │ SHORT        │ -0.51% │ 14.42% │ 0.04       │ rsiDivergency5m │
// │   83 │ SNXUSDT      │ 2023 11 19 14:20:00 │ 2023 11 19 15:15:00 │ SHORT        │ -0.51% │ 13.91% │ 3.35       │ rsiDivergency5m │
// │   84 │ NTRNUSDT     │ 2023 11 20 07:05:00 │ 2023 11 20 15:25:00 │ SHORT        │ 0.78%  │ 0.57%  │ 0.48       │ rsiDivergency5m │
// │   85 │ ARPAUSDT     │ 2023 11 21 01:05:00 │ 2023 11 21 02:40:00 │ LONG         │ -0.51% │ 13.80% │ 0.05       │ rsiDivergency5m │
// │   86 │ WAXPUSDT     │ 2023 11 21 13:15:00 │ 2023 11 21 17:55:00 │ LONG         │ -0.51% │ 13.40% │ 0.06       │ rsiDivergency5m │
// │   87 │ ENSUSDT      │ 2023 11 21 18:00:00 │ 2023 11 22 02:20:00 │ LONG         │ 0.94%  │ 17.48% │ 7.80       │ rsiDivergency5m │
// │   88 │ WAXPUSDT     │ 2023 11 21 19:00:00 │ 2023 11 22 03:20:00 │ LONG         │ 0.74%  │ 14.13% │ 0.06       │ rsiDivergency5m │
// │   89 │ SKLUSDT      │ 2023 11 22 02:00:00 │ 2023 11 22 10:20:00 │ SHORT        │ 1.58%  │ 19.06% │ 0.06       │ rsiDivergency5m │
// │   90 │ INJUSDT      │ 2023 11 22 16:10:00 │ 2023 11 23 00:30:00 │ SHORT        │ 0.74%  │ 19.29% │ 16.48      │ rsiDivergency5m │
// │   91 │ ALPHAUSDT    │ 2023 11 22 23:55:00 │ 2023 11 23 08:15:00 │ SHORT        │ 0.61%  │ 19.90% │ 0.10       │ rsiDivergency5m │
// │   92 │ GASUSDT      │ 2023 11 23 06:30:00 │ 2023 11 23 06:45:00 │ SHORT        │ -0.51% │ 12.46% │ 8.68       │ rsiDivergency5m │
// │   93 │ GASUSDT      │ 2023 11 23 06:55:00 │ 2023 11 23 09:45:00 │ SHORT        │ -0.51% │ 11.94% │ 9.00       │ rsiDivergency5m │
// │   94 │ SPELLUSDT    │ 2023 11 23 14:40:00 │ 2023 11 23 14:50:00 │ SHORT        │ -0.51% │ 19.39% │ 0.00       │ rsiDivergency5m │
// │   95 │ SPELLUSDT    │ 2023 11 23 14:55:00 │ 2023 11 23 15:15:00 │ SHORT        │ -0.51% │ 18.87% │ 0.00       │ rsiDivergency5m │
// │   96 │ SPELLUSDT    │ 2023 11 23 15:20:00 │ 2023 11 23 15:30:00 │ SHORT        │ -0.51% │ 18.36% │ 0.00       │ rsiDivergency5m │
// │   97 │ SPELLUSDT    │ 2023 11 23 15:40:00 │ 2023 11 23 15:50:00 │ SHORT        │ -0.51% │ 17.85% │ 0.00       │ rsiDivergency5m │
// │   98 │ SPELLUSDT    │ 2023 11 23 15:55:00 │ 2023 11 23 23:15:00 │ SHORT        │ -0.51% │ 17.34% │ 0.00       │ rsiDivergency5m │
// │   99 │ FETUSDT      │ 2023 11 24 00:50:00 │ 2023 11 24 03:10:00 │ SHORT        │ -0.51% │ 16.82% │ 0.54       │ rsiDivergency5m │
// │  100 │ GMTUSDT      │ 2023 11 25 01:40:00 │ 2023 11 25 02:15:00 │ SHORT        │ -0.51% │ 14.17% │ 0.33       │ rsiDivergency5m │
// │  101 │ GMTUSDT      │ 2023 11 25 02:35:00 │ 2023 11 25 10:35:00 │ SHORT        │ -0.51% │ 13.66% │ 0.34       │ rsiDivergency5m │
// │  102 │ TLMUSDT      │ 2023 11 26 05:05:00 │ 2023 11 26 05:25:00 │ SHORT        │ -0.51% │ 13.75% │ 0.02       │ rsiDivergency5m │
// │  103 │ TLMUSDT      │ 2023 11 26 05:30:00 │ 2023 11 26 05:40:00 │ SHORT        │ -0.51% │ 13.24% │ 0.02       │ rsiDivergency5m │
// │  104 │ TLMUSDT      │ 2023 11 26 05:45:00 │ 2023 11 26 07:40:00 │ SHORT        │ -0.51% │ 12.73% │ 0.02       │ rsiDivergency5m │
// │  105 │ TRUUSDT      │ 2023 11 26 08:40:00 │ 2023 11 26 09:20:00 │ SHORT        │ -0.51% │ 11.70% │ 0.06       │ rsiDivergency5m │
// │  106 │ TOKENUSDT    │ 2023 11 26 11:40:00 │ 2023 11 26 20:00:00 │ LONG         │ 0.37%  │ 11.13% │ 0.03       │ rsiDivergency5m │
// │  107 │ ORDIUSDT     │ 2023 11 26 13:00:00 │ 2023 11 26 13:25:00 │ LONG         │ -0.51% │ 12.08% │ 19.82      │ rsiDivergency5m │
// │  108 │ AXSUSDT      │ 2023 11 26 17:50:00 │ 2023 11 26 19:00:00 │ SHORT        │ -0.51% │ 12.15% │ 6.68       │ rsiDivergency5m │
// │  109 │ GMTUSDT      │ 2023 11 26 22:20:00 │ 2023 11 26 22:35:00 │ LONG         │ -0.51% │ 11.64% │ 0.30       │ rsiDivergency5m │
// │  110 │ ALICEUSDT    │ 2023 11 26 22:35:00 │ 2023 11 27 00:45:00 │ LONG         │ -0.51% │ 11.13% │ 1.20       │ rsiDivergency5m │
// │  111 │ TLMUSDT      │ 2023 11 27 02:25:00 │ 2023 11 27 10:45:00 │ LONG         │ 0.06%  │ 10.67% │ 0.01       │ rsiDivergency5m │
// │  112 │ BEAMXUSDT    │ 2023 11 27 13:30:00 │ 2023 11 27 21:50:00 │ LONG         │ 0.70%  │ 5.93%  │ 0.01       │ rsiDivergency5m │
// │  113 │ BIGTIMEUSDT  │ 2023 11 28 00:45:00 │ 2023 11 28 02:25:00 │ LONG         │ -0.51% │ 10.63% │ 0.20       │ rsiDivergency5m │
// │  114 │ RIFUSDT      │ 2023 11 29 10:15:00 │ 2023 11 29 18:35:00 │ LONG         │ 0.42%  │ 17.25% │ 0.11       │ rsiDivergency5m │
// │  115 │ BIGTIMEUSDT  │ 2023 12 01 12:30:00 │ 2023 12 01 13:00:00 │ SHORT        │ -0.51% │ 10.88% │ 0.27       │ rsiDivergency5m │
// │  116 │ BIGTIMEUSDT  │ 2023 12 01 13:10:00 │ 2023 12 01 13:25:00 │ SHORT        │ -0.51% │ 10.37% │ 0.28       │ rsiDivergency5m │
// │  117 │ BIGTIMEUSDT  │ 2023 12 01 13:35:00 │ 2023 12 01 14:45:00 │ SHORT        │ -0.51% │ 9.86%  │ 0.28       │ rsiDivergency5m │
// │  118 │ IOTAUSDT     │ 2023 12 02 04:10:00 │ 2023 12 02 09:35:00 │ SHORT        │ -0.51% │ 11.11% │ 0.28       │ rsiDivergency5m │
// │  119 │ NTRNUSDT     │ 2023 12 02 09:05:00 │ 2023 12 02 09:40:00 │ SHORT        │ -0.51% │ 11.95% │ 0.57       │ rsiDivergency5m │
// │  120 │ 1000LUNCUSDT │ 2023 12 03 01:05:00 │ 2023 12 03 04:05:00 │ SHORT        │ -0.51% │ 9.06%  │ 0.16       │ rsiDivergency5m │
// │  121 │ XVSUSDT      │ 2023 12 03 07:30:00 │ 2023 12 03 07:55:00 │ SHORT        │ -0.51% │ 8.54%  │ 8.14       │ rsiDivergency5m │
// │  122 │ XVSUSDT      │ 2023 12 03 08:05:00 │ 2023 12 03 08:20:00 │ SHORT        │ -0.51% │ 8.03%  │ 8.47       │ rsiDivergency5m │
// │  123 │ XVSUSDT      │ 2023 12 03 08:25:00 │ 2023 12 03 08:35:00 │ SHORT        │ -0.51% │ 7.52%  │ 8.61       │ rsiDivergency5m │
// │  124 │ SSVUSDT      │ 2023 12 04 06:00:00 │ 2023 12 04 06:10:00 │ LONG         │ -0.51% │ 8.48%  │ 26.78      │ rsiDivergency5m │
// │  125 │ RIFUSDT      │ 2023 12 04 08:45:00 │ 2023 12 04 08:50:00 │ SHORT        │ -0.51% │ 9.94%  │ 0.13       │ rsiDivergency5m │
// │  126 │ IOSTUSDT     │ 2023 12 04 23:40:00 │ 2023 12 05 00:30:00 │ SHORT        │ -0.51% │ 9.02%  │ 0.01       │ rsiDivergency5m │
// │  127 │ FRONTUSDT    │ 2023 12 05 20:05:00 │ 2023 12 06 04:25:00 │ SHORT        │ 1.46%  │ 10.89% │ 0.38       │ rsiDivergency5m │
// │  128 │ 1000BONKUSDT │ 2023 12 06 09:55:00 │ 2023 12 06 11:00:00 │ LONG         │ 2.49%  │ 6.96%  │ 0.01       │ rsiDivergency5m │
// │  129 │ HIFIUSDT     │ 2023 12 06 20:10:00 │ 2023 12 07 04:30:00 │ SHORT        │ 0.59%  │ 11.89% │ 0.82       │ rsiDivergency5m │
// │  130 │ BEAMXUSDT    │ 2023 12 07 19:45:00 │ 2023 12 07 21:10:00 │ LONG         │ -0.51% │ 11.41% │ 0.02       │ rsiDivergency5m │
// │  131 │ XVSUSDT      │ 2023 12 07 23:45:00 │ 2023 12 07 23:50:00 │ LONG         │ -0.51% │ 14.33% │ 10.30      │ rsiDivergency5m │
// │  132 │ HOTUSDT      │ 2023 12 08 03:45:00 │ 2023 12 08 12:05:00 │ SHORT        │ 1.00%  │ 14.30% │ 0.00       │ rsiDivergency5m │
// │  133 │ TOKENUSDT    │ 2023 12 08 09:55:00 │ 2023 12 08 14:50:00 │ LONG         │ 2.49%  │ 15.96% │ 0.05       │ rsiDivergency5m │
// │  134 │ BIGTIMEUSDT  │ 2023 12 08 19:55:00 │ 2023 12 09 04:15:00 │ SHORT        │ 1.41%  │ 15.20% │ 0.65       │ rsiDivergency5m │
// │  135 │ CELRUSDT     │ 2023 12 09 03:25:00 │ 2023 12 09 11:45:00 │ SHORT        │ 0.55%  │ 15.75% │ 0.02       │ rsiDivergency5m │
// │  136 │ USTCUSDT     │ 2023 12 10 06:35:00 │ 2023 12 10 06:45:00 │ SHORT        │ -0.51% │ 8.42%  │ 0.04       │ rsiDivergency5m │
// │  137 │ BIGTIMEUSDT  │ 2023 12 10 07:25:00 │ 2023 12 10 09:15:00 │ SHORT        │ -0.51% │ 13.69% │ 0.59       │ rsiDivergency5m │
// │  138 │ BIGTIMEUSDT  │ 2023 12 10 09:30:00 │ 2023 12 10 10:45:00 │ SHORT        │ -0.51% │ 13.17% │ 0.61       │ rsiDivergency5m │
// │  139 │ BIGTIMEUSDT  │ 2023 12 10 10:50:00 │ 2023 12 10 15:25:00 │ SHORT        │ -0.51% │ 12.66% │ 0.62       │ rsiDivergency5m │
// │  140 │ INJUSDT      │ 2023 12 10 16:00:00 │ 2023 12 10 18:40:00 │ SHORT        │ -0.51% │ 12.15% │ 20.89      │ rsiDivergency5m │
// │  141 │ INJUSDT      │ 2023 12 10 18:50:00 │ 2023 12 10 21:10:00 │ SHORT        │ 2.49%  │ 14.64% │ 21.35      │ rsiDivergency5m │
// │  142 │ PENDLEUSDT   │ 2023 12 10 22:00:00 │ 2023 12 11 00:45:00 │ LONG         │ -0.51% │ 14.12% │ 1.14       │ rsiDivergency5m │
// │  143 │ WLDUSDT      │ 2023 12 11 01:20:00 │ 2023 12 11 09:40:00 │ LONG         │ -0.22% │ 13.90% │ 2.47       │ rsiDivergency5m │
// │  144 │ YFIUSDT      │ 2023 12 11 09:30:00 │ 2023 12 11 13:10:00 │ LONG         │ -0.51% │ 13.39% │ 8456.00    │ rsiDivergency5m │
// │  145 │ VETUSDT      │ 2023 12 11 13:30:00 │ 2023 12 11 21:50:00 │ LONG         │ 1.38%  │ 14.77% │ 0.03       │ rsiDivergency5m │
// │  146 │ VETUSDT      │ 2023 12 11 23:25:00 │ 2023 12 12 00:40:00 │ SHORT        │ -0.51% │ 14.26% │ 0.03       │ rsiDivergency5m │
// │  147 │ VETUSDT      │ 2023 12 12 00:45:00 │ 2023 12 12 01:55:00 │ SHORT        │ -0.51% │ 13.75% │ 0.03       │ rsiDivergency5m │
// │  148 │ ALICEUSDT    │ 2023 12 12 03:55:00 │ 2023 12 12 06:05:00 │ SHORT        │ -0.51% │ 13.23% │ 1.25       │ rsiDivergency5m │
// │  149 │ POWRUSDT     │ 2023 12 12 07:00:00 │ 2023 12 12 15:20:00 │ LONG         │ 1.76%  │ 11.62% │ 0.37       │ rsiDivergency5m │
// │  150 │ BONDUSDT     │ 2023 12 12 18:10:00 │ 2023 12 12 18:30:00 │ SHORT        │ -0.51% │ 14.70% │ 4.14       │ rsiDivergency5m │
// │  151 │ ARBUSDT      │ 2023 12 12 18:20:00 │ 2023 12 13 00:10:00 │ SHORT        │ 2.49%  │ 17.18% │ 1.24       │ rsiDivergency5m │
// │  152 │ SUPERUSDT    │ 2023 12 12 21:25:00 │ 2023 12 12 23:05:00 │ LONG         │ -0.51% │ 11.50% │ 0.53       │ rsiDivergency5m │
// │  153 │ ALGOUSDT     │ 2023 12 12 23:15:00 │ 2023 12 13 07:35:00 │ LONG         │ 0.34%  │ 17.52% │ 0.19       │ rsiDivergency5m │
// │  154 │ SUPERUSDT    │ 2023 12 12 23:25:00 │ 2023 12 13 01:55:00 │ LONG         │ -0.51% │ 10.98% │ 0.51       │ rsiDivergency5m │
// │  155 │ IOTAUSDT     │ 2023 12 13 07:40:00 │ 2023 12 13 16:00:00 │ SHORT        │ 0.02%  │ 17.54% │ 0.28       │ rsiDivergency5m │
// │  156 │ BEAMXUSDT    │ 2023 12 13 08:45:00 │ 2023 12 13 09:50:00 │ SHORT        │ -0.51% │ 13.60% │ 0.02       │ rsiDivergency5m │
// │  157 │ HOOKUSDT     │ 2023 12 13 17:15:00 │ 2023 12 14 01:35:00 │ SHORT        │ 0.52%  │ 18.06% │ 1.18       │ rsiDivergency5m │
// │  158 │ ORDIUSDT     │ 2023 12 13 21:25:00 │ 2023 12 14 05:45:00 │ SHORT        │ 0.26%  │ 14.05% │ 56.67      │ rsiDivergency5m │
// │  159 │ DENTUSDT     │ 2023 12 14 02:30:00 │ 2023 12 14 03:25:00 │ SHORT        │ -0.51% │ 17.55% │ 0.00       │ rsiDivergency5m │
// │  160 │ IOTAUSDT     │ 2023 12 14 03:15:00 │ 2023 12 14 11:35:00 │ SHORT        │ 1.07%  │ 18.62% │ 0.30       │ rsiDivergency5m │
// │  161 │ ORDIUSDT     │ 2023 12 14 07:35:00 │ 2023 12 14 08:30:00 │ SHORT        │ 2.49%  │ 16.54% │ 61.67      │ rsiDivergency5m │
// │  162 │ DOTUSDT      │ 2023 12 15 00:45:00 │ 2023 12 15 03:05:00 │ LONG         │ -0.51% │ 18.71% │ 7.33       │ rsiDivergency5m │
// │  163 │ USTCUSDT     │ 2023 12 15 18:25:00 │ 2023 12 15 19:35:00 │ LONG         │ -0.51% │ 11.57% │ 0.04       │ rsiDivergency5m │
// │  164 │ YGGUSDT      │ 2023 12 17 02:20:00 │ 2023 12 17 02:30:00 │ LONG         │ -0.51% │ 20.10% │ 0.43       │ rsiDivergency5m │
// │  165 │ YGGUSDT      │ 2023 12 17 02:35:00 │ 2023 12 17 10:55:00 │ LONG         │ 0.61%  │ 20.70% │ 0.42       │ rsiDivergency5m │
// │  166 │ DARUSDT      │ 2023 12 17 11:50:00 │ 2023 12 17 20:10:00 │ SHORT        │ 1.36%  │ 22.06% │ 0.15       │ rsiDivergency5m │
// │  167 │ XVSUSDT      │ 2023 12 17 20:40:00 │ 2023 12 18 05:00:00 │ LONG         │ -0.02% │ 22.04% │ 9.66       │ rsiDivergency5m │
// │  168 │ SUPERUSDT    │ 2023 12 17 21:45:00 │ 2023 12 18 04:15:00 │ LONG         │ -0.51% │ 9.42%  │ 0.54       │ rsiDivergency5m │
// │  169 │ GALAUSDT     │ 2023 12 18 04:25:00 │ 2023 12 18 05:25:00 │ LONG         │ -0.51% │ 21.53% │ 0.03       │ rsiDivergency5m │
// │  170 │ USTCUSDT     │ 2023 12 18 04:25:00 │ 2023 12 18 05:25:00 │ LONG         │ -0.51% │ 8.90%  │ 0.03       │ rsiDivergency5m │
// │  171 │ TOKENUSDT    │ 2023 12 18 04:30:00 │ 2023 12 18 05:30:00 │ LONG         │ -0.51% │ 10.45% │ 0.04       │ rsiDivergency5m │
// │  172 │ ONGUSDT      │ 2023 12 18 05:35:00 │ 2023 12 18 13:55:00 │ LONG         │ 0.77%  │ 9.67%  │ 0.33       │ rsiDivergency5m │
// │  173 │ GMTUSDT      │ 2023 12 18 05:40:00 │ 2023 12 18 14:00:00 │ LONG         │ 0.93%  │ 22.47% │ 0.23       │ rsiDivergency5m │
// │  174 │ WAXPUSDT     │ 2023 12 18 05:45:00 │ 2023 12 18 14:05:00 │ LONG         │ 0.76%  │ 21.63% │ 0.06       │ rsiDivergency5m │
// │  175 │ UMAUSDT      │ 2023 12 19 06:45:00 │ 2023 12 19 15:05:00 │ SHORT        │ 0.56%  │ 22.55% │ 2.28       │ rsiDivergency5m │
// │  176 │ SUPERUSDT    │ 2023 12 19 18:20:00 │ 2023 12 20 02:40:00 │ LONG         │ 0.35%  │ 9.95%  │ 0.57       │ rsiDivergency5m │
// │  177 │ MAVUSDT      │ 2023 12 19 23:50:00 │ 2023 12 20 03:55:00 │ SHORT        │ -0.51% │ 21.52% │ 0.40       │ rsiDivergency5m │
// │  178 │ INJUSDT      │ 2023 12 20 03:55:00 │ 2023 12 20 04:00:00 │ SHORT        │ -0.51% │ 21.01% │ 42.59      │ rsiDivergency5m │
// │  179 │ INJUSDT      │ 2023 12 20 04:05:00 │ 2023 12 20 12:25:00 │ SHORT        │ 1.23%  │ 22.24% │ 43.13      │ rsiDivergency5m │
// │  180 │ MINAUSDT     │ 2023 12 21 06:15:00 │ 2023 12 21 14:35:00 │ SHORT        │ 1.17%  │ 23.49% │ 0.94       │ rsiDivergency5m │
// │  181 │ DOTUSDT      │ 2023 12 21 13:45:00 │ 2023 12 21 18:55:00 │ SHORT        │ -0.51% │ 22.98% │ 8.27       │ rsiDivergency5m │
// │  182 │ ROSEUSDT     │ 2023 12 21 20:00:00 │ 2023 12 22 00:15:00 │ SHORT        │ -0.51% │ 22.47% │ 0.11       │ rsiDivergency5m │
// │  183 │ ROSEUSDT     │ 2023 12 22 00:25:00 │ 2023 12 22 01:25:00 │ SHORT        │ -0.51% │ 21.95% │ 0.12       │ rsiDivergency5m │
// │  184 │ NTRNUSDT     │ 2023 12 22 02:25:00 │ 2023 12 22 02:35:00 │ LONG         │ -0.51% │ 18.55% │ 1.14       │ rsiDivergency5m │
// │  185 │ DODOXUSDT    │ 2023 12 22 10:50:00 │ 2023 12 22 19:10:00 │ SHORT        │ 0.53%  │ 23.40% │ 0.19       │ rsiDivergency5m │
// │  186 │ SUPERUSDT    │ 2023 12 22 17:55:00 │ 2023 12 22 18:05:00 │ SHORT        │ -0.51% │ 14.03% │ 0.69       │ rsiDivergency5m │
// │  187 │ STXUSDT      │ 2023 12 22 19:20:00 │ 2023 12 22 20:00:00 │ SHORT        │ -0.51% │ 22.89% │ 1.44       │ rsiDivergency5m │
// │  188 │ SUIUSDT      │ 2023 12 22 20:20:00 │ 2023 12 23 04:40:00 │ SHORT        │ 0.06%  │ 22.95% │ 0.74       │ rsiDivergency5m │
// │  189 │ IMXUSDT      │ 2023 12 23 05:25:00 │ 2023 12 23 13:45:00 │ SHORT        │ 1.14%  │ 24.10% │ 2.53       │ rsiDivergency5m │
// │  190 │ RNDRUSDT     │ 2023 12 23 14:15:00 │ 2023 12 23 15:00:00 │ SHORT        │ -0.51% │ 23.58% │ 4.83       │ rsiDivergency5m │
// │  191 │ DOTUSDT      │ 2023 12 23 20:55:00 │ 2023 12 24 05:15:00 │ SHORT        │ 0.34%  │ 23.41% │ 8.89       │ rsiDivergency5m │
// │  192 │ NTRNUSDT     │ 2023 12 24 13:15:00 │ 2023 12 24 14:20:00 │ SHORT        │ -0.51% │ 14.69% │ 1.19       │ rsiDivergency5m │
// │  193 │ HOTUSDT      │ 2023 12 24 16:50:00 │ 2023 12 24 17:15:00 │ LONG         │ -0.51% │ 22.38% │ 0.00       │ rsiDivergency5m │
// │  194 │ INJUSDT      │ 2023 12 24 19:45:00 │ 2023 12 25 04:05:00 │ LONG         │ 0.42%  │ 22.29% │ 39.90      │ rsiDivergency5m │
// │  195 │ ONEUSDT      │ 2023 12 25 06:10:00 │ 2023 12 25 06:35:00 │ SHORT        │ -0.51% │ 20.75% │ 0.02       │ rsiDivergency5m │
// │  196 │ LEVERUSDT    │ 2023 12 25 06:15:00 │ 2023 12 25 06:20:00 │ SHORT        │ -0.51% │ 21.78% │ 0.00       │ rsiDivergency5m │
// │  197 │ NTRNUSDT     │ 2023 12 25 20:45:00 │ 2023 12 25 21:15:00 │ SHORT        │ -0.51% │ 12.22% │ 1.26       │ rsiDivergency5m │
// │  198 │ WLDUSDT      │ 2023 12 25 22:20:00 │ 2023 12 25 22:40:00 │ SHORT        │ -0.51% │ 18.70% │ 3.99       │ rsiDivergency5m │
// │  199 │ GALAUSDT     │ 2023 12 26 01:10:00 │ 2023 12 26 04:40:00 │ LONG         │ -0.51% │ 18.19% │ 0.03       │ rsiDivergency5m │
// │  200 │ MAVUSDT      │ 2023 12 26 05:30:00 │ 2023 12 26 08:05:00 │ SHORT        │ -0.51% │ 17.68% │ 0.41       │ rsiDivergency5m │
// │  201 │ APTUSDT      │ 2023 12 26 17:30:00 │ 2023 12 26 20:20:00 │ SHORT        │ -0.51% │ 17.86% │ 10.78      │ rsiDivergency5m │
// │  202 │ EGLDUSDT     │ 2023 12 26 19:45:00 │ 2023 12 27 04:05:00 │ SHORT        │ 0.91%  │ 18.78% │ 73.75      │ rsiDivergency5m │
// │  203 │ 1000SATSUSDT │ 2023 12 27 04:45:00 │ 2023 12 27 13:05:00 │ SHORT        │ 1.12%  │ 12.52% │ 0.00       │ rsiDivergency5m │
// │  204 │ ORDIUSDT     │ 2023 12 27 05:05:00 │ 2023 12 27 13:25:00 │ SHORT        │ 1.38%  │ 10.04% │ 73.97      │ rsiDivergency5m │
// │  205 │ IOTAUSDT     │ 2023 12 27 07:25:00 │ 2023 12 27 15:45:00 │ SHORT        │ 0.70%  │ 21.45% │ 0.31       │ rsiDivergency5m │
// │  206 │ ARBUSDT      │ 2023 12 27 08:35:00 │ 2023 12 27 08:45:00 │ SHORT        │ -0.51% │ 20.75% │ 1.43       │ rsiDivergency5m │
// │  207 │ LDOUSDT      │ 2023 12 27 17:10:00 │ 2023 12 27 19:35:00 │ SHORT        │ -0.51% │ 20.94% │ 2.84       │ rsiDivergency5m │
// │  208 │ MINAUSDT     │ 2023 12 27 21:10:00 │ 2023 12 28 00:20:00 │ LONG         │ -0.51% │ 20.43% │ 1.30       │ rsiDivergency5m │
// │  209 │ LEVERUSDT    │ 2023 12 28 01:55:00 │ 2023 12 28 07:55:00 │ LONG         │ -0.51% │ 19.92% │ 0.00       │ rsiDivergency5m │
// │  210 │ 1000LUNCUSDT │ 2023 12 28 08:00:00 │ 2023 12 28 09:15:00 │ LONG         │ -0.51% │ 19.40% │ 0.15       │ rsiDivergency5m │
// │  211 │ FLOWUSDT     │ 2023 12 28 09:10:00 │ 2023 12 28 09:45:00 │ LONG         │ -0.51% │ 18.89% │ 0.92       │ rsiDivergency5m │
// │  212 │ RSRUSDT      │ 2023 12 28 09:25:00 │ 2023 12 28 16:45:00 │ LONG         │ -0.51% │ 18.38% │ 0.00       │ rsiDivergency5m │
// │  213 │ 1000BONKUSDT │ 2023 12 28 16:15:00 │ 2023 12 28 17:15:00 │ SHORT        │ -0.51% │ 13.11% │ 0.01       │ rsiDivergency5m │
// │  214 │ LDOUSDT      │ 2023 12 28 20:55:00 │ 2023 12 29 05:15:00 │ LONG         │ 0.82%  │ 18.69% │ 2.62       │ rsiDivergency5m │
// │  215 │ ORDIUSDT     │ 2023 12 29 04:30:00 │ 2023 12 29 05:00:00 │ SHORT        │ -0.51% │ 11.30% │ 77.08      │ rsiDivergency5m │
// │  216 │ MINAUSDT     │ 2023 12 29 05:25:00 │ 2023 12 29 13:45:00 │ SHORT        │ 0.91%  │ 19.60% │ 1.39       │ rsiDivergency5m │
// │  217 │ ORDIUSDT     │ 2023 12 29 20:35:00 │ 2023 12 30 04:55:00 │ SHORT        │ 1.94%  │ 13.84% │ 81.17      │ rsiDivergency5m │
// │  218 │ WLDUSDT      │ 2023 12 30 07:55:00 │ 2023 12 30 08:35:00 │ SHORT        │ -0.51% │ 19.20% │ 3.73       │ rsiDivergency5m │
// │  219 │ GMXUSDT      │ 2023 12 30 10:00:00 │ 2023 12 30 10:35:00 │ SHORT        │ -0.51% │ 18.69% │ 55.51      │ rsiDivergency5m │
// │  220 │ INJUSDT      │ 2023 12 30 17:05:00 │ 2023 12 31 01:25:00 │ SHORT        │ -0.10% │ 18.08% │ 37.64      │ rsiDivergency5m │
// │  221 │ DEFIUSDT     │ 2023 12 31 15:30:00 │ 2023 12 31 16:45:00 │ SHORT        │ -0.51% │ 17.76% │ 1105.60    │ rsiDivergency5m │
// │  222 │ BONDUSDT     │ 2023 12 31 19:00:00 │ 2023 12 31 23:15:00 │ LONG         │ -0.51% │ 17.24% │ 4.36       │ rsiDivergency5m │
// │  223 │ DEFIUSDT     │ 2023 12 31 21:45:00 │ 2023 12 31 23:10:00 │ LONG         │ -0.51% │ 16.73% │ 966.80     │ rsiDivergency5m │
// │  224 │ FRONTUSDT    │ 2024 01 01 01:00:00 │ 2024 01 01 09:20:00 │ LONG         │ 0.55%  │ 17.28% │ 0.39       │ rsiDivergency5m │
// │  225 │ NTRNUSDT     │ 2024 01 01 09:40:00 │ 2024 01 01 13:50:00 │ SHORT        │ -0.51% │ 9.57%  │ 1.19       │ rsiDivergency5m │
// │  226 │ MINAUSDT     │ 2024 01 01 13:05:00 │ 2024 01 01 13:20:00 │ SHORT        │ -0.51% │ 16.26% │ 1.50       │ rsiDivergency5m │
// │  227 │ ARPAUSDT     │ 2024 01 01 13:25:00 │ 2024 01 01 14:25:00 │ SHORT        │ -0.51% │ 15.75% │ 0.06       │ rsiDivergency5m │
// │  228 │ ARBUSDT      │ 2024 01 01 15:00:00 │ 2024 01 01 19:25:00 │ SHORT        │ -0.51% │ 15.23% │ 1.72       │ rsiDivergency5m │
// │  229 │ 1000BONKUSDT │ 2024 01 01 18:40:00 │ 2024 01 01 18:55:00 │ SHORT        │ -0.51% │ 16.74% │ 0.01       │ rsiDivergency5m │
// │  230 │ STXUSDT      │ 2024 01 01 20:30:00 │ 2024 01 01 21:55:00 │ SHORT        │ -0.51% │ 14.72% │ 1.68       │ rsiDivergency5m │
// │  231 │ BIGTIMEUSDT  │ 2024 01 01 23:15:00 │ 2024 01 01 23:35:00 │ SHORT        │ -0.51% │ 14.21% │ 0.50       │ rsiDivergency5m │
// │  232 │ LDOUSDT      │ 2024 01 02 00:10:00 │ 2024 01 02 08:30:00 │ SHORT        │ 0.68%  │ 14.89% │ 3.15       │ rsiDivergency5m │
// │  233 │ GMTUSDT      │ 2024 01 02 14:40:00 │ 2024 01 02 23:00:00 │ SHORT        │ 1.67%  │ 16.55% │ 0.38       │ rsiDivergency5m │
// │  234 │ OXTUSDT      │ 2024 01 03 01:10:00 │ 2024 01 03 03:10:00 │ LONG         │ -0.51% │ 16.04% │ 0.11       │ rsiDivergency5m │
// │  235 │ GMTUSDT      │ 2024 01 03 02:55:00 │ 2024 01 03 06:05:00 │ LONG         │ -0.51% │ 15.53% │ 0.34       │ rsiDivergency5m │
// │  236 │ LINAUSDT     │ 2024 01 03 07:40:00 │ 2024 01 03 09:15:00 │ LONG         │ -0.51% │ 15.02% │ 0.01       │ rsiDivergency5m │
// │  237 │ FRONTUSDT    │ 2024 01 03 11:55:00 │ 2024 01 03 12:45:00 │ SHORT        │ -0.51% │ 14.50% │ 0.42       │ rsiDivergency5m │
// │  238 │ FRONTUSDT    │ 2024 01 03 13:25:00 │ 2024 01 03 15:30:00 │ SHORT        │ -0.51% │ 13.99% │ 0.43       │ rsiDivergency5m │
// │  239 │ NKNUSDT      │ 2024 01 03 17:00:00 │ 2024 01 03 18:25:00 │ SHORT        │ -0.51% │ 13.48% │ 0.12       │ rsiDivergency5m │
// │  240 │ APTUSDT      │ 2024 01 04 02:05:00 │ 2024 01 04 04:45:00 │ SHORT        │ -0.51% │ 11.43% │ 9.60       │ rsiDivergency5m │
// │  241 │ LDOUSDT      │ 2024 01 04 05:00:00 │ 2024 01 04 10:00:00 │ SHORT        │ -0.51% │ 10.92% │ 3.31       │ rsiDivergency5m │
// │  242 │ ARBUSDT      │ 2024 01 04 10:20:00 │ 2024 01 04 10:55:00 │ SHORT        │ -0.51% │ 10.40% │ 2.02       │ rsiDivergency5m │
// │  243 │ 1000LUNCUSDT │ 2024 01 04 15:40:00 │ 2024 01 04 16:15:00 │ SHORT        │ -0.51% │ 8.87%  │ 0.13       │ rsiDivergency5m │
// │  244 │ SUPERUSDT    │ 2024 01 05 06:55:00 │ 2024 01 05 10:15:00 │ LONG         │ -0.51% │ 16.22% │ 0.58       │ rsiDivergency5m │
// │  245 │ PENDLEUSDT   │ 2024 01 05 11:50:00 │ 2024 01 05 20:10:00 │ LONG         │ 0.37%  │ 9.56%  │ 1.33       │ rsiDivergency5m │
// │  246 │ SUIUSDT      │ 2024 01 06 00:25:00 │ 2024 01 06 07:15:00 │ LONG         │ 2.49%  │ 12.05% │ 0.82       │ rsiDivergency5m │
// │  247 │ PENDLEUSDT   │ 2024 01 06 09:00:00 │ 2024 01 06 14:40:00 │ LONG         │ -0.51% │ 11.53% │ 1.30       │ rsiDivergency5m │
// │  248 │ SUPERUSDT    │ 2024 01 06 11:05:00 │ 2024 01 06 19:25:00 │ SHORT        │ 0.61%  │ 14.27% │ 0.57       │ rsiDivergency5m │
// │  249 │ ARPAUSDT     │ 2024 01 06 15:50:00 │ 2024 01 07 00:10:00 │ LONG         │ 0.16%  │ 11.70% │ 0.07       │ rsiDivergency5m │
// │  250 │ 1000BONKUSDT │ 2024 01 07 12:00:00 │ 2024 01 07 17:15:00 │ LONG         │ -0.51% │ 8.61%  │ 0.01       │ rsiDivergency5m │
// │  251 │ 1INCHUSDT    │ 2024 01 07 18:30:00 │ 2024 01 07 19:50:00 │ LONG         │ -0.51% │ 10.47% │ 0.41       │ rsiDivergency5m │
// │  252 │ BEAMXUSDT    │ 2024 01 07 18:30:00 │ 2024 01 07 19:35:00 │ LONG         │ -0.51% │ 9.44%  │ 0.02       │ rsiDivergency5m │
// │  253 │ HIFIUSDT     │ 2024 01 07 18:30:00 │ 2024 01 07 19:35:00 │ LONG         │ -0.51% │ 10.99% │ 0.64       │ rsiDivergency5m │
// │  254 │ LINAUSDT     │ 2024 01 07 20:20:00 │ 2024 01 07 21:15:00 │ LONG         │ -0.51% │ 9.96%  │ 0.01       │ rsiDivergency5m │
// │  255 │ ONTUSDT      │ 2024 01 07 21:20:00 │ 2024 01 07 21:35:00 │ LONG         │ -0.51% │ 8.94%  │ 0.22       │ rsiDivergency5m │
// │  256 │ APTUSDT      │ 2024 01 07 21:55:00 │ 2024 01 07 22:25:00 │ LONG         │ -0.51% │ 9.45%  │ 7.98       │ rsiDivergency5m │
// │  257 │ OGNUSDT      │ 2024 01 07 22:25:00 │ 2024 01 08 01:45:00 │ LONG         │ 2.49%  │ 11.42% │ 0.14       │ rsiDivergency5m │
// │  258 │ SPELLUSDT    │ 2024 01 08 02:20:00 │ 2024 01 08 07:10:00 │ SHORT        │ -0.51% │ 10.91% │ 0.00       │ rsiDivergency5m │
// │  259 │ AMBUSDT      │ 2024 01 08 07:45:00 │ 2024 01 08 10:15:00 │ SHORT        │ -0.51% │ 10.40% │ 0.01       │ rsiDivergency5m │
// │  260 │ WLDUSDT      │ 2024 01 08 13:40:00 │ 2024 01 08 14:50:00 │ SHORT        │ -0.51% │ 9.37%  │ 2.82       │ rsiDivergency5m │
// │  261 │ 1000LUNCUSDT │ 2024 01 08 14:25:00 │ 2024 01 08 14:30:00 │ SHORT        │ -0.51% │ 8.86%  │ 0.13       │ rsiDivergency5m │
// │  262 │ 1000LUNCUSDT │ 2024 01 08 14:35:00 │ 2024 01 08 22:55:00 │ SHORT        │ 1.41%  │ 10.27% │ 0.13       │ rsiDivergency5m │
// │  263 │ NFPUSDT      │ 2024 01 09 07:50:00 │ 2024 01 09 07:55:00 │ LONG         │ -0.51% │ 5.53%  │ 0.54       │ rsiDivergency5m │
// │  264 │ ACEUSDT      │ 2024 01 09 09:35:00 │ 2024 01 09 10:00:00 │ LONG         │ -0.51% │ 10.11% │ 7.56       │ rsiDivergency5m │
// │  265 │ ACEUSDT      │ 2024 01 09 10:10:00 │ 2024 01 09 12:55:00 │ LONG         │ -0.51% │ 9.60%  │ 7.50       │ rsiDivergency5m │
// │  266 │ 1000BONKUSDT │ 2024 01 09 17:10:00 │ 2024 01 09 18:55:00 │ SHORT        │ -0.51% │ 10.59% │ 0.01       │ rsiDivergency5m │
// │  267 │ SSVUSDT      │ 2024 01 09 17:20:00 │ 2024 01 09 19:35:00 │ SHORT        │ -0.51% │ 10.51% │ 32.49      │ rsiDivergency5m │
// │  268 │ SSVUSDT      │ 2024 01 09 19:40:00 │ 2024 01 10 04:00:00 │ SHORT        │ 0.64%  │ 11.15% │ 33.10      │ rsiDivergency5m │
// │  269 │ ARBUSDT      │ 2024 01 10 05:25:00 │ 2024 01 10 13:45:00 │ SHORT        │ 0.44%  │ 11.59% │ 2.02       │ rsiDivergency5m │
// │  270 │ NFPUSDT      │ 2024 01 10 13:15:00 │ 2024 01 10 14:00:00 │ SHORT        │ -0.51% │ 7.91%  │ 0.52       │ rsiDivergency5m │
// │  271 │ POWRUSDT     │ 2024 01 10 17:45:00 │ 2024 01 11 02:05:00 │ SHORT        │ 0.70%  │ 18.27% │ 0.41       │ rsiDivergency5m │
// │  272 │ BEAMXUSDT    │ 2024 01 10 18:05:00 │ 2024 01 10 18:20:00 │ SHORT        │ -0.51% │ 13.79% │ 0.02       │ rsiDivergency5m │
// │  273 │ WAXPUSDT     │ 2024 01 10 18:15:00 │ 2024 01 11 02:35:00 │ SHORT        │ 0.46%  │ 10.73% │ 0.07       │ rsiDivergency5m │
// │  274 │ NTRNUSDT     │ 2024 01 11 00:45:00 │ 2024 01 11 01:35:00 │ LONG         │ -0.51% │ 12.72% │ 1.46       │ rsiDivergency5m │
// │  275 │ MINAUSDT     │ 2024 01 11 01:30:00 │ 2024 01 11 07:20:00 │ LONG         │ 2.49%  │ 14.95% │ 1.19       │ rsiDivergency5m │
// │  276 │ NTRNUSDT     │ 2024 01 11 01:40:00 │ 2024 01 11 05:20:00 │ LONG         │ 2.49%  │ 15.21% │ 1.43       │ rsiDivergency5m │
// │  277 │ ARPAUSDT     │ 2024 01 11 07:15:00 │ 2024 01 11 15:35:00 │ SHORT        │ 0.44%  │ 15.40% │ 0.07       │ rsiDivergency5m │
// │  278 │ FRONTUSDT    │ 2024 01 11 18:40:00 │ 2024 01 12 03:00:00 │ SHORT        │ 0.24%  │ 15.64% │ 0.50       │ rsiDivergency5m │
// │  279 │ USTCUSDT     │ 2024 01 11 20:20:00 │ 2024 01 11 20:25:00 │ SHORT        │ -0.51% │ 8.91%  │ 0.03       │ rsiDivergency5m │
// │  280 │ USTCUSDT     │ 2024 01 11 20:40:00 │ 2024 01 12 03:10:00 │ SHORT        │ 2.49%  │ 11.39% │ 0.03       │ rsiDivergency5m │
// │  281 │ ORDIUSDT     │ 2024 01 12 12:25:00 │ 2024 01 12 17:00:00 │ LONG         │ -0.51% │ 22.32% │ 68.18      │ rsiDivergency5m │
// │  282 │ UMAUSDT      │ 2024 01 12 12:25:00 │ 2024 01 12 17:05:00 │ LONG         │ -0.51% │ 14.10% │ 1.96       │ rsiDivergency5m │
// │  283 │ AXSUSDT      │ 2024 01 12 17:05:00 │ 2024 01 12 17:20:00 │ LONG         │ -0.51% │ 13.08% │ 7.88       │ rsiDivergency5m │
// │  284 │ BIGTIMEUSDT  │ 2024 01 12 20:15:00 │ 2024 01 13 04:35:00 │ LONG         │ 0.04%  │ 13.11% │ 0.42       │ rsiDivergency5m │
// │  285 │ TUSDT        │ 2024 01 13 20:00:00 │ 2024 01 14 02:40:00 │ SHORT        │ -0.51% │ 12.78% │ 0.04       │ rsiDivergency5m │
// │  286 │ ACEUSDT      │ 2024 01 14 03:55:00 │ 2024 01 14 08:35:00 │ SHORT        │ -0.51% │ 13.54% │ 9.81       │ rsiDivergency5m │
// │  287 │ BIGTIMEUSDT  │ 2024 01 15 04:55:00 │ 2024 01 15 06:45:00 │ SHORT        │ -0.51% │ 10.60% │ 0.45       │ rsiDivergency5m │
// │  288 │ BIGTIMEUSDT  │ 2024 01 15 06:50:00 │ 2024 01 15 08:30:00 │ SHORT        │ -0.51% │ 10.09% │ 0.46       │ rsiDivergency5m │
// │  289 │ SUPERUSDT    │ 2024 01 15 16:20:00 │ 2024 01 15 16:30:00 │ SHORT        │ -0.51% │ 9.53%  │ 0.63       │ rsiDivergency5m │
// │  290 │ ENSUSDT      │ 2024 01 16 03:30:00 │ 2024 01 16 09:40:00 │ LONG         │ -0.51% │ 10.69% │ 21.82      │ rsiDivergency5m │
// │  291 │ PENDLEUSDT   │ 2024 01 16 16:35:00 │ 2024 01 17 00:55:00 │ SHORT        │ 1.05%  │ 11.23% │ 2.13       │ rsiDivergency5m │
// │  292 │ BEAMXUSDT    │ 2024 01 17 18:15:00 │ 2024 01 18 02:35:00 │ LONG         │ 0.23%  │ 18.89% │ 0.02       │ rsiDivergency5m │
// │  293 │ ARPAUSDT     │ 2024 01 17 21:45:00 │ 2024 01 18 06:05:00 │ SHORT        │ 0.62%  │ 13.48% │ 0.08       │ rsiDivergency5m │
// │  294 │ BEAMXUSDT    │ 2024 01 19 01:05:00 │ 2024 01 19 01:50:00 │ SHORT        │ -0.51% │ 20.61% │ 0.02       │ rsiDivergency5m │
// │  295 │ BIGTIMEUSDT  │ 2024 01 19 02:05:00 │ 2024 01 19 10:25:00 │ SHORT        │ 1.41%  │ 16.76% │ 0.39       │ rsiDivergency5m │
// │  296 │ AIUSDT       │ 2024 01 19 11:25:00 │ 2024 01 19 11:35:00 │ LONG         │ -0.51% │ 6.26%  │ 1.04       │ rsiDivergency5m │
// │  297 │ MAVUSDT      │ 2024 01 19 11:30:00 │ 2024 01 19 11:40:00 │ LONG         │ -0.51% │ 16.25% │ 0.52       │ rsiDivergency5m │
// │  298 │ DARUSDT      │ 2024 01 19 12:10:00 │ 2024 01 19 20:30:00 │ LONG         │ 2.10%  │ 18.35% │ 0.11       │ rsiDivergency5m │
// │  299 │ DYDXUSDT     │ 2024 01 20 03:55:00 │ 2024 01 20 12:15:00 │ LONG         │ -0.35% │ 17.49% │ 2.82       │ rsiDivergency5m │
// │  300 │ DOGEUSDT     │ 2024 01 20 18:25:00 │ 2024 01 21 02:45:00 │ SHORT        │ 0.90%  │ 17.88% │ 0.09       │ rsiDivergency5m │
// │  301 │ AIUSDT       │ 2024 01 21 01:45:00 │ 2024 01 21 04:35:00 │ SHORT        │ -0.51% │ 6.56%  │ 1.18       │ rsiDivergency5m │
// │  302 │ PENDLEUSDT   │ 2024 01 21 05:05:00 │ 2024 01 21 06:00:00 │ SHORT        │ -0.51% │ 17.37% │ 2.29       │ rsiDivergency5m │
// │  303 │ FRONTUSDT    │ 2024 01 21 06:10:00 │ 2024 01 21 06:40:00 │ SHORT        │ -0.51% │ 16.85% │ 0.50       │ rsiDivergency5m │
// │  304 │ SUIUSDT      │ 2024 01 21 20:30:00 │ 2024 01 22 04:50:00 │ LONG         │ 0.10%  │ 16.95% │ 1.02       │ rsiDivergency5m │
// │  305 │ UMAUSDT      │ 2024 01 22 05:10:00 │ 2024 01 22 05:20:00 │ LONG         │ -0.51% │ 16.44% │ 5.01       │ rsiDivergency5m │
// │  306 │ MAVUSDT      │ 2024 01 22 08:10:00 │ 2024 01 22 08:20:00 │ SHORT        │ -0.51% │ 15.93% │ 0.55       │ rsiDivergency5m │
// │  307 │ AMBUSDT      │ 2024 01 22 18:45:00 │ 2024 01 22 19:35:00 │ LONG         │ -0.51% │ 15.41% │ 0.01       │ rsiDivergency5m │
// │  308 │ AMBUSDT      │ 2024 01 23 03:15:00 │ 2024 01 23 04:25:00 │ LONG         │ -0.51% │ 14.39% │ 0.01       │ rsiDivergency5m │
// │  309 │ TRUUSDT      │ 2024 01 23 04:30:00 │ 2024 01 23 09:05:00 │ LONG         │ -0.51% │ 13.88% │ 0.04       │ rsiDivergency5m │
// │  310 │ AMBUSDT      │ 2024 01 24 01:25:00 │ 2024 01 24 03:25:00 │ SHORT        │ -0.51% │ 12.52% │ 0.01       │ rsiDivergency5m │
// │  311 │ 1000BONKUSDT │ 2024 01 24 03:00:00 │ 2024 01 24 05:30:00 │ SHORT        │ -0.51% │ 21.12% │ 0.01       │ rsiDivergency5m │
// │  312 │ PENDLEUSDT   │ 2024 01 24 04:45:00 │ 2024 01 24 05:00:00 │ SHORT        │ -0.51% │ 12.01% │ 2.18       │ rsiDivergency5m │
// │  313 │ FXSUSDT      │ 2024 01 24 05:35:00 │ 2024 01 24 13:55:00 │ SHORT        │ 0.26%  │ 12.26% │ 10.06      │ rsiDivergency5m │
// │  314 │ MAVUSDT      │ 2024 01 24 14:45:00 │ 2024 01 24 16:40:00 │ LONG         │ -0.51% │ 11.75% │ 0.56       │ rsiDivergency5m │
// │  315 │ MAVUSDT      │ 2024 01 25 00:15:00 │ 2024 01 25 07:50:00 │ LONG         │ -0.51% │ 11.24% │ 0.53       │ rsiDivergency5m │
// │  316 │ SKLUSDT      │ 2024 01 25 08:45:00 │ 2024 01 25 11:45:00 │ LONG         │ -0.51% │ 10.73% │ 0.07       │ rsiDivergency5m │
// │  317 │ ONTUSDT      │ 2024 01 25 12:10:00 │ 2024 01 25 20:30:00 │ LONG         │ 0.16%  │ 10.88% │ 0.22       │ rsiDivergency5m │
// │  318 │ SUIUSDT      │ 2024 01 26 13:10:00 │ 2024 01 26 14:15:00 │ SHORT        │ -0.51% │ 9.97%  │ 1.41       │ rsiDivergency5m │
// │  319 │ 1000SATSUSDT │ 2024 01 26 20:35:00 │ 2024 01 27 04:55:00 │ SHORT        │ 0.81%  │ 9.42%  │ 0.00       │ rsiDivergency5m │
// │  320 │ SKLUSDT      │ 2024 01 27 02:55:00 │ 2024 01 27 11:15:00 │ LONG         │ -0.05% │ 9.41%  │ 0.08       │ rsiDivergency5m │
// │  321 │ AIUSDT       │ 2024 01 27 10:10:00 │ 2024 01 27 10:25:00 │ SHORT        │ -0.51% │ 12.31% │ 1.23       │ rsiDivergency5m │
// │  322 │ BIGTIMEUSDT  │ 2024 01 27 14:05:00 │ 2024 01 27 22:25:00 │ SHORT        │ 0.62%  │ 10.03% │ 0.39       │ rsiDivergency5m │
// │  323 │ HIGHUSDT     │ 2024 01 29 21:35:00 │ 2024 01 30 05:55:00 │ SHORT        │ 0.82%  │ 10.94% │ 1.59       │ rsiDivergency5m │
// │  324 │ MAVUSDT      │ 2024 01 30 10:00:00 │ 2024 01 30 10:15:00 │ SHORT        │ -0.51% │ 10.42% │ 0.65       │ rsiDivergency5m │
// │  325 │ MAVUSDT      │ 2024 01 30 11:35:00 │ 2024 01 30 12:05:00 │ SHORT        │ -0.51% │ 9.91%  │ 0.69       │ rsiDivergency5m │
// │  326 │ OGNUSDT      │ 2024 01 30 17:10:00 │ 2024 01 30 18:35:00 │ LONG         │ -0.51% │ 8.89%  │ 0.17       │ rsiDivergency5m │
// │  327 │ OGNUSDT      │ 2024 01 31 03:50:00 │ 2024 01 31 05:40:00 │ LONG         │ -0.51% │ 8.37%  │ 0.16       │ rsiDivergency5m │
// │  328 │ AIUSDT       │ 2024 01 31 20:25:00 │ 2024 01 31 23:10:00 │ LONG         │ -0.51% │ 10.62% │ 1.17       │ rsiDivergency5m │
// │  329 │ WLDUSDT      │ 2024 01 31 20:25:00 │ 2024 02 01 04:45:00 │ LONG         │ 0.26%  │ 9.53%  │ 2.25       │ rsiDivergency5m │
// │  330 │ MAVUSDT      │ 2024 02 01 17:40:00 │ 2024 02 02 00:10:00 │ LONG         │ -0.51% │ 7.48%  │ 0.67       │ rsiDivergency5m │
// │  331 │ CKBUSDT      │ 2024 02 02 00:50:00 │ 2024 02 02 02:00:00 │ LONG         │ -0.51% │ 6.97%  │ 0.00       │ rsiDivergency5m │
// │  332 │ CKBUSDT      │ 2024 02 02 02:30:00 │ 2024 02 02 09:15:00 │ LONG         │ -0.51% │ 6.46%  │ 0.00       │ rsiDivergency5m │
// │  333 │ ROSEUSDT     │ 2024 02 02 11:00:00 │ 2024 02 02 11:50:00 │ SHORT        │ -0.51% │ 5.94%  │ 0.11       │ rsiDivergency5m │
// │  334 │ NMRUSDT      │ 2024 02 03 05:55:00 │ 2024 02 03 14:15:00 │ SHORT        │ 0.17%  │ 5.87%  │ 24.61      │ rsiDivergency5m │
// │  335 │ 1000LUNCUSDT │ 2024 02 03 14:20:00 │ 2024 02 03 15:00:00 │ SHORT        │ -0.51% │ 5.36%  │ 0.10       │ rsiDivergency5m │
// │  336 │ 1000LUNCUSDT │ 2024 02 03 15:10:00 │ 2024 02 03 15:15:00 │ SHORT        │ -0.51% │ 4.85%  │ 0.11       │ rsiDivergency5m │
// │  337 │ 1000LUNCUSDT │ 2024 02 03 15:20:00 │ 2024 02 03 16:00:00 │ SHORT        │ -0.51% │ 4.34%  │ 0.11       │ rsiDivergency5m │
// │  338 │ ACEUSDT      │ 2024 02 03 23:10:00 │ 2024 02 04 07:30:00 │ LONG         │ 0.35%  │ 7.87%  │ 8.35       │ rsiDivergency5m │
// │  339 │ CRVUSDT      │ 2024 02 04 00:50:00 │ 2024 02 04 09:10:00 │ LONG         │ 0.15%  │ 4.97%  │ 0.45       │ rsiDivergency5m │
// │  340 │ 1000LUNCUSDT │ 2024 02 04 10:55:00 │ 2024 02 04 11:05:00 │ SHORT        │ -0.51% │ 4.46%  │ 0.11       │ rsiDivergency5m │
// │  341 │ ROSEUSDT     │ 2024 02 04 17:55:00 │ 2024 02 05 02:15:00 │ LONG         │ 0.00%  │ 3.95%  │ 0.11       │ rsiDivergency5m │
// │  342 │ MANTAUSDT    │ 2024 02 05 05:20:00 │ 2024 02 05 13:40:00 │ SHORT        │ 0.79%  │ 13.10% │ 2.81       │ rsiDivergency5m │
// │  343 │ ENSUSDT      │ 2024 02 05 13:20:00 │ 2024 02 05 21:40:00 │ SHORT        │ -0.12% │ 3.89%  │ 20.28      │ rsiDivergency5m │
// │  344 │ ZETAUSDT     │ 2024 02 05 16:50:00 │ 2024 02 06 00:00:00 │ LONG         │ -0.51% │ -3.31% │ 1.29       │ rsiDivergency5m │
// │  345 │ NMRUSDT      │ 2024 02 06 01:05:00 │ 2024 02 06 01:50:00 │ LONG         │ -0.51% │ 3.38%  │ 26.97      │ rsiDivergency5m │
// │  346 │ NMRUSDT      │ 2024 02 06 02:50:00 │ 2024 02 06 10:45:00 │ LONG         │ -0.51% │ 2.86%  │ 25.79      │ rsiDivergency5m │
// │  347 │ LSKUSDT      │ 2024 02 06 03:10:00 │ 2024 02 06 03:20:00 │ LONG         │ -0.51% │ 5.02%  │ 1.47       │ rsiDivergency5m │
// │  348 │ LSKUSDT      │ 2024 02 06 03:30:00 │ 2024 02 06 07:40:00 │ LONG         │ -0.51% │ 4.51%  │ 1.45       │ rsiDivergency5m │
// │  349 │ COTIUSDT     │ 2024 02 06 13:15:00 │ 2024 02 06 13:45:00 │ SHORT        │ -0.51% │ 1.84%  │ 0.07       │ rsiDivergency5m │
// │  350 │ FXSUSDT      │ 2024 02 06 15:50:00 │ 2024 02 06 19:15:00 │ LONG         │ -0.51% │ 1.33%  │ 9.24       │ rsiDivergency5m │
// │  351 │ STXUSDT      │ 2024 02 07 17:30:00 │ 2024 02 08 01:50:00 │ SHORT        │ 0.27%  │ 4.88%  │ 1.67       │ rsiDivergency5m │
// │  352 │ CKBUSDT      │ 2024 02 08 13:25:00 │ 2024 02 08 14:00:00 │ SHORT        │ -0.51% │ 3.86%  │ 0.01       │ rsiDivergency5m │
// │  353 │ MAVUSDT      │ 2024 02 08 15:05:00 │ 2024 02 08 23:25:00 │ LONG         │ 2.11%  │ 5.96%  │ 0.63       │ rsiDivergency5m │
// │  354 │ RIFUSDT      │ 2024 02 08 22:00:00 │ 2024 02 09 06:20:00 │ SHORT        │ 0.48%  │ 4.82%  │ 0.15       │ rsiDivergency5m │
// │  355 │ SUIUSDT      │ 2024 02 09 11:20:00 │ 2024 02 09 13:25:00 │ SHORT        │ -0.51% │ 5.44%  │ 1.70       │ rsiDivergency5m │
// │  356 │ SUIUSDT      │ 2024 02 09 13:45:00 │ 2024 02 09 15:00:00 │ SHORT        │ -0.51% │ 4.92%  │ 1.76       │ rsiDivergency5m │
// │  357 │ SPELLUSDT    │ 2024 02 10 17:25:00 │ 2024 02 10 19:20:00 │ SHORT        │ -0.51% │ 4.30%  │ 0.00       │ rsiDivergency5m │
// │  358 │ HIFIUSDT     │ 2024 02 11 08:40:00 │ 2024 02 11 09:00:00 │ SHORT        │ -0.51% │ 3.87%  │ 0.64       │ rsiDivergency5m │
// │  359 │ BEAMXUSDT    │ 2024 02 11 09:05:00 │ 2024 02 11 17:25:00 │ LONG         │ 0.29%  │ 11.02% │ 0.02       │ rsiDivergency5m │
// │  360 │ COTIUSDT     │ 2024 02 11 21:40:00 │ 2024 02 12 01:00:00 │ LONG         │ -0.51% │ 1.82%  │ 0.08       │ rsiDivergency5m │
// │  361 │ 1000BONKUSDT │ 2024 02 11 21:50:00 │ 2024 02 12 04:50:00 │ LONG         │ -0.51% │ 8.35%  │ 0.01       │ rsiDivergency5m │
// │  362 │ UMAUSDT      │ 2024 02 12 06:30:00 │ 2024 02 12 07:30:00 │ SHORT        │ -0.51% │ 0.79%  │ 4.69       │ rsiDivergency5m │
// │  363 │ COTIUSDT     │ 2024 02 12 07:50:00 │ 2024 02 12 09:20:00 │ SHORT        │ -0.51% │ 0.28%  │ 0.09       │ rsiDivergency5m │
// │  364 │ IMXUSDT      │ 2024 02 12 11:30:00 │ 2024 02 12 13:05:00 │ SHORT        │ -0.51% │ -0.23% │ 3.05       │ rsiDivergency5m │
// │  365 │ NTRNUSDT     │ 2024 02 12 19:50:00 │ 2024 02 12 20:25:00 │ SHORT        │ -0.51% │ 12.27% │ 1.28       │ rsiDivergency5m │
// │  366 │ NTRNUSDT     │ 2024 02 12 22:25:00 │ 2024 02 13 06:45:00 │ SHORT        │ 0.39%  │ 12.65% │ 1.34       │ rsiDivergency5m │
// │  367 │ ARUSDT       │ 2024 02 13 00:35:00 │ 2024 02 13 08:55:00 │ SHORT        │ 0.14%  │ -0.10% │ 9.51       │ rsiDivergency5m │
// │  368 │ CKBUSDT      │ 2024 02 14 01:50:00 │ 2024 02 14 05:15:00 │ LONG         │ 2.49%  │ 4.14%  │ 0.01       │ rsiDivergency5m │
// │  369 │ TRUUSDT      │ 2024 02 14 06:40:00 │ 2024 02 14 15:00:00 │ SHORT        │ 0.73%  │ 4.87%  │ 0.06       │ rsiDivergency5m │
// │  370 │ MANTAUSDT    │ 2024 02 14 15:10:00 │ 2024 02 14 17:40:00 │ SHORT        │ -0.51% │ 13.03% │ 3.07       │ rsiDivergency5m │
// │  371 │ KLAYUSDT     │ 2024 02 14 16:20:00 │ 2024 02 14 19:30:00 │ SHORT        │ -0.51% │ 4.36%  │ 0.24       │ rsiDivergency5m │
// │  372 │ BIGTIMEUSDT  │ 2024 02 14 20:45:00 │ 2024 02 15 05:05:00 │ SHORT        │ 1.35%  │ 5.71%  │ 0.46       │ rsiDivergency5m │
// │  373 │ VETUSDT      │ 2024 02 15 06:25:00 │ 2024 02 15 06:30:00 │ SHORT        │ -0.51% │ 4.68%  │ 0.04       │ rsiDivergency5m │
// │  374 │ VETUSDT      │ 2024 02 15 06:45:00 │ 2024 02 15 06:55:00 │ SHORT        │ -0.51% │ 4.17%  │ 0.04       │ rsiDivergency5m │
// │  375 │ NEOUSDT      │ 2024 02 15 07:05:00 │ 2024 02 15 15:25:00 │ SHORT        │ 0.89%  │ 5.06%  │ 13.46      │ rsiDivergency5m │
// │  376 │ USTCUSDT     │ 2024 02 15 07:20:00 │ 2024 02 15 07:55:00 │ SHORT        │ -0.51% │ 9.38%  │ 0.03       │ rsiDivergency5m │
// │  377 │ ARPAUSDT     │ 2024 02 15 16:40:00 │ 2024 02 16 01:00:00 │ LONG         │ 0.56%  │ 5.62%  │ 0.06       │ rsiDivergency5m │
// │  378 │ NFPUSDT      │ 2024 02 16 01:20:00 │ 2024 02 16 05:25:00 │ SHORT        │ -0.51% │ 8.50%  │ 0.67       │ rsiDivergency5m │
// │  379 │ LPTUSDT      │ 2024 02 16 02:00:00 │ 2024 02 16 02:10:00 │ SHORT        │ -0.51% │ 4.08%  │ 10.20      │ rsiDivergency5m │
// │  380 │ NTRNUSDT     │ 2024 02 16 02:15:00 │ 2024 02 16 10:35:00 │ LONG         │ 1.82%  │ 12.86% │ 1.81       │ rsiDivergency5m │
// │  381 │ XVGUSDT      │ 2024 02 16 02:25:00 │ 2024 02 16 02:30:00 │ SHORT        │ -0.51% │ 5.10%  │ 0.00       │ rsiDivergency5m │
// │  382 │ XVGUSDT      │ 2024 02 16 02:35:00 │ 2024 02 16 02:40:00 │ SHORT        │ -0.51% │ 4.59%  │ 0.00       │ rsiDivergency5m │
// │  383 │ TOKENUSDT    │ 2024 02 16 06:00:00 │ 2024 02 16 06:05:00 │ SHORT        │ -0.51% │ 9.52%  │ 0.03       │ rsiDivergency5m │
// │  384 │ NFPUSDT      │ 2024 02 16 08:30:00 │ 2024 02 16 16:50:00 │ SHORT        │ 1.45%  │ 9.95%  │ 0.75       │ rsiDivergency5m │
// │  385 │ LEVERUSDT    │ 2024 02 16 09:55:00 │ 2024 02 16 10:10:00 │ LONG         │ -0.51% │ 3.57%  │ 0.00       │ rsiDivergency5m │
// │  386 │ LEVERUSDT    │ 2024 02 16 12:10:00 │ 2024 02 16 20:30:00 │ LONG         │ 0.30%  │ 3.87%  │ 0.00       │ rsiDivergency5m │
// │  387 │ 1000SATSUSDT │ 2024 02 17 09:35:00 │ 2024 02 17 17:55:00 │ LONG         │ 0.92%  │ 22.88% │ 0.00       │ rsiDivergency5m │
// │  388 │ MAVUSDT      │ 2024 02 17 09:35:00 │ 2024 02 17 17:55:00 │ LONG         │ 0.94%  │ 4.92%  │ 0.60       │ rsiDivergency5m │
// │  389 │ STXUSDT      │ 2024 02 19 03:05:00 │ 2024 02 19 04:20:00 │ SHORT        │ -0.51% │ 6.68%  │ 2.83       │ rsiDivergency5m │
// │  390 │ WLDUSDT      │ 2024 02 19 18:15:00 │ 2024 02 19 22:40:00 │ SHORT        │ 2.49%  │ 9.19%  │ 7.88       │ rsiDivergency5m │
// │  391 │ LPTUSDT      │ 2024 02 19 22:05:00 │ 2024 02 19 22:40:00 │ LONG         │ -0.51% │ 8.67%  │ 15.96      │ rsiDivergency5m │
// │  392 │ FETUSDT      │ 2024 02 19 23:25:00 │ 2024 02 20 07:45:00 │ LONG         │ 0.10%  │ 8.77%  │ 0.94       │ rsiDivergency5m │
// │  393 │ REEFUSDT     │ 2024 02 20 16:30:00 │ 2024 02 20 17:10:00 │ SHORT        │ -0.51% │ 8.52%  │ 0.00       │ rsiDivergency5m │
// │  394 │ FETUSDT      │ 2024 02 20 16:50:00 │ 2024 02 20 17:00:00 │ SHORT        │ -0.51% │ 9.03%  │ 1.01       │ rsiDivergency5m │
// │  395 │ LEVERUSDT    │ 2024 02 20 18:15:00 │ 2024 02 21 02:35:00 │ SHORT        │ 0.65%  │ 9.17%  │ 0.00       │ rsiDivergency5m │
// │  396 │ IOTAUSDT     │ 2024 02 21 01:40:00 │ 2024 02 21 04:25:00 │ LONG         │ -0.51% │ 8.66%  │ 0.28       │ rsiDivergency5m │
// │  397 │ ANKRUSDT     │ 2024 02 21 05:10:00 │ 2024 02 21 12:40:00 │ LONG         │ -0.51% │ 8.15%  │ 0.03       │ rsiDivergency5m │
// │  398 │ SUPERUSDT    │ 2024 02 21 09:20:00 │ 2024 02 21 17:40:00 │ LONG         │ 0.88%  │ 12.47% │ 1.02       │ rsiDivergency5m │
// │  399 │ RSRUSDT      │ 2024 02 22 01:05:00 │ 2024 02 22 03:00:00 │ SHORT        │ -0.51% │ 8.59%  │ 0.00       │ rsiDivergency5m │
// │  400 │ DENTUSDT     │ 2024 02 22 03:20:00 │ 2024 02 22 04:00:00 │ SHORT        │ -0.51% │ 8.07%  │ 0.00       │ rsiDivergency5m │
// │  401 │ MANTAUSDT    │ 2024 02 22 04:45:00 │ 2024 02 22 05:30:00 │ SHORT        │ -0.51% │ 13.62% │ 3.38       │ rsiDivergency5m │
// │  402 │ HFTUSDT      │ 2024 02 22 04:55:00 │ 2024 02 22 13:15:00 │ SHORT        │ 0.03%  │ 8.11%  │ 0.38       │ rsiDivergency5m │
// │  403 │ CKBUSDT      │ 2024 02 22 22:25:00 │ 2024 02 23 06:45:00 │ LONG         │ 0.18%  │ 8.29%  │ 0.01       │ rsiDivergency5m │
// │  404 │ ZETAUSDT     │ 2024 02 23 09:10:00 │ 2024 02 23 09:50:00 │ LONG         │ -0.51% │ 11.98% │ 2.29       │ rsiDivergency5m │
// │  405 │ ZETAUSDT     │ 2024 02 23 10:05:00 │ 2024 02 23 10:30:00 │ LONG         │ -0.51% │ 11.47% │ 2.25       │ rsiDivergency5m │
// │  406 │ ZETAUSDT     │ 2024 02 23 10:35:00 │ 2024 02 23 11:00:00 │ LONG         │ -0.51% │ 10.95% │ 2.22       │ rsiDivergency5m │
// │  407 │ NMRUSDT      │ 2024 02 23 20:30:00 │ 2024 02 23 21:00:00 │ LONG         │ -0.51% │ 8.22%  │ 30.88      │ rsiDivergency5m │
// │  408 │ LRCUSDT      │ 2024 02 24 00:15:00 │ 2024 02 24 08:35:00 │ SHORT        │ 0.37%  │ 8.08%  │ 0.28       │ rsiDivergency5m │
// │  409 │ CKBUSDT      │ 2024 02 24 09:35:00 │ 2024 02 24 10:25:00 │ SHORT        │ -0.51% │ 7.57%  │ 0.01       │ rsiDivergency5m │
// │  410 │ RENUSDT      │ 2024 02 24 13:45:00 │ 2024 02 24 14:45:00 │ SHORT        │ -0.51% │ 6.54%  │ 0.08       │ rsiDivergency5m │
// │  411 │ ALPHAUSDT    │ 2024 02 25 02:50:00 │ 2024 02 25 11:10:00 │ SHORT        │ 0.45%  │ 7.93%  │ 0.14       │ rsiDivergency5m │
// │  412 │ SSVUSDT      │ 2024 02 25 22:40:00 │ 2024 02 26 07:00:00 │ SHORT        │ 0.84%  │ 9.60%  │ 35.35      │ rsiDivergency5m │
// │  413 │ NFPUSDT      │ 2024 02 26 04:55:00 │ 2024 02 26 13:15:00 │ LONG         │ 0.47%  │ 19.17% │ 0.73       │ rsiDivergency5m │
// │  414 │ GALAUSDT     │ 2024 02 26 07:20:00 │ 2024 02 26 15:40:00 │ LONG         │ 0.84%  │ 10.44% │ 0.03       │ rsiDivergency5m │
// │  415 │ NTRNUSDT     │ 2024 02 26 19:20:00 │ 2024 02 26 21:15:00 │ SHORT        │ -0.51% │ 9.00%  │ 1.83       │ rsiDivergency5m │
// │  416 │ RIFUSDT      │ 2024 02 26 19:30:00 │ 2024 02 26 19:40:00 │ SHORT        │ -0.51% │ 7.64%  │ 0.23       │ rsiDivergency5m │
// │  417 │ RIFUSDT      │ 2024 02 26 19:45:00 │ 2024 02 26 20:50:00 │ SHORT        │ -0.51% │ 7.12%  │ 0.24       │ rsiDivergency5m │
// │  418 │ ONEUSDT      │ 2024 02 27 01:25:00 │ 2024 02 27 09:45:00 │ SHORT        │ 1.76%  │ 11.18% │ 0.02       │ rsiDivergency5m │
// │  419 │ ENJUSDT      │ 2024 02 27 12:35:00 │ 2024 02 27 13:05:00 │ SHORT        │ -0.51% │ 10.67% │ 0.41       │ rsiDivergency5m │
// │  420 │ GALAUSDT     │ 2024 02 27 13:40:00 │ 2024 02 27 14:40:00 │ SHORT        │ -0.51% │ 10.16% │ 0.04       │ rsiDivergency5m │
// │  421 │ GALAUSDT     │ 2024 02 27 14:55:00 │ 2024 02 27 17:50:00 │ SHORT        │ -0.51% │ 9.64%  │ 0.04       │ rsiDivergency5m │
// │  422 │ GALAUSDT     │ 2024 02 27 17:55:00 │ 2024 02 28 01:10:00 │ SHORT        │ 2.49%  │ 12.13% │ 0.04       │ rsiDivergency5m │
// │  423 │ PENDLEUSDT   │ 2024 02 28 04:55:00 │ 2024 02 28 13:15:00 │ SHORT        │ 1.92%  │ 14.05% │ 3.13       │ rsiDivergency5m │
// │  424 │ HIFIUSDT     │ 2024 02 28 13:25:00 │ 2024 02 28 21:45:00 │ LONG         │ 0.99%  │ 15.05% │ 0.63       │ rsiDivergency5m │
// │  425 │ C98USDT      │ 2024 02 28 21:00:00 │ 2024 02 29 03:55:00 │ SHORT        │ -0.51% │ 14.53% │ 0.39       │ rsiDivergency5m │
// │  426 │ SUIUSDT      │ 2024 02 29 04:40:00 │ 2024 02 29 13:00:00 │ SHORT        │ 0.58%  │ 15.12% │ 1.69       │ rsiDivergency5m │
// │  427 │ TOKENUSDT    │ 2024 02 29 07:40:00 │ 2024 02 29 11:25:00 │ LONG         │ -0.51% │ 5.32%  │ 0.04       │ rsiDivergency5m │
// │  428 │ RIFUSDT      │ 2024 02 29 16:25:00 │ 2024 02 29 17:35:00 │ LONG         │ -0.51% │ 7.05%  │ 0.21       │ rsiDivergency5m │
// │  429 │ USTCUSDT     │ 2024 02 29 17:10:00 │ 2024 02 29 17:25:00 │ LONG         │ -0.51% │ 15.36% │ 0.04       │ rsiDivergency5m │
// │  430 │ BIGTIMEUSDT  │ 2024 02 29 17:30:00 │ 2024 02 29 17:35:00 │ LONG         │ -0.51% │ 14.60% │ 0.40       │ rsiDivergency5m │
// │  431 │ DODOXUSDT    │ 2024 02 29 17:30:00 │ 2024 03 01 01:50:00 │ LONG         │ 0.80%  │ 15.40% │ 0.21       │ rsiDivergency5m │
// │  432 │ SANDUSDT     │ 2024 03 01 01:10:00 │ 2024 03 01 09:20:00 │ SHORT        │ -0.51% │ 14.89% │ 0.63       │ rsiDivergency5m │
// │  433 │ PENDLEUSDT   │ 2024 03 01 14:20:00 │ 2024 03 01 22:40:00 │ SHORT        │ 1.61%  │ 16.50% │ 3.65       │ rsiDivergency5m │
// │  434 │ EOSUSDT      │ 2024 03 01 21:20:00 │ 2024 03 01 22:05:00 │ SHORT        │ -0.51% │ 15.98% │ 0.98       │ rsiDivergency5m │
// │  435 │ EOSUSDT      │ 2024 03 01 22:10:00 │ 2024 03 01 23:05:00 │ SHORT        │ -0.51% │ 15.47% │ 1.00       │ rsiDivergency5m │
// │  436 │ MAVUSDT      │ 2024 03 02 02:15:00 │ 2024 03 02 03:10:00 │ SHORT        │ -0.51% │ 14.96% │ 0.74       │ rsiDivergency5m │
// │  437 │ MAVUSDT      │ 2024 03 02 03:15:00 │ 2024 03 02 11:35:00 │ SHORT        │ 0.83%  │ 15.79% │ 0.76       │ rsiDivergency5m │
// │  438 │ PIXELUSDT    │ 2024 03 02 07:30:00 │ 2024 03 02 15:50:00 │ SHORT        │ 0.55%  │ 7.07%  │ 0.55       │ rsiDivergency5m │
// │  439 │ FILUSDT      │ 2024 03 02 15:50:00 │ 2024 03 03 00:10:00 │ SHORT        │ 0.39%  │ 16.18% │ 9.35       │ rsiDivergency5m │
// │  440 │ BIGTIMEUSDT  │ 2024 03 03 01:50:00 │ 2024 03 03 02:05:00 │ LONG         │ -0.51% │ 15.66% │ 0.51       │ rsiDivergency5m │
// │  441 │ ZETAUSDT     │ 2024 03 03 03:10:00 │ 2024 03 03 11:30:00 │ LONG         │ 1.31%  │ 13.26% │ 2.18       │ rsiDivergency5m │
// │  442 │ CFXUSDT      │ 2024 03 03 03:15:00 │ 2024 03 03 11:35:00 │ LONG         │ 1.89%  │ 17.56% │ 0.26       │ rsiDivergency5m │
// │  443 │ POLYXUSDT    │ 2024 03 03 14:30:00 │ 2024 03 03 14:55:00 │ SHORT        │ -0.51% │ 7.71%  │ 0.23       │ rsiDivergency5m │
// │  444 │ ALGOUSDT     │ 2024 03 03 19:35:00 │ 2024 03 04 03:55:00 │ SHORT        │ 0.28%  │ 18.58% │ 0.26       │ rsiDivergency5m │
// │  445 │ CRVUSDT      │ 2024 03 04 06:15:00 │ 2024 03 04 08:35:00 │ SHORT        │ -0.51% │ 18.07% │ 0.74       │ rsiDivergency5m │
// │  446 │ ALTUSDT      │ 2024 03 04 11:20:00 │ 2024 03 04 11:55:00 │ LONG         │ -0.51% │ 15.71% │ 0.49       │ rsiDivergency5m │
// │  447 │ 1000SATSUSDT │ 2024 03 04 11:40:00 │ 2024 03 04 20:00:00 │ SHORT        │ 0.31%  │ 12.01% │ 0.00       │ rsiDivergency5m │
// │  448 │ BIGTIMEUSDT  │ 2024 03 04 12:50:00 │ 2024 03 04 21:10:00 │ LONG         │ 0.58%  │ 18.64% │ 0.46       │ rsiDivergency5m │
// │  449 │ PENDLEUSDT   │ 2024 03 04 22:10:00 │ 2024 03 05 06:30:00 │ LONG         │ 0.73%  │ 18.86% │ 2.94       │ rsiDivergency5m │
// │  450 │ MANTAUSDT    │ 2024 03 05 09:35:00 │ 2024 03 05 10:25:00 │ LONG         │ -0.51% │ 10.08% │ 2.94       │ rsiDivergency5m │
// │  451 │ ZETAUSDT     │ 2024 03 05 09:50:00 │ 2024 03 05 11:05:00 │ LONG         │ -0.51% │ 14.90% │ 2.14       │ rsiDivergency5m │
// │  452 │ C98USDT      │ 2024 03 05 11:15:00 │ 2024 03 05 12:05:00 │ LONG         │ -0.51% │ 17.83% │ 0.37       │ rsiDivergency5m │
// │  453 │ LOOMUSDT     │ 2024 03 05 11:15:00 │ 2024 03 05 12:10:00 │ LONG         │ -0.51% │ 18.35% │ 0.11       │ rsiDivergency5m │
// │  454 │ REEFUSDT     │ 2024 03 05 12:15:00 │ 2024 03 05 12:35:00 │ LONG         │ -0.51% │ 17.32% │ 0.00       │ rsiDivergency5m │
// │  455 │ XVGUSDT      │ 2024 03 05 14:10:00 │ 2024 03 05 14:35:00 │ LONG         │ -0.51% │ 16.81% │ 0.01       │ rsiDivergency5m │
// │  456 │ FXSUSDT      │ 2024 03 05 14:40:00 │ 2024 03 05 14:50:00 │ LONG         │ -0.51% │ 16.30% │ 8.18       │ rsiDivergency5m │
// │  457 │ XVSUSDT      │ 2024 03 05 15:20:00 │ 2024 03 05 15:35:00 │ LONG         │ -0.51% │ 15.78% │ 11.34      │ rsiDivergency5m │
// │  458 │ MASKUSDT     │ 2024 03 05 15:40:00 │ 2024 03 06 00:00:00 │ LONG         │ 1.67%  │ 17.45% │ 4.21       │ rsiDivergency5m │
// │  459 │ NMRUSDT      │ 2024 03 06 01:00:00 │ 2024 03 06 03:10:00 │ SHORT        │ -0.51% │ 16.94% │ 33.99      │ rsiDivergency5m │
// │  460 │ ONDOUSDT     │ 2024 03 06 02:00:00 │ 2024 03 06 02:20:00 │ SHORT        │ -0.51% │ 7.89%  │ 0.53       │ rsiDivergency5m │
// │  461 │ ROSEUSDT     │ 2024 03 06 02:40:00 │ 2024 03 06 11:00:00 │ SHORT        │ 0.99%  │ 17.92% │ 0.16       │ rsiDivergency5m │
// │  462 │ ALTUSDT      │ 2024 03 06 02:55:00 │ 2024 03 06 11:15:00 │ SHORT        │ 0.96%  │ 12.66% │ 0.50       │ rsiDivergency5m │
// │  463 │ CAKEUSDT     │ 2024 03 06 03:25:00 │ 2024 03 06 05:45:00 │ SHORT        │ -0.51% │ 4.41%  │ 3.19       │ rsiDivergency5m │
// │  464 │ CAKEUSDT     │ 2024 03 06 05:50:00 │ 2024 03 06 14:10:00 │ SHORT        │ 0.19%  │ 4.60%  │ 3.26       │ rsiDivergency5m │
// │  465 │ RNDRUSDT     │ 2024 03 06 11:25:00 │ 2024 03 06 11:50:00 │ SHORT        │ -0.51% │ 17.41% │ 8.46       │ rsiDivergency5m │
// │  466 │ C98USDT      │ 2024 03 06 12:25:00 │ 2024 03 06 16:30:00 │ SHORT        │ -0.51% │ 16.90% │ 0.39       │ rsiDivergency5m │
// │  467 │ C98USDT      │ 2024 03 06 16:45:00 │ 2024 03 06 19:30:00 │ SHORT        │ -0.51% │ 16.39% │ 0.40       │ rsiDivergency5m │
// │  468 │ C98USDT      │ 2024 03 06 19:40:00 │ 2024 03 06 20:50:00 │ SHORT        │ -0.51% │ 15.87% │ 0.41       │ rsiDivergency5m │
// │  469 │ C98USDT      │ 2024 03 06 20:55:00 │ 2024 03 07 05:15:00 │ SHORT        │ 0.48%  │ 16.35% │ 0.41       │ rsiDivergency5m │
// │  470 │ ALTUSDT      │ 2024 03 07 05:15:00 │ 2024 03 07 08:35:00 │ SHORT        │ -0.51% │ 10.16% │ 0.55       │ rsiDivergency5m │
// │  471 │ ALTUSDT      │ 2024 03 07 08:55:00 │ 2024 03 07 17:15:00 │ SHORT        │ 0.98%  │ 11.14% │ 0.57       │ rsiDivergency5m │
// │  472 │ INJUSDT      │ 2024 03 07 08:55:00 │ 2024 03 07 17:15:00 │ SHORT        │ -0.21% │ 16.14% │ 44.17      │ rsiDivergency5m │
// │  473 │ SUPERUSDT    │ 2024 03 07 20:15:00 │ 2024 03 08 04:35:00 │ SHORT        │ 0.11%  │ 10.48% │ 1.55       │ rsiDivergency5m │
// │  474 │ TOKENUSDT    │ 2024 03 08 08:35:00 │ 2024 03 08 08:45:00 │ SHORT        │ -0.51% │ 4.09%  │ 0.09       │ rsiDivergency5m │
// │  475 │ 1000SHIBUSDT │ 2024 03 08 09:05:00 │ 2024 03 08 10:30:00 │ SHORT        │ 2.49%  │ 17.60% │ 0.04       │ rsiDivergency5m │
// │  476 │ ALTUSDT      │ 2024 03 08 10:35:00 │ 2024 03 08 18:55:00 │ LONG         │ 0.58%  │ 10.96% │ 0.51       │ rsiDivergency5m │
// │  477 │ MYROUSDT     │ 2024 03 08 17:55:00 │ 2024 03 08 18:05:00 │ SHORT        │ -0.51% │ -3.44% │ 0.40       │ rsiDivergency5m │
// │  478 │ ZETAUSDT     │ 2024 03 09 01:35:00 │ 2024 03 09 09:55:00 │ SHORT        │ 1.20%  │ 14.31% │ 2.49       │ rsiDivergency5m │
// │  479 │ LSKUSDT      │ 2024 03 09 02:40:00 │ 2024 03 09 03:40:00 │ SHORT        │ -0.51% │ 8.40%  │ 2.21       │ rsiDivergency5m │
// │  480 │ NFPUSDT      │ 2024 03 09 04:15:00 │ 2024 03 09 07:00:00 │ SHORT        │ 2.49%  │ 21.26% │ 1.10       │ rsiDivergency5m │
// │  481 │ MASKUSDT     │ 2024 03 09 04:40:00 │ 2024 03 09 13:00:00 │ SHORT        │ 0.92%  │ 19.82% │ 5.19       │ rsiDivergency5m │
// │  482 │ NMRUSDT      │ 2024 03 09 16:05:00 │ 2024 03 09 16:20:00 │ SHORT        │ -0.51% │ 19.31% │ 47.89      │ rsiDivergency5m │
// │  483 │ NMRUSDT      │ 2024 03 09 17:10:00 │ 2024 03 09 18:05:00 │ SHORT        │ -0.51% │ 18.80% │ 50.73      │ rsiDivergency5m │
// │  484 │ IDUSDT       │ 2024 03 10 00:05:00 │ 2024 03 10 00:45:00 │ SHORT        │ -0.51% │ 17.77% │ 0.90       │ rsiDivergency5m │
// │  485 │ AIUSDT       │ 2024 03 10 04:55:00 │ 2024 03 10 07:35:00 │ LONG         │ -0.51% │ 18.38% │ 2.07       │ rsiDivergency5m │
// │  486 │ LPTUSDT      │ 2024 03 10 08:55:00 │ 2024 03 10 10:50:00 │ LONG         │ -0.51% │ 18.49% │ 21.56      │ rsiDivergency5m │
// │  487 │ 1000SHIBUSDT │ 2024 03 10 19:45:00 │ 2024 03 10 19:50:00 │ LONG         │ -0.51% │ 18.66% │ 0.03       │ rsiDivergency5m │
// │  488 │ LQTYUSDT     │ 2024 03 10 20:40:00 │ 2024 03 11 05:00:00 │ LONG         │ 1.81%  │ 20.47% │ 1.67       │ rsiDivergency5m │
// │  489 │ PIXELUSDT    │ 2024 03 10 20:50:00 │ 2024 03 11 05:10:00 │ SHORT        │ 1.52%  │ 11.40% │ 1.02       │ rsiDivergency5m │
// │  490 │ STGUSDT      │ 2024 03 11 05:00:00 │ 2024 03 11 13:20:00 │ SHORT        │ 0.30%  │ 20.77% │ 0.82       │ rsiDivergency5m │
// │  491 │ STRKUSDT     │ 2024 03 11 08:55:00 │ 2024 03 11 17:15:00 │ LONG         │ 1.10%  │ 12.49% │ 2.40       │ rsiDivergency5m │
// │  492 │ XRPUSDT      │ 2024 03 11 12:10:00 │ 2024 03 11 20:30:00 │ SHORT        │ 0.88%  │ 21.65% │ 0.74       │ rsiDivergency5m │
// │  493 │ ORDIUSDT     │ 2024 03 11 20:55:00 │ 2024 03 12 03:25:00 │ SHORT        │ 2.49%  │ 6.57%  │ 82.97      │ rsiDivergency5m │
// │  494 │ MANTAUSDT    │ 2024 03 12 13:45:00 │ 2024 03 12 14:35:00 │ SHORT        │ -0.51% │ 14.21% │ 3.93       │ rsiDivergency5m │
// │  495 │ SUIUSDT      │ 2024 03 12 20:20:00 │ 2024 03 12 20:45:00 │ SHORT        │ -0.51% │ 23.68% │ 1.66       │ rsiDivergency5m │
// │  496 │ LOOMUSDT     │ 2024 03 12 22:25:00 │ 2024 03 13 00:20:00 │ SHORT        │ -0.51% │ 23.16% │ 0.13       │ rsiDivergency5m │
// │  497 │ KAVAUSDT     │ 2024 03 12 22:55:00 │ 2024 03 13 01:55:00 │ SHORT        │ -0.51% │ 22.65% │ 1.10       │ rsiDivergency5m │
// │  498 │ BEAMXUSDT    │ 2024 03 13 01:00:00 │ 2024 03 13 09:20:00 │ LONG         │ -0.01% │ 5.95%  │ 0.04       │ rsiDivergency5m │
// │  499 │ FXSUSDT      │ 2024 03 13 03:05:00 │ 2024 03 13 11:25:00 │ SHORT        │ 0.60%  │ 23.25% │ 10.06      │ rsiDivergency5m │
// │  500 │ MYROUSDT     │ 2024 03 13 10:05:00 │ 2024 03 13 11:30:00 │ LONG         │ 2.49%  │ 3.54%  │ 0.31       │ rsiDivergency5m │
// │  501 │ RSRUSDT      │ 2024 03 13 16:15:00 │ 2024 03 13 16:35:00 │ SHORT        │ -0.51% │ 22.74% │ 0.01       │ rsiDivergency5m │
// │  502 │ FTMUSDT      │ 2024 03 13 17:25:00 │ 2024 03 14 01:45:00 │ SHORT        │ 1.16%  │ 23.90% │ 0.91       │ rsiDivergency5m │
// │  503 │ SUPERUSDT    │ 2024 03 14 01:50:00 │ 2024 03 14 07:35:00 │ LONG         │ -0.51% │ 8.51%  │ 1.40       │ rsiDivergency5m │
// │  504 │ LRCUSDT      │ 2024 03 14 03:25:00 │ 2024 03 14 06:30:00 │ SHORT        │ -0.51% │ 23.39% │ 0.52       │ rsiDivergency5m │
// │  505 │ AMBUSDT      │ 2024 03 14 08:40:00 │ 2024 03 14 08:55:00 │ LONG         │ -0.51% │ 22.88% │ 0.01       │ rsiDivergency5m │
// │  506 │ C98USDT      │ 2024 03 14 08:40:00 │ 2024 03 14 08:55:00 │ LONG         │ -0.51% │ 22.37% │ 0.41       │ rsiDivergency5m │
// │  507 │ SKLUSDT      │ 2024 03 14 08:40:00 │ 2024 03 14 08:50:00 │ LONG         │ -0.51% │ 21.85% │ 0.11       │ rsiDivergency5m │
// │  508 │ KAVAUSDT     │ 2024 03 14 08:55:00 │ 2024 03 14 11:30:00 │ LONG         │ -0.51% │ 21.34% │ 1.05       │ rsiDivergency5m │
// │  509 │ STRKUSDT     │ 2024 03 14 22:10:00 │ 2024 03 14 22:20:00 │ LONG         │ -0.51% │ 9.54%  │ 2.25       │ rsiDivergency5m │
// │  510 │ ANKRUSDT     │ 2024 03 14 22:30:00 │ 2024 03 15 03:35:00 │ LONG         │ -0.51% │ 20.32% │ 0.05       │ rsiDivergency5m │
// │  511 │ STRKUSDT     │ 2024 03 14 22:30:00 │ 2024 03 15 03:40:00 │ LONG         │ -0.51% │ 9.03%  │ 2.18       │ rsiDivergency5m │
// │  512 │ BIGTIMEUSDT  │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 1.06%  │ 21.38% │ 0.41       │ rsiDivergency5m │
// │  513 │ RIFUSDT      │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 1.23%  │ 19.00% │ 0.24       │ rsiDivergency5m │
// │  514 │ DARUSDT      │ 2024 03 15 14:05:00 │ 2024 03 15 22:25:00 │ SHORT        │ 0.08%  │ 21.46% │ 0.26       │ rsiDivergency5m │
// │  515 │ ACEUSDT      │ 2024 03 15 17:50:00 │ 2024 03 15 22:55:00 │ SHORT        │ -0.51% │ 12.60% │ 11.18      │ rsiDivergency5m │
// │  516 │ LINAUSDT     │ 2024 03 15 22:20:00 │ 2024 03 16 01:45:00 │ SHORT        │ -0.51% │ 20.95% │ 0.01       │ rsiDivergency5m │
// │  517 │ ALTUSDT      │ 2024 03 15 22:55:00 │ 2024 03 15 23:15:00 │ SHORT        │ -0.51% │ 10.38% │ 0.53       │ rsiDivergency5m │
// │  518 │ ALTUSDT      │ 2024 03 15 23:20:00 │ 2024 03 16 07:40:00 │ SHORT        │ 1.43%  │ 11.81% │ 0.54       │ rsiDivergency5m │
// │  519 │ LEVERUSDT    │ 2024 03 16 07:10:00 │ 2024 03 16 07:35:00 │ LONG         │ -0.51% │ 20.44% │ 0.00       │ rsiDivergency5m │
// │  520 │ SSVUSDT      │ 2024 03 16 07:40:00 │ 2024 03 16 08:40:00 │ LONG         │ -0.51% │ 19.93% │ 46.10      │ rsiDivergency5m │
// │  521 │ HFTUSDT      │ 2024 03 16 09:05:00 │ 2024 03 16 12:40:00 │ LONG         │ -0.51% │ 19.41% │ 0.44       │ rsiDivergency5m │
// │  522 │ HOOKUSDT     │ 2024 03 16 12:30:00 │ 2024 03 16 12:40:00 │ LONG         │ -0.51% │ 18.90% │ 1.42       │ rsiDivergency5m │
// │  523 │ HOOKUSDT     │ 2024 03 16 12:45:00 │ 2024 03 16 13:05:00 │ LONG         │ -0.51% │ 18.39% │ 1.40       │ rsiDivergency5m │
// │  524 │ FLOWUSDT     │ 2024 03 16 13:30:00 │ 2024 03 16 13:55:00 │ LONG         │ -0.51% │ 17.36% │ 1.29       │ rsiDivergency5m │
// │  525 │ HFTUSDT      │ 2024 03 16 13:30:00 │ 2024 03 16 13:55:00 │ LONG         │ -0.51% │ 17.88% │ 0.42       │ rsiDivergency5m │
// │  526 │ APTUSDT      │ 2024 03 16 15:20:00 │ 2024 03 16 23:40:00 │ LONG         │ 2.16%  │ 19.02% │ 13.10      │ rsiDivergency5m │
// │  527 │ TRUUSDT      │ 2024 03 17 17:15:00 │ 2024 03 18 01:35:00 │ SHORT        │ 0.53%  │ 18.53% │ 0.09       │ rsiDivergency5m │
// │  528 │ LPTUSDT      │ 2024 03 18 03:15:00 │ 2024 03 18 07:15:00 │ LONG         │ -0.51% │ 17.50% │ 20.70      │ rsiDivergency5m │
// │  529 │ XVGUSDT      │ 2024 03 18 09:35:00 │ 2024 03 18 17:55:00 │ LONG         │ -0.01% │ 17.49% │ 0.01       │ rsiDivergency5m │
// │  530 │ MANTAUSDT    │ 2024 03 18 09:45:00 │ 2024 03 18 12:00:00 │ LONG         │ -0.51% │ 18.66% │ 2.96       │ rsiDivergency5m │
// │  531 │ COTIUSDT     │ 2024 03 19 07:50:00 │ 2024 03 19 10:45:00 │ SHORT        │ -0.51% │ 17.34% │ 0.18       │ rsiDivergency5m │
// │  532 │ HFTUSDT      │ 2024 03 19 11:45:00 │ 2024 03 19 20:05:00 │ SHORT        │ 1.21%  │ 18.55% │ 0.42       │ rsiDivergency5m │
// │  533 │ VANRYUSDT    │ 2024 03 19 12:05:00 │ 2024 03 19 12:15:00 │ SHORT        │ -0.51% │ 0.06%  │ 0.30       │ rsiDivergency5m │
// │  534 │ SKLUSDT      │ 2024 03 19 19:40:00 │ 2024 03 19 22:35:00 │ SHORT        │ -0.51% │ 18.04% │ 0.09       │ rsiDivergency5m │
// │  535 │ SKLUSDT      │ 2024 03 19 22:40:00 │ 2024 03 20 02:30:00 │ SHORT        │ -0.51% │ 17.53% │ 0.09       │ rsiDivergency5m │
// │  536 │ AIUSDT       │ 2024 03 20 00:10:00 │ 2024 03 20 00:20:00 │ LONG         │ -0.51% │ 19.21% │ 1.52       │ rsiDivergency5m │
// │  537 │ ALTUSDT      │ 2024 03 20 00:10:00 │ 2024 03 20 00:25:00 │ LONG         │ -0.51% │ 14.20% │ 0.42       │ rsiDivergency5m │
// │  538 │ MYROUSDT     │ 2024 03 20 00:10:00 │ 2024 03 20 00:20:00 │ LONG         │ -0.51% │ 12.00% │ 0.20       │ rsiDivergency5m │
// │  539 │ ONGUSDT      │ 2024 03 20 00:10:00 │ 2024 03 20 08:30:00 │ LONG         │ 1.80%  │ 4.62%  │ 0.32       │ rsiDivergency5m │
// │  540 │ CKBUSDT      │ 2024 03 20 03:30:00 │ 2024 03 20 10:10:00 │ SHORT        │ -0.51% │ 17.02% │ 0.02       │ rsiDivergency5m │
// │  541 │ POWRUSDT     │ 2024 03 20 06:35:00 │ 2024 03 20 07:25:00 │ SHORT        │ -0.51% │ 18.28% │ 0.35       │ rsiDivergency5m │
// │  542 │ 1000BONKUSDT │ 2024 03 20 14:50:00 │ 2024 03 20 15:20:00 │ SHORT        │ -0.51% │ 3.35%  │ 0.02       │ rsiDivergency5m │
// │  543 │ SUIUSDT      │ 2024 03 20 19:35:00 │ 2024 03 20 20:05:00 │ SHORT        │ -0.51% │ 18.99% │ 1.83       │ rsiDivergency5m │
// │  544 │ SUIUSDT      │ 2024 03 20 20:10:00 │ 2024 03 21 04:30:00 │ SHORT        │ 0.32%  │ 19.31% │ 1.86       │ rsiDivergency5m │
// │  545 │ SNXUSDT      │ 2024 03 21 06:25:00 │ 2024 03 21 09:20:00 │ SHORT        │ -0.51% │ 18.29% │ 4.28       │ rsiDivergency5m │
// │  546 │ STXUSDT      │ 2024 03 22 01:55:00 │ 2024 03 22 10:15:00 │ SHORT        │ 1.31%  │ 18.58% │ 3.65       │ rsiDivergency5m │
// │  547 │ ETHFIUSDT    │ 2024 03 22 06:55:00 │ 2024 03 22 15:15:00 │ LONG         │ 0.39%  │ -2.93% │ 3.58       │ rsiDivergency5m │
// │  548 │ RIFUSDT      │ 2024 03 22 07:05:00 │ 2024 03 22 08:35:00 │ LONG         │ -0.51% │ 18.50% │ 0.23       │ rsiDivergency5m │
// │  549 │ RIFUSDT      │ 2024 03 22 08:40:00 │ 2024 03 22 09:10:00 │ LONG         │ -0.51% │ 17.99% │ 0.23       │ rsiDivergency5m │
// │  550 │ RIFUSDT      │ 2024 03 22 09:15:00 │ 2024 03 22 17:35:00 │ LONG         │ 0.01%  │ 18.00% │ 0.23       │ rsiDivergency5m │
// │  551 │ AXSUSDT      │ 2024 03 22 09:25:00 │ 2024 03 22 17:45:00 │ LONG         │ 0.38%  │ 18.96% │ 9.67       │ rsiDivergency5m │
// │  552 │ ONDOUSDT     │ 2024 03 22 12:45:00 │ 2024 03 22 17:35:00 │ SHORT        │ 2.49%  │ 20.87% │ 0.79       │ rsiDivergency5m │
// │  553 │ STXUSDT      │ 2024 03 22 19:30:00 │ 2024 03 23 03:50:00 │ SHORT        │ 0.44%  │ 19.41% │ 3.56       │ rsiDivergency5m │
// │  554 │ RIFUSDT      │ 2024 03 23 08:40:00 │ 2024 03 23 09:00:00 │ SHORT        │ -0.51% │ 18.02% │ 0.25       │ rsiDivergency5m │
// │  555 │ ETHFIUSDT    │ 2024 03 23 09:25:00 │ 2024 03 23 17:45:00 │ SHORT        │ 0.03%  │ 0.42%  │ 4.21       │ rsiDivergency5m │
// │  556 │ DOGEUSDT     │ 2024 03 23 12:30:00 │ 2024 03 23 20:50:00 │ SHORT        │ 1.10%  │ 19.48% │ 0.17       │ rsiDivergency5m │
// │  557 │ DARUSDT      │ 2024 03 23 12:45:00 │ 2024 03 23 13:20:00 │ SHORT        │ -0.51% │ 18.38% │ 0.24       │ rsiDivergency5m │
// │  558 │ SUPERUSDT    │ 2024 03 23 13:30:00 │ 2024 03 23 13:35:00 │ SHORT        │ -0.51% │ 3.78%  │ 1.28       │ rsiDivergency5m │
// │  559 │ SUPERUSDT    │ 2024 03 23 13:45:00 │ 2024 03 23 14:10:00 │ SHORT        │ -0.51% │ 3.27%  │ 1.32       │ rsiDivergency5m │
// │  560 │ SUPERUSDT    │ 2024 03 23 14:15:00 │ 2024 03 23 22:35:00 │ SHORT        │ 1.11%  │ 4.38%  │ 1.35       │ rsiDivergency5m │
// │  561 │ WLDUSDT      │ 2024 03 23 22:35:00 │ 2024 03 24 06:55:00 │ LONG         │ 0.04%  │ 19.52% │ 8.27       │ rsiDivergency5m │
// │  562 │ LSKUSDT      │ 2024 03 24 09:55:00 │ 2024 03 24 18:15:00 │ SHORT        │ 0.60%  │ 19.22% │ 2.05       │ rsiDivergency5m │
// │  563 │ ONEUSDT      │ 2024 03 24 16:10:00 │ 2024 03 25 00:30:00 │ SHORT        │ 0.82%  │ 21.13% │ 0.03       │ rsiDivergency5m │
// │  564 │ ONDOUSDT     │ 2024 03 24 21:35:00 │ 2024 03 24 22:00:00 │ SHORT        │ -0.51% │ 21.95% │ 0.93       │ rsiDivergency5m │
// │  565 │ CKBUSDT      │ 2024 03 25 04:30:00 │ 2024 03 25 12:50:00 │ LONG         │ 0.52%  │ 20.63% │ 0.02       │ rsiDivergency5m │
// │  566 │ FTMUSDT      │ 2024 03 25 12:05:00 │ 2024 03 25 20:25:00 │ SHORT        │ 1.62%  │ 22.25% │ 1.22       │ rsiDivergency5m │
// │  567 │ IOTAUSDT     │ 2024 03 25 20:20:00 │ 2024 03 25 23:00:00 │ SHORT        │ -0.51% │ 21.74% │ 0.36       │ rsiDivergency5m │
// │  568 │ ZETAUSDT     │ 2024 03 26 00:40:00 │ 2024 03 26 09:00:00 │ SHORT        │ 1.00%  │ 14.84% │ 2.29       │ rsiDivergency5m │
// │  569 │ ONGUSDT      │ 2024 03 26 07:00:00 │ 2024 03 26 15:20:00 │ SHORT        │ 1.75%  │ 1.66%  │ 0.46       │ rsiDivergency5m │
// │  570 │ ETHFIUSDT    │ 2024 03 26 20:40:00 │ 2024 03 26 21:45:00 │ SHORT        │ -0.51% │ -0.03% │ 5.87       │ rsiDivergency5m │
// │  571 │ FETUSDT      │ 2024 03 27 03:20:00 │ 2024 03 27 05:00:00 │ SHORT        │ -0.51% │ 22.98% │ 3.20       │ rsiDivergency5m │
// │  572 │ RNDRUSDT     │ 2024 03 27 17:35:00 │ 2024 03 28 01:55:00 │ SHORT        │ 0.19%  │ 24.42% │ 11.37      │ rsiDivergency5m │
// │  573 │ GMTUSDT      │ 2024 03 28 04:25:00 │ 2024 03 28 07:25:00 │ SHORT        │ 2.49%  │ 26.91% │ 0.44       │ rsiDivergency5m │
// │  574 │ 1000BONKUSDT │ 2024 03 28 09:45:00 │ 2024 03 28 18:05:00 │ SHORT        │ 0.53%  │ 7.21%  │ 0.03       │ rsiDivergency5m │
// │  575 │ SPELLUSDT    │ 2024 03 28 13:15:00 │ 2024 03 28 13:25:00 │ SHORT        │ -0.51% │ 25.88% │ 0.00       │ rsiDivergency5m │
// │  576 │ SPELLUSDT    │ 2024 03 28 13:30:00 │ 2024 03 28 18:35:00 │ SHORT        │ -0.51% │ 25.37% │ 0.00       │ rsiDivergency5m │
// │  577 │ ARPAUSDT     │ 2024 03 28 19:10:00 │ 2024 03 28 20:40:00 │ SHORT        │ -0.51% │ 24.86% │ 0.10       │ rsiDivergency5m │
// │  578 │ 1000SATSUSDT │ 2024 03 28 19:20:00 │ 2024 03 29 03:40:00 │ SHORT        │ 0.90%  │ 9.27%  │ 0.00       │ rsiDivergency5m │
// │  579 │ IDUSDT       │ 2024 03 28 22:55:00 │ 2024 03 29 02:05:00 │ LONG         │ -0.51% │ 23.83% │ 1.11       │ rsiDivergency5m │
// │  580 │ XVGUSDT      │ 2024 03 29 11:45:00 │ 2024 03 29 11:55:00 │ SHORT        │ -0.51% │ 25.45% │ 0.01       │ rsiDivergency5m │
// │  581 │ POLYXUSDT    │ 2024 03 30 03:25:00 │ 2024 03 30 04:10:00 │ SHORT        │ -0.51% │ 17.78% │ 0.63       │ rsiDivergency5m │
// │  582 │ YGGUSDT      │ 2024 03 30 07:05:00 │ 2024 03 30 07:35:00 │ SHORT        │ -0.51% │ 26.25% │ 1.28       │ rsiDivergency5m │
// │  583 │ YGGUSDT      │ 2024 03 30 07:50:00 │ 2024 03 30 08:00:00 │ SHORT        │ -0.51% │ 25.73% │ 1.31       │ rsiDivergency5m │
// │  584 │ YGGUSDT      │ 2024 03 30 08:10:00 │ 2024 03 30 08:25:00 │ SHORT        │ -0.51% │ 25.22% │ 1.33       │ rsiDivergency5m │
// │  585 │ ORDIUSDT     │ 2024 03 30 11:30:00 │ 2024 03 30 12:05:00 │ SHORT        │ -0.51% │ 15.63% │ 70.57      │ rsiDivergency5m │
// │  586 │ MYROUSDT     │ 2024 03 30 15:25:00 │ 2024 03 30 16:40:00 │ LONG         │ -0.51% │ 14.55% │ 0.34       │ rsiDivergency5m │
// │  587 │ YGGUSDT      │ 2024 03 30 17:55:00 │ 2024 03 31 00:45:00 │ LONG         │ 2.49%  │ 28.93% │ 1.35       │ rsiDivergency5m │
// │  588 │ ANKRUSDT     │ 2024 03 31 07:15:00 │ 2024 03 31 15:35:00 │ SHORT        │ 0.67%  │ 29.61% │ 0.06       │ rsiDivergency5m │
// │  589 │ ONDOUSDT     │ 2024 03 31 12:35:00 │ 2024 03 31 12:45:00 │ SHORT        │ -0.51% │ 21.26% │ 1.00       │ rsiDivergency5m │
// │  590 │ TOKENUSDT    │ 2024 03 31 14:15:00 │ 2024 03 31 19:05:00 │ SHORT        │ 2.49%  │ 25.21% │ 0.20       │ rsiDivergency5m │
// │  591 │ HIGHUSDT     │ 2024 03 31 22:00:00 │ 2024 03 31 22:25:00 │ SHORT        │ -0.51% │ 29.09% │ 2.37       │ rsiDivergency5m │
// │  592 │ ONDOUSDT     │ 2024 03 31 22:45:00 │ 2024 04 01 00:45:00 │ LONG         │ -0.51% │ 19.73% │ 0.92       │ rsiDivergency5m │
// │  593 │ ANKRUSDT     │ 2024 03 31 23:25:00 │ 2024 04 01 07:45:00 │ SHORT        │ 1.53%  │ 30.63% │ 0.07       │ rsiDivergency5m │
// │  594 │ ONGUSDT      │ 2024 04 01 05:35:00 │ 2024 04 01 10:05:00 │ LONG         │ -0.51% │ 6.70%  │ 0.40       │ rsiDivergency5m │
// │  595 │ PENDLEUSDT   │ 2024 04 01 20:35:00 │ 2024 04 01 21:35:00 │ LONG         │ -0.51% │ 29.58% │ 5.08       │ rsiDivergency5m │
// │  596 │ UMAUSDT      │ 2024 04 01 22:25:00 │ 2024 04 02 00:20:00 │ LONG         │ -0.51% │ 29.07% │ 3.94       │ rsiDivergency5m │
// │  597 │ 1000SATSUSDT │ 2024 04 01 22:50:00 │ 2024 04 02 00:20:00 │ LONG         │ -0.51% │ 3.95%  │ 0.00       │ rsiDivergency5m │
// │  598 │ ARBUSDT      │ 2024 04 02 00:20:00 │ 2024 04 02 04:00:00 │ LONG         │ -0.51% │ 28.56% │ 1.47       │ rsiDivergency5m │
// │  599 │ ANKRUSDT     │ 2024 04 02 03:45:00 │ 2024 04 02 08:30:00 │ LONG         │ -0.51% │ 28.04% │ 0.06       │ rsiDivergency5m │
// │  600 │ MTLUSDT      │ 2024 04 02 09:05:00 │ 2024 04 02 17:25:00 │ LONG         │ 0.69%  │ 28.74% │ 1.99       │ rsiDivergency5m │
// │  601 │ LQTYUSDT     │ 2024 04 02 19:55:00 │ 2024 04 03 04:15:00 │ LONG         │ 0.63%  │ 29.37% │ 1.70       │ rsiDivergency5m │
// │  602 │ LQTYUSDT     │ 2024 04 03 07:50:00 │ 2024 04 03 08:30:00 │ LONG         │ -0.51% │ 28.86% │ 1.64       │ rsiDivergency5m │
// │  603 │ TRUUSDT      │ 2024 04 03 08:45:00 │ 2024 04 03 12:35:00 │ LONG         │ -0.51% │ 28.35% │ 0.13       │ rsiDivergency5m │
// │  604 │ TRUUSDT      │ 2024 04 03 13:30:00 │ 2024 04 03 15:20:00 │ LONG         │ -0.51% │ 27.83% │ 0.12       │ rsiDivergency5m │
// │  605 │ LQTYUSDT     │ 2024 04 03 15:35:00 │ 2024 04 03 23:55:00 │ LONG         │ -0.07% │ 27.76% │ 1.48       │ rsiDivergency5m │
// │  606 │ LEVERUSDT    │ 2024 04 04 04:10:00 │ 2024 04 04 05:00:00 │ SHORT        │ -0.51% │ 27.25% │ 0.00       │ rsiDivergency5m │
// │  607 │ LEVERUSDT    │ 2024 04 04 05:10:00 │ 2024 04 04 05:20:00 │ SHORT        │ -0.51% │ 26.74% │ 0.00       │ rsiDivergency5m │
// │  608 │ LEVERUSDT    │ 2024 04 04 05:25:00 │ 2024 04 04 05:55:00 │ SHORT        │ -0.51% │ 26.22% │ 0.00       │ rsiDivergency5m │
// │  609 │ NMRUSDT      │ 2024 04 04 07:50:00 │ 2024 04 04 11:00:00 │ SHORT        │ -0.51% │ 25.71% │ 34.60      │ rsiDivergency5m │
// │  610 │ POLYXUSDT    │ 2024 04 04 10:55:00 │ 2024 04 04 19:15:00 │ SHORT        │ 1.51%  │ 23.50% │ 0.58       │ rsiDivergency5m │
// │  611 │ PENDLEUSDT   │ 2024 04 04 11:30:00 │ 2024 04 04 11:50:00 │ SHORT        │ -0.51% │ 25.20% │ 5.58       │ rsiDivergency5m │
// │  612 │ XVGUSDT      │ 2024 04 04 22:10:00 │ 2024 04 05 06:30:00 │ LONG         │ 0.63%  │ 28.32% │ 0.01       │ rsiDivergency5m │
// │  613 │ MASKUSDT     │ 2024 04 05 14:25:00 │ 2024 04 05 22:45:00 │ SHORT        │ 0.66%  │ 30.65% │ 5.16       │ rsiDivergency5m │
// │  614 │ ENAUSDT      │ 2024 04 06 02:20:00 │ 2024 04 06 02:25:00 │ SHORT        │ -0.51% │ -2.29% │ 1.10       │ rsiDivergency5m │
// │  615 │ ENAUSDT      │ 2024 04 06 02:40:00 │ 2024 04 06 10:35:00 │ SHORT        │ -0.51% │ -2.80% │ 1.13       │ rsiDivergency5m │
// │  616 │ CKBUSDT      │ 2024 04 06 03:55:00 │ 2024 04 06 05:20:00 │ SHORT        │ -0.51% │ 30.14% │ 0.02       │ rsiDivergency5m │
// │  617 │ PENDLEUSDT   │ 2024 04 06 12:05:00 │ 2024 04 06 14:30:00 │ LONG         │ -0.51% │ 29.62% │ 6.74       │ rsiDivergency5m │
// │  618 │ PENDLEUSDT   │ 2024 04 06 15:10:00 │ 2024 04 06 23:30:00 │ LONG         │ -0.03% │ 29.59% │ 6.57       │ rsiDivergency5m │
// │  619 │ TOKENUSDT    │ 2024 04 06 22:25:00 │ 2024 04 07 06:45:00 │ SHORT        │ 0.88%  │ 18.37% │ 0.17       │ rsiDivergency5m │
// │  620 │ NKNUSDT      │ 2024 04 07 05:20:00 │ 2024 04 07 05:30:00 │ SHORT        │ -0.51% │ 29.08% │ 0.20       │ rsiDivergency5m │
// │  621 │ NKNUSDT      │ 2024 04 07 05:35:00 │ 2024 04 07 06:10:00 │ SHORT        │ -0.51% │ 28.57% │ 0.21       │ rsiDivergency5m │
// │  622 │ NKNUSDT      │ 2024 04 07 06:25:00 │ 2024 04 07 07:10:00 │ SHORT        │ -0.51% │ 28.06% │ 0.21       │ rsiDivergency5m │
// │  623 │ YGGUSDT      │ 2024 04 07 08:10:00 │ 2024 04 07 16:30:00 │ SHORT        │ 2.31%  │ 30.37% │ 1.45       │ rsiDivergency5m │
// │  624 │ ALTUSDT      │ 2024 04 07 11:40:00 │ 2024 04 07 14:35:00 │ SHORT        │ -0.51% │ 17.87% │ 0.62       │ rsiDivergency5m │
// │  625 │ SFPUSDT      │ 2024 04 07 21:25:00 │ 2024 04 07 22:15:00 │ SHORT        │ -0.51% │ 27.29% │ 0.80       │ rsiDivergency5m │
// │  626 │ SFPUSDT      │ 2024 04 07 22:25:00 │ 2024 04 07 22:45:00 │ SHORT        │ -0.51% │ 26.78% │ 0.82       │ rsiDivergency5m │
// │  627 │ PENDLEUSDT   │ 2024 04 08 00:45:00 │ 2024 04 08 01:25:00 │ LONG         │ -0.51% │ 26.27% │ 6.60       │ rsiDivergency5m │
// │  628 │ POLYXUSDT    │ 2024 04 08 01:45:00 │ 2024 04 08 10:05:00 │ SHORT        │ 1.22%  │ 26.44% │ 0.59       │ rsiDivergency5m │
// │  629 │ GMXUSDT      │ 2024 04 08 04:25:00 │ 2024 04 08 06:10:00 │ SHORT        │ -0.51% │ 25.75% │ 39.62      │ rsiDivergency5m │
// │  630 │ REEFUSDT     │ 2024 04 08 15:05:00 │ 2024 04 08 23:25:00 │ SHORT        │ 0.58%  │ 26.94% │ 0.00       │ rsiDivergency5m │
// │  631 │ LEVERUSDT    │ 2024 04 09 01:30:00 │ 2024 04 09 07:00:00 │ LONG         │ 2.49%  │ 29.43% │ 0.00       │ rsiDivergency5m │
// │  632 │ TOKENUSDT    │ 2024 04 09 09:10:00 │ 2024 04 09 09:40:00 │ LONG         │ -0.51% │ 18.80% │ 0.15       │ rsiDivergency5m │
// │  633 │ MAVUSDT      │ 2024 04 09 10:15:00 │ 2024 04 09 18:25:00 │ LONG         │ -0.51% │ 28.91% │ 0.63       │ rsiDivergency5m │
// │  634 │ LDOUSDT      │ 2024 04 09 18:55:00 │ 2024 04 09 21:45:00 │ LONG         │ -0.51% │ 28.40% │ 2.68       │ rsiDivergency5m │
// │  635 │ ALTUSDT      │ 2024 04 09 20:25:00 │ 2024 04 09 21:40:00 │ LONG         │ -0.51% │ 17.57% │ 0.58       │ rsiDivergency5m │
// │  636 │ AIUSDT       │ 2024 04 09 21:55:00 │ 2024 04 10 06:15:00 │ LONG         │ 0.49%  │ 11.20% │ 1.40       │ rsiDivergency5m │
// │  637 │ APTUSDT      │ 2024 04 09 21:55:00 │ 2024 04 10 06:15:00 │ LONG         │ -0.18% │ 28.22% │ 12.29      │ rsiDivergency5m │
// │  638 │ TNSRUSDT     │ 2024 04 11 03:00:00 │ 2024 04 11 06:20:00 │ LONG         │ -0.51% │ -1.77% │ 1.50       │ rsiDivergency5m │
// │  639 │ ALPHAUSDT    │ 2024 04 11 03:45:00 │ 2024 04 11 06:35:00 │ LONG         │ -0.51% │ 26.85% │ 0.18       │ rsiDivergency5m │
// │  640 │ CELRUSDT     │ 2024 04 11 07:05:00 │ 2024 04 11 07:15:00 │ SHORT        │ -0.51% │ 26.33% │ 0.04       │ rsiDivergency5m │
// │  641 │ SSVUSDT      │ 2024 04 11 08:15:00 │ 2024 04 11 16:35:00 │ SHORT        │ 1.94%  │ 28.27% │ 53.85      │ rsiDivergency5m │
// │  642 │ CKBUSDT      │ 2024 04 11 20:05:00 │ 2024 04 11 20:55:00 │ SHORT        │ -0.51% │ 27.76% │ 0.03       │ rsiDivergency5m │
// │  643 │ AMBUSDT      │ 2024 04 11 21:35:00 │ 2024 04 12 05:55:00 │ SHORT        │ 1.11%  │ 28.87% │ 0.01       │ rsiDivergency5m │
// │  644 │ ONTUSDT      │ 2024 04 12 05:50:00 │ 2024 04 12 06:25:00 │ SHORT        │ -0.51% │ 28.36% │ 0.44       │ rsiDivergency5m │
// │  645 │ ONTUSDT      │ 2024 04 12 06:50:00 │ 2024 04 12 06:55:00 │ SHORT        │ -0.51% │ 27.84% │ 0.46       │ rsiDivergency5m │
// │  646 │ ONTUSDT      │ 2024 04 12 07:10:00 │ 2024 04 12 12:00:00 │ SHORT        │ 2.49%  │ 30.33% │ 0.47       │ rsiDivergency5m │
// │  647 │ SAGAUSDT     │ 2024 04 12 08:20:00 │ 2024 04 12 08:45:00 │ LONG         │ -0.51% │ -0.64% │ 4.64       │ rsiDivergency5m │
// │  648 │ SAGAUSDT     │ 2024 04 12 09:15:00 │ 2024 04 12 09:50:00 │ LONG         │ -0.51% │ -1.15% │ 4.53       │ rsiDivergency5m │
// │  649 │ NFPUSDT      │ 2024 04 12 11:20:00 │ 2024 04 12 12:25:00 │ LONG         │ -0.51% │ 9.40%  │ 0.59       │ rsiDivergency5m │
// │  650 │ STGUSDT      │ 2024 04 12 13:10:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.51% │ 29.82% │ 0.65       │ rsiDivergency5m │
// │  651 │ GALAUSDT     │ 2024 04 12 13:20:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.51% │ 29.31% │ 0.05       │ rsiDivergency5m │
// │  652 │ NEOUSDT      │ 2024 04 13 00:10:00 │ 2024 04 13 08:30:00 │ SHORT        │ 1.21%  │ 29.50% │ 20.33      │ rsiDivergency5m │
// │  653 │ POLYXUSDT    │ 2024 04 13 05:35:00 │ 2024 04 13 12:25:00 │ SHORT        │ 2.49%  │ 27.69% │ 0.46       │ rsiDivergency5m │
// │  654 │ GMTUSDT      │ 2024 04 13 10:35:00 │ 2024 04 13 14:55:00 │ SHORT        │ 2.49%  │ 31.98% │ 0.27       │ rsiDivergency5m │
// │  655 │ ETHFIUSDT    │ 2024 04 13 11:50:00 │ 2024 04 13 12:05:00 │ LONG         │ -0.51% │ 15.06% │ 4.24       │ rsiDivergency5m │
// │  656 │ MYROUSDT     │ 2024 04 13 12:40:00 │ 2024 04 13 14:45:00 │ LONG         │ -0.51% │ 15.20% │ 0.14       │ rsiDivergency5m │
// │  657 │ ADAUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 30.45% │ 0.45       │ rsiDivergency5m │
// │  658 │ ARUSDT       │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 31.47% │ 24.47      │ rsiDivergency5m │
// │  659 │ FILUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 30.96% │ 5.66       │ rsiDivergency5m │
// │  660 │ MKRUSDT      │ 2024 04 14 01:35:00 │ 2024 04 14 09:55:00 │ SHORT        │ 0.42%  │ 33.36% │ 2961.10    │ rsiDivergency5m │
// │  661 │ SAGAUSDT     │ 2024 04 14 09:55:00 │ 2024 04 14 12:10:00 │ SHORT        │ 2.49%  │ -0.95% │ 4.50       │ rsiDivergency5m │
// │  662 │ XVGUSDT      │ 2024 04 14 16:20:00 │ 2024 04 14 16:45:00 │ LONG         │ -0.51% │ 32.84% │ 0.01       │ rsiDivergency5m │
// │  663 │ PENDLEUSDT   │ 2024 04 14 18:00:00 │ 2024 04 14 18:20:00 │ SHORT        │ -0.51% │ 32.33% │ 6.57       │ rsiDivergency5m │
// │  664 │ ORDIUSDT     │ 2024 04 14 18:15:00 │ 2024 04 15 01:40:00 │ SHORT        │ -0.51% │ 18.89% │ 48.54      │ rsiDivergency5m │
// │  665 │ XVSUSDT      │ 2024 04 14 18:15:00 │ 2024 04 15 01:15:00 │ SHORT        │ -0.51% │ 31.82% │ 9.60       │ rsiDivergency5m │
// │  666 │ TNSRUSDT     │ 2024 04 14 23:15:00 │ 2024 04 15 07:35:00 │ LONG         │ 0.01%  │ 0.57%  │ 0.93       │ rsiDivergency5m │
// │  667 │ PORTALUSDT   │ 2024 04 15 02:20:00 │ 2024 04 15 10:40:00 │ SHORT        │ 1.24%  │ 9.13%  │ 1.06       │ rsiDivergency5m │
// │  668 │ 1000BONKUSDT │ 2024 04 15 11:40:00 │ 2024 04 15 12:25:00 │ LONG         │ -0.51% │ 15.12% │ 0.02       │ rsiDivergency5m │
// │  669 │ MANTAUSDT    │ 2024 04 15 11:45:00 │ 2024 04 15 12:40:00 │ LONG         │ -0.51% │ 13.59% │ 1.97       │ rsiDivergency5m │
// │  670 │ IMXUSDT      │ 2024 04 15 12:45:00 │ 2024 04 15 13:50:00 │ LONG         │ -0.51% │ 33.28% │ 2.04       │ rsiDivergency5m │
// │  671 │ XVGUSDT      │ 2024 04 15 12:45:00 │ 2024 04 15 13:20:00 │ LONG         │ -0.51% │ 33.79% │ 0.01       │ rsiDivergency5m │
// │  672 │ FTMUSDT      │ 2024 04 15 13:25:00 │ 2024 04 15 14:00:00 │ LONG         │ -0.51% │ 32.77% │ 0.64       │ rsiDivergency5m │
// │  673 │ SUPERUSDT    │ 2024 04 15 13:25:00 │ 2024 04 15 13:50:00 │ LONG         │ -0.51% │ 18.13% │ 0.96       │ rsiDivergency5m │
// │  674 │ IDUSDT       │ 2024 04 16 02:25:00 │ 2024 04 16 10:45:00 │ SHORT        │ 1.31%  │ 34.07% │ 0.70       │ rsiDivergency5m │
// │  675 │ TAOUSDT      │ 2024 04 16 07:40:00 │ 2024 04 16 16:00:00 │ LONG         │ 1.34%  │ 0.39%  │ 460.81     │ rsiDivergency5m │
// │  676 │ ENAUSDT      │ 2024 04 16 10:40:00 │ 2024 04 16 16:25:00 │ LONG         │ 2.49%  │ 9.44%  │ 0.90       │ rsiDivergency5m │
// │  677 │ ONTUSDT      │ 2024 04 16 11:25:00 │ 2024 04 16 16:20:00 │ LONG         │ 2.49%  │ 36.56% │ 0.29       │ rsiDivergency5m │
// │  678 │ BEAMXUSDT    │ 2024 04 16 16:25:00 │ 2024 04 16 23:30:00 │ SHORT        │ -0.51% │ 20.83% │ 0.03       │ rsiDivergency5m │
// │  679 │ SFPUSDT      │ 2024 04 16 20:05:00 │ 2024 04 16 21:40:00 │ SHORT        │ -0.51% │ 36.05% │ 0.79       │ rsiDivergency5m │
// │  680 │ TNSRUSDT     │ 2024 04 17 05:10:00 │ 2024 04 17 05:45:00 │ LONG         │ -0.51% │ 3.03%  │ 0.82       │ rsiDivergency5m │
// │  681 │ RNDRUSDT     │ 2024 04 17 07:40:00 │ 2024 04 17 09:15:00 │ LONG         │ -0.51% │ 35.54% │ 7.66       │ rsiDivergency5m │
// │  682 │ SSVUSDT      │ 2024 04 17 09:25:00 │ 2024 04 17 11:00:00 │ LONG         │ -0.51% │ 35.02% │ 35.17      │ rsiDivergency5m │
// │  683 │ TRUUSDT      │ 2024 04 17 13:25:00 │ 2024 04 17 21:45:00 │ SHORT        │ 2.14%  │ 37.16% │ 0.12       │ rsiDivergency5m │
// │  684 │ TRUUSDT      │ 2024 04 18 01:25:00 │ 2024 04 18 02:30:00 │ LONG         │ -0.51% │ 36.14% │ 0.11       │ rsiDivergency5m │
// │  685 │ ETHFIUSDT    │ 2024 04 18 02:40:00 │ 2024 04 18 11:00:00 │ LONG         │ 1.68%  │ 14.43% │ 3.36       │ rsiDivergency5m │
// │  686 │ CKBUSDT      │ 2024 04 18 05:50:00 │ 2024 04 18 09:25:00 │ LONG         │ 2.49%  │ 38.62% │ 0.02       │ rsiDivergency5m │
// │  687 │ INJUSDT      │ 2024 04 18 09:30:00 │ 2024 04 18 09:55:00 │ SHORT        │ -0.51% │ 38.11% │ 27.75      │ rsiDivergency5m │
// │  688 │ ONTUSDT      │ 2024 04 18 09:50:00 │ 2024 04 18 10:00:00 │ SHORT        │ -0.51% │ 37.60% │ 0.31       │ rsiDivergency5m │
// │  689 │ DODOXUSDT    │ 2024 04 19 03:10:00 │ 2024 04 19 11:30:00 │ SHORT        │ 0.04%  │ 37.49% │ 0.16       │ rsiDivergency5m │
// │  690 │ GASUSDT      │ 2024 04 19 08:40:00 │ 2024 04 19 17:00:00 │ LONG         │ 0.16%  │ 27.87% │ 5.41       │ rsiDivergency5m │
// │  691 │ TAOUSDT      │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.99%  │ 0.48%  │ 433.10     │ rsiDivergency5m │
// │  692 │ ORDIUSDT     │ 2024 04 20 12:25:00 │ 2024 04 20 12:55:00 │ SHORT        │ -0.51% │ 24.34% │ 49.26      │ rsiDivergency5m │
// │  693 │ TOKENUSDT    │ 2024 04 20 12:25:00 │ 2024 04 20 12:40:00 │ SHORT        │ -0.51% │ 30.12% │ 0.12       │ rsiDivergency5m │
// │  694 │ TRUUSDT      │ 2024 04 20 19:50:00 │ 2024 04 21 04:10:00 │ LONG         │ 0.21%  │ 36.16% │ 0.13       │ rsiDivergency5m │
// │  695 │ ANKRUSDT     │ 2024 04 22 12:40:00 │ 2024 04 22 21:00:00 │ SHORT        │ -0.06% │ 36.95% │ 0.05       │ rsiDivergency5m │
// │  696 │ CKBUSDT      │ 2024 04 23 07:00:00 │ 2024 04 23 15:20:00 │ LONG         │ 0.13%  │ 37.08% │ 0.02       │ rsiDivergency5m │
// │  697 │ ONTUSDT      │ 2024 04 23 16:50:00 │ 2024 04 23 18:05:00 │ LONG         │ -0.51% │ 36.57% │ 0.43       │ rsiDivergency5m │
// │  698 │ 1000BONKUSDT │ 2024 04 23 19:45:00 │ 2024 04 23 20:05:00 │ SHORT        │ -0.51% │ 16.85% │ 0.03       │ rsiDivergency5m │
// │  699 │ ORDIUSDT     │ 2024 04 24 09:55:00 │ 2024 04 24 10:25:00 │ LONG         │ -0.51% │ 30.09% │ 45.36      │ rsiDivergency5m │
// │  700 │ VANRYUSDT    │ 2024 04 24 09:55:00 │ 2024 04 24 10:40:00 │ LONG         │ -0.51% │ 10.61% │ 0.17       │ rsiDivergency5m │
// │  701 │ MINAUSDT     │ 2024 04 24 10:45:00 │ 2024 04 24 14:00:00 │ LONG         │ -0.51% │ 37.72% │ 0.89       │ rsiDivergency5m │
// │  702 │ TAOUSDT      │ 2024 04 24 11:15:00 │ 2024 04 24 14:00:00 │ LONG         │ -0.51% │ 4.00%  │ 457.42     │ rsiDivergency5m │
// │  703 │ STRKUSDT     │ 2024 04 24 13:50:00 │ 2024 04 24 17:45:00 │ LONG         │ -0.51% │ 22.04% │ 1.24       │ rsiDivergency5m │
// │  704 │ FETUSDT      │ 2024 04 24 17:55:00 │ 2024 04 25 02:15:00 │ LONG         │ 0.18%  │ 37.90% │ 2.25       │ rsiDivergency5m │
// │  705 │ LQTYUSDT     │ 2024 04 25 15:25:00 │ 2024 04 25 23:45:00 │ SHORT        │ 1.21%  │ 40.06% │ 1.12       │ rsiDivergency5m │
// │  706 │ MYROUSDT     │ 2024 04 26 17:30:00 │ 2024 04 26 19:30:00 │ LONG         │ -0.51% │ 13.81% │ 0.16       │ rsiDivergency5m │
// │  707 │ LSKUSDT      │ 2024 04 26 19:45:00 │ 2024 04 26 20:15:00 │ LONG         │ -0.51% │ 10.72% │ 1.68       │ rsiDivergency5m │
// │  708 │ MYROUSDT     │ 2024 04 26 20:05:00 │ 2024 04 26 20:15:00 │ LONG         │ -0.51% │ 13.30% │ 0.15       │ rsiDivergency5m │
// │  709 │ ALTUSDT      │ 2024 04 26 20:30:00 │ 2024 04 27 04:50:00 │ LONG         │ 0.32%  │ 11.04% │ 0.35       │ rsiDivergency5m │
// │  710 │ LOOMUSDT     │ 2024 04 27 12:05:00 │ 2024 04 27 20:25:00 │ LONG         │ 0.69%  │ 43.76% │ 0.09       │ rsiDivergency5m │
// │  711 │ 1000BONKUSDT │ 2024 04 27 18:10:00 │ 2024 04 28 00:20:00 │ LONG         │ 2.49%  │ 19.50% │ 0.02       │ rsiDivergency5m │
// │  712 │ TUSDT        │ 2024 04 27 21:05:00 │ 2024 04 28 05:25:00 │ SHORT        │ 1.58%  │ 45.34% │ 0.04       │ rsiDivergency5m │
// │  713 │ FRONTUSDT    │ 2024 04 28 07:50:00 │ 2024 04 28 16:10:00 │ LONG         │ 0.41%  │ 45.74% │ 0.91       │ rsiDivergency5m │
// │  714 │ WUSDT        │ 2024 04 28 14:05:00 │ 2024 04 28 22:05:00 │ SHORT        │ 2.49%  │ 16.08% │ 0.67       │ rsiDivergency5m │
// │  715 │ SAGAUSDT     │ 2024 04 28 22:05:00 │ 2024 04 29 00:30:00 │ LONG         │ -0.51% │ 12.59% │ 3.58       │ rsiDivergency5m │
// │  716 │ WUSDT        │ 2024 04 28 22:10:00 │ 2024 04 29 01:20:00 │ LONG         │ -0.51% │ 15.57% │ 0.60       │ rsiDivergency5m │
// │  717 │ 1000BONKUSDT │ 2024 04 28 22:15:00 │ 2024 04 29 06:35:00 │ LONG         │ 0.01%  │ 17.27% │ 0.02       │ rsiDivergency5m │
// │  718 │ POLYXUSDT    │ 2024 04 28 22:35:00 │ 2024 04 29 01:45:00 │ LONG         │ -0.51% │ 36.46% │ 0.37       │ rsiDivergency5m │
// │  719 │ CFXUSDT      │ 2024 04 29 01:35:00 │ 2024 04 29 09:55:00 │ LONG         │ 0.18%  │ 46.19% │ 0.22       │ rsiDivergency5m │
// │  720 │ POLYXUSDT    │ 2024 04 29 01:50:00 │ 2024 04 29 08:50:00 │ LONG         │ -0.51% │ 35.95% │ 0.37       │ rsiDivergency5m │
// │  721 │ POWRUSDT     │ 2024 04 29 03:35:00 │ 2024 04 29 11:55:00 │ LONG         │ 0.36%  │ 37.45% │ 0.29       │ rsiDivergency5m │
// │  722 │ LEVERUSDT    │ 2024 04 29 18:05:00 │ 2024 04 30 02:25:00 │ SHORT        │ -0.06% │ 46.13% │ 0.00       │ rsiDivergency5m │
// │  723 │ LEVERUSDT    │ 2024 04 30 04:25:00 │ 2024 04 30 07:05:00 │ LONG         │ -0.51% │ 45.62% │ 0.00       │ rsiDivergency5m │
// │  724 │ TOKENUSDT    │ 2024 04 30 06:50:00 │ 2024 04 30 07:10:00 │ LONG         │ -0.51% │ 27.36% │ 0.10       │ rsiDivergency5m │
// │  725 │ ORDIUSDT     │ 2024 04 30 07:00:00 │ 2024 04 30 07:05:00 │ LONG         │ -0.51% │ 29.85% │ 38.63      │ rsiDivergency5m │
// │  726 │ ALTUSDT      │ 2024 04 30 07:10:00 │ 2024 04 30 10:40:00 │ LONG         │ -0.51% │ 16.98% │ 0.35       │ rsiDivergency5m │
// │  727 │ RDNTUSDT     │ 2024 04 30 07:10:00 │ 2024 04 30 08:50:00 │ LONG         │ -0.51% │ 45.10% │ 0.18       │ rsiDivergency5m │
// │  728 │ ORDIUSDT     │ 2024 04 30 07:20:00 │ 2024 04 30 08:00:00 │ LONG         │ -0.51% │ 29.34% │ 37.64      │ rsiDivergency5m │
// │  729 │ ORDIUSDT     │ 2024 04 30 08:05:00 │ 2024 04 30 08:45:00 │ LONG         │ -0.51% │ 28.83% │ 36.99      │ rsiDivergency5m │
// │  730 │ POLYXUSDT    │ 2024 04 30 08:05:00 │ 2024 04 30 11:10:00 │ LONG         │ -0.51% │ 35.76% │ 0.34       │ rsiDivergency5m │
// │  731 │ BEAMXUSDT    │ 2024 04 30 08:15:00 │ 2024 04 30 11:10:00 │ LONG         │ -0.51% │ 26.39% │ 0.02       │ rsiDivergency5m │
// │  732 │ ORDIUSDT     │ 2024 04 30 08:55:00 │ 2024 04 30 09:10:00 │ LONG         │ -0.51% │ 28.32% │ 36.24      │ rsiDivergency5m │
// │  733 │ TRUUSDT      │ 2024 04 30 08:55:00 │ 2024 04 30 10:40:00 │ LONG         │ -0.51% │ 44.59% │ 0.10       │ rsiDivergency5m │
// │  734 │ ORDIUSDT     │ 2024 04 30 09:15:00 │ 2024 04 30 11:05:00 │ LONG         │ -0.51% │ 27.80% │ 35.82      │ rsiDivergency5m │
// │  735 │ CKBUSDT      │ 2024 04 30 10:45:00 │ 2024 04 30 11:05:00 │ LONG         │ -0.51% │ 44.08% │ 0.02       │ rsiDivergency5m │
// │  736 │ GASUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ -0.05% │ 35.71% │ 4.87       │ rsiDivergency5m │
// │  737 │ RIFUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 0.95%  │ 38.85% │ 0.17       │ rsiDivergency5m │
// │  738 │ SUIUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 1.32%  │ 45.40% │ 1.08       │ rsiDivergency5m │
// │  739 │ WAXPUSDT     │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 0.27%  │ 46.01% │ 0.06       │ rsiDivergency5m │
// │  740 │ OMNIUSDT     │ 2024 05 01 02:35:00 │ 2024 05 01 10:55:00 │ LONG         │ 0.70%  │ 10.81% │ 16.95      │ rsiDivergency5m │
// │  741 │ PIXELUSDT    │ 2024 05 01 03:20:00 │ 2024 05 01 11:40:00 │ LONG         │ 0.70%  │ 18.38% │ 0.37       │ rsiDivergency5m │
// │  742 │ VANRYUSDT    │ 2024 05 01 03:20:00 │ 2024 05 01 11:40:00 │ LONG         │ 1.12%  │ 9.00%  │ 0.14       │ rsiDivergency5m │
// │  743 │ MANTAUSDT    │ 2024 05 01 03:45:00 │ 2024 05 01 12:05:00 │ LONG         │ 0.99%  │ 10.00% │ 1.53       │ rsiDivergency5m │
// │  744 │ DOGEUSDT     │ 2024 05 01 10:20:00 │ 2024 05 01 18:40:00 │ LONG         │ 1.87%  │ 46.71% │ 0.12       │ rsiDivergency5m │
// │  745 │ MANTAUSDT    │ 2024 05 01 13:50:00 │ 2024 05 01 22:10:00 │ SHORT        │ 1.18%  │ 11.17% │ 1.70       │ rsiDivergency5m │
// │  746 │ MTLUSDT      │ 2024 05 01 19:55:00 │ 2024 05 02 04:15:00 │ LONG         │ 0.18%  │ 46.88% │ 1.56       │ rsiDivergency5m │
// │  747 │ ARUSDT       │ 2024 05 02 06:50:00 │ 2024 05 02 07:10:00 │ SHORT        │ -0.51% │ 46.37% │ 31.20      │ rsiDivergency5m │
// │  748 │ 1000BONKUSDT │ 2024 05 02 06:55:00 │ 2024 05 02 07:05:00 │ SHORT        │ -0.51% │ 20.62% │ 0.02       │ rsiDivergency5m │
// │  749 │ 1000BONKUSDT │ 2024 05 02 07:10:00 │ 2024 05 02 09:35:00 │ SHORT        │ -0.51% │ 20.11% │ 0.03       │ rsiDivergency5m │
// │  750 │ ARUSDT       │ 2024 05 02 07:45:00 │ 2024 05 02 09:45:00 │ SHORT        │ -0.51% │ 45.86% │ 32.22      │ rsiDivergency5m │
// │  751 │ ARUSDT       │ 2024 05 02 10:10:00 │ 2024 05 02 12:15:00 │ SHORT        │ -0.51% │ 45.35% │ 33.12      │ rsiDivergency5m │
// │  752 │ ARUSDT       │ 2024 05 02 13:05:00 │ 2024 05 02 13:40:00 │ SHORT        │ -0.51% │ 44.83% │ 34.20      │ rsiDivergency5m │
// │  753 │ ALTUSDT      │ 2024 05 02 13:10:00 │ 2024 05 02 20:20:00 │ SHORT        │ -0.51% │ 14.90% │ 0.37       │ rsiDivergency5m │
// │  754 │ ARUSDT       │ 2024 05 02 15:05:00 │ 2024 05 02 23:25:00 │ SHORT        │ 1.07%  │ 45.91% │ 35.75      │ rsiDivergency5m │
// │  755 │ HIFIUSDT     │ 2024 05 03 11:35:00 │ 2024 05 03 17:40:00 │ SHORT        │ -0.51% │ 44.88% │ 0.81       │ rsiDivergency5m │
// │  756 │ OMNIUSDT     │ 2024 05 03 17:15:00 │ 2024 05 04 01:35:00 │ SHORT        │ 0.69%  │ 10.65% │ 19.84      │ rsiDivergency5m │
// │  757 │ CKBUSDT      │ 2024 05 03 18:35:00 │ 2024 05 03 19:05:00 │ SHORT        │ -0.51% │ 43.86% │ 0.02       │ rsiDivergency5m │
// │  758 │ CKBUSDT      │ 2024 05 03 19:10:00 │ 2024 05 04 03:30:00 │ SHORT        │ -0.06% │ 43.79% │ 0.02       │ rsiDivergency5m │
// │  759 │ DOGEUSDT     │ 2024 05 04 08:05:00 │ 2024 05 04 16:25:00 │ SHORT        │ 1.01%  │ 44.80% │ 0.17       │ rsiDivergency5m │
// │  760 │ LPTUSDT      │ 2024 05 05 05:25:00 │ 2024 05 05 13:45:00 │ SHORT        │ 0.25%  │ 44.03% │ 15.21      │ rsiDivergency5m │
// │  761 │ RSRUSDT      │ 2024 05 06 03:30:00 │ 2024 05 06 04:10:00 │ SHORT        │ -0.51% │ 43.58% │ 0.01       │ rsiDivergency5m │
// │  762 │ TAOUSDT      │ 2024 05 06 10:10:00 │ 2024 05 06 18:30:00 │ LONG         │ -0.14% │ 13.86% │ 444.00     │ rsiDivergency5m │
// │  763 │ CKBUSDT      │ 2024 05 06 16:55:00 │ 2024 05 07 01:15:00 │ SHORT        │ 0.68%  │ 42.72% │ 0.02       │ rsiDivergency5m │
// │  764 │ 1000SATSUSDT │ 2024 05 06 19:20:00 │ 2024 05 07 03:40:00 │ LONG         │ 0.68%  │ 19.17% │ 0.00       │ rsiDivergency5m │
// │  765 │ POWRUSDT     │ 2024 05 07 01:20:00 │ 2024 05 07 09:40:00 │ SHORT        │ 1.23%  │ 41.26% │ 0.36       │ rsiDivergency5m │
// │  766 │ AMBUSDT      │ 2024 05 07 14:35:00 │ 2024 05 07 18:05:00 │ LONG         │ -0.51% │ 41.98% │ 0.01       │ rsiDivergency5m │
// │  767 │ TOKENUSDT    │ 2024 05 07 17:15:00 │ 2024 05 07 19:25:00 │ LONG         │ -0.51% │ 37.09% │ 0.10       │ rsiDivergency5m │
// │  768 │ FRONTUSDT    │ 2024 05 08 07:00:00 │ 2024 05 08 07:15:00 │ SHORT        │ -0.51% │ 41.47% │ 1.55       │ rsiDivergency5m │
// │  769 │ ARPAUSDT     │ 2024 05 08 14:10:00 │ 2024 05 08 22:30:00 │ SHORT        │ 1.24%  │ 41.68% │ 0.07       │ rsiDivergency5m │
// │  770 │ NFPUSDT      │ 2024 05 09 21:10:00 │ 2024 05 09 21:30:00 │ SHORT        │ -0.51% │ 9.93%  │ 0.49       │ rsiDivergency5m │
// │  771 │ NFPUSDT      │ 2024 05 09 21:35:00 │ 2024 05 09 23:25:00 │ SHORT        │ -0.51% │ 9.42%  │ 0.50       │ rsiDivergency5m │
// │  772 │ ARUSDT       │ 2024 05 10 05:25:00 │ 2024 05 10 13:45:00 │ SHORT        │ 1.86%  │ 45.92% │ 44.72      │ rsiDivergency5m │
// │  773 │ ORDIUSDT     │ 2024 05 10 12:40:00 │ 2024 05 10 15:20:00 │ LONG         │ -0.51% │ 36.65% │ 35.99      │ rsiDivergency5m │
// │  774 │ XVGUSDT      │ 2024 05 11 13:45:00 │ 2024 05 11 14:55:00 │ SHORT        │ -0.51% │ 47.07% │ 0.01       │ rsiDivergency5m │
// │  775 │ FRONTUSDT    │ 2024 05 12 10:30:00 │ 2024 05 12 15:00:00 │ SHORT        │ -0.51% │ 46.56% │ 1.47       │ rsiDivergency5m │
// │  776 │ LEVERUSDT    │ 2024 05 12 20:20:00 │ 2024 05 12 21:00:00 │ LONG         │ -0.51% │ 46.04% │ 0.00       │ rsiDivergency5m │
// │  777 │ LEVERUSDT    │ 2024 05 12 21:10:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.51% │ 45.53% │ 0.00       │ rsiDivergency5m │
// │  778 │ XVGUSDT      │ 2024 05 12 22:30:00 │ 2024 05 13 06:50:00 │ LONG         │ -0.06% │ 45.47% │ 0.01       │ rsiDivergency5m │
// │  779 │ ARUSDT       │ 2024 05 13 09:15:00 │ 2024 05 13 17:35:00 │ SHORT        │ 1.06%  │ 46.53% │ 40.91      │ rsiDivergency5m │
// │  780 │ MYROUSDT     │ 2024 05 13 10:00:00 │ 2024 05 13 11:20:00 │ SHORT        │ -0.51% │ 21.87% │ 0.17       │ rsiDivergency5m │
// │  781 │ SAGAUSDT     │ 2024 05 13 10:30:00 │ 2024 05 13 13:20:00 │ LONG         │ -0.51% │ 13.01% │ 2.41       │ rsiDivergency5m │
// │  782 │ 1000BONKUSDT │ 2024 05 13 11:35:00 │ 2024 05 13 19:55:00 │ SHORT        │ 1.67%  │ 29.99% │ 0.03       │ rsiDivergency5m │
// │  783 │ POWRUSDT     │ 2024 05 13 16:55:00 │ 2024 05 13 21:35:00 │ LONG         │ -0.51% │ 45.39% │ 0.31       │ rsiDivergency5m │
// │  784 │ MYROUSDT     │ 2024 05 14 00:50:00 │ 2024 05 14 07:20:00 │ SHORT        │ -0.51% │ 20.24% │ 0.17       │ rsiDivergency5m │
// │  785 │ UMAUSDT      │ 2024 05 14 08:55:00 │ 2024 05 14 17:15:00 │ LONG         │ -0.20% │ 47.89% │ 3.70       │ rsiDivergency5m │
// │  786 │ WLDUSDT      │ 2024 05 14 19:30:00 │ 2024 05 14 20:15:00 │ SHORT        │ -0.51% │ 47.38% │ 4.87       │ rsiDivergency5m │
// │  787 │ FRONTUSDT    │ 2024 05 14 20:50:00 │ 2024 05 15 05:10:00 │ SHORT        │ 0.69%  │ 48.07% │ 1.20       │ rsiDivergency5m │
// │  788 │ LPTUSDT      │ 2024 05 15 05:20:00 │ 2024 05 15 07:30:00 │ SHORT        │ -0.51% │ 47.56% │ 18.24      │ rsiDivergency5m │
// │  789 │ GMXUSDT      │ 2024 05 15 09:25:00 │ 2024 05 15 10:00:00 │ SHORT        │ -0.51% │ 47.05% │ 30.20      │ rsiDivergency5m │
// │  790 │ LPTUSDT      │ 2024 05 15 09:45:00 │ 2024 05 15 18:05:00 │ SHORT        │ 0.77%  │ 47.81% │ 20.64      │ rsiDivergency5m │
// │  791 │ ALTUSDT      │ 2024 05 15 22:10:00 │ 2024 05 16 06:30:00 │ LONG         │ 0.06%  │ 4.01%  │ 0.31       │ rsiDivergency5m │
// │  792 │ TOKENUSDT    │ 2024 05 16 02:15:00 │ 2024 05 16 10:35:00 │ SHORT        │ 1.81%  │ 43.07% │ 0.10       │ rsiDivergency5m │
// │  793 │ ENAUSDT      │ 2024 05 16 09:25:00 │ 2024 05 16 09:50:00 │ LONG         │ -0.51% │ 10.12% │ 0.67       │ rsiDivergency5m │
// │  794 │ ENAUSDT      │ 2024 05 16 09:55:00 │ 2024 05 16 18:15:00 │ LONG         │ 0.27%  │ 10.38% │ 0.66       │ rsiDivergency5m │
// │  795 │ POLYXUSDT    │ 2024 05 17 02:55:00 │ 2024 05 17 04:30:00 │ SHORT        │ -0.51% │ 40.96% │ 0.42       │ rsiDivergency5m │
// │  796 │ LDOUSDT      │ 2024 05 17 03:15:00 │ 2024 05 17 07:45:00 │ SHORT        │ -0.51% │ 47.83% │ 1.78       │ rsiDivergency5m │
// │  797 │ STXUSDT      │ 2024 05 17 11:25:00 │ 2024 05 17 19:45:00 │ SHORT        │ 0.25%  │ 48.07% │ 2.12       │ rsiDivergency5m │
// │  798 │ TRUUSDT      │ 2024 05 17 20:25:00 │ 2024 05 17 23:05:00 │ SHORT        │ -0.51% │ 47.56% │ 0.13       │ rsiDivergency5m │
// │  799 │ ONDOUSDT     │ 2024 05 17 22:25:00 │ 2024 05 17 23:35:00 │ SHORT        │ -0.51% │ 4.81%  │ 1.01       │ rsiDivergency5m │
// │  800 │ POLYXUSDT    │ 2024 05 17 23:40:00 │ 2024 05 18 08:00:00 │ SHORT        │ 0.14%  │ 41.82% │ 0.46       │ rsiDivergency5m │
// │  801 │ FTMUSDT      │ 2024 05 18 01:45:00 │ 2024 05 18 06:40:00 │ SHORT        │ -0.51% │ 47.05% │ 0.87       │ rsiDivergency5m │
// │  802 │ 1000BONKUSDT │ 2024 05 18 17:05:00 │ 2024 05 18 20:50:00 │ SHORT        │ -0.51% │ 27.71% │ 0.03       │ rsiDivergency5m │
// │  803 │ AIUSDT       │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 0.94%  │ 7.48%  │ 0.97       │ rsiDivergency5m │
// │  804 │ YGGUSDT      │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 0.69%  │ 47.25% │ 0.83       │ rsiDivergency5m │
// │  805 │ PENDLEUSDT   │ 2024 05 20 15:40:00 │ 2024 05 20 17:15:00 │ SHORT        │ -0.51% │ 47.32% │ 5.99       │ rsiDivergency5m │
// │  806 │ PIXELUSDT    │ 2024 05 20 15:40:00 │ 2024 05 20 17:10:00 │ SHORT        │ -0.51% │ 12.14% │ 0.38       │ rsiDivergency5m │
// │  807 │ PORTALUSDT   │ 2024 05 20 16:05:00 │ 2024 05 20 19:10:00 │ SHORT        │ -0.51% │ 9.89%  │ 0.79       │ rsiDivergency5m │
// │  808 │ ENSUSDT      │ 2024 05 20 16:40:00 │ 2024 05 20 20:40:00 │ SHORT        │ -0.51% │ 46.80% │ 17.94      │ rsiDivergency5m │
// │  809 │ ACEUSDT      │ 2024 05 20 17:25:00 │ 2024 05 20 19:30:00 │ SHORT        │ -0.51% │ 17.86% │ 5.01       │ rsiDivergency5m │
// │  810 │ NTRNUSDT     │ 2024 05 20 17:35:00 │ 2024 05 21 01:55:00 │ SHORT        │ 0.11%  │ 36.28% │ 0.73       │ rsiDivergency5m │
// │  811 │ 1000BONKUSDT │ 2024 05 20 19:25:00 │ 2024 05 20 22:25:00 │ SHORT        │ -0.51% │ 28.79% │ 0.03       │ rsiDivergency5m │
// │  812 │ MANTAUSDT    │ 2024 05 20 19:30:00 │ 2024 05 21 03:50:00 │ SHORT        │ 0.12%  │ 3.99%  │ 1.68       │ rsiDivergency5m │
// │  813 │ NFPUSDT      │ 2024 05 20 19:30:00 │ 2024 05 21 03:50:00 │ SHORT        │ 0.05%  │ 18.90% │ 0.50       │ rsiDivergency5m │
// │  814 │ 1000BONKUSDT │ 2024 05 20 22:30:00 │ 2024 05 21 05:45:00 │ SHORT        │ -0.51% │ 28.28% │ 0.03       │ rsiDivergency5m │
// │  815 │ ARBUSDT      │ 2024 05 21 00:20:00 │ 2024 05 21 08:40:00 │ LONG         │ 2.21%  │ 49.01% │ 1.13       │ rsiDivergency5m │
// │  816 │ PIXELUSDT    │ 2024 05 21 04:25:00 │ 2024 05 21 12:45:00 │ SHORT        │ 0.63%  │ 10.72% │ 0.39       │ rsiDivergency5m │
// │  817 │ LRCUSDT      │ 2024 05 21 09:05:00 │ 2024 05 21 17:25:00 │ SHORT        │ 0.84%  │ 49.85% │ 0.30       │ rsiDivergency5m │
// │  818 │ 1000LUNCUSDT │ 2024 05 22 06:55:00 │ 2024 05 22 15:15:00 │ SHORT        │ 1.38%  │ 51.23% │ 0.12       │ rsiDivergency5m │
// │  819 │ ENAUSDT      │ 2024 05 22 10:45:00 │ 2024 05 22 19:05:00 │ SHORT        │ 0.18%  │ 8.66%  │ 0.86       │ rsiDivergency5m │
// │  820 │ 1000BONKUSDT │ 2024 05 23 06:55:00 │ 2024 05 23 15:00:00 │ SHORT        │ 2.49%  │ 34.31% │ 0.04       │ rsiDivergency5m │
// │  821 │ UMAUSDT      │ 2024 05 23 10:05:00 │ 2024 05 23 13:20:00 │ LONG         │ -0.51% │ 49.69% │ 3.36       │ rsiDivergency5m │
// │  822 │ GMTUSDT      │ 2024 05 23 13:00:00 │ 2024 05 23 15:00:00 │ LONG         │ -0.51% │ 49.18% │ 0.22       │ rsiDivergency5m │
// │  823 │ 1000SATSUSDT │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.24%  │ 24.23% │ 0.00       │ rsiDivergency5m │
// │  824 │ GMTUSDT      │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 2.13%  │ 51.31% │ 0.21       │ rsiDivergency5m │
// │  825 │ NTRNUSDT     │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.66%  │ 38.23% │ 0.66       │ rsiDivergency5m │
// │  826 │ ORDIUSDT     │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 0.98%  │ 44.84% │ 36.65      │ rsiDivergency5m │
// │  827 │ RIFUSDT      │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.04%  │ 48.09% │ 0.15       │ rsiDivergency5m │
// │  828 │ PORTALUSDT   │ 2024 05 23 19:50:00 │ 2024 05 23 22:10:00 │ SHORT        │ -0.51% │ 11.50% │ 0.85       │ rsiDivergency5m │
// │  829 │ NFPUSDT      │ 2024 05 23 22:50:00 │ 2024 05 24 07:10:00 │ SHORT        │ 1.08%  │ 22.73% │ 0.49       │ rsiDivergency5m │
// │  830 │ DEFIUSDT     │ 2024 05 23 23:40:00 │ 2024 05 24 08:00:00 │ SHORT        │ 0.15%  │ 51.46% │ 1019.60    │ rsiDivergency5m │
// │  831 │ MANTAUSDT    │ 2024 05 24 03:25:00 │ 2024 05 24 11:45:00 │ LONG         │ 0.77%  │ 9.54%  │ 1.66       │ rsiDivergency5m │
// │  832 │ LDOUSDT      │ 2024 05 24 09:55:00 │ 2024 05 24 18:15:00 │ SHORT        │ 1.25%  │ 52.70% │ 2.48       │ rsiDivergency5m │
// │  833 │ UMAUSDT      │ 2024 05 24 19:30:00 │ 2024 05 25 03:50:00 │ SHORT        │ 0.73%  │ 53.44% │ 3.67       │ rsiDivergency5m │
// │  834 │ TOKENUSDT    │ 2024 05 24 21:15:00 │ 2024 05 24 21:45:00 │ SHORT        │ -0.51% │ 43.52% │ 0.14       │ rsiDivergency5m │
// │  835 │ TOKENUSDT    │ 2024 05 24 21:55:00 │ 2024 05 25 06:15:00 │ SHORT        │ 0.58%  │ 44.09% │ 0.14       │ rsiDivergency5m │
// │  836 │ ENSUSDT      │ 2024 05 25 16:05:00 │ 2024 05 26 00:25:00 │ LONG         │ 1.07%  │ 54.29% │ 22.84      │ rsiDivergency5m │
// │  837 │ ONDOUSDT     │ 2024 05 25 21:05:00 │ 2024 05 26 05:25:00 │ SHORT        │ 0.62%  │ 7.19%  │ 1.32       │ rsiDivergency5m │
// │  838 │ VANRYUSDT    │ 2024 05 26 23:20:00 │ 2024 05 27 07:40:00 │ SHORT        │ 1.14%  │ 20.74% │ 0.21       │ rsiDivergency5m │
// │  839 │ ENSUSDT      │ 2024 05 28 05:45:00 │ 2024 05 28 06:35:00 │ SHORT        │ -0.51% │ 54.83% │ 26.95      │ rsiDivergency5m │
// │  840 │ 1000BONKUSDT │ 2024 05 28 05:50:00 │ 2024 05 28 07:20:00 │ SHORT        │ -0.51% │ 36.98% │ 0.04       │ rsiDivergency5m │
// │  841 │ ENSUSDT      │ 2024 05 28 08:20:00 │ 2024 05 28 16:40:00 │ SHORT        │ 2.07%  │ 56.90% │ 28.12      │ rsiDivergency5m │
// │  842 │ 1000SHIBUSDT │ 2024 05 28 22:15:00 │ 2024 05 28 22:40:00 │ SHORT        │ -0.51% │ 56.39% │ 0.03       │ rsiDivergency5m │
// │  843 │ TRUUSDT      │ 2024 05 29 00:55:00 │ 2024 05 29 01:00:00 │ SHORT        │ -0.51% │ 55.88% │ 0.23       │ rsiDivergency5m │
// │  844 │ AMBUSDT      │ 2024 05 29 22:35:00 │ 2024 05 30 02:50:00 │ SHORT        │ -0.51% │ 54.85% │ 0.01       │ rsiDivergency5m │
// │  845 │ 1000SHIBUSDT │ 2024 05 30 02:55:00 │ 2024 05 30 11:15:00 │ LONG         │ 0.44%  │ 55.29% │ 0.03       │ rsiDivergency5m │
// │  846 │ 1000BONKUSDT │ 2024 05 30 09:25:00 │ 2024 05 30 17:45:00 │ SHORT        │ 1.30%  │ 37.01% │ 0.04       │ rsiDivergency5m │
// │  847 │ WLDUSDT      │ 2024 05 30 16:20:00 │ 2024 05 31 00:20:00 │ LONG         │ -0.51% │ 53.76% │ 4.91       │ rsiDivergency5m │
// │  848 │ OMNIUSDT     │ 2024 05 31 07:35:00 │ 2024 05 31 07:50:00 │ SHORT        │ -0.51% │ 9.42%  │ 20.62      │ rsiDivergency5m │
// │  849 │ OMNIUSDT     │ 2024 05 31 08:00:00 │ 2024 05 31 08:10:00 │ SHORT        │ -0.51% │ 8.91%  │ 21.18      │ rsiDivergency5m │
// │  850 │ FXSUSDT      │ 2024 05 31 17:05:00 │ 2024 05 31 17:15:00 │ SHORT        │ -0.51% │ 54.73% │ 4.85       │ rsiDivergency5m │
// │  851 │ ONDOUSDT     │ 2024 06 01 19:20:00 │ 2024 06 02 03:40:00 │ SHORT        │ 0.83%  │ 8.77%  │ 1.43       │ rsiDivergency5m │
// │  852 │ PIXELUSDT    │ 2024 06 01 21:10:00 │ 2024 06 01 21:40:00 │ SHORT        │ -0.51% │ 9.46%  │ 0.50       │ rsiDivergency5m │
// │  853 │ TOKENUSDT    │ 2024 06 01 21:15:00 │ 2024 06 02 05:35:00 │ SHORT        │ 1.56%  │ 48.09% │ 0.16       │ rsiDivergency5m │
// │  854 │ TNSRUSDT     │ 2024 06 01 22:45:00 │ 2024 06 01 23:00:00 │ SHORT        │ -0.51% │ 15.24% │ 1.25       │ rsiDivergency5m │
// │  855 │ TNSRUSDT     │ 2024 06 01 23:10:00 │ 2024 06 02 01:25:00 │ SHORT        │ -0.51% │ 14.72% │ 1.27       │ rsiDivergency5m │
// │  856 │ VANRYUSDT    │ 2024 06 02 09:20:00 │ 2024 06 02 09:50:00 │ SHORT        │ -0.51% │ 7.84%  │ 0.21       │ rsiDivergency5m │
// │  857 │ VANRYUSDT    │ 2024 06 02 11:30:00 │ 2024 06 02 19:50:00 │ SHORT        │ 1.35%  │ 9.19%  │ 0.23       │ rsiDivergency5m │
// │  858 │ LPTUSDT      │ 2024 06 02 12:40:00 │ 2024 06 02 19:35:00 │ LONG         │ -0.51% │ 54.14% │ 21.66      │ rsiDivergency5m │
// │  859 │ NFPUSDT      │ 2024 06 02 14:35:00 │ 2024 06 02 15:05:00 │ SHORT        │ -0.51% │ 17.26% │ 0.58       │ rsiDivergency5m │
// │  860 │ TLMUSDT      │ 2024 06 02 20:25:00 │ 2024 06 02 22:30:00 │ SHORT        │ -0.51% │ 53.63% │ 0.02       │ rsiDivergency5m │
// │  861 │ ACEUSDT      │ 2024 06 02 22:50:00 │ 2024 06 03 07:10:00 │ SHORT        │ 0.49%  │ 30.61% │ 6.70       │ rsiDivergency5m │
// │  862 │ DARUSDT      │ 2024 06 02 23:40:00 │ 2024 06 02 23:45:00 │ SHORT        │ -0.51% │ 53.12% │ 0.20       │ rsiDivergency5m │
// │  863 │ MTLUSDT      │ 2024 06 02 23:40:00 │ 2024 06 03 08:00:00 │ LONG         │ 0.23%  │ 53.35% │ 1.57       │ rsiDivergency5m │
// │  864 │ HIGHUSDT     │ 2024 06 03 18:55:00 │ 2024 06 03 20:15:00 │ LONG         │ -0.51% │ 52.33% │ 6.60       │ rsiDivergency5m │
// │  865 │ PORTALUSDT   │ 2024 06 03 20:15:00 │ 2024 06 04 04:35:00 │ LONG         │ 0.88%  │ 15.87% │ 1.02       │ rsiDivergency5m │
// │  866 │ ALICEUSDT    │ 2024 06 04 08:00:00 │ 2024 06 04 16:20:00 │ LONG         │ 0.68%  │ 53.19% │ 2.12       │ rsiDivergency5m │
// │  867 │ 1000SATSUSDT │ 2024 06 04 14:00:00 │ 2024 06 04 22:20:00 │ SHORT        │ 0.60%  │ 26.36% │ 0.00       │ rsiDivergency5m │
// │  868 │ CKBUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 20:40:00 │ SHORT        │ -0.51% │ 52.17% │ 0.02       │ rsiDivergency5m │
// │  869 │ RIFUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 19:20:00 │ SHORT        │ -0.51% │ 54.78% │ 0.18       │ rsiDivergency5m │
// │  870 │ IDUSDT       │ 2024 06 04 21:30:00 │ 2024 06 05 05:50:00 │ SHORT        │ 0.70%  │ 52.86% │ 0.77       │ rsiDivergency5m │
// │  871 │ GMXUSDT      │ 2024 06 05 10:20:00 │ 2024 06 05 12:00:00 │ SHORT        │ -0.51% │ 50.81% │ 40.26      │ rsiDivergency5m │
// │  872 │ STXUSDT      │ 2024 06 05 12:05:00 │ 2024 06 05 12:55:00 │ SHORT        │ -0.51% │ 50.30% │ 2.39       │ rsiDivergency5m │
// │  873 │ GMXUSDT      │ 2024 06 05 13:05:00 │ 2024 06 05 21:25:00 │ SHORT        │ -0.02% │ 50.28% │ 42.39      │ rsiDivergency5m │
// │  874 │ DENTUSDT     │ 2024 06 05 23:40:00 │ 2024 06 06 08:00:00 │ LONG         │ -0.13% │ 49.64% │ 0.00       │ rsiDivergency5m │
// │  875 │ HIGHUSDT     │ 2024 06 07 08:45:00 │ 2024 06 07 09:00:00 │ SHORT        │ -0.51% │ 48.61% │ 8.30       │ rsiDivergency5m │
// │  876 │ HIGHUSDT     │ 2024 06 07 09:05:00 │ 2024 06 07 13:30:00 │ SHORT        │ -0.51% │ 48.10% │ 8.40       │ rsiDivergency5m │
// │  877 │ TOKENUSDT    │ 2024 06 07 11:15:00 │ 2024 06 07 12:20:00 │ LONG         │ -0.51% │ 47.07% │ 0.16       │ rsiDivergency5m │
// │  878 │ XVSUSDT      │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 1.98%  │ 50.08% │ 10.01      │ rsiDivergency5m │
// │  879 │ NKNUSDT      │ 2024 06 07 23:55:00 │ 2024 06 08 06:40:00 │ LONG         │ -0.51% │ 49.57% │ 0.11       │ rsiDivergency5m │
// │  880 │ ORDIUSDT     │ 2024 06 08 04:00:00 │ 2024 06 08 12:20:00 │ SHORT        │ 0.40%  │ 48.34% │ 62.27      │ rsiDivergency5m │
// │  881 │ CKBUSDT      │ 2024 06 08 07:30:00 │ 2024 06 08 08:20:00 │ LONG         │ -0.51% │ 49.05% │ 0.02       │ rsiDivergency5m │
// │  882 │ TRUUSDT      │ 2024 06 08 21:50:00 │ 2024 06 09 03:40:00 │ LONG         │ 2.49%  │ 51.03% │ 0.19       │ rsiDivergency5m │
// │  883 │ POLYXUSDT    │ 2024 06 08 22:15:00 │ 2024 06 09 06:35:00 │ LONG         │ 2.00%  │ 55.24% │ 0.42       │ rsiDivergency5m │
// │  884 │ HIFIUSDT     │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.24%  │ 52.72% │ 0.75       │ rsiDivergency5m │
// │  885 │ ENAUSDT      │ 2024 06 10 21:20:00 │ 2024 06 11 01:55:00 │ LONG         │ -0.51% │ 23.07% │ 0.75       │ rsiDivergency5m │
// │  886 │ BONDUSDT     │ 2024 06 10 21:25:00 │ 2024 06 11 05:45:00 │ LONG         │ 0.51%  │ 53.90% │ 2.74       │ rsiDivergency5m │
// │  887 │ TOKENUSDT    │ 2024 06 10 21:35:00 │ 2024 06 11 02:45:00 │ LONG         │ -0.51% │ 50.72% │ 0.12       │ rsiDivergency5m │
// │  888 │ OMNIUSDT     │ 2024 06 10 21:40:00 │ 2024 06 11 06:00:00 │ LONG         │ 0.50%  │ 14.71% │ 14.28      │ rsiDivergency5m │
// │  889 │ TNSRUSDT     │ 2024 06 11 01:25:00 │ 2024 06 11 06:55:00 │ LONG         │ -0.51% │ 21.44% │ 0.88       │ rsiDivergency5m │
// │  890 │ CKBUSDT      │ 2024 06 11 08:50:00 │ 2024 06 11 10:35:00 │ LONG         │ -0.51% │ 53.39% │ 0.01       │ rsiDivergency5m │
// │  891 │ INJUSDT      │ 2024 06 11 11:30:00 │ 2024 06 11 12:05:00 │ LONG         │ -0.51% │ 52.88% │ 26.25      │ rsiDivergency5m │
// │  892 │ ENAUSDT      │ 2024 06 11 12:25:00 │ 2024 06 11 20:40:00 │ LONG         │ -0.51% │ 22.90% │ 0.70       │ rsiDivergency5m │
// │  893 │ GMXUSDT      │ 2024 06 11 12:25:00 │ 2024 06 11 20:45:00 │ LONG         │ -0.13% │ 52.75% │ 34.10      │ rsiDivergency5m │
// │  894 │ ZETAUSDT     │ 2024 06 11 20:00:00 │ 2024 06 11 20:25:00 │ LONG         │ -0.51% │ 7.77%  │ 1.08       │ rsiDivergency5m │
// │  895 │ LPTUSDT      │ 2024 06 11 20:30:00 │ 2024 06 12 01:50:00 │ LONG         │ 2.49%  │ 55.24% │ 19.07      │ rsiDivergency5m │
// │  896 │ ORDIUSDT     │ 2024 06 11 20:30:00 │ 2024 06 12 04:50:00 │ LONG         │ 0.58%  │ 47.83% │ 50.54      │ rsiDivergency5m │
// │  897 │ ZETAUSDT     │ 2024 06 11 20:45:00 │ 2024 06 12 05:05:00 │ LONG         │ 0.96%  │ 8.73%  │ 1.05       │ rsiDivergency5m │
// │  898 │ 1000BONKUSDT │ 2024 06 12 01:40:00 │ 2024 06 12 03:10:00 │ SHORT        │ -0.51% │ 44.29% │ 0.03       │ rsiDivergency5m │
// │  899 │ MYROUSDT     │ 2024 06 12 03:00:00 │ 2024 06 12 07:30:00 │ SHORT        │ -0.51% │ 13.36% │ 0.21       │ rsiDivergency5m │
// │  900 │ VANRYUSDT    │ 2024 06 12 07:35:00 │ 2024 06 12 10:25:00 │ SHORT        │ -0.51% │ 11.63% │ 0.17       │ rsiDivergency5m │
// │  901 │ PENDLEUSDT   │ 2024 06 12 07:45:00 │ 2024 06 12 08:00:00 │ SHORT        │ -0.51% │ 54.21% │ 5.50       │ rsiDivergency5m │
// │  902 │ PENDLEUSDT   │ 2024 06 12 08:10:00 │ 2024 06 12 16:30:00 │ SHORT        │ 0.51%  │ 54.72% │ 5.57       │ rsiDivergency5m │
// │  903 │ VANRYUSDT    │ 2024 06 12 12:15:00 │ 2024 06 12 12:45:00 │ SHORT        │ -0.51% │ 11.12% │ 0.18       │ rsiDivergency5m │
// │  904 │ TNSRUSDT     │ 2024 06 12 22:10:00 │ 2024 06 13 06:30:00 │ LONG         │ 0.60%  │ 22.84% │ 0.81       │ rsiDivergency5m │
// │  905 │ POLYXUSDT    │ 2024 06 13 10:45:00 │ 2024 06 13 11:00:00 │ LONG         │ -0.51% │ 52.68% │ 0.46       │ rsiDivergency5m │
// │  906 │ TOKENUSDT    │ 2024 06 13 11:00:00 │ 2024 06 13 19:20:00 │ LONG         │ -0.22% │ 53.22% │ 0.10       │ rsiDivergency5m │
// │  907 │ KNCUSDT      │ 2024 06 13 19:25:00 │ 2024 06 14 03:45:00 │ LONG         │ 1.63%  │ 56.37% │ 0.72       │ rsiDivergency5m │
// │  908 │ KNCUSDT      │ 2024 06 14 04:30:00 │ 2024 06 14 07:15:00 │ SHORT        │ -0.51% │ 55.85% │ 0.79       │ rsiDivergency5m │
// │  909 │ ONGUSDT      │ 2024 06 14 10:50:00 │ 2024 06 14 11:05:00 │ LONG         │ -0.51% │ 44.37% │ 0.37       │ rsiDivergency5m │
// │  910 │ BIGTIMEUSDT  │ 2024 06 14 11:10:00 │ 2024 06 14 13:20:00 │ LONG         │ -0.51% │ 55.34% │ 0.14       │ rsiDivergency5m │
// │  911 │ MANTAUSDT    │ 2024 06 14 11:10:00 │ 2024 06 14 11:35:00 │ LONG         │ -0.51% │ 24.70% │ 1.28       │ rsiDivergency5m │
// │  912 │ RIFUSDT      │ 2024 06 14 11:30:00 │ 2024 06 14 19:50:00 │ LONG         │ 0.44%  │ 51.47% │ 0.13       │ rsiDivergency5m │
// │  913 │ TOKENUSDT    │ 2024 06 14 11:35:00 │ 2024 06 14 19:55:00 │ LONG         │ 0.59%  │ 53.85% │ 0.09       │ rsiDivergency5m │
// │  914 │ MANTAUSDT    │ 2024 06 14 11:45:00 │ 2024 06 14 13:20:00 │ LONG         │ -0.51% │ 24.19% │ 1.25       │ rsiDivergency5m │
// │  915 │ PENDLEUSDT   │ 2024 06 14 13:15:00 │ 2024 06 14 21:35:00 │ LONG         │ 1.28%  │ 56.62% │ 4.69       │ rsiDivergency5m │
// │  916 │ ETHFIUSDT    │ 2024 06 14 19:50:00 │ 2024 06 15 01:05:00 │ SHORT        │ -0.51% │ 14.61% │ 3.73       │ rsiDivergency5m │
// │  917 │ 1000SHIBUSDT │ 2024 06 14 23:55:00 │ 2024 06 15 08:15:00 │ SHORT        │ -0.06% │ 56.55% │ 0.02       │ rsiDivergency5m │
// │  918 │ RIFUSDT      │ 2024 06 15 15:20:00 │ 2024 06 15 23:40:00 │ LONG         │ 0.68%  │ 53.40% │ 0.11       │ rsiDivergency5m │
// │  919 │ LDOUSDT      │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 1.01%  │ 58.81% │ 2.24       │ rsiDivergency5m │
// │  920 │ ROSEUSDT     │ 2024 06 16 22:25:00 │ 2024 06 17 02:35:00 │ LONG         │ -0.51% │ 58.30% │ 0.11       │ rsiDivergency5m │
// │  921 │ KNCUSDT      │ 2024 06 17 01:55:00 │ 2024 06 17 03:05:00 │ LONG         │ -0.51% │ 57.78% │ 0.68       │ rsiDivergency5m │
// │  922 │ USTCUSDT     │ 2024 06 17 03:05:00 │ 2024 06 17 05:00:00 │ LONG         │ -0.51% │ 42.56% │ 0.02       │ rsiDivergency5m │
// │  923 │ KNCUSDT      │ 2024 06 17 03:10:00 │ 2024 06 17 03:30:00 │ LONG         │ -0.51% │ 57.27% │ 0.67       │ rsiDivergency5m │
// │  924 │ WUSDT        │ 2024 06 17 03:50:00 │ 2024 06 17 05:00:00 │ LONG         │ -0.51% │ 20.23% │ 0.41       │ rsiDivergency5m │
// │  925 │ POLYXUSDT    │ 2024 06 17 04:50:00 │ 2024 06 17 10:30:00 │ LONG         │ -0.51% │ 48.54% │ 0.36       │ rsiDivergency5m │
// │  926 │ LSKUSDT      │ 2024 06 17 04:55:00 │ 2024 06 17 13:15:00 │ LONG         │ 1.25%  │ 18.86% │ 1.01       │ rsiDivergency5m │
// │  927 │ STRKUSDT     │ 2024 06 17 04:55:00 │ 2024 06 17 05:05:00 │ LONG         │ -0.51% │ 2.84%  │ 0.83       │ rsiDivergency5m │
// │  928 │ WUSDT        │ 2024 06 17 05:05:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 19.71% │ 0.40       │ rsiDivergency5m │
// │  929 │ PIXELUSDT    │ 2024 06 17 05:10:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 2.33%  │ 0.32       │ rsiDivergency5m │
// │  930 │ POWRUSDT     │ 2024 06 17 05:10:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 49.12% │ 0.22       │ rsiDivergency5m │
// │  931 │ USTCUSDT     │ 2024 06 17 05:15:00 │ 2024 06 17 08:45:00 │ LONG         │ -0.51% │ 42.04% │ 0.02       │ rsiDivergency5m │
// │  932 │ BIGTIMEUSDT  │ 2024 06 17 05:20:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 56.76% │ 0.13       │ rsiDivergency5m │
// │  933 │ KNCUSDT      │ 2024 06 17 10:55:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 56.25% │ 0.62       │ rsiDivergency5m │
// │  934 │ BIGTIMEUSDT  │ 2024 06 17 20:25:00 │ 2024 06 17 20:35:00 │ LONG         │ -0.51% │ 55.73% │ 0.12       │ rsiDivergency5m │
// │  935 │ ENAUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 18.18% │ 0.63       │ rsiDivergency5m │
// │  936 │ MAVUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 55.22% │ 0.32       │ rsiDivergency5m │
// │  937 │ NTRNUSDT     │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 47.58% │ 0.54       │ rsiDivergency5m │
// │  938 │ PIXELUSDT    │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 1.30%  │ 0.30       │ rsiDivergency5m │
// │  939 │ PORTALUSDT   │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 7.99%  │ 0.52       │ rsiDivergency5m │
// │  940 │ RNDRUSDT     │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 54.71% │ 7.35       │ rsiDivergency5m │
// │  941 │ TOKENUSDT    │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 55.36% │ 0.08       │ rsiDivergency5m │
// │  942 │ USTCUSDT     │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 42.21% │ 0.02       │ rsiDivergency5m │
// │  943 │ ONGUSDT      │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 0.29%  │ 42.50% │ 0.28       │ rsiDivergency5m │
// │  944 │ TUSDT        │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 0.88%  │ 55.59% │ 0.02       │ rsiDivergency5m │
// │  945 │ WAXPUSDT     │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 1.76%  │ 57.80% │ 0.04       │ rsiDivergency5m │
// │  946 │ FETUSDT      │ 2024 06 18 05:20:00 │ 2024 06 18 06:10:00 │ LONG         │ -0.51% │ 55.08% │ 1.16       │ rsiDivergency5m │
// │  947 │ MTLUSDT      │ 2024 06 18 05:50:00 │ 2024 06 18 14:10:00 │ SHORT        │ 1.42%  │ 56.50% │ 1.05       │ rsiDivergency5m │
// │  948 │ NTRNUSDT     │ 2024 06 18 06:30:00 │ 2024 06 18 09:05:00 │ LONG         │ -0.51% │ 46.56% │ 0.51       │ rsiDivergency5m │
// │  949 │ CRVUSDT      │ 2024 06 18 15:50:00 │ 2024 06 18 16:30:00 │ SHORT        │ -0.51% │ 55.98% │ 0.32       │ rsiDivergency5m │
// │  950 │ CRVUSDT      │ 2024 06 18 17:20:00 │ 2024 06 18 19:45:00 │ SHORT        │ -0.51% │ 55.47% │ 0.33       │ rsiDivergency5m │
// │  951 │ ENSUSDT      │ 2024 06 18 20:30:00 │ 2024 06 18 21:20:00 │ SHORT        │ -0.51% │ 54.96% │ 26.56      │ rsiDivergency5m │
// │  952 │ STXUSDT      │ 2024 06 18 23:15:00 │ 2024 06 19 07:35:00 │ SHORT        │ 0.57%  │ 55.53% │ 1.71       │ rsiDivergency5m │
// │  953 │ LDOUSDT      │ 2024 06 19 10:40:00 │ 2024 06 19 19:00:00 │ LONG         │ 0.84%  │ 56.37% │ 2.25       │ rsiDivergency5m │
// │  954 │ BONDUSDT     │ 2024 06 19 22:35:00 │ 2024 06 19 23:20:00 │ SHORT        │ -0.51% │ 55.86% │ 2.11       │ rsiDivergency5m │
// │  955 │ LPTUSDT      │ 2024 06 20 03:25:00 │ 2024 06 20 11:45:00 │ SHORT        │ 1.35%  │ 56.70% │ 19.93      │ rsiDivergency5m │
// │  956 │ WLDUSDT      │ 2024 06 20 14:00:00 │ 2024 06 20 22:20:00 │ SHORT        │ 0.69%  │ 57.39% │ 3.08       │ rsiDivergency5m │
// │  957 │ MTLUSDT      │ 2024 06 20 22:00:00 │ 2024 06 20 23:40:00 │ SHORT        │ -0.51% │ 56.88% │ 1.22       │ rsiDivergency5m │
// │  958 │ MTLUSDT      │ 2024 06 20 23:45:00 │ 2024 06 21 01:00:00 │ SHORT        │ -0.51% │ 56.36% │ 1.26       │ rsiDivergency5m │
// │  959 │ MTLUSDT      │ 2024 06 21 02:10:00 │ 2024 06 21 10:20:00 │ SHORT        │ 2.49%  │ 58.85% │ 1.33       │ rsiDivergency5m │
// │  960 │ ONGUSDT      │ 2024 06 21 13:05:00 │ 2024 06 21 21:25:00 │ LONG         │ 1.66%  │ 47.58% │ 0.34       │ rsiDivergency5m │
// │  961 │ 1000LUNCUSDT │ 2024 06 21 23:30:00 │ 2024 06 21 23:50:00 │ LONG         │ -0.51% │ 58.34% │ 0.08       │ rsiDivergency5m │
// │  962 │ 1000LUNCUSDT │ 2024 06 21 23:55:00 │ 2024 06 22 00:50:00 │ LONG         │ -0.51% │ 57.83% │ 0.08       │ rsiDivergency5m │
// │  963 │ 1000LUNCUSDT │ 2024 06 22 01:05:00 │ 2024 06 22 01:10:00 │ LONG         │ -0.51% │ 57.31% │ 0.08       │ rsiDivergency5m │
// │  964 │ GASUSDT      │ 2024 06 22 03:25:00 │ 2024 06 22 11:45:00 │ LONG         │ 0.01%  │ 54.74% │ 3.67       │ rsiDivergency5m │
// │  965 │ 1000SATSUSDT │ 2024 06 22 11:40:00 │ 2024 06 22 11:55:00 │ SHORT        │ -0.51% │ 39.55% │ 0.00       │ rsiDivergency5m │
// │  966 │ 1000SATSUSDT │ 2024 06 22 12:00:00 │ 2024 06 22 20:20:00 │ SHORT        │ 0.48%  │ 40.03% │ 0.00       │ rsiDivergency5m │
// │  967 │ MTLUSDT      │ 2024 06 23 01:00:00 │ 2024 06 23 01:10:00 │ SHORT        │ -0.51% │ 56.75% │ 1.25       │ rsiDivergency5m │
// │  968 │ MTLUSDT      │ 2024 06 23 09:50:00 │ 2024 06 23 11:00:00 │ LONG         │ -0.51% │ 56.24% │ 1.22       │ rsiDivergency5m │
// │  969 │ VANRYUSDT    │ 2024 06 23 10:25:00 │ 2024 06 23 11:55:00 │ LONG         │ -0.51% │ 10.37% │ 0.14       │ rsiDivergency5m │
// │  970 │ FRONTUSDT    │ 2024 06 23 12:05:00 │ 2024 06 23 15:20:00 │ LONG         │ -0.51% │ 55.73% │ 0.85       │ rsiDivergency5m │
// │  971 │ TRUUSDT      │ 2024 06 23 17:10:00 │ 2024 06 23 18:15:00 │ LONG         │ -0.51% │ 55.21% │ 0.13       │ rsiDivergency5m │
// │  972 │ TRUUSDT      │ 2024 06 23 18:20:00 │ 2024 06 24 00:05:00 │ LONG         │ -0.51% │ 54.70% │ 0.13       │ rsiDivergency5m │
// │  973 │ DODOXUSDT    │ 2024 06 24 02:10:00 │ 2024 06 24 02:45:00 │ LONG         │ -0.51% │ 54.19% │ 0.12       │ rsiDivergency5m │
// │  974 │ SUIUSDT      │ 2024 06 24 03:15:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.51% │ 53.68% │ 0.82       │ rsiDivergency5m │
// │  975 │ RDNTUSDT     │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 1.15%  │ 54.82% │ 0.12       │ rsiDivergency5m │
// │  976 │ ORDIUSDT     │ 2024 06 24 04:45:00 │ 2024 06 24 10:40:00 │ LONG         │ -0.51% │ 52.68% │ 35.30      │ rsiDivergency5m │
// │  977 │ POLYXUSDT    │ 2024 06 24 04:45:00 │ 2024 06 24 09:55:00 │ LONG         │ -0.51% │ 56.04% │ 0.30       │ rsiDivergency5m │
// │  978 │ LDOUSDT      │ 2024 06 24 15:55:00 │ 2024 06 24 16:15:00 │ SHORT        │ -0.51% │ 54.31% │ 2.40       │ rsiDivergency5m │
// │  979 │ LDOUSDT      │ 2024 06 24 16:20:00 │ 2024 06 25 00:40:00 │ SHORT        │ 0.07%  │ 54.38% │ 2.42       │ rsiDivergency5m │
// │  980 │ TNSRUSDT     │ 2024 06 24 18:25:00 │ 2024 06 24 22:05:00 │ SHORT        │ -0.51% │ 16.77% │ 0.61       │ rsiDivergency5m │
// │  981 │ STXUSDT      │ 2024 06 25 07:00:00 │ 2024 06 25 09:20:00 │ SHORT        │ -0.51% │ 53.87% │ 1.71       │ rsiDivergency5m │
// │  982 │ STXUSDT      │ 2024 06 25 17:05:00 │ 2024 06 26 01:25:00 │ SHORT        │ 0.82%  │ 54.69% │ 1.79       │ rsiDivergency5m │
// │  983 │ FETUSDT      │ 2024 06 26 21:10:00 │ 2024 06 26 21:55:00 │ LONG         │ -0.51% │ 52.64% │ 1.67       │ rsiDivergency5m │
// │  984 │ ENSUSDT      │ 2024 06 27 04:30:00 │ 2024 06 27 05:30:00 │ SHORT        │ -0.51% │ 52.13% │ 25.94      │ rsiDivergency5m │
// │  985 │ 1000SATSUSDT │ 2024 06 27 05:35:00 │ 2024 06 27 06:15:00 │ SHORT        │ -0.51% │ 44.88% │ 0.00       │ rsiDivergency5m │
// │  986 │ 1000SATSUSDT │ 2024 06 27 06:20:00 │ 2024 06 27 06:55:00 │ SHORT        │ -0.51% │ 44.37% │ 0.00       │ rsiDivergency5m │
// │  987 │ LEVERUSDT    │ 2024 06 27 06:25:00 │ 2024 06 27 06:40:00 │ SHORT        │ -0.51% │ 51.61% │ 0.00       │ rsiDivergency5m │
// │  988 │ 1000SATSUSDT │ 2024 06 27 07:00:00 │ 2024 06 27 07:15:00 │ SHORT        │ -0.51% │ 43.86% │ 0.00       │ rsiDivergency5m │
// │  989 │ LEVERUSDT    │ 2024 06 27 07:00:00 │ 2024 06 27 07:05:00 │ SHORT        │ -0.51% │ 51.10% │ 0.00       │ rsiDivergency5m │
// │  990 │ LEVERUSDT    │ 2024 06 27 07:15:00 │ 2024 06 27 07:25:00 │ SHORT        │ -0.51% │ 50.59% │ 0.00       │ rsiDivergency5m │
// │  991 │ LEVERUSDT    │ 2024 06 27 07:50:00 │ 2024 06 27 13:25:00 │ SHORT        │ -0.51% │ 50.08% │ 0.00       │ rsiDivergency5m │
// │  992 │ TNSRUSDT     │ 2024 06 27 08:20:00 │ 2024 06 27 08:40:00 │ SHORT        │ -0.51% │ 12.97% │ 0.63       │ rsiDivergency5m │
// │  993 │ TNSRUSDT     │ 2024 06 27 08:45:00 │ 2024 06 27 09:10:00 │ SHORT        │ -0.51% │ 12.45% │ 0.64       │ rsiDivergency5m │
// │  994 │ TNSRUSDT     │ 2024 06 27 09:15:00 │ 2024 06 27 11:05:00 │ SHORT        │ -0.51% │ 11.94% │ 0.65       │ rsiDivergency5m │
// │  995 │ LEVERUSDT    │ 2024 06 27 14:00:00 │ 2024 06 27 22:20:00 │ SHORT        │ -0.06% │ 50.02% │ 0.00       │ rsiDivergency5m │
// │  996 │ FETUSDT      │ 2024 06 27 22:05:00 │ 2024 06 27 23:25:00 │ LONG         │ -0.51% │ 49.51% │ 1.50       │ rsiDivergency5m │
// │  997 │ FETUSDT      │ 2024 06 28 00:10:00 │ 2024 06 28 08:30:00 │ LONG         │ 0.43%  │ 49.94% │ 1.45       │ rsiDivergency5m │
// │  998 │ YFIUSDT      │ 2024 06 28 13:55:00 │ 2024 06 28 18:50:00 │ SHORT        │ -0.51% │ 49.43% │ 6207.00    │ rsiDivergency5m │
// │  999 │ ARPAUSDT     │ 2024 06 29 19:55:00 │ 2024 06 30 04:15:00 │ LONG         │ 1.62%  │ 54.57% │ 0.04       │ rsiDivergency5m │
// │ 1000 │ NTRNUSDT     │ 2024 06 30 06:35:00 │ 2024 06 30 08:00:00 │ LONG         │ -0.51% │ 54.22% │ 0.48       │ rsiDivergency5m │
// │ 1001 │ NTRNUSDT     │ 2024 06 30 08:20:00 │ 2024 06 30 12:00:00 │ LONG         │ -0.51% │ 53.71% │ 0.47       │ rsiDivergency5m │
// │ 1002 │ NTRNUSDT     │ 2024 06 30 12:05:00 │ 2024 06 30 16:10:00 │ LONG         │ -0.51% │ 53.19% │ 0.46       │ rsiDivergency5m │
// │ 1003 │ ENSUSDT      │ 2024 06 30 15:45:00 │ 2024 06 30 17:35:00 │ SHORT        │ -0.51% │ 54.06% │ 29.45      │ rsiDivergency5m │
// │ 1004 │ ENSUSDT      │ 2024 06 30 17:40:00 │ 2024 06 30 18:20:00 │ SHORT        │ -0.51% │ 53.55% │ 30.22      │ rsiDivergency5m │
// │ 1005 │ ENSUSDT      │ 2024 06 30 18:30:00 │ 2024 06 30 19:00:00 │ SHORT        │ -0.51% │ 53.03% │ 30.62      │ rsiDivergency5m │
// │ 1006 │ ENSUSDT      │ 2024 06 30 19:05:00 │ 2024 06 30 19:15:00 │ SHORT        │ -0.51% │ 52.52% │ 30.70      │ rsiDivergency5m │
// │ 1007 │ VANRYUSDT    │ 2024 06 30 20:45:00 │ 2024 06 30 20:55:00 │ SHORT        │ -0.51% │ 5.43%  │ 0.14       │ rsiDivergency5m │
// │ 1008 │ TRUUSDT      │ 2024 06 30 21:00:00 │ 2024 07 01 05:20:00 │ SHORT        │ 0.63%  │ 53.15% │ 0.13       │ rsiDivergency5m │
// │ 1009 │ VANRYUSDT    │ 2024 06 30 21:10:00 │ 2024 07 01 05:30:00 │ SHORT        │ 0.78%  │ 6.22%  │ 0.15       │ rsiDivergency5m │
// │ 1010 │ WLDUSDT      │ 2024 07 01 12:20:00 │ 2024 07 01 20:40:00 │ SHORT        │ 0.72%  │ 53.87% │ 2.34       │ rsiDivergency5m │
// │ 1011 │ ETHFIUSDT    │ 2024 07 01 19:10:00 │ 2024 07 01 21:00:00 │ LONG         │ -0.51% │ 10.66% │ 2.87       │ rsiDivergency5m │
// │ 1012 │ ETHFIUSDT    │ 2024 07 01 21:05:00 │ 2024 07 01 22:15:00 │ LONG         │ -0.51% │ 10.15% │ 2.78       │ rsiDivergency5m │
// │ 1013 │ ETHFIUSDT    │ 2024 07 01 22:20:00 │ 2024 07 02 06:40:00 │ LONG         │ -0.03% │ 10.12% │ 2.73       │ rsiDivergency5m │
// │ 1014 │ LDOUSDT      │ 2024 07 02 22:35:00 │ 2024 07 02 22:45:00 │ LONG         │ -0.51% │ 55.85% │ 1.84       │ rsiDivergency5m │
// │ 1015 │ ALTUSDT      │ 2024 07 03 01:15:00 │ 2024 07 03 09:35:00 │ SHORT        │ 0.80%  │ 20.32% │ 0.15       │ rsiDivergency5m │
// │ 1016 │ INJUSDT      │ 2024 07 03 07:10:00 │ 2024 07 03 14:55:00 │ LONG         │ -0.51% │ 56.19% │ 21.38      │ rsiDivergency5m │
// │ 1017 │ 1000BONKUSDT │ 2024 07 03 07:40:00 │ 2024 07 03 10:55:00 │ LONG         │ -0.51% │ 53.78% │ 0.02       │ rsiDivergency5m │
// │ 1018 │ 1000BONKUSDT │ 2024 07 03 11:10:00 │ 2024 07 03 13:00:00 │ LONG         │ -0.51% │ 53.27% │ 0.02       │ rsiDivergency5m │
// │ 1019 │ ENSUSDT      │ 2024 07 03 17:30:00 │ 2024 07 03 20:10:00 │ LONG         │ -0.51% │ 55.68% │ 25.33      │ rsiDivergency5m │
// │ 1020 │ ENSUSDT      │ 2024 07 03 20:35:00 │ 2024 07 04 04:55:00 │ LONG         │ 1.89%  │ 57.57% │ 24.46      │ rsiDivergency5m │
// │ 1021 │ REZUSDT      │ 2024 07 03 20:45:00 │ 2024 07 04 05:05:00 │ LONG         │ 0.55%  │ 21.99% │ 0.07       │ rsiDivergency5m │
// │ 1022 │ SUPERUSDT    │ 2024 07 03 21:10:00 │ 2024 07 04 02:15:00 │ LONG         │ -0.51% │ 50.21% │ 0.59       │ rsiDivergency5m │
// │ 1023 │ ROSEUSDT     │ 2024 07 04 05:20:00 │ 2024 07 04 08:00:00 │ LONG         │ -0.51% │ 57.06% │ 0.09       │ rsiDivergency5m │
// │ 1024 │ LRCUSDT      │ 2024 07 04 08:05:00 │ 2024 07 04 16:25:00 │ LONG         │ 0.29%  │ 57.35% │ 0.15       │ rsiDivergency5m │
// │ 1025 │ 1000SATSUSDT │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 40.45% │ 0.00       │ rsiDivergency5m │
// │ 1026 │ ALTUSDT      │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 21.23% │ 0.13       │ rsiDivergency5m │
// │ 1027 │ ENAUSDT      │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 10.18% │ 0.38       │ rsiDivergency5m │
// │ 1028 │ LOOMUSDT     │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 56.84% │ 0.04       │ rsiDivergency5m │
// │ 1029 │ POLYXUSDT    │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 54.18% │ 0.21       │ rsiDivergency5m │
// │ 1030 │ MAVUSDT      │ 2024 07 04 20:25:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 56.33% │ 0.19       │ rsiDivergency5m │
// │ 1031 │ ORDIUSDT     │ 2024 07 04 20:25:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 54.72% │ 28.48      │ rsiDivergency5m │
// │ 1032 │ VANRYUSDT    │ 2024 07 04 20:25:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 2.35%  │ 0.10       │ rsiDivergency5m │
// │ 1033 │ ETHFIUSDT    │ 2024 07 04 20:35:00 │ 2024 07 04 21:50:00 │ LONG         │ -0.51% │ 9.02%  │ 1.91       │ rsiDivergency5m │
// │ 1034 │ NTRNUSDT     │ 2024 07 04 20:35:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 52.35% │ 0.37       │ rsiDivergency5m │
// │ 1035 │ MYROUSDT     │ 2024 07 04 21:30:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 5.19%  │ 0.09       │ rsiDivergency5m │
// │ 1036 │ BEAMXUSDT    │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 52.17% │ 0.01       │ rsiDivergency5m │
// │ 1037 │ GASUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 53.66% │ 2.82       │ rsiDivergency5m │
// │ 1038 │ LSKUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 20.71% │ 0.75       │ rsiDivergency5m │
// │ 1039 │ NTRNUSDT     │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 51.84% │ 0.35       │ rsiDivergency5m │
// │ 1040 │ SKLUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 54.79% │ 0.04       │ rsiDivergency5m │
// │ 1041 │ UMAUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 55.82% │ 1.76       │ rsiDivergency5m │
// │ 1042 │ BEAMXUSDT    │ 2024 07 04 22:10:00 │ 2024 07 05 06:15:00 │ LONG         │ 2.49%  │ 54.66% │ 0.01       │ rsiDivergency5m │
// │ 1043 │ GASUSDT      │ 2024 07 04 22:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.51% │ 53.15% │ 2.77       │ rsiDivergency5m │
// │ 1044 │ LSKUSDT      │ 2024 07 04 22:10:00 │ 2024 07 05 06:30:00 │ LONG         │ 1.79%  │ 22.50% │ 0.74       │ rsiDivergency5m │
// │ 1045 │ NTRNUSDT     │ 2024 07 04 22:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.51% │ 51.33% │ 0.34       │ rsiDivergency5m │
// │ 1046 │ SKLUSDT      │ 2024 07 04 22:10:00 │ 2024 07 05 06:30:00 │ LONG         │ 1.44%  │ 56.23% │ 0.04       │ rsiDivergency5m │
// │ 1047 │ XVGUSDT      │ 2024 07 04 22:15:00 │ 2024 07 04 23:05:00 │ LONG         │ -0.51% │ 55.30% │ 0.00       │ rsiDivergency5m │
// │ 1048 │ SXPUSDT      │ 2024 07 05 06:15:00 │ 2024 07 05 07:30:00 │ SHORT        │ -0.51% │ 55.72% │ 0.21       │ rsiDivergency5m │
// │ 1049 │ 1000BONKUSDT │ 2024 07 05 06:30:00 │ 2024 07 05 07:20:00 │ SHORT        │ -0.51% │ 56.37% │ 0.02       │ rsiDivergency5m │
// │ 1050 │ LSKUSDT      │ 2024 07 05 06:45:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.51% │ 21.99% │ 0.80       │ rsiDivergency5m │
// │ 1051 │ TAOUSDT      │ 2024 07 05 07:25:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.51% │ 9.89%  │ 215.70     │ rsiDivergency5m │
// │ 1052 │ EGLDUSDT     │ 2024 07 05 07:45:00 │ 2024 07 05 08:35:00 │ SHORT        │ -0.51% │ 55.21% │ 31.80      │ rsiDivergency5m │
// │ 1053 │ DEFIUSDT     │ 2024 07 05 08:40:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.51% │ 54.70% │ 669.60     │ rsiDivergency5m │
// │ 1054 │ 1000BONKUSDT │ 2024 07 05 09:40:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.51% │ 55.85% │ 0.02       │ rsiDivergency5m │
// │ 1055 │ 1000BONKUSDT │ 2024 07 05 10:10:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.51% │ 55.34% │ 0.02       │ rsiDivergency5m │
// │ 1056 │ NTRNUSDT     │ 2024 07 05 10:35:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.51% │ 49.77% │ 0.35       │ rsiDivergency5m │
// │ 1057 │ YFIUSDT      │ 2024 07 05 11:50:00 │ 2024 07 05 20:10:00 │ SHORT        │ 0.09%  │ 54.78% │ 6290.00    │ rsiDivergency5m │
// │ 1058 │ HIGHUSDT     │ 2024 07 06 11:25:00 │ 2024 07 06 14:15:00 │ SHORT        │ -0.51% │ 56.28% │ 1.54       │ rsiDivergency5m │
// │ 1059 │ DOTUSDT      │ 2024 07 06 13:15:00 │ 2024 07 06 21:35:00 │ SHORT        │ 0.16%  │ 56.44% │ 6.26       │ rsiDivergency5m │
// │ 1060 │ ETHFIUSDT    │ 2024 07 06 14:00:00 │ 2024 07 06 17:15:00 │ SHORT        │ -0.51% │ 5.70%  │ 1.97       │ rsiDivergency5m │
// │ 1061 │ ACEUSDT      │ 2024 07 06 14:05:00 │ 2024 07 06 17:00:00 │ SHORT        │ -0.51% │ 43.77% │ 2.64       │ rsiDivergency5m │
// │ 1062 │ TNSRUSDT     │ 2024 07 06 20:25:00 │ 2024 07 07 04:45:00 │ LONG         │ 0.69%  │ 13.29% │ 0.40       │ rsiDivergency5m │
// │ 1063 │ DODOXUSDT    │ 2024 07 06 23:40:00 │ 2024 07 07 08:00:00 │ LONG         │ 0.17%  │ 56.61% │ 0.11       │ rsiDivergency5m │
// │ 1064 │ SAGAUSDT     │ 2024 07 07 07:10:00 │ 2024 07 07 07:20:00 │ SHORT        │ -0.51% │ 15.13% │ 1.32       │ rsiDivergency5m │
// │ 1065 │ 1000SHIBUSDT │ 2024 07 07 08:40:00 │ 2024 07 07 17:00:00 │ LONG         │ 0.05%  │ 56.66% │ 0.02       │ rsiDivergency5m │
// │ 1066 │ USTCUSDT     │ 2024 07 07 11:40:00 │ 2024 07 07 19:35:00 │ SHORT        │ 2.49%  │ 56.34% │ 0.02       │ rsiDivergency5m │
// │ 1067 │ PENDLEUSDT   │ 2024 07 07 19:10:00 │ 2024 07 07 19:40:00 │ LONG         │ -0.51% │ 56.14% │ 3.53       │ rsiDivergency5m │
// │ 1068 │ 1000BONKUSDT │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.51% │ 54.27% │ 0.02       │ rsiDivergency5m │
// │ 1069 │ ACEUSDT      │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.51% │ 43.07% │ 2.51       │ rsiDivergency5m │
// │ 1070 │ FRONTUSDT    │ 2024 07 07 19:50:00 │ 2024 07 07 20:15:00 │ LONG         │ -0.51% │ 55.63% │ 0.76       │ rsiDivergency5m │
// │ 1071 │ SUPERUSDT    │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.51% │ 55.83% │ 0.50       │ rsiDivergency5m │
// │ 1072 │ AIUSDT       │ 2024 07 07 20:10:00 │ 2024 07 08 03:45:00 │ LONG         │ 2.49%  │ 32.93% │ 0.49       │ rsiDivergency5m │
// │ 1073 │ GASUSDT      │ 2024 07 07 20:10:00 │ 2024 07 08 03:45:00 │ LONG         │ 2.49%  │ 51.91% │ 2.93       │ rsiDivergency5m │
// │ 1074 │ LSKUSDT      │ 2024 07 07 20:10:00 │ 2024 07 08 04:30:00 │ LONG         │ 2.13%  │ 25.96% │ 0.82       │ rsiDivergency5m │
// │ 1075 │ MAVUSDT      │ 2024 07 07 20:10:00 │ 2024 07 08 03:15:00 │ LONG         │ 2.49%  │ 58.12% │ 0.19       │ rsiDivergency5m │
// │ 1076 │ PORTALUSDT   │ 2024 07 07 20:10:00 │ 2024 07 08 03:00:00 │ LONG         │ 2.49%  │ 9.61%  │ 0.33       │ rsiDivergency5m │
// │ 1077 │ RIFUSDT      │ 2024 07 07 20:10:00 │ 2024 07 08 04:00:00 │ LONG         │ 2.49%  │ 56.36% │ 0.07       │ rsiDivergency5m │
// │ 1078 │ WAXPUSDT     │ 2024 07 07 20:10:00 │ 2024 07 08 04:30:00 │ LONG         │ 2.01%  │ 56.80% │ 0.03       │ rsiDivergency5m │
// │ 1079 │ VANRYUSDT    │ 2024 07 08 02:05:00 │ 2024 07 08 10:25:00 │ LONG         │ 0.91%  │ 5.83%  │ 0.10       │ rsiDivergency5m │
// │ 1080 │ PORTALUSDT   │ 2024 07 08 03:40:00 │ 2024 07 08 04:00:00 │ SHORT        │ -0.51% │ 9.10%  │ 0.38       │ rsiDivergency5m │
// │ 1081 │ HIGHUSDT     │ 2024 07 08 03:50:00 │ 2024 07 08 12:10:00 │ SHORT        │ 0.64%  │ 58.76% │ 1.53       │ rsiDivergency5m │
// │ 1082 │ WUSDT        │ 2024 07 08 03:55:00 │ 2024 07 08 04:20:00 │ SHORT        │ -0.51% │ 17.84% │ 0.29       │ rsiDivergency5m │
// │ 1083 │ GASUSDT      │ 2024 07 08 04:30:00 │ 2024 07 08 12:50:00 │ SHORT        │ 1.04%  │ 52.95% │ 3.26       │ rsiDivergency5m │
// │ 1084 │ RIFUSDT      │ 2024 07 08 04:30:00 │ 2024 07 08 12:50:00 │ SHORT        │ 0.86%  │ 56.70% │ 0.08       │ rsiDivergency5m │
// │ 1085 │ ONGUSDT      │ 2024 07 08 04:55:00 │ 2024 07 08 13:15:00 │ SHORT        │ 1.05%  │ 56.88% │ 0.32       │ rsiDivergency5m │
// │ 1086 │ ALTUSDT      │ 2024 07 08 05:25:00 │ 2024 07 08 13:45:00 │ SHORT        │ 1.31%  │ 26.76% │ 0.14       │ rsiDivergency5m │
// │ 1087 │ STRKUSDT     │ 2024 07 08 06:45:00 │ 2024 07 08 15:05:00 │ SHORT        │ 0.75%  │ 18.30% │ 0.61       │ rsiDivergency5m │
// │ 1088 │ 1000BONKUSDT │ 2024 07 08 08:10:00 │ 2024 07 08 08:30:00 │ SHORT        │ -0.51% │ 53.24% │ 0.02       │ rsiDivergency5m │
// │ 1089 │ STGUSDT      │ 2024 07 09 12:00:00 │ 2024 07 09 13:30:00 │ SHORT        │ -0.51% │ 58.24% │ 0.37       │ rsiDivergency5m │
// │ 1090 │ FTMUSDT      │ 2024 07 10 03:50:00 │ 2024 07 10 06:25:00 │ LONG         │ -0.51% │ 57.73% │ 0.47       │ rsiDivergency5m │
// │ 1091 │ WLDUSDT      │ 2024 07 10 09:55:00 │ 2024 07 10 10:40:00 │ SHORT        │ -0.51% │ 57.22% │ 2.01       │ rsiDivergency5m │
// │ 1092 │ ETHFIUSDT    │ 2024 07 10 11:20:00 │ 2024 07 10 19:40:00 │ SHORT        │ 1.49%  │ 2.82%  │ 2.36       │ rsiDivergency5m │
// │ 1093 │ STXUSDT      │ 2024 07 11 03:00:00 │ 2024 07 11 06:50:00 │ SHORT        │ -0.51% │ 56.71% │ 1.65       │ rsiDivergency5m │
// │ 1094 │ ACEUSDT      │ 2024 07 11 06:40:00 │ 2024 07 11 15:00:00 │ SHORT        │ 2.24%  │ 44.06% │ 3.05       │ rsiDivergency5m │
// │ 1095 │ 1000BONKUSDT │ 2024 07 11 14:30:00 │ 2024 07 11 15:20:00 │ LONG         │ -0.51% │ 52.84% │ 0.02       │ rsiDivergency5m │
// │ 1096 │ RNDRUSDT     │ 2024 07 11 15:15:00 │ 2024 07 11 20:20:00 │ LONG         │ -0.51% │ 56.19% │ 6.00       │ rsiDivergency5m │
// │ 1097 │ ETHFIUSDT    │ 2024 07 11 16:25:00 │ 2024 07 12 00:45:00 │ LONG         │ -0.51% │ 4.37%  │ 2.10       │ rsiDivergency5m │
// │ 1098 │ TNSRUSDT     │ 2024 07 11 16:25:00 │ 2024 07 12 00:45:00 │ LONG         │ 1.51%  │ 14.99% │ 0.42       │ rsiDivergency5m │
// │ 1099 │ TOKENUSDT    │ 2024 07 11 18:25:00 │ 2024 07 12 02:45:00 │ LONG         │ -0.05% │ 57.26% │ 0.07       │ rsiDivergency5m │
// │ 1100 │ ENAUSDT      │ 2024 07 11 20:25:00 │ 2024 07 12 04:45:00 │ LONG         │ -0.33% │ 13.03% │ 0.38       │ rsiDivergency5m │
// │ 1101 │ 1000SATSUSDT │ 2024 07 12 02:20:00 │ 2024 07 12 03:30:00 │ SHORT        │ -0.51% │ 47.30% │ 0.00       │ rsiDivergency5m │
// │ 1102 │ 1000SATSUSDT │ 2024 07 12 03:45:00 │ 2024 07 12 12:05:00 │ SHORT        │ 0.64%  │ 47.94% │ 0.00       │ rsiDivergency5m │
// │ 1103 │ 1000BONKUSDT │ 2024 07 12 05:10:00 │ 2024 07 12 13:30:00 │ LONG         │ 0.18%  │ 52.51% │ 0.02       │ rsiDivergency5m │
// │ 1104 │ STXUSDT      │ 2024 07 12 09:00:00 │ 2024 07 12 09:10:00 │ SHORT        │ -0.51% │ 55.68% │ 1.69       │ rsiDivergency5m │
// │ 1105 │ STXUSDT      │ 2024 07 12 09:15:00 │ 2024 07 12 17:35:00 │ SHORT        │ 0.49%  │ 56.17% │ 1.70       │ rsiDivergency5m │
// │ 1106 │ ORDIUSDT     │ 2024 07 12 13:10:00 │ 2024 07 12 16:45:00 │ SHORT        │ -0.51% │ 55.34% │ 33.89      │ rsiDivergency5m │
// │ 1107 │ BONDUSDT     │ 2024 07 13 00:10:00 │ 2024 07 13 01:05:00 │ SHORT        │ -0.51% │ 55.66% │ 1.51       │ rsiDivergency5m │
// │ 1108 │ XRPUSDT      │ 2024 07 13 00:20:00 │ 2024 07 13 08:25:00 │ SHORT        │ -0.51% │ 55.15% │ 0.51       │ rsiDivergency5m │
// └──────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴────────┴────────────┴─────────────────┘
