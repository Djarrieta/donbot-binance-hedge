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
	"DASHUSDT",
	"XTZUSDT",
	"ONTUSDT",
	"IOTAUSDT",
	"BATUSDT",
	"VETUSDT",
	"NEOUSDT",
	"QTUMUSDT",
	"IOSTUSDT",
	"ALGOUSDT",
	"ZILUSDT",
	"KNCUSDT",
	"ZRXUSDT",
	"COMPUSDT",
	"DOGEUSDT",
	"SXPUSDT",
	"KAVAUSDT",
	"RLCUSDT",
	"MKRUSDT",
	"DEFIUSDT",
	"CRVUSDT",
	"RUNEUSDT",
	"ICXUSDT",
	"STORJUSDT",
	"FTMUSDT",
	"FLMUSDT",
	"FILUSDT",
	"RSRUSDT",
	"LRCUSDT",
	"AXSUSDT",
	"ALPHAUSDT",
	"SKLUSDT",
	"GRTUSDT",
	"1INCHUSDT",
	"CHZUSDT",
	"SANDUSDT",
	"ANKRUSDT",
	"REEFUSDT",
	"RVNUSDT",
	"SFPUSDT",
	"XEMUSDT",
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
	"C98USDT",
	"MASKUSDT",
	"ATAUSDT",
	"DYDXUSDT",
	"1000XECUSDT",
	"GALAUSDT",
	"CELOUSDT",
	"ARUSDT",
	"KLAYUSDT",
	"ARPAUSDT",
	"CTSIUSDT",
	"LPTUSDT",
	"ROSEUSDT",
	"DUSKUSDT",
	"FLOWUSDT",
	"API3USDT",
	"GMTUSDT",
	"APEUSDT",
	"DARUSDT",
	"OPUSDT",
	"LUNA2USDT",
	"LDOUSDT",
	"APTUSDT",
	"FXSUSDT",
	"HOOKUSDT",
	"MAGICUSDT",
	"TUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"ASTRUSDT",
	"PHBUSDT",
	"CFXUSDT",
	"STXUSDT",
	"TRUUSDT",
	"LQTYUSDT",
	"IDUSDT",
	"ARBUSDT",
	"JOEUSDT",
	"TLMUSDT",
	"AMBUSDT",
	"HFTUSDT",
	"BLURUSDT",
	"SUIUSDT",
	"1000PEPEUSDT",
	"UMAUSDT",
	"KEYUSDT",
	"NMRUSDT",
	"MAVUSDT",
	"WLDUSDT",
	"PENDLEUSDT",
	"ARKMUSDT",
	"YGGUSDT",
	"DODOXUSDT",
	"BNTUSDT",
	"SEIUSDT",
	"HIFIUSDT",
	"ORBSUSDT",
	"WAXPUSDT",
	"RIFUSDT",
	"POLYXUSDT",
	"GASUSDT",
	"CAKEUSDT",
	"MEMEUSDT",
	"TWTUSDT",
	"BADGERUSDT",
	"BEAMXUSDT",
	"1000BONKUSDT",
	"SUPERUSDT",
	"USTCUSDT",
	"ETHWUSDT",
	"ACEUSDT",
	"AIUSDT",
	"MANTAUSDT",
	"LSKUSDT",
	"ALTUSDT",
	"JUPUSDT",
	"ZETAUSDT",
	"PORTALUSDT",
	"TONUSDT",
	"MYROUSDT",
	"VANRYUSDT",
	"ENAUSDT",
	"WUSDT",
	"SAGAUSDT",
	"TAOUSDT",
	"OMNIUSDT",
	"REZUSDT",
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
// Winning pairs:

// Snapshot data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼────────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 2690      │ 0.17% │ 27.25%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬──────────┬────────────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ drawdown │ drawdownMonteCarlo │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼──────────┼────────────────────┼─────────┼───────────────┤
// │ 0 │ 1.00% │ 10.00% │ 100            │ 402       │ 31.93%    │ -0.26%    │ 31.00% │ 4.10%    │ 10.98%             │ 24.38%  │ 35.19         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴──────────┴────────────────────┴─────────┴───────────────┘

// ┌─────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬────────┬────────────┬─────────────────┐
// │     │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl │ entryPrice │ stgName         │
// ├─────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼────────┼────────────┼─────────────────┤
// │   0 │ ETHWUSDT     │ 2024 04 11 20:00:00 │ 2024 04 11 21:30:00 │ SHORT        │ -0.26% │ -0.26% │ 5.07       │ rsiDivergency5m │
// │   1 │ AMBUSDT      │ 2024 04 11 21:35:00 │ 2024 04 12 05:55:00 │ SHORT        │ 1.11%  │ 0.85%  │ 0.01       │ rsiDivergency5m │
// │   2 │ XMRUSDT      │ 2024 04 12 15:25:00 │ 2024 04 12 16:00:00 │ LONG         │ -0.26% │ 1.97%  │ 118.62     │ rsiDivergency5m │
// │   3 │ NEOUSDT      │ 2024 04 13 00:10:00 │ 2024 04 13 06:05:00 │ SHORT        │ -0.26% │ 1.18%  │ 20.33      │ rsiDivergency5m │
// │   4 │ ARPAUSDT     │ 2024 04 13 07:50:00 │ 2024 04 13 08:05:00 │ SHORT        │ -0.26% │ 0.92%  │ 0.09       │ rsiDivergency5m │
// │   5 │ ARPAUSDT     │ 2024 04 13 08:10:00 │ 2024 04 13 12:15:00 │ SHORT        │ 2.49%  │ 3.41%  │ 0.09       │ rsiDivergency5m │
// │   6 │ QTUMUSDT     │ 2024 04 13 12:15:00 │ 2024 04 13 12:25:00 │ LONG         │ -0.26% │ 3.15%  │ 4.20       │ rsiDivergency5m │
// │   7 │ NEOUSDT      │ 2024 04 13 12:30:00 │ 2024 04 13 12:35:00 │ LONG         │ -0.26% │ 2.88%  │ 18.37      │ rsiDivergency5m │
// │   8 │ NEOUSDT      │ 2024 04 13 12:40:00 │ 2024 04 13 12:55:00 │ LONG         │ -0.26% │ 2.62%  │ 18.16      │ rsiDivergency5m │
// │   9 │ NEOUSDT      │ 2024 04 13 13:05:00 │ 2024 04 13 14:15:00 │ LONG         │ -0.26% │ 2.36%  │ 17.78      │ rsiDivergency5m │
// │  10 │ ADAUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.26% │ 1.57%  │ 0.45       │ rsiDivergency5m │
// │  11 │ FILUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.26% │ 1.83%  │ 5.66       │ rsiDivergency5m │
// │  12 │ OPUSDT       │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.26% │ 2.10%  │ 2.07       │ rsiDivergency5m │
// │  13 │ RIFUSDT      │ 2024 04 14 01:45:00 │ 2024 04 14 04:05:00 │ SHORT        │ -0.26% │ 1.05%  │ 0.20       │ rsiDivergency5m │
// │  14 │ SFPUSDT      │ 2024 04 14 04:10:00 │ 2024 04 14 12:10:00 │ SHORT        │ 2.49%  │ 3.53%  │ 0.86       │ rsiDivergency5m │
// │  15 │ SUPERUSDT    │ 2024 04 14 17:55:00 │ 2024 04 14 18:10:00 │ SHORT        │ -0.26% │ 3.01%  │ 0.96       │ rsiDivergency5m │
// │  16 │ WUSDT        │ 2024 04 14 18:25:00 │ 2024 04 14 18:30:00 │ SHORT        │ -0.26% │ 2.75%  │ 0.71       │ rsiDivergency5m │
// │  17 │ WUSDT        │ 2024 04 14 18:35:00 │ 2024 04 15 02:55:00 │ SHORT        │ 1.41%  │ 4.16%  │ 0.71       │ rsiDivergency5m │
// │  18 │ DARUSDT      │ 2024 04 15 02:30:00 │ 2024 04 15 06:00:00 │ SHORT        │ -0.26% │ 3.89%  │ 0.16       │ rsiDivergency5m │
// │  19 │ COTIUSDT     │ 2024 04 15 05:55:00 │ 2024 04 15 08:15:00 │ SHORT        │ -0.26% │ 3.63%  │ 0.12       │ rsiDivergency5m │
// │  20 │ MANTAUSDT    │ 2024 04 15 11:30:00 │ 2024 04 15 11:35:00 │ LONG         │ -0.26% │ 3.37%  │ 1.98       │ rsiDivergency5m │
// │  21 │ FTMUSDT      │ 2024 04 15 11:45:00 │ 2024 04 15 12:20:00 │ LONG         │ -0.26% │ 2.84%  │ 0.66       │ rsiDivergency5m │
// │  22 │ MANTAUSDT    │ 2024 04 15 11:45:00 │ 2024 04 15 12:20:00 │ LONG         │ -0.26% │ 3.11%  │ 1.97       │ rsiDivergency5m │
// │  23 │ MAGICUSDT    │ 2024 04 15 12:45:00 │ 2024 04 15 13:15:00 │ LONG         │ -0.26% │ 2.58%  │ 0.75       │ rsiDivergency5m │
// │  24 │ ONTUSDT      │ 2024 04 15 13:25:00 │ 2024 04 15 13:35:00 │ LONG         │ -0.26% │ 1.79%  │ 0.31       │ rsiDivergency5m │
// │  25 │ SUPERUSDT    │ 2024 04 15 13:40:00 │ 2024 04 15 13:45:00 │ LONG         │ -0.26% │ 2.32%  │ 0.96       │ rsiDivergency5m │
// │  26 │ SUPERUSDT    │ 2024 04 15 13:50:00 │ 2024 04 15 14:00:00 │ LONG         │ -0.26% │ 2.06%  │ 0.95       │ rsiDivergency5m │
// │  27 │ API3USDT     │ 2024 04 15 14:05:00 │ 2024 04 15 22:25:00 │ LONG         │ 0.79%  │ 2.58%  │ 2.16       │ rsiDivergency5m │
// │  28 │ AIUSDT       │ 2024 04 16 02:05:00 │ 2024 04 16 02:30:00 │ SHORT        │ -0.26% │ 2.32%  │ 0.92       │ rsiDivergency5m │
// │  29 │ AIUSDT       │ 2024 04 16 02:35:00 │ 2024 04 16 10:55:00 │ SHORT        │ 1.55%  │ 3.87%  │ 0.93       │ rsiDivergency5m │
// │  30 │ TAOUSDT      │ 2024 04 16 07:40:00 │ 2024 04 16 10:40:00 │ LONG         │ -0.26% │ 3.27%  │ 460.81     │ rsiDivergency5m │
// │  31 │ ZETAUSDT     │ 2024 04 16 11:30:00 │ 2024 04 16 19:50:00 │ LONG         │ 0.80%  │ 4.66%  │ 1.21       │ rsiDivergency5m │
// │  32 │ SFPUSDT      │ 2024 04 16 20:05:00 │ 2024 04 16 21:10:00 │ SHORT        │ -0.26% │ 4.40%  │ 0.79       │ rsiDivergency5m │
// │  33 │ TONUSDT      │ 2024 04 17 07:15:00 │ 2024 04 17 09:05:00 │ LONG         │ -0.26% │ 3.61%  │ 6.14       │ rsiDivergency5m │
// │  34 │ NEOUSDT      │ 2024 04 17 09:20:00 │ 2024 04 17 10:30:00 │ LONG         │ -0.26% │ 2.83%  │ 17.48      │ rsiDivergency5m │
// │  35 │ WUSDT        │ 2024 04 17 09:20:00 │ 2024 04 17 09:35:00 │ LONG         │ -0.26% │ 3.35%  │ 0.55       │ rsiDivergency5m │
// │  36 │ RIFUSDT      │ 2024 04 17 09:25:00 │ 2024 04 17 09:35:00 │ LONG         │ -0.26% │ 3.09%  │ 0.19       │ rsiDivergency5m │
// │  37 │ MYROUSDT     │ 2024 04 17 13:45:00 │ 2024 04 17 22:05:00 │ SHORT        │ 0.87%  │ 3.70%  │ 0.15       │ rsiDivergency5m │
// │  38 │ RUNEUSDT     │ 2024 04 18 09:30:00 │ 2024 04 18 10:00:00 │ SHORT        │ -0.26% │ 4.16%  │ 4.71       │ rsiDivergency5m │
// │  39 │ WUSDT        │ 2024 04 18 09:30:00 │ 2024 04 18 10:05:00 │ SHORT        │ -0.26% │ 4.43%  │ 0.59       │ rsiDivergency5m │
// │  40 │ LPTUSDT      │ 2024 04 18 14:35:00 │ 2024 04 18 14:50:00 │ SHORT        │ -0.26% │ 3.90%  │ 13.94      │ rsiDivergency5m │
// │  41 │ LPTUSDT      │ 2024 04 18 14:55:00 │ 2024 04 18 15:15:00 │ SHORT        │ -0.26% │ 3.64%  │ 13.89      │ rsiDivergency5m │
// │  42 │ TRUUSDT      │ 2024 04 18 15:55:00 │ 2024 04 18 16:00:00 │ SHORT        │ -0.26% │ 3.38%  │ 0.12       │ rsiDivergency5m │
// │  43 │ DUSKUSDT     │ 2024 04 18 16:10:00 │ 2024 04 18 18:40:00 │ SHORT        │ -0.26% │ 3.11%  │ 0.37       │ rsiDivergency5m │
// │  44 │ NEOUSDT      │ 2024 04 18 19:50:00 │ 2024 04 18 21:05:00 │ SHORT        │ 2.49%  │ 5.60%  │ 19.57      │ rsiDivergency5m │
// │  45 │ ANKRUSDT     │ 2024 04 18 21:20:00 │ 2024 04 18 21:25:00 │ LONG         │ -0.26% │ 5.34%  │ 0.04       │ rsiDivergency5m │
// │  46 │ TAOUSDT      │ 2024 04 18 21:20:00 │ 2024 04 18 21:25:00 │ LONG         │ -0.26% │ 4.14%  │ 434.73     │ rsiDivergency5m │
// │  47 │ TAOUSDT      │ 2024 04 18 21:30:00 │ 2024 04 18 21:45:00 │ LONG         │ -0.26% │ 3.88%  │ 431.64     │ rsiDivergency5m │
// │  48 │ TONUSDT      │ 2024 04 18 23:10:00 │ 2024 04 18 23:20:00 │ SHORT        │ -0.26% │ 5.08%  │ 6.85       │ rsiDivergency5m │
// │  49 │ MAGICUSDT    │ 2024 04 19 02:40:00 │ 2024 04 19 03:40:00 │ SHORT        │ -0.26% │ 4.81%  │ 0.79       │ rsiDivergency5m │
// │  50 │ BLURUSDT     │ 2024 04 19 03:50:00 │ 2024 04 19 12:10:00 │ SHORT        │ 0.40%  │ 5.22%  │ 0.40       │ rsiDivergency5m │
// │  51 │ OMNIUSDT     │ 2024 04 19 05:00:00 │ 2024 04 19 05:40:00 │ SHORT        │ -0.26% │ 0.58%  │ 26.47      │ rsiDivergency5m │
// │  52 │ OMNIUSDT     │ 2024 04 19 05:50:00 │ 2024 04 19 14:10:00 │ SHORT        │ 1.65%  │ 2.23%  │ 27.07      │ rsiDivergency5m │
// │  53 │ TAOUSDT      │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.99%  │ 4.69%  │ 433.10     │ rsiDivergency5m │
// │  54 │ ONTUSDT      │ 2024 04 20 07:35:00 │ 2024 04 20 15:55:00 │ LONG         │ 0.26%  │ 5.48%  │ 0.36       │ rsiDivergency5m │
// │  55 │ OMNIUSDT     │ 2024 04 20 14:40:00 │ 2024 04 20 18:25:00 │ SHORT        │ -0.26% │ 1.31%  │ 28.76      │ rsiDivergency5m │
// │  56 │ TRUUSDT      │ 2024 04 20 19:50:00 │ 2024 04 21 04:10:00 │ LONG         │ 0.21%  │ 5.69%  │ 0.13       │ rsiDivergency5m │
// │  57 │ ONTUSDT      │ 2024 04 21 08:00:00 │ 2024 04 21 08:05:00 │ SHORT        │ -0.26% │ 5.42%  │ 0.41       │ rsiDivergency5m │
// │  58 │ ONTUSDT      │ 2024 04 21 08:10:00 │ 2024 04 21 08:25:00 │ SHORT        │ -0.26% │ 5.16%  │ 0.41       │ rsiDivergency5m │
// │  59 │ PENDLEUSDT   │ 2024 04 21 09:20:00 │ 2024 04 21 11:35:00 │ LONG         │ -0.26% │ 4.90%  │ 5.88       │ rsiDivergency5m │
// │  60 │ 1000PEPEUSDT │ 2024 04 21 11:40:00 │ 2024 04 21 20:00:00 │ LONG         │ 1.58%  │ 6.48%  │ 0.01       │ rsiDivergency5m │
// │  61 │ 1000PEPEUSDT │ 2024 04 21 23:30:00 │ 2024 04 21 23:55:00 │ SHORT        │ -0.26% │ 6.22%  │ 0.01       │ rsiDivergency5m │
// │  62 │ 1000PEPEUSDT │ 2024 04 22 00:00:00 │ 2024 04 22 00:10:00 │ SHORT        │ -0.26% │ 5.95%  │ 0.01       │ rsiDivergency5m │
// │  63 │ SEIUSDT      │ 2024 04 22 06:10:00 │ 2024 04 22 14:30:00 │ SHORT        │ 0.44%  │ 6.40%  │ 0.67       │ rsiDivergency5m │
// │  64 │ DODOXUSDT    │ 2024 04 22 15:45:00 │ 2024 04 22 16:00:00 │ SHORT        │ -0.26% │ 6.14%  │ 0.20       │ rsiDivergency5m │
// │  65 │ ATAUSDT      │ 2024 04 22 23:20:00 │ 2024 04 22 23:40:00 │ SHORT        │ -0.26% │ 5.61%  │ 0.21       │ rsiDivergency5m │
// │  66 │ ATAUSDT      │ 2024 04 23 00:10:00 │ 2024 04 23 00:20:00 │ SHORT        │ -0.26% │ 5.35%  │ 0.22       │ rsiDivergency5m │
// │  67 │ ATAUSDT      │ 2024 04 23 01:20:00 │ 2024 04 23 05:35:00 │ SHORT        │ -0.26% │ 4.82%  │ 0.23       │ rsiDivergency5m │
// │  68 │ TONUSDT      │ 2024 04 23 01:45:00 │ 2024 04 23 01:50:00 │ LONG         │ -0.26% │ 5.09%  │ 5.61       │ rsiDivergency5m │
// │  69 │ ONTUSDT      │ 2024 04 23 16:50:00 │ 2024 04 23 17:00:00 │ LONG         │ -0.26% │ 4.04%  │ 0.43       │ rsiDivergency5m │
// │  70 │ 1000BONKUSDT │ 2024 04 23 19:45:00 │ 2024 04 23 20:00:00 │ SHORT        │ -0.26% │ 3.77%  │ 0.03       │ rsiDivergency5m │
// │  71 │ ARKMUSDT     │ 2024 04 23 22:55:00 │ 2024 04 24 07:15:00 │ LONG         │ 1.09%  │ 4.87%  │ 2.14       │ rsiDivergency5m │
// │  72 │ VANRYUSDT    │ 2024 04 24 09:55:00 │ 2024 04 24 10:35:00 │ LONG         │ -0.26% │ 4.60%  │ 0.17       │ rsiDivergency5m │
// │  73 │ RLCUSDT      │ 2024 04 24 10:20:00 │ 2024 04 24 11:15:00 │ LONG         │ -0.26% │ 4.34%  │ 2.97       │ rsiDivergency5m │
// │  74 │ TAOUSDT      │ 2024 04 24 11:15:00 │ 2024 04 24 11:25:00 │ LONG         │ -0.26% │ 5.87%  │ 457.42     │ rsiDivergency5m │
// │  75 │ RLCUSDT      │ 2024 04 24 11:30:00 │ 2024 04 24 11:50:00 │ LONG         │ -0.26% │ 4.08%  │ 2.91       │ rsiDivergency5m │
// │  76 │ RLCUSDT      │ 2024 04 24 11:55:00 │ 2024 04 24 13:50:00 │ LONG         │ -0.26% │ 3.82%  │ 2.88       │ rsiDivergency5m │
// │  77 │ EOSUSDT      │ 2024 04 24 21:15:00 │ 2024 04 25 05:35:00 │ SHORT        │ 1.70%  │ 5.52%  │ 0.93       │ rsiDivergency5m │
// │  78 │ WUSDT        │ 2024 04 25 08:30:00 │ 2024 04 25 08:40:00 │ SHORT        │ -0.26% │ 5.26%  │ 0.58       │ rsiDivergency5m │
// │  79 │ WUSDT        │ 2024 04 25 08:45:00 │ 2024 04 25 09:05:00 │ SHORT        │ -0.26% │ 4.99%  │ 0.59       │ rsiDivergency5m │
// │  80 │ WUSDT        │ 2024 04 25 09:25:00 │ 2024 04 25 09:35:00 │ SHORT        │ -0.26% │ 4.73%  │ 0.61       │ rsiDivergency5m │
// │  81 │ WUSDT        │ 2024 04 25 09:40:00 │ 2024 04 25 10:30:00 │ SHORT        │ -0.26% │ 4.47%  │ 0.62       │ rsiDivergency5m │
// │  82 │ WUSDT        │ 2024 04 25 10:50:00 │ 2024 04 25 11:00:00 │ SHORT        │ -0.26% │ 4.21%  │ 0.65       │ rsiDivergency5m │
// │  83 │ WUSDT        │ 2024 04 25 11:10:00 │ 2024 04 25 11:30:00 │ SHORT        │ -0.26% │ 3.94%  │ 0.64       │ rsiDivergency5m │
// │  84 │ 1000BONKUSDT │ 2024 04 25 12:00:00 │ 2024 04 25 19:35:00 │ SHORT        │ 2.49%  │ 6.17%  │ 0.03       │ rsiDivergency5m │
// │  85 │ WUSDT        │ 2024 04 25 12:00:00 │ 2024 04 25 12:05:00 │ SHORT        │ -0.26% │ 3.68%  │ 0.66       │ rsiDivergency5m │
// │  86 │ LSKUSDT      │ 2024 04 25 19:45:00 │ 2024 04 25 20:00:00 │ LONG         │ -0.26% │ 5.91%  │ 1.86       │ rsiDivergency5m │
// │  87 │ HIFIUSDT     │ 2024 04 25 19:55:00 │ 2024 04 25 20:15:00 │ LONG         │ -0.26% │ 5.64%  │ 0.79       │ rsiDivergency5m │
// │  88 │ ARKMUSDT     │ 2024 04 25 20:20:00 │ 2024 04 26 01:20:00 │ LONG         │ -0.26% │ 5.38%  │ 2.05       │ rsiDivergency5m │
// │  89 │ ALGOUSDT     │ 2024 04 26 07:55:00 │ 2024 04 26 08:10:00 │ LONG         │ -0.26% │ 5.12%  │ 0.20       │ rsiDivergency5m │
// │  90 │ MYROUSDT     │ 2024 04 26 17:30:00 │ 2024 04 26 17:40:00 │ LONG         │ -0.26% │ 4.86%  │ 0.16       │ rsiDivergency5m │
// │  91 │ MYROUSDT     │ 2024 04 26 17:45:00 │ 2024 04 26 19:25:00 │ LONG         │ -0.26% │ 4.59%  │ 0.15       │ rsiDivergency5m │
// │  92 │ LSKUSDT      │ 2024 04 26 19:45:00 │ 2024 04 26 20:00:00 │ LONG         │ -0.26% │ 4.33%  │ 1.68       │ rsiDivergency5m │
// │  93 │ PORTALUSDT   │ 2024 04 26 20:20:00 │ 2024 04 27 04:40:00 │ LONG         │ 0.79%  │ 5.12%  │ 0.86       │ rsiDivergency5m │
// │  94 │ ARKMUSDT     │ 2024 04 27 12:55:00 │ 2024 04 27 13:00:00 │ SHORT        │ -0.26% │ 4.86%  │ 2.15       │ rsiDivergency5m │
// │  95 │ OPUSDT       │ 2024 04 27 13:55:00 │ 2024 04 27 20:35:00 │ SHORT        │ -0.26% │ 4.59%  │ 2.63       │ rsiDivergency5m │
// │  96 │ TUSDT        │ 2024 04 27 21:05:00 │ 2024 04 28 05:25:00 │ SHORT        │ 1.58%  │ 6.17%  │ 0.04       │ rsiDivergency5m │
// │  97 │ ONTUSDT      │ 2024 04 28 07:45:00 │ 2024 04 28 16:05:00 │ LONG         │ 0.70%  │ 6.87%  │ 0.38       │ rsiDivergency5m │
// │  98 │ HIGHUSDT     │ 2024 04 28 18:30:00 │ 2024 04 29 02:50:00 │ LONG         │ 0.77%  │ 7.64%  │ 3.83       │ rsiDivergency5m │
// │  99 │ OPUSDT       │ 2024 04 29 03:20:00 │ 2024 04 29 04:00:00 │ LONG         │ -0.26% │ 7.11%  │ 2.51       │ rsiDivergency5m │
// │ 100 │ PORTALUSDT   │ 2024 04 29 03:25:00 │ 2024 04 29 03:30:00 │ LONG         │ -0.26% │ 7.37%  │ 0.85       │ rsiDivergency5m │
// │ 101 │ OPUSDT       │ 2024 04 29 04:05:00 │ 2024 04 29 05:50:00 │ LONG         │ -0.26% │ 6.85%  │ 2.48       │ rsiDivergency5m │
// │ 102 │ WUSDT        │ 2024 04 29 07:10:00 │ 2024 04 29 07:45:00 │ SHORT        │ -0.26% │ 6.59%  │ 0.63       │ rsiDivergency5m │
// │ 103 │ MKRUSDT      │ 2024 04 29 08:35:00 │ 2024 04 29 16:55:00 │ LONG         │ 0.57%  │ 7.15%  │ 2739.10    │ rsiDivergency5m │
// │ 104 │ ENAUSDT      │ 2024 04 29 18:10:00 │ 2024 04 30 02:30:00 │ SHORT        │ 1.27%  │ 8.42%  │ 0.94       │ rsiDivergency5m │
// │ 105 │ PORTALUSDT   │ 2024 04 30 04:35:00 │ 2024 04 30 05:30:00 │ LONG         │ -0.26% │ 8.16%  │ 0.81       │ rsiDivergency5m │
// │ 106 │ LQTYUSDT     │ 2024 04 30 05:15:00 │ 2024 04 30 05:30:00 │ LONG         │ -0.26% │ 7.90%  │ 1.03       │ rsiDivergency5m │
// │ 107 │ LQTYUSDT     │ 2024 04 30 05:35:00 │ 2024 04 30 06:00:00 │ LONG         │ -0.26% │ 7.63%  │ 1.02       │ rsiDivergency5m │
// │ 108 │ RLCUSDT      │ 2024 04 30 05:35:00 │ 2024 04 30 06:25:00 │ LONG         │ -0.26% │ 7.37%  │ 2.51       │ rsiDivergency5m │
// │ 109 │ MEMEUSDT     │ 2024 04 30 07:10:00 │ 2024 04 30 08:50:00 │ LONG         │ -0.26% │ 7.11%  │ 0.02       │ rsiDivergency5m │
// │ 110 │ OMNIUSDT     │ 2024 04 30 08:05:00 │ 2024 04 30 08:30:00 │ LONG         │ -0.26% │ 4.56%  │ 18.43      │ rsiDivergency5m │
// │ 111 │ ARKMUSDT     │ 2024 04 30 08:55:00 │ 2024 04 30 10:35:00 │ LONG         │ -0.26% │ 6.85%  │ 1.83       │ rsiDivergency5m │
// │ 112 │ OMNIUSDT     │ 2024 04 30 08:55:00 │ 2024 04 30 10:50:00 │ LONG         │ -0.26% │ 4.30%  │ 17.96      │ rsiDivergency5m │
// │ 113 │ GASUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ -0.05% │ 6.79%  │ 4.87       │ rsiDivergency5m │
// │ 114 │ HIGHUSDT     │ 2024 04 30 22:15:00 │ 2024 05 01 06:35:00 │ LONG         │ 1.76%  │ 8.56%  │ 3.26       │ rsiDivergency5m │
// │ 115 │ PORTALUSDT   │ 2024 05 01 07:35:00 │ 2024 05 01 13:15:00 │ SHORT        │ -0.26% │ 8.29%  │ 0.80       │ rsiDivergency5m │
// │ 116 │ MYROUSDT     │ 2024 05 01 13:45:00 │ 2024 05 01 13:50:00 │ SHORT        │ -0.26% │ 8.03%  │ 0.14       │ rsiDivergency5m │
// │ 117 │ MANTAUSDT    │ 2024 05 01 13:50:00 │ 2024 05 01 22:10:00 │ SHORT        │ 1.18%  │ 9.21%  │ 1.70       │ rsiDivergency5m │
// │ 118 │ WUSDT        │ 2024 05 02 04:00:00 │ 2024 05 02 04:20:00 │ SHORT        │ -0.26% │ 8.94%  │ 0.67       │ rsiDivergency5m │
// │ 119 │ 1000BONKUSDT │ 2024 05 02 06:55:00 │ 2024 05 02 07:05:00 │ SHORT        │ -0.26% │ 8.68%  │ 0.02       │ rsiDivergency5m │
// │ 120 │ 1000BONKUSDT │ 2024 05 02 07:10:00 │ 2024 05 02 07:40:00 │ SHORT        │ -0.26% │ 8.42%  │ 0.03       │ rsiDivergency5m │
// │ 121 │ ARUSDT       │ 2024 05 02 07:45:00 │ 2024 05 02 09:35:00 │ SHORT        │ -0.26% │ 8.16%  │ 32.22      │ rsiDivergency5m │
// │ 122 │ JUPUSDT      │ 2024 05 02 10:30:00 │ 2024 05 02 17:15:00 │ SHORT        │ -0.26% │ 7.89%  │ 1.02       │ rsiDivergency5m │
// │ 123 │ HIGHUSDT     │ 2024 05 02 18:20:00 │ 2024 05 02 23:05:00 │ SHORT        │ -0.26% │ 7.63%  │ 3.92       │ rsiDivergency5m │
// │ 124 │ REZUSDT      │ 2024 05 03 13:15:00 │ 2024 05 03 13:30:00 │ SHORT        │ -0.26% │ 1.71%  │ 0.17       │ rsiDivergency5m │
// │ 125 │ REZUSDT      │ 2024 05 03 13:35:00 │ 2024 05 03 14:20:00 │ SHORT        │ -0.26% │ 1.45%  │ 0.17       │ rsiDivergency5m │
// │ 126 │ GRTUSDT      │ 2024 05 03 15:15:00 │ 2024 05 03 15:50:00 │ SHORT        │ -0.26% │ 8.25%  │ 0.28       │ rsiDivergency5m │
// │ 127 │ ONTUSDT      │ 2024 05 03 15:40:00 │ 2024 05 03 19:20:00 │ SHORT        │ -0.26% │ 7.99%  │ 0.36       │ rsiDivergency5m │
// │ 128 │ DOGEUSDT     │ 2024 05 03 19:50:00 │ 2024 05 04 04:05:00 │ SHORT        │ -0.26% │ 7.73%  │ 0.15       │ rsiDivergency5m │
// │ 129 │ LSKUSDT      │ 2024 05 04 05:10:00 │ 2024 05 04 13:30:00 │ SHORT        │ 1.30%  │ 9.03%  │ 2.09       │ rsiDivergency5m │
// │ 130 │ WUSDT        │ 2024 05 04 22:30:00 │ 2024 05 05 05:15:00 │ LONG         │ -0.26% │ 8.51%  │ 0.67       │ rsiDivergency5m │
// │ 131 │ LPTUSDT      │ 2024 05 05 05:25:00 │ 2024 05 05 11:50:00 │ SHORT        │ -0.26% │ 8.24%  │ 15.21      │ rsiDivergency5m │
// │ 132 │ GRTUSDT      │ 2024 05 05 12:00:00 │ 2024 05 05 20:20:00 │ SHORT        │ 0.14%  │ 8.38%  │ 0.30       │ rsiDivergency5m │
// │ 133 │ RLCUSDT      │ 2024 05 06 02:05:00 │ 2024 05 06 02:10:00 │ SHORT        │ -0.26% │ 7.85%  │ 3.02       │ rsiDivergency5m │
// │ 134 │ RSRUSDT      │ 2024 05 06 03:30:00 │ 2024 05 06 04:05:00 │ SHORT        │ -0.26% │ 7.59%  │ 0.01       │ rsiDivergency5m │
// │ 135 │ JUPUSDT      │ 2024 05 06 04:55:00 │ 2024 05 06 13:15:00 │ SHORT        │ 1.50%  │ 9.09%  │ 1.18       │ rsiDivergency5m │
// │ 136 │ TAOUSDT      │ 2024 05 06 10:10:00 │ 2024 05 06 12:30:00 │ LONG         │ -0.26% │ 8.77%  │ 444.00     │ rsiDivergency5m │
// │ 137 │ SAGAUSDT     │ 2024 05 06 18:05:00 │ 2024 05 06 19:15:00 │ LONG         │ -0.26% │ 8.83%  │ 3.18       │ rsiDivergency5m │
// │ 138 │ AMBUSDT      │ 2024 05 07 14:35:00 │ 2024 05 07 17:10:00 │ LONG         │ -0.26% │ 8.57%  │ 0.01       │ rsiDivergency5m │
// │ 139 │ TAOUSDT      │ 2024 05 07 17:15:00 │ 2024 05 07 19:30:00 │ LONG         │ -0.26% │ 8.12%  │ 422.02     │ rsiDivergency5m │
// │ 140 │ USTCUSDT     │ 2024 05 07 21:10:00 │ 2024 05 08 00:20:00 │ SHORT        │ -0.26% │ 8.30%  │ 0.02       │ rsiDivergency5m │
// │ 141 │ ACEUSDT      │ 2024 05 08 00:40:00 │ 2024 05 08 06:05:00 │ SHORT        │ -0.26% │ 8.04%  │ 5.38       │ rsiDivergency5m │
// │ 142 │ API3USDT     │ 2024 05 08 13:25:00 │ 2024 05 08 14:45:00 │ SHORT        │ -0.26% │ 7.78%  │ 2.62       │ rsiDivergency5m │
// │ 143 │ WLDUSDT      │ 2024 05 08 15:35:00 │ 2024 05 08 15:45:00 │ LONG         │ -0.26% │ 7.52%  │ 5.27       │ rsiDivergency5m │
// │ 144 │ LPTUSDT      │ 2024 05 08 21:35:00 │ 2024 05 09 00:25:00 │ SHORT        │ -0.26% │ 7.25%  │ 15.25      │ rsiDivergency5m │
// │ 145 │ ARKMUSDT     │ 2024 05 09 01:30:00 │ 2024 05 09 09:50:00 │ SHORT        │ 1.03%  │ 8.28%  │ 2.55       │ rsiDivergency5m │
// │ 146 │ PORTALUSDT   │ 2024 05 09 10:40:00 │ 2024 05 09 19:00:00 │ SHORT        │ 0.95%  │ 9.23%  │ 0.85       │ rsiDivergency5m │
// │ 147 │ GRTUSDT      │ 2024 05 09 20:50:00 │ 2024 05 09 21:00:00 │ SHORT        │ -0.26% │ 8.96%  │ 0.31       │ rsiDivergency5m │
// │ 148 │ ARUSDT       │ 2024 05 09 21:10:00 │ 2024 05 10 01:55:00 │ SHORT        │ -0.26% │ 8.70%  │ 42.77      │ rsiDivergency5m │
// │ 149 │ ARUSDT       │ 2024 05 10 05:25:00 │ 2024 05 10 13:45:00 │ SHORT        │ 1.86%  │ 10.56% │ 44.72      │ rsiDivergency5m │
// │ 150 │ ACEUSDT      │ 2024 05 10 20:20:00 │ 2024 05 11 04:40:00 │ SHORT        │ 0.94%  │ 11.50% │ 5.37       │ rsiDivergency5m │
// │ 151 │ PORTALUSDT   │ 2024 05 12 03:30:00 │ 2024 05 12 04:15:00 │ SHORT        │ -0.26% │ 11.24% │ 0.89       │ rsiDivergency5m │
// │ 152 │ PORTALUSDT   │ 2024 05 12 05:25:00 │ 2024 05 12 05:30:00 │ SHORT        │ -0.26% │ 10.98% │ 0.92       │ rsiDivergency5m │
// │ 153 │ PORTALUSDT   │ 2024 05 12 21:15:00 │ 2024 05 12 21:25:00 │ LONG         │ -0.26% │ 10.71% │ 0.80       │ rsiDivergency5m │
// │ 154 │ ACEUSDT      │ 2024 05 12 21:55:00 │ 2024 05 12 22:00:00 │ LONG         │ -0.26% │ 10.45% │ 4.68       │ rsiDivergency5m │
// │ 155 │ ACEUSDT      │ 2024 05 12 22:05:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.26% │ 10.19% │ 4.63       │ rsiDivergency5m │
// │ 156 │ ACEUSDT      │ 2024 05 12 22:15:00 │ 2024 05 13 06:35:00 │ LONG         │ 1.56%  │ 11.75% │ 4.62       │ rsiDivergency5m │
// │ 157 │ ARUSDT       │ 2024 05 13 09:15:00 │ 2024 05 13 09:25:00 │ SHORT        │ -0.26% │ 11.49% │ 40.91      │ rsiDivergency5m │
// │ 158 │ SAGAUSDT     │ 2024 05 13 10:30:00 │ 2024 05 13 13:05:00 │ LONG         │ -0.26% │ 11.22% │ 2.41       │ rsiDivergency5m │
// │ 159 │ USTCUSDT     │ 2024 05 13 13:15:00 │ 2024 05 13 21:35:00 │ LONG         │ 0.43%  │ 11.66% │ 0.02       │ rsiDivergency5m │
// │ 160 │ WLDUSDT      │ 2024 05 13 23:50:00 │ 2024 05 14 01:05:00 │ LONG         │ -0.26% │ 11.40% │ 5.27       │ rsiDivergency5m │
// │ 161 │ WLDUSDT      │ 2024 05 14 01:15:00 │ 2024 05 14 01:20:00 │ LONG         │ -0.26% │ 11.13% │ 5.17       │ rsiDivergency5m │
// │ 162 │ 1000PEPEUSDT │ 2024 05 14 03:15:00 │ 2024 05 14 03:25:00 │ SHORT        │ -0.26% │ 10.87% │ 0.01       │ rsiDivergency5m │
// │ 163 │ UMAUSDT      │ 2024 05 14 08:55:00 │ 2024 05 14 09:10:00 │ LONG         │ -0.26% │ 10.61% │ 3.70       │ rsiDivergency5m │
// │ 164 │ WLDUSDT      │ 2024 05 14 12:35:00 │ 2024 05 14 20:55:00 │ LONG         │ 1.17%  │ 11.78% │ 4.65       │ rsiDivergency5m │
// │ 165 │ MYROUSDT     │ 2024 05 14 22:35:00 │ 2024 05 14 23:10:00 │ SHORT        │ -0.26% │ 11.52% │ 0.17       │ rsiDivergency5m │
// │ 166 │ LPTUSDT      │ 2024 05 15 05:20:00 │ 2024 05 15 05:50:00 │ SHORT        │ -0.26% │ 11.25% │ 18.24      │ rsiDivergency5m │
// │ 167 │ PHBUSDT      │ 2024 05 15 08:15:00 │ 2024 05 15 08:25:00 │ SHORT        │ -0.26% │ 10.99% │ 2.39       │ rsiDivergency5m │
// │ 168 │ PHBUSDT      │ 2024 05 15 08:40:00 │ 2024 05 15 08:45:00 │ SHORT        │ -0.26% │ 10.73% │ 2.44       │ rsiDivergency5m │
// │ 169 │ SEIUSDT      │ 2024 05 15 09:10:00 │ 2024 05 15 09:25:00 │ SHORT        │ -0.26% │ 10.47% │ 0.50       │ rsiDivergency5m │
// │ 170 │ JOEUSDT      │ 2024 05 15 09:25:00 │ 2024 05 15 14:35:00 │ SHORT        │ -0.26% │ 10.20% │ 0.47       │ rsiDivergency5m │
// │ 171 │ SUIUSDT      │ 2024 05 15 15:00:00 │ 2024 05 15 23:20:00 │ SHORT        │ 0.62%  │ 10.82% │ 1.02       │ rsiDivergency5m │
// │ 172 │ ZETAUSDT     │ 2024 05 16 01:35:00 │ 2024 05 16 02:10:00 │ SHORT        │ -0.26% │ 10.56% │ 1.70       │ rsiDivergency5m │
// │ 173 │ RSRUSDT      │ 2024 05 16 02:40:00 │ 2024 05 16 11:00:00 │ SHORT        │ 1.26%  │ 11.82% │ 0.01       │ rsiDivergency5m │
// │ 174 │ BEAMXUSDT    │ 2024 05 17 01:20:00 │ 2024 05 17 03:40:00 │ LONG         │ -0.26% │ 11.30% │ 0.02       │ rsiDivergency5m │
// │ 175 │ TRUUSDT      │ 2024 05 17 20:25:00 │ 2024 05 17 20:30:00 │ SHORT        │ -0.26% │ 12.50% │ 0.13       │ rsiDivergency5m │
// │ 176 │ TRUUSDT      │ 2024 05 17 20:35:00 │ 2024 05 17 23:05:00 │ SHORT        │ -0.26% │ 12.23% │ 0.13       │ rsiDivergency5m │
// │ 177 │ ZRXUSDT      │ 2024 05 17 22:40:00 │ 2024 05 18 07:00:00 │ SHORT        │ 0.56%  │ 12.80% │ 0.61       │ rsiDivergency5m │
// │ 178 │ 1000PEPEUSDT │ 2024 05 18 09:45:00 │ 2024 05 18 18:05:00 │ LONG         │ 0.55%  │ 13.34% │ 0.01       │ rsiDivergency5m │
// │ 179 │ ACEUSDT      │ 2024 05 19 11:55:00 │ 2024 05 19 16:10:00 │ LONG         │ -0.26% │ 12.55% │ 4.56       │ rsiDivergency5m │
// │ 180 │ SAGAUSDT     │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 1.30%  │ 13.85% │ 1.96       │ rsiDivergency5m │
// │ 181 │ FTMUSDT      │ 2024 05 20 11:35:00 │ 2024 05 20 19:55:00 │ SHORT        │ 1.38%  │ 15.23% │ 0.96       │ rsiDivergency5m │
// │ 182 │ TAOUSDT      │ 2024 05 20 13:00:00 │ 2024 05 20 14:20:00 │ SHORT        │ -0.26% │ 13.08% │ 402.08     │ rsiDivergency5m │
// │ 183 │ 1000BONKUSDT │ 2024 05 20 22:30:00 │ 2024 05 21 05:40:00 │ SHORT        │ -0.26% │ 14.97% │ 0.03       │ rsiDivergency5m │
// │ 184 │ TAOUSDT      │ 2024 05 20 23:25:00 │ 2024 05 20 23:30:00 │ SHORT        │ -0.26% │ 12.82% │ 413.34     │ rsiDivergency5m │
// │ 185 │ STXUSDT      │ 2024 05 21 05:35:00 │ 2024 05 21 13:55:00 │ SHORT        │ 0.88%  │ 15.84% │ 2.27       │ rsiDivergency5m │
// │ 186 │ 1000PEPEUSDT │ 2024 05 22 00:05:00 │ 2024 05 22 00:50:00 │ LONG         │ -0.26% │ 15.06% │ 0.01       │ rsiDivergency5m │
// │ 187 │ USTCUSDT     │ 2024 05 22 07:05:00 │ 2024 05 22 07:10:00 │ SHORT        │ -0.26% │ 14.79% │ 0.02       │ rsiDivergency5m │
// │ 188 │ SAGAUSDT     │ 2024 05 22 07:25:00 │ 2024 05 22 07:40:00 │ LONG         │ -0.26% │ 14.53% │ 2.18       │ rsiDivergency5m │
// │ 189 │ SAGAUSDT     │ 2024 05 22 08:00:00 │ 2024 05 22 16:20:00 │ LONG         │ 1.65%  │ 16.18% │ 2.15       │ rsiDivergency5m │
// │ 190 │ HOOKUSDT     │ 2024 05 22 19:25:00 │ 2024 05 22 19:30:00 │ SHORT        │ -0.26% │ 15.92% │ 0.96       │ rsiDivergency5m │
// │ 191 │ HOOKUSDT     │ 2024 05 22 19:40:00 │ 2024 05 22 22:05:00 │ SHORT        │ -0.26% │ 15.66% │ 0.97       │ rsiDivergency5m │
// │ 192 │ MANTAUSDT    │ 2024 05 22 23:20:00 │ 2024 05 23 07:40:00 │ SHORT        │ 0.29%  │ 15.95% │ 1.79       │ rsiDivergency5m │
// │ 193 │ YGGUSDT      │ 2024 05 23 08:00:00 │ 2024 05 23 08:35:00 │ LONG         │ -0.26% │ 15.69% │ 0.91       │ rsiDivergency5m │
// │ 194 │ JUPUSDT      │ 2024 05 23 08:50:00 │ 2024 05 23 09:50:00 │ LONG         │ -0.26% │ 15.42% │ 1.13       │ rsiDivergency5m │
// │ 195 │ TAOUSDT      │ 2024 05 23 09:25:00 │ 2024 05 23 09:40:00 │ LONG         │ -0.26% │ 15.58% │ 450.05     │ rsiDivergency5m │
// │ 196 │ TAOUSDT      │ 2024 05 23 09:50:00 │ 2024 05 23 15:00:00 │ LONG         │ -0.26% │ 15.32% │ 441.26     │ rsiDivergency5m │
// │ 197 │ HIFIUSDT     │ 2024 05 23 09:55:00 │ 2024 05 23 13:10:00 │ LONG         │ -0.26% │ 15.16% │ 0.81       │ rsiDivergency5m │
// │ 198 │ GMTUSDT      │ 2024 05 23 13:00:00 │ 2024 05 23 13:10:00 │ LONG         │ -0.26% │ 14.90% │ 0.22       │ rsiDivergency5m │
// │ 199 │ WUSDT        │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.64%  │ 16.54% │ 0.53       │ rsiDivergency5m │
// │ 200 │ DEFIUSDT     │ 2024 05 23 23:40:00 │ 2024 05 24 08:00:00 │ SHORT        │ 0.15%  │ 16.69% │ 1019.60    │ rsiDivergency5m │
// │ 201 │ OMNIUSDT     │ 2024 05 24 03:30:00 │ 2024 05 24 11:50:00 │ LONG         │ 1.46%  │ 12.76% │ 14.72      │ rsiDivergency5m │
// │ 202 │ REZUSDT      │ 2024 05 24 03:30:00 │ 2024 05 24 11:50:00 │ LONG         │ 0.88%  │ 8.52%  │ 0.12       │ rsiDivergency5m │
// │ 203 │ LDOUSDT      │ 2024 05 24 09:55:00 │ 2024 05 24 18:15:00 │ SHORT        │ 1.25%  │ 17.41% │ 2.48       │ rsiDivergency5m │
// │ 204 │ PENDLEUSDT   │ 2024 05 24 18:40:00 │ 2024 05 24 20:15:00 │ SHORT        │ -0.26% │ 17.15% │ 6.73       │ rsiDivergency5m │
// │ 205 │ CTSIUSDT     │ 2024 05 24 20:20:00 │ 2024 05 24 20:30:00 │ SHORT        │ -0.26% │ 16.89% │ 0.24       │ rsiDivergency5m │
// │ 206 │ DARUSDT      │ 2024 05 24 20:45:00 │ 2024 05 25 00:20:00 │ SHORT        │ -0.26% │ 16.62% │ 0.17       │ rsiDivergency5m │
// │ 207 │ MYROUSDT     │ 2024 05 25 06:35:00 │ 2024 05 25 12:10:00 │ SHORT        │ -0.26% │ 16.36% │ 0.26       │ rsiDivergency5m │
// │ 208 │ MYROUSDT     │ 2024 05 25 20:15:00 │ 2024 05 25 20:25:00 │ SHORT        │ -0.26% │ 16.10% │ 0.27       │ rsiDivergency5m │
// │ 209 │ MYROUSDT     │ 2024 05 25 20:50:00 │ 2024 05 25 21:00:00 │ SHORT        │ -0.26% │ 15.84% │ 0.28       │ rsiDivergency5m │
// │ 210 │ MYROUSDT     │ 2024 05 25 21:05:00 │ 2024 05 26 05:25:00 │ SHORT        │ 1.21%  │ 17.05% │ 0.28       │ rsiDivergency5m │
// │ 211 │ LDOUSDT      │ 2024 05 26 06:15:00 │ 2024 05 26 14:35:00 │ SHORT        │ 0.43%  │ 17.48% │ 2.69       │ rsiDivergency5m │
// │ 212 │ VANRYUSDT    │ 2024 05 26 23:20:00 │ 2024 05 26 23:30:00 │ SHORT        │ -0.26% │ 17.22% │ 0.21       │ rsiDivergency5m │
// │ 213 │ KNCUSDT      │ 2024 05 26 23:50:00 │ 2024 05 27 00:40:00 │ SHORT        │ -0.26% │ 16.96% │ 0.71       │ rsiDivergency5m │
// │ 214 │ TRUUSDT      │ 2024 05 27 01:30:00 │ 2024 05 27 03:05:00 │ SHORT        │ -0.26% │ 16.69% │ 0.17       │ rsiDivergency5m │
// │ 215 │ API3USDT     │ 2024 05 27 10:00:00 │ 2024 05 27 10:05:00 │ SHORT        │ -0.26% │ 16.17% │ 3.09       │ rsiDivergency5m │
// │ 216 │ API3USDT     │ 2024 05 27 10:10:00 │ 2024 05 27 10:15:00 │ SHORT        │ -0.26% │ 15.91% │ 3.11       │ rsiDivergency5m │
// │ 217 │ API3USDT     │ 2024 05 27 10:20:00 │ 2024 05 27 10:40:00 │ SHORT        │ -0.26% │ 15.64% │ 3.15       │ rsiDivergency5m │
// │ 218 │ HIGHUSDT     │ 2024 05 27 16:15:00 │ 2024 05 27 16:25:00 │ SHORT        │ -0.26% │ 15.38% │ 6.07       │ rsiDivergency5m │
// │ 219 │ DARUSDT      │ 2024 05 27 17:50:00 │ 2024 05 27 19:00:00 │ SHORT        │ -0.26% │ 15.12% │ 0.19       │ rsiDivergency5m │
// │ 220 │ 1000BONKUSDT │ 2024 05 28 05:50:00 │ 2024 05 28 07:10:00 │ SHORT        │ -0.26% │ 14.86% │ 0.04       │ rsiDivergency5m │
// │ 221 │ DUSKUSDT     │ 2024 05 28 07:55:00 │ 2024 05 28 16:15:00 │ SHORT        │ 1.89%  │ 16.75% │ 0.43       │ rsiDivergency5m │
// │ 222 │ DUSKUSDT     │ 2024 05 28 23:50:00 │ 2024 05 29 00:50:00 │ SHORT        │ -0.26% │ 16.49% │ 0.41       │ rsiDivergency5m │
// │ 223 │ MYROUSDT     │ 2024 05 29 04:05:00 │ 2024 05 29 04:15:00 │ LONG         │ -0.26% │ 16.22% │ 0.30       │ rsiDivergency5m │
// │ 224 │ 1000PEPEUSDT │ 2024 05 29 04:15:00 │ 2024 05 29 04:25:00 │ LONG         │ -0.26% │ 15.96% │ 0.02       │ rsiDivergency5m │
// │ 225 │ 1000PEPEUSDT │ 2024 05 29 04:35:00 │ 2024 05 29 07:35:00 │ LONG         │ -0.26% │ 15.70% │ 0.02       │ rsiDivergency5m │
// │ 226 │ AMBUSDT      │ 2024 05 29 22:35:00 │ 2024 05 30 02:45:00 │ SHORT        │ -0.26% │ 15.44% │ 0.01       │ rsiDivergency5m │
// │ 227 │ 1000PEPEUSDT │ 2024 05 30 02:55:00 │ 2024 05 30 09:05:00 │ LONG         │ 2.49%  │ 17.92% │ 0.01       │ rsiDivergency5m │
// │ 228 │ 1000BONKUSDT │ 2024 05 30 09:25:00 │ 2024 05 30 17:45:00 │ SHORT        │ 1.30%  │ 19.23% │ 0.04       │ rsiDivergency5m │
// │ 229 │ OMNIUSDT     │ 2024 05 31 07:35:00 │ 2024 05 31 07:45:00 │ SHORT        │ -0.26% │ 16.43% │ 20.62      │ rsiDivergency5m │
// │ 230 │ OMNIUSDT     │ 2024 05 31 08:00:00 │ 2024 05 31 08:05:00 │ SHORT        │ -0.26% │ 16.16% │ 21.18      │ rsiDivergency5m │
// │ 231 │ TLMUSDT      │ 2024 05 31 12:25:00 │ 2024 05 31 12:30:00 │ SHORT        │ -0.26% │ 18.96% │ 0.02       │ rsiDivergency5m │
// │ 232 │ FXSUSDT      │ 2024 05 31 17:05:00 │ 2024 05 31 17:10:00 │ SHORT        │ -0.26% │ 18.70% │ 4.85       │ rsiDivergency5m │
// │ 233 │ FXSUSDT      │ 2024 05 31 17:15:00 │ 2024 06 01 01:35:00 │ SHORT        │ 1.50%  │ 20.20% │ 4.89       │ rsiDivergency5m │
// │ 234 │ HIGHUSDT     │ 2024 06 01 02:30:00 │ 2024 06 01 03:05:00 │ LONG         │ -0.26% │ 19.94% │ 6.69       │ rsiDivergency5m │
// │ 235 │ PORTALUSDT   │ 2024 06 02 01:30:00 │ 2024 06 02 03:55:00 │ SHORT        │ -0.26% │ 19.68% │ 0.98       │ rsiDivergency5m │
// │ 236 │ PORTALUSDT   │ 2024 06 02 04:10:00 │ 2024 06 02 10:00:00 │ SHORT        │ -0.26% │ 19.41% │ 1.00       │ rsiDivergency5m │
// │ 237 │ VANRYUSDT    │ 2024 06 02 11:30:00 │ 2024 06 02 19:50:00 │ SHORT        │ 1.35%  │ 20.76% │ 0.23       │ rsiDivergency5m │
// │ 238 │ KLAYUSDT     │ 2024 06 02 20:05:00 │ 2024 06 02 20:25:00 │ SHORT        │ -0.26% │ 20.50% │ 0.24       │ rsiDivergency5m │
// │ 239 │ KLAYUSDT     │ 2024 06 02 20:35:00 │ 2024 06 02 20:45:00 │ SHORT        │ -0.26% │ 20.24% │ 0.25       │ rsiDivergency5m │
// │ 240 │ KLAYUSDT     │ 2024 06 02 20:50:00 │ 2024 06 02 21:15:00 │ SHORT        │ -0.26% │ 19.98% │ 0.25       │ rsiDivergency5m │
// │ 241 │ KLAYUSDT     │ 2024 06 02 21:40:00 │ 2024 06 03 02:55:00 │ SHORT        │ 2.49%  │ 22.46% │ 0.26       │ rsiDivergency5m │
// │ 242 │ MYROUSDT     │ 2024 06 03 17:10:00 │ 2024 06 04 01:05:00 │ LONG         │ -0.26% │ 22.44% │ 0.24       │ rsiDivergency5m │
// │ 243 │ ALICEUSDT    │ 2024 06 04 08:00:00 │ 2024 06 04 16:20:00 │ LONG         │ 0.68%  │ 23.12% │ 2.12       │ rsiDivergency5m │
// │ 244 │ RIFUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 19:10:00 │ SHORT        │ -0.26% │ 22.86% │ 0.18       │ rsiDivergency5m │
// │ 245 │ BADGERUSDT   │ 2024 06 04 19:20:00 │ 2024 06 04 19:35:00 │ SHORT        │ -0.26% │ 22.60% │ 5.26       │ rsiDivergency5m │
// │ 246 │ IDUSDT       │ 2024 06 04 21:30:00 │ 2024 06 04 21:35:00 │ SHORT        │ -0.26% │ 22.34% │ 0.77       │ rsiDivergency5m │
// │ 247 │ IDUSDT       │ 2024 06 04 21:45:00 │ 2024 06 04 23:30:00 │ SHORT        │ -0.26% │ 22.07% │ 0.77       │ rsiDivergency5m │
// │ 248 │ RSRUSDT      │ 2024 06 05 01:45:00 │ 2024 06 05 10:05:00 │ SHORT        │ 0.57%  │ 22.64% │ 0.01       │ rsiDivergency5m │
// │ 249 │ STXUSDT      │ 2024 06 05 12:05:00 │ 2024 06 05 12:35:00 │ SHORT        │ -0.26% │ 22.38% │ 2.39       │ rsiDivergency5m │
// │ 250 │ DENTUSDT     │ 2024 06 05 23:40:00 │ 2024 06 06 01:30:00 │ LONG         │ -0.26% │ 22.12% │ 0.00       │ rsiDivergency5m │
// │ 251 │ LQTYUSDT     │ 2024 06 06 07:55:00 │ 2024 06 06 08:00:00 │ SHORT        │ -0.26% │ 21.85% │ 1.47       │ rsiDivergency5m │
// │ 252 │ REZUSDT      │ 2024 06 06 09:45:00 │ 2024 06 06 10:30:00 │ SHORT        │ -0.26% │ 11.56% │ 0.18       │ rsiDivergency5m │
// │ 253 │ WUSDT        │ 2024 06 06 16:15:00 │ 2024 06 06 17:35:00 │ SHORT        │ -0.26% │ 21.59% │ 0.69       │ rsiDivergency5m │
// │ 254 │ MYROUSDT     │ 2024 06 06 18:25:00 │ 2024 06 06 21:35:00 │ LONG         │ -0.26% │ 21.33% │ 0.27       │ rsiDivergency5m │
// │ 255 │ IOTAUSDT     │ 2024 06 06 21:50:00 │ 2024 06 07 00:45:00 │ SHORT        │ -0.26% │ 21.07% │ 0.25       │ rsiDivergency5m │
// │ 256 │ USTCUSDT     │ 2024 06 07 04:15:00 │ 2024 06 07 06:00:00 │ LONG         │ -0.26% │ 20.80% │ 0.02       │ rsiDivergency5m │
// │ 257 │ HIGHUSDT     │ 2024 06 07 08:45:00 │ 2024 06 07 08:55:00 │ SHORT        │ -0.26% │ 20.54% │ 8.30       │ rsiDivergency5m │
// │ 258 │ HIGHUSDT     │ 2024 06 07 09:05:00 │ 2024 06 07 09:15:00 │ SHORT        │ -0.26% │ 20.28% │ 8.40       │ rsiDivergency5m │
// │ 259 │ FXSUSDT      │ 2024 06 07 10:05:00 │ 2024 06 07 10:20:00 │ SHORT        │ -0.26% │ 20.02% │ 5.17       │ rsiDivergency5m │
// │ 260 │ FXSUSDT      │ 2024 06 07 12:45:00 │ 2024 06 07 12:55:00 │ LONG         │ -0.26% │ 19.75% │ 4.94       │ rsiDivergency5m │
// │ 261 │ MAGICUSDT    │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 0.74%  │ 20.50% │ 0.80       │ rsiDivergency5m │
// │ 262 │ NKNUSDT      │ 2024 06 07 23:55:00 │ 2024 06 08 06:20:00 │ LONG         │ -0.26% │ 20.24% │ 0.11       │ rsiDivergency5m │
// │ 263 │ TRUUSDT      │ 2024 06 08 07:45:00 │ 2024 06 08 08:05:00 │ LONG         │ -0.26% │ 19.97% │ 0.20       │ rsiDivergency5m │
// │ 264 │ SAGAUSDT     │ 2024 06 08 08:30:00 │ 2024 06 08 16:50:00 │ LONG         │ 0.11%  │ 20.08% │ 2.29       │ rsiDivergency5m │
// │ 265 │ SEIUSDT      │ 2024 06 08 21:25:00 │ 2024 06 09 05:45:00 │ LONG         │ 0.31%  │ 20.39% │ 0.48       │ rsiDivergency5m │
// │ 266 │ HIGHUSDT     │ 2024 06 09 11:40:00 │ 2024 06 09 11:45:00 │ SHORT        │ -0.26% │ 20.13% │ 4.83       │ rsiDivergency5m │
// │ 267 │ CHZUSDT      │ 2024 06 09 13:25:00 │ 2024 06 09 21:45:00 │ SHORT        │ 0.82%  │ 20.95% │ 0.13       │ rsiDivergency5m │
// │ 268 │ HIFIUSDT     │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.24%  │ 22.20% │ 0.75       │ rsiDivergency5m │
// │ 269 │ OMNIUSDT     │ 2024 06 10 02:40:00 │ 2024 06 10 02:45:00 │ LONG         │ -0.26% │ 22.20% │ 15.39      │ rsiDivergency5m │
// │ 270 │ OMNIUSDT     │ 2024 06 10 02:50:00 │ 2024 06 10 11:10:00 │ LONG         │ 0.50%  │ 22.70% │ 15.29      │ rsiDivergency5m │
// │ 271 │ CRVUSDT      │ 2024 06 10 16:00:00 │ 2024 06 10 16:05:00 │ LONG         │ -0.26% │ 21.93% │ 0.38       │ rsiDivergency5m │
// │ 272 │ POLYXUSDT    │ 2024 06 10 20:55:00 │ 2024 06 11 05:15:00 │ LONG         │ 0.51%  │ 22.18% │ 0.49       │ rsiDivergency5m │
// │ 273 │ 1000BONKUSDT │ 2024 06 11 05:25:00 │ 2024 06 11 06:40:00 │ SHORT        │ -0.26% │ 21.92% │ 0.03       │ rsiDivergency5m │
// │ 274 │ ZETAUSDT     │ 2024 06 11 20:00:00 │ 2024 06 11 20:10:00 │ LONG         │ -0.26% │ 22.93% │ 1.08       │ rsiDivergency5m │
// │ 275 │ ZETAUSDT     │ 2024 06 11 20:45:00 │ 2024 06 12 05:05:00 │ LONG         │ 0.96%  │ 23.88% │ 1.05       │ rsiDivergency5m │
// │ 276 │ DUSKUSDT     │ 2024 06 12 14:55:00 │ 2024 06 12 16:30:00 │ LONG         │ -0.26% │ 25.16% │ 0.43       │ rsiDivergency5m │
// │ 277 │ DUSKUSDT     │ 2024 06 12 17:25:00 │ 2024 06 12 18:40:00 │ LONG         │ -0.26% │ 24.89% │ 0.42       │ rsiDivergency5m │
// │ 278 │ DUSKUSDT     │ 2024 06 12 21:15:00 │ 2024 06 12 21:40:00 │ LONG         │ -0.26% │ 24.63% │ 0.41       │ rsiDivergency5m │
// │ 279 │ DUSKUSDT     │ 2024 06 12 22:10:00 │ 2024 06 12 22:15:00 │ LONG         │ -0.26% │ 24.37% │ 0.40       │ rsiDivergency5m │
// │ 280 │ 1000PEPEUSDT │ 2024 06 12 22:30:00 │ 2024 06 13 01:45:00 │ LONG         │ -0.26% │ 24.11% │ 0.01       │ rsiDivergency5m │
// │ 281 │ POLYXUSDT    │ 2024 06 13 10:45:00 │ 2024 06 13 10:55:00 │ LONG         │ -0.26% │ 23.84% │ 0.46       │ rsiDivergency5m │
// │ 282 │ TRUUSDT      │ 2024 06 13 17:10:00 │ 2024 06 13 18:00:00 │ LONG         │ -0.26% │ 23.58% │ 0.20       │ rsiDivergency5m │
// │ 283 │ STXUSDT      │ 2024 06 13 18:15:00 │ 2024 06 13 19:15:00 │ LONG         │ -0.26% │ 23.32% │ 2.06       │ rsiDivergency5m │
// │ 284 │ KNCUSDT      │ 2024 06 13 19:25:00 │ 2024 06 13 22:05:00 │ LONG         │ -0.26% │ 23.06% │ 0.72       │ rsiDivergency5m │
// │ 285 │ ARUSDT       │ 2024 06 13 23:30:00 │ 2024 06 13 23:45:00 │ SHORT        │ -0.26% │ 22.79% │ 31.08      │ rsiDivergency5m │
// │ 286 │ KNCUSDT      │ 2024 06 14 04:30:00 │ 2024 06 14 05:20:00 │ SHORT        │ -0.26% │ 22.53% │ 0.79       │ rsiDivergency5m │
// │ 287 │ ARUSDT       │ 2024 06 14 08:05:00 │ 2024 06 14 09:15:00 │ LONG         │ -0.26% │ 22.27% │ 30.01      │ rsiDivergency5m │
// │ 288 │ MYROUSDT     │ 2024 06 14 11:10:00 │ 2024 06 14 12:05:00 │ LONG         │ -0.26% │ 22.01% │ 0.18       │ rsiDivergency5m │
// │ 289 │ ROSEUSDT     │ 2024 06 14 11:40:00 │ 2024 06 14 13:10:00 │ LONG         │ -0.26% │ 21.74% │ 0.12       │ rsiDivergency5m │
// │ 290 │ 1000PEPEUSDT │ 2024 06 14 13:25:00 │ 2024 06 14 16:30:00 │ LONG         │ 2.49%  │ 24.23% │ 0.01       │ rsiDivergency5m │
// │ 291 │ MEMEUSDT     │ 2024 06 14 16:55:00 │ 2024 06 14 19:20:00 │ SHORT        │ -0.26% │ 23.97% │ 0.02       │ rsiDivergency5m │
// │ 292 │ SKLUSDT      │ 2024 06 14 19:05:00 │ 2024 06 14 20:05:00 │ SHORT        │ -0.26% │ 23.71% │ 0.06       │ rsiDivergency5m │
// │ 293 │ RIFUSDT      │ 2024 06 15 05:45:00 │ 2024 06 15 05:55:00 │ LONG         │ -0.26% │ 23.44% │ 0.12       │ rsiDivergency5m │
// │ 294 │ RIFUSDT      │ 2024 06 15 06:05:00 │ 2024 06 15 06:10:00 │ LONG         │ -0.26% │ 23.18% │ 0.11       │ rsiDivergency5m │
// │ 295 │ RIFUSDT      │ 2024 06 15 06:20:00 │ 2024 06 15 14:05:00 │ LONG         │ -0.26% │ 22.92% │ 0.11       │ rsiDivergency5m │
// │ 296 │ RIFUSDT      │ 2024 06 15 15:20:00 │ 2024 06 15 23:40:00 │ LONG         │ 0.68%  │ 23.60% │ 0.11       │ rsiDivergency5m │
// │ 297 │ LDOUSDT      │ 2024 06 16 10:10:00 │ 2024 06 16 10:45:00 │ SHORT        │ -0.26% │ 23.34% │ 2.17       │ rsiDivergency5m │
// │ 298 │ LDOUSDT      │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 1.01%  │ 24.34% │ 2.24       │ rsiDivergency5m │
// │ 299 │ POLYXUSDT    │ 2024 06 16 21:05:00 │ 2024 06 16 21:25:00 │ LONG         │ -0.26% │ 24.08% │ 0.38       │ rsiDivergency5m │
// │ 300 │ ORBSUSDT     │ 2024 06 16 21:30:00 │ 2024 06 17 01:00:00 │ LONG         │ -0.26% │ 23.82% │ 0.02       │ rsiDivergency5m │
// │ 301 │ TRUUSDT      │ 2024 06 17 01:05:00 │ 2024 06 17 01:50:00 │ LONG         │ -0.26% │ 23.56% │ 0.17       │ rsiDivergency5m │
// │ 302 │ KNCUSDT      │ 2024 06 17 01:25:00 │ 2024 06 17 02:10:00 │ LONG         │ -0.26% │ 23.29% │ 0.68       │ rsiDivergency5m │
// │ 303 │ USTCUSDT     │ 2024 06 17 03:05:00 │ 2024 06 17 03:40:00 │ LONG         │ -0.26% │ 23.03% │ 0.02       │ rsiDivergency5m │
// │ 304 │ HIFIUSDT     │ 2024 06 17 03:40:00 │ 2024 06 17 04:45:00 │ LONG         │ -0.26% │ 22.77% │ 0.53       │ rsiDivergency5m │
// │ 305 │ REZUSDT      │ 2024 06 17 03:40:00 │ 2024 06 17 04:45:00 │ LONG         │ -0.26% │ 16.43% │ 0.11       │ rsiDivergency5m │
// │ 306 │ WUSDT        │ 2024 06 17 05:05:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.26% │ 22.51% │ 0.40       │ rsiDivergency5m │
// │ 307 │ KNCUSDT      │ 2024 06 17 10:55:00 │ 2024 06 17 11:05:00 │ LONG         │ -0.26% │ 22.24% │ 0.62       │ rsiDivergency5m │
// │ 308 │ JUPUSDT      │ 2024 06 17 13:35:00 │ 2024 06 17 20:35:00 │ SHORT        │ 2.49%  │ 24.73% │ 0.89       │ rsiDivergency5m │
// │ 309 │ OMNIUSDT     │ 2024 06 17 19:10:00 │ 2024 06 17 19:15:00 │ LONG         │ -0.26% │ 21.67% │ 14.84      │ rsiDivergency5m │
// │ 310 │ MAVUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.26% │ 24.47% │ 0.32       │ rsiDivergency5m │
// │ 311 │ BLURUSDT     │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 0.45%  │ 24.92% │ 0.25       │ rsiDivergency5m │
// │ 312 │ MTLUSDT      │ 2024 06 18 05:50:00 │ 2024 06 18 14:10:00 │ SHORT        │ 1.42%  │ 26.34% │ 1.05       │ rsiDivergency5m │
// │ 313 │ CRVUSDT      │ 2024 06 18 15:50:00 │ 2024 06 18 16:30:00 │ SHORT        │ -0.26% │ 26.08% │ 0.32       │ rsiDivergency5m │
// │ 314 │ ORBSUSDT     │ 2024 06 18 17:40:00 │ 2024 06 18 19:05:00 │ SHORT        │ -0.26% │ 25.82% │ 0.02       │ rsiDivergency5m │
// │ 315 │ ORBSUSDT     │ 2024 06 18 20:05:00 │ 2024 06 18 20:10:00 │ SHORT        │ -0.26% │ 25.55% │ 0.02       │ rsiDivergency5m │
// │ 316 │ ORBSUSDT     │ 2024 06 18 20:15:00 │ 2024 06 18 20:20:00 │ SHORT        │ -0.26% │ 25.29% │ 0.02       │ rsiDivergency5m │
// │ 317 │ ENAUSDT      │ 2024 06 18 21:30:00 │ 2024 06 18 22:25:00 │ SHORT        │ -0.26% │ 25.03% │ 0.66       │ rsiDivergency5m │
// │ 318 │ GRTUSDT      │ 2024 06 18 22:05:00 │ 2024 06 18 22:25:00 │ SHORT        │ -0.26% │ 24.77% │ 0.21       │ rsiDivergency5m │
// │ 319 │ STXUSDT      │ 2024 06 18 23:15:00 │ 2024 06 19 07:35:00 │ SHORT        │ 0.57%  │ 25.34% │ 1.71       │ rsiDivergency5m │
// │ 320 │ OMNIUSDT     │ 2024 06 19 04:40:00 │ 2024 06 19 13:00:00 │ LONG         │ 1.53%  │ 25.42% │ 13.66      │ rsiDivergency5m │
// │ 321 │ LDOUSDT      │ 2024 06 19 10:40:00 │ 2024 06 19 19:00:00 │ LONG         │ 0.84%  │ 26.18% │ 2.25       │ rsiDivergency5m │
// │ 322 │ NMRUSDT      │ 2024 06 20 00:35:00 │ 2024 06 20 08:55:00 │ SHORT        │ 0.52%  │ 26.70% │ 20.06      │ rsiDivergency5m │
// │ 323 │ WUSDT        │ 2024 06 20 11:10:00 │ 2024 06 20 19:30:00 │ LONG         │ 0.30%  │ 27.00% │ 0.34       │ rsiDivergency5m │
// │ 324 │ 1INCHUSDT    │ 2024 06 20 19:55:00 │ 2024 06 21 01:15:00 │ LONG         │ -0.26% │ 26.74% │ 0.42       │ rsiDivergency5m │
// │ 325 │ MTLUSDT      │ 2024 06 21 02:10:00 │ 2024 06 21 10:20:00 │ SHORT        │ 2.49%  │ 29.22% │ 1.33       │ rsiDivergency5m │
// │ 326 │ GASUSDT      │ 2024 06 22 03:25:00 │ 2024 06 22 11:45:00 │ LONG         │ 0.01%  │ 29.24% │ 3.67       │ rsiDivergency5m │
// │ 327 │ SAGAUSDT     │ 2024 06 22 12:05:00 │ 2024 06 22 12:15:00 │ SHORT        │ -0.26% │ 28.98% │ 1.48       │ rsiDivergency5m │
// │ 328 │ MTLUSDT      │ 2024 06 23 01:00:00 │ 2024 06 23 01:05:00 │ SHORT        │ -0.26% │ 28.71% │ 1.25       │ rsiDivergency5m │
// │ 329 │ MTLUSDT      │ 2024 06 23 09:50:00 │ 2024 06 23 10:20:00 │ LONG         │ -0.26% │ 28.45% │ 1.22       │ rsiDivergency5m │
// │ 330 │ VANRYUSDT    │ 2024 06 23 11:55:00 │ 2024 06 23 15:20:00 │ LONG         │ -0.26% │ 28.19% │ 0.14       │ rsiDivergency5m │
// │ 331 │ TRUUSDT      │ 2024 06 23 17:10:00 │ 2024 06 23 17:25:00 │ LONG         │ -0.26% │ 27.93% │ 0.13       │ rsiDivergency5m │
// │ 332 │ YGGUSDT      │ 2024 06 23 17:50:00 │ 2024 06 23 21:30:00 │ LONG         │ -0.26% │ 27.66% │ 0.59       │ rsiDivergency5m │
// │ 333 │ PENDLEUSDT   │ 2024 06 23 23:30:00 │ 2024 06 24 00:15:00 │ LONG         │ -0.26% │ 27.40% │ 5.51       │ rsiDivergency5m │
// │ 334 │ ZETAUSDT     │ 2024 06 24 00:45:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.26% │ 27.14% │ 0.78       │ rsiDivergency5m │
// │ 335 │ ETHWUSDT     │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 0.68%  │ 27.82% │ 2.25       │ rsiDivergency5m │
// │ 336 │ LDOUSDT      │ 2024 06 24 15:55:00 │ 2024 06 24 16:00:00 │ SHORT        │ -0.26% │ 27.55% │ 2.40       │ rsiDivergency5m │
// │ 337 │ LDOUSDT      │ 2024 06 24 16:05:00 │ 2024 06 24 16:10:00 │ SHORT        │ -0.26% │ 27.29% │ 2.40       │ rsiDivergency5m │
// │ 338 │ LDOUSDT      │ 2024 06 24 16:20:00 │ 2024 06 24 16:30:00 │ SHORT        │ -0.26% │ 27.03% │ 2.42       │ rsiDivergency5m │
// │ 339 │ AIUSDT       │ 2024 06 24 17:15:00 │ 2024 06 24 20:10:00 │ SHORT        │ -0.26% │ 26.77% │ 0.71       │ rsiDivergency5m │
// │ 340 │ CFXUSDT      │ 2024 06 24 19:55:00 │ 2024 06 25 04:15:00 │ SHORT        │ 0.42%  │ 27.19% │ 0.16       │ rsiDivergency5m │
// │ 341 │ STXUSDT      │ 2024 06 25 07:00:00 │ 2024 06 25 08:30:00 │ SHORT        │ -0.26% │ 26.93% │ 1.71       │ rsiDivergency5m │
// │ 342 │ 1000PEPEUSDT │ 2024 06 25 10:00:00 │ 2024 06 25 10:20:00 │ SHORT        │ -0.26% │ 26.67% │ 0.01       │ rsiDivergency5m │
// │ 343 │ STXUSDT      │ 2024 06 25 17:05:00 │ 2024 06 25 21:15:00 │ SHORT        │ -0.26% │ 26.14% │ 1.79       │ rsiDivergency5m │
// │ 344 │ BLURUSDT     │ 2024 06 26 12:20:00 │ 2024 06 26 13:00:00 │ LONG         │ -0.26% │ 25.88% │ 0.21       │ rsiDivergency5m │
// │ 345 │ 1000BONKUSDT │ 2024 06 27 08:45:00 │ 2024 06 27 09:00:00 │ SHORT        │ -0.26% │ 25.62% │ 0.02       │ rsiDivergency5m │
// │ 346 │ JUPUSDT      │ 2024 06 27 09:15:00 │ 2024 06 27 09:20:00 │ SHORT        │ -0.26% │ 25.35% │ 0.87       │ rsiDivergency5m │
// │ 347 │ JUPUSDT      │ 2024 06 27 09:25:00 │ 2024 06 27 17:45:00 │ SHORT        │ 0.72%  │ 26.08% │ 0.88       │ rsiDivergency5m │
// │ 348 │ GASUSDT      │ 2024 06 28 17:25:00 │ 2024 06 28 19:20:00 │ LONG         │ -0.26% │ 25.81% │ 3.71       │ rsiDivergency5m │
// │ 349 │ MYROUSDT     │ 2024 06 28 22:05:00 │ 2024 06 29 06:25:00 │ SHORT        │ 0.45%  │ 26.26% │ 0.14       │ rsiDivergency5m │
// │ 350 │ ARPAUSDT     │ 2024 06 29 19:15:00 │ 2024 06 29 19:50:00 │ LONG         │ -0.26% │ 26.00% │ 0.04       │ rsiDivergency5m │
// │ 351 │ ARPAUSDT     │ 2024 06 29 19:55:00 │ 2024 06 29 20:00:00 │ LONG         │ -0.26% │ 25.73% │ 0.04       │ rsiDivergency5m │
// │ 352 │ ARPAUSDT     │ 2024 06 29 20:05:00 │ 2024 06 30 03:05:00 │ LONG         │ 2.49%  │ 28.22% │ 0.04       │ rsiDivergency5m │
// │ 353 │ JOEUSDT      │ 2024 06 30 17:35:00 │ 2024 07 01 01:55:00 │ SHORT        │ 0.24%  │ 28.46% │ 0.36       │ rsiDivergency5m │
// │ 354 │ PORTALUSDT   │ 2024 07 01 10:25:00 │ 2024 07 01 18:45:00 │ LONG         │ 0.20%  │ 28.66% │ 0.44       │ rsiDivergency5m │
// │ 355 │ REZUSDT      │ 2024 07 02 05:25:00 │ 2024 07 02 06:00:00 │ LONG         │ -0.26% │ 21.66% │ 0.08       │ rsiDivergency5m │
// │ 356 │ REZUSDT      │ 2024 07 02 06:55:00 │ 2024 07 02 07:05:00 │ LONG         │ -0.26% │ 21.39% │ 0.08       │ rsiDivergency5m │
// │ 357 │ REZUSDT      │ 2024 07 02 07:10:00 │ 2024 07 02 15:30:00 │ LONG         │ 1.80%  │ 23.19% │ 0.08       │ rsiDivergency5m │
// │ 358 │ OMNIUSDT     │ 2024 07 02 10:35:00 │ 2024 07 02 10:55:00 │ SHORT        │ -0.26% │ 26.40% │ 15.39      │ rsiDivergency5m │
// │ 359 │ PENDLEUSDT   │ 2024 07 02 18:00:00 │ 2024 07 02 19:05:00 │ LONG         │ -0.26% │ 28.40% │ 4.12       │ rsiDivergency5m │
// │ 360 │ WLDUSDT      │ 2024 07 02 21:05:00 │ 2024 07 02 22:05:00 │ LONG         │ -0.26% │ 28.14% │ 2.21       │ rsiDivergency5m │
// │ 361 │ WLDUSDT      │ 2024 07 02 22:15:00 │ 2024 07 03 05:40:00 │ LONG         │ 2.49%  │ 30.62% │ 2.17       │ rsiDivergency5m │
// │ 362 │ 1000BONKUSDT │ 2024 07 03 07:40:00 │ 2024 07 03 08:00:00 │ LONG         │ -0.26% │ 30.36% │ 0.02       │ rsiDivergency5m │
// │ 363 │ TRUUSDT      │ 2024 07 03 07:55:00 │ 2024 07 03 14:20:00 │ LONG         │ -0.26% │ 30.10% │ 0.12       │ rsiDivergency5m │
// │ 364 │ WLDUSDT      │ 2024 07 03 19:05:00 │ 2024 07 03 19:25:00 │ LONG         │ -0.26% │ 29.84% │ 2.29       │ rsiDivergency5m │
// │ 365 │ DYDXUSDT     │ 2024 07 03 20:35:00 │ 2024 07 03 20:40:00 │ LONG         │ -0.26% │ 29.57% │ 1.21       │ rsiDivergency5m │
// │ 366 │ SUPERUSDT    │ 2024 07 03 21:10:00 │ 2024 07 04 02:05:00 │ LONG         │ -0.26% │ 29.31% │ 0.59       │ rsiDivergency5m │
// │ 367 │ MINAUSDT     │ 2024 07 04 01:55:00 │ 2024 07 04 02:15:00 │ LONG         │ -0.26% │ 29.05% │ 0.48       │ rsiDivergency5m │
// │ 368 │ API3USDT     │ 2024 07 04 02:20:00 │ 2024 07 04 03:05:00 │ LONG         │ -0.26% │ 28.79% │ 1.93       │ rsiDivergency5m │
// │ 369 │ ETHWUSDT     │ 2024 07 04 05:20:00 │ 2024 07 04 07:20:00 │ LONG         │ -0.26% │ 28.52% │ 2.23       │ rsiDivergency5m │
// │ 370 │ OPUSDT       │ 2024 07 04 08:05:00 │ 2024 07 04 16:25:00 │ LONG         │ 0.33%  │ 28.86% │ 1.51       │ rsiDivergency5m │
// │ 371 │ TONUSDT      │ 2024 07 04 17:05:00 │ 2024 07 04 21:55:00 │ SHORT        │ 2.49%  │ 31.34% │ 7.34       │ rsiDivergency5m │
// │ 372 │ ARBUSDT      │ 2024 07 04 21:40:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.26% │ 31.08% │ 0.62       │ rsiDivergency5m │
// │ 373 │ UMAUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.26% │ 30.82% │ 1.76       │ rsiDivergency5m │
// │ 374 │ KEYUSDT      │ 2024 07 04 22:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.26% │ 30.56% │ 0.00       │ rsiDivergency5m │
// │ 375 │ 1000XECUSDT  │ 2024 07 04 23:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.26% │ 30.29% │ 0.03       │ rsiDivergency5m │
// │ 376 │ ALGOUSDT     │ 2024 07 04 23:10:00 │ 2024 07 04 23:15:00 │ LONG         │ -0.26% │ 30.03% │ 0.12       │ rsiDivergency5m │
// │ 377 │ ALGOUSDT     │ 2024 07 04 23:20:00 │ 2024 07 05 07:40:00 │ LONG         │ 1.90%  │ 31.93% │ 0.12       │ rsiDivergency5m │
// │ 378 │ CAKEUSDT     │ 2024 07 05 08:40:00 │ 2024 07 05 10:25:00 │ SHORT        │ -0.26% │ 31.67% │ 1.71       │ rsiDivergency5m │
// │ 379 │ ROSEUSDT     │ 2024 07 05 10:10:00 │ 2024 07 05 10:30:00 │ SHORT        │ -0.26% │ 31.41% │ 0.08       │ rsiDivergency5m │
// │ 380 │ STORJUSDT    │ 2024 07 05 10:25:00 │ 2024 07 05 11:20:00 │ SHORT        │ -0.26% │ 31.15% │ 0.32       │ rsiDivergency5m │
// │ 381 │ AXSUSDT      │ 2024 07 05 11:30:00 │ 2024 07 05 13:00:00 │ SHORT        │ -0.26% │ 30.88% │ 4.92       │ rsiDivergency5m │
// │ 382 │ KAVAUSDT     │ 2024 07 05 14:30:00 │ 2024 07 05 19:20:00 │ SHORT        │ -0.26% │ 30.62% │ 0.36       │ rsiDivergency5m │
// │ 383 │ 1000XECUSDT  │ 2024 07 05 19:40:00 │ 2024 07 06 04:00:00 │ SHORT        │ 0.31%  │ 30.93% │ 0.03       │ rsiDivergency5m │
// │ 384 │ 1000PEPEUSDT │ 2024 07 06 12:35:00 │ 2024 07 06 13:05:00 │ SHORT        │ -0.26% │ 30.40% │ 0.01       │ rsiDivergency5m │
// │ 385 │ PHBUSDT      │ 2024 07 06 13:05:00 │ 2024 07 06 15:50:00 │ SHORT        │ -0.26% │ 30.14% │ 1.53       │ rsiDivergency5m │
// │ 386 │ YGGUSDT      │ 2024 07 06 16:10:00 │ 2024 07 06 16:35:00 │ SHORT        │ -0.26% │ 29.88% │ 0.47       │ rsiDivergency5m │
// │ 387 │ TRUUSDT      │ 2024 07 06 17:25:00 │ 2024 07 06 18:15:00 │ SHORT        │ -0.26% │ 29.61% │ 0.11       │ rsiDivergency5m │
// │ 388 │ TRUUSDT      │ 2024 07 06 20:25:00 │ 2024 07 06 23:45:00 │ LONG         │ -0.26% │ 29.35% │ 0.11       │ rsiDivergency5m │
// │ 389 │ HIGHUSDT     │ 2024 07 06 23:45:00 │ 2024 07 06 23:50:00 │ LONG         │ -0.26% │ 29.09% │ 1.49       │ rsiDivergency5m │
// │ 390 │ HIGHUSDT     │ 2024 07 07 00:00:00 │ 2024 07 07 08:20:00 │ LONG         │ 0.32%  │ 29.41% │ 1.48       │ rsiDivergency5m │
// │ 391 │ 1000PEPEUSDT │ 2024 07 07 08:40:00 │ 2024 07 07 09:00:00 │ LONG         │ -0.26% │ 29.15% │ 0.01       │ rsiDivergency5m │
// │ 392 │ USTCUSDT     │ 2024 07 07 11:40:00 │ 2024 07 07 12:10:00 │ SHORT        │ -0.26% │ 28.89% │ 0.02       │ rsiDivergency5m │
// │ 393 │ 1000PEPEUSDT │ 2024 07 07 18:00:00 │ 2024 07 07 18:40:00 │ LONG         │ -0.26% │ 28.62% │ 0.01       │ rsiDivergency5m │
// │ 394 │ ONTUSDT      │ 2024 07 07 18:50:00 │ 2024 07 07 19:05:00 │ LONG         │ -0.26% │ 28.10% │ 0.17       │ rsiDivergency5m │
// │ 395 │ ENAUSDT      │ 2024 07 07 19:10:00 │ 2024 07 07 19:35:00 │ LONG         │ -0.26% │ 28.36% │ 0.37       │ rsiDivergency5m │
// │ 396 │ TWTUSDT      │ 2024 07 07 19:50:00 │ 2024 07 07 20:05:00 │ LONG         │ -0.26% │ 27.84% │ 0.94       │ rsiDivergency5m │
// │ 397 │ USTCUSDT     │ 2024 07 07 20:10:00 │ 2024 07 08 04:30:00 │ LONG         │ 2.38%  │ 30.22% │ 0.01       │ rsiDivergency5m │
// │ 398 │ ARKMUSDT     │ 2024 07 08 04:30:00 │ 2024 07 08 12:50:00 │ SHORT        │ 1.31%  │ 31.52% │ 1.45       │ rsiDivergency5m │
// │ 399 │ TAOUSDT      │ 2024 07 08 05:00:00 │ 2024 07 08 06:05:00 │ SHORT        │ -0.26% │ 30.66% │ 230.97     │ rsiDivergency5m │
// │ 400 │ FTMUSDT      │ 2024 07 10 03:50:00 │ 2024 07 10 04:25:00 │ LONG         │ -0.26% │ 31.26% │ 0.47       │ rsiDivergency5m │
// │ 401 │ WLDUSDT      │ 2024 07 10 09:55:00 │ 2024 07 10 10:10:00 │ SHORT        │ -0.26% │ 31.00% │ 2.01       │ rsiDivergency5m │
// └─────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴────────┴────────────┴─────────────────┘
