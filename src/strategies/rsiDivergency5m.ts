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
// │ 0 │ 2.00% │ 10.00% │ 100            │ 1050      │ 79.18%    │ -3.60%    │ 70.03% │ 16.70%   │ 24.28%             │ 12               │ 35.81%  │ 51.23         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴──────────┴────────────────────┴──────────────────┴─────────┴───────────────┘
// ┌──────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬────────┬────────────┬─────────────────┐
// │      │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl │ entryPrice │ stgName         │
// ├──────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼────────┼────────────┼─────────────────┤
// │    0 │ HFTUSDT      │ 2023 10 17 12:40:00 │ 2023 10 17 19:25:00 │ LONG         │ -0.51% │ -0.51% │ 0.25       │ rsiDivergency5m │
// │    1 │ OGNUSDT      │ 2023 10 17 20:25:00 │ 2023 10 17 21:15:00 │ LONG         │ -0.51% │ -1.03% │ 0.11       │ rsiDivergency5m │
// │    2 │ AMBUSDT      │ 2023 10 18 08:30:00 │ 2023 10 18 16:50:00 │ LONG         │ -0.11% │ -1.14% │ 0.01       │ rsiDivergency5m │
// │    3 │ WLDUSDT      │ 2023 10 18 18:40:00 │ 2023 10 18 20:40:00 │ LONG         │ -0.51% │ -1.65% │ 1.46       │ rsiDivergency5m │
// │    4 │ WLDUSDT      │ 2023 10 18 20:50:00 │ 2023 10 18 21:35:00 │ LONG         │ -0.51% │ -2.16% │ 1.43       │ rsiDivergency5m │
// │    5 │ TUSDT        │ 2023 10 18 22:45:00 │ 2023 10 19 07:05:00 │ LONG         │ 0.07%  │ -2.09% │ 0.02       │ rsiDivergency5m │
// │    6 │ KNCUSDT      │ 2023 10 19 11:40:00 │ 2023 10 19 19:05:00 │ LONG         │ -0.51% │ -2.61% │ 0.63       │ rsiDivergency5m │
// │    7 │ FRONTUSDT    │ 2023 10 20 01:15:00 │ 2023 10 20 09:35:00 │ SHORT        │ 0.26%  │ -2.34% │ 0.28       │ rsiDivergency5m │
// │    8 │ LQTYUSDT     │ 2023 10 20 15:20:00 │ 2023 10 20 23:40:00 │ LONG         │ 0.34%  │ -2.00% │ 1.35       │ rsiDivergency5m │
// │    9 │ ICXUSDT      │ 2023 10 21 03:35:00 │ 2023 10 21 07:55:00 │ SHORT        │ -0.51% │ -2.51% │ 0.21       │ rsiDivergency5m │
// │   10 │ FTMUSDT      │ 2023 10 21 12:40:00 │ 2023 10 21 21:00:00 │ SHORT        │ 0.64%  │ -1.87% │ 0.21       │ rsiDivergency5m │
// │   11 │ LQTYUSDT     │ 2023 10 22 05:30:00 │ 2023 10 22 13:50:00 │ LONG         │ 0.50%  │ -1.37% │ 1.33       │ rsiDivergency5m │
// │   12 │ LQTYUSDT     │ 2023 10 22 15:45:00 │ 2023 10 22 20:05:00 │ SHORT        │ -0.51% │ -1.88% │ 1.37       │ rsiDivergency5m │
// │   13 │ FTMUSDT      │ 2023 10 22 22:50:00 │ 2023 10 22 23:15:00 │ SHORT        │ -0.51% │ -2.40% │ 0.22       │ rsiDivergency5m │
// │   14 │ FTMUSDT      │ 2023 10 22 23:20:00 │ 2023 10 23 07:40:00 │ SHORT        │ 0.35%  │ -2.05% │ 0.23       │ rsiDivergency5m │
// │   15 │ LQTYUSDT     │ 2023 10 23 09:55:00 │ 2023 10 23 17:50:00 │ SHORT        │ -0.51% │ -2.56% │ 1.51       │ rsiDivergency5m │
// │   16 │ WLDUSDT      │ 2023 10 23 18:30:00 │ 2023 10 23 18:55:00 │ SHORT        │ -0.51% │ -3.07% │ 1.63       │ rsiDivergency5m │
// │   17 │ DOTUSDT      │ 2023 10 23 19:00:00 │ 2023 10 24 03:20:00 │ SHORT        │ 0.50%  │ -2.57% │ 4.35       │ rsiDivergency5m │
// │   18 │ YGGUSDT      │ 2023 10 24 04:40:00 │ 2023 10 24 06:55:00 │ SHORT        │ -0.51% │ -3.09% │ 0.28       │ rsiDivergency5m │
// │   19 │ LINAUSDT     │ 2023 10 24 07:15:00 │ 2023 10 24 07:40:00 │ SHORT        │ -0.51% │ -3.60% │ 0.01       │ rsiDivergency5m │
// │   20 │ GALAUSDT     │ 2023 10 24 07:40:00 │ 2023 10 24 16:00:00 │ SHORT        │ 1.35%  │ -2.25% │ 0.02       │ rsiDivergency5m │
// │   21 │ FTMUSDT      │ 2023 10 24 20:30:00 │ 2023 10 25 04:50:00 │ SHORT        │ 0.60%  │ -1.65% │ 0.23       │ rsiDivergency5m │
// │   22 │ APEUSDT      │ 2023 10 25 08:15:00 │ 2023 10 25 09:40:00 │ SHORT        │ -0.51% │ -2.16% │ 1.32       │ rsiDivergency5m │
// │   23 │ APEUSDT      │ 2023 10 25 09:45:00 │ 2023 10 25 18:05:00 │ SHORT        │ 0.87%  │ -1.29% │ 1.36       │ rsiDivergency5m │
// │   24 │ GMXUSDT      │ 2023 10 25 23:00:00 │ 2023 10 26 07:20:00 │ SHORT        │ 0.84%  │ -0.45% │ 45.76      │ rsiDivergency5m │
// │   25 │ HIGHUSDT     │ 2023 10 26 09:40:00 │ 2023 10 26 18:00:00 │ LONG         │ 0.67%  │ 0.22%  │ 1.21       │ rsiDivergency5m │
// │   26 │ LOOMUSDT     │ 2023 10 26 19:15:00 │ 2023 10 27 00:30:00 │ SHORT        │ -0.51% │ -0.29% │ 0.11       │ rsiDivergency5m │
// │   27 │ NEOUSDT      │ 2023 10 27 03:45:00 │ 2023 10 27 04:30:00 │ SHORT        │ -0.51% │ -0.81% │ 8.78       │ rsiDivergency5m │
// │   28 │ NEOUSDT      │ 2023 10 27 08:00:00 │ 2023 10 27 16:20:00 │ SHORT        │ 0.93%  │ 0.13%  │ 9.09       │ rsiDivergency5m │
// │   29 │ GASUSDT      │ 2023 10 27 17:20:00 │ 2023 10 27 18:00:00 │ SHORT        │ -0.51% │ -0.38% │ 3.56       │ rsiDivergency5m │
// │   30 │ GASUSDT      │ 2023 10 27 18:20:00 │ 2023 10 27 20:25:00 │ SHORT        │ -0.51% │ -0.90% │ 3.66       │ rsiDivergency5m │
// │   31 │ GASUSDT      │ 2023 10 27 20:30:00 │ 2023 10 27 20:40:00 │ SHORT        │ -0.51% │ -1.41% │ 3.82       │ rsiDivergency5m │
// │   32 │ LOOMUSDT     │ 2023 10 28 00:05:00 │ 2023 10 28 08:25:00 │ SHORT        │ 0.13%  │ -1.28% │ 0.14       │ rsiDivergency5m │
// │   33 │ POLYXUSDT    │ 2023 10 28 10:40:00 │ 2023 10 28 11:20:00 │ SHORT        │ -0.51% │ -1.79% │ 0.27       │ rsiDivergency5m │
// │   34 │ HIFIUSDT     │ 2023 10 28 20:15:00 │ 2023 10 29 04:35:00 │ SHORT        │ 0.47%  │ -1.32% │ 0.69       │ rsiDivergency5m │
// │   35 │ POLYXUSDT    │ 2023 10 29 04:50:00 │ 2023 10 29 07:25:00 │ SHORT        │ -0.51% │ -1.83% │ 0.29       │ rsiDivergency5m │
// │   36 │ GASUSDT      │ 2023 10 29 10:15:00 │ 2023 10 29 16:25:00 │ LONG         │ 2.49%  │ 0.66%  │ 4.44       │ rsiDivergency5m │
// │   37 │ GASUSDT      │ 2023 10 29 17:15:00 │ 2023 10 29 18:05:00 │ SHORT        │ -0.51% │ 0.14%  │ 4.97       │ rsiDivergency5m │
// │   38 │ POLYXUSDT    │ 2023 10 30 03:55:00 │ 2023 10 30 04:05:00 │ SHORT        │ -0.51% │ -0.37% │ 0.36       │ rsiDivergency5m │
// │   39 │ POLYXUSDT    │ 2023 10 30 04:10:00 │ 2023 10 30 07:05:00 │ SHORT        │ -0.51% │ -0.88% │ 0.36       │ rsiDivergency5m │
// │   40 │ SKLUSDT      │ 2023 10 30 07:30:00 │ 2023 10 30 15:50:00 │ SHORT        │ 0.61%  │ -0.27% │ 0.03       │ rsiDivergency5m │
// │   41 │ HOOKUSDT     │ 2023 10 30 15:55:00 │ 2023 10 31 00:15:00 │ SHORT        │ 0.53%  │ 0.27%  │ 1.00       │ rsiDivergency5m │
// │   42 │ HIFIUSDT     │ 2023 10 31 08:55:00 │ 2023 10 31 10:10:00 │ LONG         │ -0.51% │ -0.25% │ 0.62       │ rsiDivergency5m │
// │   43 │ WAXPUSDT     │ 2023 10 31 10:20:00 │ 2023 10 31 18:40:00 │ LONG         │ 2.21%  │ 1.96%  │ 0.06       │ rsiDivergency5m │
// │   44 │ ICXUSDT      │ 2023 10 31 18:50:00 │ 2023 11 01 03:10:00 │ SHORT        │ 0.68%  │ 2.65%  │ 0.22       │ rsiDivergency5m │
// │   45 │ INJUSDT      │ 2023 11 01 03:40:00 │ 2023 11 01 07:55:00 │ SHORT        │ -0.51% │ 2.13%  │ 14.03      │ rsiDivergency5m │
// │   46 │ TUSDT        │ 2023 11 01 08:25:00 │ 2023 11 01 16:45:00 │ LONG         │ 1.35%  │ 3.48%  │ 0.02       │ rsiDivergency5m │
// │   47 │ MANAUSDT     │ 2023 11 01 19:55:00 │ 2023 11 01 20:05:00 │ SHORT        │ -0.51% │ 2.97%  │ 0.39       │ rsiDivergency5m │
// │   48 │ GMTUSDT      │ 2023 11 01 21:00:00 │ 2023 11 02 05:20:00 │ SHORT        │ 0.83%  │ 3.80%  │ 0.20       │ rsiDivergency5m │
// │   49 │ FLMUSDT      │ 2023 11 02 10:15:00 │ 2023 11 02 18:35:00 │ LONG         │ 0.21%  │ 4.01%  │ 0.08       │ rsiDivergency5m │
// │   50 │ POWRUSDT     │ 2023 11 02 20:20:00 │ 2023 11 03 04:40:00 │ LONG         │ 0.11%  │ 4.11%  │ 0.21       │ rsiDivergency5m │
// │   51 │ POLYXUSDT    │ 2023 11 03 07:40:00 │ 2023 11 03 11:00:00 │ SHORT        │ -0.51% │ 3.60%  │ 0.23       │ rsiDivergency5m │
// │   52 │ SSVUSDT      │ 2023 11 03 20:15:00 │ 2023 11 03 23:05:00 │ SHORT        │ -0.51% │ 3.09%  │ 15.19      │ rsiDivergency5m │
// │   53 │ GMTUSDT      │ 2023 11 04 02:45:00 │ 2023 11 04 11:05:00 │ SHORT        │ 0.87%  │ 3.96%  │ 0.20       │ rsiDivergency5m │
// │   54 │ IMXUSDT      │ 2023 11 04 11:35:00 │ 2023 11 04 19:00:00 │ SHORT        │ -0.51% │ 3.45%  │ 0.83       │ rsiDivergency5m │
// │   55 │ IMXUSDT      │ 2023 11 04 21:35:00 │ 2023 11 04 21:55:00 │ SHORT        │ -0.51% │ 2.93%  │ 0.90       │ rsiDivergency5m │
// │   56 │ DODOXUSDT    │ 2023 11 04 23:40:00 │ 2023 11 05 01:00:00 │ SHORT        │ -0.51% │ 2.42%  │ 0.13       │ rsiDivergency5m │
// │   57 │ DODOXUSDT    │ 2023 11 05 01:10:00 │ 2023 11 05 02:30:00 │ SHORT        │ -0.51% │ 1.91%  │ 0.13       │ rsiDivergency5m │
// │   58 │ FTMUSDT      │ 2023 11 05 04:55:00 │ 2023 11 05 13:15:00 │ SHORT        │ 0.49%  │ 2.40%  │ 0.27       │ rsiDivergency5m │
// │   59 │ GMTUSDT      │ 2023 11 05 21:10:00 │ 2023 11 05 21:25:00 │ SHORT        │ -0.51% │ 1.89%  │ 0.22       │ rsiDivergency5m │
// │   60 │ GMTUSDT      │ 2023 11 05 21:50:00 │ 2023 11 06 06:10:00 │ SHORT        │ -0.51% │ 1.37%  │ 0.24       │ rsiDivergency5m │
// │   61 │ YGGUSDT      │ 2023 11 06 06:35:00 │ 2023 11 06 14:20:00 │ SHORT        │ -0.51% │ 0.86%  │ 0.33       │ rsiDivergency5m │
// │   62 │ ADAUSDT      │ 2023 11 06 16:05:00 │ 2023 11 07 00:25:00 │ SHORT        │ 1.27%  │ 2.13%  │ 0.37       │ rsiDivergency5m │
// │   63 │ FETUSDT      │ 2023 11 07 10:35:00 │ 2023 11 07 18:55:00 │ LONG         │ 0.95%  │ 3.08%  │ 0.35       │ rsiDivergency5m │
// │   64 │ TLMUSDT      │ 2023 11 08 03:40:00 │ 2023 11 08 12:00:00 │ SHORT        │ 0.08%  │ 3.16%  │ 0.01       │ rsiDivergency5m │
// │   65 │ BIGTIMEUSDT  │ 2023 11 08 15:25:00 │ 2023 11 08 16:10:00 │ SHORT        │ -0.51% │ 2.65%  │ 0.17       │ rsiDivergency5m │
// │   66 │ RSRUSDT      │ 2023 11 08 16:55:00 │ 2023 11 09 01:15:00 │ SHORT        │ 0.62%  │ 3.27%  │ 0.00       │ rsiDivergency5m │
// │   67 │ MINAUSDT     │ 2023 11 09 04:10:00 │ 2023 11 09 09:00:00 │ LONG         │ -0.51% │ 2.76%  │ 0.69       │ rsiDivergency5m │
// │   68 │ LOOMUSDT     │ 2023 11 09 09:15:00 │ 2023 11 09 11:10:00 │ SHORT        │ 2.49%  │ 5.24%  │ 0.13       │ rsiDivergency5m │
// │   69 │ C98USDT      │ 2023 11 09 14:25:00 │ 2023 11 09 22:45:00 │ LONG         │ 1.35%  │ 6.60%  │ 0.17       │ rsiDivergency5m │
// │   70 │ BONDUSDT     │ 2023 11 10 01:05:00 │ 2023 11 10 01:15:00 │ SHORT        │ -0.51% │ 6.09%  │ 4.70       │ rsiDivergency5m │
// │   71 │ BONDUSDT     │ 2023 11 10 01:25:00 │ 2023 11 10 03:10:00 │ SHORT        │ -0.51% │ 5.57%  │ 4.76       │ rsiDivergency5m │
// │   72 │ SUIUSDT      │ 2023 11 10 03:15:00 │ 2023 11 10 11:35:00 │ LONG         │ 0.16%  │ 5.74%  │ 0.54       │ rsiDivergency5m │
// │   73 │ INJUSDT      │ 2023 11 10 11:55:00 │ 2023 11 10 13:40:00 │ SHORT        │ -0.51% │ 5.22%  │ 18.38      │ rsiDivergency5m │
// │   74 │ SUIUSDT      │ 2023 11 10 16:30:00 │ 2023 11 10 18:05:00 │ SHORT        │ -0.51% │ 4.71%  │ 0.61       │ rsiDivergency5m │
// │   75 │ FETUSDT      │ 2023 11 10 18:20:00 │ 2023 11 10 18:55:00 │ SHORT        │ -0.51% │ 4.20%  │ 0.43       │ rsiDivergency5m │
// │   76 │ FETUSDT      │ 2023 11 10 19:00:00 │ 2023 11 11 03:10:00 │ SHORT        │ -0.51% │ 3.69%  │ 0.44       │ rsiDivergency5m │
// │   77 │ RNDRUSDT     │ 2023 11 11 09:10:00 │ 2023 11 11 09:50:00 │ SHORT        │ -0.51% │ 3.17%  │ 2.55       │ rsiDivergency5m │
// │   78 │ ORDIUSDT     │ 2023 11 11 10:15:00 │ 2023 11 11 11:40:00 │ SHORT        │ -0.51% │ 2.66%  │ 19.81      │ rsiDivergency5m │
// │   79 │ APTUSDT      │ 2023 11 11 11:55:00 │ 2023 11 11 20:15:00 │ SHORT        │ 1.20%  │ 3.86%  │ 7.74       │ rsiDivergency5m │
// │   80 │ FETUSDT      │ 2023 11 11 21:20:00 │ 2023 11 12 05:40:00 │ LONG         │ 1.79%  │ 5.64%  │ 0.40       │ rsiDivergency5m │
// │   81 │ KLAYUSDT     │ 2023 11 12 05:55:00 │ 2023 11 12 13:50:00 │ SHORT        │ -0.51% │ 5.13%  │ 0.16       │ rsiDivergency5m │
// │   82 │ MTLUSDT      │ 2023 11 12 19:15:00 │ 2023 11 12 23:10:00 │ LONG         │ -0.51% │ 4.62%  │ 1.89       │ rsiDivergency5m │
// │   83 │ MATICUSDT    │ 2023 11 12 23:15:00 │ 2023 11 13 07:20:00 │ LONG         │ -0.51% │ 4.10%  │ 0.88       │ rsiDivergency5m │
// │   84 │ ICXUSDT      │ 2023 11 13 09:45:00 │ 2023 11 13 16:10:00 │ LONG         │ -0.51% │ 3.59%  │ 0.28       │ rsiDivergency5m │
// │   85 │ ONEUSDT      │ 2023 11 13 16:35:00 │ 2023 11 13 17:55:00 │ LONG         │ -0.51% │ 3.08%  │ 0.01       │ rsiDivergency5m │
// │   86 │ FETUSDT      │ 2023 11 13 19:15:00 │ 2023 11 14 03:35:00 │ LONG         │ 1.48%  │ 4.55%  │ 0.37       │ rsiDivergency5m │
// │   87 │ MATICUSDT    │ 2023 11 14 03:55:00 │ 2023 11 14 04:05:00 │ SHORT        │ -0.51% │ 4.04%  │ 0.96       │ rsiDivergency5m │
// │   88 │ MATICUSDT    │ 2023 11 14 04:10:00 │ 2023 11 14 12:30:00 │ SHORT        │ 1.94%  │ 5.98%  │ 0.98       │ rsiDivergency5m │
// │   89 │ GASUSDT      │ 2023 11 14 16:05:00 │ 2023 11 15 00:25:00 │ SHORT        │ 0.59%  │ 6.57%  │ 8.35       │ rsiDivergency5m │
// │   90 │ LDOUSDT      │ 2023 11 15 00:40:00 │ 2023 11 15 03:00:00 │ SHORT        │ -0.51% │ 6.06%  │ 2.44       │ rsiDivergency5m │
// │   91 │ HFTUSDT      │ 2023 11 15 03:45:00 │ 2023 11 15 06:00:00 │ SHORT        │ -0.51% │ 5.55%  │ 0.29       │ rsiDivergency5m │
// │   92 │ FETUSDT      │ 2023 11 15 06:10:00 │ 2023 11 15 14:30:00 │ SHORT        │ -0.51% │ 5.04%  │ 0.42       │ rsiDivergency5m │
// │   93 │ SKLUSDT      │ 2023 11 15 16:30:00 │ 2023 11 15 22:30:00 │ SHORT        │ -0.51% │ 4.52%  │ 0.03       │ rsiDivergency5m │
// │   94 │ ADAUSDT      │ 2023 11 16 03:40:00 │ 2023 11 16 12:00:00 │ SHORT        │ 1.57%  │ 6.10%  │ 0.41       │ rsiDivergency5m │
// │   95 │ HOOKUSDT     │ 2023 11 16 13:50:00 │ 2023 11 16 14:20:00 │ LONG         │ -0.51% │ 5.58%  │ 0.97       │ rsiDivergency5m │
// │   96 │ SUIUSDT      │ 2023 11 16 14:35:00 │ 2023 11 16 22:55:00 │ LONG         │ 1.17%  │ 6.75%  │ 0.56       │ rsiDivergency5m │
// │   97 │ WLDUSDT      │ 2023 11 17 05:25:00 │ 2023 11 17 13:45:00 │ LONG         │ 0.66%  │ 7.41%  │ 1.99       │ rsiDivergency5m │
// │   98 │ ORDIUSDT     │ 2023 11 17 20:45:00 │ 2023 11 18 01:15:00 │ SHORT        │ 2.49%  │ 9.90%  │ 26.25      │ rsiDivergency5m │
// │   99 │ ARPAUSDT     │ 2023 11 18 01:40:00 │ 2023 11 18 02:00:00 │ LONG         │ -0.51% │ 9.39%  │ 0.05       │ rsiDivergency5m │
// │  100 │ TOKENUSDT    │ 2023 11 18 02:05:00 │ 2023 11 18 10:25:00 │ LONG         │ 1.82%  │ 11.21% │ 0.03       │ rsiDivergency5m │
// │  101 │ FETUSDT      │ 2023 11 18 10:35:00 │ 2023 11 18 11:00:00 │ SHORT        │ -0.51% │ 10.70% │ 0.45       │ rsiDivergency5m │
// │  102 │ ARPAUSDT     │ 2023 11 18 11:05:00 │ 2023 11 18 19:25:00 │ SHORT        │ 2.11%  │ 12.81% │ 0.05       │ rsiDivergency5m │
// │  103 │ DOGEUSDT     │ 2023 11 18 20:35:00 │ 2023 11 19 04:55:00 │ LONG         │ 0.46%  │ 13.27% │ 0.08       │ rsiDivergency5m │
// │  104 │ ORDIUSDT     │ 2023 11 19 09:15:00 │ 2023 11 19 10:05:00 │ LONG         │ -0.51% │ 12.75% │ 21.86      │ rsiDivergency5m │
// │  105 │ ARUSDT       │ 2023 11 19 11:55:00 │ 2023 11 19 13:15:00 │ SHORT        │ -0.51% │ 12.24% │ 8.91       │ rsiDivergency5m │
// │  106 │ SKLUSDT      │ 2023 11 19 13:40:00 │ 2023 11 19 14:00:00 │ SHORT        │ -0.51% │ 11.73% │ 0.04       │ rsiDivergency5m │
// │  107 │ SNXUSDT      │ 2023 11 19 14:20:00 │ 2023 11 19 15:15:00 │ SHORT        │ -0.51% │ 11.22% │ 3.35       │ rsiDivergency5m │
// │  108 │ FETUSDT      │ 2023 11 19 22:30:00 │ 2023 11 20 02:30:00 │ SHORT        │ -0.51% │ 10.70% │ 0.54       │ rsiDivergency5m │
// │  109 │ LDOUSDT      │ 2023 11 20 04:50:00 │ 2023 11 20 09:15:00 │ SHORT        │ -0.51% │ 10.19% │ 2.50       │ rsiDivergency5m │
// │  110 │ YFIUSDT      │ 2023 11 20 18:55:00 │ 2023 11 21 03:15:00 │ LONG         │ 0.04%  │ 10.23% │ 8280.00    │ rsiDivergency5m │
// │  111 │ YGGUSDT      │ 2023 11 21 09:10:00 │ 2023 11 21 10:10:00 │ LONG         │ -0.51% │ 9.72%  │ 0.37       │ rsiDivergency5m │
// │  112 │ NTRNUSDT     │ 2023 11 21 10:15:00 │ 2023 11 21 12:45:00 │ LONG         │ -0.51% │ 9.20%  │ 0.43       │ rsiDivergency5m │
// │  113 │ CAKEUSDT     │ 2023 11 21 12:50:00 │ 2023 11 21 13:00:00 │ LONG         │ -0.51% │ 8.69%  │ 2.42       │ rsiDivergency5m │
// │  114 │ NTRNUSDT     │ 2023 11 21 13:05:00 │ 2023 11 21 21:25:00 │ LONG         │ 0.61%  │ 9.30%  │ 0.41       │ rsiDivergency5m │
// │  115 │ SSVUSDT      │ 2023 11 21 23:00:00 │ 2023 11 22 00:15:00 │ SHORT        │ -0.51% │ 8.79%  │ 16.93      │ rsiDivergency5m │
// │  116 │ INJUSDT      │ 2023 11 22 01:15:00 │ 2023 11 22 04:40:00 │ SHORT        │ -0.51% │ 8.28%  │ 15.10      │ rsiDivergency5m │
// │  117 │ INJUSDT      │ 2023 11 22 16:10:00 │ 2023 11 23 00:30:00 │ SHORT        │ 0.74%  │ 9.02%  │ 16.48      │ rsiDivergency5m │
// │  118 │ SSVUSDT      │ 2023 11 23 04:45:00 │ 2023 11 23 09:40:00 │ SHORT        │ -0.51% │ 8.51%  │ 19.40      │ rsiDivergency5m │
// │  119 │ GASUSDT      │ 2023 11 23 11:15:00 │ 2023 11 23 19:35:00 │ LONG         │ 1.49%  │ 10.00% │ 8.60       │ rsiDivergency5m │
// │  120 │ GASUSDT      │ 2023 11 23 19:40:00 │ 2023 11 23 19:50:00 │ SHORT        │ -0.51% │ 9.48%  │ 9.12       │ rsiDivergency5m │
// │  121 │ FETUSDT      │ 2023 11 24 00:50:00 │ 2023 11 24 03:10:00 │ SHORT        │ -0.51% │ 8.97%  │ 0.54       │ rsiDivergency5m │
// │  122 │ DARUSDT      │ 2023 11 24 14:55:00 │ 2023 11 24 15:00:00 │ SHORT        │ -0.51% │ 8.46%  │ 0.13       │ rsiDivergency5m │
// │  123 │ DARUSDT      │ 2023 11 24 15:20:00 │ 2023 11 24 23:40:00 │ SHORT        │ 0.66%  │ 9.12%  │ 0.13       │ rsiDivergency5m │
// │  124 │ GMTUSDT      │ 2023 11 25 01:40:00 │ 2023 11 25 02:15:00 │ SHORT        │ -0.51% │ 8.60%  │ 0.33       │ rsiDivergency5m │
// │  125 │ GMTUSDT      │ 2023 11 25 02:35:00 │ 2023 11 25 10:35:00 │ SHORT        │ -0.51% │ 8.09%  │ 0.34       │ rsiDivergency5m │
// │  126 │ KLAYUSDT     │ 2023 11 25 21:00:00 │ 2023 11 26 05:20:00 │ LONG         │ -0.46% │ 7.63%  │ 0.22       │ rsiDivergency5m │
// │  127 │ ROSEUSDT     │ 2023 11 26 05:25:00 │ 2023 11 26 13:45:00 │ SHORT        │ 0.82%  │ 8.45%  │ 0.08       │ rsiDivergency5m │
// │  128 │ AXSUSDT      │ 2023 11 26 17:50:00 │ 2023 11 26 19:00:00 │ SHORT        │ -0.51% │ 7.94%  │ 6.68       │ rsiDivergency5m │
// │  129 │ GMTUSDT      │ 2023 11 26 22:20:00 │ 2023 11 26 22:35:00 │ LONG         │ -0.51% │ 7.42%  │ 0.30       │ rsiDivergency5m │
// │  130 │ TLMUSDT      │ 2023 11 26 23:25:00 │ 2023 11 27 02:00:00 │ LONG         │ -0.51% │ 6.91%  │ 0.02       │ rsiDivergency5m │
// │  131 │ TLMUSDT      │ 2023 11 27 02:25:00 │ 2023 11 27 10:45:00 │ LONG         │ 0.06%  │ 6.97%  │ 0.01       │ rsiDivergency5m │
// │  132 │ BEAMXUSDT    │ 2023 11 27 13:30:00 │ 2023 11 27 21:50:00 │ LONG         │ 0.70%  │ 7.67%  │ 0.01       │ rsiDivergency5m │
// │  133 │ ALPHAUSDT    │ 2023 11 27 23:35:00 │ 2023 11 28 00:00:00 │ LONG         │ -0.51% │ 7.16%  │ 0.10       │ rsiDivergency5m │
// │  134 │ BIGTIMEUSDT  │ 2023 11 28 00:10:00 │ 2023 11 28 02:15:00 │ LONG         │ -0.51% │ 6.65%  │ 0.20       │ rsiDivergency5m │
// │  135 │ 1000BONKUSDT │ 2023 11 28 06:40:00 │ 2023 11 28 09:05:00 │ SHORT        │ -0.51% │ 6.13%  │ 0.00       │ rsiDivergency5m │
// │  136 │ 1000BONKUSDT │ 2023 11 28 09:15:00 │ 2023 11 28 17:35:00 │ SHORT        │ 0.69%  │ 6.82%  │ 0.00       │ rsiDivergency5m │
// │  137 │ SSVUSDT      │ 2023 11 28 20:25:00 │ 2023 11 29 04:45:00 │ SHORT        │ 0.70%  │ 7.52%  │ 25.86      │ rsiDivergency5m │
// │  138 │ ONGUSDT      │ 2023 11 29 07:30:00 │ 2023 11 29 07:40:00 │ LONG         │ -0.51% │ 7.01%  │ 0.43       │ rsiDivergency5m │
// │  139 │ RIFUSDT      │ 2023 11 29 10:15:00 │ 2023 11 29 18:35:00 │ LONG         │ 0.42%  │ 7.43%  │ 0.11       │ rsiDivergency5m │
// │  140 │ TRUUSDT      │ 2023 11 29 20:00:00 │ 2023 11 30 01:10:00 │ LONG         │ -0.51% │ 6.92%  │ 0.06       │ rsiDivergency5m │
// │  141 │ BIGTIMEUSDT  │ 2023 12 01 12:30:00 │ 2023 12 01 13:00:00 │ SHORT        │ -0.51% │ 6.41%  │ 0.27       │ rsiDivergency5m │
// │  142 │ BIGTIMEUSDT  │ 2023 12 01 13:10:00 │ 2023 12 01 13:25:00 │ SHORT        │ -0.51% │ 5.90%  │ 0.28       │ rsiDivergency5m │
// │  143 │ BIGTIMEUSDT  │ 2023 12 01 13:35:00 │ 2023 12 01 14:45:00 │ SHORT        │ -0.51% │ 5.38%  │ 0.28       │ rsiDivergency5m │
// │  144 │ ORDIUSDT     │ 2023 12 01 22:45:00 │ 2023 12 02 00:35:00 │ SHORT        │ -0.51% │ 4.87%  │ 23.27      │ rsiDivergency5m │
// │  145 │ IOTAUSDT     │ 2023 12 02 04:10:00 │ 2023 12 02 09:35:00 │ SHORT        │ -0.51% │ 4.36%  │ 0.28       │ rsiDivergency5m │
// │  146 │ ORDIUSDT     │ 2023 12 02 09:40:00 │ 2023 12 02 10:25:00 │ SHORT        │ -0.51% │ 3.85%  │ 26.94      │ rsiDivergency5m │
// │  147 │ ORDIUSDT     │ 2023 12 02 10:50:00 │ 2023 12 02 11:00:00 │ SHORT        │ -0.51% │ 3.33%  │ 27.86      │ rsiDivergency5m │
// │  148 │ 1000BONKUSDT │ 2023 12 02 19:55:00 │ 2023 12 02 20:00:00 │ SHORT        │ -0.51% │ 2.82%  │ 0.01       │ rsiDivergency5m │
// │  149 │ IDUSDT       │ 2023 12 02 22:30:00 │ 2023 12 03 06:50:00 │ SHORT        │ 0.57%  │ 3.39%  │ 0.31       │ rsiDivergency5m │
// │  150 │ XVSUSDT      │ 2023 12 03 07:30:00 │ 2023 12 03 07:55:00 │ SHORT        │ -0.51% │ 2.88%  │ 8.14       │ rsiDivergency5m │
// │  151 │ XVSUSDT      │ 2023 12 03 08:05:00 │ 2023 12 03 08:20:00 │ SHORT        │ -0.51% │ 2.37%  │ 8.47       │ rsiDivergency5m │
// │  152 │ XVSUSDT      │ 2023 12 03 08:25:00 │ 2023 12 03 08:35:00 │ SHORT        │ -0.51% │ 1.85%  │ 8.61       │ rsiDivergency5m │
// │  153 │ BEAMXUSDT    │ 2023 12 03 11:35:00 │ 2023 12 03 19:55:00 │ SHORT        │ 0.37%  │ 2.22%  │ 0.01       │ rsiDivergency5m │
// │  154 │ RIFUSDT      │ 2023 12 03 22:40:00 │ 2023 12 04 06:10:00 │ SHORT        │ 2.49%  │ 4.71%  │ 0.12       │ rsiDivergency5m │
// │  155 │ STGUSDT      │ 2023 12 04 06:50:00 │ 2023 12 04 10:30:00 │ LONG         │ -0.51% │ 4.19%  │ 0.56       │ rsiDivergency5m │
// │  156 │ CFXUSDT      │ 2023 12 04 13:30:00 │ 2023 12 04 14:15:00 │ SHORT        │ -0.51% │ 3.68%  │ 0.20       │ rsiDivergency5m │
// │  157 │ CFXUSDT      │ 2023 12 04 14:25:00 │ 2023 12 04 17:00:00 │ SHORT        │ -0.51% │ 3.17%  │ 0.20       │ rsiDivergency5m │
// │  158 │ 1000SHIBUSDT │ 2023 12 04 17:25:00 │ 2023 12 05 01:45:00 │ SHORT        │ -0.03% │ 3.14%  │ 0.01       │ rsiDivergency5m │
// │  159 │ STXUSDT      │ 2023 12 05 10:40:00 │ 2023 12 05 19:00:00 │ SHORT        │ 1.39%  │ 4.53%  │ 1.24       │ rsiDivergency5m │
// │  160 │ FRONTUSDT    │ 2023 12 05 20:05:00 │ 2023 12 06 04:25:00 │ SHORT        │ 1.46%  │ 5.99%  │ 0.38       │ rsiDivergency5m │
// │  161 │ BONDUSDT     │ 2023 12 06 06:25:00 │ 2023 12 06 06:35:00 │ LONG         │ -0.51% │ 5.47%  │ 3.65       │ rsiDivergency5m │
// │  162 │ HIFIUSDT     │ 2023 12 06 06:40:00 │ 2023 12 06 12:20:00 │ LONG         │ 2.49%  │ 7.96%  │ 0.74       │ rsiDivergency5m │
// │  163 │ HIFIUSDT     │ 2023 12 06 20:10:00 │ 2023 12 07 04:30:00 │ SHORT        │ 0.59%  │ 8.55%  │ 0.82       │ rsiDivergency5m │
// │  164 │ MAVUSDT      │ 2023 12 07 10:40:00 │ 2023 12 07 13:00:00 │ SHORT        │ -0.51% │ 8.04%  │ 0.38       │ rsiDivergency5m │
// │  165 │ INJUSDT      │ 2023 12 07 13:05:00 │ 2023 12 07 21:25:00 │ SHORT        │ 0.18%  │ 8.22%  │ 18.58      │ rsiDivergency5m │
// │  166 │ SSVUSDT      │ 2023 12 07 22:15:00 │ 2023 12 08 01:55:00 │ LONG         │ -0.51% │ 7.70%  │ 26.48      │ rsiDivergency5m │
// │  167 │ HOTUSDT      │ 2023 12 08 03:40:00 │ 2023 12 08 12:00:00 │ SHORT        │ 1.00%  │ 8.70%  │ 0.00       │ rsiDivergency5m │
// │  168 │ ORDIUSDT     │ 2023 12 08 15:20:00 │ 2023 12 08 15:50:00 │ SHORT        │ -0.51% │ 8.19%  │ 50.43      │ rsiDivergency5m │
// │  169 │ ORDIUSDT     │ 2023 12 08 16:10:00 │ 2023 12 08 19:45:00 │ SHORT        │ -0.51% │ 7.68%  │ 52.01      │ rsiDivergency5m │
// │  170 │ ORDIUSDT     │ 2023 12 08 19:50:00 │ 2023 12 08 20:00:00 │ SHORT        │ -0.51% │ 7.16%  │ 53.38      │ rsiDivergency5m │
// │  171 │ FLOWUSDT     │ 2023 12 08 22:10:00 │ 2023 12 09 06:30:00 │ SHORT        │ 0.59%  │ 7.75%  │ 0.88       │ rsiDivergency5m │
// │  172 │ ALGOUSDT     │ 2023 12 09 09:15:00 │ 2023 12 09 12:15:00 │ SHORT        │ 2.49%  │ 10.24% │ 0.22       │ rsiDivergency5m │
// │  173 │ BEAMXUSDT    │ 2023 12 09 13:35:00 │ 2023 12 09 14:50:00 │ SHORT        │ -0.51% │ 9.73%  │ 0.02       │ rsiDivergency5m │
// │  174 │ USTCUSDT     │ 2023 12 09 19:10:00 │ 2023 12 10 02:45:00 │ LONG         │ 2.49%  │ 12.21% │ 0.04       │ rsiDivergency5m │
// │  175 │ HOTUSDT      │ 2023 12 10 03:00:00 │ 2023 12 10 11:20:00 │ SHORT        │ 0.80%  │ 13.01% │ 0.00       │ rsiDivergency5m │
// │  176 │ POWRUSDT     │ 2023 12 10 13:40:00 │ 2023 12 10 16:10:00 │ SHORT        │ -0.51% │ 12.50% │ 0.39       │ rsiDivergency5m │
// │  177 │ INJUSDT      │ 2023 12 10 18:50:00 │ 2023 12 10 21:10:00 │ SHORT        │ 2.49%  │ 14.98% │ 21.35      │ rsiDivergency5m │
// │  178 │ PENDLEUSDT   │ 2023 12 10 22:00:00 │ 2023 12 11 00:45:00 │ LONG         │ -0.51% │ 14.47% │ 1.14       │ rsiDivergency5m │
// │  179 │ WLDUSDT      │ 2023 12 11 01:20:00 │ 2023 12 11 09:40:00 │ LONG         │ -0.22% │ 14.25% │ 2.47       │ rsiDivergency5m │
// │  180 │ NTRNUSDT     │ 2023 12 11 10:20:00 │ 2023 12 11 10:30:00 │ SHORT        │ -0.51% │ 13.74% │ 0.65       │ rsiDivergency5m │
// │  181 │ NTRNUSDT     │ 2023 12 11 10:35:00 │ 2023 12 11 12:05:00 │ SHORT        │ -0.51% │ 13.23% │ 0.66       │ rsiDivergency5m │
// │  182 │ LINAUSDT     │ 2023 12 11 13:30:00 │ 2023 12 11 21:50:00 │ LONG         │ 1.19%  │ 14.41% │ 0.01       │ rsiDivergency5m │
// │  183 │ FXSUSDT      │ 2023 12 11 22:00:00 │ 2023 12 12 06:20:00 │ SHORT        │ 0.72%  │ 15.13% │ 8.99       │ rsiDivergency5m │
// │  184 │ POWRUSDT     │ 2023 12 12 07:00:00 │ 2023 12 12 15:20:00 │ LONG         │ 1.76%  │ 16.89% │ 0.37       │ rsiDivergency5m │
// │  185 │ BONDUSDT     │ 2023 12 12 18:10:00 │ 2023 12 12 18:30:00 │ SHORT        │ -0.51% │ 16.38% │ 4.14       │ rsiDivergency5m │
// │  186 │ ALICEUSDT    │ 2023 12 12 18:40:00 │ 2023 12 13 03:00:00 │ SHORT        │ 1.51%  │ 17.89% │ 1.35       │ rsiDivergency5m │
// │  187 │ ALICEUSDT    │ 2023 12 13 04:55:00 │ 2023 12 13 13:15:00 │ SHORT        │ 1.38%  │ 19.27% │ 1.31       │ rsiDivergency5m │
// │  188 │ HFTUSDT      │ 2023 12 13 13:50:00 │ 2023 12 13 14:15:00 │ SHORT        │ -0.51% │ 18.76% │ 0.36       │ rsiDivergency5m │
// │  189 │ NTRNUSDT     │ 2023 12 13 14:35:00 │ 2023 12 13 14:55:00 │ SHORT        │ -0.51% │ 18.25% │ 0.85       │ rsiDivergency5m │
// │  190 │ COTIUSDT     │ 2023 12 13 15:10:00 │ 2023 12 13 15:35:00 │ SHORT        │ -0.51% │ 17.74% │ 0.07       │ rsiDivergency5m │
// │  191 │ INJUSDT      │ 2023 12 13 15:55:00 │ 2023 12 13 19:05:00 │ SHORT        │ -0.51% │ 17.22% │ 29.28      │ rsiDivergency5m │
// │  192 │ FRONTUSDT    │ 2023 12 13 19:15:00 │ 2023 12 14 03:35:00 │ SHORT        │ 1.57%  │ 18.80% │ 0.38       │ rsiDivergency5m │
// │  193 │ SKLUSDT      │ 2023 12 14 05:25:00 │ 2023 12 14 13:45:00 │ SHORT        │ 0.47%  │ 19.26% │ 0.05       │ rsiDivergency5m │
// │  194 │ ANKRUSDT     │ 2023 12 14 15:50:00 │ 2023 12 15 00:10:00 │ SHORT        │ 0.66%  │ 19.92% │ 0.03       │ rsiDivergency5m │
// │  195 │ DOTUSDT      │ 2023 12 15 00:45:00 │ 2023 12 15 03:05:00 │ LONG         │ -0.51% │ 19.41% │ 7.33       │ rsiDivergency5m │
// │  196 │ ORDIUSDT     │ 2023 12 15 08:35:00 │ 2023 12 15 09:50:00 │ LONG         │ -0.51% │ 18.90% │ 55.04      │ rsiDivergency5m │
// │  197 │ FRONTUSDT    │ 2023 12 15 11:25:00 │ 2023 12 15 11:30:00 │ SHORT        │ -0.51% │ 18.38% │ 0.41       │ rsiDivergency5m │
// │  198 │ INJUSDT      │ 2023 12 15 11:35:00 │ 2023 12 15 18:20:00 │ SHORT        │ 2.49%  │ 20.87% │ 34.17      │ rsiDivergency5m │
// │  199 │ BEAMXUSDT    │ 2023 12 15 18:25:00 │ 2023 12 15 19:30:00 │ LONG         │ -0.51% │ 20.36% │ 0.02       │ rsiDivergency5m │
// │  200 │ BEAMXUSDT    │ 2023 12 15 19:35:00 │ 2023 12 16 03:55:00 │ LONG         │ 1.23%  │ 21.59% │ 0.02       │ rsiDivergency5m │
// │  201 │ DYDXUSDT     │ 2023 12 16 07:40:00 │ 2023 12 16 11:50:00 │ SHORT        │ -0.51% │ 21.08% │ 3.13       │ rsiDivergency5m │
// │  202 │ INJUSDT      │ 2023 12 16 12:10:00 │ 2023 12 16 14:45:00 │ SHORT        │ 2.49%  │ 23.57% │ 32.48      │ rsiDivergency5m │
// │  203 │ 1000SHIBUSDT │ 2023 12 16 15:05:00 │ 2023 12 16 15:15:00 │ SHORT        │ -0.51% │ 23.05% │ 0.01       │ rsiDivergency5m │
// │  204 │ 1000SHIBUSDT │ 2023 12 16 18:35:00 │ 2023 12 16 19:05:00 │ SHORT        │ -0.51% │ 22.54% │ 0.01       │ rsiDivergency5m │
// │  205 │ RNDRUSDT     │ 2023 12 17 00:45:00 │ 2023 12 17 08:50:00 │ LONG         │ -0.51% │ 22.03% │ 4.26       │ rsiDivergency5m │
// │  206 │ DARUSDT      │ 2023 12 17 11:50:00 │ 2023 12 17 20:10:00 │ SHORT        │ 1.36%  │ 23.38% │ 0.15       │ rsiDivergency5m │
// │  207 │ XVSUSDT      │ 2023 12 17 20:40:00 │ 2023 12 18 05:00:00 │ LONG         │ -0.02% │ 23.37% │ 9.66       │ rsiDivergency5m │
// │  208 │ TLMUSDT      │ 2023 12 18 05:15:00 │ 2023 12 18 05:30:00 │ LONG         │ -0.51% │ 22.85% │ 0.01       │ rsiDivergency5m │
// │  209 │ YGGUSDT      │ 2023 12 18 05:35:00 │ 2023 12 18 13:55:00 │ LONG         │ 0.69%  │ 23.55% │ 0.36       │ rsiDivergency5m │
// │  210 │ VETUSDT      │ 2023 12 18 14:05:00 │ 2023 12 18 16:05:00 │ SHORT        │ -0.51% │ 23.03% │ 0.03       │ rsiDivergency5m │
// │  211 │ FILUSDT      │ 2023 12 18 16:15:00 │ 2023 12 19 00:35:00 │ SHORT        │ -0.01% │ 23.02% │ 5.38       │ rsiDivergency5m │
// │  212 │ C98USDT      │ 2023 12 19 01:45:00 │ 2023 12 19 10:05:00 │ SHORT        │ 0.22%  │ 23.24% │ 0.24       │ rsiDivergency5m │
// │  213 │ SUIUSDT      │ 2023 12 19 11:40:00 │ 2023 12 19 12:35:00 │ SHORT        │ -0.51% │ 22.73% │ 0.67       │ rsiDivergency5m │
// │  214 │ ORDIUSDT     │ 2023 12 19 13:10:00 │ 2023 12 19 21:30:00 │ LONG         │ 0.99%  │ 23.72% │ 48.55      │ rsiDivergency5m │
// │  215 │ MAVUSDT      │ 2023 12 19 23:50:00 │ 2023 12 20 03:55:00 │ SHORT        │ -0.51% │ 23.20% │ 0.40       │ rsiDivergency5m │
// │  216 │ INJUSDT      │ 2023 12 20 04:05:00 │ 2023 12 20 12:25:00 │ SHORT        │ 1.23%  │ 24.43% │ 43.13      │ rsiDivergency5m │
// │  217 │ LEVERUSDT    │ 2023 12 20 18:45:00 │ 2023 12 20 18:55:00 │ SHORT        │ -0.51% │ 23.92% │ 0.00       │ rsiDivergency5m │
// │  218 │ RIFUSDT      │ 2023 12 20 22:35:00 │ 2023 12 21 06:55:00 │ LONG         │ 0.79%  │ 24.71% │ 0.14       │ rsiDivergency5m │
// │  219 │ ORDIUSDT     │ 2023 12 21 09:15:00 │ 2023 12 21 11:35:00 │ LONG         │ -0.51% │ 24.20% │ 52.32      │ rsiDivergency5m │
// │  220 │ OXTUSDT      │ 2023 12 21 11:50:00 │ 2023 12 21 20:10:00 │ LONG         │ 0.34%  │ 24.54% │ 0.09       │ rsiDivergency5m │
// │  221 │ SKLUSDT      │ 2023 12 21 23:10:00 │ 2023 12 22 07:30:00 │ SHORT        │ 1.26%  │ 25.79% │ 0.06       │ rsiDivergency5m │
// │  222 │ DODOXUSDT    │ 2023 12 22 10:50:00 │ 2023 12 22 19:10:00 │ SHORT        │ 0.53%  │ 26.32% │ 0.19       │ rsiDivergency5m │
// │  223 │ APTUSDT      │ 2023 12 22 19:15:00 │ 2023 12 22 19:30:00 │ SHORT        │ -0.51% │ 25.81% │ 9.62       │ rsiDivergency5m │
// │  224 │ STXUSDT      │ 2023 12 22 19:40:00 │ 2023 12 22 21:05:00 │ SHORT        │ -0.51% │ 25.30% │ 1.45       │ rsiDivergency5m │
// │  225 │ SSVUSDT      │ 2023 12 22 22:00:00 │ 2023 12 22 22:55:00 │ LONG         │ -0.51% │ 24.78% │ 24.82      │ rsiDivergency5m │
// │  226 │ USTCUSDT     │ 2023 12 22 22:55:00 │ 2023 12 23 07:15:00 │ LONG         │ -0.01% │ 24.78% │ 0.04       │ rsiDivergency5m │
// │  227 │ C98USDT      │ 2023 12 23 08:00:00 │ 2023 12 23 08:15:00 │ SHORT        │ -0.51% │ 24.27% │ 0.27       │ rsiDivergency5m │
// │  228 │ RNDRUSDT     │ 2023 12 23 10:45:00 │ 2023 12 23 14:10:00 │ SHORT        │ -0.51% │ 23.75% │ 4.73       │ rsiDivergency5m │
// │  229 │ RNDRUSDT     │ 2023 12 23 14:15:00 │ 2023 12 23 15:00:00 │ SHORT        │ -0.51% │ 23.24% │ 4.83       │ rsiDivergency5m │
// │  230 │ SUPERUSDT    │ 2023 12 23 19:55:00 │ 2023 12 24 04:15:00 │ LONG         │ 0.32%  │ 23.56% │ 0.66       │ rsiDivergency5m │
// │  231 │ SPELLUSDT    │ 2023 12 24 08:10:00 │ 2023 12 24 08:50:00 │ SHORT        │ -0.51% │ 23.05% │ 0.00       │ rsiDivergency5m │
// │  232 │ ARUSDT       │ 2023 12 24 09:35:00 │ 2023 12 24 09:40:00 │ SHORT        │ -0.51% │ 22.53% │ 11.01      │ rsiDivergency5m │
// │  233 │ CELRUSDT     │ 2023 12 24 11:50:00 │ 2023 12 24 12:30:00 │ SHORT        │ -0.51% │ 22.02% │ 0.02       │ rsiDivergency5m │
// │  234 │ NTRNUSDT     │ 2023 12 24 13:15:00 │ 2023 12 24 14:20:00 │ SHORT        │ -0.51% │ 21.51% │ 1.19       │ rsiDivergency5m │
// │  235 │ HOTUSDT      │ 2023 12 24 16:50:00 │ 2023 12 24 17:15:00 │ LONG         │ -0.51% │ 21.00% │ 0.00       │ rsiDivergency5m │
// │  236 │ INJUSDT      │ 2023 12 24 19:45:00 │ 2023 12 25 04:05:00 │ LONG         │ 0.42%  │ 21.41% │ 39.90      │ rsiDivergency5m │
// │  237 │ ONEUSDT      │ 2023 12 25 06:10:00 │ 2023 12 25 06:35:00 │ SHORT        │ -0.51% │ 20.90% │ 0.02       │ rsiDivergency5m │
// │  238 │ 1000SATSUSDT │ 2023 12 25 06:55:00 │ 2023 12 25 07:00:00 │ SHORT        │ -0.51% │ 20.39% │ 0.00       │ rsiDivergency5m │
// │  239 │ 1000SATSUSDT │ 2023 12 25 07:05:00 │ 2023 12 25 08:10:00 │ SHORT        │ -0.51% │ 19.88% │ 0.00       │ rsiDivergency5m │
// │  240 │ RENUSDT      │ 2023 12 25 08:15:00 │ 2023 12 25 10:00:00 │ SHORT        │ -0.51% │ 19.36% │ 0.07       │ rsiDivergency5m │
// │  241 │ NTRNUSDT     │ 2023 12 25 20:45:00 │ 2023 12 25 21:15:00 │ SHORT        │ -0.51% │ 18.85% │ 1.26       │ rsiDivergency5m │
// │  242 │ SANDUSDT     │ 2023 12 25 21:25:00 │ 2023 12 25 21:40:00 │ SHORT        │ -0.51% │ 18.34% │ 0.65       │ rsiDivergency5m │
// │  243 │ WLDUSDT      │ 2023 12 25 22:20:00 │ 2023 12 25 22:40:00 │ SHORT        │ -0.51% │ 17.83% │ 3.99       │ rsiDivergency5m │
// │  244 │ NTRNUSDT     │ 2023 12 26 00:20:00 │ 2023 12 26 00:50:00 │ SHORT        │ -0.51% │ 17.31% │ 1.36       │ rsiDivergency5m │
// │  245 │ BEAMXUSDT    │ 2023 12 26 01:05:00 │ 2023 12 26 09:25:00 │ LONG         │ 1.06%  │ 18.37% │ 0.02       │ rsiDivergency5m │
// │  246 │ 1000BONKUSDT │ 2023 12 26 12:15:00 │ 2023 12 26 12:35:00 │ LONG         │ -0.51% │ 17.86% │ 0.02       │ rsiDivergency5m │
// │  247 │ STXUSDT      │ 2023 12 26 14:40:00 │ 2023 12 26 15:45:00 │ SHORT        │ -0.51% │ 17.35% │ 1.62       │ rsiDivergency5m │
// │  248 │ TOKENUSDT    │ 2023 12 26 17:10:00 │ 2023 12 26 19:05:00 │ SHORT        │ -0.51% │ 16.84% │ 0.04       │ rsiDivergency5m │
// │  249 │ CFXUSDT      │ 2023 12 26 19:20:00 │ 2023 12 27 03:40:00 │ SHORT        │ 0.68%  │ 17.52% │ 0.20       │ rsiDivergency5m │
// │  250 │ 1000SATSUSDT │ 2023 12 27 04:45:00 │ 2023 12 27 13:05:00 │ SHORT        │ 1.12%  │ 18.64% │ 0.00       │ rsiDivergency5m │
// │  251 │ LDOUSDT      │ 2023 12 27 17:10:00 │ 2023 12 27 19:35:00 │ SHORT        │ -0.51% │ 18.13% │ 2.84       │ rsiDivergency5m │
// │  252 │ MINAUSDT     │ 2023 12 27 21:10:00 │ 2023 12 28 00:20:00 │ LONG         │ -0.51% │ 17.61% │ 1.30       │ rsiDivergency5m │
// │  253 │ LEVERUSDT    │ 2023 12 28 01:55:00 │ 2023 12 28 07:55:00 │ LONG         │ -0.51% │ 17.10% │ 0.00       │ rsiDivergency5m │
// │  254 │ 1000LUNCUSDT │ 2023 12 28 08:00:00 │ 2023 12 28 09:15:00 │ LONG         │ -0.51% │ 16.59% │ 0.15       │ rsiDivergency5m │
// │  255 │ RSRUSDT      │ 2023 12 28 09:25:00 │ 2023 12 28 16:45:00 │ LONG         │ -0.51% │ 16.08% │ 0.00       │ rsiDivergency5m │
// │  256 │ HOOKUSDT     │ 2023 12 28 16:50:00 │ 2023 12 28 19:50:00 │ LONG         │ -0.51% │ 15.56% │ 1.17       │ rsiDivergency5m │
// │  257 │ ARUSDT       │ 2023 12 28 19:55:00 │ 2023 12 29 04:15:00 │ LONG         │ 0.91%  │ 16.47% │ 9.57       │ rsiDivergency5m │
// │  258 │ MINAUSDT     │ 2023 12 29 04:20:00 │ 2023 12 29 05:00:00 │ SHORT        │ -0.51% │ 15.96% │ 1.34       │ rsiDivergency5m │
// │  259 │ 1000BONKUSDT │ 2023 12 29 05:05:00 │ 2023 12 29 11:55:00 │ SHORT        │ 2.49%  │ 18.45% │ 0.02       │ rsiDivergency5m │
// │  260 │ ORDIUSDT     │ 2023 12 29 12:10:00 │ 2023 12 29 19:45:00 │ LONG         │ 2.49%  │ 20.93% │ 72.25      │ rsiDivergency5m │
// │  261 │ HFTUSDT      │ 2023 12 29 20:10:00 │ 2023 12 30 03:50:00 │ LONG         │ -0.51% │ 20.42% │ 0.38       │ rsiDivergency5m │
// │  262 │ WLDUSDT      │ 2023 12 30 07:55:00 │ 2023 12 30 08:35:00 │ SHORT        │ -0.51% │ 19.91% │ 3.73       │ rsiDivergency5m │
// │  263 │ GMXUSDT      │ 2023 12 30 10:00:00 │ 2023 12 30 10:35:00 │ SHORT        │ -0.51% │ 19.40% │ 55.51      │ rsiDivergency5m │
// │  264 │ ORDIUSDT     │ 2023 12 30 13:55:00 │ 2023 12 30 22:15:00 │ SHORT        │ 1.31%  │ 20.71% │ 83.14      │ rsiDivergency5m │
// │  265 │ ARBUSDT      │ 2023 12 31 07:30:00 │ 2023 12 31 15:50:00 │ SHORT        │ 1.34%  │ 22.04% │ 1.65       │ rsiDivergency5m │
// │  266 │ ROSEUSDT     │ 2023 12 31 18:25:00 │ 2023 12 31 23:15:00 │ LONG         │ -0.51% │ 21.53% │ 0.14       │ rsiDivergency5m │
// │  267 │ TOKENUSDT    │ 2023 12 31 23:30:00 │ 2024 01 01 07:50:00 │ LONG         │ -0.04% │ 21.49% │ 0.03       │ rsiDivergency5m │
// │  268 │ DEFIUSDT     │ 2024 01 01 08:10:00 │ 2024 01 01 14:55:00 │ SHORT        │ -0.51% │ 20.98% │ 985.30     │ rsiDivergency5m │
// │  269 │ OXTUSDT      │ 2024 01 01 17:05:00 │ 2024 01 01 17:20:00 │ SHORT        │ -0.51% │ 20.47% │ 0.11       │ rsiDivergency5m │
// │  270 │ OXTUSDT      │ 2024 01 01 17:25:00 │ 2024 01 01 18:30:00 │ SHORT        │ -0.51% │ 19.96% │ 0.11       │ rsiDivergency5m │
// │  271 │ 1000BONKUSDT │ 2024 01 01 18:40:00 │ 2024 01 01 18:55:00 │ SHORT        │ -0.51% │ 19.44% │ 0.01       │ rsiDivergency5m │
// │  272 │ STXUSDT      │ 2024 01 01 20:30:00 │ 2024 01 01 21:55:00 │ SHORT        │ -0.51% │ 18.93% │ 1.68       │ rsiDivergency5m │
// │  273 │ BIGTIMEUSDT  │ 2024 01 01 23:15:00 │ 2024 01 01 23:35:00 │ SHORT        │ -0.51% │ 18.42% │ 0.50       │ rsiDivergency5m │
// │  274 │ LDOUSDT      │ 2024 01 02 00:10:00 │ 2024 01 02 08:30:00 │ SHORT        │ 0.68%  │ 19.10% │ 3.15       │ rsiDivergency5m │
// │  275 │ GMTUSDT      │ 2024 01 02 14:40:00 │ 2024 01 02 23:00:00 │ SHORT        │ 1.67%  │ 20.76% │ 0.38       │ rsiDivergency5m │
// │  276 │ OXTUSDT      │ 2024 01 03 01:10:00 │ 2024 01 03 03:10:00 │ LONG         │ -0.51% │ 20.25% │ 0.11       │ rsiDivergency5m │
// │  277 │ LINAUSDT     │ 2024 01 03 07:40:00 │ 2024 01 03 09:15:00 │ LONG         │ -0.51% │ 19.74% │ 0.01       │ rsiDivergency5m │
// │  278 │ FRONTUSDT    │ 2024 01 03 11:55:00 │ 2024 01 03 12:45:00 │ SHORT        │ -0.51% │ 19.22% │ 0.42       │ rsiDivergency5m │
// │  279 │ FRONTUSDT    │ 2024 01 03 13:25:00 │ 2024 01 03 15:30:00 │ SHORT        │ -0.51% │ 18.71% │ 0.43       │ rsiDivergency5m │
// │  280 │ NKNUSDT      │ 2024 01 03 17:00:00 │ 2024 01 03 18:25:00 │ SHORT        │ -0.51% │ 18.20% │ 0.12       │ rsiDivergency5m │
// │  281 │ HIGHUSDT     │ 2024 01 03 23:50:00 │ 2024 01 04 08:10:00 │ SHORT        │ 0.44%  │ 18.64% │ 1.54       │ rsiDivergency5m │
// │  282 │ APTUSDT      │ 2024 01 04 08:20:00 │ 2024 01 04 09:35:00 │ SHORT        │ -0.51% │ 18.13% │ 10.65      │ rsiDivergency5m │
// │  283 │ ARBUSDT      │ 2024 01 04 10:20:00 │ 2024 01 04 10:55:00 │ SHORT        │ -0.51% │ 17.62% │ 2.02       │ rsiDivergency5m │
// │  284 │ 1000LUNCUSDT │ 2024 01 04 12:20:00 │ 2024 01 04 16:15:00 │ SHORT        │ -0.51% │ 17.10% │ 0.13       │ rsiDivergency5m │
// │  285 │ APTUSDT      │ 2024 01 04 18:15:00 │ 2024 01 04 20:45:00 │ LONG         │ -0.51% │ 16.59% │ 10.41      │ rsiDivergency5m │
// │  286 │ NTRNUSDT     │ 2024 01 05 03:35:00 │ 2024 01 05 11:00:00 │ SHORT        │ 2.49%  │ 19.08% │ 1.41       │ rsiDivergency5m │
// │  287 │ NKNUSDT      │ 2024 01 05 11:10:00 │ 2024 01 05 16:05:00 │ LONG         │ -0.51% │ 18.57% │ 0.13       │ rsiDivergency5m │
// │  288 │ NKNUSDT      │ 2024 01 05 17:40:00 │ 2024 01 06 02:00:00 │ SHORT        │ 2.06%  │ 20.62% │ 0.13       │ rsiDivergency5m │
// │  289 │ MINAUSDT     │ 2024 01 06 02:05:00 │ 2024 01 06 10:25:00 │ LONG         │ 0.84%  │ 21.46% │ 1.08       │ rsiDivergency5m │
// │  290 │ GMTUSDT      │ 2024 01 06 10:55:00 │ 2024 01 06 11:00:00 │ SHORT        │ -0.51% │ 20.95% │ 0.31       │ rsiDivergency5m │
// │  291 │ SUPERUSDT    │ 2024 01 06 11:05:00 │ 2024 01 06 19:25:00 │ SHORT        │ 0.61%  │ 21.56% │ 0.57       │ rsiDivergency5m │
// │  292 │ FRONTUSDT    │ 2024 01 06 22:30:00 │ 2024 01 07 01:15:00 │ LONG         │ 2.49%  │ 24.04% │ 0.44       │ rsiDivergency5m │
// │  293 │ IOTAUSDT     │ 2024 01 07 03:25:00 │ 2024 01 07 11:45:00 │ SHORT        │ 2.49%  │ 26.53% │ 0.28       │ rsiDivergency5m │
// │  294 │ IDUSDT       │ 2024 01 07 11:50:00 │ 2024 01 07 17:15:00 │ LONG         │ -0.51% │ 26.02% │ 0.29       │ rsiDivergency5m │
// │  295 │ 1INCHUSDT    │ 2024 01 07 18:30:00 │ 2024 01 07 19:50:00 │ LONG         │ -0.51% │ 25.51% │ 0.41       │ rsiDivergency5m │
// │  296 │ NTRNUSDT     │ 2024 01 07 20:00:00 │ 2024 01 07 21:15:00 │ LONG         │ -0.51% │ 24.99% │ 1.36       │ rsiDivergency5m │
// │  297 │ ONTUSDT      │ 2024 01 07 21:20:00 │ 2024 01 07 21:35:00 │ LONG         │ -0.51% │ 24.48% │ 0.22       │ rsiDivergency5m │
// │  298 │ BEAMXUSDT    │ 2024 01 07 21:40:00 │ 2024 01 07 21:50:00 │ LONG         │ -0.51% │ 23.97% │ 0.02       │ rsiDivergency5m │
// │  299 │ HIFIUSDT     │ 2024 01 07 21:55:00 │ 2024 01 07 22:25:00 │ LONG         │ -0.51% │ 23.46% │ 0.58       │ rsiDivergency5m │
// │  300 │ SNXUSDT      │ 2024 01 07 22:30:00 │ 2024 01 08 06:50:00 │ LONG         │ 1.61%  │ 25.07% │ 3.12       │ rsiDivergency5m │
// │  301 │ ZILUSDT      │ 2024 01 08 07:05:00 │ 2024 01 08 07:55:00 │ SHORT        │ -0.51% │ 24.55% │ 0.02       │ rsiDivergency5m │
// │  302 │ COTIUSDT     │ 2024 01 08 08:00:00 │ 2024 01 08 13:10:00 │ SHORT        │ -0.51% │ 24.04% │ 0.06       │ rsiDivergency5m │
// │  303 │ KNCUSDT      │ 2024 01 08 13:25:00 │ 2024 01 08 21:45:00 │ SHORT        │ 0.22%  │ 24.26% │ 0.66       │ rsiDivergency5m │
// │  304 │ 1000BONKUSDT │ 2024 01 09 02:25:00 │ 2024 01 09 07:55:00 │ SHORT        │ 2.49%  │ 26.74% │ 0.01       │ rsiDivergency5m │
// │  305 │ GMTUSDT      │ 2024 01 09 09:25:00 │ 2024 01 09 11:30:00 │ LONG         │ -0.51% │ 26.23% │ 0.32       │ rsiDivergency5m │
// │  306 │ BONDUSDT     │ 2024 01 09 11:35:00 │ 2024 01 09 14:25:00 │ LONG         │ -0.51% │ 25.72% │ 3.37       │ rsiDivergency5m │
// │  307 │ ARBUSDT      │ 2024 01 09 15:20:00 │ 2024 01 09 17:10:00 │ LONG         │ 2.49%  │ 28.21% │ 1.64       │ rsiDivergency5m │
// │  308 │ SSVUSDT      │ 2024 01 09 17:20:00 │ 2024 01 09 19:35:00 │ SHORT        │ -0.51% │ 27.69% │ 32.49      │ rsiDivergency5m │
// │  309 │ SSVUSDT      │ 2024 01 09 19:40:00 │ 2024 01 10 04:00:00 │ SHORT        │ 0.64%  │ 28.34% │ 33.10      │ rsiDivergency5m │
// │  310 │ FXSUSDT      │ 2024 01 10 05:10:00 │ 2024 01 10 13:30:00 │ SHORT        │ 0.25%  │ 28.58% │ 8.74       │ rsiDivergency5m │
// │  311 │ SUPERUSDT    │ 2024 01 10 16:15:00 │ 2024 01 10 16:20:00 │ SHORT        │ -0.51% │ 28.07% │ 0.55       │ rsiDivergency5m │
// │  312 │ DOTUSDT      │ 2024 01 10 17:00:00 │ 2024 01 10 17:25:00 │ SHORT        │ -0.51% │ 27.56% │ 7.83       │ rsiDivergency5m │
// │  313 │ ORDIUSDT     │ 2024 01 10 17:30:00 │ 2024 01 10 18:10:00 │ SHORT        │ -0.51% │ 27.05% │ 74.95      │ rsiDivergency5m │
// │  314 │ MAVUSDT      │ 2024 01 10 18:15:00 │ 2024 01 11 01:50:00 │ SHORT        │ -0.51% │ 26.53% │ 0.50       │ rsiDivergency5m │
// │  315 │ NTRNUSDT     │ 2024 01 11 01:55:00 │ 2024 01 11 05:15:00 │ LONG         │ 2.49%  │ 29.02% │ 1.43       │ rsiDivergency5m │
// │  316 │ BEAMXUSDT    │ 2024 01 11 05:20:00 │ 2024 01 11 06:55:00 │ SHORT        │ -0.51% │ 28.51% │ 0.02       │ rsiDivergency5m │
// │  317 │ ARPAUSDT     │ 2024 01 11 07:15:00 │ 2024 01 11 15:35:00 │ SHORT        │ 0.44%  │ 28.95% │ 0.07       │ rsiDivergency5m │
// │  318 │ FRONTUSDT    │ 2024 01 11 18:40:00 │ 2024 01 12 03:00:00 │ SHORT        │ 0.24%  │ 29.19% │ 0.50       │ rsiDivergency5m │
// │  319 │ SSVUSDT      │ 2024 01 12 07:30:00 │ 2024 01 12 08:00:00 │ SHORT        │ -0.51% │ 28.68% │ 38.57      │ rsiDivergency5m │
// │  320 │ WLDUSDT      │ 2024 01 12 08:15:00 │ 2024 01 12 08:35:00 │ SHORT        │ -0.51% │ 28.17% │ 3.01       │ rsiDivergency5m │
// │  321 │ SSVUSDT      │ 2024 01 12 08:40:00 │ 2024 01 12 12:15:00 │ SHORT        │ 2.49%  │ 30.65% │ 39.82      │ rsiDivergency5m │
// │  322 │ SKLUSDT      │ 2024 01 12 12:20:00 │ 2024 01 12 16:40:00 │ LONG         │ -0.51% │ 30.14% │ 0.09       │ rsiDivergency5m │
// │  323 │ 1000LUNCUSDT │ 2024 01 12 17:05:00 │ 2024 01 12 17:20:00 │ LONG         │ -0.51% │ 29.63% │ 0.12       │ rsiDivergency5m │
// │  324 │ FXSUSDT      │ 2024 01 12 17:25:00 │ 2024 01 13 01:45:00 │ LONG         │ 0.07%  │ 29.70% │ 8.73       │ rsiDivergency5m │
// │  325 │ MTLUSDT      │ 2024 01 13 01:50:00 │ 2024 01 13 10:10:00 │ SHORT        │ 0.23%  │ 29.93% │ 1.60       │ rsiDivergency5m │
// │  326 │ ORDIUSDT     │ 2024 01 13 12:40:00 │ 2024 01 13 17:25:00 │ SHORT        │ -0.51% │ 29.42% │ 76.08      │ rsiDivergency5m │
// │  327 │ TUSDT        │ 2024 01 13 20:00:00 │ 2024 01 14 02:40:00 │ SHORT        │ -0.51% │ 28.90% │ 0.04       │ rsiDivergency5m │
// │  328 │ ACEUSDT      │ 2024 01 14 03:55:00 │ 2024 01 14 08:35:00 │ SHORT        │ -0.51% │ 28.39% │ 9.81       │ rsiDivergency5m │
// │  329 │ SSVUSDT      │ 2024 01 14 11:45:00 │ 2024 01 14 14:35:00 │ LONG         │ -0.51% │ 27.88% │ 34.07      │ rsiDivergency5m │
// │  330 │ SUPERUSDT    │ 2024 01 15 01:25:00 │ 2024 01 15 03:55:00 │ SHORT        │ -0.51% │ 27.37% │ 0.64       │ rsiDivergency5m │
// │  331 │ BIGTIMEUSDT  │ 2024 01 15 04:45:00 │ 2024 01 15 06:45:00 │ SHORT        │ -0.51% │ 26.85% │ 0.45       │ rsiDivergency5m │
// │  332 │ BIGTIMEUSDT  │ 2024 01 15 06:50:00 │ 2024 01 15 08:30:00 │ SHORT        │ -0.51% │ 26.34% │ 0.46       │ rsiDivergency5m │
// │  333 │ AIUSDT       │ 2024 01 15 13:35:00 │ 2024 01 15 15:05:00 │ SHORT        │ -0.51% │ 25.83% │ 1.42       │ rsiDivergency5m │
// │  334 │ USTCUSDT     │ 2024 01 15 15:30:00 │ 2024 01 15 23:50:00 │ SHORT        │ 1.41%  │ 27.24% │ 0.03       │ rsiDivergency5m │
// │  335 │ MAVUSDT      │ 2024 01 16 00:00:00 │ 2024 01 16 00:10:00 │ SHORT        │ -0.51% │ 26.73% │ 0.55       │ rsiDivergency5m │
// │  336 │ ENSUSDT      │ 2024 01 16 03:05:00 │ 2024 01 16 09:40:00 │ LONG         │ -0.51% │ 26.21% │ 21.82      │ rsiDivergency5m │
// │  337 │ PENDLEUSDT   │ 2024 01 16 16:35:00 │ 2024 01 17 00:55:00 │ SHORT        │ 1.05%  │ 27.26% │ 2.13       │ rsiDivergency5m │
// │  338 │ MAVUSDT      │ 2024 01 17 05:30:00 │ 2024 01 17 12:50:00 │ SHORT        │ -0.51% │ 26.75% │ 0.69       │ rsiDivergency5m │
// │  339 │ AIUSDT       │ 2024 01 17 15:10:00 │ 2024 01 17 22:20:00 │ SHORT        │ 2.49%  │ 29.24% │ 1.40       │ rsiDivergency5m │
// │  340 │ GASUSDT      │ 2024 01 17 23:30:00 │ 2024 01 18 03:20:00 │ SHORT        │ -0.51% │ 28.73% │ 7.21       │ rsiDivergency5m │
// │  341 │ ARPAUSDT     │ 2024 01 18 10:30:00 │ 2024 01 18 12:50:00 │ LONG         │ -0.51% │ 28.21% │ 0.07       │ rsiDivergency5m │
// │  342 │ HIGHUSDT     │ 2024 01 18 12:55:00 │ 2024 01 18 14:55:00 │ LONG         │ -0.51% │ 27.70% │ 1.52       │ rsiDivergency5m │
// │  343 │ NTRNUSDT     │ 2024 01 18 15:00:00 │ 2024 01 18 23:20:00 │ LONG         │ -0.12% │ 27.58% │ 1.22       │ rsiDivergency5m │
// │  344 │ USTCUSDT     │ 2024 01 19 00:30:00 │ 2024 01 19 08:50:00 │ LONG         │ 0.39%  │ 27.97% │ 0.03       │ rsiDivergency5m │
// │  345 │ GASUSDT      │ 2024 01 19 11:10:00 │ 2024 01 19 11:40:00 │ LONG         │ -0.51% │ 27.46% │ 6.62       │ rsiDivergency5m │
// │  346 │ GASUSDT      │ 2024 01 19 12:00:00 │ 2024 01 19 12:05:00 │ LONG         │ -0.51% │ 26.95% │ 6.40       │ rsiDivergency5m │
// │  347 │ DARUSDT      │ 2024 01 19 15:35:00 │ 2024 01 19 18:25:00 │ SHORT        │ -0.51% │ 26.43% │ 0.11       │ rsiDivergency5m │
// │  348 │ DARUSDT      │ 2024 01 19 18:35:00 │ 2024 01 20 02:55:00 │ SHORT        │ 0.20%  │ 26.64% │ 0.12       │ rsiDivergency5m │
// │  349 │ DYDXUSDT     │ 2024 01 20 03:55:00 │ 2024 01 20 12:15:00 │ LONG         │ -0.35% │ 26.29% │ 2.82       │ rsiDivergency5m │
// │  350 │ DOGEUSDT     │ 2024 01 20 18:25:00 │ 2024 01 21 02:45:00 │ SHORT        │ 0.90%  │ 27.19% │ 0.09       │ rsiDivergency5m │
// │  351 │ PENDLEUSDT   │ 2024 01 21 03:15:00 │ 2024 01 21 04:45:00 │ SHORT        │ -0.51% │ 26.67% │ 2.24       │ rsiDivergency5m │
// │  352 │ PENDLEUSDT   │ 2024 01 21 05:05:00 │ 2024 01 21 06:00:00 │ SHORT        │ -0.51% │ 26.16% │ 2.29       │ rsiDivergency5m │
// │  353 │ FRONTUSDT    │ 2024 01 21 06:05:00 │ 2024 01 21 07:00:00 │ SHORT        │ -0.51% │ 25.65% │ 0.50       │ rsiDivergency5m │
// │  354 │ SUIUSDT      │ 2024 01 21 20:30:00 │ 2024 01 22 04:50:00 │ LONG         │ 0.10%  │ 25.75% │ 1.02       │ rsiDivergency5m │
// │  355 │ UMAUSDT      │ 2024 01 22 05:10:00 │ 2024 01 22 05:20:00 │ LONG         │ -0.51% │ 25.24% │ 5.01       │ rsiDivergency5m │
// │  356 │ MAVUSDT      │ 2024 01 22 08:10:00 │ 2024 01 22 08:20:00 │ SHORT        │ -0.51% │ 24.72% │ 0.55       │ rsiDivergency5m │
// │  357 │ AMBUSDT      │ 2024 01 22 18:45:00 │ 2024 01 22 19:35:00 │ LONG         │ -0.51% │ 24.21% │ 0.01       │ rsiDivergency5m │
// │  358 │ PENDLEUSDT   │ 2024 01 23 02:45:00 │ 2024 01 23 04:25:00 │ LONG         │ -0.51% │ 23.70% │ 1.92       │ rsiDivergency5m │
// │  359 │ BIGTIMEUSDT  │ 2024 01 23 04:30:00 │ 2024 01 23 09:00:00 │ LONG         │ -0.51% │ 23.19% │ 0.32       │ rsiDivergency5m │
// │  360 │ BEAMXUSDT    │ 2024 01 23 12:25:00 │ 2024 01 23 17:50:00 │ SHORT        │ -0.51% │ 22.67% │ 0.02       │ rsiDivergency5m │
// │  361 │ ALGOUSDT     │ 2024 01 23 17:55:00 │ 2024 01 23 19:50:00 │ SHORT        │ -0.51% │ 22.16% │ 0.16       │ rsiDivergency5m │
// │  362 │ ORDIUSDT     │ 2024 01 23 19:55:00 │ 2024 01 24 04:15:00 │ SHORT        │ 0.51%  │ 22.67% │ 55.87      │ rsiDivergency5m │
// │  363 │ PENDLEUSDT   │ 2024 01 24 04:45:00 │ 2024 01 24 05:00:00 │ SHORT        │ -0.51% │ 22.16% │ 2.18       │ rsiDivergency5m │
// │  364 │ FXSUSDT      │ 2024 01 24 05:35:00 │ 2024 01 24 13:55:00 │ SHORT        │ 0.26%  │ 22.41% │ 10.06      │ rsiDivergency5m │
// │  365 │ MAVUSDT      │ 2024 01 24 14:45:00 │ 2024 01 24 16:40:00 │ LONG         │ -0.51% │ 21.90% │ 0.56       │ rsiDivergency5m │
// │  366 │ MAVUSDT      │ 2024 01 25 00:15:00 │ 2024 01 25 07:50:00 │ LONG         │ -0.51% │ 21.39% │ 0.53       │ rsiDivergency5m │
// │  367 │ ORDIUSDT     │ 2024 01 25 08:20:00 │ 2024 01 25 16:40:00 │ LONG         │ 0.72%  │ 22.11% │ 49.79      │ rsiDivergency5m │
// │  368 │ UMAUSDT      │ 2024 01 26 02:40:00 │ 2024 01 26 11:00:00 │ SHORT        │ 2.14%  │ 24.24% │ 5.69       │ rsiDivergency5m │
// │  369 │ SUIUSDT      │ 2024 01 26 11:50:00 │ 2024 01 26 12:45:00 │ SHORT        │ -0.51% │ 23.73% │ 1.34       │ rsiDivergency5m │
// │  370 │ SUIUSDT      │ 2024 01 26 13:10:00 │ 2024 01 26 14:15:00 │ SHORT        │ -0.51% │ 23.22% │ 1.41       │ rsiDivergency5m │
// │  371 │ 1000SATSUSDT │ 2024 01 26 20:35:00 │ 2024 01 27 04:55:00 │ SHORT        │ 0.81%  │ 24.02% │ 0.00       │ rsiDivergency5m │
// │  372 │ MANTAUSDT    │ 2024 01 27 05:10:00 │ 2024 01 27 10:35:00 │ SHORT        │ -0.51% │ 23.51% │ 3.61       │ rsiDivergency5m │
// │  373 │ BIGTIMEUSDT  │ 2024 01 27 14:05:00 │ 2024 01 27 22:25:00 │ SHORT        │ 0.62%  │ 24.13% │ 0.39       │ rsiDivergency5m │
// │  374 │ MANTAUSDT    │ 2024 01 28 07:25:00 │ 2024 01 28 15:45:00 │ LONG         │ 0.44%  │ 24.57% │ 3.46       │ rsiDivergency5m │
// │  375 │ 1000BONKUSDT │ 2024 01 28 18:10:00 │ 2024 01 29 02:30:00 │ LONG         │ 0.63%  │ 25.20% │ 0.01       │ rsiDivergency5m │
// │  376 │ LSKUSDT      │ 2024 01 29 06:35:00 │ 2024 01 29 10:50:00 │ SHORT        │ -0.51% │ 24.69% │ 1.46       │ rsiDivergency5m │
// │  377 │ SUIUSDT      │ 2024 01 29 12:35:00 │ 2024 01 29 20:25:00 │ SHORT        │ -0.51% │ 24.17% │ 1.55       │ rsiDivergency5m │
// │  378 │ HIGHUSDT     │ 2024 01 29 21:35:00 │ 2024 01 30 05:55:00 │ SHORT        │ 0.82%  │ 24.99% │ 1.59       │ rsiDivergency5m │
// │  379 │ MAVUSDT      │ 2024 01 30 10:00:00 │ 2024 01 30 10:15:00 │ SHORT        │ -0.51% │ 24.48% │ 0.65       │ rsiDivergency5m │
// │  380 │ MAVUSDT      │ 2024 01 30 11:35:00 │ 2024 01 30 12:05:00 │ SHORT        │ -0.51% │ 23.97% │ 0.69       │ rsiDivergency5m │
// │  381 │ AIUSDT       │ 2024 01 30 14:30:00 │ 2024 01 30 22:50:00 │ SHORT        │ 0.32%  │ 24.29% │ 1.36       │ rsiDivergency5m │
// │  382 │ OGNUSDT      │ 2024 01 31 03:50:00 │ 2024 01 31 05:40:00 │ LONG         │ -0.51% │ 23.78% │ 0.16       │ rsiDivergency5m │
// │  383 │ CKBUSDT      │ 2024 01 31 13:30:00 │ 2024 01 31 21:00:00 │ SHORT        │ 2.49%  │ 26.27% │ 0.00       │ rsiDivergency5m │
// │  384 │ SUPERUSDT    │ 2024 02 01 02:30:00 │ 2024 02 01 09:25:00 │ SHORT        │ -0.51% │ 25.75% │ 0.59       │ rsiDivergency5m │
// │  385 │ MAVUSDT      │ 2024 02 01 17:40:00 │ 2024 02 02 00:10:00 │ LONG         │ -0.51% │ 25.24% │ 0.67       │ rsiDivergency5m │
// │  386 │ CKBUSDT      │ 2024 02 02 00:50:00 │ 2024 02 02 02:00:00 │ LONG         │ -0.51% │ 24.73% │ 0.00       │ rsiDivergency5m │
// │  387 │ CKBUSDT      │ 2024 02 02 02:30:00 │ 2024 02 02 09:15:00 │ LONG         │ -0.51% │ 24.22% │ 0.00       │ rsiDivergency5m │
// │  388 │ ROSEUSDT     │ 2024 02 02 11:00:00 │ 2024 02 02 11:50:00 │ SHORT        │ -0.51% │ 23.70% │ 0.11       │ rsiDivergency5m │
// │  389 │ ROSEUSDT     │ 2024 02 02 12:10:00 │ 2024 02 02 16:30:00 │ SHORT        │ -0.51% │ 23.19% │ 0.11       │ rsiDivergency5m │
// │  390 │ UMAUSDT      │ 2024 02 02 19:10:00 │ 2024 02 03 00:00:00 │ LONG         │ -0.51% │ 22.68% │ 4.40       │ rsiDivergency5m │
// │  391 │ NMRUSDT      │ 2024 02 03 05:55:00 │ 2024 02 03 14:15:00 │ SHORT        │ 0.17%  │ 22.85% │ 24.61      │ rsiDivergency5m │
// │  392 │ 1000LUNCUSDT │ 2024 02 03 14:20:00 │ 2024 02 03 15:00:00 │ SHORT        │ -0.51% │ 22.34% │ 0.10       │ rsiDivergency5m │
// │  393 │ 1000LUNCUSDT │ 2024 02 03 15:10:00 │ 2024 02 03 15:15:00 │ SHORT        │ -0.51% │ 21.82% │ 0.11       │ rsiDivergency5m │
// │  394 │ 1000LUNCUSDT │ 2024 02 03 15:20:00 │ 2024 02 03 16:00:00 │ SHORT        │ -0.51% │ 21.31% │ 0.11       │ rsiDivergency5m │
// │  395 │ USTCUSDT     │ 2024 02 03 17:25:00 │ 2024 02 04 01:45:00 │ SHORT        │ 1.36%  │ 22.67% │ 0.03       │ rsiDivergency5m │
// │  396 │ 1000LUNCUSDT │ 2024 02 04 03:55:00 │ 2024 02 04 10:50:00 │ LONG         │ 2.49%  │ 25.16% │ 0.10       │ rsiDivergency5m │
// │  397 │ 1000LUNCUSDT │ 2024 02 04 10:55:00 │ 2024 02 04 11:05:00 │ SHORT        │ -0.51% │ 24.64% │ 0.11       │ rsiDivergency5m │
// │  398 │ ROSEUSDT     │ 2024 02 04 17:55:00 │ 2024 02 05 02:15:00 │ LONG         │ 0.00%  │ 24.65% │ 0.11       │ rsiDivergency5m │
// │  399 │ 1000LUNCUSDT │ 2024 02 05 02:20:00 │ 2024 02 05 10:40:00 │ SHORT        │ 1.45%  │ 26.10% │ 0.11       │ rsiDivergency5m │
// │  400 │ PENDLEUSDT   │ 2024 02 05 11:00:00 │ 2024 02 05 19:20:00 │ LONG         │ 0.22%  │ 26.32% │ 2.91       │ rsiDivergency5m │
// │  401 │ NMRUSDT      │ 2024 02 06 01:05:00 │ 2024 02 06 01:50:00 │ LONG         │ -0.51% │ 25.81% │ 26.97      │ rsiDivergency5m │
// │  402 │ NMRUSDT      │ 2024 02 06 02:50:00 │ 2024 02 06 10:45:00 │ LONG         │ -0.51% │ 25.30% │ 25.79      │ rsiDivergency5m │
// │  403 │ OXTUSDT      │ 2024 02 06 12:40:00 │ 2024 02 06 21:00:00 │ LONG         │ 0.90%  │ 26.20% │ 0.10       │ rsiDivergency5m │
// │  404 │ ZETAUSDT     │ 2024 02 07 02:45:00 │ 2024 02 07 10:45:00 │ LONG         │ 2.49%  │ 28.69% │ 1.15       │ rsiDivergency5m │
// │  405 │ STGUSDT      │ 2024 02 07 13:30:00 │ 2024 02 07 21:35:00 │ SHORT        │ -0.51% │ 28.18% │ 0.55       │ rsiDivergency5m │
// │  406 │ XMRUSDT      │ 2024 02 08 02:55:00 │ 2024 02 08 11:15:00 │ LONG         │ 0.98%  │ 29.16% │ 119.16     │ rsiDivergency5m │
// │  407 │ ONDOUSDT     │ 2024 02 08 12:10:00 │ 2024 02 08 20:30:00 │ LONG         │ -0.17% │ 28.99% │ 0.23       │ rsiDivergency5m │
// │  408 │ COTIUSDT     │ 2024 02 08 20:45:00 │ 2024 02 08 21:00:00 │ SHORT        │ -0.51% │ 28.48% │ 0.08       │ rsiDivergency5m │
// │  409 │ IDUSDT       │ 2024 02 08 21:45:00 │ 2024 02 09 06:05:00 │ SHORT        │ 0.74%  │ 29.22% │ 0.62       │ rsiDivergency5m │
// │  410 │ SUIUSDT      │ 2024 02 09 11:20:00 │ 2024 02 09 13:25:00 │ SHORT        │ -0.51% │ 28.70% │ 1.70       │ rsiDivergency5m │
// │  411 │ SUIUSDT      │ 2024 02 09 13:45:00 │ 2024 02 09 15:00:00 │ SHORT        │ -0.51% │ 28.19% │ 1.76       │ rsiDivergency5m │
// │  412 │ PENDLEUSDT   │ 2024 02 09 19:25:00 │ 2024 02 09 20:40:00 │ SHORT        │ -0.51% │ 27.68% │ 3.22       │ rsiDivergency5m │
// │  413 │ PENDLEUSDT   │ 2024 02 09 20:55:00 │ 2024 02 09 23:05:00 │ SHORT        │ -0.51% │ 27.17% │ 3.29       │ rsiDivergency5m │
// │  414 │ PENDLEUSDT   │ 2024 02 10 05:25:00 │ 2024 02 10 13:45:00 │ LONG         │ -0.36% │ 26.81% │ 3.21       │ rsiDivergency5m │
// │  415 │ ZETAUSDT     │ 2024 02 10 15:25:00 │ 2024 02 10 23:45:00 │ SHORT        │ -0.10% │ 26.71% │ 1.54       │ rsiDivergency5m │
// │  416 │ ZETAUSDT     │ 2024 02 10 23:50:00 │ 2024 02 11 01:00:00 │ SHORT        │ -0.51% │ 26.20% │ 1.54       │ rsiDivergency5m │
// │  417 │ AIUSDT       │ 2024 02 11 02:55:00 │ 2024 02 11 03:20:00 │ SHORT        │ -0.51% │ 25.69% │ 1.35       │ rsiDivergency5m │
// │  418 │ AIUSDT       │ 2024 02 11 03:25:00 │ 2024 02 11 07:30:00 │ SHORT        │ -0.51% │ 25.17% │ 1.38       │ rsiDivergency5m │
// │  419 │ HIFIUSDT     │ 2024 02 11 08:40:00 │ 2024 02 11 09:00:00 │ SHORT        │ -0.51% │ 24.66% │ 0.64       │ rsiDivergency5m │
// │  420 │ BEAMXUSDT    │ 2024 02 11 09:05:00 │ 2024 02 11 17:25:00 │ LONG         │ 0.29%  │ 24.95% │ 0.02       │ rsiDivergency5m │
// │  421 │ COTIUSDT     │ 2024 02 11 21:40:00 │ 2024 02 12 01:00:00 │ LONG         │ -0.51% │ 24.44% │ 0.08       │ rsiDivergency5m │
// │  422 │ UMAUSDT      │ 2024 02 12 06:30:00 │ 2024 02 12 07:30:00 │ SHORT        │ -0.51% │ 23.93% │ 4.69       │ rsiDivergency5m │
// │  423 │ COTIUSDT     │ 2024 02 12 07:50:00 │ 2024 02 12 09:20:00 │ SHORT        │ -0.51% │ 23.42% │ 0.09       │ rsiDivergency5m │
// │  424 │ IMXUSDT      │ 2024 02 12 11:30:00 │ 2024 02 12 13:05:00 │ SHORT        │ -0.51% │ 22.90% │ 3.05       │ rsiDivergency5m │
// │  425 │ AIUSDT       │ 2024 02 12 13:50:00 │ 2024 02 12 22:10:00 │ SHORT        │ 1.73%  │ 24.64% │ 1.53       │ rsiDivergency5m │
// │  426 │ NTRNUSDT     │ 2024 02 12 22:25:00 │ 2024 02 13 06:45:00 │ SHORT        │ 0.39%  │ 25.03% │ 1.34       │ rsiDivergency5m │
// │  427 │ AIUSDT       │ 2024 02 13 06:50:00 │ 2024 02 13 15:10:00 │ SHORT        │ 0.32%  │ 25.35% │ 1.63       │ rsiDivergency5m │
// │  428 │ VETUSDT      │ 2024 02 14 00:45:00 │ 2024 02 14 01:25:00 │ SHORT        │ -0.51% │ 24.84% │ 0.03       │ rsiDivergency5m │
// │  429 │ ALTUSDT      │ 2024 02 14 01:30:00 │ 2024 02 14 03:45:00 │ SHORT        │ -0.51% │ 24.33% │ 0.38       │ rsiDivergency5m │
// │  430 │ TRUUSDT      │ 2024 02 14 06:40:00 │ 2024 02 14 15:00:00 │ SHORT        │ 0.73%  │ 25.05% │ 0.06       │ rsiDivergency5m │
// │  431 │ MANTAUSDT    │ 2024 02 14 15:10:00 │ 2024 02 14 17:40:00 │ SHORT        │ -0.51% │ 24.54% │ 3.07       │ rsiDivergency5m │
// │  432 │ NTRNUSDT     │ 2024 02 14 19:50:00 │ 2024 02 15 04:00:00 │ SHORT        │ -0.51% │ 24.03% │ 1.62       │ rsiDivergency5m │
// │  433 │ NTRNUSDT     │ 2024 02 15 04:50:00 │ 2024 02 15 05:10:00 │ SHORT        │ -0.51% │ 23.52% │ 1.69       │ rsiDivergency5m │
// │  434 │ NTRNUSDT     │ 2024 02 15 05:15:00 │ 2024 02 15 05:35:00 │ SHORT        │ -0.51% │ 23.00% │ 1.72       │ rsiDivergency5m │
// │  435 │ VETUSDT      │ 2024 02 15 06:25:00 │ 2024 02 15 06:30:00 │ SHORT        │ -0.51% │ 22.49% │ 0.04       │ rsiDivergency5m │
// │  436 │ VETUSDT      │ 2024 02 15 06:45:00 │ 2024 02 15 06:55:00 │ SHORT        │ -0.51% │ 21.98% │ 0.04       │ rsiDivergency5m │
// │  437 │ NEOUSDT      │ 2024 02 15 07:05:00 │ 2024 02 15 15:25:00 │ SHORT        │ 0.89%  │ 22.87% │ 13.46      │ rsiDivergency5m │
// │  438 │ ARUSDT       │ 2024 02 15 16:05:00 │ 2024 02 15 18:35:00 │ SHORT        │ -0.51% │ 22.36% │ 11.53      │ rsiDivergency5m │
// │  439 │ ARUSDT       │ 2024 02 15 18:45:00 │ 2024 02 15 18:50:00 │ SHORT        │ -0.51% │ 21.85% │ 11.83      │ rsiDivergency5m │
// │  440 │ ARUSDT       │ 2024 02 15 19:05:00 │ 2024 02 15 19:10:00 │ SHORT        │ -0.51% │ 21.33% │ 12.42      │ rsiDivergency5m │
// │  441 │ WLDUSDT      │ 2024 02 15 20:10:00 │ 2024 02 15 20:25:00 │ SHORT        │ -0.51% │ 20.82% │ 3.49       │ rsiDivergency5m │
// │  442 │ WLDUSDT      │ 2024 02 15 20:30:00 │ 2024 02 15 21:20:00 │ SHORT        │ -0.51% │ 20.31% │ 3.54       │ rsiDivergency5m │
// │  443 │ RNDRUSDT     │ 2024 02 15 22:35:00 │ 2024 02 15 23:40:00 │ SHORT        │ -0.51% │ 19.80% │ 5.42       │ rsiDivergency5m │
// │  444 │ NFPUSDT      │ 2024 02 16 01:20:00 │ 2024 02 16 05:25:00 │ SHORT        │ -0.51% │ 19.28% │ 0.67       │ rsiDivergency5m │
// │  445 │ TOKENUSDT    │ 2024 02 16 06:00:00 │ 2024 02 16 06:05:00 │ SHORT        │ -0.51% │ 18.77% │ 0.03       │ rsiDivergency5m │
// │  446 │ NFPUSDT      │ 2024 02 16 08:30:00 │ 2024 02 16 16:50:00 │ SHORT        │ 1.45%  │ 20.22% │ 0.75       │ rsiDivergency5m │
// │  447 │ ONDOUSDT     │ 2024 02 17 09:35:00 │ 2024 02 17 17:55:00 │ LONG         │ 1.01%  │ 21.22% │ 0.24       │ rsiDivergency5m │
// │  448 │ AIUSDT       │ 2024 02 17 20:40:00 │ 2024 02 17 21:35:00 │ SHORT        │ -0.51% │ 20.71% │ 1.70       │ rsiDivergency5m │
// │  449 │ STGUSDT      │ 2024 02 17 23:30:00 │ 2024 02 18 00:30:00 │ SHORT        │ -0.51% │ 20.20% │ 0.67       │ rsiDivergency5m │
// │  450 │ HOOKUSDT     │ 2024 02 18 00:45:00 │ 2024 02 18 09:05:00 │ SHORT        │ -0.16% │ 20.04% │ 1.07       │ rsiDivergency5m │
// │  451 │ CKBUSDT      │ 2024 02 18 09:50:00 │ 2024 02 18 10:00:00 │ SHORT        │ -0.51% │ 19.53% │ 0.01       │ rsiDivergency5m │
// │  452 │ LPTUSDT      │ 2024 02 18 11:30:00 │ 2024 02 18 12:40:00 │ SHORT        │ -0.51% │ 19.01% │ 19.14      │ rsiDivergency5m │
// │  453 │ ZETAUSDT     │ 2024 02 18 13:50:00 │ 2024 02 18 22:10:00 │ SHORT        │ 1.16%  │ 20.17% │ 2.75       │ rsiDivergency5m │
// │  454 │ NMRUSDT      │ 2024 02 18 23:30:00 │ 2024 02 19 04:15:00 │ SHORT        │ -0.51% │ 19.66% │ 34.97      │ rsiDivergency5m │
// │  455 │ ONDOUSDT     │ 2024 02 19 06:55:00 │ 2024 02 19 07:10:00 │ SHORT        │ -0.51% │ 19.15% │ 0.30       │ rsiDivergency5m │
// │  456 │ ARUSDT       │ 2024 02 19 07:40:00 │ 2024 02 19 07:50:00 │ SHORT        │ -0.51% │ 18.63% │ 13.64      │ rsiDivergency5m │
// │  457 │ ONDOUSDT     │ 2024 02 19 08:20:00 │ 2024 02 19 09:10:00 │ SHORT        │ -0.51% │ 18.12% │ 0.32       │ rsiDivergency5m │
// │  458 │ XMRUSDT      │ 2024 02 19 12:55:00 │ 2024 02 19 21:15:00 │ LONG         │ 1.18%  │ 19.30% │ 110.38     │ rsiDivergency5m │
// │  459 │ LPTUSDT      │ 2024 02 19 22:05:00 │ 2024 02 19 22:40:00 │ LONG         │ -0.51% │ 18.79% │ 15.96      │ rsiDivergency5m │
// │  460 │ WLDUSDT      │ 2024 02 19 23:20:00 │ 2024 02 20 07:40:00 │ LONG         │ 0.79%  │ 19.58% │ 6.68       │ rsiDivergency5m │
// │  461 │ NFPUSDT      │ 2024 02 20 09:40:00 │ 2024 02 20 10:15:00 │ LONG         │ -0.51% │ 19.06% │ 0.71       │ rsiDivergency5m │
// │  462 │ NFPUSDT      │ 2024 02 20 10:20:00 │ 2024 02 20 10:25:00 │ LONG         │ -0.51% │ 18.55% │ 0.70       │ rsiDivergency5m │
// │  463 │ ALICEUSDT    │ 2024 02 20 10:50:00 │ 2024 02 20 12:20:00 │ LONG         │ -0.51% │ 18.04% │ 1.29       │ rsiDivergency5m │
// │  464 │ C98USDT      │ 2024 02 20 12:40:00 │ 2024 02 20 21:00:00 │ LONG         │ 0.75%  │ 18.79% │ 0.33       │ rsiDivergency5m │
// │  465 │ HIGHUSDT     │ 2024 02 20 21:25:00 │ 2024 02 21 02:00:00 │ LONG         │ -0.51% │ 18.28% │ 1.61       │ rsiDivergency5m │
// │  466 │ IOTAUSDT     │ 2024 02 21 02:05:00 │ 2024 02 21 04:55:00 │ LONG         │ -0.51% │ 17.77% │ 0.28       │ rsiDivergency5m │
// │  467 │ ANKRUSDT     │ 2024 02 21 05:10:00 │ 2024 02 21 12:40:00 │ LONG         │ -0.51% │ 17.25% │ 0.03       │ rsiDivergency5m │
// │  468 │ RNDRUSDT     │ 2024 02 21 17:40:00 │ 2024 02 21 18:30:00 │ SHORT        │ -0.51% │ 16.74% │ 6.84       │ rsiDivergency5m │
// │  469 │ BEAMXUSDT    │ 2024 02 21 18:50:00 │ 2024 02 22 03:10:00 │ SHORT        │ -0.29% │ 16.45% │ 0.03       │ rsiDivergency5m │
// │  470 │ DENTUSDT     │ 2024 02 22 03:20:00 │ 2024 02 22 04:00:00 │ SHORT        │ -0.51% │ 15.94% │ 0.00       │ rsiDivergency5m │
// │  471 │ RDNTUSDT     │ 2024 02 22 04:10:00 │ 2024 02 22 04:50:00 │ SHORT        │ -0.51% │ 15.42% │ 0.34       │ rsiDivergency5m │
// │  472 │ PENDLEUSDT   │ 2024 02 22 04:55:00 │ 2024 02 22 05:20:00 │ SHORT        │ -0.51% │ 14.91% │ 2.85       │ rsiDivergency5m │
// │  473 │ PENDLEUSDT   │ 2024 02 22 05:25:00 │ 2024 02 22 13:45:00 │ SHORT        │ 1.42%  │ 16.33% │ 2.90       │ rsiDivergency5m │
// │  474 │ ZETAUSDT     │ 2024 02 22 15:10:00 │ 2024 02 22 20:25:00 │ SHORT        │ -0.51% │ 15.82% │ 2.52       │ rsiDivergency5m │
// │  475 │ CKBUSDT      │ 2024 02 22 22:25:00 │ 2024 02 23 06:45:00 │ LONG         │ 0.18%  │ 16.00% │ 0.01       │ rsiDivergency5m │
// │  476 │ STRKUSDT     │ 2024 02 23 07:40:00 │ 2024 02 23 09:40:00 │ LONG         │ -0.51% │ 15.49% │ 1.98       │ rsiDivergency5m │
// │  477 │ ZETAUSDT     │ 2024 02 23 09:50:00 │ 2024 02 23 10:15:00 │ LONG         │ -0.51% │ 14.98% │ 2.27       │ rsiDivergency5m │
// │  478 │ ZETAUSDT     │ 2024 02 23 10:30:00 │ 2024 02 23 11:00:00 │ LONG         │ -0.51% │ 14.46% │ 2.22       │ rsiDivergency5m │
// │  479 │ ALTUSDT      │ 2024 02 23 11:05:00 │ 2024 02 23 18:00:00 │ LONG         │ -0.51% │ 13.95% │ 0.50       │ rsiDivergency5m │
// │  480 │ ZETAUSDT     │ 2024 02 23 20:15:00 │ 2024 02 24 04:35:00 │ LONG         │ 0.87%  │ 14.82% │ 2.14       │ rsiDivergency5m │
// │  481 │ ANKRUSDT     │ 2024 02 24 04:45:00 │ 2024 02 24 13:05:00 │ SHORT        │ 0.94%  │ 15.76% │ 0.03       │ rsiDivergency5m │
// │  482 │ RENUSDT      │ 2024 02 24 13:45:00 │ 2024 02 24 14:45:00 │ SHORT        │ -0.51% │ 15.25% │ 0.08       │ rsiDivergency5m │
// │  483 │ NTRNUSDT     │ 2024 02 24 18:50:00 │ 2024 02 25 03:10:00 │ SHORT        │ 0.73%  │ 15.97% │ 1.72       │ rsiDivergency5m │
// │  484 │ CKBUSDT      │ 2024 02 25 04:20:00 │ 2024 02 25 04:30:00 │ SHORT        │ -0.51% │ 15.46% │ 0.01       │ rsiDivergency5m │
// │  485 │ ONEUSDT      │ 2024 02 25 06:30:00 │ 2024 02 25 06:55:00 │ SHORT        │ -0.51% │ 14.95% │ 0.02       │ rsiDivergency5m │
// │  486 │ ZETAUSDT     │ 2024 02 25 12:05:00 │ 2024 02 25 13:20:00 │ SHORT        │ -0.51% │ 14.44% │ 2.48       │ rsiDivergency5m │
// │  487 │ C98USDT      │ 2024 02 25 14:40:00 │ 2024 02 25 23:00:00 │ SHORT        │ 1.46%  │ 15.90% │ 0.41       │ rsiDivergency5m │
// │  488 │ BIGTIMEUSDT  │ 2024 02 26 00:30:00 │ 2024 02 26 01:20:00 │ SHORT        │ -0.51% │ 15.38% │ 0.42       │ rsiDivergency5m │
// │  489 │ YGGUSDT      │ 2024 02 26 01:45:00 │ 2024 02 26 02:15:00 │ SHORT        │ -0.51% │ 14.87% │ 0.59       │ rsiDivergency5m │
// │  490 │ DODOXUSDT    │ 2024 02 26 04:10:00 │ 2024 02 26 12:30:00 │ SHORT        │ 0.35%  │ 15.22% │ 0.22       │ rsiDivergency5m │
// │  491 │ DENTUSDT     │ 2024 02 26 13:05:00 │ 2024 02 26 21:25:00 │ SHORT        │ 0.41%  │ 15.63% │ 0.00       │ rsiDivergency5m │
// │  492 │ NTRNUSDT     │ 2024 02 26 22:20:00 │ 2024 02 27 06:40:00 │ SHORT        │ 1.71%  │ 17.34% │ 1.92       │ rsiDivergency5m │
// │  493 │ ENJUSDT      │ 2024 02 27 06:50:00 │ 2024 02 27 12:10:00 │ SHORT        │ -0.51% │ 16.82% │ 0.40       │ rsiDivergency5m │
// │  494 │ ENJUSDT      │ 2024 02 27 12:35:00 │ 2024 02 27 13:05:00 │ SHORT        │ -0.51% │ 16.31% │ 0.41       │ rsiDivergency5m │
// │  495 │ GALAUSDT     │ 2024 02 27 13:40:00 │ 2024 02 27 14:40:00 │ SHORT        │ -0.51% │ 15.80% │ 0.04       │ rsiDivergency5m │
// │  496 │ GALAUSDT     │ 2024 02 27 14:55:00 │ 2024 02 27 17:50:00 │ SHORT        │ -0.51% │ 15.29% │ 0.04       │ rsiDivergency5m │
// │  497 │ GALAUSDT     │ 2024 02 27 17:55:00 │ 2024 02 28 01:10:00 │ SHORT        │ 2.49%  │ 17.77% │ 0.04       │ rsiDivergency5m │
// │  498 │ 1000BONKUSDT │ 2024 02 28 04:50:00 │ 2024 02 28 05:05:00 │ SHORT        │ -0.51% │ 17.26% │ 0.02       │ rsiDivergency5m │
// │  499 │ AMBUSDT      │ 2024 02 28 05:55:00 │ 2024 02 28 12:00:00 │ SHORT        │ -0.51% │ 16.75% │ 0.01       │ rsiDivergency5m │
// │  500 │ C98USDT      │ 2024 02 28 13:10:00 │ 2024 02 28 13:20:00 │ LONG         │ -0.51% │ 16.24% │ 0.36       │ rsiDivergency5m │
// │  501 │ PIXELUSDT    │ 2024 02 28 13:25:00 │ 2024 02 28 20:30:00 │ LONG         │ 2.49%  │ 18.72% │ 0.48       │ rsiDivergency5m │
// │  502 │ CRVUSDT      │ 2024 02 28 20:40:00 │ 2024 02 28 23:05:00 │ SHORT        │ -0.51% │ 18.21% │ 0.62       │ rsiDivergency5m │
// │  503 │ GMTUSDT      │ 2024 02 28 23:15:00 │ 2024 02 29 03:20:00 │ SHORT        │ -0.51% │ 17.70% │ 0.30       │ rsiDivergency5m │
// │  504 │ EGLDUSDT     │ 2024 02 29 03:25:00 │ 2024 02 29 11:45:00 │ SHORT        │ 0.29%  │ 17.99% │ 62.66      │ rsiDivergency5m │
// │  505 │ RIFUSDT      │ 2024 02 29 16:25:00 │ 2024 02 29 17:35:00 │ LONG         │ -0.51% │ 17.48% │ 0.21       │ rsiDivergency5m │
// │  506 │ ZETAUSDT     │ 2024 02 29 17:40:00 │ 2024 03 01 02:00:00 │ LONG         │ 1.00%  │ 18.49% │ 2.18       │ rsiDivergency5m │
// │  507 │ FLMUSDT      │ 2024 03 01 03:35:00 │ 2024 03 01 04:10:00 │ SHORT        │ -0.51% │ 17.97% │ 0.11       │ rsiDivergency5m │
// │  508 │ NEOUSDT      │ 2024 03 01 04:15:00 │ 2024 03 01 04:20:00 │ SHORT        │ -0.51% │ 17.46% │ 15.18      │ rsiDivergency5m │
// │  509 │ NEOUSDT      │ 2024 03 01 04:55:00 │ 2024 03 01 05:05:00 │ SHORT        │ -0.51% │ 16.95% │ 15.68      │ rsiDivergency5m │
// │  510 │ FRONTUSDT    │ 2024 03 01 05:15:00 │ 2024 03 01 13:35:00 │ SHORT        │ 0.12%  │ 17.07% │ 0.63       │ rsiDivergency5m │
// │  511 │ PENDLEUSDT   │ 2024 03 01 14:20:00 │ 2024 03 01 22:40:00 │ SHORT        │ 1.61%  │ 18.68% │ 3.65       │ rsiDivergency5m │
// │  512 │ MAVUSDT      │ 2024 03 02 02:15:00 │ 2024 03 02 03:10:00 │ SHORT        │ -0.51% │ 18.16% │ 0.74       │ rsiDivergency5m │
// │  513 │ MAVUSDT      │ 2024 03 02 03:15:00 │ 2024 03 02 11:35:00 │ SHORT        │ 0.83%  │ 18.99% │ 0.76       │ rsiDivergency5m │
// │  514 │ FILUSDT      │ 2024 03 02 15:50:00 │ 2024 03 03 00:10:00 │ SHORT        │ 0.39%  │ 19.38% │ 9.35       │ rsiDivergency5m │
// │  515 │ ARBUSDT      │ 2024 03 03 00:25:00 │ 2024 03 03 02:25:00 │ SHORT        │ 2.49%  │ 21.87% │ 2.18       │ rsiDivergency5m │
// │  516 │ NTRNUSDT     │ 2024 03 03 02:30:00 │ 2024 03 03 04:50:00 │ LONG         │ 2.49%  │ 24.36% │ 1.40       │ rsiDivergency5m │
// │  517 │ NTRNUSDT     │ 2024 03 03 05:20:00 │ 2024 03 03 05:35:00 │ SHORT        │ -0.51% │ 23.85% │ 1.54       │ rsiDivergency5m │
// │  518 │ ENJUSDT      │ 2024 03 03 06:10:00 │ 2024 03 03 08:25:00 │ SHORT        │ -0.51% │ 23.33% │ 0.52       │ rsiDivergency5m │
// │  519 │ HFTUSDT      │ 2024 03 03 09:05:00 │ 2024 03 03 17:25:00 │ SHORT        │ 1.54%  │ 24.88% │ 0.53       │ rsiDivergency5m │
// │  520 │ ENJUSDT      │ 2024 03 03 18:10:00 │ 2024 03 03 19:45:00 │ LONG         │ -0.51% │ 24.36% │ 0.52       │ rsiDivergency5m │
// │  521 │ SXPUSDT      │ 2024 03 03 20:35:00 │ 2024 03 03 20:50:00 │ SHORT        │ -0.51% │ 23.85% │ 0.52       │ rsiDivergency5m │
// │  522 │ SXPUSDT      │ 2024 03 03 21:10:00 │ 2024 03 04 05:10:00 │ SHORT        │ 2.49%  │ 26.34% │ 0.54       │ rsiDivergency5m │
// │  523 │ CRVUSDT      │ 2024 03 04 06:15:00 │ 2024 03 04 08:35:00 │ SHORT        │ -0.51% │ 25.83% │ 0.74       │ rsiDivergency5m │
// │  524 │ ALTUSDT      │ 2024 03 04 11:20:00 │ 2024 03 04 11:55:00 │ LONG         │ -0.51% │ 25.31% │ 0.49       │ rsiDivergency5m │
// │  525 │ COTIUSDT     │ 2024 03 04 12:25:00 │ 2024 03 04 12:40:00 │ LONG         │ -0.51% │ 24.80% │ 0.20       │ rsiDivergency5m │
// │  526 │ SXPUSDT      │ 2024 03 04 12:50:00 │ 2024 03 04 21:10:00 │ LONG         │ 0.54%  │ 25.34% │ 0.46       │ rsiDivergency5m │
// │  527 │ SKLUSDT      │ 2024 03 04 21:20:00 │ 2024 03 05 05:40:00 │ LONG         │ 0.81%  │ 26.15% │ 0.11       │ rsiDivergency5m │
// │  528 │ USTCUSDT     │ 2024 03 05 09:00:00 │ 2024 03 05 09:05:00 │ SHORT        │ -0.51% │ 25.64% │ 0.04       │ rsiDivergency5m │
// │  529 │ USTCUSDT     │ 2024 03 05 09:15:00 │ 2024 03 05 09:20:00 │ SHORT        │ -0.51% │ 25.12% │ 0.04       │ rsiDivergency5m │
// │  530 │ USTCUSDT     │ 2024 03 05 09:25:00 │ 2024 03 05 09:30:00 │ SHORT        │ -0.51% │ 24.61% │ 0.04       │ rsiDivergency5m │
// │  531 │ ZETAUSDT     │ 2024 03 05 09:50:00 │ 2024 03 05 11:05:00 │ LONG         │ -0.51% │ 24.10% │ 2.14       │ rsiDivergency5m │
// │  532 │ DARUSDT      │ 2024 03 05 11:15:00 │ 2024 03 05 12:05:00 │ LONG         │ -0.51% │ 23.59% │ 0.20       │ rsiDivergency5m │
// │  533 │ REEFUSDT     │ 2024 03 05 12:15:00 │ 2024 03 05 12:35:00 │ LONG         │ -0.51% │ 23.07% │ 0.00       │ rsiDivergency5m │
// │  534 │ XVGUSDT      │ 2024 03 05 14:10:00 │ 2024 03 05 14:35:00 │ LONG         │ -0.51% │ 22.56% │ 0.01       │ rsiDivergency5m │
// │  535 │ FXSUSDT      │ 2024 03 05 14:40:00 │ 2024 03 05 14:50:00 │ LONG         │ -0.51% │ 22.05% │ 8.18       │ rsiDivergency5m │
// │  536 │ XVSUSDT      │ 2024 03 05 15:20:00 │ 2024 03 05 15:35:00 │ LONG         │ -0.51% │ 21.54% │ 11.34      │ rsiDivergency5m │
// │  537 │ MASKUSDT     │ 2024 03 05 15:40:00 │ 2024 03 06 00:00:00 │ LONG         │ 1.67%  │ 23.20% │ 4.21       │ rsiDivergency5m │
// │  538 │ XRPUSDT      │ 2024 03 06 00:40:00 │ 2024 03 06 02:50:00 │ SHORT        │ -0.51% │ 22.69% │ 0.60       │ rsiDivergency5m │
// │  539 │ ALTUSDT      │ 2024 03 06 02:55:00 │ 2024 03 06 11:15:00 │ SHORT        │ 0.96%  │ 23.65% │ 0.50       │ rsiDivergency5m │
// │  540 │ RNDRUSDT     │ 2024 03 06 11:25:00 │ 2024 03 06 11:50:00 │ SHORT        │ -0.51% │ 23.14% │ 8.46       │ rsiDivergency5m │
// │  541 │ C98USDT      │ 2024 03 06 12:25:00 │ 2024 03 06 16:30:00 │ SHORT        │ -0.51% │ 22.63% │ 0.39       │ rsiDivergency5m │
// │  542 │ C98USDT      │ 2024 03 06 16:45:00 │ 2024 03 06 19:30:00 │ SHORT        │ -0.51% │ 22.11% │ 0.40       │ rsiDivergency5m │
// │  543 │ C98USDT      │ 2024 03 06 19:40:00 │ 2024 03 06 20:50:00 │ SHORT        │ -0.51% │ 21.60% │ 0.41       │ rsiDivergency5m │
// │  544 │ C98USDT      │ 2024 03 06 20:55:00 │ 2024 03 07 05:15:00 │ SHORT        │ 0.48%  │ 22.08% │ 0.41       │ rsiDivergency5m │
// │  545 │ ALTUSDT      │ 2024 03 07 05:25:00 │ 2024 03 07 08:35:00 │ SHORT        │ -0.51% │ 21.56% │ 0.55       │ rsiDivergency5m │
// │  546 │ ALTUSDT      │ 2024 03 07 08:55:00 │ 2024 03 07 17:15:00 │ SHORT        │ 0.98%  │ 22.55% │ 0.57       │ rsiDivergency5m │
// │  547 │ SUPERUSDT    │ 2024 03 07 20:15:00 │ 2024 03 08 04:35:00 │ SHORT        │ 0.11%  │ 22.66% │ 1.55       │ rsiDivergency5m │
// │  548 │ 1000BONKUSDT │ 2024 03 08 05:55:00 │ 2024 03 08 06:05:00 │ SHORT        │ -0.51% │ 22.15% │ 0.03       │ rsiDivergency5m │
// │  549 │ TOKENUSDT    │ 2024 03 08 08:35:00 │ 2024 03 08 08:45:00 │ SHORT        │ -0.51% │ 21.63% │ 0.09       │ rsiDivergency5m │
// │  550 │ 1000SHIBUSDT │ 2024 03 08 09:05:00 │ 2024 03 08 10:30:00 │ SHORT        │ 2.49%  │ 24.12% │ 0.04       │ rsiDivergency5m │
// │  551 │ ALTUSDT      │ 2024 03 08 10:35:00 │ 2024 03 08 18:55:00 │ LONG         │ 0.58%  │ 24.70% │ 0.51       │ rsiDivergency5m │
// │  552 │ AIUSDT       │ 2024 03 08 21:25:00 │ 2024 03 08 21:35:00 │ SHORT        │ -0.51% │ 24.19% │ 2.13       │ rsiDivergency5m │
// │  553 │ APEUSDT      │ 2024 03 08 22:35:00 │ 2024 03 09 02:20:00 │ SHORT        │ -0.51% │ 23.68% │ 2.25       │ rsiDivergency5m │
// │  554 │ LSKUSDT      │ 2024 03 09 02:40:00 │ 2024 03 09 03:40:00 │ SHORT        │ -0.51% │ 23.16% │ 2.21       │ rsiDivergency5m │
// │  555 │ NFPUSDT      │ 2024 03 09 04:15:00 │ 2024 03 09 07:00:00 │ SHORT        │ 2.49%  │ 25.65% │ 1.10       │ rsiDivergency5m │
// │  556 │ AXSUSDT      │ 2024 03 09 07:05:00 │ 2024 03 09 07:20:00 │ SHORT        │ -0.51% │ 25.14% │ 12.47      │ rsiDivergency5m │
// │  557 │ TOKENUSDT    │ 2024 03 09 12:25:00 │ 2024 03 09 20:45:00 │ LONG         │ 0.09%  │ 25.23% │ 0.08       │ rsiDivergency5m │
// │  558 │ IDUSDT       │ 2024 03 10 00:05:00 │ 2024 03 10 00:45:00 │ SHORT        │ -0.51% │ 24.72% │ 0.90       │ rsiDivergency5m │
// │  559 │ IDUSDT       │ 2024 03 10 01:15:00 │ 2024 03 10 01:30:00 │ SHORT        │ -0.51% │ 24.21% │ 0.94       │ rsiDivergency5m │
// │  560 │ IDUSDT       │ 2024 03 10 01:35:00 │ 2024 03 10 01:55:00 │ SHORT        │ -0.51% │ 23.69% │ 0.94       │ rsiDivergency5m │
// │  561 │ HIGHUSDT     │ 2024 03 10 03:40:00 │ 2024 03 10 12:00:00 │ SHORT        │ 0.54%  │ 24.24% │ 2.55       │ rsiDivergency5m │
// │  562 │ ALICEUSDT    │ 2024 03 10 13:20:00 │ 2024 03 10 19:50:00 │ SHORT        │ 2.49%  │ 26.73% │ 2.34       │ rsiDivergency5m │
// │  563 │ REEFUSDT     │ 2024 03 10 20:40:00 │ 2024 03 11 04:00:00 │ LONG         │ 2.49%  │ 29.21% │ 0.00       │ rsiDivergency5m │
// │  564 │ BEAMXUSDT    │ 2024 03 11 04:15:00 │ 2024 03 11 12:35:00 │ SHORT        │ 1.41%  │ 30.62% │ 0.04       │ rsiDivergency5m │
// │  565 │ TUSDT        │ 2024 03 11 13:20:00 │ 2024 03 11 19:15:00 │ SHORT        │ -0.51% │ 30.11% │ 0.04       │ rsiDivergency5m │
// │  566 │ REEFUSDT     │ 2024 03 11 20:35:00 │ 2024 03 11 21:10:00 │ SHORT        │ -0.51% │ 29.60% │ 0.00       │ rsiDivergency5m │
// │  567 │ XRPUSDT      │ 2024 03 11 23:05:00 │ 2024 03 12 07:25:00 │ LONG         │ 0.03%  │ 29.63% │ 0.69       │ rsiDivergency5m │
// │  568 │ ACEUSDT      │ 2024 03 12 12:20:00 │ 2024 03 12 20:40:00 │ LONG         │ 1.71%  │ 31.33% │ 11.87      │ rsiDivergency5m │
// │  569 │ ZILUSDT      │ 2024 03 12 21:15:00 │ 2024 03 12 22:55:00 │ SHORT        │ -0.51% │ 30.82% │ 0.04       │ rsiDivergency5m │
// │  570 │ KAVAUSDT     │ 2024 03 12 23:00:00 │ 2024 03 13 01:55:00 │ SHORT        │ -0.51% │ 30.31% │ 1.10       │ rsiDivergency5m │
// │  571 │ ARBUSDT      │ 2024 03 13 02:20:00 │ 2024 03 13 04:20:00 │ SHORT        │ -0.51% │ 29.80% │ 2.19       │ rsiDivergency5m │
// │  572 │ FRONTUSDT    │ 2024 03 13 05:25:00 │ 2024 03 13 05:45:00 │ SHORT        │ -0.51% │ 29.28% │ 0.97       │ rsiDivergency5m │
// │  573 │ CAKEUSDT     │ 2024 03 13 06:30:00 │ 2024 03 13 08:00:00 │ SHORT        │ -0.51% │ 28.77% │ 4.82       │ rsiDivergency5m │
// │  574 │ WLDUSDT      │ 2024 03 13 10:00:00 │ 2024 03 13 18:20:00 │ LONG         │ 0.41%  │ 29.18% │ 9.42       │ rsiDivergency5m │
// │  575 │ LRCUSDT      │ 2024 03 13 21:05:00 │ 2024 03 14 02:20:00 │ SHORT        │ -0.51% │ 28.67% │ 0.49       │ rsiDivergency5m │
// │  576 │ LRCUSDT      │ 2024 03 14 03:25:00 │ 2024 03 14 06:30:00 │ SHORT        │ -0.51% │ 28.15% │ 0.52       │ rsiDivergency5m │
// │  577 │ ZETAUSDT     │ 2024 03 14 08:25:00 │ 2024 03 14 08:50:00 │ LONG         │ -0.51% │ 27.64% │ 2.21       │ rsiDivergency5m │
// │  578 │ KAVAUSDT     │ 2024 03 14 08:55:00 │ 2024 03 14 11:30:00 │ LONG         │ -0.51% │ 27.13% │ 1.05       │ rsiDivergency5m │
// │  579 │ RENUSDT      │ 2024 03 14 17:10:00 │ 2024 03 14 22:25:00 │ SHORT        │ 2.49%  │ 29.62% │ 0.12       │ rsiDivergency5m │
// │  580 │ BIGTIMEUSDT  │ 2024 03 14 22:30:00 │ 2024 03 14 23:40:00 │ LONG         │ -0.51% │ 29.10% │ 0.45       │ rsiDivergency5m │
// │  581 │ CFXUSDT      │ 2024 03 15 02:50:00 │ 2024 03 15 04:10:00 │ SHORT        │ 2.49%  │ 31.59% │ 0.40       │ rsiDivergency5m │
// │  582 │ BIGTIMEUSDT  │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 1.06%  │ 32.65% │ 0.41       │ rsiDivergency5m │
// │  583 │ SNXUSDT      │ 2024 03 15 15:50:00 │ 2024 03 16 00:10:00 │ LONG         │ 0.49%  │ 33.14% │ 4.17       │ rsiDivergency5m │
// │  584 │ BONDUSDT     │ 2024 03 16 01:25:00 │ 2024 03 16 08:50:00 │ SHORT        │ 2.49%  │ 35.63% │ 5.33       │ rsiDivergency5m │
// │  585 │ 1000SHIBUSDT │ 2024 03 16 08:55:00 │ 2024 03 16 12:25:00 │ LONG         │ -0.51% │ 35.11% │ 0.03       │ rsiDivergency5m │
// │  586 │ AMBUSDT      │ 2024 03 16 12:30:00 │ 2024 03 16 13:05:00 │ LONG         │ -0.51% │ 34.60% │ 0.01       │ rsiDivergency5m │
// │  587 │ LPTUSDT      │ 2024 03 16 13:10:00 │ 2024 03 16 13:40:00 │ LONG         │ -0.51% │ 34.09% │ 20.47      │ rsiDivergency5m │
// │  588 │ APTUSDT      │ 2024 03 16 13:45:00 │ 2024 03 16 13:55:00 │ LONG         │ -0.51% │ 33.58% │ 13.51      │ rsiDivergency5m │
// │  589 │ APTUSDT      │ 2024 03 16 15:20:00 │ 2024 03 16 23:40:00 │ LONG         │ 2.16%  │ 35.74% │ 13.10      │ rsiDivergency5m │
// │  590 │ PIXELUSDT    │ 2024 03 17 01:20:00 │ 2024 03 17 01:50:00 │ LONG         │ -0.51% │ 35.23% │ 0.70       │ rsiDivergency5m │
// │  591 │ PIXELUSDT    │ 2024 03 17 02:20:00 │ 2024 03 17 10:30:00 │ LONG         │ 2.49%  │ 37.72% │ 0.68       │ rsiDivergency5m │
// │  592 │ NMRUSDT      │ 2024 03 17 10:35:00 │ 2024 03 17 18:55:00 │ SHORT        │ 0.49%  │ 38.21% │ 38.68      │ rsiDivergency5m │
// │  593 │ RIFUSDT      │ 2024 03 17 19:40:00 │ 2024 03 17 20:00:00 │ LONG         │ -0.51% │ 37.70% │ 0.25       │ rsiDivergency5m │
// │  594 │ TRUUSDT      │ 2024 03 17 20:05:00 │ 2024 03 18 04:25:00 │ LONG         │ 0.14%  │ 37.83% │ 0.08       │ rsiDivergency5m │
// │  595 │ ORDIUSDT     │ 2024 03 18 08:25:00 │ 2024 03 18 09:40:00 │ LONG         │ -0.51% │ 37.32% │ 65.79      │ rsiDivergency5m │
// │  596 │ TRUUSDT      │ 2024 03 18 09:45:00 │ 2024 03 18 12:05:00 │ LONG         │ -0.51% │ 36.81% │ 0.08       │ rsiDivergency5m │
// │  597 │ TRUUSDT      │ 2024 03 18 14:05:00 │ 2024 03 18 19:50:00 │ LONG         │ -0.51% │ 36.29% │ 0.07       │ rsiDivergency5m │
// │  598 │ MASKUSDT     │ 2024 03 18 20:10:00 │ 2024 03 18 20:25:00 │ LONG         │ -0.51% │ 35.78% │ 4.63       │ rsiDivergency5m │
// │  599 │ IDUSDT       │ 2024 03 18 20:35:00 │ 2024 03 19 00:10:00 │ LONG         │ -0.51% │ 35.27% │ 1.51       │ rsiDivergency5m │
// │  600 │ LEVERUSDT    │ 2024 03 19 02:15:00 │ 2024 03 19 04:10:00 │ LONG         │ -0.51% │ 34.76% │ 0.00       │ rsiDivergency5m │
// │  601 │ MKRUSDT      │ 2024 03 19 07:25:00 │ 2024 03 19 07:45:00 │ SHORT        │ -0.51% │ 34.24% │ 2934.20    │ rsiDivergency5m │
// │  602 │ COTIUSDT     │ 2024 03 19 07:50:00 │ 2024 03 19 10:45:00 │ SHORT        │ -0.51% │ 33.73% │ 0.18       │ rsiDivergency5m │
// │  603 │ FLOWUSDT     │ 2024 03 19 10:50:00 │ 2024 03 19 11:10:00 │ SHORT        │ -0.51% │ 33.22% │ 1.27       │ rsiDivergency5m │
// │  604 │ TOKENUSDT    │ 2024 03 19 11:15:00 │ 2024 03 19 13:30:00 │ SHORT        │ -0.51% │ 32.71% │ 0.06       │ rsiDivergency5m │
// │  605 │ ARBUSDT      │ 2024 03 19 13:50:00 │ 2024 03 19 22:10:00 │ SHORT        │ 0.65%  │ 33.36% │ 1.67       │ rsiDivergency5m │
// │  606 │ SKLUSDT      │ 2024 03 19 22:40:00 │ 2024 03 20 02:30:00 │ SHORT        │ -0.51% │ 32.85% │ 0.09       │ rsiDivergency5m │
// │  607 │ MAVUSDT      │ 2024 03 20 02:55:00 │ 2024 03 20 07:05:00 │ SHORT        │ -0.51% │ 32.34% │ 0.51       │ rsiDivergency5m │
// │  608 │ WAXPUSDT     │ 2024 03 20 07:10:00 │ 2024 03 20 13:50:00 │ SHORT        │ -0.51% │ 31.82% │ 0.08       │ rsiDivergency5m │
// │  609 │ RIFUSDT      │ 2024 03 20 13:55:00 │ 2024 03 20 14:40:00 │ SHORT        │ -0.51% │ 31.31% │ 0.23       │ rsiDivergency5m │
// │  610 │ 1000BONKUSDT │ 2024 03 20 14:50:00 │ 2024 03 20 15:20:00 │ SHORT        │ -0.51% │ 30.80% │ 0.02       │ rsiDivergency5m │
// │  611 │ HFTUSDT      │ 2024 03 20 15:25:00 │ 2024 03 20 23:45:00 │ SHORT        │ 0.29%  │ 31.08% │ 0.44       │ rsiDivergency5m │
// │  612 │ WAXPUSDT     │ 2024 03 21 04:05:00 │ 2024 03 21 12:25:00 │ SHORT        │ 0.19%  │ 31.28% │ 0.09       │ rsiDivergency5m │
// │  613 │ MKRUSDT      │ 2024 03 21 17:10:00 │ 2024 03 22 01:30:00 │ SHORT        │ 1.40%  │ 32.67% │ 3447.40    │ rsiDivergency5m │
// │  614 │ STXUSDT      │ 2024 03 22 01:55:00 │ 2024 03 22 10:15:00 │ SHORT        │ 1.31%  │ 33.98% │ 3.65       │ rsiDivergency5m │
// │  615 │ ONDOUSDT     │ 2024 03 22 12:45:00 │ 2024 03 22 17:35:00 │ SHORT        │ 2.49%  │ 36.47% │ 0.79       │ rsiDivergency5m │
// │  616 │ STXUSDT      │ 2024 03 22 19:30:00 │ 2024 03 23 03:50:00 │ SHORT        │ 0.44%  │ 36.91% │ 3.56       │ rsiDivergency5m │
// │  617 │ 1000LUNCUSDT │ 2024 03 23 05:20:00 │ 2024 03 23 05:35:00 │ SHORT        │ -0.51% │ 36.40% │ 0.16       │ rsiDivergency5m │
// │  618 │ 1000LUNCUSDT │ 2024 03 23 05:45:00 │ 2024 03 23 14:05:00 │ SHORT        │ 1.43%  │ 37.83% │ 0.16       │ rsiDivergency5m │
// │  619 │ SUPERUSDT    │ 2024 03 23 14:15:00 │ 2024 03 23 22:35:00 │ SHORT        │ 1.11%  │ 38.93% │ 1.35       │ rsiDivergency5m │
// │  620 │ TUSDT        │ 2024 03 23 22:40:00 │ 2024 03 24 07:00:00 │ LONG         │ 0.75%  │ 39.68% │ 0.04       │ rsiDivergency5m │
// │  621 │ SKLUSDT      │ 2024 03 24 08:30:00 │ 2024 03 24 08:40:00 │ SHORT        │ -0.51% │ 39.17% │ 0.11       │ rsiDivergency5m │
// │  622 │ SKLUSDT      │ 2024 03 24 09:05:00 │ 2024 03 24 09:15:00 │ SHORT        │ -0.51% │ 38.65% │ 0.11       │ rsiDivergency5m │
// │  623 │ SKLUSDT      │ 2024 03 24 09:25:00 │ 2024 03 24 09:30:00 │ SHORT        │ -0.51% │ 38.14% │ 0.11       │ rsiDivergency5m │
// │  624 │ LSKUSDT      │ 2024 03 24 09:55:00 │ 2024 03 24 18:15:00 │ SHORT        │ 0.60%  │ 38.74% │ 2.05       │ rsiDivergency5m │
// │  625 │ DENTUSDT     │ 2024 03 24 18:30:00 │ 2024 03 25 02:50:00 │ SHORT        │ 1.30%  │ 40.05% │ 0.00       │ rsiDivergency5m │
// │  626 │ ALTUSDT      │ 2024 03 25 03:55:00 │ 2024 03 25 09:55:00 │ SHORT        │ -0.51% │ 39.54% │ 0.56       │ rsiDivergency5m │
// │  627 │ FTMUSDT      │ 2024 03 25 10:25:00 │ 2024 03 25 11:20:00 │ SHORT        │ -0.51% │ 39.02% │ 1.17       │ rsiDivergency5m │
// │  628 │ FTMUSDT      │ 2024 03 25 12:05:00 │ 2024 03 25 20:25:00 │ SHORT        │ 1.62%  │ 40.65% │ 1.22       │ rsiDivergency5m │
// │  629 │ WAXPUSDT     │ 2024 03 25 21:25:00 │ 2024 03 26 03:45:00 │ SHORT        │ -0.51% │ 40.13% │ 0.12       │ rsiDivergency5m │
// │  630 │ RENUSDT      │ 2024 03 26 04:40:00 │ 2024 03 26 04:50:00 │ SHORT        │ -0.51% │ 39.62% │ 0.11       │ rsiDivergency5m │
// │  631 │ ONGUSDT      │ 2024 03 26 07:00:00 │ 2024 03 26 15:20:00 │ SHORT        │ 1.75%  │ 41.37% │ 0.46       │ rsiDivergency5m │
// │  632 │ ETHFIUSDT    │ 2024 03 26 18:55:00 │ 2024 03 26 19:45:00 │ SHORT        │ -0.51% │ 40.86% │ 5.48       │ rsiDivergency5m │
// │  633 │ ETHFIUSDT    │ 2024 03 26 20:40:00 │ 2024 03 26 21:45:00 │ SHORT        │ -0.51% │ 40.35% │ 5.87       │ rsiDivergency5m │
// │  634 │ SUIUSDT      │ 2024 03 26 23:10:00 │ 2024 03 27 07:05:00 │ SHORT        │ -0.51% │ 39.84% │ 2.06       │ rsiDivergency5m │
// │  635 │ PENDLEUSDT   │ 2024 03 27 09:40:00 │ 2024 03 27 18:00:00 │ SHORT        │ 0.55%  │ 40.38% │ 4.30       │ rsiDivergency5m │
// │  636 │ ALTUSDT      │ 2024 03 27 18:30:00 │ 2024 03 28 02:50:00 │ SHORT        │ 0.62%  │ 41.00% │ 0.62       │ rsiDivergency5m │
// │  637 │ ONDOUSDT     │ 2024 03 28 03:10:00 │ 2024 03 28 11:30:00 │ SHORT        │ 1.17%  │ 42.17% │ 0.95       │ rsiDivergency5m │
// │  638 │ MYROUSDT     │ 2024 03 28 13:00:00 │ 2024 03 28 13:05:00 │ SHORT        │ -0.51% │ 41.66% │ 0.28       │ rsiDivergency5m │
// │  639 │ SPELLUSDT    │ 2024 03 28 13:15:00 │ 2024 03 28 13:25:00 │ SHORT        │ -0.51% │ 41.15% │ 0.00       │ rsiDivergency5m │
// │  640 │ SPELLUSDT    │ 2024 03 28 13:30:00 │ 2024 03 28 18:35:00 │ SHORT        │ -0.51% │ 40.63% │ 0.00       │ rsiDivergency5m │
// │  641 │ ARPAUSDT     │ 2024 03 28 19:10:00 │ 2024 03 28 20:40:00 │ SHORT        │ -0.51% │ 40.12% │ 0.10       │ rsiDivergency5m │
// │  642 │ POLYXUSDT    │ 2024 03 28 21:10:00 │ 2024 03 28 23:00:00 │ LONG         │ -0.51% │ 39.61% │ 0.54       │ rsiDivergency5m │
// │  643 │ MKRUSDT      │ 2024 03 29 02:00:00 │ 2024 03 29 10:20:00 │ LONG         │ 0.24%  │ 39.84% │ 3524.60    │ rsiDivergency5m │
// │  644 │ SUIUSDT      │ 2024 03 29 10:40:00 │ 2024 03 29 16:15:00 │ LONG         │ -0.51% │ 39.33% │ 1.95       │ rsiDivergency5m │
// │  645 │ MAVUSDT      │ 2024 03 29 19:35:00 │ 2024 03 30 03:55:00 │ LONG         │ -0.08% │ 39.25% │ 0.66       │ rsiDivergency5m │
// │  646 │ YGGUSDT      │ 2024 03 30 07:05:00 │ 2024 03 30 07:35:00 │ SHORT        │ -0.51% │ 38.74% │ 1.28       │ rsiDivergency5m │
// │  647 │ YGGUSDT      │ 2024 03 30 07:50:00 │ 2024 03 30 08:00:00 │ SHORT        │ -0.51% │ 38.23% │ 1.31       │ rsiDivergency5m │
// │  648 │ YGGUSDT      │ 2024 03 30 08:10:00 │ 2024 03 30 08:25:00 │ SHORT        │ -0.51% │ 37.72% │ 1.33       │ rsiDivergency5m │
// │  649 │ YGGUSDT      │ 2024 03 30 10:10:00 │ 2024 03 30 18:30:00 │ SHORT        │ 1.30%  │ 39.02% │ 1.43       │ rsiDivergency5m │
// │  650 │ 1000SATSUSDT │ 2024 03 30 21:15:00 │ 2024 03 31 05:35:00 │ SHORT        │ 1.11%  │ 40.13% │ 0.00       │ rsiDivergency5m │
// │  651 │ ANKRUSDT     │ 2024 03 31 07:15:00 │ 2024 03 31 15:35:00 │ SHORT        │ 0.67%  │ 40.81% │ 0.06       │ rsiDivergency5m │
// │  652 │ ONDOUSDT     │ 2024 03 31 19:40:00 │ 2024 03 31 20:45:00 │ LONG         │ -0.51% │ 40.30% │ 0.95       │ rsiDivergency5m │
// │  653 │ TOKENUSDT    │ 2024 03 31 20:50:00 │ 2024 04 01 00:40:00 │ LONG         │ -0.51% │ 39.78% │ 0.17       │ rsiDivergency5m │
// │  654 │ PENDLEUSDT   │ 2024 04 01 01:45:00 │ 2024 04 01 10:05:00 │ SHORT        │ 2.49%  │ 42.27% │ 5.77       │ rsiDivergency5m │
// │  655 │ FLMUSDT      │ 2024 04 01 10:35:00 │ 2024 04 01 12:35:00 │ LONG         │ -0.51% │ 41.76% │ 0.12       │ rsiDivergency5m │
// │  656 │ STGUSDT      │ 2024 04 01 12:40:00 │ 2024 04 01 21:00:00 │ LONG         │ 0.39%  │ 42.15% │ 0.73       │ rsiDivergency5m │
// │  657 │ KAVAUSDT     │ 2024 04 01 22:25:00 │ 2024 04 02 03:50:00 │ LONG         │ -0.51% │ 41.63% │ 0.98       │ rsiDivergency5m │
// │  658 │ XVSUSDT      │ 2024 04 02 05:10:00 │ 2024 04 02 13:30:00 │ LONG         │ 1.10%  │ 42.74% │ 14.91      │ rsiDivergency5m │
// │  659 │ PENDLEUSDT   │ 2024 04 02 14:55:00 │ 2024 04 02 23:15:00 │ SHORT        │ 1.81%  │ 44.55% │ 5.47       │ rsiDivergency5m │
// │  660 │ MAVUSDT      │ 2024 04 02 23:30:00 │ 2024 04 03 07:50:00 │ LONG         │ 0.17%  │ 44.72% │ 0.65       │ rsiDivergency5m │
// │  661 │ NKNUSDT      │ 2024 04 03 08:45:00 │ 2024 04 03 09:45:00 │ LONG         │ 2.49%  │ 47.21% │ 0.17       │ rsiDivergency5m │
// │  662 │ XVGUSDT      │ 2024 04 03 10:20:00 │ 2024 04 03 11:15:00 │ LONG         │ -0.51% │ 46.70% │ 0.01       │ rsiDivergency5m │
// │  663 │ FRONTUSDT    │ 2024 04 03 12:00:00 │ 2024 04 03 12:30:00 │ LONG         │ -0.51% │ 46.18% │ 1.13       │ rsiDivergency5m │
// │  664 │ TRUUSDT      │ 2024 04 03 13:30:00 │ 2024 04 03 15:20:00 │ LONG         │ -0.51% │ 45.67% │ 0.12       │ rsiDivergency5m │
// │  665 │ TOKENUSDT    │ 2024 04 03 15:25:00 │ 2024 04 03 22:20:00 │ LONG         │ -0.51% │ 45.16% │ 0.14       │ rsiDivergency5m │
// │  666 │ POLYXUSDT    │ 2024 04 03 23:25:00 │ 2024 04 04 07:45:00 │ LONG         │ 1.02%  │ 46.18% │ 0.53       │ rsiDivergency5m │
// │  667 │ NMRUSDT      │ 2024 04 04 07:50:00 │ 2024 04 04 11:00:00 │ SHORT        │ -0.51% │ 45.67% │ 34.60      │ rsiDivergency5m │
// │  668 │ PENDLEUSDT   │ 2024 04 04 11:30:00 │ 2024 04 04 11:50:00 │ SHORT        │ -0.51% │ 45.15% │ 5.58       │ rsiDivergency5m │
// │  669 │ ALPHAUSDT    │ 2024 04 04 12:25:00 │ 2024 04 04 12:50:00 │ SHORT        │ -0.51% │ 44.64% │ 0.15       │ rsiDivergency5m │
// │  670 │ SSVUSDT      │ 2024 04 04 12:55:00 │ 2024 04 04 21:15:00 │ SHORT        │ 0.95%  │ 45.59% │ 53.20      │ rsiDivergency5m │
// │  671 │ XVGUSDT      │ 2024 04 04 22:10:00 │ 2024 04 05 06:30:00 │ LONG         │ 0.63%  │ 46.22% │ 0.01       │ rsiDivergency5m │
// │  672 │ XVGUSDT      │ 2024 04 05 08:20:00 │ 2024 04 05 16:40:00 │ SHORT        │ 1.56%  │ 47.78% │ 0.01       │ rsiDivergency5m │
// │  673 │ SKLUSDT      │ 2024 04 05 17:30:00 │ 2024 04 05 21:05:00 │ LONG         │ -0.51% │ 47.27% │ 0.12       │ rsiDivergency5m │
// │  674 │ SKLUSDT      │ 2024 04 05 22:10:00 │ 2024 04 06 06:30:00 │ LONG         │ 0.12%  │ 47.39% │ 0.12       │ rsiDivergency5m │
// │  675 │ PENDLEUSDT   │ 2024 04 06 12:05:00 │ 2024 04 06 14:30:00 │ LONG         │ -0.51% │ 46.88% │ 6.74       │ rsiDivergency5m │
// │  676 │ PENDLEUSDT   │ 2024 04 06 15:10:00 │ 2024 04 06 23:30:00 │ LONG         │ -0.03% │ 46.85% │ 6.57       │ rsiDivergency5m │
// │  677 │ NKNUSDT      │ 2024 04 07 05:20:00 │ 2024 04 07 05:30:00 │ SHORT        │ -0.51% │ 46.34% │ 0.20       │ rsiDivergency5m │
// │  678 │ NKNUSDT      │ 2024 04 07 05:35:00 │ 2024 04 07 06:10:00 │ SHORT        │ -0.51% │ 45.83% │ 0.21       │ rsiDivergency5m │
// │  679 │ NKNUSDT      │ 2024 04 07 06:25:00 │ 2024 04 07 07:10:00 │ SHORT        │ -0.51% │ 45.31% │ 0.21       │ rsiDivergency5m │
// │  680 │ YGGUSDT      │ 2024 04 07 08:10:00 │ 2024 04 07 16:30:00 │ SHORT        │ 2.31%  │ 47.63% │ 1.45       │ rsiDivergency5m │
// │  681 │ NKNUSDT      │ 2024 04 07 20:10:00 │ 2024 04 07 21:15:00 │ LONG         │ -0.51% │ 47.11% │ 0.20       │ rsiDivergency5m │
// │  682 │ SFPUSDT      │ 2024 04 07 21:25:00 │ 2024 04 07 22:15:00 │ SHORT        │ -0.51% │ 46.60% │ 0.80       │ rsiDivergency5m │
// │  683 │ SFPUSDT      │ 2024 04 07 22:25:00 │ 2024 04 07 22:45:00 │ SHORT        │ -0.51% │ 46.09% │ 0.82       │ rsiDivergency5m │
// │  684 │ PENDLEUSDT   │ 2024 04 08 00:45:00 │ 2024 04 08 01:25:00 │ LONG         │ -0.51% │ 45.58% │ 6.60       │ rsiDivergency5m │
// │  685 │ POLYXUSDT    │ 2024 04 08 01:45:00 │ 2024 04 08 10:05:00 │ SHORT        │ 1.22%  │ 46.80% │ 0.59       │ rsiDivergency5m │
// │  686 │ SSVUSDT      │ 2024 04 08 11:35:00 │ 2024 04 08 19:55:00 │ SHORT        │ 0.19%  │ 46.99% │ 55.96      │ rsiDivergency5m │
// │  687 │ LEVERUSDT    │ 2024 04 08 21:35:00 │ 2024 04 08 21:55:00 │ SHORT        │ -0.51% │ 46.47% │ 0.00       │ rsiDivergency5m │
// │  688 │ LEVERUSDT    │ 2024 04 09 01:30:00 │ 2024 04 09 07:00:00 │ LONG         │ 2.49%  │ 48.96% │ 0.00       │ rsiDivergency5m │
// │  689 │ TOKENUSDT    │ 2024 04 09 09:10:00 │ 2024 04 09 09:40:00 │ LONG         │ -0.51% │ 48.45% │ 0.15       │ rsiDivergency5m │
// │  690 │ ONDOUSDT     │ 2024 04 09 10:10:00 │ 2024 04 09 18:30:00 │ LONG         │ -0.32% │ 48.13% │ 0.77       │ rsiDivergency5m │
// │  691 │ LDOUSDT      │ 2024 04 09 18:55:00 │ 2024 04 09 21:45:00 │ LONG         │ -0.51% │ 47.62% │ 2.68       │ rsiDivergency5m │
// │  692 │ APTUSDT      │ 2024 04 09 21:55:00 │ 2024 04 10 06:15:00 │ LONG         │ -0.18% │ 47.44% │ 12.29      │ rsiDivergency5m │
// │  693 │ ALPHAUSDT    │ 2024 04 10 16:10:00 │ 2024 04 10 19:40:00 │ SHORT        │ -0.51% │ 46.93% │ 0.19       │ rsiDivergency5m │
// │  694 │ NEOUSDT      │ 2024 04 10 19:55:00 │ 2024 04 11 01:00:00 │ SHORT        │ -0.51% │ 46.41% │ 22.56      │ rsiDivergency5m │
// │  695 │ TNSRUSDT     │ 2024 04 11 03:00:00 │ 2024 04 11 06:20:00 │ LONG         │ -0.51% │ 45.90% │ 1.50       │ rsiDivergency5m │
// │  696 │ CELRUSDT     │ 2024 04 11 07:05:00 │ 2024 04 11 07:15:00 │ SHORT        │ -0.51% │ 45.39% │ 0.04       │ rsiDivergency5m │
// │  697 │ CELRUSDT     │ 2024 04 11 07:40:00 │ 2024 04 11 08:05:00 │ SHORT        │ -0.51% │ 44.88% │ 0.04       │ rsiDivergency5m │
// │  698 │ CELRUSDT     │ 2024 04 11 08:15:00 │ 2024 04 11 16:35:00 │ SHORT        │ 1.93%  │ 46.81% │ 0.04       │ rsiDivergency5m │
// │  699 │ PIXELUSDT    │ 2024 04 11 17:05:00 │ 2024 04 11 18:20:00 │ LONG         │ -0.51% │ 46.30% │ 0.65       │ rsiDivergency5m │
// │  700 │ PIXELUSDT    │ 2024 04 11 18:30:00 │ 2024 04 12 02:50:00 │ LONG         │ -0.22% │ 46.08% │ 0.63       │ rsiDivergency5m │
// │  701 │ SAGAUSDT     │ 2024 04 12 04:50:00 │ 2024 04 12 07:15:00 │ LONG         │ -0.51% │ 45.57% │ 4.81       │ rsiDivergency5m │
// │  702 │ SAGAUSDT     │ 2024 04 12 07:30:00 │ 2024 04 12 08:35:00 │ LONG         │ -0.51% │ 45.05% │ 4.70       │ rsiDivergency5m │
// │  703 │ ETHFIUSDT    │ 2024 04 12 08:40:00 │ 2024 04 12 12:25:00 │ LONG         │ -0.51% │ 44.54% │ 4.87       │ rsiDivergency5m │
// │  704 │ YGGUSDT      │ 2024 04 12 12:30:00 │ 2024 04 12 13:00:00 │ LONG         │ -0.51% │ 44.03% │ 1.12       │ rsiDivergency5m │
// │  705 │ SKLUSDT      │ 2024 04 12 13:05:00 │ 2024 04 12 13:25:00 │ LONG         │ -0.51% │ 43.52% │ 0.10       │ rsiDivergency5m │
// │  706 │ SFPUSDT      │ 2024 04 12 13:40:00 │ 2024 04 12 15:10:00 │ LONG         │ 2.49%  │ 46.00% │ 0.79       │ rsiDivergency5m │
// │  707 │ XMRUSDT      │ 2024 04 12 15:25:00 │ 2024 04 12 23:45:00 │ LONG         │ 1.54%  │ 47.54% │ 118.62     │ rsiDivergency5m │
// │  708 │ NEOUSDT      │ 2024 04 13 00:10:00 │ 2024 04 13 08:30:00 │ SHORT        │ 1.21%  │ 48.76% │ 20.33      │ rsiDivergency5m │
// │  709 │ GMTUSDT      │ 2024 04 13 10:35:00 │ 2024 04 13 14:55:00 │ SHORT        │ 2.49%  │ 51.25% │ 0.27       │ rsiDivergency5m │
// │  710 │ ADAUSDT      │ 2024 04 13 15:00:00 │ 2024 04 13 15:05:00 │ LONG         │ -0.51% │ 50.73% │ 0.45       │ rsiDivergency5m │
// │  711 │ MKRUSDT      │ 2024 04 14 01:35:00 │ 2024 04 14 09:55:00 │ SHORT        │ 0.42%  │ 51.16% │ 2961.10    │ rsiDivergency5m │
// │  712 │ XVGUSDT      │ 2024 04 14 16:20:00 │ 2024 04 14 16:45:00 │ LONG         │ -0.51% │ 50.64% │ 0.01       │ rsiDivergency5m │
// │  713 │ RNDRUSDT     │ 2024 04 14 17:55:00 │ 2024 04 14 18:15:00 │ SHORT        │ -0.51% │ 50.13% │ 8.73       │ rsiDivergency5m │
// │  714 │ LEVERUSDT    │ 2024 04 14 18:20:00 │ 2024 04 15 02:40:00 │ SHORT        │ -0.05% │ 50.08% │ 0.00       │ rsiDivergency5m │
// │  715 │ GMXUSDT      │ 2024 04 15 02:45:00 │ 2024 04 15 11:05:00 │ SHORT        │ 1.02%  │ 51.10% │ 28.82      │ rsiDivergency5m │
// │  716 │ FTMUSDT      │ 2024 04 15 11:25:00 │ 2024 04 15 12:25:00 │ LONG         │ -0.51% │ 50.59% │ 0.67       │ rsiDivergency5m │
// │  717 │ IOSTUSDT     │ 2024 04 15 12:45:00 │ 2024 04 15 13:55:00 │ LONG         │ -0.51% │ 50.08% │ 0.01       │ rsiDivergency5m │
// │  718 │ WUSDT        │ 2024 04 15 18:30:00 │ 2024 04 16 02:50:00 │ SHORT        │ 0.84%  │ 50.92% │ 0.65       │ rsiDivergency5m │
// │  719 │ DARUSDT      │ 2024 04 16 03:00:00 │ 2024 04 16 11:20:00 │ SHORT        │ 1.13%  │ 52.05% │ 0.15       │ rsiDivergency5m │
// │  720 │ ONTUSDT      │ 2024 04 16 11:25:00 │ 2024 04 16 16:20:00 │ LONG         │ 2.49%  │ 54.54% │ 0.29       │ rsiDivergency5m │
// │  721 │ BEAMXUSDT    │ 2024 04 16 16:25:00 │ 2024 04 16 23:30:00 │ SHORT        │ -0.51% │ 54.02% │ 0.03       │ rsiDivergency5m │
// │  722 │ TNSRUSDT     │ 2024 04 17 05:10:00 │ 2024 04 17 05:45:00 │ LONG         │ -0.51% │ 53.51% │ 0.82       │ rsiDivergency5m │
// │  723 │ TAOUSDT      │ 2024 04 17 07:15:00 │ 2024 04 17 09:05:00 │ LONG         │ -0.51% │ 53.00% │ 463.00     │ rsiDivergency5m │
// │  724 │ NEOUSDT      │ 2024 04 17 09:20:00 │ 2024 04 17 17:40:00 │ LONG         │ 0.43%  │ 53.43% │ 17.48      │ rsiDivergency5m │
// │  725 │ ETHFIUSDT    │ 2024 04 17 19:35:00 │ 2024 04 18 02:30:00 │ LONG         │ -0.51% │ 52.92% │ 3.43       │ rsiDivergency5m │
// │  726 │ ENAUSDT      │ 2024 04 18 02:40:00 │ 2024 04 18 06:20:00 │ LONG         │ 2.49%  │ 55.41% │ 0.83       │ rsiDivergency5m │
// │  727 │ ONGUSDT      │ 2024 04 18 08:10:00 │ 2024 04 18 08:30:00 │ SHORT        │ -0.51% │ 54.89% │ 0.55       │ rsiDivergency5m │
// │  728 │ TRUUSDT      │ 2024 04 18 09:25:00 │ 2024 04 18 10:10:00 │ SHORT        │ -0.51% │ 54.38% │ 0.11       │ rsiDivergency5m │
// │  729 │ LPTUSDT      │ 2024 04 18 14:35:00 │ 2024 04 18 20:40:00 │ SHORT        │ 2.49%  │ 56.87% │ 13.94      │ rsiDivergency5m │
// │  730 │ FRONTUSDT    │ 2024 04 18 21:00:00 │ 2024 04 18 21:25:00 │ LONG         │ -0.51% │ 56.36% │ 0.69       │ rsiDivergency5m │
// │  731 │ ENAUSDT      │ 2024 04 18 21:30:00 │ 2024 04 19 01:35:00 │ LONG         │ 2.49%  │ 58.84% │ 0.83       │ rsiDivergency5m │
// │  732 │ DODOXUSDT    │ 2024 04 19 03:10:00 │ 2024 04 19 11:30:00 │ SHORT        │ 0.04%  │ 58.88% │ 0.16       │ rsiDivergency5m │
// │  733 │ TAOUSDT      │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.99%  │ 59.88% │ 433.10     │ rsiDivergency5m │
// │  734 │ ONTUSDT      │ 2024 04 20 07:35:00 │ 2024 04 20 15:55:00 │ LONG         │ 0.26%  │ 60.14% │ 0.36       │ rsiDivergency5m │
// │  735 │ 1000BONKUSDT │ 2024 04 20 16:15:00 │ 2024 04 20 17:20:00 │ SHORT        │ -0.51% │ 59.62% │ 0.02       │ rsiDivergency5m │
// │  736 │ TRUUSDT      │ 2024 04 20 19:50:00 │ 2024 04 21 04:10:00 │ LONG         │ 0.21%  │ 59.83% │ 0.13       │ rsiDivergency5m │
// │  737 │ ONGUSDT      │ 2024 04 21 06:55:00 │ 2024 04 21 07:00:00 │ SHORT        │ -0.51% │ 59.32% │ 0.70       │ rsiDivergency5m │
// │  738 │ ONGUSDT      │ 2024 04 21 07:05:00 │ 2024 04 21 07:45:00 │ SHORT        │ -0.51% │ 58.81% │ 0.71       │ rsiDivergency5m │
// │  739 │ ONGUSDT      │ 2024 04 21 07:50:00 │ 2024 04 21 07:55:00 │ SHORT        │ -0.51% │ 58.29% │ 0.73       │ rsiDivergency5m │
// │  740 │ ONGUSDT      │ 2024 04 21 08:00:00 │ 2024 04 21 09:30:00 │ SHORT        │ -0.51% │ 57.78% │ 0.76       │ rsiDivergency5m │
// │  741 │ OMNIUSDT     │ 2024 04 21 09:40:00 │ 2024 04 21 11:35:00 │ LONG         │ -0.51% │ 57.27% │ 26.06      │ rsiDivergency5m │
// │  742 │ 1000SHIBUSDT │ 2024 04 21 11:45:00 │ 2024 04 21 20:05:00 │ LONG         │ 0.67%  │ 57.94% │ 0.03       │ rsiDivergency5m │
// │  743 │ NTRNUSDT     │ 2024 04 21 23:10:00 │ 2024 04 21 23:15:00 │ SHORT        │ -0.51% │ 57.43% │ 0.87       │ rsiDivergency5m │
// │  744 │ NTRNUSDT     │ 2024 04 21 23:35:00 │ 2024 04 22 07:55:00 │ SHORT        │ 0.86%  │ 58.28% │ 0.88       │ rsiDivergency5m │
// │  745 │ ANKRUSDT     │ 2024 04 22 11:20:00 │ 2024 04 22 12:35:00 │ SHORT        │ -0.51% │ 57.77% │ 0.05       │ rsiDivergency5m │
// │  746 │ ANKRUSDT     │ 2024 04 22 12:40:00 │ 2024 04 22 21:00:00 │ SHORT        │ -0.06% │ 57.71% │ 0.05       │ rsiDivergency5m │
// │  747 │ TNSRUSDT     │ 2024 04 22 23:50:00 │ 2024 04 23 08:10:00 │ LONG         │ 1.28%  │ 58.99% │ 1.10       │ rsiDivergency5m │
// │  748 │ TOKENUSDT    │ 2024 04 23 10:30:00 │ 2024 04 23 11:00:00 │ SHORT        │ -0.51% │ 58.48% │ 0.13       │ rsiDivergency5m │
// │  749 │ TOKENUSDT    │ 2024 04 23 11:15:00 │ 2024 04 23 11:30:00 │ SHORT        │ -0.51% │ 57.97% │ 0.13       │ rsiDivergency5m │
// │  750 │ TOKENUSDT    │ 2024 04 23 11:35:00 │ 2024 04 23 12:00:00 │ SHORT        │ -0.51% │ 57.45% │ 0.14       │ rsiDivergency5m │
// │  751 │ ONTUSDT      │ 2024 04 23 16:50:00 │ 2024 04 23 18:05:00 │ LONG         │ -0.51% │ 56.94% │ 0.43       │ rsiDivergency5m │
// │  752 │ TOKENUSDT    │ 2024 04 23 18:15:00 │ 2024 04 24 00:45:00 │ LONG         │ -0.51% │ 56.43% │ 0.13       │ rsiDivergency5m │
// │  753 │ ONDOUSDT     │ 2024 04 24 06:00:00 │ 2024 04 24 14:20:00 │ SHORT        │ 1.31%  │ 57.74% │ 0.91       │ rsiDivergency5m │
// │  754 │ FETUSDT      │ 2024 04 24 17:55:00 │ 2024 04 25 02:15:00 │ LONG         │ 0.18%  │ 57.92% │ 2.25       │ rsiDivergency5m │
// │  755 │ WUSDT        │ 2024 04 25 08:30:00 │ 2024 04 25 08:45:00 │ SHORT        │ -0.51% │ 57.41% │ 0.58       │ rsiDivergency5m │
// │  756 │ WUSDT        │ 2024 04 25 08:50:00 │ 2024 04 25 09:10:00 │ SHORT        │ -0.51% │ 56.89% │ 0.59       │ rsiDivergency5m │
// │  757 │ WUSDT        │ 2024 04 25 09:25:00 │ 2024 04 25 09:35:00 │ SHORT        │ -0.51% │ 56.38% │ 0.61       │ rsiDivergency5m │
// │  758 │ WUSDT        │ 2024 04 25 09:40:00 │ 2024 04 25 10:35:00 │ SHORT        │ -0.51% │ 55.87% │ 0.62       │ rsiDivergency5m │
// │  759 │ WUSDT        │ 2024 04 25 10:50:00 │ 2024 04 25 11:55:00 │ SHORT        │ -0.51% │ 55.36% │ 0.65       │ rsiDivergency5m │
// │  760 │ 1000BONKUSDT │ 2024 04 25 12:00:00 │ 2024 04 25 19:35:00 │ SHORT        │ 2.49%  │ 57.84% │ 0.03       │ rsiDivergency5m │
// │  761 │ LSKUSDT      │ 2024 04 25 19:40:00 │ 2024 04 25 20:15:00 │ LONG         │ -0.51% │ 57.33% │ 1.85       │ rsiDivergency5m │
// │  762 │ LQTYUSDT     │ 2024 04 25 21:00:00 │ 2024 04 26 05:20:00 │ LONG         │ 0.17%  │ 57.50% │ 1.05       │ rsiDivergency5m │
// │  763 │ ALGOUSDT     │ 2024 04 26 07:55:00 │ 2024 04 26 16:15:00 │ LONG         │ 0.34%  │ 57.84% │ 0.20       │ rsiDivergency5m │
// │  764 │ MYROUSDT     │ 2024 04 26 17:30:00 │ 2024 04 26 19:30:00 │ LONG         │ -0.51% │ 57.33% │ 0.16       │ rsiDivergency5m │
// │  765 │ LSKUSDT      │ 2024 04 26 19:45:00 │ 2024 04 26 20:15:00 │ LONG         │ -0.51% │ 56.82% │ 1.68       │ rsiDivergency5m │
// │  766 │ RSRUSDT      │ 2024 04 26 20:25:00 │ 2024 04 27 04:45:00 │ LONG         │ 1.03%  │ 57.85% │ 0.01       │ rsiDivergency5m │
// │  767 │ LOOMUSDT     │ 2024 04 27 12:05:00 │ 2024 04 27 20:25:00 │ LONG         │ 0.69%  │ 58.54% │ 0.09       │ rsiDivergency5m │
// │  768 │ ETHFIUSDT    │ 2024 04 27 20:30:00 │ 2024 04 27 23:25:00 │ SHORT        │ -0.51% │ 58.03% │ 4.01       │ rsiDivergency5m │
// │  769 │ ZETAUSDT     │ 2024 04 28 00:25:00 │ 2024 04 28 08:45:00 │ SHORT        │ 1.48%  │ 59.51% │ 1.30       │ rsiDivergency5m │
// │  770 │ ALTUSDT      │ 2024 04 28 12:45:00 │ 2024 04 28 21:05:00 │ SHORT        │ 1.05%  │ 60.56% │ 0.41       │ rsiDivergency5m │
// │  771 │ WUSDT        │ 2024 04 28 21:40:00 │ 2024 04 28 22:30:00 │ LONG         │ -0.51% │ 60.05% │ 0.61       │ rsiDivergency5m │
// │  772 │ POLYXUSDT    │ 2024 04 28 22:35:00 │ 2024 04 29 01:45:00 │ LONG         │ -0.51% │ 59.53% │ 0.37       │ rsiDivergency5m │
// │  773 │ POLYXUSDT    │ 2024 04 29 01:50:00 │ 2024 04 29 08:50:00 │ LONG         │ -0.51% │ 59.02% │ 0.37       │ rsiDivergency5m │
// │  774 │ ENAUSDT      │ 2024 04 29 11:00:00 │ 2024 04 29 12:30:00 │ SHORT        │ -0.51% │ 58.51% │ 0.88       │ rsiDivergency5m │
// │  775 │ LEVERUSDT    │ 2024 04 29 18:05:00 │ 2024 04 30 02:25:00 │ SHORT        │ -0.06% │ 58.44% │ 0.00       │ rsiDivergency5m │
// │  776 │ LEVERUSDT    │ 2024 04 30 04:25:00 │ 2024 04 30 07:05:00 │ LONG         │ -0.51% │ 57.93% │ 0.00       │ rsiDivergency5m │
// │  777 │ ALTUSDT      │ 2024 04 30 07:10:00 │ 2024 04 30 10:40:00 │ LONG         │ -0.51% │ 57.42% │ 0.35       │ rsiDivergency5m │
// │  778 │ CKBUSDT      │ 2024 04 30 10:45:00 │ 2024 04 30 11:05:00 │ LONG         │ -0.51% │ 56.91% │ 0.02       │ rsiDivergency5m │
// │  779 │ MAVUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 0.82%  │ 57.72% │ 0.35       │ rsiDivergency5m │
// │  780 │ HIGHUSDT     │ 2024 04 30 22:15:00 │ 2024 05 01 06:35:00 │ LONG         │ 1.76%  │ 59.49% │ 3.26       │ rsiDivergency5m │
// │  781 │ MYROUSDT     │ 2024 05 01 07:00:00 │ 2024 05 01 07:10:00 │ SHORT        │ -0.51% │ 58.97% │ 0.13       │ rsiDivergency5m │
// │  782 │ MTLUSDT      │ 2024 05 01 07:15:00 │ 2024 05 01 15:35:00 │ SHORT        │ 0.79%  │ 59.76% │ 1.66       │ rsiDivergency5m │
// │  783 │ 1INCHUSDT    │ 2024 05 01 19:45:00 │ 2024 05 02 04:05:00 │ LONG         │ 0.02%  │ 59.78% │ 0.36       │ rsiDivergency5m │
// │  784 │ ARUSDT       │ 2024 05 02 06:50:00 │ 2024 05 02 07:10:00 │ SHORT        │ -0.51% │ 59.26% │ 31.20      │ rsiDivergency5m │
// │  785 │ ARUSDT       │ 2024 05 02 07:45:00 │ 2024 05 02 09:45:00 │ SHORT        │ -0.51% │ 58.75% │ 32.22      │ rsiDivergency5m │
// │  786 │ ARUSDT       │ 2024 05 02 10:10:00 │ 2024 05 02 12:15:00 │ SHORT        │ -0.51% │ 58.24% │ 33.12      │ rsiDivergency5m │
// │  787 │ ARUSDT       │ 2024 05 02 13:05:00 │ 2024 05 02 13:40:00 │ SHORT        │ -0.51% │ 57.73% │ 34.20      │ rsiDivergency5m │
// │  788 │ ALTUSDT      │ 2024 05 02 13:50:00 │ 2024 05 02 20:35:00 │ SHORT        │ -0.51% │ 57.21% │ 0.38       │ rsiDivergency5m │
// │  789 │ POLYXUSDT    │ 2024 05 02 21:55:00 │ 2024 05 03 06:15:00 │ SHORT        │ 1.32%  │ 58.53% │ 0.37       │ rsiDivergency5m │
// │  790 │ ARUSDT       │ 2024 05 03 08:10:00 │ 2024 05 03 08:35:00 │ SHORT        │ -0.51% │ 58.02% │ 37.20      │ rsiDivergency5m │
// │  791 │ ARUSDT       │ 2024 05 03 08:50:00 │ 2024 05 03 17:10:00 │ SHORT        │ 1.66%  │ 59.68% │ 37.56      │ rsiDivergency5m │
// │  792 │ OMNIUSDT     │ 2024 05 03 17:15:00 │ 2024 05 04 01:35:00 │ SHORT        │ 0.69%  │ 60.37% │ 19.84      │ rsiDivergency5m │
// │  793 │ LSKUSDT      │ 2024 05 04 04:35:00 │ 2024 05 04 12:55:00 │ SHORT        │ 1.30%  │ 61.67% │ 2.07       │ rsiDivergency5m │
// │  794 │ WUSDT        │ 2024 05 04 22:30:00 │ 2024 05 05 06:50:00 │ LONG         │ -0.05% │ 61.62% │ 0.67       │ rsiDivergency5m │
// │  795 │ HIGHUSDT     │ 2024 05 05 07:00:00 │ 2024 05 05 15:20:00 │ SHORT        │ 0.99%  │ 62.61% │ 4.32       │ rsiDivergency5m │
// │  796 │ USTCUSDT     │ 2024 05 05 17:45:00 │ 2024 05 05 19:35:00 │ SHORT        │ -0.51% │ 62.09% │ 0.02       │ rsiDivergency5m │
// │  797 │ 1000LUNCUSDT │ 2024 05 05 19:45:00 │ 2024 05 05 20:50:00 │ SHORT        │ -0.51% │ 61.58% │ 0.12       │ rsiDivergency5m │
// │  798 │ ENAUSDT      │ 2024 05 06 00:30:00 │ 2024 05 06 03:15:00 │ SHORT        │ -0.51% │ 61.07% │ 0.90       │ rsiDivergency5m │
// │  799 │ RSRUSDT      │ 2024 05 06 03:30:00 │ 2024 05 06 04:10:00 │ SHORT        │ -0.51% │ 60.56% │ 0.01       │ rsiDivergency5m │
// │  800 │ NMRUSDT      │ 2024 05 06 04:40:00 │ 2024 05 06 04:45:00 │ SHORT        │ -0.51% │ 60.04% │ 29.24      │ rsiDivergency5m │
// │  801 │ NMRUSDT      │ 2024 05 06 04:50:00 │ 2024 05 06 13:10:00 │ SHORT        │ 2.19%  │ 62.23% │ 29.58      │ rsiDivergency5m │
// │  802 │ CKBUSDT      │ 2024 05 06 16:55:00 │ 2024 05 07 01:15:00 │ SHORT        │ 0.68%  │ 62.91% │ 0.02       │ rsiDivergency5m │
// │  803 │ POWRUSDT     │ 2024 05 07 01:20:00 │ 2024 05 07 09:40:00 │ SHORT        │ 1.23%  │ 64.14% │ 0.36       │ rsiDivergency5m │
// │  804 │ LEVERUSDT    │ 2024 05 07 10:20:00 │ 2024 05 07 11:05:00 │ LONG         │ -0.51% │ 63.63% │ 0.00       │ rsiDivergency5m │
// │  805 │ AMBUSDT      │ 2024 05 07 14:35:00 │ 2024 05 07 18:05:00 │ LONG         │ -0.51% │ 63.11% │ 0.01       │ rsiDivergency5m │
// │  806 │ USTCUSDT     │ 2024 05 07 21:10:00 │ 2024 05 08 04:15:00 │ SHORT        │ 2.49%  │ 65.60% │ 0.02       │ rsiDivergency5m │
// │  807 │ USTCUSDT     │ 2024 05 08 04:25:00 │ 2024 05 08 12:45:00 │ LONG         │ 0.93%  │ 66.53% │ 0.02       │ rsiDivergency5m │
// │  808 │ ARPAUSDT     │ 2024 05 08 14:10:00 │ 2024 05 08 22:30:00 │ SHORT        │ 1.24%  │ 67.77% │ 0.07       │ rsiDivergency5m │
// │  809 │ PORTALUSDT   │ 2024 05 09 10:40:00 │ 2024 05 09 19:00:00 │ SHORT        │ 0.95%  │ 68.71% │ 0.85       │ rsiDivergency5m │
// │  810 │ IMXUSDT      │ 2024 05 09 20:35:00 │ 2024 05 10 04:55:00 │ SHORT        │ -0.34% │ 68.37% │ 2.23       │ rsiDivergency5m │
// │  811 │ NFPUSDT      │ 2024 05 10 05:05:00 │ 2024 05 10 05:25:00 │ SHORT        │ -0.51% │ 67.86% │ 0.52       │ rsiDivergency5m │
// │  812 │ UMAUSDT      │ 2024 05 10 07:15:00 │ 2024 05 10 11:00:00 │ SHORT        │ 2.49%  │ 70.35% │ 3.91       │ rsiDivergency5m │
// │  813 │ XVGUSDT      │ 2024 05 10 11:05:00 │ 2024 05 10 19:25:00 │ LONG         │ 0.27%  │ 70.62% │ 0.01       │ rsiDivergency5m │
// │  814 │ ACEUSDT      │ 2024 05 10 20:20:00 │ 2024 05 11 04:40:00 │ SHORT        │ 0.94%  │ 71.56% │ 5.37       │ rsiDivergency5m │
// │  815 │ TNSRUSDT     │ 2024 05 11 08:45:00 │ 2024 05 11 09:00:00 │ SHORT        │ -0.51% │ 71.05% │ 0.93       │ rsiDivergency5m │
// │  816 │ TNSRUSDT     │ 2024 05 11 10:20:00 │ 2024 05 11 10:30:00 │ SHORT        │ -0.51% │ 70.54% │ 0.99       │ rsiDivergency5m │
// │  817 │ TNSRUSDT     │ 2024 05 11 10:35:00 │ 2024 05 11 10:45:00 │ SHORT        │ -0.51% │ 70.03% │ 1.01       │ rsiDivergency5m │
// │  818 │ TNSRUSDT     │ 2024 05 11 10:50:00 │ 2024 05 11 11:05:00 │ SHORT        │ -0.51% │ 69.51% │ 1.02       │ rsiDivergency5m │
// │  819 │ TNSRUSDT     │ 2024 05 11 11:10:00 │ 2024 05 11 19:30:00 │ SHORT        │ 1.48%  │ 71.00% │ 1.03       │ rsiDivergency5m │
// │  820 │ PORTALUSDT   │ 2024 05 12 03:30:00 │ 2024 05 12 04:15:00 │ SHORT        │ -0.51% │ 70.48% │ 0.89       │ rsiDivergency5m │
// │  821 │ PORTALUSDT   │ 2024 05 12 05:25:00 │ 2024 05 12 13:45:00 │ SHORT        │ 2.44%  │ 72.93% │ 0.92       │ rsiDivergency5m │
// │  822 │ POWRUSDT     │ 2024 05 12 19:55:00 │ 2024 05 13 01:00:00 │ SHORT        │ -0.51% │ 72.41% │ 0.33       │ rsiDivergency5m │
// │  823 │ FETUSDT      │ 2024 05 13 02:05:00 │ 2024 05 13 03:00:00 │ SHORT        │ -0.51% │ 71.90% │ 2.11       │ rsiDivergency5m │
// │  824 │ BONDUSDT     │ 2024 05 13 03:50:00 │ 2024 05 13 05:00:00 │ SHORT        │ -0.51% │ 71.39% │ 2.95       │ rsiDivergency5m │
// │  825 │ VANRYUSDT    │ 2024 05 13 05:05:00 │ 2024 05 13 06:20:00 │ SHORT        │ -0.51% │ 70.88% │ 0.17       │ rsiDivergency5m │
// │  826 │ ARUSDT       │ 2024 05 13 09:15:00 │ 2024 05 13 17:35:00 │ SHORT        │ 1.06%  │ 71.94% │ 40.91      │ rsiDivergency5m │
// │  827 │ UMAUSDT      │ 2024 05 13 17:50:00 │ 2024 05 13 19:05:00 │ SHORT        │ -0.51% │ 71.43% │ 4.03       │ rsiDivergency5m │
// │  828 │ UMAUSDT      │ 2024 05 13 19:15:00 │ 2024 05 13 19:30:00 │ SHORT        │ -0.51% │ 70.91% │ 4.11       │ rsiDivergency5m │
// │  829 │ SUPERUSDT    │ 2024 05 13 19:55:00 │ 2024 05 14 04:15:00 │ LONG         │ 0.17%  │ 71.08% │ 0.91       │ rsiDivergency5m │
// │  830 │ UMAUSDT      │ 2024 05 14 08:55:00 │ 2024 05 14 17:15:00 │ LONG         │ -0.20% │ 70.88% │ 3.70       │ rsiDivergency5m │
// │  831 │ WLDUSDT      │ 2024 05 14 19:30:00 │ 2024 05 14 20:15:00 │ SHORT        │ -0.51% │ 70.37% │ 4.87       │ rsiDivergency5m │
// │  832 │ FRONTUSDT    │ 2024 05 14 20:50:00 │ 2024 05 15 05:10:00 │ SHORT        │ 0.69%  │ 71.06% │ 1.20       │ rsiDivergency5m │
// │  833 │ LPTUSDT      │ 2024 05 15 05:20:00 │ 2024 05 15 07:30:00 │ SHORT        │ -0.51% │ 70.55% │ 18.24      │ rsiDivergency5m │
// │  834 │ TOKENUSDT    │ 2024 05 15 08:20:00 │ 2024 05 15 08:30:00 │ SHORT        │ -0.51% │ 70.04% │ 0.09       │ rsiDivergency5m │
// │  835 │ TOKENUSDT    │ 2024 05 15 08:35:00 │ 2024 05 15 09:55:00 │ SHORT        │ -0.51% │ 69.52% │ 0.09       │ rsiDivergency5m │
// │  836 │ LPTUSDT      │ 2024 05 15 10:00:00 │ 2024 05 15 18:20:00 │ SHORT        │ 0.70%  │ 70.22% │ 20.76      │ rsiDivergency5m │
// │  837 │ FTMUSDT      │ 2024 05 15 19:05:00 │ 2024 05 15 22:25:00 │ SHORT        │ -0.51% │ 69.71% │ 0.76       │ rsiDivergency5m │
// │  838 │ NTRNUSDT     │ 2024 05 15 22:40:00 │ 2024 05 16 07:00:00 │ SHORT        │ 0.44%  │ 70.15% │ 0.70       │ rsiDivergency5m │
// │  839 │ ENAUSDT      │ 2024 05 16 09:25:00 │ 2024 05 16 09:50:00 │ LONG         │ -0.51% │ 69.64% │ 0.67       │ rsiDivergency5m │
// │  840 │ ENAUSDT      │ 2024 05 16 09:55:00 │ 2024 05 16 18:15:00 │ LONG         │ 0.27%  │ 69.91% │ 0.66       │ rsiDivergency5m │
// │  841 │ BEAMXUSDT    │ 2024 05 17 01:20:00 │ 2024 05 17 05:10:00 │ LONG         │ -0.51% │ 69.39% │ 0.02       │ rsiDivergency5m │
// │  842 │ TOKENUSDT    │ 2024 05 17 06:40:00 │ 2024 05 17 07:35:00 │ SHORT        │ -0.51% │ 68.88% │ 0.11       │ rsiDivergency5m │
// │  843 │ TOKENUSDT    │ 2024 05 17 07:55:00 │ 2024 05 17 10:30:00 │ SHORT        │ -0.51% │ 68.37% │ 0.11       │ rsiDivergency5m │
// │  844 │ STXUSDT      │ 2024 05 17 11:25:00 │ 2024 05 17 19:45:00 │ SHORT        │ 0.25%  │ 68.62% │ 2.12       │ rsiDivergency5m │
// │  845 │ TRUUSDT      │ 2024 05 17 20:25:00 │ 2024 05 17 23:05:00 │ SHORT        │ -0.51% │ 68.10% │ 0.13       │ rsiDivergency5m │
// │  846 │ POLYXUSDT    │ 2024 05 17 23:40:00 │ 2024 05 18 08:00:00 │ SHORT        │ 0.14%  │ 68.24% │ 0.46       │ rsiDivergency5m │
// │  847 │ 1000BONKUSDT │ 2024 05 18 17:05:00 │ 2024 05 18 20:50:00 │ SHORT        │ -0.51% │ 67.73% │ 0.03       │ rsiDivergency5m │
// │  848 │ TNSRUSDT     │ 2024 05 19 11:35:00 │ 2024 05 19 16:30:00 │ LONG         │ -0.51% │ 67.22% │ 0.81       │ rsiDivergency5m │
// │  849 │ SAGAUSDT     │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 1.30%  │ 68.52% │ 1.96       │ rsiDivergency5m │
// │  850 │ FTMUSDT      │ 2024 05 20 11:35:00 │ 2024 05 20 19:55:00 │ SHORT        │ 1.38%  │ 69.89% │ 0.96       │ rsiDivergency5m │
// │  851 │ 1000BONKUSDT │ 2024 05 20 22:30:00 │ 2024 05 21 05:45:00 │ SHORT        │ -0.51% │ 69.38% │ 0.03       │ rsiDivergency5m │
// │  852 │ ARUSDT       │ 2024 05 21 07:35:00 │ 2024 05 21 15:55:00 │ LONG         │ 0.41%  │ 69.79% │ 43.70      │ rsiDivergency5m │
// │  853 │ 1000LUNCUSDT │ 2024 05 22 06:55:00 │ 2024 05 22 15:15:00 │ SHORT        │ 1.38%  │ 71.17% │ 0.12       │ rsiDivergency5m │
// │  854 │ HOOKUSDT     │ 2024 05 22 19:25:00 │ 2024 05 22 22:25:00 │ SHORT        │ -0.51% │ 70.66% │ 0.96       │ rsiDivergency5m │
// │  855 │ MANTAUSDT    │ 2024 05 22 23:20:00 │ 2024 05 23 07:40:00 │ SHORT        │ 0.29%  │ 70.95% │ 1.79       │ rsiDivergency5m │
// │  856 │ YGGUSDT      │ 2024 05 23 08:00:00 │ 2024 05 23 08:45:00 │ LONG         │ -0.51% │ 70.44% │ 0.91       │ rsiDivergency5m │
// │  857 │ 1000SATSUSDT │ 2024 05 23 09:00:00 │ 2024 05 23 13:20:00 │ LONG         │ -0.51% │ 69.93% │ 0.00       │ rsiDivergency5m │
// │  858 │ ORDIUSDT     │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 0.98%  │ 70.91% │ 36.65      │ rsiDivergency5m │
// │  859 │ DEFIUSDT     │ 2024 05 23 23:40:00 │ 2024 05 24 08:00:00 │ SHORT        │ 0.15%  │ 71.05% │ 1019.60    │ rsiDivergency5m │
// │  860 │ PENDLEUSDT   │ 2024 05 24 08:20:00 │ 2024 05 24 13:20:00 │ SHORT        │ -0.51% │ 70.54% │ 6.42       │ rsiDivergency5m │
// │  861 │ RENUSDT      │ 2024 05 24 15:35:00 │ 2024 05 24 18:45:00 │ SHORT        │ -0.51% │ 70.03% │ 0.07       │ rsiDivergency5m │
// │  862 │ UMAUSDT      │ 2024 05 24 19:30:00 │ 2024 05 25 03:50:00 │ SHORT        │ 0.73%  │ 70.76% │ 3.67       │ rsiDivergency5m │
// │  863 │ MYROUSDT     │ 2024 05 25 06:35:00 │ 2024 05 25 14:55:00 │ SHORT        │ 0.07%  │ 70.83% │ 0.26       │ rsiDivergency5m │
// │  864 │ ENSUSDT      │ 2024 05 25 15:50:00 │ 2024 05 26 00:10:00 │ LONG         │ 1.00%  │ 71.83% │ 22.89      │ rsiDivergency5m │
// │  865 │ LDOUSDT      │ 2024 05 26 06:15:00 │ 2024 05 26 14:35:00 │ SHORT        │ 0.43%  │ 72.26% │ 2.69       │ rsiDivergency5m │
// │  866 │ SNXUSDT      │ 2024 05 26 22:15:00 │ 2024 05 26 22:20:00 │ SHORT        │ -0.51% │ 71.75% │ 3.22       │ rsiDivergency5m │
// │  867 │ VANRYUSDT    │ 2024 05 26 23:20:00 │ 2024 05 27 07:40:00 │ SHORT        │ 1.14%  │ 72.89% │ 0.21       │ rsiDivergency5m │
// │  868 │ ENJUSDT      │ 2024 05 27 13:10:00 │ 2024 05 27 13:25:00 │ SHORT        │ -0.51% │ 72.38% │ 0.38       │ rsiDivergency5m │
// │  869 │ ENJUSDT      │ 2024 05 27 13:35:00 │ 2024 05 27 20:05:00 │ SHORT        │ -0.51% │ 71.87% │ 0.38       │ rsiDivergency5m │
// │  870 │ TNSRUSDT     │ 2024 05 28 05:25:00 │ 2024 05 28 13:45:00 │ SHORT        │ 1.86%  │ 73.73% │ 1.23       │ rsiDivergency5m │
// │  871 │ 1000SHIBUSDT │ 2024 05 28 22:15:00 │ 2024 05 28 22:40:00 │ SHORT        │ -0.51% │ 73.21% │ 0.03       │ rsiDivergency5m │
// │  872 │ TRUUSDT      │ 2024 05 29 00:55:00 │ 2024 05 29 01:00:00 │ SHORT        │ -0.51% │ 72.70% │ 0.23       │ rsiDivergency5m │
// │  873 │ MYROUSDT     │ 2024 05 29 04:05:00 │ 2024 05 29 04:15:00 │ LONG         │ -0.51% │ 72.19% │ 0.30       │ rsiDivergency5m │
// │  874 │ AMBUSDT      │ 2024 05 29 22:35:00 │ 2024 05 30 02:50:00 │ SHORT        │ -0.51% │ 71.68% │ 0.01       │ rsiDivergency5m │
// │  875 │ 1000SHIBUSDT │ 2024 05 30 02:55:00 │ 2024 05 30 11:15:00 │ LONG         │ 0.44%  │ 72.12% │ 0.03       │ rsiDivergency5m │
// │  876 │ 1000SHIBUSDT │ 2024 05 30 16:05:00 │ 2024 05 31 00:25:00 │ LONG         │ 0.01%  │ 72.13% │ 0.03       │ rsiDivergency5m │
// │  877 │ TNSRUSDT     │ 2024 05 31 05:10:00 │ 2024 05 31 13:30:00 │ SHORT        │ 1.00%  │ 73.14% │ 1.10       │ rsiDivergency5m │
// │  878 │ FXSUSDT      │ 2024 05 31 17:05:00 │ 2024 05 31 17:15:00 │ SHORT        │ -0.51% │ 72.63% │ 4.85       │ rsiDivergency5m │
// │  879 │ MTLUSDT      │ 2024 05 31 20:25:00 │ 2024 06 01 00:40:00 │ LONG         │ -0.51% │ 72.11% │ 1.70       │ rsiDivergency5m │
// │  880 │ HIGHUSDT     │ 2024 06 01 02:30:00 │ 2024 06 01 03:15:00 │ LONG         │ -0.51% │ 71.60% │ 6.69       │ rsiDivergency5m │
// │  881 │ PIXELUSDT    │ 2024 06 01 08:05:00 │ 2024 06 01 16:25:00 │ SHORT        │ -0.51% │ 71.09% │ 0.46       │ rsiDivergency5m │
// │  882 │ ENSUSDT      │ 2024 06 01 17:50:00 │ 2024 06 02 02:10:00 │ SHORT        │ 1.13%  │ 72.22% │ 29.34      │ rsiDivergency5m │
// │  883 │ SPELLUSDT    │ 2024 06 02 02:40:00 │ 2024 06 02 11:00:00 │ LONG         │ 0.39%  │ 72.61% │ 0.00       │ rsiDivergency5m │
// │  884 │ VANRYUSDT    │ 2024 06 02 11:30:00 │ 2024 06 02 19:50:00 │ SHORT        │ 1.35%  │ 73.96% │ 0.23       │ rsiDivergency5m │
// │  885 │ KLAYUSDT     │ 2024 06 02 20:05:00 │ 2024 06 02 20:40:00 │ SHORT        │ -0.51% │ 73.45% │ 0.24       │ rsiDivergency5m │
// │  886 │ KLAYUSDT     │ 2024 06 02 20:50:00 │ 2024 06 02 21:25:00 │ SHORT        │ -0.51% │ 72.94% │ 0.25       │ rsiDivergency5m │
// │  887 │ KLAYUSDT     │ 2024 06 02 21:40:00 │ 2024 06 03 02:55:00 │ SHORT        │ 2.49%  │ 75.42% │ 0.26       │ rsiDivergency5m │
// │  888 │ SPELLUSDT    │ 2024 06 03 08:05:00 │ 2024 06 03 08:10:00 │ SHORT        │ -0.51% │ 74.91% │ 0.00       │ rsiDivergency5m │
// │  889 │ HIGHUSDT     │ 2024 06 03 09:20:00 │ 2024 06 03 11:05:00 │ LONG         │ -0.51% │ 74.40% │ 7.24       │ rsiDivergency5m │
// │  890 │ MYROUSDT     │ 2024 06 03 17:10:00 │ 2024 06 04 01:30:00 │ LONG         │ 0.13%  │ 74.53% │ 0.24       │ rsiDivergency5m │
// │  891 │ ALICEUSDT    │ 2024 06 04 08:00:00 │ 2024 06 04 16:20:00 │ LONG         │ 0.68%  │ 75.21% │ 2.12       │ rsiDivergency5m │
// │  892 │ CKBUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 20:40:00 │ SHORT        │ -0.51% │ 74.70% │ 0.02       │ rsiDivergency5m │
// │  893 │ TOKENUSDT    │ 2024 06 04 21:25:00 │ 2024 06 04 21:30:00 │ SHORT        │ -0.51% │ 74.19% │ 0.16       │ rsiDivergency5m │
// │  894 │ TOKENUSDT    │ 2024 06 04 21:35:00 │ 2024 06 04 21:50:00 │ SHORT        │ -0.51% │ 73.68% │ 0.16       │ rsiDivergency5m │
// │  895 │ TOKENUSDT    │ 2024 06 04 22:00:00 │ 2024 06 05 01:35:00 │ SHORT        │ -0.51% │ 73.16% │ 0.17       │ rsiDivergency5m │
// │  896 │ RSRUSDT      │ 2024 06 05 01:45:00 │ 2024 06 05 10:05:00 │ SHORT        │ 0.57%  │ 73.73% │ 0.01       │ rsiDivergency5m │
// │  897 │ GMXUSDT      │ 2024 06 05 10:20:00 │ 2024 06 05 12:00:00 │ SHORT        │ -0.51% │ 73.22% │ 40.26      │ rsiDivergency5m │
// │  898 │ STXUSDT      │ 2024 06 05 12:05:00 │ 2024 06 05 12:55:00 │ SHORT        │ -0.51% │ 72.71% │ 2.39       │ rsiDivergency5m │
// │  899 │ GMXUSDT      │ 2024 06 05 13:05:00 │ 2024 06 05 21:25:00 │ SHORT        │ -0.02% │ 72.69% │ 42.39      │ rsiDivergency5m │
// │  900 │ REZUSDT      │ 2024 06 05 22:05:00 │ 2024 06 06 06:25:00 │ SHORT        │ 2.09%  │ 74.78% │ 0.18       │ rsiDivergency5m │
// │  901 │ LQTYUSDT     │ 2024 06 06 07:55:00 │ 2024 06 06 08:05:00 │ SHORT        │ -0.51% │ 74.26% │ 1.47       │ rsiDivergency5m │
// │  902 │ REZUSDT      │ 2024 06 06 09:45:00 │ 2024 06 06 18:05:00 │ SHORT        │ 0.98%  │ 75.25% │ 0.18       │ rsiDivergency5m │
// │  903 │ MYROUSDT     │ 2024 06 06 18:25:00 │ 2024 06 07 02:45:00 │ LONG         │ 0.15%  │ 75.39% │ 0.27       │ rsiDivergency5m │
// │  904 │ USTCUSDT     │ 2024 06 07 04:15:00 │ 2024 06 07 07:30:00 │ LONG         │ -0.51% │ 74.88% │ 0.02       │ rsiDivergency5m │
// │  905 │ HIGHUSDT     │ 2024 06 07 08:45:00 │ 2024 06 07 09:00:00 │ SHORT        │ -0.51% │ 74.37% │ 8.30       │ rsiDivergency5m │
// │  906 │ HIGHUSDT     │ 2024 06 07 09:05:00 │ 2024 06 07 13:30:00 │ SHORT        │ -0.51% │ 73.86% │ 8.40       │ rsiDivergency5m │
// │  907 │ XVSUSDT      │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 1.98%  │ 75.84% │ 10.01      │ rsiDivergency5m │
// │  908 │ NKNUSDT      │ 2024 06 07 23:55:00 │ 2024 06 08 06:40:00 │ LONG         │ -0.51% │ 75.32% │ 0.11       │ rsiDivergency5m │
// │  909 │ CKBUSDT      │ 2024 06 08 07:30:00 │ 2024 06 08 08:20:00 │ LONG         │ -0.51% │ 74.81% │ 0.02       │ rsiDivergency5m │
// │  910 │ SAGAUSDT     │ 2024 06 08 08:30:00 │ 2024 06 08 16:50:00 │ LONG         │ 0.11%  │ 74.92% │ 2.29       │ rsiDivergency5m │
// │  911 │ TOKENUSDT    │ 2024 06 08 21:20:00 │ 2024 06 09 05:40:00 │ LONG         │ 0.01%  │ 74.93% │ 0.13       │ rsiDivergency5m │
// │  912 │ HIGHUSDT     │ 2024 06 09 11:40:00 │ 2024 06 09 20:00:00 │ SHORT        │ 1.90%  │ 76.83% │ 4.83       │ rsiDivergency5m │
// │  913 │ HIFIUSDT     │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.24%  │ 78.07% │ 0.75       │ rsiDivergency5m │
// │  914 │ INJUSDT      │ 2024 06 10 10:35:00 │ 2024 06 10 18:55:00 │ SHORT        │ 0.10%  │ 78.17% │ 29.47      │ rsiDivergency5m │
// │  915 │ POLYXUSDT    │ 2024 06 10 20:55:00 │ 2024 06 11 05:15:00 │ LONG         │ 0.51%  │ 78.68% │ 0.49       │ rsiDivergency5m │
// │  916 │ 1000BONKUSDT │ 2024 06 11 05:25:00 │ 2024 06 11 13:45:00 │ SHORT        │ 0.50%  │ 79.18% │ 0.03       │ rsiDivergency5m │
// │  917 │ ROSEUSDT     │ 2024 06 11 15:00:00 │ 2024 06 11 21:35:00 │ SHORT        │ -0.51% │ 78.67% │ 0.12       │ rsiDivergency5m │
// │  918 │ 1000BONKUSDT │ 2024 06 12 01:40:00 │ 2024 06 12 03:10:00 │ SHORT        │ -0.51% │ 78.15% │ 0.03       │ rsiDivergency5m │
// │  919 │ ONGUSDT      │ 2024 06 12 05:05:00 │ 2024 06 12 06:00:00 │ SHORT        │ -0.51% │ 77.64% │ 0.41       │ rsiDivergency5m │
// │  920 │ VANRYUSDT    │ 2024 06 12 07:35:00 │ 2024 06 12 10:25:00 │ SHORT        │ -0.51% │ 77.13% │ 0.17       │ rsiDivergency5m │
// │  921 │ VANRYUSDT    │ 2024 06 12 12:15:00 │ 2024 06 12 12:45:00 │ SHORT        │ -0.51% │ 76.62% │ 0.18       │ rsiDivergency5m │
// │  922 │ TNSRUSDT     │ 2024 06 12 22:10:00 │ 2024 06 13 06:30:00 │ LONG         │ 0.60%  │ 77.21% │ 0.81       │ rsiDivergency5m │
// │  923 │ POLYXUSDT    │ 2024 06 13 10:45:00 │ 2024 06 13 11:00:00 │ LONG         │ -0.51% │ 76.70% │ 0.46       │ rsiDivergency5m │
// │  924 │ TOKENUSDT    │ 2024 06 13 11:05:00 │ 2024 06 13 19:20:00 │ LONG         │ -0.51% │ 76.19% │ 0.10       │ rsiDivergency5m │
// │  925 │ KNCUSDT      │ 2024 06 13 19:25:00 │ 2024 06 14 03:45:00 │ LONG         │ 1.63%  │ 77.82% │ 0.72       │ rsiDivergency5m │
// │  926 │ KNCUSDT      │ 2024 06 14 04:30:00 │ 2024 06 14 07:15:00 │ SHORT        │ -0.51% │ 77.30% │ 0.79       │ rsiDivergency5m │
// │  927 │ ARUSDT       │ 2024 06 14 08:05:00 │ 2024 06 14 09:25:00 │ LONG         │ -0.51% │ 76.79% │ 30.01      │ rsiDivergency5m │
// │  928 │ ONGUSDT      │ 2024 06 14 10:50:00 │ 2024 06 14 11:05:00 │ LONG         │ -0.51% │ 76.28% │ 0.37       │ rsiDivergency5m │
// │  929 │ ROSEUSDT     │ 2024 06 14 11:10:00 │ 2024 06 14 13:05:00 │ LONG         │ -0.51% │ 75.77% │ 0.12       │ rsiDivergency5m │
// │  930 │ DODOXUSDT    │ 2024 06 14 13:10:00 │ 2024 06 14 21:30:00 │ LONG         │ 0.60%  │ 76.37% │ 0.16       │ rsiDivergency5m │
// │  931 │ 1000SHIBUSDT │ 2024 06 14 23:55:00 │ 2024 06 15 08:15:00 │ SHORT        │ -0.06% │ 76.31% │ 0.02       │ rsiDivergency5m │
// │  932 │ RIFUSDT      │ 2024 06 15 15:20:00 │ 2024 06 15 23:40:00 │ LONG         │ 0.68%  │ 76.99% │ 0.11       │ rsiDivergency5m │
// │  933 │ LDOUSDT      │ 2024 06 16 10:10:00 │ 2024 06 16 10:55:00 │ SHORT        │ -0.51% │ 76.48% │ 2.17       │ rsiDivergency5m │
// │  934 │ LDOUSDT      │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 1.01%  │ 77.48% │ 2.24       │ rsiDivergency5m │
// │  935 │ POLYXUSDT    │ 2024 06 16 21:05:00 │ 2024 06 17 02:10:00 │ LONG         │ -0.51% │ 76.97% │ 0.38       │ rsiDivergency5m │
// │  936 │ HIFIUSDT     │ 2024 06 17 02:15:00 │ 2024 06 17 04:40:00 │ LONG         │ -0.51% │ 76.46% │ 0.54       │ rsiDivergency5m │
// │  937 │ POLYXUSDT    │ 2024 06 17 04:50:00 │ 2024 06 17 10:30:00 │ LONG         │ -0.51% │ 75.94% │ 0.36       │ rsiDivergency5m │
// │  938 │ KNCUSDT      │ 2024 06 17 10:55:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 75.43% │ 0.62       │ rsiDivergency5m │
// │  939 │ 1000BONKUSDT │ 2024 06 17 13:35:00 │ 2024 06 17 20:20:00 │ SHORT        │ 2.49%  │ 77.92% │ 0.02       │ rsiDivergency5m │
// │  940 │ KNCUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 77.41% │ 0.55       │ rsiDivergency5m │
// │  941 │ ONGUSDT      │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 0.29%  │ 77.69% │ 0.28       │ rsiDivergency5m │
// │  942 │ FETUSDT      │ 2024 06 18 05:20:00 │ 2024 06 18 06:10:00 │ LONG         │ -0.51% │ 77.18% │ 1.16       │ rsiDivergency5m │
// │  943 │ NMRUSDT      │ 2024 06 18 06:30:00 │ 2024 06 18 09:05:00 │ LONG         │ -0.51% │ 76.67% │ 17.53      │ rsiDivergency5m │
// │  944 │ FRONTUSDT    │ 2024 06 18 09:40:00 │ 2024 06 18 12:30:00 │ SHORT        │ 2.49%  │ 79.16% │ 1.06       │ rsiDivergency5m │
// │  945 │ CRVUSDT      │ 2024 06 18 15:50:00 │ 2024 06 18 16:30:00 │ SHORT        │ -0.51% │ 78.64% │ 0.32       │ rsiDivergency5m │
// │  946 │ CRVUSDT      │ 2024 06 18 17:20:00 │ 2024 06 18 19:45:00 │ SHORT        │ -0.51% │ 78.13% │ 0.33       │ rsiDivergency5m │
// │  947 │ ENSUSDT      │ 2024 06 18 20:20:00 │ 2024 06 18 21:20:00 │ SHORT        │ -0.51% │ 77.62% │ 26.62      │ rsiDivergency5m │
// │  948 │ ENAUSDT      │ 2024 06 18 21:30:00 │ 2024 06 18 23:00:00 │ SHORT        │ -0.51% │ 77.11% │ 0.66       │ rsiDivergency5m │
// │  949 │ FETUSDT      │ 2024 06 18 23:10:00 │ 2024 06 19 01:10:00 │ SHORT        │ -0.51% │ 76.59% │ 1.27       │ rsiDivergency5m │
// │  950 │ MKRUSDT      │ 2024 06 19 01:40:00 │ 2024 06 19 10:00:00 │ SHORT        │ 0.94%  │ 77.53% │ 2490.30    │ rsiDivergency5m │
// │  951 │ LDOUSDT      │ 2024 06 19 10:40:00 │ 2024 06 19 19:00:00 │ LONG         │ 0.84%  │ 78.37% │ 2.25       │ rsiDivergency5m │
// │  952 │ BONDUSDT     │ 2024 06 19 22:35:00 │ 2024 06 19 23:20:00 │ SHORT        │ -0.51% │ 77.86% │ 2.11       │ rsiDivergency5m │
// │  953 │ NMRUSDT      │ 2024 06 20 00:35:00 │ 2024 06 20 08:55:00 │ SHORT        │ 0.52%  │ 78.38% │ 20.06      │ rsiDivergency5m │
// │  954 │ INJUSDT      │ 2024 06 20 11:10:00 │ 2024 06 20 19:20:00 │ LONG         │ -0.51% │ 77.87% │ 20.76      │ rsiDivergency5m │
// │  955 │ RNDRUSDT     │ 2024 06 20 19:55:00 │ 2024 06 21 04:15:00 │ LONG         │ -0.18% │ 77.69% │ 7.41       │ rsiDivergency5m │
// │  956 │ IOUSDT       │ 2024 06 21 08:50:00 │ 2024 06 21 17:10:00 │ LONG         │ 0.73%  │ 78.42% │ 3.62       │ rsiDivergency5m │
// │  957 │ 1000LUNCUSDT │ 2024 06 21 23:30:00 │ 2024 06 21 23:50:00 │ LONG         │ -0.51% │ 77.91% │ 0.08       │ rsiDivergency5m │
// │  958 │ 1000LUNCUSDT │ 2024 06 21 23:55:00 │ 2024 06 22 00:50:00 │ LONG         │ -0.51% │ 77.39% │ 0.08       │ rsiDivergency5m │
// │  959 │ 1000LUNCUSDT │ 2024 06 22 01:05:00 │ 2024 06 22 01:10:00 │ LONG         │ -0.51% │ 76.88% │ 0.08       │ rsiDivergency5m │
// │  960 │ GASUSDT      │ 2024 06 22 03:25:00 │ 2024 06 22 11:45:00 │ LONG         │ 0.01%  │ 76.90% │ 3.67       │ rsiDivergency5m │
// │  961 │ 1000SATSUSDT │ 2024 06 22 12:00:00 │ 2024 06 22 20:20:00 │ SHORT        │ 0.48%  │ 77.38% │ 0.00       │ rsiDivergency5m │
// │  962 │ MTLUSDT      │ 2024 06 23 01:00:00 │ 2024 06 23 01:10:00 │ SHORT        │ -0.51% │ 76.86% │ 1.25       │ rsiDivergency5m │
// │  963 │ MTLUSDT      │ 2024 06 23 09:50:00 │ 2024 06 23 11:00:00 │ LONG         │ -0.51% │ 76.35% │ 1.22       │ rsiDivergency5m │
// │  964 │ VANRYUSDT    │ 2024 06 23 11:55:00 │ 2024 06 23 15:30:00 │ LONG         │ -0.51% │ 75.84% │ 0.14       │ rsiDivergency5m │
// │  965 │ TRUUSDT      │ 2024 06 23 17:10:00 │ 2024 06 23 18:15:00 │ LONG         │ -0.51% │ 75.33% │ 0.13       │ rsiDivergency5m │
// │  966 │ TRUUSDT      │ 2024 06 23 18:20:00 │ 2024 06 24 00:05:00 │ LONG         │ -0.51% │ 74.81% │ 0.13       │ rsiDivergency5m │
// │  967 │ 1000SATSUSDT │ 2024 06 24 00:45:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.51% │ 74.30% │ 0.00       │ rsiDivergency5m │
// │  968 │ STRKUSDT     │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 1.58%  │ 75.88% │ 0.66       │ rsiDivergency5m │
// │  969 │ LDOUSDT      │ 2024 06 24 15:55:00 │ 2024 06 24 16:15:00 │ SHORT        │ -0.51% │ 75.37% │ 2.40       │ rsiDivergency5m │
// │  970 │ LDOUSDT      │ 2024 06 24 16:20:00 │ 2024 06 25 00:40:00 │ SHORT        │ 0.07%  │ 75.44% │ 2.42       │ rsiDivergency5m │
// │  971 │ STXUSDT      │ 2024 06 25 07:00:00 │ 2024 06 25 09:20:00 │ SHORT        │ -0.51% │ 74.92% │ 1.71       │ rsiDivergency5m │
// │  972 │ STXUSDT      │ 2024 06 25 17:05:00 │ 2024 06 26 01:25:00 │ SHORT        │ 0.82%  │ 75.75% │ 1.79       │ rsiDivergency5m │
// │  973 │ ONGUSDT      │ 2024 06 26 11:55:00 │ 2024 06 26 20:15:00 │ LONG         │ 0.11%  │ 75.86% │ 0.34       │ rsiDivergency5m │
// │  974 │ FETUSDT      │ 2024 06 26 21:10:00 │ 2024 06 26 21:55:00 │ LONG         │ -0.51% │ 75.35% │ 1.67       │ rsiDivergency5m │
// │  975 │ ENSUSDT      │ 2024 06 27 04:30:00 │ 2024 06 27 05:30:00 │ SHORT        │ -0.51% │ 74.83% │ 25.94      │ rsiDivergency5m │
// │  976 │ 1000SATSUSDT │ 2024 06 27 05:35:00 │ 2024 06 27 06:15:00 │ SHORT        │ -0.51% │ 74.32% │ 0.00       │ rsiDivergency5m │
// │  977 │ 1000SATSUSDT │ 2024 06 27 06:20:00 │ 2024 06 27 06:55:00 │ SHORT        │ -0.51% │ 73.81% │ 0.00       │ rsiDivergency5m │
// │  978 │ 1000SATSUSDT │ 2024 06 27 07:00:00 │ 2024 06 27 07:15:00 │ SHORT        │ -0.51% │ 73.30% │ 0.00       │ rsiDivergency5m │
// │  979 │ LEVERUSDT    │ 2024 06 27 07:50:00 │ 2024 06 27 13:25:00 │ SHORT        │ -0.51% │ 72.78% │ 0.00       │ rsiDivergency5m │
// │  980 │ LEVERUSDT    │ 2024 06 27 14:00:00 │ 2024 06 27 22:20:00 │ SHORT        │ -0.06% │ 72.73% │ 0.00       │ rsiDivergency5m │
// │  981 │ FETUSDT      │ 2024 06 28 00:10:00 │ 2024 06 28 08:30:00 │ LONG         │ 0.43%  │ 73.16% │ 1.45       │ rsiDivergency5m │
// │  982 │ YFIUSDT      │ 2024 06 28 13:55:00 │ 2024 06 28 18:50:00 │ SHORT        │ -0.51% │ 72.65% │ 6207.00    │ rsiDivergency5m │
// │  983 │ NTRNUSDT     │ 2024 06 28 21:50:00 │ 2024 06 28 22:00:00 │ SHORT        │ -0.51% │ 72.13% │ 0.43       │ rsiDivergency5m │
// │  984 │ MYROUSDT     │ 2024 06 28 22:05:00 │ 2024 06 29 06:25:00 │ SHORT        │ 0.45%  │ 72.58% │ 0.14       │ rsiDivergency5m │
// │  985 │ BONDUSDT     │ 2024 06 29 13:05:00 │ 2024 06 29 14:30:00 │ LONG         │ -0.51% │ 72.07% │ 2.27       │ rsiDivergency5m │
// │  986 │ BONDUSDT     │ 2024 06 29 15:50:00 │ 2024 06 29 17:15:00 │ LONG         │ -0.51% │ 71.55% │ 2.21       │ rsiDivergency5m │
// │  987 │ ARPAUSDT     │ 2024 06 29 19:15:00 │ 2024 06 29 20:00:00 │ LONG         │ -0.51% │ 71.04% │ 0.04       │ rsiDivergency5m │
// │  988 │ ARPAUSDT     │ 2024 06 29 20:05:00 │ 2024 06 30 03:05:00 │ LONG         │ 2.49%  │ 73.53% │ 0.04       │ rsiDivergency5m │
// │  989 │ NTRNUSDT     │ 2024 06 30 06:35:00 │ 2024 06 30 08:00:00 │ LONG         │ -0.51% │ 73.02% │ 0.48       │ rsiDivergency5m │
// │  990 │ NTRNUSDT     │ 2024 06 30 08:20:00 │ 2024 06 30 12:00:00 │ LONG         │ -0.51% │ 72.50% │ 0.47       │ rsiDivergency5m │
// │  991 │ NTRNUSDT     │ 2024 06 30 12:05:00 │ 2024 06 30 16:10:00 │ LONG         │ -0.51% │ 71.99% │ 0.46       │ rsiDivergency5m │
// │  992 │ ENSUSDT      │ 2024 06 30 17:40:00 │ 2024 06 30 18:20:00 │ SHORT        │ -0.51% │ 71.48% │ 30.22      │ rsiDivergency5m │
// │  993 │ ENSUSDT      │ 2024 06 30 18:30:00 │ 2024 06 30 19:00:00 │ SHORT        │ -0.51% │ 70.97% │ 30.62      │ rsiDivergency5m │
// │  994 │ ENSUSDT      │ 2024 06 30 19:05:00 │ 2024 06 30 19:15:00 │ SHORT        │ -0.51% │ 70.45% │ 30.70      │ rsiDivergency5m │
// │  995 │ VANRYUSDT    │ 2024 06 30 20:25:00 │ 2024 06 30 20:40:00 │ SHORT        │ -0.51% │ 69.94% │ 0.14       │ rsiDivergency5m │
// │  996 │ VANRYUSDT    │ 2024 06 30 20:45:00 │ 2024 06 30 20:55:00 │ SHORT        │ -0.51% │ 69.43% │ 0.14       │ rsiDivergency5m │
// │  997 │ TRUUSDT      │ 2024 06 30 21:00:00 │ 2024 07 01 05:20:00 │ SHORT        │ 0.63%  │ 70.06% │ 0.13       │ rsiDivergency5m │
// │  998 │ IOUSDT       │ 2024 07 01 06:25:00 │ 2024 07 01 08:10:00 │ LONG         │ -0.51% │ 69.55% │ 3.12       │ rsiDivergency5m │
// │  999 │ PORTALUSDT   │ 2024 07 01 10:25:00 │ 2024 07 01 18:45:00 │ LONG         │ 0.20%  │ 69.75% │ 0.44       │ rsiDivergency5m │
// │ 1000 │ FETUSDT      │ 2024 07 01 18:50:00 │ 2024 07 01 19:35:00 │ LONG         │ -0.51% │ 69.24% │ 1.29       │ rsiDivergency5m │
// │ 1001 │ ETHFIUSDT    │ 2024 07 01 21:05:00 │ 2024 07 01 22:15:00 │ LONG         │ -0.51% │ 68.73% │ 2.78       │ rsiDivergency5m │
// │ 1002 │ ETHFIUSDT    │ 2024 07 01 22:20:00 │ 2024 07 02 06:40:00 │ LONG         │ -0.03% │ 68.70% │ 2.73       │ rsiDivergency5m │
// │ 1003 │ REZUSDT      │ 2024 07 02 06:55:00 │ 2024 07 02 15:15:00 │ LONG         │ 1.55%  │ 70.25% │ 0.08       │ rsiDivergency5m │
// │ 1004 │ TAOUSDT      │ 2024 07 02 16:05:00 │ 2024 07 02 19:40:00 │ LONG         │ -0.51% │ 69.73% │ 240.00     │ rsiDivergency5m │
// │ 1005 │ WLDUSDT      │ 2024 07 02 21:05:00 │ 2024 07 02 22:10:00 │ LONG         │ -0.51% │ 69.22% │ 2.21       │ rsiDivergency5m │
// │ 1006 │ WLDUSDT      │ 2024 07 02 22:15:00 │ 2024 07 03 05:40:00 │ LONG         │ 2.49%  │ 71.71% │ 2.17       │ rsiDivergency5m │
// │ 1007 │ INJUSDT      │ 2024 07 03 06:35:00 │ 2024 07 03 08:05:00 │ LONG         │ -0.51% │ 71.20% │ 21.48      │ rsiDivergency5m │
// │ 1008 │ WLDUSDT      │ 2024 07 03 08:45:00 │ 2024 07 03 08:50:00 │ SHORT        │ -0.51% │ 70.68% │ 2.50       │ rsiDivergency5m │
// │ 1009 │ MYROUSDT     │ 2024 07 03 10:05:00 │ 2024 07 03 13:45:00 │ LONG         │ -0.51% │ 70.17% │ 0.12       │ rsiDivergency5m │
// │ 1010 │ 1000BONKUSDT │ 2024 07 03 14:10:00 │ 2024 07 03 22:30:00 │ LONG         │ 0.59%  │ 70.76% │ 0.02       │ rsiDivergency5m │
// │ 1011 │ WLDUSDT      │ 2024 07 03 23:40:00 │ 2024 07 04 00:30:00 │ SHORT        │ -0.51% │ 70.25% │ 2.33       │ rsiDivergency5m │
// │ 1012 │ MINAUSDT     │ 2024 07 04 01:55:00 │ 2024 07 04 03:40:00 │ LONG         │ -0.51% │ 69.73% │ 0.48       │ rsiDivergency5m │
// │ 1013 │ ROSEUSDT     │ 2024 07 04 05:20:00 │ 2024 07 04 08:00:00 │ LONG         │ -0.51% │ 69.22% │ 0.09       │ rsiDivergency5m │
// │ 1014 │ LRCUSDT      │ 2024 07 04 08:05:00 │ 2024 07 04 16:25:00 │ LONG         │ 0.29%  │ 69.52% │ 0.15       │ rsiDivergency5m │
// │ 1015 │ FRONTUSDT    │ 2024 07 04 17:00:00 │ 2024 07 04 21:55:00 │ SHORT        │ 2.49%  │ 72.00% │ 0.82       │ rsiDivergency5m │
// │ 1016 │ UMAUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 71.49% │ 1.76       │ rsiDivergency5m │
// │ 1017 │ LSKUSDT      │ 2024 07 04 22:10:00 │ 2024 07 05 06:30:00 │ LONG         │ 1.79%  │ 73.28% │ 0.74       │ rsiDivergency5m │
// │ 1018 │ BONDUSDT     │ 2024 07 05 06:35:00 │ 2024 07 05 07:05:00 │ SHORT        │ -0.51% │ 72.77% │ 2.12       │ rsiDivergency5m │
// │ 1019 │ TUSDT        │ 2024 07 05 07:25:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.51% │ 72.26% │ 0.02       │ rsiDivergency5m │
// │ 1020 │ 1000BONKUSDT │ 2024 07 05 10:10:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.51% │ 71.74% │ 0.02       │ rsiDivergency5m │
// │ 1021 │ LOOMUSDT     │ 2024 07 05 11:30:00 │ 2024 07 05 19:40:00 │ SHORT        │ -0.51% │ 71.23% │ 0.05       │ rsiDivergency5m │
// │ 1022 │ SKLUSDT      │ 2024 07 05 19:45:00 │ 2024 07 06 04:05:00 │ SHORT        │ 0.87%  │ 72.10% │ 0.04       │ rsiDivergency5m │
// │ 1023 │ HIGHUSDT     │ 2024 07 06 11:25:00 │ 2024 07 06 14:15:00 │ SHORT        │ -0.51% │ 71.59% │ 1.54       │ rsiDivergency5m │
// │ 1024 │ REZUSDT      │ 2024 07 06 14:50:00 │ 2024 07 06 16:00:00 │ SHORT        │ -0.51% │ 71.07% │ 0.06       │ rsiDivergency5m │
// │ 1025 │ REZUSDT      │ 2024 07 06 16:05:00 │ 2024 07 07 00:25:00 │ SHORT        │ 0.41%  │ 71.48% │ 0.06       │ rsiDivergency5m │
// │ 1026 │ SAGAUSDT     │ 2024 07 07 03:20:00 │ 2024 07 07 03:45:00 │ SHORT        │ -0.51% │ 70.97% │ 1.17       │ rsiDivergency5m │
// │ 1027 │ SAGAUSDT     │ 2024 07 07 03:55:00 │ 2024 07 07 04:55:00 │ SHORT        │ -0.51% │ 70.45% │ 1.20       │ rsiDivergency5m │
// │ 1028 │ PORTALUSDT   │ 2024 07 07 05:05:00 │ 2024 07 07 05:30:00 │ SHORT        │ -0.51% │ 69.94% │ 0.37       │ rsiDivergency5m │
// │ 1029 │ SAGAUSDT     │ 2024 07 07 07:10:00 │ 2024 07 07 07:20:00 │ SHORT        │ -0.51% │ 69.43% │ 1.32       │ rsiDivergency5m │
// │ 1030 │ 1000SHIBUSDT │ 2024 07 07 08:40:00 │ 2024 07 07 17:00:00 │ LONG         │ 0.05%  │ 69.48% │ 0.02       │ rsiDivergency5m │
// │ 1031 │ REZUSDT      │ 2024 07 07 18:00:00 │ 2024 07 07 19:35:00 │ LONG         │ -0.51% │ 68.97% │ 0.06       │ rsiDivergency5m │
// │ 1032 │ ARBUSDT      │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.51% │ 68.45% │ 0.62       │ rsiDivergency5m │
// │ 1033 │ ARBUSDT      │ 2024 07 07 20:15:00 │ 2024 07 08 03:50:00 │ LONG         │ 2.49%  │ 70.94% │ 0.61       │ rsiDivergency5m │
// │ 1034 │ ACEUSDT      │ 2024 07 08 03:55:00 │ 2024 07 08 04:30:00 │ SHORT        │ -0.51% │ 70.43% │ 2.91       │ rsiDivergency5m │
// │ 1035 │ BIGTIMEUSDT  │ 2024 07 08 04:35:00 │ 2024 07 08 12:55:00 │ SHORT        │ 0.99%  │ 71.42% │ 0.10       │ rsiDivergency5m │
// │ 1036 │ TAOUSDT      │ 2024 07 09 06:00:00 │ 2024 07 09 09:05:00 │ SHORT        │ -0.51% │ 70.90% │ 251.82     │ rsiDivergency5m │
// │ 1037 │ STGUSDT      │ 2024 07 09 12:00:00 │ 2024 07 09 13:30:00 │ SHORT        │ -0.51% │ 70.39% │ 0.37       │ rsiDivergency5m │
// │ 1038 │ 1000SATSUSDT │ 2024 07 09 20:35:00 │ 2024 07 09 23:05:00 │ SHORT        │ -0.51% │ 69.88% │ 0.00       │ rsiDivergency5m │
// │ 1039 │ FTMUSDT      │ 2024 07 10 03:50:00 │ 2024 07 10 06:25:00 │ LONG         │ -0.51% │ 69.37% │ 0.47       │ rsiDivergency5m │
// │ 1040 │ WLDUSDT      │ 2024 07 10 09:55:00 │ 2024 07 10 10:40:00 │ SHORT        │ -0.51% │ 68.85% │ 2.01       │ rsiDivergency5m │
// │ 1041 │ ETHFIUSDT    │ 2024 07 10 11:20:00 │ 2024 07 10 19:40:00 │ SHORT        │ 1.49%  │ 70.35% │ 2.36       │ rsiDivergency5m │
// │ 1042 │ 1000SATSUSDT │ 2024 07 10 21:00:00 │ 2024 07 10 21:10:00 │ SHORT        │ -0.51% │ 69.83% │ 0.00       │ rsiDivergency5m │
// │ 1043 │ STXUSDT      │ 2024 07 11 03:00:00 │ 2024 07 11 06:50:00 │ SHORT        │ -0.51% │ 69.32% │ 1.65       │ rsiDivergency5m │
// │ 1044 │ 1000BONKUSDT │ 2024 07 11 13:10:00 │ 2024 07 11 15:10:00 │ LONG         │ -0.51% │ 68.81% │ 0.02       │ rsiDivergency5m │
// │ 1045 │ RNDRUSDT     │ 2024 07 11 15:15:00 │ 2024 07 11 20:20:00 │ LONG         │ -0.51% │ 68.30% │ 6.00       │ rsiDivergency5m │
// │ 1046 │ ENAUSDT      │ 2024 07 11 20:25:00 │ 2024 07 12 04:45:00 │ LONG         │ -0.33% │ 67.97% │ 0.38       │ rsiDivergency5m │
// │ 1047 │ 1000BONKUSDT │ 2024 07 12 05:10:00 │ 2024 07 12 13:30:00 │ LONG         │ 0.18%  │ 68.15% │ 0.02       │ rsiDivergency5m │
// │ 1048 │ CKBUSDT      │ 2024 07 12 13:40:00 │ 2024 07 12 22:00:00 │ SHORT        │ 0.57%  │ 68.71% │ 0.01       │ rsiDivergency5m │
// │ 1049 │ SAGAUSDT     │ 2024 07 12 23:15:00 │ 2024 07 13 07:35:00 │ SHORT        │ 1.32%  │ 70.03% │ 1.39       │ rsiDivergency5m │
// └──────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴────────┴────────────┴─────────────────┘