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
// Data for 270.8 days from 2023 10 15 21:30:00 to 2024 07 12 16:50:00
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
// │ 0 │ 2.00% │ 10.00% │ 100            │ 7974      │ 0.12% │ 39.58%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬──────────┬────────────────────┬──────────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ drawdown │ drawdownMonteCarlo │ badRunMonteCarlo │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼──────────┼────────────────────┼──────────────────┼─────────┼───────────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 1077      │ 111.64%   │ -6.76%    │ 95.04% │ 16.66%   │ 21.79%             │ 12               │ 36.95%  │ 50.74         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴──────────┴────────────────────┴──────────────────┴─────────┴───────────────┘
// ┌──────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬─────────┬────────────┬─────────────────┐
// │      │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl  │ entryPrice │ stgName         │
// ├──────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼─────────┼────────────┼─────────────────┤
// │    0 │ HFTUSDT      │ 2023 10 17 08:50:00 │ 2023 10 17 17:05:00 │ LONG         │ -0.51% │ -1.10%  │ 0.25       │ rsiDivergency5m │
// │    1 │ AMBUSDT      │ 2023 10 18 08:45:00 │ 2023 10 18 17:05:00 │ LONG         │ 0.11%  │ -3.68%  │ 0.01       │ rsiDivergency5m │
// │    2 │ KNCUSDT      │ 2023 10 19 11:40:00 │ 2023 10 19 19:05:00 │ LONG         │ -0.51% │ -6.76%  │ 0.63       │ rsiDivergency5m │
// │    3 │ XRPUSDT      │ 2023 10 19 19:05:00 │ 2023 10 20 03:25:00 │ SHORT        │ 0.63%  │ -6.13%  │ 0.53       │ rsiDivergency5m │
// │    4 │ ICXUSDT      │ 2023 10 21 03:35:00 │ 2023 10 21 07:55:00 │ SHORT        │ -0.51% │ -3.23%  │ 0.21       │ rsiDivergency5m │
// │    5 │ FTMUSDT      │ 2023 10 21 12:40:00 │ 2023 10 21 21:00:00 │ SHORT        │ 0.64%  │ -3.09%  │ 0.21       │ rsiDivergency5m │
// │    6 │ FTMUSDT      │ 2023 10 22 22:50:00 │ 2023 10 22 23:15:00 │ SHORT        │ -0.51% │ -3.22%  │ 0.22       │ rsiDivergency5m │
// │    7 │ FTMUSDT      │ 2023 10 22 23:20:00 │ 2023 10 23 07:40:00 │ SHORT        │ 0.35%  │ -2.87%  │ 0.23       │ rsiDivergency5m │
// │    8 │ LQTYUSDT     │ 2023 10 23 09:55:00 │ 2023 10 23 17:50:00 │ SHORT        │ -0.51% │ -3.38%  │ 1.51       │ rsiDivergency5m │
// │    9 │ WLDUSDT      │ 2023 10 23 18:30:00 │ 2023 10 23 18:55:00 │ SHORT        │ -0.51% │ -3.90%  │ 1.63       │ rsiDivergency5m │
// │   10 │ MAVUSDT      │ 2023 10 23 19:35:00 │ 2023 10 23 21:25:00 │ SHORT        │ -0.51% │ -4.41%  │ 0.24       │ rsiDivergency5m │
// │   11 │ LINAUSDT     │ 2023 10 24 07:15:00 │ 2023 10 24 07:40:00 │ SHORT        │ -0.51% │ -3.93%  │ 0.01       │ rsiDivergency5m │
// │   12 │ COTIUSDT     │ 2023 10 24 07:45:00 │ 2023 10 24 16:05:00 │ SHORT        │ 1.08%  │ -2.85%  │ 0.04       │ rsiDivergency5m │
// │   13 │ DYDXUSDT     │ 2023 10 25 02:50:00 │ 2023 10 25 11:10:00 │ LONG         │ 1.25%  │ -1.05%  │ 2.26       │ rsiDivergency5m │
// │   14 │ GMXUSDT      │ 2023 10 25 23:00:00 │ 2023 10 26 07:20:00 │ SHORT        │ 0.84%  │ 0.50%   │ 45.76      │ rsiDivergency5m │
// │   15 │ HIGHUSDT     │ 2023 10 26 09:40:00 │ 2023 10 26 18:00:00 │ LONG         │ 0.67%  │ 0.65%   │ 1.21       │ rsiDivergency5m │
// │   16 │ NEOUSDT      │ 2023 10 26 17:00:00 │ 2023 10 26 22:00:00 │ SHORT        │ -0.51% │ 0.14%   │ 8.23       │ rsiDivergency5m │
// │   17 │ CFXUSDT      │ 2023 10 27 04:30:00 │ 2023 10 27 12:50:00 │ SHORT        │ 1.77%  │ 1.92%   │ 0.16       │ rsiDivergency5m │
// │   18 │ GASUSDT      │ 2023 10 27 09:35:00 │ 2023 10 27 16:10:00 │ LONG         │ 2.49%  │ 0.95%   │ 3.12       │ rsiDivergency5m │
// │   19 │ HIFIUSDT     │ 2023 10 28 20:15:00 │ 2023 10 29 04:35:00 │ SHORT        │ 0.47%  │ 5.72%   │ 0.69       │ rsiDivergency5m │
// │   20 │ POLYXUSDT    │ 2023 10 29 04:20:00 │ 2023 10 29 07:25:00 │ SHORT        │ -0.51% │ -4.19%  │ 0.29       │ rsiDivergency5m │
// │   21 │ GALAUSDT     │ 2023 10 29 12:40:00 │ 2023 10 29 13:10:00 │ SHORT        │ -0.51% │ 10.19%  │ 0.02       │ rsiDivergency5m │
// │   22 │ GASUSDT      │ 2023 10 29 17:15:00 │ 2023 10 29 18:05:00 │ SHORT        │ -0.51% │ -6.24%  │ 4.97       │ rsiDivergency5m │
// │   23 │ SKLUSDT      │ 2023 10 30 07:30:00 │ 2023 10 30 15:50:00 │ SHORT        │ 0.61%  │ 14.60%  │ 0.03       │ rsiDivergency5m │
// │   24 │ HIFIUSDT     │ 2023 10 31 08:55:00 │ 2023 10 31 10:10:00 │ LONG         │ -0.51% │ 15.55%  │ 0.62       │ rsiDivergency5m │
// │   25 │ WAXPUSDT     │ 2023 10 31 10:20:00 │ 2023 10 31 18:40:00 │ LONG         │ 2.21%  │ 4.55%   │ 0.06       │ rsiDivergency5m │
// │   26 │ BIGTIMEUSDT  │ 2023 10 31 10:25:00 │ 2023 10 31 10:40:00 │ LONG         │ -0.51% │ 15.03%  │ 0.17       │ rsiDivergency5m │
// │   27 │ LEVERUSDT    │ 2023 10 31 10:25:00 │ 2023 10 31 18:45:00 │ LONG         │ 0.35%  │ 15.38%  │ 0.00       │ rsiDivergency5m │
// │   28 │ ICXUSDT      │ 2023 10 31 18:50:00 │ 2023 11 01 03:10:00 │ SHORT        │ 0.68%  │ 16.06%  │ 0.22       │ rsiDivergency5m │
// │   29 │ HFTUSDT      │ 2023 11 01 13:55:00 │ 2023 11 01 14:20:00 │ SHORT        │ -0.51% │ 14.53%  │ 0.28       │ rsiDivergency5m │
// │   30 │ FTMUSDT      │ 2023 11 01 14:30:00 │ 2023 11 01 20:15:00 │ SHORT        │ -0.51% │ 13.50%  │ 0.25       │ rsiDivergency5m │
// │   31 │ HFTUSDT      │ 2023 11 01 14:30:00 │ 2023 11 01 15:15:00 │ SHORT        │ -0.51% │ 14.01%  │ 0.28       │ rsiDivergency5m │
// │   32 │ GMTUSDT      │ 2023 11 01 21:00:00 │ 2023 11 02 05:20:00 │ SHORT        │ 0.83%  │ 14.33%  │ 0.20       │ rsiDivergency5m │
// │   33 │ FETUSDT      │ 2023 11 02 10:30:00 │ 2023 11 02 18:50:00 │ LONG         │ 0.40%  │ 14.22%  │ 0.34       │ rsiDivergency5m │
// │   34 │ NEOUSDT      │ 2023 11 02 20:40:00 │ 2023 11 03 05:00:00 │ LONG         │ 0.88%  │ 14.58%  │ 9.10       │ rsiDivergency5m │
// │   35 │ GMTUSDT      │ 2023 11 04 02:45:00 │ 2023 11 04 11:05:00 │ SHORT        │ 0.87%  │ 17.90%  │ 0.20       │ rsiDivergency5m │
// │   36 │ CAKEUSDT     │ 2023 11 04 02:55:00 │ 2023 11 04 03:00:00 │ SHORT        │ -0.51% │ -1.61%  │ 1.80       │ rsiDivergency5m │
// │   37 │ CAKEUSDT     │ 2023 11 04 03:55:00 │ 2023 11 04 05:05:00 │ SHORT        │ -0.51% │ -2.13%  │ 1.87       │ rsiDivergency5m │
// │   38 │ CAKEUSDT     │ 2023 11 04 05:15:00 │ 2023 11 04 13:35:00 │ SHORT        │ 0.39%  │ -1.74%  │ 1.93       │ rsiDivergency5m │
// │   39 │ NEOUSDT      │ 2023 11 05 06:50:00 │ 2023 11 05 07:00:00 │ SHORT        │ -0.51% │ 16.05%  │ 13.65      │ rsiDivergency5m │
// │   40 │ LRCUSDT      │ 2023 11 05 07:35:00 │ 2023 11 05 15:55:00 │ SHORT        │ 1.23%  │ 17.28%  │ 0.23       │ rsiDivergency5m │
// │   41 │ SSVUSDT      │ 2023 11 05 21:10:00 │ 2023 11 05 21:50:00 │ SHORT        │ -0.51% │ 16.77%  │ 16.08      │ rsiDivergency5m │
// │   42 │ SSVUSDT      │ 2023 11 05 22:00:00 │ 2023 11 06 06:20:00 │ SHORT        │ 0.60%  │ 17.37%  │ 16.36      │ rsiDivergency5m │
// │   43 │ INJUSDT      │ 2023 11 06 06:35:00 │ 2023 11 06 06:50:00 │ SHORT        │ -0.51% │ 16.85%  │ 17.51      │ rsiDivergency5m │
// │   44 │ INJUSDT      │ 2023 11 06 06:55:00 │ 2023 11 06 15:15:00 │ SHORT        │ 0.78%  │ 17.63%  │ 17.74      │ rsiDivergency5m │
// │   45 │ DODOXUSDT    │ 2023 11 07 12:05:00 │ 2023 11 07 20:25:00 │ LONG         │ 0.80%  │ 16.91%  │ 0.12       │ rsiDivergency5m │
// │   46 │ ORDIUSDT     │ 2023 11 08 07:25:00 │ 2023 11 08 07:35:00 │ LONG         │ -0.51% │ -1.03%  │ 12.31      │ rsiDivergency5m │
// │   47 │ SUIUSDT      │ 2023 11 08 19:20:00 │ 2023 11 09 03:40:00 │ LONG         │ 0.79%  │ 18.08%  │ 0.57       │ rsiDivergency5m │
// │   48 │ MINAUSDT     │ 2023 11 09 04:10:00 │ 2023 11 09 09:00:00 │ LONG         │ -0.51% │ 17.57%  │ 0.69       │ rsiDivergency5m │
// │   49 │ COMPUSDT     │ 2023 11 09 10:45:00 │ 2023 11 09 11:10:00 │ SHORT        │ 2.49%  │ 19.55%  │ 57.62      │ rsiDivergency5m │
// │   50 │ STGUSDT      │ 2023 11 09 20:45:00 │ 2023 11 10 01:00:00 │ SHORT        │ -0.51% │ 19.03%  │ 0.57       │ rsiDivergency5m │
// │   51 │ SUIUSDT      │ 2023 11 10 03:15:00 │ 2023 11 10 11:35:00 │ LONG         │ 0.16%  │ 19.19%  │ 0.54       │ rsiDivergency5m │
// │   52 │ YFIUSDT      │ 2023 11 11 01:25:00 │ 2023 11 11 08:40:00 │ SHORT        │ -0.51% │ 19.12%  │ 8756.00    │ rsiDivergency5m │
// │   53 │ WLDUSDT      │ 2023 11 11 11:05:00 │ 2023 11 11 19:15:00 │ LONG         │ -0.51% │ 18.60%  │ 1.94       │ rsiDivergency5m │
// │   54 │ MAVUSDT      │ 2023 11 11 19:40:00 │ 2023 11 12 04:00:00 │ LONG         │ 1.59%  │ 20.20%  │ 0.26       │ rsiDivergency5m │
// │   55 │ HOOKUSDT     │ 2023 11 12 03:40:00 │ 2023 11 12 05:40:00 │ SHORT        │ -0.51% │ 19.68%  │ 0.99       │ rsiDivergency5m │
// │   56 │ LINAUSDT     │ 2023 11 13 04:10:00 │ 2023 11 13 07:30:00 │ SHORT        │ -0.51% │ 20.95%  │ 0.01       │ rsiDivergency5m │
// │   57 │ ICXUSDT      │ 2023 11 13 09:45:00 │ 2023 11 13 16:10:00 │ LONG         │ -0.51% │ 19.42%  │ 0.28       │ rsiDivergency5m │
// │   58 │ BONDUSDT     │ 2023 11 13 10:15:00 │ 2023 11 13 10:40:00 │ SHORT        │ -0.51% │ 19.93%  │ 4.60       │ rsiDivergency5m │
// │   59 │ ONEUSDT      │ 2023 11 13 16:35:00 │ 2023 11 13 17:55:00 │ LONG         │ -0.51% │ 18.90%  │ 0.01       │ rsiDivergency5m │
// │   60 │ GASUSDT      │ 2023 11 13 19:15:00 │ 2023 11 13 22:10:00 │ LONG         │ 2.49%  │ 16.56%  │ 7.92       │ rsiDivergency5m │
// │   61 │ YGGUSDT      │ 2023 11 13 19:25:00 │ 2023 11 14 00:20:00 │ LONG         │ 2.49%  │ 21.39%  │ 0.37       │ rsiDivergency5m │
// │   62 │ HOOKUSDT     │ 2023 11 14 01:00:00 │ 2023 11 14 09:20:00 │ SHORT        │ 0.90%  │ 21.78%  │ 1.02       │ rsiDivergency5m │
// │   63 │ MAVUSDT      │ 2023 11 14 22:50:00 │ 2023 11 14 23:25:00 │ SHORT        │ -0.51% │ 20.76%  │ 0.29       │ rsiDivergency5m │
// │   64 │ IMXUSDT      │ 2023 11 15 09:10:00 │ 2023 11 15 17:30:00 │ SHORT        │ 0.13%  │ 20.83%  │ 1.21       │ rsiDivergency5m │
// │   65 │ YFIUSDT      │ 2023 11 16 06:25:00 │ 2023 11 16 09:50:00 │ SHORT        │ -0.51% │ 22.29%  │ 14363.00   │ rsiDivergency5m │
// │   66 │ HOOKUSDT     │ 2023 11 16 13:50:00 │ 2023 11 16 14:20:00 │ LONG         │ -0.51% │ 21.78%  │ 0.97       │ rsiDivergency5m │
// │   67 │ HIGHUSDT     │ 2023 11 16 14:35:00 │ 2023 11 16 22:55:00 │ LONG         │ 0.84%  │ 22.62%  │ 1.38       │ rsiDivergency5m │
// │   68 │ WLDUSDT      │ 2023 11 17 05:25:00 │ 2023 11 17 13:45:00 │ LONG         │ 0.66%  │ 22.77%  │ 1.99       │ rsiDivergency5m │
// │   69 │ ALPHAUSDT    │ 2023 11 17 13:40:00 │ 2023 11 17 22:00:00 │ SHORT        │ 0.01%  │ 22.78%  │ 0.09       │ rsiDivergency5m │
// │   70 │ TRUUSDT      │ 2023 11 17 22:55:00 │ 2023 11 18 00:15:00 │ LONG         │ -0.51% │ 22.26%  │ 0.05       │ rsiDivergency5m │
// │   71 │ CKBUSDT      │ 2023 11 18 00:20:00 │ 2023 11 18 01:55:00 │ LONG         │ -0.51% │ 21.75%  │ 0.00       │ rsiDivergency5m │
// │   72 │ TOKENUSDT    │ 2023 11 18 02:05:00 │ 2023 11 18 10:25:00 │ LONG         │ 1.82%  │ 13.98%  │ 0.03       │ rsiDivergency5m │
// │   73 │ FETUSDT      │ 2023 11 18 10:15:00 │ 2023 11 18 10:45:00 │ SHORT        │ -0.51% │ 23.21%  │ 0.45       │ rsiDivergency5m │
// │   74 │ RNDRUSDT     │ 2023 11 18 11:15:00 │ 2023 11 18 19:35:00 │ SHORT        │ 0.51%  │ 23.73%  │ 3.48       │ rsiDivergency5m │
// │   75 │ DOGEUSDT     │ 2023 11 18 20:35:00 │ 2023 11 19 04:55:00 │ LONG         │ 0.46%  │ 24.18%  │ 0.08       │ rsiDivergency5m │
// │   76 │ ARUSDT       │ 2023 11 19 11:55:00 │ 2023 11 19 13:15:00 │ SHORT        │ -0.51% │ 26.16%  │ 8.91       │ rsiDivergency5m │
// │   77 │ SKLUSDT      │ 2023 11 19 13:40:00 │ 2023 11 19 14:00:00 │ SHORT        │ -0.51% │ 25.65%  │ 0.04       │ rsiDivergency5m │
// │   78 │ SNXUSDT      │ 2023 11 19 14:20:00 │ 2023 11 19 15:15:00 │ SHORT        │ -0.51% │ 25.13%  │ 3.35       │ rsiDivergency5m │
// │   79 │ FETUSDT      │ 2023 11 19 22:30:00 │ 2023 11 20 02:30:00 │ SHORT        │ -0.51% │ 24.62%  │ 0.54       │ rsiDivergency5m │
// │   80 │ ARPAUSDT     │ 2023 11 21 01:05:00 │ 2023 11 21 02:40:00 │ LONG         │ -0.51% │ 24.40%  │ 0.05       │ rsiDivergency5m │
// │   81 │ NTRNUSDT     │ 2023 11 21 10:15:00 │ 2023 11 21 12:45:00 │ LONG         │ -0.51% │ -2.71%  │ 0.43       │ rsiDivergency5m │
// │   82 │ RIFUSDT      │ 2023 11 21 13:10:00 │ 2023 11 21 17:55:00 │ LONG         │ -0.51% │ 21.27%  │ 0.09       │ rsiDivergency5m │
// │   83 │ ENSUSDT      │ 2023 11 21 18:00:00 │ 2023 11 22 02:20:00 │ LONG         │ 0.94%  │ 28.08%  │ 7.80       │ rsiDivergency5m │
// │   84 │ SKLUSDT      │ 2023 11 22 02:00:00 │ 2023 11 22 10:20:00 │ SHORT        │ 1.58%  │ 29.66%  │ 0.06       │ rsiDivergency5m │
// │   85 │ INJUSDT      │ 2023 11 22 16:10:00 │ 2023 11 23 00:30:00 │ SHORT        │ 0.74%  │ 29.89%  │ 16.48      │ rsiDivergency5m │
// │   86 │ SPELLUSDT    │ 2023 11 23 14:40:00 │ 2023 11 23 14:50:00 │ SHORT        │ -0.51% │ 28.87%  │ 0.00       │ rsiDivergency5m │
// │   87 │ SPELLUSDT    │ 2023 11 23 14:55:00 │ 2023 11 23 15:15:00 │ SHORT        │ -0.51% │ 28.36%  │ 0.00       │ rsiDivergency5m │
// │   88 │ SPELLUSDT    │ 2023 11 23 15:20:00 │ 2023 11 23 15:30:00 │ SHORT        │ -0.51% │ 27.84%  │ 0.00       │ rsiDivergency5m │
// │   89 │ SPELLUSDT    │ 2023 11 23 15:40:00 │ 2023 11 23 15:50:00 │ SHORT        │ -0.51% │ 27.33%  │ 0.00       │ rsiDivergency5m │
// │   90 │ SPELLUSDT    │ 2023 11 23 15:55:00 │ 2023 11 23 23:15:00 │ SHORT        │ -0.51% │ 26.82%  │ 0.00       │ rsiDivergency5m │
// │   91 │ GASUSDT      │ 2023 11 23 19:40:00 │ 2023 11 23 19:50:00 │ SHORT        │ -0.51% │ 20.44%  │ 9.12       │ rsiDivergency5m │
// │   92 │ FETUSDT      │ 2023 11 24 00:50:00 │ 2023 11 24 03:10:00 │ SHORT        │ -0.51% │ 26.31%  │ 0.54       │ rsiDivergency5m │
// │   93 │ FRONTUSDT    │ 2023 11 24 21:35:00 │ 2023 11 25 05:55:00 │ SHORT        │ 0.22%  │ 24.48%  │ 0.35       │ rsiDivergency5m │
// │   94 │ KLAYUSDT     │ 2023 11 25 21:00:00 │ 2023 11 26 05:20:00 │ LONG         │ -0.46% │ 23.28%  │ 0.22       │ rsiDivergency5m │
// │   95 │ HIGHUSDT     │ 2023 11 26 05:45:00 │ 2023 11 26 11:25:00 │ SHORT        │ 2.49%  │ 25.77%  │ 1.59       │ rsiDivergency5m │
// │   96 │ ORDIUSDT     │ 2023 11 26 13:00:00 │ 2023 11 26 13:25:00 │ LONG         │ -0.51% │ 17.03%  │ 19.82      │ rsiDivergency5m │
// │   97 │ GMTUSDT      │ 2023 11 26 22:20:00 │ 2023 11 26 22:35:00 │ LONG         │ -0.51% │ 25.72%  │ 0.30       │ rsiDivergency5m │
// │   98 │ ALICEUSDT    │ 2023 11 26 22:35:00 │ 2023 11 27 00:45:00 │ LONG         │ -0.51% │ 25.21%  │ 1.20       │ rsiDivergency5m │
// │   99 │ BIGTIMEUSDT  │ 2023 11 27 09:55:00 │ 2023 11 27 18:15:00 │ LONG         │ 2.21%  │ 25.89%  │ 0.20       │ rsiDivergency5m │
// │  100 │ BEAMXUSDT    │ 2023 11 27 13:30:00 │ 2023 11 27 21:50:00 │ LONG         │ 0.70%  │ -0.34%  │ 0.01       │ rsiDivergency5m │
// │  101 │ BIGTIMEUSDT  │ 2023 11 28 00:10:00 │ 2023 11 28 02:15:00 │ LONG         │ -0.51% │ 25.37%  │ 0.20       │ rsiDivergency5m │
// │  102 │ ONGUSDT      │ 2023 11 29 07:30:00 │ 2023 11 29 07:40:00 │ LONG         │ -0.51% │ -1.54%  │ 0.43       │ rsiDivergency5m │
// │  103 │ STXUSDT      │ 2023 11 29 20:10:00 │ 2023 11 30 04:30:00 │ LONG         │ -0.23% │ 23.29%  │ 0.70       │ rsiDivergency5m │
// │  104 │ BIGTIMEUSDT  │ 2023 12 01 12:30:00 │ 2023 12 01 13:00:00 │ SHORT        │ -0.51% │ 22.57%  │ 0.27       │ rsiDivergency5m │
// │  105 │ BIGTIMEUSDT  │ 2023 12 01 13:10:00 │ 2023 12 01 13:25:00 │ SHORT        │ -0.51% │ 22.05%  │ 0.28       │ rsiDivergency5m │
// │  106 │ BIGTIMEUSDT  │ 2023 12 01 13:35:00 │ 2023 12 01 14:45:00 │ SHORT        │ -0.51% │ 21.54%  │ 0.28       │ rsiDivergency5m │
// │  107 │ NTRNUSDT     │ 2023 12 02 09:05:00 │ 2023 12 02 09:40:00 │ SHORT        │ -0.51% │ 13.70%  │ 0.57       │ rsiDivergency5m │
// │  108 │ 1000LUNCUSDT │ 2023 12 03 01:05:00 │ 2023 12 03 04:05:00 │ SHORT        │ -0.51% │ 22.71%  │ 0.16       │ rsiDivergency5m │
// │  109 │ SUPERUSDT    │ 2023 12 03 12:30:00 │ 2023 12 03 13:00:00 │ SHORT        │ -0.51% │ -2.20%  │ 0.45       │ rsiDivergency5m │
// │  110 │ PENDLEUSDT   │ 2023 12 03 23:55:00 │ 2023 12 04 01:15:00 │ SHORT        │ -0.51% │ 24.28%  │ 1.27       │ rsiDivergency5m │
// │  111 │ PENDLEUSDT   │ 2023 12 04 01:50:00 │ 2023 12 04 02:15:00 │ SHORT        │ -0.51% │ 23.77%  │ 1.34       │ rsiDivergency5m │
// │  112 │ SSVUSDT      │ 2023 12 04 06:00:00 │ 2023 12 04 06:10:00 │ LONG         │ -0.51% │ 23.26%  │ 26.78      │ rsiDivergency5m │
// │  113 │ ONGUSDT      │ 2023 12 04 09:10:00 │ 2023 12 04 17:30:00 │ LONG         │ 0.40%  │ -2.69%  │ 0.39       │ rsiDivergency5m │
// │  114 │ IOSTUSDT     │ 2023 12 04 23:40:00 │ 2023 12 05 00:30:00 │ SHORT        │ -0.51% │ 23.79%  │ 0.01       │ rsiDivergency5m │
// │  115 │ STXUSDT      │ 2023 12 05 10:40:00 │ 2023 12 05 19:00:00 │ SHORT        │ 1.39%  │ 27.14%  │ 1.24       │ rsiDivergency5m │
// │  116 │ FRONTUSDT    │ 2023 12 05 20:05:00 │ 2023 12 06 04:25:00 │ SHORT        │ 1.46%  │ 28.60%  │ 0.38       │ rsiDivergency5m │
// │  117 │ BONDUSDT     │ 2023 12 06 06:25:00 │ 2023 12 06 06:35:00 │ LONG         │ -0.51% │ 28.09%  │ 3.65       │ rsiDivergency5m │
// │  118 │ HIFIUSDT     │ 2023 12 06 06:40:00 │ 2023 12 06 12:20:00 │ LONG         │ 2.49%  │ 30.58%  │ 0.74       │ rsiDivergency5m │
// │  119 │ 1000BONKUSDT │ 2023 12 06 09:55:00 │ 2023 12 06 11:00:00 │ LONG         │ 2.49%  │ 8.21%   │ 0.01       │ rsiDivergency5m │
// │  120 │ NKNUSDT      │ 2023 12 06 12:20:00 │ 2023 12 06 20:40:00 │ SHORT        │ 1.50%  │ 32.08%  │ 0.12       │ rsiDivergency5m │
// │  121 │ 1000BONKUSDT │ 2023 12 07 01:05:00 │ 2023 12 07 01:10:00 │ SHORT        │ -0.51% │ 12.16%  │ 0.01       │ rsiDivergency5m │
// │  122 │ XVSUSDT      │ 2023 12 07 23:45:00 │ 2023 12 07 23:50:00 │ LONG         │ -0.51% │ 36.48%  │ 10.30      │ rsiDivergency5m │
// │  123 │ TOKENUSDT    │ 2023 12 08 09:55:00 │ 2023 12 08 14:50:00 │ LONG         │ 2.49%  │ 26.67%  │ 0.05       │ rsiDivergency5m │
// │  124 │ ADAUSDT      │ 2023 12 08 10:50:00 │ 2023 12 08 11:00:00 │ SHORT        │ -0.51% │ 35.96%  │ 0.55       │ rsiDivergency5m │
// │  125 │ BIGTIMEUSDT  │ 2023 12 08 19:55:00 │ 2023 12 09 04:15:00 │ SHORT        │ 1.41%  │ 36.34%  │ 0.65       │ rsiDivergency5m │
// │  126 │ CELRUSDT     │ 2023 12 09 03:25:00 │ 2023 12 09 11:45:00 │ SHORT        │ 0.55%  │ 36.89%  │ 0.02       │ rsiDivergency5m │
// │  127 │ HOTUSDT      │ 2023 12 10 03:00:00 │ 2023 12 10 11:20:00 │ SHORT        │ 0.80%  │ 38.89%  │ 0.00       │ rsiDivergency5m │
// │  128 │ INJUSDT      │ 2023 12 10 16:00:00 │ 2023 12 10 18:40:00 │ SHORT        │ -0.51% │ 38.37%  │ 20.89      │ rsiDivergency5m │
// │  129 │ INJUSDT      │ 2023 12 10 18:50:00 │ 2023 12 10 21:10:00 │ SHORT        │ 2.49%  │ 40.86%  │ 21.35      │ rsiDivergency5m │
// │  130 │ PENDLEUSDT   │ 2023 12 10 22:00:00 │ 2023 12 11 00:45:00 │ LONG         │ -0.51% │ 40.35%  │ 1.14       │ rsiDivergency5m │
// │  131 │ WLDUSDT      │ 2023 12 11 01:20:00 │ 2023 12 11 09:40:00 │ LONG         │ -0.22% │ 40.13%  │ 2.47       │ rsiDivergency5m │
// │  132 │ YFIUSDT      │ 2023 12 11 09:30:00 │ 2023 12 11 13:10:00 │ LONG         │ -0.51% │ 39.62%  │ 8456.00    │ rsiDivergency5m │
// │  133 │ VETUSDT      │ 2023 12 11 13:30:00 │ 2023 12 11 21:50:00 │ LONG         │ 1.38%  │ 41.00%  │ 0.03       │ rsiDivergency5m │
// │  134 │ VETUSDT      │ 2023 12 12 00:45:00 │ 2023 12 12 01:55:00 │ SHORT        │ -0.51% │ 39.46%  │ 0.03       │ rsiDivergency5m │
// │  135 │ ALICEUSDT    │ 2023 12 12 03:55:00 │ 2023 12 12 06:05:00 │ SHORT        │ -0.51% │ 38.95%  │ 1.25       │ rsiDivergency5m │
// │  136 │ ARBUSDT      │ 2023 12 12 18:30:00 │ 2023 12 13 00:10:00 │ SHORT        │ 2.49%  │ 40.92%  │ 1.24       │ rsiDivergency5m │
// │  137 │ SUPERUSDT    │ 2023 12 12 21:25:00 │ 2023 12 12 23:05:00 │ LONG         │ -0.51% │ 15.55%  │ 0.53       │ rsiDivergency5m │
// │  138 │ ALGOUSDT     │ 2023 12 12 23:15:00 │ 2023 12 13 07:35:00 │ LONG         │ 0.34%  │ 41.26%  │ 0.19       │ rsiDivergency5m │
// │  139 │ SUPERUSDT    │ 2023 12 12 23:25:00 │ 2023 12 13 01:55:00 │ LONG         │ -0.51% │ 15.04%  │ 0.51       │ rsiDivergency5m │
// │  140 │ IOTAUSDT     │ 2023 12 13 07:40:00 │ 2023 12 13 16:00:00 │ SHORT        │ 0.02%  │ 41.28%  │ 0.28       │ rsiDivergency5m │
// │  141 │ TOKENUSDT    │ 2023 12 13 11:15:00 │ 2023 12 13 15:00:00 │ SHORT        │ -0.51% │ 25.79%  │ 0.04       │ rsiDivergency5m │
// │  142 │ HOOKUSDT     │ 2023 12 13 17:15:00 │ 2023 12 14 01:35:00 │ SHORT        │ 0.52%  │ 41.80%  │ 1.18       │ rsiDivergency5m │
// │  143 │ ORDIUSDT     │ 2023 12 13 21:25:00 │ 2023 12 14 05:45:00 │ SHORT        │ 0.26%  │ 24.66%  │ 56.67      │ rsiDivergency5m │
// │  144 │ IOTAUSDT     │ 2023 12 14 03:15:00 │ 2023 12 14 11:35:00 │ SHORT        │ 1.07%  │ 42.35%  │ 0.30       │ rsiDivergency5m │
// │  145 │ ORDIUSDT     │ 2023 12 14 07:35:00 │ 2023 12 14 08:30:00 │ SHORT        │ 2.49%  │ 27.15%  │ 61.67      │ rsiDivergency5m │
// │  146 │ NTRNUSDT     │ 2023 12 15 09:05:00 │ 2023 12 15 12:35:00 │ LONG         │ 2.49%  │ 23.32%  │ 0.96       │ rsiDivergency5m │
// │  147 │ BIGTIMEUSDT  │ 2023 12 15 09:25:00 │ 2023 12 15 09:50:00 │ LONG         │ -0.51% │ 41.96%  │ 0.65       │ rsiDivergency5m │
// │  148 │ FRONTUSDT    │ 2023 12 15 11:25:00 │ 2023 12 15 11:30:00 │ SHORT        │ -0.51% │ 41.45%  │ 0.41       │ rsiDivergency5m │
// │  149 │ INJUSDT      │ 2023 12 15 11:30:00 │ 2023 12 15 18:20:00 │ SHORT        │ 2.49%  │ 43.94%  │ 34.21      │ rsiDivergency5m │
// │  150 │ NTRNUSDT     │ 2023 12 15 13:05:00 │ 2023 12 15 20:20:00 │ SHORT        │ -0.51% │ 22.80%  │ 1.05       │ rsiDivergency5m │
// │  151 │ BEAMXUSDT    │ 2023 12 15 18:25:00 │ 2023 12 15 19:30:00 │ LONG         │ -0.51% │ 20.24%  │ 0.02       │ rsiDivergency5m │
// │  152 │ USTCUSDT     │ 2023 12 15 18:25:00 │ 2023 12 15 19:35:00 │ LONG         │ -0.51% │ 13.82%  │ 0.04       │ rsiDivergency5m │
// │  153 │ BEAMXUSDT    │ 2023 12 15 19:35:00 │ 2023 12 16 03:55:00 │ LONG         │ 1.23%  │ 21.47%  │ 0.02       │ rsiDivergency5m │
// │  154 │ 1000SATSUSDT │ 2023 12 16 08:10:00 │ 2023 12 16 08:15:00 │ SHORT        │ -0.51% │ -3.28%  │ 0.00       │ rsiDivergency5m │
// │  155 │ YGGUSDT      │ 2023 12 17 02:20:00 │ 2023 12 17 02:30:00 │ LONG         │ -0.51% │ 46.24%  │ 0.43       │ rsiDivergency5m │
// │  156 │ YGGUSDT      │ 2023 12 17 02:35:00 │ 2023 12 17 10:55:00 │ LONG         │ 0.61%  │ 46.85%  │ 0.42       │ rsiDivergency5m │
// │  157 │ DARUSDT      │ 2023 12 17 11:50:00 │ 2023 12 17 20:10:00 │ SHORT        │ 1.36%  │ 48.20%  │ 0.15       │ rsiDivergency5m │
// │  158 │ XVSUSDT      │ 2023 12 17 20:40:00 │ 2023 12 18 05:00:00 │ LONG         │ -0.02% │ 48.19%  │ 9.66       │ rsiDivergency5m │
// │  159 │ USTCUSDT     │ 2023 12 17 21:55:00 │ 2023 12 18 02:50:00 │ LONG         │ -0.51% │ 17.38%  │ 0.03       │ rsiDivergency5m │
// │  160 │ TOKENUSDT    │ 2023 12 18 02:55:00 │ 2023 12 18 03:20:00 │ LONG         │ -0.51% │ 23.59%  │ 0.04       │ rsiDivergency5m │
// │  161 │ TOKENUSDT    │ 2023 12 18 03:25:00 │ 2023 12 18 04:10:00 │ LONG         │ -0.51% │ 23.08%  │ 0.04       │ rsiDivergency5m │
// │  162 │ TOKENUSDT    │ 2023 12 18 04:15:00 │ 2023 12 18 04:20:00 │ LONG         │ -0.51% │ 22.57%  │ 0.04       │ rsiDivergency5m │
// │  163 │ GALAUSDT     │ 2023 12 18 04:25:00 │ 2023 12 18 05:25:00 │ LONG         │ -0.51% │ 47.67%  │ 0.03       │ rsiDivergency5m │
// │  164 │ WAXPUSDT     │ 2023 12 18 04:25:00 │ 2023 12 18 05:30:00 │ LONG         │ -0.51% │ 41.84%  │ 0.06       │ rsiDivergency5m │
// │  165 │ TOKENUSDT    │ 2023 12 18 04:30:00 │ 2023 12 18 05:30:00 │ LONG         │ -0.51% │ 22.06%  │ 0.04       │ rsiDivergency5m │
// │  166 │ WAXPUSDT     │ 2023 12 18 05:35:00 │ 2023 12 18 13:55:00 │ LONG         │ 0.64%  │ 42.48%  │ 0.06       │ rsiDivergency5m │
// │  167 │ GMTUSDT      │ 2023 12 18 05:40:00 │ 2023 12 18 14:00:00 │ LONG         │ 0.93%  │ 48.61%  │ 0.23       │ rsiDivergency5m │
// │  168 │ VETUSDT      │ 2023 12 18 14:05:00 │ 2023 12 18 16:05:00 │ SHORT        │ -0.51% │ 48.10%  │ 0.03       │ rsiDivergency5m │
// │  169 │ 1000BONKUSDT │ 2023 12 18 18:10:00 │ 2023 12 18 20:25:00 │ SHORT        │ -0.51% │ 18.17%  │ 0.02       │ rsiDivergency5m │
// │  170 │ YGGUSDT      │ 2023 12 18 18:10:00 │ 2023 12 18 20:45:00 │ SHORT        │ -0.51% │ 47.58%  │ 0.39       │ rsiDivergency5m │
// │  171 │ SKLUSDT      │ 2023 12 18 19:50:00 │ 2023 12 18 20:50:00 │ SHORT        │ -0.51% │ 47.07%  │ 0.04       │ rsiDivergency5m │
// │  172 │ 1000BONKUSDT │ 2023 12 18 21:00:00 │ 2023 12 18 21:05:00 │ SHORT        │ -0.51% │ 17.65%  │ 0.02       │ rsiDivergency5m │
// │  173 │ SKLUSDT      │ 2023 12 18 21:05:00 │ 2023 12 18 23:30:00 │ SHORT        │ -0.51% │ 46.56%  │ 0.04       │ rsiDivergency5m │
// │  174 │ 1000BONKUSDT │ 2023 12 18 21:10:00 │ 2023 12 19 02:30:00 │ SHORT        │ 2.49%  │ 20.14%  │ 0.02       │ rsiDivergency5m │
// │  175 │ SKLUSDT      │ 2023 12 18 23:35:00 │ 2023 12 19 00:20:00 │ SHORT        │ -0.51% │ 46.05%  │ 0.05       │ rsiDivergency5m │
// │  176 │ C98USDT      │ 2023 12 19 01:45:00 │ 2023 12 19 10:05:00 │ SHORT        │ 0.22%  │ 46.27%  │ 0.24       │ rsiDivergency5m │
// │  177 │ SUIUSDT      │ 2023 12 19 11:40:00 │ 2023 12 19 12:35:00 │ SHORT        │ -0.51% │ 45.75%  │ 0.67       │ rsiDivergency5m │
// │  178 │ CRVUSDT      │ 2023 12 19 13:35:00 │ 2023 12 19 21:55:00 │ LONG         │ 0.43%  │ 46.18%  │ 0.57       │ rsiDivergency5m │
// │  179 │ SUPERUSDT    │ 2023 12 19 18:20:00 │ 2023 12 20 02:40:00 │ LONG         │ 0.35%  │ 17.26%  │ 0.57       │ rsiDivergency5m │
// │  180 │ MAVUSDT      │ 2023 12 19 23:50:00 │ 2023 12 20 03:55:00 │ SHORT        │ -0.51% │ 45.67%  │ 0.40       │ rsiDivergency5m │
// │  181 │ INJUSDT      │ 2023 12 20 03:55:00 │ 2023 12 20 04:00:00 │ SHORT        │ -0.51% │ 45.15%  │ 42.59      │ rsiDivergency5m │
// │  182 │ INJUSDT      │ 2023 12 20 04:05:00 │ 2023 12 20 12:25:00 │ SHORT        │ 1.23%  │ 46.38%  │ 43.13      │ rsiDivergency5m │
// │  183 │ LEVERUSDT    │ 2023 12 20 18:45:00 │ 2023 12 20 18:55:00 │ SHORT        │ -0.51% │ 45.87%  │ 0.00       │ rsiDivergency5m │
// │  184 │ MINAUSDT     │ 2023 12 21 06:15:00 │ 2023 12 21 14:35:00 │ SHORT        │ 1.17%  │ 46.52%  │ 0.94       │ rsiDivergency5m │
// │  185 │ ORDIUSDT     │ 2023 12 21 09:15:00 │ 2023 12 21 11:35:00 │ LONG         │ -0.51% │ 24.11%  │ 52.32      │ rsiDivergency5m │
// │  186 │ DOTUSDT      │ 2023 12 21 13:45:00 │ 2023 12 21 18:55:00 │ SHORT        │ -0.51% │ 46.01%  │ 8.27       │ rsiDivergency5m │
// │  187 │ ROSEUSDT     │ 2023 12 21 20:00:00 │ 2023 12 22 00:15:00 │ SHORT        │ -0.51% │ 45.50%  │ 0.11       │ rsiDivergency5m │
// │  188 │ ROSEUSDT     │ 2023 12 22 00:25:00 │ 2023 12 22 01:25:00 │ SHORT        │ -0.51% │ 44.99%  │ 0.12       │ rsiDivergency5m │
// │  189 │ NTRNUSDT     │ 2023 12 22 02:25:00 │ 2023 12 22 02:35:00 │ LONG         │ -0.51% │ 29.15%  │ 1.14       │ rsiDivergency5m │
// │  190 │ DOTUSDT      │ 2023 12 22 02:35:00 │ 2023 12 22 10:55:00 │ LONG         │ 0.59%  │ 45.58%  │ 7.89       │ rsiDivergency5m │
// │  191 │ ACEUSDT      │ 2023 12 22 03:30:00 │ 2023 12 22 04:10:00 │ LONG         │ -0.51% │ -4.71%  │ 13.41      │ rsiDivergency5m │
// │  192 │ TOKENUSDT    │ 2023 12 22 17:55:00 │ 2023 12 23 02:15:00 │ SHORT        │ 0.67%  │ 24.80%  │ 0.04       │ rsiDivergency5m │
// │  193 │ SUIUSDT      │ 2023 12 22 20:20:00 │ 2023 12 23 04:40:00 │ SHORT        │ 0.06%  │ 48.13%  │ 0.74       │ rsiDivergency5m │
// │  194 │ USTCUSDT     │ 2023 12 22 22:55:00 │ 2023 12 23 07:15:00 │ LONG         │ -0.01% │ 19.54%  │ 0.04       │ rsiDivergency5m │
// │  195 │ IMXUSDT      │ 2023 12 23 05:25:00 │ 2023 12 23 13:45:00 │ SHORT        │ 1.14%  │ 49.27%  │ 2.53       │ rsiDivergency5m │
// │  196 │ RNDRUSDT     │ 2023 12 23 14:15:00 │ 2023 12 23 15:00:00 │ SHORT        │ -0.51% │ 48.76%  │ 4.83       │ rsiDivergency5m │
// │  197 │ DOTUSDT      │ 2023 12 23 20:55:00 │ 2023 12 24 05:15:00 │ SHORT        │ 0.34%  │ 48.07%  │ 8.89       │ rsiDivergency5m │
// │  198 │ HOTUSDT      │ 2023 12 24 16:50:00 │ 2023 12 24 17:15:00 │ LONG         │ -0.51% │ 47.05%  │ 0.00       │ rsiDivergency5m │
// │  199 │ INJUSDT      │ 2023 12 24 19:45:00 │ 2023 12 25 04:05:00 │ LONG         │ 0.42%  │ 47.46%  │ 39.90      │ rsiDivergency5m │
// │  200 │ ONEUSDT      │ 2023 12 25 06:10:00 │ 2023 12 25 06:35:00 │ SHORT        │ -0.51% │ 45.93%  │ 0.02       │ rsiDivergency5m │
// │  201 │ LEVERUSDT    │ 2023 12 25 06:15:00 │ 2023 12 25 06:20:00 │ SHORT        │ -0.51% │ 46.95%  │ 0.00       │ rsiDivergency5m │
// │  202 │ RENUSDT      │ 2023 12 25 08:15:00 │ 2023 12 25 10:00:00 │ SHORT        │ -0.51% │ 45.41%  │ 0.07       │ rsiDivergency5m │
// │  203 │ WLDUSDT      │ 2023 12 25 22:20:00 │ 2023 12 25 22:40:00 │ SHORT        │ -0.51% │ 45.00%  │ 3.99       │ rsiDivergency5m │
// │  204 │ APTUSDT      │ 2023 12 26 17:30:00 │ 2023 12 26 20:20:00 │ SHORT        │ -0.51% │ 45.78%  │ 10.78      │ rsiDivergency5m │
// │  205 │ EGLDUSDT     │ 2023 12 26 19:45:00 │ 2023 12 27 04:05:00 │ SHORT        │ 0.91%  │ 46.69%  │ 73.75      │ rsiDivergency5m │
// │  206 │ ORDIUSDT     │ 2023 12 27 05:05:00 │ 2023 12 27 13:25:00 │ SHORT        │ 1.38%  │ 24.82%  │ 73.97      │ rsiDivergency5m │
// │  207 │ IOTAUSDT     │ 2023 12 27 07:25:00 │ 2023 12 27 15:45:00 │ SHORT        │ 0.70%  │ 46.88%  │ 0.31       │ rsiDivergency5m │
// │  208 │ ARBUSDT      │ 2023 12 27 08:35:00 │ 2023 12 27 08:45:00 │ SHORT        │ -0.51% │ 46.18%  │ 1.43       │ rsiDivergency5m │
// │  209 │ LDOUSDT      │ 2023 12 27 17:10:00 │ 2023 12 27 19:35:00 │ SHORT        │ -0.51% │ 46.37%  │ 2.84       │ rsiDivergency5m │
// │  210 │ BEAMXUSDT    │ 2023 12 28 09:10:00 │ 2023 12 28 09:15:00 │ LONG         │ -0.51% │ 22.94%  │ 0.02       │ rsiDivergency5m │
// │  211 │ TRUUSDT      │ 2023 12 28 16:20:00 │ 2023 12 29 00:40:00 │ SHORT        │ 0.82%  │ 47.31%  │ 0.06       │ rsiDivergency5m │
// │  212 │ CRVUSDT      │ 2023 12 29 11:15:00 │ 2023 12 29 11:50:00 │ LONG         │ -0.51% │ 47.59%  │ 0.65       │ rsiDivergency5m │
// │  213 │ ORDIUSDT     │ 2023 12 29 11:50:00 │ 2023 12 29 12:05:00 │ LONG         │ -0.51% │ 31.56%  │ 73.45      │ rsiDivergency5m │
// │  214 │ IOTAUSDT     │ 2023 12 29 12:10:00 │ 2023 12 29 17:20:00 │ LONG         │ -0.51% │ 47.08%  │ 0.29       │ rsiDivergency5m │
// │  215 │ ORDIUSDT     │ 2023 12 29 12:10:00 │ 2023 12 29 19:45:00 │ LONG         │ 2.49%  │ 34.05%  │ 72.25      │ rsiDivergency5m │
// │  216 │ HFTUSDT      │ 2023 12 29 20:10:00 │ 2023 12 30 03:50:00 │ LONG         │ -0.51% │ 46.57%  │ 0.38       │ rsiDivergency5m │
// │  217 │ ORDIUSDT     │ 2023 12 29 20:35:00 │ 2023 12 30 04:55:00 │ SHORT        │ 1.94%  │ 35.99%  │ 81.17      │ rsiDivergency5m │
// │  218 │ WLDUSDT      │ 2023 12 30 07:55:00 │ 2023 12 30 08:35:00 │ SHORT        │ -0.51% │ 45.54%  │ 3.73       │ rsiDivergency5m │
// │  219 │ GMXUSDT      │ 2023 12 30 10:00:00 │ 2023 12 30 10:35:00 │ SHORT        │ -0.51% │ 45.03%  │ 55.51      │ rsiDivergency5m │
// │  220 │ ARBUSDT      │ 2023 12 31 07:30:00 │ 2023 12 31 15:50:00 │ SHORT        │ 1.34%  │ 46.54%  │ 1.65       │ rsiDivergency5m │
// │  221 │ DEFIUSDT     │ 2023 12 31 15:30:00 │ 2023 12 31 16:45:00 │ SHORT        │ -0.51% │ 46.03%  │ 1105.60    │ rsiDivergency5m │
// │  222 │ BONDUSDT     │ 2023 12 31 19:00:00 │ 2023 12 31 23:15:00 │ LONG         │ -0.51% │ 45.52%  │ 4.36       │ rsiDivergency5m │
// │  223 │ DEFIUSDT     │ 2023 12 31 22:25:00 │ 2023 12 31 23:10:00 │ LONG         │ -0.51% │ 45.00%  │ 960.00     │ rsiDivergency5m │
// │  224 │ FRONTUSDT    │ 2024 01 01 01:00:00 │ 2024 01 01 09:20:00 │ LONG         │ 0.55%  │ 45.56%  │ 0.39       │ rsiDivergency5m │
// │  225 │ DEFIUSDT     │ 2024 01 01 08:10:00 │ 2024 01 01 14:55:00 │ SHORT        │ -0.51% │ 45.05%  │ 985.30     │ rsiDivergency5m │
// │  226 │ OXTUSDT      │ 2024 01 01 17:05:00 │ 2024 01 01 17:20:00 │ SHORT        │ -0.51% │ 44.53%  │ 0.11       │ rsiDivergency5m │
// │  227 │ OXTUSDT      │ 2024 01 01 17:25:00 │ 2024 01 01 18:30:00 │ SHORT        │ -0.51% │ 44.02%  │ 0.11       │ rsiDivergency5m │
// │  228 │ 1000BONKUSDT │ 2024 01 01 18:40:00 │ 2024 01 01 18:55:00 │ SHORT        │ -0.51% │ 25.28%  │ 0.01       │ rsiDivergency5m │
// │  229 │ STXUSDT      │ 2024 01 01 20:30:00 │ 2024 01 01 21:55:00 │ SHORT        │ -0.51% │ 43.51%  │ 1.68       │ rsiDivergency5m │
// │  230 │ RIFUSDT      │ 2024 01 01 21:45:00 │ 2024 01 02 06:05:00 │ SHORT        │ 0.59%  │ 45.59%  │ 0.14       │ rsiDivergency5m │
// │  231 │ BIGTIMEUSDT  │ 2024 01 01 23:15:00 │ 2024 01 01 23:35:00 │ SHORT        │ -0.51% │ 43.00%  │ 0.50       │ rsiDivergency5m │
// │  232 │ LDOUSDT      │ 2024 01 02 00:10:00 │ 2024 01 02 08:30:00 │ SHORT        │ 0.68%  │ 43.67%  │ 3.15       │ rsiDivergency5m │
// │  233 │ OXTUSDT      │ 2024 01 03 01:10:00 │ 2024 01 03 03:10:00 │ LONG         │ -0.51% │ 43.35%  │ 0.11       │ rsiDivergency5m │
// │  234 │ USTCUSDT     │ 2024 01 03 01:25:00 │ 2024 01 03 02:05:00 │ SHORT        │ -0.51% │ 23.92%  │ 0.03       │ rsiDivergency5m │
// │  235 │ GMTUSDT      │ 2024 01 03 02:55:00 │ 2024 01 03 06:05:00 │ LONG         │ -0.51% │ 42.83%  │ 0.34       │ rsiDivergency5m │
// │  236 │ LINAUSDT     │ 2024 01 03 07:40:00 │ 2024 01 03 09:15:00 │ LONG         │ -0.51% │ 41.81%  │ 0.01       │ rsiDivergency5m │
// │  237 │ FRONTUSDT    │ 2024 01 03 11:55:00 │ 2024 01 03 12:45:00 │ SHORT        │ -0.51% │ 41.30%  │ 0.42       │ rsiDivergency5m │
// │  238 │ FRONTUSDT    │ 2024 01 03 13:25:00 │ 2024 01 03 15:30:00 │ SHORT        │ -0.51% │ 40.78%  │ 0.43       │ rsiDivergency5m │
// │  239 │ DODOXUSDT    │ 2024 01 04 01:25:00 │ 2024 01 04 09:45:00 │ SHORT        │ 0.67%  │ 43.34%  │ 0.20       │ rsiDivergency5m │
// │  240 │ MKRUSDT      │ 2024 01 04 08:55:00 │ 2024 01 04 17:15:00 │ SHORT        │ 0.86%  │ 44.20%  │ 1846.10    │ rsiDivergency5m │
// │  241 │ APTUSDT      │ 2024 01 04 18:15:00 │ 2024 01 04 20:45:00 │ LONG         │ -0.51% │ 43.69%  │ 10.41      │ rsiDivergency5m │
// │  242 │ SUPERUSDT    │ 2024 01 05 06:55:00 │ 2024 01 05 10:15:00 │ LONG         │ -0.51% │ 24.77%  │ 0.58       │ rsiDivergency5m │
// │  243 │ RDNTUSDT     │ 2024 01 05 07:10:00 │ 2024 01 05 10:50:00 │ LONG         │ -0.51% │ 42.67%  │ 0.33       │ rsiDivergency5m │
// │  244 │ SKLUSDT      │ 2024 01 05 10:10:00 │ 2024 01 05 18:30:00 │ LONG         │ 0.93%  │ 43.60%  │ 0.08       │ rsiDivergency5m │
// │  245 │ SUIUSDT      │ 2024 01 06 00:25:00 │ 2024 01 06 07:15:00 │ LONG         │ 2.49%  │ 46.09%  │ 0.82       │ rsiDivergency5m │
// │  246 │ SUPERUSDT    │ 2024 01 06 02:00:00 │ 2024 01 06 10:20:00 │ LONG         │ 1.31%  │ 24.25%  │ 0.54       │ rsiDivergency5m │
// │  247 │ PENDLEUSDT   │ 2024 01 06 09:00:00 │ 2024 01 06 14:40:00 │ LONG         │ -0.51% │ 45.57%  │ 1.30       │ rsiDivergency5m │
// │  248 │ ARPAUSDT     │ 2024 01 06 15:50:00 │ 2024 01 07 00:10:00 │ LONG         │ 0.16%  │ 45.74%  │ 0.07       │ rsiDivergency5m │
// │  249 │ 1INCHUSDT    │ 2024 01 07 18:30:00 │ 2024 01 07 19:50:00 │ LONG         │ -0.51% │ 47.14%  │ 0.41       │ rsiDivergency5m │
// │  250 │ HIFIUSDT     │ 2024 01 07 18:30:00 │ 2024 01 07 19:35:00 │ LONG         │ -0.51% │ 47.66%  │ 0.64       │ rsiDivergency5m │
// │  251 │ SUPERUSDT    │ 2024 01 07 18:30:00 │ 2024 01 07 20:15:00 │ LONG         │ -0.51% │ 24.70%  │ 0.51       │ rsiDivergency5m │
// │  252 │ LINAUSDT     │ 2024 01 07 20:20:00 │ 2024 01 07 21:15:00 │ LONG         │ -0.51% │ 46.63%  │ 0.01       │ rsiDivergency5m │
// │  253 │ ONTUSDT      │ 2024 01 07 21:20:00 │ 2024 01 07 21:35:00 │ LONG         │ -0.51% │ 45.61%  │ 0.22       │ rsiDivergency5m │
// │  254 │ APTUSDT      │ 2024 01 07 21:55:00 │ 2024 01 07 22:25:00 │ LONG         │ -0.51% │ 46.12%  │ 7.98       │ rsiDivergency5m │
// │  255 │ OGNUSDT      │ 2024 01 07 22:25:00 │ 2024 01 08 01:45:00 │ LONG         │ 2.49%  │ 48.09%  │ 0.14       │ rsiDivergency5m │
// │  256 │ SPELLUSDT    │ 2024 01 08 02:20:00 │ 2024 01 08 07:10:00 │ SHORT        │ -0.51% │ 47.58%  │ 0.00       │ rsiDivergency5m │
// │  257 │ XVGUSDT      │ 2024 01 08 07:45:00 │ 2024 01 08 13:15:00 │ SHORT        │ -0.51% │ 47.07%  │ 0.00       │ rsiDivergency5m │
// │  258 │ 1000LUNCUSDT │ 2024 01 08 12:55:00 │ 2024 01 08 14:15:00 │ SHORT        │ -0.51% │ 46.56%  │ 0.12       │ rsiDivergency5m │
// │  259 │ 1000BONKUSDT │ 2024 01 08 13:05:00 │ 2024 01 08 13:15:00 │ SHORT        │ -0.51% │ 23.08%  │ 0.01       │ rsiDivergency5m │
// │  260 │ WAXPUSDT     │ 2024 01 08 14:20:00 │ 2024 01 08 17:15:00 │ SHORT        │ -0.51% │ 43.18%  │ 0.06       │ rsiDivergency5m │
// │  261 │ WLDUSDT      │ 2024 01 08 14:50:00 │ 2024 01 08 23:10:00 │ SHORT        │ 0.93%  │ 47.48%  │ 2.86       │ rsiDivergency5m │
// │  262 │ 1000BONKUSDT │ 2024 01 09 17:10:00 │ 2024 01 09 18:55:00 │ SHORT        │ -0.51% │ 22.51%  │ 0.01       │ rsiDivergency5m │
// │  263 │ SSVUSDT      │ 2024 01 09 17:20:00 │ 2024 01 09 19:35:00 │ SHORT        │ -0.51% │ 46.60%  │ 32.49      │ rsiDivergency5m │
// │  264 │ SSVUSDT      │ 2024 01 09 19:40:00 │ 2024 01 10 04:00:00 │ SHORT        │ 0.64%  │ 47.24%  │ 33.10      │ rsiDivergency5m │
// │  265 │ ARBUSDT      │ 2024 01 10 05:25:00 │ 2024 01 10 13:45:00 │ SHORT        │ 0.44%  │ 47.68%  │ 2.02       │ rsiDivergency5m │
// │  266 │ AIUSDT       │ 2024 01 10 08:45:00 │ 2024 01 10 08:50:00 │ LONG         │ -0.51% │ 0.44%   │ 1.03       │ rsiDivergency5m │
// │  267 │ AIUSDT       │ 2024 01 10 08:55:00 │ 2024 01 10 09:45:00 │ LONG         │ -0.51% │ -0.07%  │ 1.02       │ rsiDivergency5m │
// │  268 │ AIUSDT       │ 2024 01 10 09:55:00 │ 2024 01 10 10:25:00 │ LONG         │ -0.51% │ -0.59%  │ 0.98       │ rsiDivergency5m │
// │  269 │ BEAMXUSDT    │ 2024 01 10 18:05:00 │ 2024 01 10 18:20:00 │ SHORT        │ -0.51% │ 34.93%  │ 0.02       │ rsiDivergency5m │
// │  270 │ WAXPUSDT     │ 2024 01 10 18:15:00 │ 2024 01 11 02:35:00 │ SHORT        │ 0.46%  │ 48.68%  │ 0.07       │ rsiDivergency5m │
// │  271 │ MINAUSDT     │ 2024 01 11 01:30:00 │ 2024 01 11 07:20:00 │ LONG         │ 2.49%  │ 51.05%  │ 1.19       │ rsiDivergency5m │
// │  272 │ ARPAUSDT     │ 2024 01 11 07:15:00 │ 2024 01 11 15:35:00 │ SHORT        │ 0.44%  │ 51.49%  │ 0.07       │ rsiDivergency5m │
// │  273 │ USTCUSDT     │ 2024 01 11 20:20:00 │ 2024 01 11 20:25:00 │ SHORT        │ -0.51% │ 21.54%  │ 0.03       │ rsiDivergency5m │
// │  274 │ USTCUSDT     │ 2024 01 11 20:40:00 │ 2024 01 12 03:10:00 │ SHORT        │ 2.49%  │ 24.03%  │ 0.03       │ rsiDivergency5m │
// │  275 │ SSVUSDT      │ 2024 01 12 07:30:00 │ 2024 01 12 08:00:00 │ SHORT        │ -0.51% │ 51.16%  │ 38.57      │ rsiDivergency5m │
// │  276 │ SSVUSDT      │ 2024 01 12 08:25:00 │ 2024 01 12 08:40:00 │ SHORT        │ -0.51% │ 50.13%  │ 39.66      │ rsiDivergency5m │
// │  277 │ WLDUSDT      │ 2024 01 12 08:25:00 │ 2024 01 12 08:35:00 │ SHORT        │ -0.51% │ 50.65%  │ 3.01       │ rsiDivergency5m │
// │  278 │ CFXUSDT      │ 2024 01 12 12:25:00 │ 2024 01 12 17:20:00 │ LONG         │ -0.51% │ 49.11%  │ 0.18       │ rsiDivergency5m │
// │  279 │ ORDIUSDT     │ 2024 01 12 12:25:00 │ 2024 01 12 17:00:00 │ LONG         │ -0.51% │ 45.36%  │ 68.18      │ rsiDivergency5m │
// │  280 │ AXSUSDT      │ 2024 01 12 17:05:00 │ 2024 01 12 17:20:00 │ LONG         │ -0.51% │ 48.08%  │ 7.88       │ rsiDivergency5m │
// │  281 │ FLOWUSDT     │ 2024 01 12 17:10:00 │ 2024 01 12 17:20:00 │ LONG         │ -0.51% │ 48.60%  │ 0.83       │ rsiDivergency5m │
// │  282 │ WAXPUSDT     │ 2024 01 12 20:15:00 │ 2024 01 13 04:35:00 │ LONG         │ 0.65%  │ 47.11%  │ 0.06       │ rsiDivergency5m │
// │  283 │ UMAUSDT      │ 2024 01 13 01:25:00 │ 2024 01 13 09:45:00 │ SHORT        │ -0.09% │ 50.48%  │ 1.98       │ rsiDivergency5m │
// │  284 │ APTUSDT      │ 2024 01 13 21:10:00 │ 2024 01 14 05:30:00 │ LONG         │ 0.29%  │ 50.52%  │ 9.62       │ rsiDivergency5m │
// │  285 │ ACEUSDT      │ 2024 01 14 03:55:00 │ 2024 01 14 08:35:00 │ SHORT        │ -0.51% │ 19.63%  │ 9.81       │ rsiDivergency5m │
// │  286 │ USTCUSDT     │ 2024 01 15 15:30:00 │ 2024 01 15 23:50:00 │ SHORT        │ 1.41%  │ 24.12%  │ 0.03       │ rsiDivergency5m │
// │  287 │ SUPERUSDT    │ 2024 01 15 16:20:00 │ 2024 01 15 16:30:00 │ SHORT        │ -0.51% │ 24.30%  │ 0.63       │ rsiDivergency5m │
// │  288 │ ENSUSDT      │ 2024 01 16 03:30:00 │ 2024 01 16 09:40:00 │ LONG         │ -0.51% │ 48.96%  │ 21.82      │ rsiDivergency5m │
// │  289 │ BEAMXUSDT    │ 2024 01 17 19:50:00 │ 2024 01 18 04:10:00 │ LONG         │ 0.54%  │ 44.48%  │ 0.02       │ rsiDivergency5m │
// │  290 │ BEAMXUSDT    │ 2024 01 19 01:05:00 │ 2024 01 19 01:50:00 │ SHORT        │ -0.51% │ 46.75%  │ 0.02       │ rsiDivergency5m │
// │  291 │ BIGTIMEUSDT  │ 2024 01 19 02:05:00 │ 2024 01 19 10:25:00 │ SHORT        │ 1.41%  │ 52.02%  │ 0.39       │ rsiDivergency5m │
// │  292 │ GASUSDT      │ 2024 01 19 11:10:00 │ 2024 01 19 11:40:00 │ LONG         │ -0.51% │ 46.97%  │ 6.62       │ rsiDivergency5m │
// │  293 │ RNDRUSDT     │ 2024 01 19 11:20:00 │ 2024 01 19 11:35:00 │ LONG         │ -0.51% │ 51.00%  │ 3.93       │ rsiDivergency5m │
// │  294 │ AIUSDT       │ 2024 01 19 11:25:00 │ 2024 01 19 11:35:00 │ LONG         │ -0.51% │ -0.02%  │ 1.04       │ rsiDivergency5m │
// │  295 │ MAVUSDT      │ 2024 01 19 11:30:00 │ 2024 01 19 11:40:00 │ LONG         │ -0.51% │ 51.51%  │ 0.52       │ rsiDivergency5m │
// │  296 │ GASUSDT      │ 2024 01 19 12:00:00 │ 2024 01 19 12:05:00 │ LONG         │ -0.51% │ 46.46%  │ 6.40       │ rsiDivergency5m │
// │  297 │ DARUSDT      │ 2024 01 19 12:10:00 │ 2024 01 19 20:30:00 │ LONG         │ 2.10%  │ 53.10%  │ 0.11       │ rsiDivergency5m │
// │  298 │ DYDXUSDT     │ 2024 01 20 03:55:00 │ 2024 01 20 12:15:00 │ LONG         │ -0.35% │ 52.75%  │ 2.82       │ rsiDivergency5m │
// │  299 │ DOGEUSDT     │ 2024 01 20 18:25:00 │ 2024 01 21 02:45:00 │ SHORT        │ 0.90%  │ 53.65%  │ 0.09       │ rsiDivergency5m │
// │  300 │ PENDLEUSDT   │ 2024 01 21 05:05:00 │ 2024 01 21 06:00:00 │ SHORT        │ -0.51% │ 53.14%  │ 2.29       │ rsiDivergency5m │
// │  301 │ SUIUSDT      │ 2024 01 21 20:30:00 │ 2024 01 22 04:50:00 │ LONG         │ 0.10%  │ 53.62%  │ 1.02       │ rsiDivergency5m │
// │  302 │ RIFUSDT      │ 2024 01 21 21:50:00 │ 2024 01 22 06:10:00 │ LONG         │ 0.33%  │ 49.18%  │ 0.13       │ rsiDivergency5m │
// │  303 │ UMAUSDT      │ 2024 01 22 05:10:00 │ 2024 01 22 05:20:00 │ LONG         │ -0.51% │ 53.11%  │ 5.01       │ rsiDivergency5m │
// │  304 │ MAVUSDT      │ 2024 01 22 08:10:00 │ 2024 01 22 08:20:00 │ SHORT        │ -0.51% │ 52.60%  │ 0.55       │ rsiDivergency5m │
// │  305 │ PENDLEUSDT   │ 2024 01 23 02:45:00 │ 2024 01 23 04:25:00 │ LONG         │ -0.51% │ 53.20%  │ 1.92       │ rsiDivergency5m │
// │  306 │ XVGUSDT      │ 2024 01 23 04:30:00 │ 2024 01 23 09:10:00 │ LONG         │ -0.51% │ 52.69%  │ 0.00       │ rsiDivergency5m │
// │  307 │ SUIUSDT      │ 2024 01 23 13:15:00 │ 2024 01 23 21:35:00 │ SHORT        │ 1.01%  │ 53.70%  │ 1.22       │ rsiDivergency5m │
// │  308 │ ACEUSDT      │ 2024 01 23 19:55:00 │ 2024 01 23 20:25:00 │ SHORT        │ -0.51% │ 24.43%  │ 7.96       │ rsiDivergency5m │
// │  309 │ AMBUSDT      │ 2024 01 24 01:25:00 │ 2024 01 24 03:25:00 │ SHORT        │ -0.51% │ 55.68%  │ 0.01       │ rsiDivergency5m │
// │  310 │ PENDLEUSDT   │ 2024 01 24 04:45:00 │ 2024 01 24 05:00:00 │ SHORT        │ -0.51% │ 55.16%  │ 2.18       │ rsiDivergency5m │
// │  311 │ FXSUSDT      │ 2024 01 24 05:35:00 │ 2024 01 24 13:55:00 │ SHORT        │ 0.26%  │ 55.42%  │ 10.06      │ rsiDivergency5m │
// │  312 │ MAVUSDT      │ 2024 01 24 14:45:00 │ 2024 01 24 16:40:00 │ LONG         │ -0.51% │ 54.91%  │ 0.56       │ rsiDivergency5m │
// │  313 │ MAVUSDT      │ 2024 01 25 00:15:00 │ 2024 01 25 07:50:00 │ LONG         │ -0.51% │ 54.40%  │ 0.53       │ rsiDivergency5m │
// │  314 │ SKLUSDT      │ 2024 01 25 08:45:00 │ 2024 01 25 11:45:00 │ LONG         │ -0.51% │ 53.88%  │ 0.07       │ rsiDivergency5m │
// │  315 │ ONTUSDT      │ 2024 01 25 12:10:00 │ 2024 01 25 20:30:00 │ LONG         │ 0.16%  │ 54.04%  │ 0.22       │ rsiDivergency5m │
// │  316 │ UMAUSDT      │ 2024 01 26 02:40:00 │ 2024 01 26 11:00:00 │ SHORT        │ 2.14%  │ 56.17%  │ 5.69       │ rsiDivergency5m │
// │  317 │ 1000SATSUSDT │ 2024 01 26 05:55:00 │ 2024 01 26 06:05:00 │ SHORT        │ -0.51% │ 24.86%  │ 0.00       │ rsiDivergency5m │
// │  318 │ SUIUSDT      │ 2024 01 26 11:50:00 │ 2024 01 26 12:45:00 │ SHORT        │ -0.51% │ 55.66%  │ 1.34       │ rsiDivergency5m │
// │  319 │ SUIUSDT      │ 2024 01 26 13:10:00 │ 2024 01 26 14:15:00 │ SHORT        │ -0.51% │ 55.15%  │ 1.41       │ rsiDivergency5m │
// │  320 │ SUPERUSDT    │ 2024 01 27 04:35:00 │ 2024 01 27 06:55:00 │ LONG         │ -0.51% │ 46.46%  │ 0.64       │ rsiDivergency5m │
// │  321 │ SUPERUSDT    │ 2024 01 27 07:20:00 │ 2024 01 27 15:40:00 │ LONG         │ 0.81%  │ 47.26%  │ 0.62       │ rsiDivergency5m │
// │  322 │ AIUSDT       │ 2024 01 27 10:10:00 │ 2024 01 27 10:25:00 │ SHORT        │ -0.51% │ 14.07%  │ 1.23       │ rsiDivergency5m │
// │  323 │ BIGTIMEUSDT  │ 2024 01 27 14:05:00 │ 2024 01 27 22:25:00 │ SHORT        │ 0.62%  │ 57.93%  │ 0.39       │ rsiDivergency5m │
// │  324 │ AIUSDT       │ 2024 01 27 16:35:00 │ 2024 01 28 00:55:00 │ SHORT        │ 1.50%  │ 17.54%  │ 1.31       │ rsiDivergency5m │
// │  325 │ SUIUSDT      │ 2024 01 29 12:35:00 │ 2024 01 29 20:25:00 │ SHORT        │ -0.51% │ 57.60%  │ 1.55       │ rsiDivergency5m │
// │  326 │ HIGHUSDT     │ 2024 01 29 21:35:00 │ 2024 01 30 05:55:00 │ SHORT        │ 0.82%  │ 58.42%  │ 1.59       │ rsiDivergency5m │
// │  327 │ MAVUSDT      │ 2024 01 30 10:00:00 │ 2024 01 30 10:15:00 │ SHORT        │ -0.51% │ 57.39%  │ 0.65       │ rsiDivergency5m │
// │  328 │ MAVUSDT      │ 2024 01 30 11:35:00 │ 2024 01 30 12:05:00 │ SHORT        │ -0.51% │ 56.88%  │ 0.69       │ rsiDivergency5m │
// │  329 │ OGNUSDT      │ 2024 01 30 17:10:00 │ 2024 01 30 18:35:00 │ LONG         │ -0.51% │ 56.37%  │ 0.17       │ rsiDivergency5m │
// │  330 │ OGNUSDT      │ 2024 01 31 03:50:00 │ 2024 01 31 05:40:00 │ LONG         │ -0.51% │ 55.86%  │ 0.16       │ rsiDivergency5m │
// │  331 │ AIUSDT       │ 2024 01 31 05:00:00 │ 2024 01 31 05:45:00 │ LONG         │ -0.51% │ 17.13%  │ 1.29       │ rsiDivergency5m │
// │  332 │ MAVUSDT      │ 2024 02 01 17:40:00 │ 2024 02 02 00:10:00 │ LONG         │ -0.51% │ 56.28%  │ 0.67       │ rsiDivergency5m │
// │  333 │ ALTUSDT      │ 2024 02 01 21:15:00 │ 2024 02 02 05:35:00 │ SHORT        │ 1.01%  │ -1.68%  │ 0.37       │ rsiDivergency5m │
// │  334 │ CKBUSDT      │ 2024 02 02 00:50:00 │ 2024 02 02 02:00:00 │ LONG         │ -0.51% │ 55.77%  │ 0.00       │ rsiDivergency5m │
// │  335 │ CKBUSDT      │ 2024 02 02 02:30:00 │ 2024 02 02 09:15:00 │ LONG         │ -0.51% │ 55.26%  │ 0.00       │ rsiDivergency5m │
// │  336 │ ROSEUSDT     │ 2024 02 02 11:00:00 │ 2024 02 02 11:50:00 │ SHORT        │ -0.51% │ 54.74%  │ 0.11       │ rsiDivergency5m │
// │  337 │ ROSEUSDT     │ 2024 02 02 12:10:00 │ 2024 02 02 16:30:00 │ SHORT        │ -0.51% │ 54.23%  │ 0.11       │ rsiDivergency5m │
// │  338 │ UMAUSDT      │ 2024 02 02 19:10:00 │ 2024 02 03 00:00:00 │ LONG         │ -0.51% │ 53.72%  │ 4.40       │ rsiDivergency5m │
// │  339 │ 1000LUNCUSDT │ 2024 02 03 14:20:00 │ 2024 02 03 15:00:00 │ SHORT        │ -0.51% │ 53.70%  │ 0.10       │ rsiDivergency5m │
// │  340 │ 1000LUNCUSDT │ 2024 02 03 15:10:00 │ 2024 02 03 15:15:00 │ SHORT        │ -0.51% │ 53.19%  │ 0.11       │ rsiDivergency5m │
// │  341 │ 1000LUNCUSDT │ 2024 02 03 15:20:00 │ 2024 02 03 16:00:00 │ SHORT        │ -0.51% │ 52.68%  │ 0.11       │ rsiDivergency5m │
// │  342 │ ACEUSDT      │ 2024 02 03 23:10:00 │ 2024 02 04 07:30:00 │ LONG         │ 0.35%  │ 21.89%  │ 8.35       │ rsiDivergency5m │
// │  343 │ ROSEUSDT     │ 2024 02 04 17:55:00 │ 2024 02 05 02:15:00 │ LONG         │ 0.00%  │ 52.49%  │ 0.11       │ rsiDivergency5m │
// │  344 │ ROSEUSDT     │ 2024 02 05 04:40:00 │ 2024 02 05 13:00:00 │ LONG         │ -0.19% │ 52.30%  │ 0.11       │ rsiDivergency5m │
// │  345 │ TOKENUSDT    │ 2024 02 05 09:15:00 │ 2024 02 05 17:35:00 │ SHORT        │ 1.93%  │ 51.88%  │ 0.03       │ rsiDivergency5m │
// │  346 │ ENSUSDT      │ 2024 02 05 13:20:00 │ 2024 02 05 21:40:00 │ SHORT        │ -0.12% │ 52.18%  │ 20.28      │ rsiDivergency5m │
// │  347 │ TOKENUSDT    │ 2024 02 05 17:40:00 │ 2024 02 06 02:00:00 │ LONG         │ 0.81%  │ 52.69%  │ 0.03       │ rsiDivergency5m │
// │  348 │ NMRUSDT      │ 2024 02 06 01:05:00 │ 2024 02 06 01:50:00 │ LONG         │ -0.51% │ 51.67%  │ 26.97      │ rsiDivergency5m │
// │  349 │ NMRUSDT      │ 2024 02 06 02:50:00 │ 2024 02 06 10:45:00 │ LONG         │ -0.51% │ 51.15%  │ 25.79      │ rsiDivergency5m │
// │  350 │ COTIUSDT     │ 2024 02 08 09:25:00 │ 2024 02 08 09:35:00 │ SHORT        │ -0.51% │ 49.26%  │ 0.07       │ rsiDivergency5m │
// │  351 │ CKBUSDT      │ 2024 02 08 13:25:00 │ 2024 02 08 14:00:00 │ SHORT        │ -0.51% │ 48.75%  │ 0.01       │ rsiDivergency5m │
// │  352 │ MAVUSDT      │ 2024 02 08 15:05:00 │ 2024 02 08 23:25:00 │ LONG         │ 2.11%  │ 50.85%  │ 0.63       │ rsiDivergency5m │
// │  353 │ SUIUSDT      │ 2024 02 09 13:45:00 │ 2024 02 09 15:00:00 │ SHORT        │ -0.51% │ 52.81%  │ 1.76       │ rsiDivergency5m │
// │  354 │ PENDLEUSDT   │ 2024 02 09 19:25:00 │ 2024 02 09 20:40:00 │ SHORT        │ -0.51% │ 51.79%  │ 3.22       │ rsiDivergency5m │
// │  355 │ PENDLEUSDT   │ 2024 02 09 20:55:00 │ 2024 02 09 23:05:00 │ SHORT        │ -0.51% │ 51.28%  │ 3.29       │ rsiDivergency5m │
// │  356 │ SUPERUSDT    │ 2024 02 09 22:20:00 │ 2024 02 09 23:25:00 │ SHORT        │ -0.51% │ 46.05%  │ 0.74       │ rsiDivergency5m │
// │  357 │ SPELLUSDT    │ 2024 02 10 17:25:00 │ 2024 02 10 19:20:00 │ SHORT        │ -0.51% │ 52.23%  │ 0.00       │ rsiDivergency5m │
// │  358 │ HIFIUSDT     │ 2024 02 11 08:40:00 │ 2024 02 11 09:00:00 │ SHORT        │ -0.51% │ 51.79%  │ 0.64       │ rsiDivergency5m │
// │  359 │ MANTAUSDT    │ 2024 02 11 23:10:00 │ 2024 02 12 07:30:00 │ LONG         │ 0.03%  │ 17.29%  │ 2.72       │ rsiDivergency5m │
// │  360 │ UMAUSDT      │ 2024 02 12 06:30:00 │ 2024 02 12 07:30:00 │ SHORT        │ -0.51% │ 52.01%  │ 4.69       │ rsiDivergency5m │
// │  361 │ COTIUSDT     │ 2024 02 12 07:50:00 │ 2024 02 12 09:20:00 │ SHORT        │ -0.51% │ 51.50%  │ 0.09       │ rsiDivergency5m │
// │  362 │ IMXUSDT      │ 2024 02 12 11:30:00 │ 2024 02 12 13:05:00 │ SHORT        │ -0.51% │ 50.99%  │ 3.05       │ rsiDivergency5m │
// │  363 │ NTRNUSDT     │ 2024 02 12 19:50:00 │ 2024 02 12 20:25:00 │ SHORT        │ -0.51% │ 50.00%  │ 1.28       │ rsiDivergency5m │
// │  364 │ NTRNUSDT     │ 2024 02 12 22:25:00 │ 2024 02 13 06:45:00 │ SHORT        │ 0.39%  │ 49.37%  │ 1.34       │ rsiDivergency5m │
// │  365 │ ARUSDT       │ 2024 02 13 00:35:00 │ 2024 02 13 08:55:00 │ SHORT        │ 0.14%  │ 50.10%  │ 9.51       │ rsiDivergency5m │
// │  366 │ AIUSDT       │ 2024 02 13 06:50:00 │ 2024 02 13 15:10:00 │ SHORT        │ 0.32%  │ 24.94%  │ 1.63       │ rsiDivergency5m │
// │  367 │ COTIUSDT     │ 2024 02 13 14:10:00 │ 2024 02 13 22:30:00 │ LONG         │ 0.18%  │ 49.77%  │ 0.09       │ rsiDivergency5m │
// │  368 │ CKBUSDT      │ 2024 02 14 01:50:00 │ 2024 02 14 05:15:00 │ LONG         │ 2.49%  │ 52.26%  │ 0.01       │ rsiDivergency5m │
// │  369 │ TRUUSDT      │ 2024 02 14 06:40:00 │ 2024 02 14 15:00:00 │ SHORT        │ 0.73%  │ 52.98%  │ 0.06       │ rsiDivergency5m │
// │  370 │ KLAYUSDT     │ 2024 02 14 16:20:00 │ 2024 02 14 19:30:00 │ SHORT        │ -0.51% │ 52.47%  │ 0.24       │ rsiDivergency5m │
// │  371 │ BIGTIMEUSDT  │ 2024 02 14 20:45:00 │ 2024 02 15 05:05:00 │ SHORT        │ 1.35%  │ 53.82%  │ 0.46       │ rsiDivergency5m │
// │  372 │ BEAMXUSDT    │ 2024 02 15 13:05:00 │ 2024 02 15 21:25:00 │ LONG         │ 0.26%  │ 50.23%  │ 0.03       │ rsiDivergency5m │
// │  373 │ ARUSDT       │ 2024 02 15 16:05:00 │ 2024 02 15 18:35:00 │ SHORT        │ -0.51% │ 53.51%  │ 11.53      │ rsiDivergency5m │
// │  374 │ ARUSDT       │ 2024 02 15 18:45:00 │ 2024 02 15 18:50:00 │ SHORT        │ -0.51% │ 52.99%  │ 11.83      │ rsiDivergency5m │
// │  375 │ ARUSDT       │ 2024 02 15 19:05:00 │ 2024 02 15 19:10:00 │ SHORT        │ -0.51% │ 52.48%  │ 12.42      │ rsiDivergency5m │
// │  376 │ WLDUSDT      │ 2024 02 15 20:10:00 │ 2024 02 15 20:25:00 │ SHORT        │ -0.51% │ 51.97%  │ 3.49       │ rsiDivergency5m │
// │  377 │ WLDUSDT      │ 2024 02 15 20:30:00 │ 2024 02 15 21:20:00 │ SHORT        │ -0.51% │ 51.46%  │ 3.54       │ rsiDivergency5m │
// │  378 │ RNDRUSDT     │ 2024 02 15 22:35:00 │ 2024 02 15 23:40:00 │ SHORT        │ -0.51% │ 50.94%  │ 5.42       │ rsiDivergency5m │
// │  379 │ NMRUSDT      │ 2024 02 16 02:25:00 │ 2024 02 16 05:00:00 │ SHORT        │ -0.51% │ 50.43%  │ 30.10      │ rsiDivergency5m │
// │  380 │ TOKENUSDT    │ 2024 02 16 06:00:00 │ 2024 02 16 06:05:00 │ SHORT        │ -0.51% │ 57.42%  │ 0.03       │ rsiDivergency5m │
// │  381 │ LEVERUSDT    │ 2024 02 16 09:55:00 │ 2024 02 16 10:10:00 │ LONG         │ -0.51% │ 49.92%  │ 0.00       │ rsiDivergency5m │
// │  382 │ FILUSDT      │ 2024 02 17 15:40:00 │ 2024 02 18 00:00:00 │ SHORT        │ 0.06%  │ 54.21%  │ 6.25       │ rsiDivergency5m │
// │  383 │ ALTUSDT      │ 2024 02 17 16:40:00 │ 2024 02 17 22:30:00 │ SHORT        │ -0.51% │ 16.11%  │ 0.43       │ rsiDivergency5m │
// │  384 │ AIUSDT       │ 2024 02 17 20:40:00 │ 2024 02 17 21:35:00 │ SHORT        │ -0.51% │ 24.26%  │ 1.70       │ rsiDivergency5m │
// │  385 │ LPTUSDT      │ 2024 02 18 01:00:00 │ 2024 02 18 01:30:00 │ LONG         │ -0.51% │ 53.70%  │ 17.32      │ rsiDivergency5m │
// │  386 │ LPTUSDT      │ 2024 02 18 11:30:00 │ 2024 02 18 12:40:00 │ SHORT        │ -0.51% │ 54.07%  │ 19.14      │ rsiDivergency5m │
// │  387 │ STXUSDT      │ 2024 02 19 03:05:00 │ 2024 02 19 04:20:00 │ SHORT        │ -0.51% │ 53.81%  │ 2.83       │ rsiDivergency5m │
// │  388 │ ONDOUSDT     │ 2024 02 19 06:55:00 │ 2024 02 19 07:10:00 │ SHORT        │ -0.51% │ 20.88%  │ 0.30       │ rsiDivergency5m │
// │  389 │ RIFUSDT      │ 2024 02 19 13:05:00 │ 2024 02 19 15:00:00 │ LONG         │ -0.51% │ 50.47%  │ 0.22       │ rsiDivergency5m │
// │  390 │ SSVUSDT      │ 2024 02 19 13:35:00 │ 2024 02 19 21:55:00 │ SHORT        │ 1.03%  │ 55.46%  │ 36.06      │ rsiDivergency5m │
// │  391 │ RIFUSDT      │ 2024 02 19 15:15:00 │ 2024 02 19 19:40:00 │ LONG         │ -0.51% │ 49.96%  │ 0.21       │ rsiDivergency5m │
// │  392 │ LPTUSDT      │ 2024 02 19 22:05:00 │ 2024 02 19 22:40:00 │ LONG         │ -0.51% │ 54.95%  │ 15.96      │ rsiDivergency5m │
// │  393 │ FETUSDT      │ 2024 02 19 23:25:00 │ 2024 02 20 07:45:00 │ LONG         │ 0.10%  │ 55.05%  │ 0.94       │ rsiDivergency5m │
// │  394 │ UMAUSDT      │ 2024 02 20 09:40:00 │ 2024 02 20 10:25:00 │ LONG         │ -0.51% │ 54.53%  │ 4.08       │ rsiDivergency5m │
// │  395 │ ARUSDT       │ 2024 02 20 10:10:00 │ 2024 02 20 10:25:00 │ LONG         │ -0.51% │ 54.02%  │ 14.75      │ rsiDivergency5m │
// │  396 │ PIXELUSDT    │ 2024 02 20 10:15:00 │ 2024 02 20 10:20:00 │ LONG         │ -0.51% │ -0.51%  │ 0.51       │ rsiDivergency5m │
// │  397 │ MTLUSDT      │ 2024 02 20 12:00:00 │ 2024 02 20 20:20:00 │ LONG         │ 1.04%  │ 54.54%  │ 1.62       │ rsiDivergency5m │
// │  398 │ HIGHUSDT     │ 2024 02 20 21:25:00 │ 2024 02 21 02:00:00 │ LONG         │ -0.51% │ 54.03%  │ 1.61       │ rsiDivergency5m │
// │  399 │ IOTAUSDT     │ 2024 02 21 01:40:00 │ 2024 02 21 04:25:00 │ LONG         │ -0.51% │ 53.52%  │ 0.28       │ rsiDivergency5m │
// │  400 │ ANKRUSDT     │ 2024 02 21 05:10:00 │ 2024 02 21 12:40:00 │ LONG         │ -0.51% │ 53.01%  │ 0.03       │ rsiDivergency5m │
// │  401 │ SUPERUSDT    │ 2024 02 21 09:20:00 │ 2024 02 21 17:40:00 │ LONG         │ 0.88%  │ 48.56%  │ 1.02       │ rsiDivergency5m │
// │  402 │ RSRUSDT      │ 2024 02 22 01:05:00 │ 2024 02 22 03:00:00 │ SHORT        │ -0.51% │ 52.98%  │ 0.00       │ rsiDivergency5m │
// │  403 │ DENTUSDT     │ 2024 02 22 03:20:00 │ 2024 02 22 04:00:00 │ SHORT        │ -0.51% │ 52.47%  │ 0.00       │ rsiDivergency5m │
// │  404 │ HFTUSDT      │ 2024 02 22 04:55:00 │ 2024 02 22 13:15:00 │ SHORT        │ 0.03%  │ 52.50%  │ 0.38       │ rsiDivergency5m │
// │  405 │ CKBUSDT      │ 2024 02 22 22:25:00 │ 2024 02 23 06:45:00 │ LONG         │ 0.18%  │ 52.17%  │ 0.01       │ rsiDivergency5m │
// │  406 │ NMRUSDT      │ 2024 02 23 20:30:00 │ 2024 02 23 21:00:00 │ LONG         │ -0.51% │ 52.10%  │ 30.88      │ rsiDivergency5m │
// │  407 │ FILUSDT      │ 2024 02 23 21:00:00 │ 2024 02 24 05:20:00 │ LONG         │ 0.95%  │ 53.05%  │ 7.73       │ rsiDivergency5m │
// │  408 │ YFIUSDT      │ 2024 02 24 05:25:00 │ 2024 02 24 05:30:00 │ SHORT        │ -0.51% │ 52.53%  │ 8790.00    │ rsiDivergency5m │
// │  409 │ YFIUSDT      │ 2024 02 24 06:05:00 │ 2024 02 24 06:15:00 │ SHORT        │ -0.51% │ 52.02%  │ 8908.00    │ rsiDivergency5m │
// │  410 │ TLMUSDT      │ 2024 02 24 07:40:00 │ 2024 02 24 07:45:00 │ SHORT        │ -0.51% │ 51.51%  │ 0.02       │ rsiDivergency5m │
// │  411 │ TLMUSDT      │ 2024 02 24 07:50:00 │ 2024 02 24 16:10:00 │ SHORT        │ 1.58%  │ 53.09%  │ 0.02       │ rsiDivergency5m │
// │  412 │ ALPHAUSDT    │ 2024 02 25 02:50:00 │ 2024 02 25 11:10:00 │ SHORT        │ 0.45%  │ 54.48%  │ 0.14       │ rsiDivergency5m │
// │  413 │ SSVUSDT      │ 2024 02 25 22:40:00 │ 2024 02 26 07:00:00 │ SHORT        │ 0.84%  │ 56.15%  │ 35.35      │ rsiDivergency5m │
// │  414 │ GALAUSDT     │ 2024 02 26 07:20:00 │ 2024 02 26 15:40:00 │ LONG         │ 0.84%  │ 56.99%  │ 0.03       │ rsiDivergency5m │
// │  415 │ NTRNUSDT     │ 2024 02 26 19:20:00 │ 2024 02 26 21:15:00 │ SHORT        │ -0.51% │ 56.91%  │ 1.83       │ rsiDivergency5m │
// │  416 │ NTRNUSDT     │ 2024 02 26 22:20:00 │ 2024 02 27 06:40:00 │ SHORT        │ 1.71%  │ 58.62%  │ 1.92       │ rsiDivergency5m │
// │  417 │ LQTYUSDT     │ 2024 02 26 22:30:00 │ 2024 02 27 05:30:00 │ SHORT        │ -0.51% │ 56.48%  │ 1.65       │ rsiDivergency5m │
// │  418 │ DOGEUSDT     │ 2024 02 27 05:20:00 │ 2024 02 27 08:35:00 │ SHORT        │ -0.51% │ 55.96%  │ 0.10       │ rsiDivergency5m │
// │  419 │ ENJUSDT      │ 2024 02 27 12:35:00 │ 2024 02 27 13:05:00 │ SHORT        │ -0.51% │ 55.45%  │ 0.41       │ rsiDivergency5m │
// │  420 │ GALAUSDT     │ 2024 02 27 13:40:00 │ 2024 02 27 14:40:00 │ SHORT        │ -0.51% │ 54.94%  │ 0.04       │ rsiDivergency5m │
// │  421 │ GALAUSDT     │ 2024 02 27 14:55:00 │ 2024 02 27 17:50:00 │ SHORT        │ -0.51% │ 54.43%  │ 0.04       │ rsiDivergency5m │
// │  422 │ GALAUSDT     │ 2024 02 27 17:55:00 │ 2024 02 28 01:10:00 │ SHORT        │ 2.49%  │ 56.91%  │ 0.04       │ rsiDivergency5m │
// │  423 │ PENDLEUSDT   │ 2024 02 28 04:55:00 │ 2024 02 28 13:15:00 │ SHORT        │ 1.92%  │ 58.84%  │ 3.13       │ rsiDivergency5m │
// │  424 │ GASUSDT      │ 2024 02 28 13:10:00 │ 2024 02 28 13:20:00 │ LONG         │ -0.51% │ 53.19%  │ 6.12       │ rsiDivergency5m │
// │  425 │ LSKUSDT      │ 2024 02 28 13:10:00 │ 2024 02 28 13:20:00 │ LONG         │ -0.51% │ 21.24%  │ 1.34       │ rsiDivergency5m │
// │  426 │ GASUSDT      │ 2024 02 28 13:25:00 │ 2024 02 28 21:45:00 │ LONG         │ 1.39%  │ 54.58%  │ 6.05       │ rsiDivergency5m │
// │  427 │ LSKUSDT      │ 2024 02 28 13:25:00 │ 2024 02 28 20:30:00 │ LONG         │ 2.49%  │ 23.73%  │ 1.32       │ rsiDivergency5m │
// │  428 │ SUIUSDT      │ 2024 02 28 13:25:00 │ 2024 02 28 21:45:00 │ LONG         │ 1.55%  │ 60.39%  │ 1.52       │ rsiDivergency5m │
// │  429 │ NKNUSDT      │ 2024 02 28 21:05:00 │ 2024 02 29 04:00:00 │ SHORT        │ -0.51% │ 59.87%  │ 0.14       │ rsiDivergency5m │
// │  430 │ ANKRUSDT     │ 2024 02 29 03:55:00 │ 2024 02 29 12:15:00 │ SHORT        │ 0.52%  │ 60.39%  │ 0.04       │ rsiDivergency5m │
// │  431 │ HOTUSDT      │ 2024 02 29 16:25:00 │ 2024 02 29 17:35:00 │ LONG         │ -0.51% │ 59.88%  │ 0.00       │ rsiDivergency5m │
// │  432 │ RIFUSDT      │ 2024 02 29 16:25:00 │ 2024 02 29 17:35:00 │ LONG         │ -0.51% │ 51.99%  │ 0.21       │ rsiDivergency5m │
// │  433 │ DOGEUSDT     │ 2024 02 29 17:20:00 │ 2024 02 29 17:35:00 │ LONG         │ -0.51% │ 59.37%  │ 0.12       │ rsiDivergency5m │
// │  434 │ YGGUSDT      │ 2024 02 29 20:50:00 │ 2024 02 29 21:30:00 │ SHORT        │ -0.51% │ 58.86%  │ 0.74       │ rsiDivergency5m │
// │  435 │ WLDUSDT      │ 2024 02 29 22:40:00 │ 2024 02 29 23:20:00 │ SHORT        │ -0.51% │ 57.83%  │ 8.09       │ rsiDivergency5m │
// │  436 │ YGGUSDT      │ 2024 02 29 23:30:00 │ 2024 03 01 01:45:00 │ SHORT        │ 2.49%  │ 60.32%  │ 0.80       │ rsiDivergency5m │
// │  437 │ FRONTUSDT    │ 2024 03 01 04:05:00 │ 2024 03 01 04:50:00 │ SHORT        │ -0.51% │ 58.78%  │ 0.62       │ rsiDivergency5m │
// │  438 │ FRONTUSDT    │ 2024 03 01 04:55:00 │ 2024 03 01 13:15:00 │ SHORT        │ 0.04%  │ 58.82%  │ 0.63       │ rsiDivergency5m │
// │  439 │ ONDOUSDT     │ 2024 03 01 12:10:00 │ 2024 03 01 12:45:00 │ SHORT        │ -0.51% │ 23.97%  │ 0.51       │ rsiDivergency5m │
// │  440 │ PENDLEUSDT   │ 2024 03 01 14:20:00 │ 2024 03 01 22:40:00 │ SHORT        │ 1.61%  │ 60.43%  │ 3.65       │ rsiDivergency5m │
// │  441 │ EOSUSDT      │ 2024 03 01 21:20:00 │ 2024 03 01 22:05:00 │ SHORT        │ -0.51% │ 59.92%  │ 0.98       │ rsiDivergency5m │
// │  442 │ EOSUSDT      │ 2024 03 01 22:10:00 │ 2024 03 01 23:05:00 │ SHORT        │ -0.51% │ 59.41%  │ 1.00       │ rsiDivergency5m │
// │  443 │ MAVUSDT      │ 2024 03 02 02:15:00 │ 2024 03 02 03:10:00 │ SHORT        │ -0.51% │ 58.89%  │ 0.74       │ rsiDivergency5m │
// │  444 │ MAVUSDT      │ 2024 03 02 03:15:00 │ 2024 03 02 11:35:00 │ SHORT        │ 0.83%  │ 59.72%  │ 0.76       │ rsiDivergency5m │
// │  445 │ 1000BONKUSDT │ 2024 03 02 03:35:00 │ 2024 03 02 04:35:00 │ SHORT        │ 2.49%  │ 56.19%  │ 0.03       │ rsiDivergency5m │
// │  446 │ PIXELUSDT    │ 2024 03 02 07:35:00 │ 2024 03 02 15:55:00 │ SHORT        │ 0.43%  │ 2.34%   │ 0.55       │ rsiDivergency5m │
// │  447 │ ARBUSDT      │ 2024 03 03 00:25:00 │ 2024 03 03 02:25:00 │ SHORT        │ 2.49%  │ 64.70%  │ 2.18       │ rsiDivergency5m │
// │  448 │ ENSUSDT      │ 2024 03 03 03:20:00 │ 2024 03 03 11:40:00 │ LONG         │ 1.02%  │ 65.21%  │ 21.56      │ rsiDivergency5m │
// │  449 │ FRONTUSDT    │ 2024 03 03 13:25:00 │ 2024 03 03 21:45:00 │ SHORT        │ 1.01%  │ 66.22%  │ 0.74       │ rsiDivergency5m │
// │  450 │ ORDIUSDT     │ 2024 03 03 14:10:00 │ 2024 03 03 22:05:00 │ LONG         │ 2.49%  │ 53.76%  │ 78.74      │ rsiDivergency5m │
// │  451 │ SXPUSDT      │ 2024 03 03 20:35:00 │ 2024 03 03 20:50:00 │ SHORT        │ -0.51% │ 65.70%  │ 0.52       │ rsiDivergency5m │
// │  452 │ SXPUSDT      │ 2024 03 03 21:10:00 │ 2024 03 04 05:10:00 │ SHORT        │ 2.49%  │ 68.19%  │ 0.54       │ rsiDivergency5m │
// │  453 │ CRVUSDT      │ 2024 03 04 06:15:00 │ 2024 03 04 08:35:00 │ SHORT        │ -0.51% │ 67.68%  │ 0.74       │ rsiDivergency5m │
// │  454 │ BIGTIMEUSDT  │ 2024 03 04 12:50:00 │ 2024 03 04 21:10:00 │ LONG         │ 0.58%  │ 68.25%  │ 0.46       │ rsiDivergency5m │
// │  455 │ NTRNUSDT     │ 2024 03 04 12:50:00 │ 2024 03 04 21:10:00 │ LONG         │ 0.83%  │ 53.51%  │ 1.39       │ rsiDivergency5m │
// │  456 │ PENDLEUSDT   │ 2024 03 04 22:10:00 │ 2024 03 05 06:30:00 │ LONG         │ 0.73%  │ 68.47%  │ 2.94       │ rsiDivergency5m │
// │  457 │ MANTAUSDT    │ 2024 03 05 09:35:00 │ 2024 03 05 10:25:00 │ LONG         │ -0.51% │ 23.59%  │ 2.94       │ rsiDivergency5m │
// │  458 │ ZETAUSDT     │ 2024 03 05 09:50:00 │ 2024 03 05 11:05:00 │ LONG         │ -0.51% │ 22.10%  │ 2.14       │ rsiDivergency5m │
// │  459 │ ONDOUSDT     │ 2024 03 06 02:00:00 │ 2024 03 06 02:20:00 │ SHORT        │ -0.51% │ 23.52%  │ 0.53       │ rsiDivergency5m │
// │  460 │ ONGUSDT      │ 2024 03 06 02:40:00 │ 2024 03 06 11:00:00 │ SHORT        │ 1.12%  │ 53.72%  │ 0.41       │ rsiDivergency5m │
// │  461 │ 1000SATSUSDT │ 2024 03 06 03:20:00 │ 2024 03 06 07:45:00 │ SHORT        │ 2.49%  │ 48.22%  │ 0.00       │ rsiDivergency5m │
// │  462 │ RDNTUSDT     │ 2024 03 06 06:20:00 │ 2024 03 06 14:40:00 │ SHORT        │ 0.33%  │ 69.01%  │ 0.40       │ rsiDivergency5m │
// │  463 │ HIGHUSDT     │ 2024 03 06 18:55:00 │ 2024 03 06 19:45:00 │ SHORT        │ -0.51% │ 67.99%  │ 2.03       │ rsiDivergency5m │
// │  464 │ ROSEUSDT     │ 2024 03 06 19:40:00 │ 2024 03 06 20:10:00 │ SHORT        │ -0.51% │ 67.47%  │ 0.17       │ rsiDivergency5m │
// │  465 │ EGLDUSDT     │ 2024 03 06 19:50:00 │ 2024 03 07 04:10:00 │ SHORT        │ 0.00%  │ 67.48%  │ 66.78      │ rsiDivergency5m │
// │  466 │ ACEUSDT      │ 2024 03 06 19:55:00 │ 2024 03 07 04:15:00 │ SHORT        │ 0.19%  │ 43.86%  │ 12.93      │ rsiDivergency5m │
// │  467 │ ALTUSDT      │ 2024 03 07 05:15:00 │ 2024 03 07 08:35:00 │ SHORT        │ -0.51% │ 23.74%  │ 0.55       │ rsiDivergency5m │
// │  468 │ MYROUSDT     │ 2024 03 08 17:55:00 │ 2024 03 08 18:05:00 │ SHORT        │ -0.51% │ -3.79%  │ 0.40       │ rsiDivergency5m │
// │  469 │ STGUSDT      │ 2024 03 09 01:20:00 │ 2024 03 09 09:40:00 │ SHORT        │ 0.70%  │ 71.34%  │ 0.77       │ rsiDivergency5m │
// │  470 │ ZETAUSDT     │ 2024 03 09 01:50:00 │ 2024 03 09 10:10:00 │ SHORT        │ 0.99%  │ 24.91%  │ 2.50       │ rsiDivergency5m │
// │  471 │ PIXELUSDT    │ 2024 03 09 06:30:00 │ 2024 03 09 07:00:00 │ SHORT        │ -0.51% │ 16.04%  │ 0.74       │ rsiDivergency5m │
// │  472 │ NMRUSDT      │ 2024 03 09 16:05:00 │ 2024 03 09 16:20:00 │ SHORT        │ -0.51% │ 69.81%  │ 47.89      │ rsiDivergency5m │
// │  473 │ NMRUSDT      │ 2024 03 09 17:10:00 │ 2024 03 09 18:05:00 │ SHORT        │ -0.51% │ 69.29%  │ 50.73      │ rsiDivergency5m │
// │  474 │ MINAUSDT     │ 2024 03 09 20:25:00 │ 2024 03 10 02:15:00 │ SHORT        │ -0.51% │ 67.76%  │ 1.46       │ rsiDivergency5m │
// │  475 │ STXUSDT      │ 2024 03 10 06:10:00 │ 2024 03 10 14:30:00 │ SHORT        │ 2.19%  │ 72.44%  │ 3.28       │ rsiDivergency5m │
// │  476 │ 1000SHIBUSDT │ 2024 03 10 19:45:00 │ 2024 03 10 19:50:00 │ LONG         │ -0.51% │ 71.92%  │ 0.03       │ rsiDivergency5m │
// │  477 │ REEFUSDT     │ 2024 03 10 20:40:00 │ 2024 03 11 04:00:00 │ LONG         │ 2.49%  │ 73.90%  │ 0.00       │ rsiDivergency5m │
// │  478 │ STGUSDT      │ 2024 03 11 05:00:00 │ 2024 03 11 13:20:00 │ SHORT        │ 0.30%  │ 74.20%  │ 0.82       │ rsiDivergency5m │
// │  479 │ BEAMXUSDT    │ 2024 03 11 09:45:00 │ 2024 03 11 11:20:00 │ LONG         │ -0.51% │ 49.84%  │ 0.04       │ rsiDivergency5m │
// │  480 │ XRPUSDT      │ 2024 03 11 12:15:00 │ 2024 03 11 20:35:00 │ SHORT        │ 0.82%  │ 75.02%  │ 0.74       │ rsiDivergency5m │
// │  481 │ 1000SATSUSDT │ 2024 03 11 20:55:00 │ 2024 03 12 01:30:00 │ SHORT        │ 2.49%  │ 50.57%  │ 0.00       │ rsiDivergency5m │
// │  482 │ XRPUSDT      │ 2024 03 11 23:05:00 │ 2024 03 12 07:25:00 │ LONG         │ 0.03%  │ 75.05%  │ 0.69       │ rsiDivergency5m │
// │  483 │ MANTAUSDT    │ 2024 03 12 13:45:00 │ 2024 03 12 14:35:00 │ SHORT        │ -0.51% │ 35.97%  │ 3.93       │ rsiDivergency5m │
// │  484 │ SNXUSDT      │ 2024 03 12 16:00:00 │ 2024 03 13 00:20:00 │ SHORT        │ 0.14%  │ 77.68%  │ 5.13       │ rsiDivergency5m │
// │  485 │ ZILUSDT      │ 2024 03 13 00:20:00 │ 2024 03 13 01:05:00 │ SHORT        │ -0.51% │ 77.17%  │ 0.04       │ rsiDivergency5m │
// │  486 │ BEAMXUSDT    │ 2024 03 13 01:00:00 │ 2024 03 13 09:20:00 │ LONG         │ -0.01% │ 50.84%  │ 0.04       │ rsiDivergency5m │
// │  487 │ ZILUSDT      │ 2024 03 13 01:40:00 │ 2024 03 13 01:55:00 │ SHORT        │ -0.51% │ 76.65%  │ 0.04       │ rsiDivergency5m │
// │  488 │ FXSUSDT      │ 2024 03 13 03:05:00 │ 2024 03 13 11:25:00 │ SHORT        │ 0.60%  │ 77.26%  │ 10.06      │ rsiDivergency5m │
// │  489 │ 1000BONKUSDT │ 2024 03 13 14:20:00 │ 2024 03 13 14:30:00 │ SHORT        │ -0.51% │ 52.99%  │ 0.03       │ rsiDivergency5m │
// │  490 │ SUPERUSDT    │ 2024 03 14 01:50:00 │ 2024 03 14 07:35:00 │ LONG         │ -0.51% │ 57.31%  │ 1.40       │ rsiDivergency5m │
// │  491 │ LRCUSDT      │ 2024 03 14 03:25:00 │ 2024 03 14 06:30:00 │ SHORT        │ -0.51% │ 75.52%  │ 0.52       │ rsiDivergency5m │
// │  492 │ AMBUSDT      │ 2024 03 14 08:40:00 │ 2024 03 14 08:55:00 │ LONG         │ -0.51% │ 74.49%  │ 0.01       │ rsiDivergency5m │
// │  493 │ C98USDT      │ 2024 03 14 08:40:00 │ 2024 03 14 08:55:00 │ LONG         │ -0.51% │ 73.98%  │ 0.41       │ rsiDivergency5m │
// │  494 │ SKLUSDT      │ 2024 03 14 08:40:00 │ 2024 03 14 08:50:00 │ LONG         │ -0.51% │ 73.47%  │ 0.11       │ rsiDivergency5m │
// │  495 │ KAVAUSDT     │ 2024 03 14 08:55:00 │ 2024 03 14 11:30:00 │ LONG         │ -0.51% │ 72.95%  │ 1.05       │ rsiDivergency5m │
// │  496 │ PORTALUSDT   │ 2024 03 14 18:40:00 │ 2024 03 14 22:20:00 │ SHORT        │ 2.49%  │ 12.67%  │ 2.62       │ rsiDivergency5m │
// │  497 │ POWRUSDT     │ 2024 03 14 19:30:00 │ 2024 03 14 22:20:00 │ SHORT        │ 2.49%  │ 62.21%  │ 0.47       │ rsiDivergency5m │
// │  498 │ ANKRUSDT     │ 2024 03 14 22:30:00 │ 2024 03 15 03:35:00 │ LONG         │ -0.51% │ 71.93%  │ 0.05       │ rsiDivergency5m │
// │  499 │ BIGTIMEUSDT  │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 1.06%  │ 72.99%  │ 0.41       │ rsiDivergency5m │
// │  500 │ ORDIUSDT     │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 1.00%  │ 53.49%  │ 67.55      │ rsiDivergency5m │
// │  501 │ RIFUSDT      │ 2024 03 15 06:25:00 │ 2024 03 15 14:45:00 │ LONG         │ 1.23%  │ 69.97%  │ 0.24       │ rsiDivergency5m │
// │  502 │ AMBUSDT      │ 2024 03 15 14:45:00 │ 2024 03 15 17:40:00 │ SHORT        │ -0.51% │ 72.48%  │ 0.02       │ rsiDivergency5m │
// │  503 │ LEVERUSDT    │ 2024 03 15 18:05:00 │ 2024 03 16 02:25:00 │ SHORT        │ 1.71%  │ 74.19%  │ 0.00       │ rsiDivergency5m │
// │  504 │ PORTALUSDT   │ 2024 03 16 08:45:00 │ 2024 03 16 12:20:00 │ LONG         │ -0.51% │ 16.06%  │ 2.28       │ rsiDivergency5m │
// │  505 │ DODOXUSDT    │ 2024 03 16 12:30:00 │ 2024 03 16 13:05:00 │ LONG         │ -0.51% │ 72.65%  │ 0.26       │ rsiDivergency5m │
// │  506 │ HOOKUSDT     │ 2024 03 16 12:45:00 │ 2024 03 16 13:05:00 │ LONG         │ -0.51% │ 72.14%  │ 1.40       │ rsiDivergency5m │
// │  507 │ RIFUSDT      │ 2024 03 16 12:55:00 │ 2024 03 16 13:10:00 │ LONG         │ -0.51% │ 70.83%  │ 0.24       │ rsiDivergency5m │
// │  508 │ MANTAUSDT    │ 2024 03 16 13:10:00 │ 2024 03 16 13:50:00 │ LONG         │ -0.51% │ 39.97%  │ 3.06       │ rsiDivergency5m │
// │  509 │ FLOWUSDT     │ 2024 03 16 13:30:00 │ 2024 03 16 13:55:00 │ LONG         │ -0.51% │ 71.11%  │ 1.29       │ rsiDivergency5m │
// │  510 │ HFTUSDT      │ 2024 03 16 13:30:00 │ 2024 03 16 13:55:00 │ LONG         │ -0.51% │ 71.63%  │ 0.42       │ rsiDivergency5m │
// │  511 │ APTUSDT      │ 2024 03 16 15:20:00 │ 2024 03 16 23:40:00 │ LONG         │ 2.16%  │ 72.76%  │ 13.10      │ rsiDivergency5m │
// │  512 │ AMBUSDT      │ 2024 03 17 02:20:00 │ 2024 03 17 10:40:00 │ LONG         │ 1.50%  │ 74.26%  │ 0.01       │ rsiDivergency5m │
// │  513 │ ONGUSDT      │ 2024 03 17 15:05:00 │ 2024 03 17 23:25:00 │ SHORT        │ 0.50%  │ 54.22%  │ 0.39       │ rsiDivergency5m │
// │  514 │ RIFUSDT      │ 2024 03 17 19:40:00 │ 2024 03 17 20:00:00 │ LONG         │ -0.51% │ 71.41%  │ 0.25       │ rsiDivergency5m │
// │  515 │ SUIUSDT      │ 2024 03 18 01:20:00 │ 2024 03 18 01:40:00 │ SHORT        │ -0.51% │ 73.43%  │ 1.72       │ rsiDivergency5m │
// │  516 │ LPTUSDT      │ 2024 03 18 03:15:00 │ 2024 03 18 07:15:00 │ LONG         │ -0.51% │ 72.91%  │ 20.70      │ rsiDivergency5m │
// │  517 │ USTCUSDT     │ 2024 03 18 20:50:00 │ 2024 03 18 22:35:00 │ LONG         │ -0.51% │ 52.48%  │ 0.03       │ rsiDivergency5m │
// │  518 │ MKRUSDT      │ 2024 03 19 07:25:00 │ 2024 03 19 07:45:00 │ SHORT        │ -0.51% │ 73.37%  │ 2934.20    │ rsiDivergency5m │
// │  519 │ VANRYUSDT    │ 2024 03 19 12:05:00 │ 2024 03 19 12:15:00 │ SHORT        │ -0.51% │ -4.15%  │ 0.30       │ rsiDivergency5m │
// │  520 │ DENTUSDT     │ 2024 03 19 12:15:00 │ 2024 03 19 20:35:00 │ SHORT        │ 1.76%  │ 74.62%  │ 0.00       │ rsiDivergency5m │
// │  521 │ SUPERUSDT    │ 2024 03 19 18:05:00 │ 2024 03 20 00:20:00 │ LONG         │ -0.51% │ 50.35%  │ 1.09       │ rsiDivergency5m │
// │  522 │ STRKUSDT     │ 2024 03 19 18:15:00 │ 2024 03 20 02:35:00 │ LONG         │ 1.06%  │ 20.75%  │ 1.89       │ rsiDivergency5m │
// │  523 │ SKLUSDT      │ 2024 03 19 22:40:00 │ 2024 03 20 02:30:00 │ SHORT        │ -0.51% │ 74.11%  │ 0.09       │ rsiDivergency5m │
// │  524 │ AIUSDT       │ 2024 03 20 00:10:00 │ 2024 03 20 00:20:00 │ LONG         │ -0.51% │ 45.52%  │ 1.52       │ rsiDivergency5m │
// │  525 │ ALTUSDT      │ 2024 03 20 00:10:00 │ 2024 03 20 00:25:00 │ LONG         │ -0.51% │ 35.45%  │ 0.42       │ rsiDivergency5m │
// │  526 │ TOKENUSDT    │ 2024 03 20 00:10:00 │ 2024 03 20 00:25:00 │ LONG         │ -0.51% │ 58.34%  │ 0.06       │ rsiDivergency5m │
// │  527 │ CKBUSDT      │ 2024 03 20 03:30:00 │ 2024 03 20 10:10:00 │ SHORT        │ -0.51% │ 73.59%  │ 0.02       │ rsiDivergency5m │
// │  528 │ POWRUSDT     │ 2024 03 20 03:30:00 │ 2024 03 20 06:05:00 │ SHORT        │ -0.51% │ 69.77%  │ 0.34       │ rsiDivergency5m │
// │  529 │ POLYXUSDT    │ 2024 03 20 05:10:00 │ 2024 03 20 05:40:00 │ SHORT        │ -0.51% │ 68.78%  │ 0.23       │ rsiDivergency5m │
// │  530 │ POLYXUSDT    │ 2024 03 20 06:10:00 │ 2024 03 20 06:30:00 │ SHORT        │ -0.51% │ 68.27%  │ 0.25       │ rsiDivergency5m │
// │  531 │ POWRUSDT     │ 2024 03 20 06:35:00 │ 2024 03 20 07:25:00 │ SHORT        │ -0.51% │ 69.26%  │ 0.35       │ rsiDivergency5m │
// │  532 │ RIFUSDT      │ 2024 03 20 13:55:00 │ 2024 03 20 14:40:00 │ SHORT        │ -0.51% │ 76.74%  │ 0.23       │ rsiDivergency5m │
// │  533 │ 1000BONKUSDT │ 2024 03 20 14:50:00 │ 2024 03 20 15:20:00 │ SHORT        │ -0.51% │ 51.28%  │ 0.02       │ rsiDivergency5m │
// │  534 │ SUPERUSDT    │ 2024 03 20 15:45:00 │ 2024 03 20 22:05:00 │ SHORT        │ -0.51% │ 49.77%  │ 1.24       │ rsiDivergency5m │
// │  535 │ IOSTUSDT     │ 2024 03 20 19:45:00 │ 2024 03 21 04:05:00 │ SHORT        │ 0.35%  │ 75.41%  │ 0.01       │ rsiDivergency5m │
// │  536 │ HIFIUSDT     │ 2024 03 20 20:15:00 │ 2024 03 20 21:10:00 │ SHORT        │ -0.51% │ 75.06%  │ 1.00       │ rsiDivergency5m │
// │  537 │ POWRUSDT     │ 2024 03 20 21:20:00 │ 2024 03 21 05:40:00 │ SHORT        │ 0.67%  │ 70.64%  │ 0.39       │ rsiDivergency5m │
// │  538 │ ONGUSDT      │ 2024 03 20 21:40:00 │ 2024 03 21 06:00:00 │ SHORT        │ -0.29% │ 50.86%  │ 0.37       │ rsiDivergency5m │
// │  539 │ WAXPUSDT     │ 2024 03 21 04:05:00 │ 2024 03 21 12:25:00 │ SHORT        │ 0.19%  │ 73.94%  │ 0.09       │ rsiDivergency5m │
// │  540 │ SNXUSDT      │ 2024 03 21 06:25:00 │ 2024 03 21 09:20:00 │ SHORT        │ -0.51% │ 74.38%  │ 4.28       │ rsiDivergency5m │
// │  541 │ STXUSDT      │ 2024 03 22 01:55:00 │ 2024 03 22 10:15:00 │ SHORT        │ 1.31%  │ 75.70%  │ 3.65       │ rsiDivergency5m │
// │  542 │ ONDOUSDT     │ 2024 03 22 12:45:00 │ 2024 03 22 17:35:00 │ SHORT        │ 2.49%  │ 46.97%  │ 0.79       │ rsiDivergency5m │
// │  543 │ STXUSDT      │ 2024 03 22 19:30:00 │ 2024 03 23 03:50:00 │ SHORT        │ 0.44%  │ 76.37%  │ 3.56       │ rsiDivergency5m │
// │  544 │ RIFUSDT      │ 2024 03 23 10:25:00 │ 2024 03 23 10:30:00 │ SHORT        │ -0.51% │ 73.16%  │ 0.26       │ rsiDivergency5m │
// │  545 │ DOGEUSDT     │ 2024 03 23 12:30:00 │ 2024 03 23 20:50:00 │ SHORT        │ 1.10%  │ 76.44%  │ 0.17       │ rsiDivergency5m │
// │  546 │ DARUSDT      │ 2024 03 23 12:45:00 │ 2024 03 23 13:20:00 │ SHORT        │ -0.51% │ 75.34%  │ 0.24       │ rsiDivergency5m │
// │  547 │ SUPERUSDT    │ 2024 03 23 13:30:00 │ 2024 03 23 13:35:00 │ SHORT        │ -0.51% │ 51.71%  │ 1.28       │ rsiDivergency5m │
// │  548 │ SUPERUSDT    │ 2024 03 23 13:45:00 │ 2024 03 23 14:10:00 │ SHORT        │ -0.51% │ 51.20%  │ 1.32       │ rsiDivergency5m │
// │  549 │ SUPERUSDT    │ 2024 03 23 14:15:00 │ 2024 03 23 22:35:00 │ SHORT        │ 1.11%  │ 52.31%  │ 1.35       │ rsiDivergency5m │
// │  550 │ ONGUSDT      │ 2024 03 23 19:50:00 │ 2024 03 23 22:25:00 │ SHORT        │ 2.49%  │ 53.33%  │ 0.42       │ rsiDivergency5m │
// │  551 │ LSKUSDT      │ 2024 03 23 21:15:00 │ 2024 03 24 05:25:00 │ SHORT        │ -0.51% │ 38.43%  │ 1.95       │ rsiDivergency5m │
// │  552 │ WLDUSDT      │ 2024 03 23 22:20:00 │ 2024 03 24 06:40:00 │ LONG         │ -0.09% │ 76.35%  │ 8.29       │ rsiDivergency5m │
// │  553 │ FRONTUSDT    │ 2024 03 24 15:25:00 │ 2024 03 24 23:45:00 │ SHORT        │ 0.03%  │ 76.39%  │ 1.27       │ rsiDivergency5m │
// │  554 │ CAKEUSDT     │ 2024 03 24 23:55:00 │ 2024 03 25 08:15:00 │ SHORT        │ 0.89%  │ 70.28%  │ 4.47       │ rsiDivergency5m │
// │  555 │ CKBUSDT      │ 2024 03 25 09:25:00 │ 2024 03 25 17:45:00 │ SHORT        │ 0.58%  │ 78.48%  │ 0.02       │ rsiDivergency5m │
// │  556 │ POWRUSDT     │ 2024 03 25 20:10:00 │ 2024 03 26 04:30:00 │ SHORT        │ -0.20% │ 76.54%  │ 0.42       │ rsiDivergency5m │
// │  557 │ ZETAUSDT     │ 2024 03 26 00:40:00 │ 2024 03 26 09:00:00 │ SHORT        │ 1.00%  │ 37.00%  │ 2.29       │ rsiDivergency5m │
// │  558 │ RENUSDT      │ 2024 03 26 04:40:00 │ 2024 03 26 04:50:00 │ SHORT        │ -0.51% │ 78.89%  │ 0.11       │ rsiDivergency5m │
// │  559 │ ONGUSDT      │ 2024 03 26 07:00:00 │ 2024 03 26 15:20:00 │ SHORT        │ 1.75%  │ 52.52%  │ 0.46       │ rsiDivergency5m │
// │  560 │ FETUSDT      │ 2024 03 27 03:20:00 │ 2024 03 27 05:00:00 │ SHORT        │ -0.51% │ 79.12%  │ 3.20       │ rsiDivergency5m │
// │  561 │ RNDRUSDT     │ 2024 03 27 17:35:00 │ 2024 03 28 01:55:00 │ SHORT        │ 0.19%  │ 81.44%  │ 11.37      │ rsiDivergency5m │
// │  562 │ GMTUSDT      │ 2024 03 28 04:25:00 │ 2024 03 28 07:25:00 │ SHORT        │ 2.49%  │ 83.93%  │ 0.44       │ rsiDivergency5m │
// │  563 │ 1000BONKUSDT │ 2024 03 28 09:55:00 │ 2024 03 28 18:15:00 │ SHORT        │ 0.61%  │ 54.43%  │ 0.03       │ rsiDivergency5m │
// │  564 │ MYROUSDT     │ 2024 03 28 13:00:00 │ 2024 03 28 13:05:00 │ SHORT        │ -0.51% │ 16.62%  │ 0.28       │ rsiDivergency5m │
// │  565 │ SPELLUSDT    │ 2024 03 28 13:15:00 │ 2024 03 28 13:25:00 │ SHORT        │ -0.51% │ 82.90%  │ 0.00       │ rsiDivergency5m │
// │  566 │ SPELLUSDT    │ 2024 03 28 13:30:00 │ 2024 03 28 18:35:00 │ SHORT        │ -0.51% │ 82.39%  │ 0.00       │ rsiDivergency5m │
// │  567 │ ARPAUSDT     │ 2024 03 28 19:10:00 │ 2024 03 28 20:40:00 │ SHORT        │ -0.51% │ 81.88%  │ 0.10       │ rsiDivergency5m │
// │  568 │ IDUSDT       │ 2024 03 28 22:55:00 │ 2024 03 29 02:05:00 │ LONG         │ -0.51% │ 80.34%  │ 1.11       │ rsiDivergency5m │
// │  569 │ MKRUSDT      │ 2024 03 29 02:00:00 │ 2024 03 29 10:20:00 │ LONG         │ 0.24%  │ 80.58%  │ 3524.60    │ rsiDivergency5m │
// │  570 │ TOKENUSDT    │ 2024 03 29 05:20:00 │ 2024 03 29 08:25:00 │ SHORT        │ 2.49%  │ 70.24%  │ 0.21       │ rsiDivergency5m │
// │  571 │ XVGUSDT      │ 2024 03 29 11:45:00 │ 2024 03 29 11:55:00 │ SHORT        │ -0.51% │ 80.06%  │ 0.01       │ rsiDivergency5m │
// │  572 │ MAVUSDT      │ 2024 03 29 12:35:00 │ 2024 03 29 13:45:00 │ LONG         │ -0.51% │ 79.55%  │ 0.68       │ rsiDivergency5m │
// │  573 │ YGGUSDT      │ 2024 03 30 07:05:00 │ 2024 03 30 07:35:00 │ SHORT        │ -0.51% │ 80.56%  │ 1.28       │ rsiDivergency5m │
// │  574 │ YGGUSDT      │ 2024 03 30 07:50:00 │ 2024 03 30 08:00:00 │ SHORT        │ -0.51% │ 80.05%  │ 1.31       │ rsiDivergency5m │
// │  575 │ YGGUSDT      │ 2024 03 30 08:10:00 │ 2024 03 30 08:25:00 │ SHORT        │ -0.51% │ 79.53%  │ 1.33       │ rsiDivergency5m │
// │  576 │ YGGUSDT      │ 2024 03 30 10:10:00 │ 2024 03 30 18:30:00 │ SHORT        │ 1.30%  │ 80.84%  │ 1.43       │ rsiDivergency5m │
// │  577 │ 1000SATSUSDT │ 2024 03 30 21:15:00 │ 2024 03 31 05:35:00 │ SHORT        │ 1.11%  │ 57.82%  │ 0.00       │ rsiDivergency5m │
// │  578 │ TUSDT        │ 2024 03 30 23:55:00 │ 2024 03 31 08:15:00 │ SHORT        │ 1.33%  │ 82.17%  │ 0.06       │ rsiDivergency5m │
// │  579 │ LQTYUSDT     │ 2024 03 31 08:40:00 │ 2024 03 31 09:00:00 │ SHORT        │ -0.51% │ 81.65%  │ 1.84       │ rsiDivergency5m │
// │  580 │ TUSDT        │ 2024 03 31 09:50:00 │ 2024 03 31 18:10:00 │ LONG         │ 0.18%  │ 81.84%  │ 0.05       │ rsiDivergency5m │
// │  581 │ ONDOUSDT     │ 2024 03 31 12:35:00 │ 2024 03 31 12:45:00 │ SHORT        │ -0.51% │ 46.44%  │ 1.00       │ rsiDivergency5m │
// │  582 │ TOKENUSDT    │ 2024 03 31 14:15:00 │ 2024 03 31 19:05:00 │ SHORT        │ 2.49%  │ 77.54%  │ 0.20       │ rsiDivergency5m │
// │  583 │ HIGHUSDT     │ 2024 03 31 22:00:00 │ 2024 03 31 22:25:00 │ SHORT        │ -0.51% │ 81.33%  │ 2.37       │ rsiDivergency5m │
// │  584 │ ANKRUSDT     │ 2024 03 31 23:25:00 │ 2024 04 01 07:45:00 │ SHORT        │ 1.53%  │ 82.86%  │ 0.07       │ rsiDivergency5m │
// │  585 │ LEVERUSDT    │ 2024 04 01 11:00:00 │ 2024 04 01 19:20:00 │ LONG         │ 0.34%  │ 82.18%  │ 0.00       │ rsiDivergency5m │
// │  586 │ PENDLEUSDT   │ 2024 04 01 20:35:00 │ 2024 04 01 21:35:00 │ LONG         │ -0.51% │ 81.15%  │ 5.08       │ rsiDivergency5m │
// │  587 │ UMAUSDT      │ 2024 04 01 22:25:00 │ 2024 04 02 00:20:00 │ LONG         │ -0.51% │ 80.64%  │ 3.94       │ rsiDivergency5m │
// │  588 │ ARBUSDT      │ 2024 04 02 00:20:00 │ 2024 04 02 04:00:00 │ LONG         │ -0.51% │ 80.13%  │ 1.47       │ rsiDivergency5m │
// │  589 │ ANKRUSDT     │ 2024 04 02 03:45:00 │ 2024 04 02 08:30:00 │ LONG         │ -0.51% │ 79.61%  │ 0.06       │ rsiDivergency5m │
// │  590 │ PENDLEUSDT   │ 2024 04 02 09:40:00 │ 2024 04 02 14:00:00 │ SHORT        │ -0.51% │ 79.10%  │ 5.27       │ rsiDivergency5m │
// │  591 │ PENDLEUSDT   │ 2024 04 02 14:55:00 │ 2024 04 02 23:15:00 │ SHORT        │ 1.81%  │ 80.91%  │ 5.47       │ rsiDivergency5m │
// │  592 │ MAVUSDT      │ 2024 04 02 23:30:00 │ 2024 04 03 07:50:00 │ LONG         │ 0.17%  │ 81.08%  │ 0.65       │ rsiDivergency5m │
// │  593 │ LQTYUSDT     │ 2024 04 03 15:35:00 │ 2024 04 03 23:55:00 │ LONG         │ -0.07% │ 83.50%  │ 1.48       │ rsiDivergency5m │
// │  594 │ LEVERUSDT    │ 2024 04 04 04:10:00 │ 2024 04 04 05:00:00 │ SHORT        │ -0.51% │ 82.99%  │ 0.00       │ rsiDivergency5m │
// │  595 │ LEVERUSDT    │ 2024 04 04 05:10:00 │ 2024 04 04 05:20:00 │ SHORT        │ -0.51% │ 82.48%  │ 0.00       │ rsiDivergency5m │
// │  596 │ LEVERUSDT    │ 2024 04 04 05:25:00 │ 2024 04 04 05:55:00 │ SHORT        │ -0.51% │ 81.96%  │ 0.00       │ rsiDivergency5m │
// │  597 │ NMRUSDT      │ 2024 04 04 07:50:00 │ 2024 04 04 11:00:00 │ SHORT        │ -0.51% │ 81.45%  │ 34.60      │ rsiDivergency5m │
// │  598 │ POLYXUSDT    │ 2024 04 04 10:55:00 │ 2024 04 04 19:15:00 │ SHORT        │ 1.51%  │ 77.90%  │ 0.58       │ rsiDivergency5m │
// │  599 │ PENDLEUSDT   │ 2024 04 04 11:30:00 │ 2024 04 04 11:50:00 │ SHORT        │ -0.51% │ 80.94%  │ 5.58       │ rsiDivergency5m │
// │  600 │ SSVUSDT      │ 2024 04 04 12:55:00 │ 2024 04 04 21:15:00 │ SHORT        │ 0.95%  │ 81.88%  │ 53.20      │ rsiDivergency5m │
// │  601 │ XVGUSDT      │ 2024 04 04 22:10:00 │ 2024 04 05 06:30:00 │ LONG         │ 0.63%  │ 82.52%  │ 0.01       │ rsiDivergency5m │
// │  602 │ PIXELUSDT    │ 2024 04 05 00:25:00 │ 2024 04 05 08:45:00 │ LONG         │ 0.82%  │ 24.10%  │ 0.61       │ rsiDivergency5m │
// │  603 │ XVGUSDT      │ 2024 04 05 08:20:00 │ 2024 04 05 16:40:00 │ SHORT        │ 1.56%  │ 84.08%  │ 0.01       │ rsiDivergency5m │
// │  604 │ SKLUSDT      │ 2024 04 05 17:30:00 │ 2024 04 05 21:05:00 │ LONG         │ -0.51% │ 83.57%  │ 0.12       │ rsiDivergency5m │
// │  605 │ SKLUSDT      │ 2024 04 05 22:10:00 │ 2024 04 06 06:30:00 │ LONG         │ 0.12%  │ 83.69%  │ 0.12       │ rsiDivergency5m │
// │  606 │ ENAUSDT      │ 2024 04 06 02:20:00 │ 2024 04 06 02:25:00 │ SHORT        │ -0.51% │ -5.22%  │ 1.10       │ rsiDivergency5m │
// │  607 │ ENAUSDT      │ 2024 04 06 02:40:00 │ 2024 04 06 10:35:00 │ SHORT        │ -0.51% │ -5.73%  │ 1.13       │ rsiDivergency5m │
// │  608 │ PENDLEUSDT   │ 2024 04 06 12:05:00 │ 2024 04 06 14:30:00 │ LONG         │ -0.51% │ 83.18%  │ 6.74       │ rsiDivergency5m │
// │  609 │ PENDLEUSDT   │ 2024 04 06 15:10:00 │ 2024 04 06 23:30:00 │ LONG         │ -0.03% │ 83.15%  │ 6.57       │ rsiDivergency5m │
// │  610 │ TOKENUSDT    │ 2024 04 06 22:25:00 │ 2024 04 07 06:45:00 │ SHORT        │ 0.88%  │ 73.88%  │ 0.17       │ rsiDivergency5m │
// │  611 │ XVGUSDT      │ 2024 04 07 12:05:00 │ 2024 04 07 20:25:00 │ SHORT        │ 1.49%  │ 84.95%  │ 0.01       │ rsiDivergency5m │
// │  612 │ NKNUSDT      │ 2024 04 07 20:10:00 │ 2024 04 07 21:15:00 │ LONG         │ -0.51% │ 84.44%  │ 0.20       │ rsiDivergency5m │
// │  613 │ SFPUSDT      │ 2024 04 07 21:25:00 │ 2024 04 07 22:15:00 │ SHORT        │ -0.51% │ 83.92%  │ 0.80       │ rsiDivergency5m │
// │  614 │ SFPUSDT      │ 2024 04 07 22:25:00 │ 2024 04 07 22:45:00 │ SHORT        │ -0.51% │ 83.41%  │ 0.82       │ rsiDivergency5m │
// │  615 │ PENDLEUSDT   │ 2024 04 08 00:45:00 │ 2024 04 08 01:25:00 │ LONG         │ -0.51% │ 82.90%  │ 6.60       │ rsiDivergency5m │
// │  616 │ GMXUSDT      │ 2024 04 08 04:25:00 │ 2024 04 08 06:10:00 │ SHORT        │ -0.51% │ 82.39%  │ 39.62      │ rsiDivergency5m │
// │  617 │ VETUSDT      │ 2024 04 08 05:15:00 │ 2024 04 08 07:50:00 │ SHORT        │ -0.51% │ 81.87%  │ 0.05       │ rsiDivergency5m │
// │  618 │ GASUSDT      │ 2024 04 08 07:50:00 │ 2024 04 08 08:35:00 │ SHORT        │ -0.51% │ 81.37%  │ 6.84       │ rsiDivergency5m │
// │  619 │ NEOUSDT      │ 2024 04 08 08:00:00 │ 2024 04 08 08:05:00 │ SHORT        │ -0.51% │ 81.36%  │ 19.12      │ rsiDivergency5m │
// │  620 │ NEOUSDT      │ 2024 04 08 08:10:00 │ 2024 04 08 08:30:00 │ SHORT        │ -0.51% │ 80.85%  │ 19.31      │ rsiDivergency5m │
// │  621 │ SSVUSDT      │ 2024 04 08 11:35:00 │ 2024 04 08 19:55:00 │ SHORT        │ 0.19%  │ 81.04%  │ 55.96      │ rsiDivergency5m │
// │  622 │ TOKENUSDT    │ 2024 04 09 09:10:00 │ 2024 04 09 09:40:00 │ LONG         │ -0.51% │ 74.90%  │ 0.15       │ rsiDivergency5m │
// │  623 │ MAVUSDT      │ 2024 04 09 10:15:00 │ 2024 04 09 18:25:00 │ LONG         │ -0.51% │ 82.02%  │ 0.63       │ rsiDivergency5m │
// │  624 │ LDOUSDT      │ 2024 04 09 18:55:00 │ 2024 04 09 21:45:00 │ LONG         │ -0.51% │ 81.51%  │ 2.68       │ rsiDivergency5m │
// │  625 │ AIUSDT       │ 2024 04 09 21:55:00 │ 2024 04 10 06:15:00 │ LONG         │ 0.49%  │ 49.47%  │ 1.40       │ rsiDivergency5m │
// │  626 │ APTUSDT      │ 2024 04 09 21:55:00 │ 2024 04 10 06:15:00 │ LONG         │ -0.18% │ 81.33%  │ 12.29      │ rsiDivergency5m │
// │  627 │ FLMUSDT      │ 2024 04 10 19:55:00 │ 2024 04 10 21:45:00 │ SHORT        │ -0.51% │ 81.17%  │ 0.14       │ rsiDivergency5m │
// │  628 │ HIGHUSDT     │ 2024 04 10 19:55:00 │ 2024 04 10 20:45:00 │ LONG         │ -0.51% │ 81.69%  │ 2.91       │ rsiDivergency5m │
// │  629 │ ALPHAUSDT    │ 2024 04 11 03:45:00 │ 2024 04 11 06:35:00 │ LONG         │ -0.51% │ 80.15%  │ 0.18       │ rsiDivergency5m │
// │  630 │ CELRUSDT     │ 2024 04 11 07:05:00 │ 2024 04 11 07:15:00 │ SHORT        │ -0.51% │ 79.64%  │ 0.04       │ rsiDivergency5m │
// │  631 │ CELRUSDT     │ 2024 04 11 07:40:00 │ 2024 04 11 08:05:00 │ SHORT        │ -0.51% │ 79.12%  │ 0.04       │ rsiDivergency5m │
// │  632 │ CELRUSDT     │ 2024 04 11 08:15:00 │ 2024 04 11 16:35:00 │ SHORT        │ 1.93%  │ 81.06%  │ 0.04       │ rsiDivergency5m │
// │  633 │ CKBUSDT      │ 2024 04 11 20:05:00 │ 2024 04 11 20:55:00 │ SHORT        │ -0.51% │ 80.54%  │ 0.03       │ rsiDivergency5m │
// │  634 │ AMBUSDT      │ 2024 04 11 21:35:00 │ 2024 04 12 05:55:00 │ SHORT        │ 1.11%  │ 81.65%  │ 0.01       │ rsiDivergency5m │
// │  635 │ ONTUSDT      │ 2024 04 12 05:50:00 │ 2024 04 12 06:25:00 │ SHORT        │ -0.51% │ 81.14%  │ 0.44       │ rsiDivergency5m │
// │  636 │ ONTUSDT      │ 2024 04 12 06:50:00 │ 2024 04 12 06:55:00 │ SHORT        │ -0.51% │ 80.63%  │ 0.46       │ rsiDivergency5m │
// │  637 │ ONTUSDT      │ 2024 04 12 07:10:00 │ 2024 04 12 12:00:00 │ SHORT        │ 2.49%  │ 83.12%  │ 0.47       │ rsiDivergency5m │
// │  638 │ SAGAUSDT     │ 2024 04 12 08:20:00 │ 2024 04 12 08:45:00 │ LONG         │ -0.51% │ -2.25%  │ 4.64       │ rsiDivergency5m │
// │  639 │ PORTALUSDT   │ 2024 04 12 08:45:00 │ 2024 04 12 11:10:00 │ LONG         │ -0.51% │ 24.19%  │ 1.30       │ rsiDivergency5m │
// │  640 │ SAGAUSDT     │ 2024 04 12 09:15:00 │ 2024 04 12 09:50:00 │ LONG         │ -0.51% │ -2.76%  │ 4.53       │ rsiDivergency5m │
// │  641 │ PORTALUSDT   │ 2024 04 12 11:40:00 │ 2024 04 12 12:20:00 │ LONG         │ -0.51% │ 23.67%  │ 1.26       │ rsiDivergency5m │
// │  642 │ STGUSDT      │ 2024 04 12 13:10:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.51% │ 82.60%  │ 0.65       │ rsiDivergency5m │
// │  643 │ GALAUSDT     │ 2024 04 12 13:20:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.51% │ 82.09%  │ 0.05       │ rsiDivergency5m │
// │  644 │ NEOUSDT      │ 2024 04 13 00:10:00 │ 2024 04 13 08:30:00 │ SHORT        │ 1.21%  │ 82.28%  │ 20.33      │ rsiDivergency5m │
// │  645 │ CAKEUSDT     │ 2024 04 13 03:30:00 │ 2024 04 13 11:50:00 │ SHORT        │ 0.74%  │ 79.64%  │ 3.26       │ rsiDivergency5m │
// │  646 │ GMTUSDT      │ 2024 04 13 10:35:00 │ 2024 04 13 14:55:00 │ SHORT        │ 2.49%  │ 84.77%  │ 0.27       │ rsiDivergency5m │
// │  647 │ ONGUSDT      │ 2024 04 13 12:15:00 │ 2024 04 13 12:25:00 │ LONG         │ -0.51% │ 59.81%  │ 0.42       │ rsiDivergency5m │
// │  648 │ ONGUSDT      │ 2024 04 13 12:30:00 │ 2024 04 13 12:35:00 │ LONG         │ -0.51% │ 59.29%  │ 0.42       │ rsiDivergency5m │
// │  649 │ MYROUSDT     │ 2024 04 13 12:40:00 │ 2024 04 13 14:45:00 │ LONG         │ -0.51% │ 29.38%  │ 0.14       │ rsiDivergency5m │
// │  650 │ ADAUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 83.23%  │ 0.45       │ rsiDivergency5m │
// │  651 │ ARUSDT       │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 84.26%  │ 24.47      │ rsiDivergency5m │
// │  652 │ FILUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 83.74%  │ 5.66       │ rsiDivergency5m │
// │  653 │ MKRUSDT      │ 2024 04 14 01:35:00 │ 2024 04 14 09:55:00 │ SHORT        │ 0.42%  │ 86.14%  │ 2961.10    │ rsiDivergency5m │
// │  654 │ RIFUSDT      │ 2024 04 14 01:45:00 │ 2024 04 14 10:05:00 │ SHORT        │ 0.31%  │ 83.45%  │ 0.20       │ rsiDivergency5m │
// │  655 │ SAGAUSDT     │ 2024 04 14 09:55:00 │ 2024 04 14 12:10:00 │ SHORT        │ 2.49%  │ -3.64%  │ 4.50       │ rsiDivergency5m │
// │  656 │ XVGUSDT      │ 2024 04 14 16:20:00 │ 2024 04 14 16:45:00 │ LONG         │ -0.51% │ 85.12%  │ 0.01       │ rsiDivergency5m │
// │  657 │ PENDLEUSDT   │ 2024 04 14 18:00:00 │ 2024 04 14 18:20:00 │ SHORT        │ -0.51% │ 84.60%  │ 6.57       │ rsiDivergency5m │
// │  658 │ RNDRUSDT     │ 2024 04 14 18:05:00 │ 2024 04 14 18:20:00 │ SHORT        │ -0.51% │ 84.09%  │ 8.75       │ rsiDivergency5m │
// │  659 │ ORDIUSDT     │ 2024 04 14 18:15:00 │ 2024 04 15 01:40:00 │ SHORT        │ -0.51% │ 75.85%  │ 48.54      │ rsiDivergency5m │
// │  660 │ RNDRUSDT     │ 2024 04 14 18:30:00 │ 2024 04 15 00:55:00 │ SHORT        │ -0.51% │ 83.58%  │ 8.94       │ rsiDivergency5m │
// │  661 │ TNSRUSDT     │ 2024 04 14 22:50:00 │ 2024 04 15 07:10:00 │ LONG         │ 0.09%  │ -2.71%  │ 0.94       │ rsiDivergency5m │
// │  662 │ LSKUSDT      │ 2024 04 15 03:30:00 │ 2024 04 15 11:50:00 │ SHORT        │ 1.88%  │ 42.67%  │ 1.55       │ rsiDivergency5m │
// │  663 │ FTMUSDT      │ 2024 04 15 11:25:00 │ 2024 04 15 12:25:00 │ LONG         │ -0.51% │ 85.55%  │ 0.67       │ rsiDivergency5m │
// │  664 │ 1000BONKUSDT │ 2024 04 15 11:40:00 │ 2024 04 15 12:25:00 │ LONG         │ -0.51% │ 68.74%  │ 0.02       │ rsiDivergency5m │
// │  665 │ REEFUSDT     │ 2024 04 15 12:45:00 │ 2024 04 15 13:55:00 │ LONG         │ -0.51% │ 85.04%  │ 0.00       │ rsiDivergency5m │
// │  666 │ USTCUSDT     │ 2024 04 15 12:45:00 │ 2024 04 15 14:00:00 │ LONG         │ -0.51% │ 64.19%  │ 0.02       │ rsiDivergency5m │
// │  667 │ ONTUSDT      │ 2024 04 15 13:25:00 │ 2024 04 15 13:55:00 │ LONG         │ -0.51% │ 84.53%  │ 0.31       │ rsiDivergency5m │
// │  668 │ SUPERUSDT    │ 2024 04 15 13:40:00 │ 2024 04 15 14:00:00 │ LONG         │ -0.51% │ 67.74%  │ 0.96       │ rsiDivergency5m │
// │  669 │ BEAMXUSDT    │ 2024 04 16 02:25:00 │ 2024 04 16 02:35:00 │ SHORT        │ -0.51% │ 76.03%  │ 0.03       │ rsiDivergency5m │
// │  670 │ IDUSDT       │ 2024 04 16 02:25:00 │ 2024 04 16 10:45:00 │ SHORT        │ 1.31%  │ 85.84%  │ 0.70       │ rsiDivergency5m │
// │  671 │ TAOUSDT      │ 2024 04 16 07:40:00 │ 2024 04 16 16:00:00 │ LONG         │ 1.34%  │ -2.81%  │ 460.81     │ rsiDivergency5m │
// │  672 │ ENAUSDT      │ 2024 04 16 10:40:00 │ 2024 04 16 16:25:00 │ LONG         │ 2.49%  │ 10.70%  │ 0.90       │ rsiDivergency5m │
// │  673 │ ONTUSDT      │ 2024 04 16 11:25:00 │ 2024 04 16 16:20:00 │ LONG         │ 2.49%  │ 88.32%  │ 0.29       │ rsiDivergency5m │
// │  674 │ ZETAUSDT     │ 2024 04 16 11:30:00 │ 2024 04 16 19:50:00 │ LONG         │ 0.80%  │ 48.10%  │ 1.21       │ rsiDivergency5m │
// │  675 │ BEAMXUSDT    │ 2024 04 16 16:25:00 │ 2024 04 16 23:30:00 │ SHORT        │ -0.51% │ 72.44%  │ 0.03       │ rsiDivergency5m │
// │  676 │ SFPUSDT      │ 2024 04 16 20:05:00 │ 2024 04 16 21:40:00 │ SHORT        │ -0.51% │ 87.81%  │ 0.79       │ rsiDivergency5m │
// │  677 │ TAOUSDT      │ 2024 04 17 07:15:00 │ 2024 04 17 09:05:00 │ LONG         │ -0.51% │ -3.74%  │ 463.00     │ rsiDivergency5m │
// │  678 │ RNDRUSDT     │ 2024 04 17 07:40:00 │ 2024 04 17 09:15:00 │ LONG         │ -0.51% │ 87.66%  │ 7.66       │ rsiDivergency5m │
// │  679 │ FETUSDT      │ 2024 04 17 09:20:00 │ 2024 04 17 17:40:00 │ LONG         │ 1.36%  │ 89.02%  │ 1.90       │ rsiDivergency5m │
// │  680 │ RIFUSDT      │ 2024 04 17 09:25:00 │ 2024 04 17 17:45:00 │ LONG         │ 0.87%  │ 82.20%  │ 0.19       │ rsiDivergency5m │
// │  681 │ TRUUSDT      │ 2024 04 17 21:25:00 │ 2024 04 18 00:00:00 │ LONG         │ -0.51% │ 88.51%  │ 0.11       │ rsiDivergency5m │
// │  682 │ TRUUSDT      │ 2024 04 18 01:25:00 │ 2024 04 18 02:30:00 │ LONG         │ -0.51% │ 88.00%  │ 0.11       │ rsiDivergency5m │
// │  683 │ ENAUSDT      │ 2024 04 18 02:05:00 │ 2024 04 18 02:30:00 │ LONG         │ -0.51% │ 14.08%  │ 0.85       │ rsiDivergency5m │
// │  684 │ ENAUSDT      │ 2024 04 18 02:40:00 │ 2024 04 18 06:20:00 │ LONG         │ 2.49%  │ 16.57%  │ 0.83       │ rsiDivergency5m │
// │  685 │ CKBUSDT      │ 2024 04 18 05:50:00 │ 2024 04 18 09:25:00 │ LONG         │ 2.49%  │ 90.49%  │ 0.02       │ rsiDivergency5m │
// │  686 │ INJUSDT      │ 2024 04 18 09:30:00 │ 2024 04 18 09:55:00 │ SHORT        │ -0.51% │ 89.97%  │ 27.75      │ rsiDivergency5m │
// │  687 │ ONTUSDT      │ 2024 04 18 09:50:00 │ 2024 04 18 10:00:00 │ SHORT        │ -0.51% │ 89.46%  │ 0.31       │ rsiDivergency5m │
// │  688 │ LPTUSDT      │ 2024 04 18 14:55:00 │ 2024 04 18 20:40:00 │ SHORT        │ 2.49%  │ 91.44%  │ 13.89      │ rsiDivergency5m │
// │  689 │ YGGUSDT      │ 2024 04 18 21:30:00 │ 2024 04 19 01:40:00 │ LONG         │ 2.49%  │ 93.92%  │ 0.78       │ rsiDivergency5m │
// │  690 │ DODOXUSDT    │ 2024 04 19 03:10:00 │ 2024 04 19 11:30:00 │ SHORT        │ 0.04%  │ 93.97%  │ 0.16       │ rsiDivergency5m │
// │  691 │ TAOUSDT      │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.99%  │ -3.42%  │ 433.10     │ rsiDivergency5m │
// │  692 │ STXUSDT      │ 2024 04 20 11:00:00 │ 2024 04 20 18:30:00 │ SHORT        │ -0.51% │ 92.37%  │ 2.67       │ rsiDivergency5m │
// │  693 │ ORDIUSDT     │ 2024 04 20 12:25:00 │ 2024 04 20 12:55:00 │ SHORT        │ -0.51% │ 80.85%  │ 49.26      │ rsiDivergency5m │
// │  694 │ TOKENUSDT    │ 2024 04 20 12:25:00 │ 2024 04 20 12:40:00 │ SHORT        │ -0.51% │ 82.35%  │ 0.12       │ rsiDivergency5m │
// │  695 │ TOKENUSDT    │ 2024 04 20 13:05:00 │ 2024 04 20 13:30:00 │ SHORT        │ -0.51% │ 81.84%  │ 0.12       │ rsiDivergency5m │
// │  696 │ TAOUSDT      │ 2024 04 20 15:10:00 │ 2024 04 20 23:30:00 │ SHORT        │ 0.55%  │ -2.30%  │ 489.80     │ rsiDivergency5m │
// │  697 │ TRUUSDT      │ 2024 04 20 19:50:00 │ 2024 04 21 04:10:00 │ LONG         │ 0.21%  │ 92.58%  │ 0.13       │ rsiDivergency5m │
// │  698 │ SSVUSDT      │ 2024 04 22 00:05:00 │ 2024 04 22 08:25:00 │ SHORT        │ 0.75%  │ 92.93%  │ 43.93      │ rsiDivergency5m │
// │  699 │ CKBUSDT      │ 2024 04 23 07:00:00 │ 2024 04 23 15:20:00 │ LONG         │ 0.13%  │ 94.38%  │ 0.02       │ rsiDivergency5m │
// │  700 │ ONTUSDT      │ 2024 04 23 16:50:00 │ 2024 04 23 18:05:00 │ LONG         │ -0.51% │ 93.86%  │ 0.43       │ rsiDivergency5m │
// │  701 │ 1000BONKUSDT │ 2024 04 23 19:45:00 │ 2024 04 23 20:05:00 │ SHORT        │ -0.51% │ 70.60%  │ 0.03       │ rsiDivergency5m │
// │  702 │ ORDIUSDT     │ 2024 04 24 09:55:00 │ 2024 04 24 10:25:00 │ LONG         │ -0.51% │ 81.66%  │ 45.36      │ rsiDivergency5m │
// │  703 │ VANRYUSDT    │ 2024 04 24 09:55:00 │ 2024 04 24 10:40:00 │ LONG         │ -0.51% │ 23.45%  │ 0.17       │ rsiDivergency5m │
// │  704 │ LOOMUSDT     │ 2024 04 25 12:00:00 │ 2024 04 25 16:35:00 │ SHORT        │ -0.51% │ 96.72%  │ 0.09       │ rsiDivergency5m │
// │  705 │ MYROUSDT     │ 2024 04 25 12:00:00 │ 2024 04 25 20:20:00 │ SHORT        │ 1.96%  │ 25.75%  │ 0.18       │ rsiDivergency5m │
// │  706 │ ANKRUSDT     │ 2024 04 25 16:35:00 │ 2024 04 26 00:55:00 │ SHORT        │ 1.04%  │ 97.76%  │ 0.05       │ rsiDivergency5m │
// │  707 │ LSKUSDT      │ 2024 04 25 18:50:00 │ 2024 04 25 19:25:00 │ LONG         │ -0.51% │ 49.49%  │ 1.90       │ rsiDivergency5m │
// │  708 │ LSKUSDT      │ 2024 04 25 19:40:00 │ 2024 04 25 20:15:00 │ LONG         │ -0.51% │ 48.98%  │ 1.85       │ rsiDivergency5m │
// │  709 │ ARUSDT       │ 2024 04 26 08:20:00 │ 2024 04 26 11:05:00 │ LONG         │ -0.51% │ 96.23%  │ 32.09      │ rsiDivergency5m │
// │  710 │ LSKUSDT      │ 2024 04 26 19:45:00 │ 2024 04 26 20:15:00 │ LONG         │ -0.51% │ 48.67%  │ 1.68       │ rsiDivergency5m │
// │  711 │ ALTUSDT      │ 2024 04 26 20:30:00 │ 2024 04 27 04:50:00 │ LONG         │ 0.32%  │ 48.99%  │ 0.35       │ rsiDivergency5m │
// │  712 │ WLDUSDT      │ 2024 04 26 20:30:00 │ 2024 04 27 04:50:00 │ LONG         │ 1.50%  │ 97.72%  │ 4.48       │ rsiDivergency5m │
// │  713 │ LOOMUSDT     │ 2024 04 27 12:05:00 │ 2024 04 27 20:25:00 │ LONG         │ 0.69%  │ 98.42%  │ 0.09       │ rsiDivergency5m │
// │  714 │ 1000BONKUSDT │ 2024 04 27 18:10:00 │ 2024 04 28 00:20:00 │ LONG         │ 2.49%  │ 76.08%  │ 0.02       │ rsiDivergency5m │
// │  715 │ TUSDT        │ 2024 04 27 21:05:00 │ 2024 04 28 05:25:00 │ SHORT        │ 1.58%  │ 99.99%  │ 0.04       │ rsiDivergency5m │
// │  716 │ FRONTUSDT    │ 2024 04 28 07:50:00 │ 2024 04 28 16:10:00 │ LONG         │ 0.41%  │ 100.40% │ 0.91       │ rsiDivergency5m │
// │  717 │ HIGHUSDT     │ 2024 04 28 18:30:00 │ 2024 04 29 02:50:00 │ LONG         │ 0.77%  │ 101.17% │ 3.83       │ rsiDivergency5m │
// │  718 │ 1000BONKUSDT │ 2024 04 28 22:15:00 │ 2024 04 29 06:35:00 │ LONG         │ 0.01%  │ 74.39%  │ 0.02       │ rsiDivergency5m │
// │  719 │ POLYXUSDT    │ 2024 04 28 22:35:00 │ 2024 04 29 01:45:00 │ LONG         │ -0.51% │ 88.95%  │ 0.37       │ rsiDivergency5m │
// │  720 │ GALAUSDT     │ 2024 04 29 02:35:00 │ 2024 04 29 10:55:00 │ LONG         │ 0.76%  │ 101.92% │ 0.04       │ rsiDivergency5m │
// │  721 │ POWRUSDT     │ 2024 04 29 03:35:00 │ 2024 04 29 11:55:00 │ LONG         │ 0.36%  │ 88.17%  │ 0.29       │ rsiDivergency5m │
// │  722 │ WUSDT        │ 2024 04 29 07:15:00 │ 2024 04 29 09:25:00 │ SHORT        │ -0.51% │ 17.06%  │ 0.63       │ rsiDivergency5m │
// │  723 │ LEVERUSDT    │ 2024 04 29 18:05:00 │ 2024 04 30 02:25:00 │ SHORT        │ -0.06% │ 101.86% │ 0.00       │ rsiDivergency5m │
// │  724 │ LEVERUSDT    │ 2024 04 30 04:25:00 │ 2024 04 30 07:05:00 │ LONG         │ -0.51% │ 101.35% │ 0.00       │ rsiDivergency5m │
// │  725 │ TNSRUSDT     │ 2024 04 30 04:35:00 │ 2024 04 30 06:40:00 │ LONG         │ -0.51% │ 17.59%  │ 0.82       │ rsiDivergency5m │
// │  726 │ SAGAUSDT     │ 2024 04 30 06:50:00 │ 2024 04 30 07:10:00 │ LONG         │ -0.51% │ 17.08%  │ 3.29       │ rsiDivergency5m │
// │  727 │ TOKENUSDT    │ 2024 04 30 06:50:00 │ 2024 04 30 07:10:00 │ LONG         │ -0.51% │ 80.66%  │ 0.10       │ rsiDivergency5m │
// │  728 │ ALTUSDT      │ 2024 04 30 07:10:00 │ 2024 04 30 10:40:00 │ LONG         │ -0.51% │ 50.62%  │ 0.35       │ rsiDivergency5m │
// │  729 │ PIXELUSDT    │ 2024 04 30 07:10:00 │ 2024 04 30 15:30:00 │ LONG         │ 0.62%  │ 46.03%  │ 0.39       │ rsiDivergency5m │
// │  730 │ RDNTUSDT     │ 2024 04 30 07:10:00 │ 2024 04 30 08:50:00 │ LONG         │ -0.51% │ 100.84% │ 0.18       │ rsiDivergency5m │
// │  731 │ SAGAUSDT     │ 2024 04 30 07:15:00 │ 2024 04 30 11:10:00 │ LONG         │ -0.51% │ 16.56%  │ 3.24       │ rsiDivergency5m │
// │  732 │ POLYXUSDT    │ 2024 04 30 08:05:00 │ 2024 04 30 11:10:00 │ LONG         │ -0.51% │ 92.94%  │ 0.34       │ rsiDivergency5m │
// │  733 │ BEAMXUSDT    │ 2024 04 30 08:15:00 │ 2024 04 30 11:10:00 │ LONG         │ -0.51% │ 83.42%  │ 0.02       │ rsiDivergency5m │
// │  734 │ TRUUSDT      │ 2024 04 30 08:55:00 │ 2024 04 30 10:40:00 │ LONG         │ -0.51% │ 100.32% │ 0.10       │ rsiDivergency5m │
// │  735 │ CKBUSDT      │ 2024 04 30 10:45:00 │ 2024 04 30 11:05:00 │ LONG         │ -0.51% │ 99.81%  │ 0.02       │ rsiDivergency5m │
// │  736 │ GASUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ -0.05% │ 92.89%  │ 4.87       │ rsiDivergency5m │
// │  737 │ SUIUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 1.32%  │ 101.13% │ 1.08       │ rsiDivergency5m │
// │  738 │ HIGHUSDT     │ 2024 04 30 22:15:00 │ 2024 05 01 06:35:00 │ LONG         │ 1.76%  │ 102.89% │ 3.26       │ rsiDivergency5m │
// │  739 │ OMNIUSDT     │ 2024 05 01 02:35:00 │ 2024 05 01 10:55:00 │ LONG         │ 0.70%  │ 5.25%   │ 16.95      │ rsiDivergency5m │
// │  740 │ PIXELUSDT    │ 2024 05 01 03:20:00 │ 2024 05 01 11:40:00 │ LONG         │ 0.70%  │ 46.29%  │ 0.37       │ rsiDivergency5m │
// │  741 │ VANRYUSDT    │ 2024 05 01 03:20:00 │ 2024 05 01 11:40:00 │ LONG         │ 1.12%  │ 23.02%  │ 0.14       │ rsiDivergency5m │
// │  742 │ MANTAUSDT    │ 2024 05 01 03:45:00 │ 2024 05 01 12:05:00 │ LONG         │ 0.99%  │ 56.14%  │ 1.53       │ rsiDivergency5m │
// │  743 │ HIFIUSDT     │ 2024 05 01 07:40:00 │ 2024 05 01 13:35:00 │ SHORT        │ -0.51% │ 102.38% │ 0.69       │ rsiDivergency5m │
// │  744 │ TAOUSDT      │ 2024 05 01 13:45:00 │ 2024 05 01 22:05:00 │ SHORT        │ 0.72%  │ 18.10%  │ 385.25     │ rsiDivergency5m │
// │  745 │ MANTAUSDT    │ 2024 05 01 13:50:00 │ 2024 05 01 22:10:00 │ SHORT        │ 1.18%  │ 57.32%  │ 1.70       │ rsiDivergency5m │
// │  746 │ BEAMXUSDT    │ 2024 05 01 13:55:00 │ 2024 05 01 22:15:00 │ SHORT        │ 1.52%  │ 81.07%  │ 0.02       │ rsiDivergency5m │
// │  747 │ MAVUSDT      │ 2024 05 01 13:55:00 │ 2024 05 01 22:15:00 │ SHORT        │ 0.82%  │ 103.19% │ 0.38       │ rsiDivergency5m │
// │  748 │ SAGAUSDT     │ 2024 05 01 20:25:00 │ 2024 05 02 04:45:00 │ LONG         │ 0.01%  │ 17.65%  │ 3.12       │ rsiDivergency5m │
// │  749 │ FRONTUSDT    │ 2024 05 02 01:55:00 │ 2024 05 02 10:15:00 │ LONG         │ 1.15%  │ 103.83% │ 0.77       │ rsiDivergency5m │
// │  750 │ ARUSDT       │ 2024 05 02 10:10:00 │ 2024 05 02 12:15:00 │ SHORT        │ -0.51% │ 103.32% │ 33.12      │ rsiDivergency5m │
// │  751 │ ARUSDT       │ 2024 05 02 13:05:00 │ 2024 05 02 13:40:00 │ SHORT        │ -0.51% │ 102.81% │ 34.20      │ rsiDivergency5m │
// │  752 │ ARUSDT       │ 2024 05 02 15:05:00 │ 2024 05 02 23:25:00 │ SHORT        │ 1.07%  │ 103.88% │ 35.75      │ rsiDivergency5m │
// │  753 │ POLYXUSDT    │ 2024 05 02 21:55:00 │ 2024 05 03 06:15:00 │ SHORT        │ 1.32%  │ 94.25%  │ 0.37       │ rsiDivergency5m │
// │  754 │ HIFIUSDT     │ 2024 05 03 11:15:00 │ 2024 05 03 17:05:00 │ SHORT        │ -0.51% │ 102.86% │ 0.80       │ rsiDivergency5m │
// │  755 │ 1000SATSUSDT │ 2024 05 03 11:25:00 │ 2024 05 03 19:45:00 │ SHORT        │ 0.19%  │ 68.66%  │ 0.00       │ rsiDivergency5m │
// │  756 │ ONTUSDT      │ 2024 05 03 15:40:00 │ 2024 05 04 00:00:00 │ SHORT        │ 0.54%  │ 103.40% │ 0.36       │ rsiDivergency5m │
// │  757 │ DOGEUSDT     │ 2024 05 04 08:05:00 │ 2024 05 04 16:25:00 │ SHORT        │ 1.01%  │ 104.41% │ 0.17       │ rsiDivergency5m │
// │  758 │ WUSDT        │ 2024 05 04 22:30:00 │ 2024 05 05 06:50:00 │ LONG         │ -0.05% │ 20.70%  │ 0.67       │ rsiDivergency5m │
// │  759 │ BONDUSDT     │ 2024 05 05 12:35:00 │ 2024 05 05 20:55:00 │ SHORT        │ 0.42%  │ 104.37% │ 3.21       │ rsiDivergency5m │
// │  760 │ RSRUSDT      │ 2024 05 06 03:30:00 │ 2024 05 06 04:10:00 │ SHORT        │ -0.51% │ 103.86% │ 0.01       │ rsiDivergency5m │
// │  761 │ ZETAUSDT     │ 2024 05 06 09:25:00 │ 2024 05 06 12:40:00 │ LONG         │ -0.51% │ 52.18%  │ 1.71       │ rsiDivergency5m │
// │  762 │ STXUSDT      │ 2024 05 06 12:35:00 │ 2024 05 06 20:55:00 │ LONG         │ 0.40%  │ 104.26% │ 2.20       │ rsiDivergency5m │
// │  763 │ POWRUSDT     │ 2024 05 07 01:20:00 │ 2024 05 07 09:40:00 │ SHORT        │ 1.23%  │ 97.23%  │ 0.36       │ rsiDivergency5m │
// │  764 │ LEVERUSDT    │ 2024 05 07 10:20:00 │ 2024 05 07 11:05:00 │ LONG         │ -0.51% │ 102.73% │ 0.00       │ rsiDivergency5m │
// │  765 │ USTCUSDT     │ 2024 05 08 04:25:00 │ 2024 05 08 12:45:00 │ LONG         │ 0.93%  │ 79.41%  │ 0.02       │ rsiDivergency5m │
// │  766 │ ARPAUSDT     │ 2024 05 08 14:10:00 │ 2024 05 08 22:30:00 │ SHORT        │ 1.24%  │ 106.34% │ 0.07       │ rsiDivergency5m │
// │  767 │ IMXUSDT      │ 2024 05 09 20:35:00 │ 2024 05 10 04:55:00 │ SHORT        │ -0.34% │ 107.66% │ 2.23       │ rsiDivergency5m │
// │  768 │ ARUSDT       │ 2024 05 10 05:25:00 │ 2024 05 10 13:45:00 │ SHORT        │ 1.86%  │ 109.52% │ 44.72      │ rsiDivergency5m │
// │  769 │ ACEUSDT      │ 2024 05 10 12:25:00 │ 2024 05 10 20:45:00 │ LONG         │ 1.92%  │ 69.39%  │ 4.94       │ rsiDivergency5m │
// │  770 │ UMAUSDT      │ 2024 05 11 02:10:00 │ 2024 05 11 10:30:00 │ SHORT        │ 1.76%  │ 111.28% │ 4.17       │ rsiDivergency5m │
// │  771 │ XVGUSDT      │ 2024 05 11 13:45:00 │ 2024 05 11 14:55:00 │ SHORT        │ -0.51% │ 110.77% │ 0.01       │ rsiDivergency5m │
// │  772 │ FRONTUSDT    │ 2024 05 12 10:30:00 │ 2024 05 12 15:00:00 │ SHORT        │ -0.51% │ 109.74% │ 1.47       │ rsiDivergency5m │
// │  773 │ LEVERUSDT    │ 2024 05 12 20:20:00 │ 2024 05 12 21:00:00 │ LONG         │ -0.51% │ 108.72% │ 0.00       │ rsiDivergency5m │
// │  774 │ LEVERUSDT    │ 2024 05 12 21:10:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.51% │ 108.21% │ 0.00       │ rsiDivergency5m │
// │  775 │ ACEUSDT      │ 2024 05 12 21:55:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.51% │ 70.32%  │ 4.68       │ rsiDivergency5m │
// │  776 │ ALTUSDT      │ 2024 05 12 22:05:00 │ 2024 05 13 06:25:00 │ LONG         │ 0.85%  │ 56.71%  │ 0.30       │ rsiDivergency5m │
// │  777 │ XVGUSDT      │ 2024 05 12 22:30:00 │ 2024 05 13 06:50:00 │ LONG         │ -0.06% │ 108.14% │ 0.01       │ rsiDivergency5m │
// │  778 │ VANRYUSDT    │ 2024 05 13 05:00:00 │ 2024 05 13 06:20:00 │ SHORT        │ -0.51% │ 41.29%  │ 0.17       │ rsiDivergency5m │
// │  779 │ UMAUSDT      │ 2024 05 14 08:55:00 │ 2024 05 14 17:15:00 │ LONG         │ -0.20% │ 108.66% │ 3.70       │ rsiDivergency5m │
// │  780 │ WLDUSDT      │ 2024 05 14 19:30:00 │ 2024 05 14 20:15:00 │ SHORT        │ -0.51% │ 108.15% │ 4.87       │ rsiDivergency5m │
// │  781 │ FRONTUSDT    │ 2024 05 14 20:50:00 │ 2024 05 15 05:10:00 │ SHORT        │ 0.69%  │ 108.85% │ 1.20       │ rsiDivergency5m │
// │  782 │ LPTUSDT      │ 2024 05 15 05:20:00 │ 2024 05 15 07:30:00 │ SHORT        │ -0.51% │ 108.33% │ 18.24      │ rsiDivergency5m │
// │  783 │ TOKENUSDT    │ 2024 05 15 08:20:00 │ 2024 05 15 08:30:00 │ SHORT        │ -0.51% │ 97.25%  │ 0.09       │ rsiDivergency5m │
// │  784 │ TOKENUSDT    │ 2024 05 15 08:35:00 │ 2024 05 15 09:55:00 │ SHORT        │ -0.51% │ 96.74%  │ 0.09       │ rsiDivergency5m │
// │  785 │ GMXUSDT      │ 2024 05 15 09:25:00 │ 2024 05 15 10:00:00 │ SHORT        │ -0.51% │ 107.82% │ 30.20      │ rsiDivergency5m │
// │  786 │ LPTUSDT      │ 2024 05 15 09:45:00 │ 2024 05 15 18:05:00 │ SHORT        │ 0.77%  │ 108.59% │ 20.64      │ rsiDivergency5m │
// │  787 │ POLYXUSDT    │ 2024 05 15 12:45:00 │ 2024 05 15 21:05:00 │ SHORT        │ 0.06%  │ 103.95% │ 0.39       │ rsiDivergency5m │
// │  788 │ FTMUSDT      │ 2024 05 15 19:05:00 │ 2024 05 15 22:25:00 │ SHORT        │ -0.51% │ 108.07% │ 0.76       │ rsiDivergency5m │
// │  789 │ RSRUSDT      │ 2024 05 16 02:40:00 │ 2024 05 16 11:00:00 │ SHORT        │ 1.26%  │ 109.34% │ 0.01       │ rsiDivergency5m │
// │  790 │ ENAUSDT      │ 2024 05 16 09:25:00 │ 2024 05 16 09:50:00 │ LONG         │ -0.51% │ 24.35%  │ 0.67       │ rsiDivergency5m │
// │  791 │ 1000SATSUSDT │ 2024 05 16 09:45:00 │ 2024 05 16 18:05:00 │ LONG         │ 0.09%  │ 73.01%  │ 0.00       │ rsiDivergency5m │
// │  792 │ ENAUSDT      │ 2024 05 16 09:55:00 │ 2024 05 16 18:15:00 │ LONG         │ 0.27%  │ 24.62%  │ 0.66       │ rsiDivergency5m │
// │  793 │ WUSDT        │ 2024 05 16 10:00:00 │ 2024 05 16 18:20:00 │ LONG         │ 0.47%  │ 26.24%  │ 0.53       │ rsiDivergency5m │
// │  794 │ LDOUSDT      │ 2024 05 17 03:15:00 │ 2024 05 17 07:45:00 │ SHORT        │ -0.51% │ 109.22% │ 1.78       │ rsiDivergency5m │
// │  795 │ SSVUSDT      │ 2024 05 17 11:30:00 │ 2024 05 17 17:30:00 │ SHORT        │ -0.51% │ 108.71% │ 40.91      │ rsiDivergency5m │
// │  796 │ CKBUSDT      │ 2024 05 17 17:50:00 │ 2024 05 18 00:05:00 │ SHORT        │ -0.51% │ 108.20% │ 0.02       │ rsiDivergency5m │
// │  797 │ ONDOUSDT     │ 2024 05 17 22:25:00 │ 2024 05 17 23:35:00 │ SHORT        │ -0.51% │ 52.74%  │ 1.01       │ rsiDivergency5m │
// │  798 │ POLYXUSDT    │ 2024 05 17 23:40:00 │ 2024 05 18 08:00:00 │ SHORT        │ 0.14%  │ 102.86% │ 0.46       │ rsiDivergency5m │
// │  799 │ FTMUSDT      │ 2024 05 18 01:45:00 │ 2024 05 18 06:40:00 │ SHORT        │ -0.51% │ 107.69% │ 0.87       │ rsiDivergency5m │
// │  800 │ ACEUSDT      │ 2024 05 19 11:55:00 │ 2024 05 19 16:30:00 │ LONG         │ -0.51% │ 73.68%  │ 4.56       │ rsiDivergency5m │
// │  801 │ AIUSDT       │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 0.94%  │ 54.03%  │ 0.97       │ rsiDivergency5m │
// │  802 │ YGGUSDT      │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 0.69%  │ 106.33% │ 0.83       │ rsiDivergency5m │
// │  803 │ ROSEUSDT     │ 2024 05 20 15:00:00 │ 2024 05 20 19:10:00 │ SHORT        │ -0.51% │ 106.40% │ 0.10       │ rsiDivergency5m │
// │  804 │ PIXELUSDT    │ 2024 05 20 15:40:00 │ 2024 05 20 17:10:00 │ SHORT        │ -0.51% │ 48.85%  │ 0.38       │ rsiDivergency5m │
// │  805 │ ACEUSDT      │ 2024 05 20 17:25:00 │ 2024 05 20 19:30:00 │ SHORT        │ -0.51% │ 73.75%  │ 5.01       │ rsiDivergency5m │
// │  806 │ NTRNUSDT     │ 2024 05 20 17:35:00 │ 2024 05 21 01:55:00 │ SHORT        │ 0.11%  │ 92.70%  │ 0.73       │ rsiDivergency5m │
// │  807 │ IMXUSDT      │ 2024 05 20 19:20:00 │ 2024 05 21 03:40:00 │ SHORT        │ 0.35%  │ 106.75% │ 2.59       │ rsiDivergency5m │
// │  808 │ 1000BONKUSDT │ 2024 05 20 19:25:00 │ 2024 05 20 22:25:00 │ SHORT        │ -0.51% │ 81.58%  │ 0.03       │ rsiDivergency5m │
// │  809 │ ENAUSDT      │ 2024 05 20 19:35:00 │ 2024 05 21 03:55:00 │ SHORT        │ 0.72%  │ 23.23%  │ 0.87       │ rsiDivergency5m │
// │  810 │ 1000BONKUSDT │ 2024 05 20 22:30:00 │ 2024 05 21 05:45:00 │ SHORT        │ -0.51% │ 81.07%  │ 0.03       │ rsiDivergency5m │
// │  811 │ NMRUSDT      │ 2024 05 21 05:40:00 │ 2024 05 21 14:00:00 │ SHORT        │ 0.29%  │ 107.04% │ 30.16      │ rsiDivergency5m │
// │  812 │ 1000LUNCUSDT │ 2024 05 22 06:55:00 │ 2024 05 22 15:15:00 │ SHORT        │ 1.38%  │ 108.58% │ 0.12       │ rsiDivergency5m │
// │  813 │ USTCUSDT     │ 2024 05 22 07:05:00 │ 2024 05 22 15:25:00 │ SHORT        │ 1.50%  │ 82.53%  │ 0.02       │ rsiDivergency5m │
// │  814 │ ENAUSDT      │ 2024 05 22 10:45:00 │ 2024 05 22 19:05:00 │ SHORT        │ 0.18%  │ 23.44%  │ 0.86       │ rsiDivergency5m │
// │  815 │ 1000BONKUSDT │ 2024 05 23 06:55:00 │ 2024 05 23 15:00:00 │ SHORT        │ 2.49%  │ 86.07%  │ 0.04       │ rsiDivergency5m │
// │  816 │ UMAUSDT      │ 2024 05 23 10:05:00 │ 2024 05 23 13:20:00 │ LONG         │ -0.51% │ 107.04% │ 3.36       │ rsiDivergency5m │
// │  817 │ GMTUSDT      │ 2024 05 23 13:00:00 │ 2024 05 23 15:00:00 │ LONG         │ -0.51% │ 106.53% │ 0.22       │ rsiDivergency5m │
// │  818 │ GMTUSDT      │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 2.13%  │ 108.66% │ 0.21       │ rsiDivergency5m │
// │  819 │ NTRNUSDT     │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.66%  │ 95.52%  │ 0.66       │ rsiDivergency5m │
// │  820 │ PORTALUSDT   │ 2024 05 23 19:50:00 │ 2024 05 23 22:10:00 │ SHORT        │ -0.51% │ 48.17%  │ 0.85       │ rsiDivergency5m │
// │  821 │ POLYXUSDT    │ 2024 05 23 20:10:00 │ 2024 05 23 21:05:00 │ SHORT        │ -0.51% │ 107.63% │ 0.45       │ rsiDivergency5m │
// │  822 │ POLYXUSDT    │ 2024 05 23 21:20:00 │ 2024 05 24 05:40:00 │ SHORT        │ 1.00%  │ 108.63% │ 0.46       │ rsiDivergency5m │
// │  823 │ DEFIUSDT     │ 2024 05 23 23:40:00 │ 2024 05 24 08:00:00 │ SHORT        │ 0.15%  │ 108.81% │ 1019.60    │ rsiDivergency5m │
// │  824 │ ACEUSDT      │ 2024 05 24 01:30:00 │ 2024 05 24 02:05:00 │ LONG         │ -0.51% │ 75.57%  │ 5.29       │ rsiDivergency5m │
// │  825 │ PIXELUSDT    │ 2024 05 24 02:00:00 │ 2024 05 24 10:20:00 │ LONG         │ -0.03% │ 51.64%  │ 0.37       │ rsiDivergency5m │
// │  826 │ MANTAUSDT    │ 2024 05 24 02:30:00 │ 2024 05 24 03:20:00 │ LONG         │ -0.51% │ 53.55%  │ 1.70       │ rsiDivergency5m │
// │  827 │ MANTAUSDT    │ 2024 05 24 03:25:00 │ 2024 05 24 11:45:00 │ LONG         │ 0.77%  │ 54.33%  │ 1.66       │ rsiDivergency5m │
// │  828 │ LDOUSDT      │ 2024 05 24 09:55:00 │ 2024 05 24 18:15:00 │ SHORT        │ 1.25%  │ 110.06% │ 2.48       │ rsiDivergency5m │
// │  829 │ UMAUSDT      │ 2024 05 24 19:30:00 │ 2024 05 25 03:50:00 │ SHORT        │ 0.73%  │ 110.79% │ 3.67       │ rsiDivergency5m │
// │  830 │ ENSUSDT      │ 2024 05 25 16:05:00 │ 2024 05 26 00:25:00 │ LONG         │ 1.07%  │ 111.64% │ 22.84      │ rsiDivergency5m │
// │  831 │ REZUSDT      │ 2024 05 26 10:45:00 │ 2024 05 26 11:45:00 │ SHORT        │ -0.51% │ 18.68%  │ 0.15       │ rsiDivergency5m │
// │  832 │ SNXUSDT      │ 2024 05 26 22:15:00 │ 2024 05 26 22:20:00 │ SHORT        │ -0.51% │ 110.69% │ 3.22       │ rsiDivergency5m │
// │  833 │ VANRYUSDT    │ 2024 05 26 23:20:00 │ 2024 05 27 07:40:00 │ SHORT        │ 1.14%  │ 47.51%  │ 0.21       │ rsiDivergency5m │
// │  834 │ KNCUSDT      │ 2024 05 26 23:50:00 │ 2024 05 27 04:10:00 │ SHORT        │ -0.51% │ 110.18% │ 0.71       │ rsiDivergency5m │
// │  835 │ ENJUSDT      │ 2024 05 27 13:10:00 │ 2024 05 27 13:25:00 │ SHORT        │ -0.51% │ 109.67% │ 0.38       │ rsiDivergency5m │
// │  836 │ ENJUSDT      │ 2024 05 27 13:35:00 │ 2024 05 27 20:05:00 │ SHORT        │ -0.51% │ 109.15% │ 0.38       │ rsiDivergency5m │
// │  837 │ ENSUSDT      │ 2024 05 28 05:45:00 │ 2024 05 28 06:35:00 │ SHORT        │ -0.51% │ 107.10% │ 26.95      │ rsiDivergency5m │
// │  838 │ ENSUSDT      │ 2024 05 28 08:20:00 │ 2024 05 28 16:40:00 │ SHORT        │ 2.07%  │ 109.17% │ 28.12      │ rsiDivergency5m │
// │  839 │ 1000SHIBUSDT │ 2024 05 28 22:15:00 │ 2024 05 28 22:40:00 │ SHORT        │ -0.51% │ 108.15% │ 0.03       │ rsiDivergency5m │
// │  840 │ TRUUSDT      │ 2024 05 29 00:55:00 │ 2024 05 29 01:00:00 │ SHORT        │ -0.51% │ 107.64% │ 0.23       │ rsiDivergency5m │
// │  841 │ AMBUSDT      │ 2024 05 29 22:35:00 │ 2024 05 30 02:50:00 │ SHORT        │ -0.51% │ 109.12% │ 0.01       │ rsiDivergency5m │
// │  842 │ AIUSDT       │ 2024 05 29 23:25:00 │ 2024 05 30 07:45:00 │ SHORT        │ 0.02%  │ 68.68%  │ 1.22       │ rsiDivergency5m │
// │  843 │ 1000BONKUSDT │ 2024 05 30 01:55:00 │ 2024 05 30 02:20:00 │ LONG         │ -0.51% │ 92.19%  │ 0.03       │ rsiDivergency5m │
// │  844 │ 1000SHIBUSDT │ 2024 05 30 02:55:00 │ 2024 05 30 11:15:00 │ LONG         │ 0.44%  │ 109.57% │ 0.03       │ rsiDivergency5m │
// │  845 │ WLDUSDT      │ 2024 05 30 16:20:00 │ 2024 05 31 00:20:00 │ LONG         │ -0.51% │ 108.54% │ 4.91       │ rsiDivergency5m │
// │  846 │ ONDOUSDT     │ 2024 06 01 19:20:00 │ 2024 06 02 03:40:00 │ SHORT        │ 0.83%  │ 55.31%  │ 1.43       │ rsiDivergency5m │
// │  847 │ PORTALUSDT   │ 2024 06 02 04:10:00 │ 2024 06 02 10:40:00 │ SHORT        │ -0.51% │ 49.96%  │ 1.00       │ rsiDivergency5m │
// │  848 │ VANRYUSDT    │ 2024 06 02 09:20:00 │ 2024 06 02 09:50:00 │ SHORT        │ -0.51% │ 42.32%  │ 0.21       │ rsiDivergency5m │
// │  849 │ LPTUSDT      │ 2024 06 02 12:40:00 │ 2024 06 02 19:35:00 │ LONG         │ -0.51% │ 108.47% │ 21.66      │ rsiDivergency5m │
// │  850 │ TLMUSDT      │ 2024 06 02 20:25:00 │ 2024 06 02 22:30:00 │ SHORT        │ -0.51% │ 107.95% │ 0.02       │ rsiDivergency5m │
// │  851 │ DARUSDT      │ 2024 06 02 23:40:00 │ 2024 06 02 23:45:00 │ SHORT        │ -0.51% │ 107.44% │ 0.20       │ rsiDivergency5m │
// │  852 │ COTIUSDT     │ 2024 06 03 01:50:00 │ 2024 06 03 03:50:00 │ SHORT        │ -0.51% │ 106.42% │ 0.13       │ rsiDivergency5m │
// │  853 │ HIGHUSDT     │ 2024 06 03 18:55:00 │ 2024 06 03 20:15:00 │ LONG         │ -0.51% │ 105.39% │ 6.60       │ rsiDivergency5m │
// │  854 │ ALICEUSDT    │ 2024 06 04 08:00:00 │ 2024 06 04 16:20:00 │ LONG         │ 0.68%  │ 106.26% │ 2.12       │ rsiDivergency5m │
// │  855 │ CKBUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 20:40:00 │ SHORT        │ -0.51% │ 105.74% │ 0.02       │ rsiDivergency5m │
// │  856 │ RIFUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 19:20:00 │ SHORT        │ -0.51% │ 108.66% │ 0.18       │ rsiDivergency5m │
// │  857 │ CAKEUSDT     │ 2024 06 04 19:35:00 │ 2024 06 04 19:55:00 │ SHORT        │ -0.51% │ 107.17% │ 3.01       │ rsiDivergency5m │
// │  858 │ IDUSDT       │ 2024 06 04 21:30:00 │ 2024 06 05 05:50:00 │ SHORT        │ 0.70%  │ 106.44% │ 0.77       │ rsiDivergency5m │
// │  859 │ GMXUSDT      │ 2024 06 05 10:20:00 │ 2024 06 05 12:00:00 │ SHORT        │ -0.51% │ 104.39% │ 40.26      │ rsiDivergency5m │
// │  860 │ STXUSDT      │ 2024 06 05 12:05:00 │ 2024 06 05 12:55:00 │ SHORT        │ -0.51% │ 103.88% │ 2.39       │ rsiDivergency5m │
// │  861 │ GMXUSDT      │ 2024 06 05 13:05:00 │ 2024 06 05 21:25:00 │ SHORT        │ -0.02% │ 103.86% │ 42.39      │ rsiDivergency5m │
// │  862 │ DENTUSDT     │ 2024 06 05 23:40:00 │ 2024 06 06 08:00:00 │ LONG         │ -0.13% │ 103.21% │ 0.00       │ rsiDivergency5m │
// │  863 │ HIGHUSDT     │ 2024 06 07 08:45:00 │ 2024 06 07 09:00:00 │ SHORT        │ -0.51% │ 101.68% │ 8.30       │ rsiDivergency5m │
// │  864 │ HIGHUSDT     │ 2024 06 07 09:05:00 │ 2024 06 07 13:30:00 │ SHORT        │ -0.51% │ 101.16% │ 8.40       │ rsiDivergency5m │
// │  865 │ TOKENUSDT    │ 2024 06 07 11:15:00 │ 2024 06 07 12:20:00 │ LONG         │ -0.51% │ 106.15% │ 0.16       │ rsiDivergency5m │
// │  866 │ XVSUSDT      │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 1.98%  │ 103.14% │ 10.01      │ rsiDivergency5m │
// │  867 │ NKNUSDT      │ 2024 06 07 23:55:00 │ 2024 06 08 06:40:00 │ LONG         │ -0.51% │ 102.63% │ 0.11       │ rsiDivergency5m │
// │  868 │ ORDIUSDT     │ 2024 06 08 04:00:00 │ 2024 06 08 12:20:00 │ SHORT        │ 0.40%  │ 109.74% │ 62.27      │ rsiDivergency5m │
// │  869 │ POLYXUSDT    │ 2024 06 08 22:15:00 │ 2024 06 09 06:35:00 │ LONG         │ 2.00%  │ 109.64% │ 0.42       │ rsiDivergency5m │
// │  870 │ HIGHUSDT     │ 2024 06 09 11:40:00 │ 2024 06 09 20:00:00 │ SHORT        │ 1.90%  │ 104.70% │ 4.83       │ rsiDivergency5m │
// │  871 │ HIFIUSDT     │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.24%  │ 105.95% │ 0.75       │ rsiDivergency5m │
// │  872 │ INJUSDT      │ 2024 06 10 10:35:00 │ 2024 06 10 18:55:00 │ SHORT        │ 0.10%  │ 106.05% │ 29.47      │ rsiDivergency5m │
// │  873 │ POLYXUSDT    │ 2024 06 10 20:55:00 │ 2024 06 11 05:15:00 │ LONG         │ 0.51%  │ 108.54% │ 0.49       │ rsiDivergency5m │
// │  874 │ ENAUSDT      │ 2024 06 10 21:20:00 │ 2024 06 11 01:55:00 │ LONG         │ -0.51% │ 47.73%  │ 0.75       │ rsiDivergency5m │
// │  875 │ BONDUSDT     │ 2024 06 10 21:25:00 │ 2024 06 11 05:45:00 │ LONG         │ 0.51%  │ 106.55% │ 2.74       │ rsiDivergency5m │
// │  876 │ TOKENUSDT    │ 2024 06 10 21:35:00 │ 2024 06 11 02:45:00 │ LONG         │ -0.51% │ 108.07% │ 0.12       │ rsiDivergency5m │
// │  877 │ OMNIUSDT     │ 2024 06 10 21:40:00 │ 2024 06 11 06:00:00 │ LONG         │ 0.50%  │ 36.47%  │ 14.28      │ rsiDivergency5m │
// │  878 │ CKBUSDT      │ 2024 06 11 08:50:00 │ 2024 06 11 10:35:00 │ LONG         │ -0.51% │ 106.04% │ 0.01       │ rsiDivergency5m │
// │  879 │ INJUSDT      │ 2024 06 11 11:30:00 │ 2024 06 11 12:05:00 │ LONG         │ -0.51% │ 105.53% │ 26.25      │ rsiDivergency5m │
// │  880 │ ENAUSDT      │ 2024 06 11 12:25:00 │ 2024 06 11 20:40:00 │ LONG         │ -0.51% │ 47.56%  │ 0.70       │ rsiDivergency5m │
// │  881 │ GMXUSDT      │ 2024 06 11 12:25:00 │ 2024 06 11 20:45:00 │ LONG         │ -0.13% │ 105.40% │ 34.10      │ rsiDivergency5m │
// │  882 │ ZETAUSDT     │ 2024 06 11 20:00:00 │ 2024 06 11 20:25:00 │ LONG         │ -0.51% │ 51.65%  │ 1.08       │ rsiDivergency5m │
// │  883 │ LPTUSDT      │ 2024 06 11 20:30:00 │ 2024 06 12 01:50:00 │ LONG         │ 2.49%  │ 107.89% │ 19.07      │ rsiDivergency5m │
// │  884 │ ORDIUSDT     │ 2024 06 11 20:30:00 │ 2024 06 12 04:50:00 │ LONG         │ 0.58%  │ 106.91% │ 50.54      │ rsiDivergency5m │
// │  885 │ ZETAUSDT     │ 2024 06 11 20:45:00 │ 2024 06 12 05:05:00 │ LONG         │ 0.96%  │ 52.61%  │ 1.05       │ rsiDivergency5m │
// │  886 │ PENDLEUSDT   │ 2024 06 12 07:45:00 │ 2024 06 12 08:00:00 │ SHORT        │ -0.51% │ 106.86% │ 5.50       │ rsiDivergency5m │
// │  887 │ OMNIUSDT     │ 2024 06 12 08:00:00 │ 2024 06 12 16:20:00 │ SHORT        │ 1.20%  │ 38.09%  │ 16.80      │ rsiDivergency5m │
// │  888 │ PENDLEUSDT   │ 2024 06 12 08:10:00 │ 2024 06 12 16:30:00 │ SHORT        │ 0.51%  │ 107.37% │ 5.57       │ rsiDivergency5m │
// │  889 │ VANRYUSDT    │ 2024 06 12 12:15:00 │ 2024 06 12 12:45:00 │ SHORT        │ -0.51% │ 49.97%  │ 0.18       │ rsiDivergency5m │
// │  890 │ POLYXUSDT    │ 2024 06 13 10:45:00 │ 2024 06 13 11:00:00 │ LONG         │ -0.51% │ 106.93% │ 0.46       │ rsiDivergency5m │
// │  891 │ TOKENUSDT    │ 2024 06 13 11:00:00 │ 2024 06 13 19:20:00 │ LONG         │ -0.22% │ 110.57% │ 0.10       │ rsiDivergency5m │
// │  892 │ TRUUSDT      │ 2024 06 13 17:10:00 │ 2024 06 13 20:30:00 │ LONG         │ -0.51% │ 106.35% │ 0.20       │ rsiDivergency5m │
// │  893 │ KNCUSDT      │ 2024 06 13 19:25:00 │ 2024 06 14 03:45:00 │ LONG         │ 1.63%  │ 107.98% │ 0.72       │ rsiDivergency5m │
// │  894 │ KNCUSDT      │ 2024 06 14 04:30:00 │ 2024 06 14 07:15:00 │ SHORT        │ -0.51% │ 107.46% │ 0.79       │ rsiDivergency5m │
// │  895 │ ARUSDT       │ 2024 06 14 08:05:00 │ 2024 06 14 09:25:00 │ LONG         │ -0.51% │ 106.95% │ 30.01      │ rsiDivergency5m │
// │  896 │ ONGUSDT      │ 2024 06 14 10:50:00 │ 2024 06 14 11:05:00 │ LONG         │ -0.51% │ 102.68% │ 0.37       │ rsiDivergency5m │
// │  897 │ 1000BONKUSDT │ 2024 06 14 11:10:00 │ 2024 06 14 13:05:00 │ LONG         │ -0.51% │ 103.24% │ 0.02       │ rsiDivergency5m │
// │  898 │ BIGTIMEUSDT  │ 2024 06 14 11:10:00 │ 2024 06 14 13:20:00 │ LONG         │ -0.51% │ 106.44% │ 0.14       │ rsiDivergency5m │
// │  899 │ PORTALUSDT   │ 2024 06 14 11:10:00 │ 2024 06 14 13:20:00 │ LONG         │ -0.51% │ 58.11%  │ 0.63       │ rsiDivergency5m │
// │  900 │ TOKENUSDT    │ 2024 06 14 11:35:00 │ 2024 06 14 19:55:00 │ LONG         │ 0.59%  │ 111.20% │ 0.09       │ rsiDivergency5m │
// │  901 │ PENDLEUSDT   │ 2024 06 14 13:15:00 │ 2024 06 14 21:35:00 │ LONG         │ 1.28%  │ 107.71% │ 4.69       │ rsiDivergency5m │
// │  902 │ OMNIUSDT     │ 2024 06 14 19:25:00 │ 2024 06 14 20:05:00 │ SHORT        │ -0.51% │ 40.48%  │ 16.89      │ rsiDivergency5m │
// │  903 │ 1000SHIBUSDT │ 2024 06 14 23:55:00 │ 2024 06 15 08:15:00 │ SHORT        │ -0.06% │ 107.65% │ 0.02       │ rsiDivergency5m │
// │  904 │ RIFUSDT      │ 2024 06 15 06:30:00 │ 2024 06 15 14:10:00 │ LONG         │ -0.51% │ 102.12% │ 0.11       │ rsiDivergency5m │
// │  905 │ RIFUSDT      │ 2024 06 15 15:20:00 │ 2024 06 15 23:40:00 │ LONG         │ 0.68%  │ 102.80% │ 0.11       │ rsiDivergency5m │
// │  906 │ LDOUSDT      │ 2024 06 16 10:10:00 │ 2024 06 16 10:55:00 │ SHORT        │ -0.51% │ 106.63% │ 2.17       │ rsiDivergency5m │
// │  907 │ LDOUSDT      │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 1.01%  │ 107.64% │ 2.24       │ rsiDivergency5m │
// │  908 │ POLYXUSDT    │ 2024 06 16 21:05:00 │ 2024 06 17 02:10:00 │ LONG         │ -0.51% │ 102.70% │ 0.38       │ rsiDivergency5m │
// │  909 │ ROSEUSDT     │ 2024 06 16 22:25:00 │ 2024 06 17 02:35:00 │ LONG         │ -0.51% │ 107.12% │ 0.11       │ rsiDivergency5m │
// │  910 │ WAXPUSDT     │ 2024 06 16 23:15:00 │ 2024 06 17 01:10:00 │ LONG         │ -0.51% │ 106.86% │ 0.04       │ rsiDivergency5m │
// │  911 │ KNCUSDT      │ 2024 06 17 01:55:00 │ 2024 06 17 03:05:00 │ LONG         │ -0.51% │ 106.61% │ 0.68       │ rsiDivergency5m │
// │  912 │ KNCUSDT      │ 2024 06 17 03:10:00 │ 2024 06 17 03:30:00 │ LONG         │ -0.51% │ 106.10% │ 0.67       │ rsiDivergency5m │
// │  913 │ WUSDT        │ 2024 06 17 03:50:00 │ 2024 06 17 05:00:00 │ LONG         │ -0.51% │ 47.00%  │ 0.41       │ rsiDivergency5m │
// │  914 │ POLYXUSDT    │ 2024 06 17 04:50:00 │ 2024 06 17 10:30:00 │ LONG         │ -0.51% │ 102.19% │ 0.36       │ rsiDivergency5m │
// │  915 │ STRKUSDT     │ 2024 06 17 04:55:00 │ 2024 06 17 05:05:00 │ LONG         │ -0.51% │ 52.30%  │ 0.83       │ rsiDivergency5m │
// │  916 │ WUSDT        │ 2024 06 17 05:05:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 46.49%  │ 0.40       │ rsiDivergency5m │
// │  917 │ BIGTIMEUSDT  │ 2024 06 17 05:10:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 105.59% │ 0.13       │ rsiDivergency5m │
// │  918 │ PIXELUSDT    │ 2024 06 17 05:10:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 50.77%  │ 0.32       │ rsiDivergency5m │
// │  919 │ USTCUSDT     │ 2024 06 17 05:15:00 │ 2024 06 17 08:45:00 │ LONG         │ -0.51% │ 103.89% │ 0.02       │ rsiDivergency5m │
// │  920 │ KNCUSDT      │ 2024 06 17 10:55:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 105.07% │ 0.62       │ rsiDivergency5m │
// │  921 │ TNSRUSDT     │ 2024 06 17 18:20:00 │ 2024 06 17 19:10:00 │ LONG         │ -0.51% │ 48.24%  │ 0.73       │ rsiDivergency5m │
// │  922 │ 1000SATSUSDT │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 93.45%  │ 0.00       │ rsiDivergency5m │
// │  923 │ ACEUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 85.63%  │ 3.56       │ rsiDivergency5m │
// │  924 │ BIGTIMEUSDT  │ 2024 06 17 20:25:00 │ 2024 06 17 20:35:00 │ LONG         │ -0.51% │ 104.56% │ 0.12       │ rsiDivergency5m │
// │  925 │ MANTAUSDT    │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 75.00%  │ 1.08       │ rsiDivergency5m │
// │  926 │ NTRNUSDT     │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 106.66% │ 0.54       │ rsiDivergency5m │
// │  927 │ PORTALUSDT   │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 56.79%  │ 0.52       │ rsiDivergency5m │
// │  928 │ STRKUSDT     │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 53.25%  │ 0.75       │ rsiDivergency5m │
// │  929 │ SUPERUSDT    │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 103.75% │ 0.71       │ rsiDivergency5m │
// │  930 │ VANRYUSDT    │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 51.13%  │ 0.15       │ rsiDivergency5m │
// │  931 │ MANAUSDT     │ 2024 06 17 20:50:00 │ 2024 06 18 05:10:00 │ LONG         │ 0.39%  │ 104.44% │ 0.32       │ rsiDivergency5m │
// │  932 │ NMRUSDT      │ 2024 06 18 06:30:00 │ 2024 06 18 09:05:00 │ LONG         │ -0.51% │ 103.92% │ 17.53      │ rsiDivergency5m │
// │  933 │ NTRNUSDT     │ 2024 06 18 06:30:00 │ 2024 06 18 09:05:00 │ LONG         │ -0.51% │ 105.64% │ 0.51       │ rsiDivergency5m │
// │  934 │ TAOUSDT      │ 2024 06 18 09:05:00 │ 2024 06 18 16:50:00 │ LONG         │ 2.49%  │ 48.07%  │ 258.16     │ rsiDivergency5m │
// │  935 │ FRONTUSDT    │ 2024 06 18 09:40:00 │ 2024 06 18 12:30:00 │ SHORT        │ 2.49%  │ 106.41% │ 1.06       │ rsiDivergency5m │
// │  936 │ 1INCHUSDT    │ 2024 06 18 12:20:00 │ 2024 06 18 15:15:00 │ SHORT        │ -0.51% │ 105.90% │ 0.39       │ rsiDivergency5m │
// │  937 │ CRVUSDT      │ 2024 06 18 15:50:00 │ 2024 06 18 16:30:00 │ SHORT        │ -0.51% │ 105.39% │ 0.32       │ rsiDivergency5m │
// │  938 │ CRVUSDT      │ 2024 06 18 17:20:00 │ 2024 06 18 19:45:00 │ SHORT        │ -0.51% │ 104.87% │ 0.33       │ rsiDivergency5m │
// │  939 │ ENSUSDT      │ 2024 06 18 20:30:00 │ 2024 06 18 21:20:00 │ SHORT        │ -0.51% │ 104.36% │ 26.56      │ rsiDivergency5m │
// │  940 │ FETUSDT      │ 2024 06 18 23:10:00 │ 2024 06 19 01:10:00 │ SHORT        │ -0.51% │ 103.85% │ 1.27       │ rsiDivergency5m │
// │  941 │ MKRUSDT      │ 2024 06 19 01:40:00 │ 2024 06 19 10:00:00 │ SHORT        │ 0.94%  │ 104.79% │ 2490.30    │ rsiDivergency5m │
// │  942 │ FETUSDT      │ 2024 06 19 12:25:00 │ 2024 06 19 16:10:00 │ SHORT        │ -0.51% │ 104.28% │ 1.45       │ rsiDivergency5m │
// │  943 │ BONDUSDT     │ 2024 06 19 22:35:00 │ 2024 06 19 23:20:00 │ SHORT        │ -0.51% │ 103.76% │ 2.11       │ rsiDivergency5m │
// │  944 │ BONDUSDT     │ 2024 06 20 08:30:00 │ 2024 06 20 11:05:00 │ LONG         │ -0.51% │ 103.57% │ 2.08       │ rsiDivergency5m │
// │  945 │ VANRYUSDT    │ 2024 06 20 11:10:00 │ 2024 06 20 19:30:00 │ LONG         │ 0.39%  │ 53.53%  │ 0.14       │ rsiDivergency5m │
// │  946 │ MYROUSDT     │ 2024 06 20 18:30:00 │ 2024 06 20 19:15:00 │ LONG         │ -0.51% │ 57.91%  │ 0.14       │ rsiDivergency5m │
// │  947 │ 1000BONKUSDT │ 2024 06 21 04:00:00 │ 2024 06 21 12:20:00 │ LONG         │ 0.23%  │ 108.87% │ 0.02       │ rsiDivergency5m │
// │  948 │ ONGUSDT      │ 2024 06 21 13:05:00 │ 2024 06 21 21:25:00 │ LONG         │ 1.66%  │ 108.00% │ 0.34       │ rsiDivergency5m │
// │  949 │ 1000LUNCUSDT │ 2024 06 21 23:30:00 │ 2024 06 21 23:50:00 │ LONG         │ -0.51% │ 107.43% │ 0.08       │ rsiDivergency5m │
// │  950 │ 1000LUNCUSDT │ 2024 06 21 23:55:00 │ 2024 06 22 00:50:00 │ LONG         │ -0.51% │ 106.92% │ 0.08       │ rsiDivergency5m │
// │  951 │ 1000LUNCUSDT │ 2024 06 22 01:05:00 │ 2024 06 22 01:10:00 │ LONG         │ -0.51% │ 106.41% │ 0.08       │ rsiDivergency5m │
// │  952 │ 1000SATSUSDT │ 2024 06 22 12:00:00 │ 2024 06 22 20:20:00 │ SHORT        │ 0.48%  │ 96.00%  │ 0.00       │ rsiDivergency5m │
// │  953 │ MTLUSDT      │ 2024 06 23 01:00:00 │ 2024 06 23 01:10:00 │ SHORT        │ -0.51% │ 105.84% │ 1.25       │ rsiDivergency5m │
// │  954 │ MTLUSDT      │ 2024 06 23 09:50:00 │ 2024 06 23 11:00:00 │ LONG         │ -0.51% │ 104.82% │ 1.22       │ rsiDivergency5m │
// │  955 │ FRONTUSDT    │ 2024 06 23 12:05:00 │ 2024 06 23 15:20:00 │ LONG         │ -0.51% │ 104.31% │ 0.85       │ rsiDivergency5m │
// │  956 │ TRUUSDT      │ 2024 06 23 17:10:00 │ 2024 06 23 18:15:00 │ LONG         │ -0.51% │ 103.79% │ 0.13       │ rsiDivergency5m │
// │  957 │ TRUUSDT      │ 2024 06 23 18:20:00 │ 2024 06 24 00:05:00 │ LONG         │ -0.51% │ 103.28% │ 0.13       │ rsiDivergency5m │
// │  958 │ ZETAUSDT     │ 2024 06 24 00:45:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.51% │ 68.50%  │ 0.78       │ rsiDivergency5m │
// │  959 │ DODOXUSDT    │ 2024 06 24 02:10:00 │ 2024 06 24 02:45:00 │ LONG         │ -0.51% │ 102.77% │ 0.12       │ rsiDivergency5m │
// │  960 │ SUIUSDT      │ 2024 06 24 03:15:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.51% │ 102.26% │ 0.82       │ rsiDivergency5m │
// │  961 │ RDNTUSDT     │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 1.15%  │ 103.40% │ 0.12       │ rsiDivergency5m │
// │  962 │ STRKUSDT     │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 1.58%  │ 53.99%  │ 0.66       │ rsiDivergency5m │
// │  963 │ ORDIUSDT     │ 2024 06 24 04:45:00 │ 2024 06 24 10:40:00 │ LONG         │ -0.51% │ 107.00% │ 35.30      │ rsiDivergency5m │
// │  964 │ LDOUSDT      │ 2024 06 24 15:55:00 │ 2024 06 24 16:15:00 │ SHORT        │ -0.51% │ 102.89% │ 2.40       │ rsiDivergency5m │
// │  965 │ ONDOUSDT     │ 2024 06 24 16:05:00 │ 2024 06 24 18:55:00 │ SHORT        │ -0.51% │ 72.86%  │ 1.19       │ rsiDivergency5m │
// │  966 │ LDOUSDT      │ 2024 06 24 16:20:00 │ 2024 06 25 00:40:00 │ SHORT        │ 0.07%  │ 102.96% │ 2.42       │ rsiDivergency5m │
// │  967 │ STRKUSDT     │ 2024 06 24 17:40:00 │ 2024 06 25 02:00:00 │ SHORT        │ 0.16%  │ 54.15%  │ 0.73       │ rsiDivergency5m │
// │  968 │ TNSRUSDT     │ 2024 06 24 17:40:00 │ 2024 06 24 22:00:00 │ SHORT        │ -0.51% │ 44.52%  │ 0.60       │ rsiDivergency5m │
// │  969 │ TNSRUSDT     │ 2024 06 24 22:40:00 │ 2024 06 25 07:00:00 │ SHORT        │ 0.69%  │ 45.21%  │ 0.63       │ rsiDivergency5m │
// │  970 │ STXUSDT      │ 2024 06 25 07:00:00 │ 2024 06 25 09:20:00 │ SHORT        │ -0.51% │ 102.44% │ 1.71       │ rsiDivergency5m │
// │  971 │ STXUSDT      │ 2024 06 25 17:05:00 │ 2024 06 26 01:25:00 │ SHORT        │ 0.82%  │ 103.27% │ 1.79       │ rsiDivergency5m │
// │  972 │ FETUSDT      │ 2024 06 26 21:10:00 │ 2024 06 26 21:55:00 │ LONG         │ -0.51% │ 102.76% │ 1.67       │ rsiDivergency5m │
// │  973 │ ENSUSDT      │ 2024 06 27 04:30:00 │ 2024 06 27 05:30:00 │ SHORT        │ -0.51% │ 102.24% │ 25.94      │ rsiDivergency5m │
// │  974 │ LEVERUSDT    │ 2024 06 27 06:25:00 │ 2024 06 27 06:40:00 │ SHORT        │ -0.51% │ 101.73% │ 0.00       │ rsiDivergency5m │
// │  975 │ LEVERUSDT    │ 2024 06 27 07:00:00 │ 2024 06 27 07:05:00 │ SHORT        │ -0.51% │ 101.22% │ 0.00       │ rsiDivergency5m │
// │  976 │ LEVERUSDT    │ 2024 06 27 07:15:00 │ 2024 06 27 07:25:00 │ SHORT        │ -0.51% │ 100.71% │ 0.00       │ rsiDivergency5m │
// │  977 │ LEVERUSDT    │ 2024 06 27 07:50:00 │ 2024 06 27 13:25:00 │ SHORT        │ -0.51% │ 100.19% │ 0.00       │ rsiDivergency5m │
// │  978 │ LEVERUSDT    │ 2024 06 27 14:00:00 │ 2024 06 27 22:20:00 │ SHORT        │ -0.06% │ 100.14% │ 0.00       │ rsiDivergency5m │
// │  979 │ FETUSDT      │ 2024 06 28 00:10:00 │ 2024 06 28 08:30:00 │ LONG         │ 0.43%  │ 100.57% │ 1.45       │ rsiDivergency5m │
// │  980 │ YFIUSDT      │ 2024 06 28 13:55:00 │ 2024 06 28 18:50:00 │ SHORT        │ -0.51% │ 100.05% │ 6207.00    │ rsiDivergency5m │
// │  981 │ MYROUSDT     │ 2024 06 28 22:05:00 │ 2024 06 29 06:25:00 │ SHORT        │ 0.45%  │ 50.28%  │ 0.14       │ rsiDivergency5m │
// │  982 │ BONDUSDT     │ 2024 06 29 13:05:00 │ 2024 06 29 14:30:00 │ LONG         │ -0.51% │ 99.54%  │ 2.27       │ rsiDivergency5m │
// │  983 │ BONDUSDT     │ 2024 06 29 15:50:00 │ 2024 06 29 17:15:00 │ LONG         │ -0.51% │ 99.03%  │ 2.21       │ rsiDivergency5m │
// │  984 │ ARPAUSDT     │ 2024 06 29 19:15:00 │ 2024 06 29 20:00:00 │ LONG         │ -0.51% │ 98.52%  │ 0.04       │ rsiDivergency5m │
// │  985 │ ARPAUSDT     │ 2024 06 29 20:05:00 │ 2024 06 30 03:05:00 │ LONG         │ 2.49%  │ 101.00% │ 0.04       │ rsiDivergency5m │
// │  986 │ NTRNUSDT     │ 2024 06 30 08:20:00 │ 2024 06 30 12:00:00 │ LONG         │ -0.51% │ 108.03% │ 0.47       │ rsiDivergency5m │
// │  987 │ NTRNUSDT     │ 2024 06 30 12:05:00 │ 2024 06 30 16:10:00 │ LONG         │ -0.51% │ 107.52% │ 0.46       │ rsiDivergency5m │
// │  988 │ ENSUSDT      │ 2024 06 30 15:45:00 │ 2024 06 30 17:35:00 │ SHORT        │ -0.51% │ 100.49% │ 29.45      │ rsiDivergency5m │
// │  989 │ ENSUSDT      │ 2024 06 30 17:40:00 │ 2024 06 30 18:20:00 │ SHORT        │ -0.51% │ 99.98%  │ 30.22      │ rsiDivergency5m │
// │  990 │ ENSUSDT      │ 2024 06 30 18:30:00 │ 2024 06 30 19:00:00 │ SHORT        │ -0.51% │ 99.47%  │ 30.62      │ rsiDivergency5m │
// │  991 │ ENSUSDT      │ 2024 06 30 19:05:00 │ 2024 06 30 19:15:00 │ SHORT        │ -0.51% │ 98.95%  │ 30.70      │ rsiDivergency5m │
// │  992 │ PORTALUSDT   │ 2024 07 01 10:25:00 │ 2024 07 01 18:45:00 │ LONG         │ 0.20%  │ 54.02%  │ 0.44       │ rsiDivergency5m │
// │  993 │ FETUSDT      │ 2024 07 01 16:15:00 │ 2024 07 01 17:30:00 │ LONG         │ -0.51% │ 101.78% │ 1.34       │ rsiDivergency5m │
// │  994 │ PENDLEUSDT   │ 2024 07 02 18:00:00 │ 2024 07 02 19:25:00 │ LONG         │ -0.51% │ 100.76% │ 4.12       │ rsiDivergency5m │
// │  995 │ WLDUSDT      │ 2024 07 02 21:05:00 │ 2024 07 02 22:10:00 │ LONG         │ -0.51% │ 100.25% │ 2.21       │ rsiDivergency5m │
// │  996 │ ALTUSDT      │ 2024 07 02 21:40:00 │ 2024 07 03 06:00:00 │ LONG         │ 0.22%  │ 75.92%  │ 0.15       │ rsiDivergency5m │
// │  997 │ WLDUSDT      │ 2024 07 02 22:15:00 │ 2024 07 03 05:40:00 │ LONG         │ 2.49%  │ 102.73% │ 2.17       │ rsiDivergency5m │
// │  998 │ INJUSDT      │ 2024 07 03 06:35:00 │ 2024 07 03 08:05:00 │ LONG         │ -0.51% │ 102.22% │ 21.48      │ rsiDivergency5m │
// │  999 │ 1000BONKUSDT │ 2024 07 03 07:40:00 │ 2024 07 03 10:55:00 │ LONG         │ -0.51% │ 111.13% │ 0.02       │ rsiDivergency5m │
// │ 1000 │ MKRUSDT      │ 2024 07 03 08:05:00 │ 2024 07 03 16:25:00 │ LONG         │ -0.42% │ 101.29% │ 2340.30    │ rsiDivergency5m │
// │ 1001 │ WLDUSDT      │ 2024 07 03 08:45:00 │ 2024 07 03 08:50:00 │ SHORT        │ -0.51% │ 101.71% │ 2.50       │ rsiDivergency5m │
// │ 1002 │ 1000BONKUSDT │ 2024 07 03 11:10:00 │ 2024 07 03 13:00:00 │ LONG         │ -0.51% │ 110.62% │ 0.02       │ rsiDivergency5m │
// │ 1003 │ ENSUSDT      │ 2024 07 03 17:30:00 │ 2024 07 03 20:10:00 │ LONG         │ -0.51% │ 100.78% │ 25.33      │ rsiDivergency5m │
// │ 1004 │ OXTUSDT      │ 2024 07 03 21:00:00 │ 2024 07 04 03:40:00 │ LONG         │ -0.51% │ 100.27% │ 0.07       │ rsiDivergency5m │
// │ 1005 │ SUPERUSDT    │ 2024 07 03 21:10:00 │ 2024 07 04 02:15:00 │ LONG         │ -0.51% │ 107.56% │ 0.59       │ rsiDivergency5m │
// │ 1006 │ ROSEUSDT     │ 2024 07 04 05:20:00 │ 2024 07 04 08:00:00 │ LONG         │ -0.51% │ 99.76%  │ 0.09       │ rsiDivergency5m │
// │ 1007 │ LRCUSDT      │ 2024 07 04 08:05:00 │ 2024 07 04 16:25:00 │ LONG         │ 0.29%  │ 100.05% │ 0.15       │ rsiDivergency5m │
// │ 1008 │ ONGUSDT      │ 2024 07 04 08:20:00 │ 2024 07 04 16:40:00 │ LONG         │ 0.17%  │ 107.20% │ 0.29       │ rsiDivergency5m │
// │ 1009 │ LOOMUSDT     │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 99.54%  │ 0.04       │ rsiDivergency5m │
// │ 1010 │ TOKENUSDT    │ 2024 07 04 19:45:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 107.14% │ 0.06       │ rsiDivergency5m │
// │ 1011 │ ORDIUSDT     │ 2024 07 04 20:25:00 │ 2024 07 04 20:35:00 │ LONG         │ -0.51% │ 107.37% │ 28.48      │ rsiDivergency5m │
// │ 1012 │ NTRNUSDT     │ 2024 07 04 20:35:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 105.93% │ 0.37       │ rsiDivergency5m │
// │ 1013 │ YGGUSDT      │ 2024 07 04 20:35:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 99.03%  │ 0.41       │ rsiDivergency5m │
// │ 1014 │ MYROUSDT     │ 2024 07 04 21:30:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 49.59%  │ 0.09       │ rsiDivergency5m │
// │ 1015 │ BEAMXUSDT    │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 106.49% │ 0.01       │ rsiDivergency5m │
// │ 1016 │ DODOXUSDT    │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 98.51%  │ 0.09       │ rsiDivergency5m │
// │ 1017 │ MINAUSDT     │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 97.49%  │ 0.41       │ rsiDivergency5m │
// │ 1018 │ NTRNUSDT     │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 105.41% │ 0.35       │ rsiDivergency5m │
// │ 1019 │ XVSUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:10:00 │ LONG         │ -0.51% │ 98.00%  │ 4.70       │ rsiDivergency5m │
// │ 1020 │ BEAMXUSDT    │ 2024 07 04 22:10:00 │ 2024 07 05 06:15:00 │ LONG         │ 2.49%  │ 108.98% │ 0.01       │ rsiDivergency5m │
// │ 1021 │ MINAUSDT     │ 2024 07 04 22:10:00 │ 2024 07 05 06:30:00 │ LONG         │ 2.49%  │ 99.98%  │ 0.40       │ rsiDivergency5m │
// │ 1022 │ NTRNUSDT     │ 2024 07 04 22:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.51% │ 104.90% │ 0.34       │ rsiDivergency5m │
// │ 1023 │ CAKEUSDT     │ 2024 07 05 05:30:00 │ 2024 07 05 06:40:00 │ SHORT        │ -0.51% │ 104.05% │ 1.64       │ rsiDivergency5m │
// │ 1024 │ 1000BONKUSDT │ 2024 07 05 06:30:00 │ 2024 07 05 07:20:00 │ SHORT        │ -0.51% │ 108.64% │ 0.02       │ rsiDivergency5m │
// │ 1025 │ NEOUSDT      │ 2024 07 05 06:30:00 │ 2024 07 05 08:35:00 │ SHORT        │ -0.51% │ 98.95%  │ 9.11       │ rsiDivergency5m │
// │ 1026 │ POWRUSDT     │ 2024 07 05 06:30:00 │ 2024 07 05 08:35:00 │ SHORT        │ -0.51% │ 105.33% │ 0.16       │ rsiDivergency5m │
// │ 1027 │ TUSDT        │ 2024 07 05 06:30:00 │ 2024 07 05 07:30:00 │ SHORT        │ -0.51% │ 99.46%  │ 0.02       │ rsiDivergency5m │
// │ 1028 │ WAXPUSDT     │ 2024 07 05 06:45:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.51% │ 101.27% │ 0.03       │ rsiDivergency5m │
// │ 1029 │ ALGOUSDT     │ 2024 07 05 08:40:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.51% │ 98.44%  │ 0.13       │ rsiDivergency5m │
// │ 1030 │ 1000BONKUSDT │ 2024 07 05 09:40:00 │ 2024 07 05 10:05:00 │ SHORT        │ -0.51% │ 108.13% │ 0.02       │ rsiDivergency5m │
// │ 1031 │ 1000BONKUSDT │ 2024 07 05 10:10:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.51% │ 107.62% │ 0.02       │ rsiDivergency5m │
// │ 1032 │ ALGOUSDT     │ 2024 07 05 10:10:00 │ 2024 07 05 11:20:00 │ SHORT        │ -0.51% │ 97.93%  │ 0.13       │ rsiDivergency5m │
// │ 1033 │ NTRNUSDT     │ 2024 07 05 10:35:00 │ 2024 07 05 11:25:00 │ SHORT        │ -0.51% │ 103.34% │ 0.35       │ rsiDivergency5m │
// │ 1034 │ YFIUSDT      │ 2024 07 05 11:50:00 │ 2024 07 05 20:10:00 │ SHORT        │ 0.09%  │ 98.01%  │ 6290.00    │ rsiDivergency5m │
// │ 1035 │ HIGHUSDT     │ 2024 07 06 11:25:00 │ 2024 07 06 14:15:00 │ SHORT        │ -0.51% │ 97.50%  │ 1.54       │ rsiDivergency5m │
// │ 1036 │ FILUSDT      │ 2024 07 06 13:30:00 │ 2024 07 06 17:15:00 │ SHORT        │ -0.51% │ 96.99%  │ 3.89       │ rsiDivergency5m │
// │ 1037 │ ACEUSDT      │ 2024 07 06 14:05:00 │ 2024 07 06 17:00:00 │ SHORT        │ -0.51% │ 103.37% │ 2.64       │ rsiDivergency5m │
// │ 1038 │ PORTALUSDT   │ 2024 07 06 15:35:00 │ 2024 07 06 16:45:00 │ SHORT        │ -0.51% │ 53.51%  │ 0.35       │ rsiDivergency5m │
// │ 1039 │ FRONTUSDT    │ 2024 07 06 18:45:00 │ 2024 07 06 20:10:00 │ SHORT        │ -0.51% │ 96.48%  │ 0.82       │ rsiDivergency5m │
// │ 1040 │ TNSRUSDT     │ 2024 07 06 20:25:00 │ 2024 07 07 04:45:00 │ LONG         │ 0.69%  │ 52.18%  │ 0.40       │ rsiDivergency5m │
// │ 1041 │ TRUUSDT      │ 2024 07 06 20:25:00 │ 2024 07 07 02:40:00 │ LONG         │ -0.51% │ 95.96%  │ 0.11       │ rsiDivergency5m │
// │ 1042 │ SAGAUSDT     │ 2024 07 07 07:10:00 │ 2024 07 07 07:20:00 │ SHORT        │ -0.51% │ 51.67%  │ 1.32       │ rsiDivergency5m │
// │ 1043 │ 1000SHIBUSDT │ 2024 07 07 08:40:00 │ 2024 07 07 17:00:00 │ LONG         │ 0.05%  │ 96.01%  │ 0.02       │ rsiDivergency5m │
// │ 1044 │ PENDLEUSDT   │ 2024 07 07 19:10:00 │ 2024 07 07 19:40:00 │ LONG         │ -0.51% │ 95.50%  │ 3.53       │ rsiDivergency5m │
// │ 1045 │ 1000BONKUSDT │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.51% │ 109.06% │ 0.02       │ rsiDivergency5m │
// │ 1046 │ FETUSDT      │ 2024 07 07 19:50:00 │ 2024 07 08 03:10:00 │ LONG         │ 2.49%  │ 97.47%  │ 1.07       │ rsiDivergency5m │
// │ 1047 │ PENDLEUSDT   │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.51% │ 94.99%  │ 3.45       │ rsiDivergency5m │
// │ 1048 │ PORTALUSDT   │ 2024 07 07 19:50:00 │ 2024 07 07 20:10:00 │ LONG         │ -0.51% │ 52.49%  │ 0.34       │ rsiDivergency5m │
// │ 1049 │ AIUSDT       │ 2024 07 07 20:10:00 │ 2024 07 08 03:45:00 │ LONG         │ 2.49%  │ 85.72%  │ 0.49       │ rsiDivergency5m │
// │ 1050 │ CAKEUSDT     │ 2024 07 07 20:10:00 │ 2024 07 08 03:45:00 │ LONG         │ 2.49%  │ 106.06% │ 1.66       │ rsiDivergency5m │
// │ 1051 │ LSKUSDT      │ 2024 07 07 20:10:00 │ 2024 07 08 04:30:00 │ LONG         │ 2.13%  │ 81.25%  │ 0.82       │ rsiDivergency5m │
// │ 1052 │ MANTAUSDT    │ 2024 07 07 20:10:00 │ 2024 07 08 03:25:00 │ LONG         │ 2.49%  │ 83.57%  │ 0.76       │ rsiDivergency5m │
// │ 1053 │ MYROUSDT     │ 2024 07 07 20:10:00 │ 2024 07 08 01:35:00 │ LONG         │ 2.49%  │ 52.41%  │ 0.10       │ rsiDivergency5m │
// │ 1054 │ RIFUSDT      │ 2024 07 07 20:10:00 │ 2024 07 08 04:00:00 │ LONG         │ 2.49%  │ 101.44% │ 0.07       │ rsiDivergency5m │
// │ 1055 │ HIGHUSDT     │ 2024 07 08 03:50:00 │ 2024 07 08 12:10:00 │ SHORT        │ 0.64%  │ 98.11%  │ 1.53       │ rsiDivergency5m │
// │ 1056 │ CAKEUSDT     │ 2024 07 08 03:55:00 │ 2024 07 08 12:15:00 │ SHORT        │ 0.88%  │ 106.94% │ 1.82       │ rsiDivergency5m │
// │ 1057 │ WUSDT        │ 2024 07 08 03:55:00 │ 2024 07 08 04:20:00 │ SHORT        │ -0.51% │ 51.67%  │ 0.29       │ rsiDivergency5m │
// │ 1058 │ RIFUSDT      │ 2024 07 08 04:30:00 │ 2024 07 08 12:50:00 │ SHORT        │ 0.86%  │ 102.30% │ 0.08       │ rsiDivergency5m │
// │ 1059 │ 1000BONKUSDT │ 2024 07 08 08:10:00 │ 2024 07 08 08:30:00 │ SHORT        │ -0.51% │ 108.03% │ 0.02       │ rsiDivergency5m │
// │ 1060 │ TAOUSDT      │ 2024 07 09 06:00:00 │ 2024 07 09 09:05:00 │ SHORT        │ -0.51% │ 49.62%  │ 251.82     │ rsiDivergency5m │
// │ 1061 │ STGUSDT      │ 2024 07 09 12:00:00 │ 2024 07 09 13:30:00 │ SHORT        │ -0.51% │ 97.60%  │ 0.37       │ rsiDivergency5m │
// │ 1062 │ 1000SATSUSDT │ 2024 07 09 20:35:00 │ 2024 07 09 23:05:00 │ SHORT        │ -0.51% │ 110.26% │ 0.00       │ rsiDivergency5m │
// │ 1063 │ FTMUSDT      │ 2024 07 10 03:50:00 │ 2024 07 10 06:25:00 │ LONG         │ -0.51% │ 97.09%  │ 0.47       │ rsiDivergency5m │
// │ 1064 │ WLDUSDT      │ 2024 07 10 09:55:00 │ 2024 07 10 10:40:00 │ SHORT        │ -0.51% │ 96.57%  │ 2.01       │ rsiDivergency5m │
// │ 1065 │ TOKENUSDT    │ 2024 07 10 11:40:00 │ 2024 07 10 20:00:00 │ SHORT        │ 1.01%  │ 107.94% │ 0.07       │ rsiDivergency5m │
// │ 1066 │ 1000SATSUSDT │ 2024 07 10 21:00:00 │ 2024 07 10 21:10:00 │ SHORT        │ -0.51% │ 109.23% │ 0.00       │ rsiDivergency5m │
// │ 1067 │ STXUSDT      │ 2024 07 11 03:00:00 │ 2024 07 11 06:50:00 │ SHORT        │ -0.51% │ 96.06%  │ 1.65       │ rsiDivergency5m │
// │ 1068 │ ACEUSDT      │ 2024 07 11 06:40:00 │ 2024 07 11 15:00:00 │ SHORT        │ 2.24%  │ 105.10% │ 3.05       │ rsiDivergency5m │
// │ 1069 │ 1000BONKUSDT │ 2024 07 11 13:10:00 │ 2024 07 11 15:10:00 │ LONG         │ -0.51% │ 105.90% │ 0.02       │ rsiDivergency5m │
// │ 1070 │ RNDRUSDT     │ 2024 07 11 15:15:00 │ 2024 07 11 20:20:00 │ LONG         │ -0.51% │ 95.55%  │ 6.00       │ rsiDivergency5m │
// │ 1071 │ TNSRUSDT     │ 2024 07 11 16:25:00 │ 2024 07 12 00:45:00 │ LONG         │ 1.51%  │ 50.47%  │ 0.42       │ rsiDivergency5m │
// │ 1072 │ ZETAUSDT     │ 2024 07 11 16:25:00 │ 2024 07 12 00:45:00 │ LONG         │ 0.02%  │ 76.36%  │ 0.63       │ rsiDivergency5m │
// │ 1073 │ TOKENUSDT    │ 2024 07 11 18:25:00 │ 2024 07 12 02:45:00 │ LONG         │ -0.05% │ 106.36% │ 0.07       │ rsiDivergency5m │
// │ 1074 │ 1000BONKUSDT │ 2024 07 12 05:10:00 │ 2024 07 12 13:30:00 │ LONG         │ 0.18%  │ 105.57% │ 0.02       │ rsiDivergency5m │
// │ 1075 │ STXUSDT      │ 2024 07 12 09:00:00 │ 2024 07 12 09:10:00 │ SHORT        │ -0.51% │ 95.04%  │ 1.69       │ rsiDivergency5m │
// │ 1076 │ ORDIUSDT     │ 2024 07 12 13:20:00 │ 2024 07 12 16:10:00 │ SHORT        │ 0.32%  │ 104.08% │ 34.13      │ rsiDivergency5m │
// └──────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴─────────┴────────────┴─────────────────┘
