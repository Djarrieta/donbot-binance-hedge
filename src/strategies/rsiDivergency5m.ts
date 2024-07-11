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
// │              sl │ 2.00%  │
// │  maxTradeLength │ 100    │
// │ amountToTradePt │ 25.00% │
// └─────────────────┴────────┘

// Snapshot data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────┬─────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ avPnl │ winRate │
// ├───┼───────┼────────┼────────────────┼───────────┼───────┼─────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 2690      │ 0.22% │ 41.45%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬────────┬──────────┬────────────────────┬──────────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl │ drawdown │ drawdownMonteCarlo │ badRunMonteCarlo │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼────────┼──────────┼────────────────────┼──────────────────┼─────────┼───────────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 305       │ 41.45%    │ -3.38%    │ 40.43% │ 7.00%    │ 12.28%             │ 13               │ 40.66%  │ 53.72         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴────────┴──────────┴────────────────────┴──────────────────┴─────────┴───────────────┘

// ┌─────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬────────┬────────────┬─────────────────┐
// │     │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl │ entryPrice │ stgName         │
// ├─────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼────────┼────────────┼─────────────────┤
// │   0 │ ETHWUSDT     │ 2024 04 11 20:00:00 │ 2024 04 12 04:20:00 │ SHORT        │ 0.72%  │ 0.72%  │ 5.07       │ rsiDivergency5m │
// │   1 │ SAGAUSDT     │ 2024 04 12 04:50:00 │ 2024 04 12 07:15:00 │ LONG         │ -0.51% │ 0.21%  │ 4.81       │ rsiDivergency5m │
// │   2 │ SAGAUSDT     │ 2024 04 12 07:30:00 │ 2024 04 12 08:35:00 │ LONG         │ -0.51% │ -0.30% │ 4.70       │ rsiDivergency5m │
// │   3 │ PORTALUSDT   │ 2024 04 12 08:45:00 │ 2024 04 12 11:10:00 │ LONG         │ -0.51% │ -0.81% │ 1.30       │ rsiDivergency5m │
// │   4 │ DUSKUSDT     │ 2024 04 12 11:00:00 │ 2024 04 12 12:20:00 │ LONG         │ -0.51% │ -1.33% │ 0.41       │ rsiDivergency5m │
// │   5 │ YGGUSDT      │ 2024 04 12 12:45:00 │ 2024 04 12 13:00:00 │ LONG         │ -0.51% │ -1.84% │ 1.13       │ rsiDivergency5m │
// │   6 │ LINAUSDT     │ 2024 04 12 13:00:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.51% │ -2.86% │ 0.01       │ rsiDivergency5m │
// │   7 │ ALGOUSDT     │ 2024 04 12 13:20:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.51% │ -3.38% │ 0.21       │ rsiDivergency5m │
// │   8 │ TONUSDT      │ 2024 04 12 13:20:00 │ 2024 04 12 13:30:00 │ LONG         │ -0.51% │ -2.35% │ 6.57       │ rsiDivergency5m │
// │   9 │ SFPUSDT      │ 2024 04 12 13:45:00 │ 2024 04 12 15:10:00 │ LONG         │ 2.49%  │ -0.89% │ 0.80       │ rsiDivergency5m │
// │  10 │ XMRUSDT      │ 2024 04 12 15:25:00 │ 2024 04 12 23:45:00 │ LONG         │ 1.54%  │ 0.65%  │ 118.62     │ rsiDivergency5m │
// │  11 │ NEOUSDT      │ 2024 04 13 00:10:00 │ 2024 04 13 08:30:00 │ SHORT        │ 1.21%  │ 1.87%  │ 20.33      │ rsiDivergency5m │
// │  12 │ GMTUSDT      │ 2024 04 13 10:35:00 │ 2024 04 13 14:55:00 │ SHORT        │ 2.49%  │ 4.35%  │ 0.27       │ rsiDivergency5m │
// │  13 │ ADAUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 2.82%  │ 0.45       │ rsiDivergency5m │
// │  14 │ FILUSDT      │ 2024 04 13 14:55:00 │ 2024 04 13 15:00:00 │ LONG         │ -0.51% │ 3.33%  │ 5.66       │ rsiDivergency5m │
// │  15 │ OPUSDT       │ 2024 04 13 15:00:00 │ 2024 04 13 15:05:00 │ LONG         │ -0.51% │ 3.84%  │ 2.09       │ rsiDivergency5m │
// │  16 │ RIFUSDT      │ 2024 04 14 01:45:00 │ 2024 04 14 10:05:00 │ SHORT        │ 0.31%  │ 2.61%  │ 0.20       │ rsiDivergency5m │
// │  17 │ 1000XECUSDT  │ 2024 04 15 00:55:00 │ 2024 04 15 01:25:00 │ SHORT        │ -0.51% │ 2.93%  │ 0.06       │ rsiDivergency5m │
// │  18 │ ETHWUSDT     │ 2024 04 15 02:00:00 │ 2024 04 15 10:20:00 │ SHORT        │ 1.24%  │ 4.17%  │ 3.97       │ rsiDivergency5m │
// │  19 │ MANTAUSDT    │ 2024 04 15 11:30:00 │ 2024 04 15 12:25:00 │ LONG         │ -0.51% │ 3.65%  │ 1.98       │ rsiDivergency5m │
// │  20 │ QTUMUSDT     │ 2024 04 15 12:00:00 │ 2024 04 15 12:25:00 │ LONG         │ -0.51% │ 3.14%  │ 4.19       │ rsiDivergency5m │
// │  21 │ C98USDT      │ 2024 04 15 12:45:00 │ 2024 04 15 13:25:00 │ LONG         │ -0.51% │ 2.63%  │ 0.27       │ rsiDivergency5m │
// │  22 │ XEMUSDT      │ 2024 04 15 13:25:00 │ 2024 04 15 14:00:00 │ LONG         │ -0.51% │ 2.12%  │ 0.04       │ rsiDivergency5m │
// │  23 │ SEIUSDT      │ 2024 04 15 16:25:00 │ 2024 04 15 23:20:00 │ LONG         │ -0.51% │ 1.60%  │ 0.48       │ rsiDivergency5m │
// │  24 │ AIUSDT       │ 2024 04 16 02:05:00 │ 2024 04 16 10:25:00 │ SHORT        │ 1.01%  │ 2.62%  │ 0.92       │ rsiDivergency5m │
// │  25 │ TAOUSDT      │ 2024 04 16 07:40:00 │ 2024 04 16 16:00:00 │ LONG         │ 1.34%  │ 3.44%  │ 460.81     │ rsiDivergency5m │
// │  26 │ ENAUSDT      │ 2024 04 16 10:40:00 │ 2024 04 16 16:25:00 │ LONG         │ 2.49%  │ 5.11%  │ 0.90       │ rsiDivergency5m │
// │  27 │ BEAMXUSDT    │ 2024 04 16 16:25:00 │ 2024 04 16 23:30:00 │ SHORT        │ -0.51% │ 4.59%  │ 0.03       │ rsiDivergency5m │
// │  28 │ TONUSDT      │ 2024 04 17 07:15:00 │ 2024 04 17 11:05:00 │ LONG         │ -0.51% │ 3.57%  │ 6.14       │ rsiDivergency5m │
// │  29 │ MYROUSDT     │ 2024 04 17 13:45:00 │ 2024 04 17 22:05:00 │ SHORT        │ 0.87%  │ 4.44%  │ 0.15       │ rsiDivergency5m │
// │  30 │ RUNEUSDT     │ 2024 04 18 09:30:00 │ 2024 04 18 11:20:00 │ SHORT        │ -0.51% │ 4.41%  │ 4.71       │ rsiDivergency5m │
// │  31 │ WUSDT        │ 2024 04 18 09:30:00 │ 2024 04 18 10:10:00 │ SHORT        │ -0.51% │ 4.92%  │ 0.59       │ rsiDivergency5m │
// │  32 │ LPTUSDT      │ 2024 04 18 14:35:00 │ 2024 04 18 20:40:00 │ SHORT        │ 2.49%  │ 6.89%  │ 13.94      │ rsiDivergency5m │
// │  33 │ JUPUSDT      │ 2024 04 18 21:10:00 │ 2024 04 18 21:20:00 │ LONG         │ -0.51% │ 6.38%  │ 0.95       │ rsiDivergency5m │
// │  34 │ TAOUSDT      │ 2024 04 18 21:20:00 │ 2024 04 18 21:45:00 │ LONG         │ -0.51% │ 4.08%  │ 434.73     │ rsiDivergency5m │
// │  35 │ ENAUSDT      │ 2024 04 18 21:30:00 │ 2024 04 19 01:35:00 │ LONG         │ 2.49%  │ 8.87%  │ 0.83       │ rsiDivergency5m │
// │  36 │ MAGICUSDT    │ 2024 04 19 02:40:00 │ 2024 04 19 11:00:00 │ SHORT        │ -0.03% │ 8.84%  │ 0.79       │ rsiDivergency5m │
// │  37 │ TAOUSDT      │ 2024 04 19 18:05:00 │ 2024 04 20 02:25:00 │ LONG         │ 0.99%  │ 5.43%  │ 433.10     │ rsiDivergency5m │
// │  38 │ ONTUSDT      │ 2024 04 20 07:35:00 │ 2024 04 20 15:55:00 │ LONG         │ 0.26%  │ 9.09%  │ 0.36       │ rsiDivergency5m │
// │  39 │ OMNIUSDT     │ 2024 04 20 14:40:00 │ 2024 04 20 18:25:00 │ SHORT        │ -0.51% │ 2.30%  │ 28.76      │ rsiDivergency5m │
// │  40 │ TRUUSDT      │ 2024 04 20 19:50:00 │ 2024 04 21 04:10:00 │ LONG         │ 0.21%  │ 9.30%  │ 0.13       │ rsiDivergency5m │
// │  41 │ ONTUSDT      │ 2024 04 21 08:00:00 │ 2024 04 21 08:25:00 │ SHORT        │ -0.51% │ 8.79%  │ 0.41       │ rsiDivergency5m │
// │  42 │ PENDLEUSDT   │ 2024 04 21 09:20:00 │ 2024 04 21 17:40:00 │ LONG         │ 0.11%  │ 8.90%  │ 5.88       │ rsiDivergency5m │
// │  43 │ OMNIUSDT     │ 2024 04 21 09:40:00 │ 2024 04 21 11:35:00 │ LONG         │ -0.51% │ 2.10%  │ 26.06      │ rsiDivergency5m │
// │  44 │ 1000PEPEUSDT │ 2024 04 21 19:10:00 │ 2024 04 21 22:40:00 │ SHORT        │ -0.51% │ 8.39%  │ 0.01       │ rsiDivergency5m │
// │  45 │ 1000PEPEUSDT │ 2024 04 21 23:30:00 │ 2024 04 22 00:10:00 │ SHORT        │ -0.51% │ 7.88%  │ 0.01       │ rsiDivergency5m │
// │  46 │ SEIUSDT      │ 2024 04 22 06:10:00 │ 2024 04 22 14:30:00 │ SHORT        │ 0.44%  │ 8.32%  │ 0.67       │ rsiDivergency5m │
// │  47 │ DODOXUSDT    │ 2024 04 22 15:45:00 │ 2024 04 22 16:05:00 │ SHORT        │ -0.51% │ 7.81%  │ 0.20       │ rsiDivergency5m │
// │  48 │ ATAUSDT      │ 2024 04 22 23:20:00 │ 2024 04 22 23:40:00 │ SHORT        │ -0.51% │ 6.78%  │ 0.21       │ rsiDivergency5m │
// │  49 │ ATAUSDT      │ 2024 04 23 00:10:00 │ 2024 04 23 00:25:00 │ SHORT        │ -0.51% │ 6.27%  │ 0.22       │ rsiDivergency5m │
// │  50 │ TONUSDT      │ 2024 04 23 01:45:00 │ 2024 04 23 02:00:00 │ LONG         │ -0.51% │ 5.76%  │ 5.61       │ rsiDivergency5m │
// │  51 │ 1000BONKUSDT │ 2024 04 23 19:45:00 │ 2024 04 23 20:05:00 │ SHORT        │ -0.51% │ 5.31%  │ 0.03       │ rsiDivergency5m │
// │  52 │ ARKMUSDT     │ 2024 04 23 22:55:00 │ 2024 04 24 07:15:00 │ LONG         │ 1.09%  │ 6.40%  │ 2.14       │ rsiDivergency5m │
// │  53 │ VANRYUSDT    │ 2024 04 24 09:55:00 │ 2024 04 24 10:40:00 │ LONG         │ -0.51% │ 5.89%  │ 0.17       │ rsiDivergency5m │
// │  54 │ RLCUSDT      │ 2024 04 24 10:20:00 │ 2024 04 24 11:25:00 │ LONG         │ -0.51% │ 5.37%  │ 2.97       │ rsiDivergency5m │
// │  55 │ TAOUSDT      │ 2024 04 24 11:15:00 │ 2024 04 24 14:00:00 │ LONG         │ -0.51% │ 7.30%  │ 457.42     │ rsiDivergency5m │
// │  56 │ RLCUSDT      │ 2024 04 24 11:30:00 │ 2024 04 24 13:50:00 │ LONG         │ -0.51% │ 4.86%  │ 2.91       │ rsiDivergency5m │
// │  57 │ EOSUSDT      │ 2024 04 24 21:15:00 │ 2024 04 25 05:35:00 │ SHORT        │ 1.70%  │ 6.56%  │ 0.93       │ rsiDivergency5m │
// │  58 │ WUSDT        │ 2024 04 25 08:30:00 │ 2024 04 25 08:45:00 │ SHORT        │ -0.51% │ 6.05%  │ 0.58       │ rsiDivergency5m │
// │  59 │ WUSDT        │ 2024 04 25 08:50:00 │ 2024 04 25 09:10:00 │ SHORT        │ -0.51% │ 5.54%  │ 0.59       │ rsiDivergency5m │
// │  60 │ WUSDT        │ 2024 04 25 09:25:00 │ 2024 04 25 09:35:00 │ SHORT        │ -0.51% │ 5.03%  │ 0.61       │ rsiDivergency5m │
// │  61 │ WUSDT        │ 2024 04 25 09:40:00 │ 2024 04 25 10:35:00 │ SHORT        │ -0.51% │ 4.51%  │ 0.62       │ rsiDivergency5m │
// │  62 │ WUSDT        │ 2024 04 25 10:50:00 │ 2024 04 25 11:55:00 │ SHORT        │ -0.51% │ 4.00%  │ 0.65       │ rsiDivergency5m │
// │  63 │ 1000BONKUSDT │ 2024 04 25 12:00:00 │ 2024 04 25 19:35:00 │ SHORT        │ 2.49%  │ 5.98%  │ 0.03       │ rsiDivergency5m │
// │  64 │ WUSDT        │ 2024 04 25 12:00:00 │ 2024 04 25 12:05:00 │ SHORT        │ -0.51% │ 3.49%  │ 0.66       │ rsiDivergency5m │
// │  65 │ LSKUSDT      │ 2024 04 25 19:45:00 │ 2024 04 25 20:05:00 │ LONG         │ -0.51% │ 5.46%  │ 1.86       │ rsiDivergency5m │
// │  66 │ ARKMUSDT     │ 2024 04 25 20:05:00 │ 2024 04 26 01:35:00 │ LONG         │ -0.51% │ 4.95%  │ 2.06       │ rsiDivergency5m │
// │  67 │ ALGOUSDT     │ 2024 04 26 07:55:00 │ 2024 04 26 16:15:00 │ LONG         │ 0.34%  │ 5.29%  │ 0.20       │ rsiDivergency5m │
// │  68 │ MYROUSDT     │ 2024 04 26 17:30:00 │ 2024 04 26 19:30:00 │ LONG         │ -0.51% │ 4.78%  │ 0.16       │ rsiDivergency5m │
// │  69 │ LSKUSDT      │ 2024 04 26 19:45:00 │ 2024 04 26 20:15:00 │ LONG         │ -0.51% │ 4.27%  │ 1.68       │ rsiDivergency5m │
// │  70 │ 1000PEPEUSDT │ 2024 04 26 20:05:00 │ 2024 04 26 20:15:00 │ LONG         │ -0.51% │ 3.76%  │ 0.01       │ rsiDivergency5m │
// │  71 │ 1000PEPEUSDT │ 2024 04 26 20:25:00 │ 2024 04 27 03:35:00 │ LONG         │ -0.51% │ 3.24%  │ 0.01       │ rsiDivergency5m │
// │  72 │ APEUSDT      │ 2024 04 27 03:35:00 │ 2024 04 27 11:05:00 │ LONG         │ -0.51% │ 2.73%  │ 1.25       │ rsiDivergency5m │
// │  73 │ ARKMUSDT     │ 2024 04 27 12:55:00 │ 2024 04 27 21:15:00 │ SHORT        │ -0.43% │ 2.30%  │ 2.15       │ rsiDivergency5m │
// │  74 │ TUSDT        │ 2024 04 27 21:10:00 │ 2024 04 28 05:30:00 │ SHORT        │ 1.63%  │ 3.93%  │ 0.04       │ rsiDivergency5m │
// │  75 │ ONTUSDT      │ 2024 04 28 07:45:00 │ 2024 04 28 16:05:00 │ LONG         │ 0.70%  │ 4.63%  │ 0.38       │ rsiDivergency5m │
// │  76 │ HIGHUSDT     │ 2024 04 28 18:30:00 │ 2024 04 29 02:50:00 │ LONG         │ 0.77%  │ 5.40%  │ 3.83       │ rsiDivergency5m │
// │  77 │ PORTALUSDT   │ 2024 04 29 03:25:00 │ 2024 04 29 11:45:00 │ LONG         │ 0.34%  │ 5.74%  │ 0.85       │ rsiDivergency5m │
// │  78 │ ENAUSDT      │ 2024 04 29 18:10:00 │ 2024 04 30 02:30:00 │ SHORT        │ 1.27%  │ 7.01%  │ 0.94       │ rsiDivergency5m │
// │  79 │ PORTALUSDT   │ 2024 04 30 04:35:00 │ 2024 04 30 06:35:00 │ LONG         │ -0.51% │ 6.50%  │ 0.81       │ rsiDivergency5m │
// │  80 │ RLCUSDT      │ 2024 04 30 05:50:00 │ 2024 04 30 06:35:00 │ LONG         │ -0.51% │ 5.98%  │ 2.52       │ rsiDivergency5m │
// │  81 │ BLURUSDT     │ 2024 04 30 07:10:00 │ 2024 04 30 11:10:00 │ LONG         │ -0.51% │ 5.47%  │ 0.37       │ rsiDivergency5m │
// │  82 │ OMNIUSDT     │ 2024 04 30 08:05:00 │ 2024 04 30 08:35:00 │ LONG         │ -0.51% │ 5.25%  │ 18.43      │ rsiDivergency5m │
// │  83 │ OMNIUSDT     │ 2024 04 30 08:55:00 │ 2024 04 30 17:15:00 │ LONG         │ 0.57%  │ 5.82%  │ 17.96      │ rsiDivergency5m │
// │  84 │ RIFUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 19:40:00 │ LONG         │ 0.95%  │ 6.42%  │ 0.17       │ rsiDivergency5m │
// │  85 │ HIGHUSDT     │ 2024 04 30 22:15:00 │ 2024 05 01 06:35:00 │ LONG         │ 1.76%  │ 8.19%  │ 3.26       │ rsiDivergency5m │
// │  86 │ PORTALUSDT   │ 2024 05 01 07:35:00 │ 2024 05 01 13:40:00 │ SHORT        │ -0.51% │ 7.67%  │ 0.80       │ rsiDivergency5m │
// │  87 │ MYROUSDT     │ 2024 05 01 13:45:00 │ 2024 05 01 22:05:00 │ SHORT        │ 1.88%  │ 9.55%  │ 0.14       │ rsiDivergency5m │
// │  88 │ WUSDT        │ 2024 05 02 04:00:00 │ 2024 05 02 04:50:00 │ SHORT        │ -0.51% │ 9.04%  │ 0.67       │ rsiDivergency5m │
// │  89 │ 1000BONKUSDT │ 2024 05 02 06:55:00 │ 2024 05 02 07:05:00 │ SHORT        │ -0.51% │ 8.53%  │ 0.02       │ rsiDivergency5m │
// │  90 │ 1000BONKUSDT │ 2024 05 02 07:10:00 │ 2024 05 02 09:35:00 │ SHORT        │ -0.51% │ 8.02%  │ 0.03       │ rsiDivergency5m │
// │  91 │ JUPUSDT      │ 2024 05 02 10:30:00 │ 2024 05 02 18:50:00 │ SHORT        │ 0.17%  │ 8.18%  │ 1.02       │ rsiDivergency5m │
// │  92 │ POLYXUSDT    │ 2024 05 02 21:55:00 │ 2024 05 03 06:15:00 │ SHORT        │ 1.32%  │ 9.50%  │ 0.37       │ rsiDivergency5m │
// │  93 │ GRTUSDT      │ 2024 05 03 15:15:00 │ 2024 05 03 16:15:00 │ SHORT        │ -0.51% │ 9.87%  │ 0.28       │ rsiDivergency5m │
// │  94 │ STXUSDT      │ 2024 05 03 18:20:00 │ 2024 05 03 18:35:00 │ SHORT        │ -0.51% │ 9.36%  │ 2.36       │ rsiDivergency5m │
// │  95 │ DOGEUSDT     │ 2024 05 03 19:50:00 │ 2024 05 04 04:10:00 │ SHORT        │ -0.22% │ 9.14%  │ 0.15       │ rsiDivergency5m │
// │  96 │ LSKUSDT      │ 2024 05 04 05:10:00 │ 2024 05 04 13:30:00 │ SHORT        │ 1.30%  │ 10.44% │ 2.09       │ rsiDivergency5m │
// │  97 │ VANRYUSDT    │ 2024 05 05 04:35:00 │ 2024 05 05 04:50:00 │ SHORT        │ -0.51% │ 9.79%  │ 0.19       │ rsiDivergency5m │
// │  98 │ LPTUSDT      │ 2024 05 05 05:25:00 │ 2024 05 05 13:45:00 │ SHORT        │ 0.25%  │ 10.04% │ 15.21      │ rsiDivergency5m │
// │  99 │ LUNA2USDT    │ 2024 05 05 16:50:00 │ 2024 05 05 19:40:00 │ SHORT        │ -0.51% │ 9.02%  │ 0.64       │ rsiDivergency5m │
// │ 100 │ LUNA2USDT    │ 2024 05 05 19:45:00 │ 2024 05 06 04:05:00 │ SHORT        │ 0.59%  │ 9.60%  │ 0.66       │ rsiDivergency5m │
// │ 101 │ JUPUSDT      │ 2024 05 06 04:55:00 │ 2024 05 06 13:15:00 │ SHORT        │ 1.50%  │ 11.10% │ 1.18       │ rsiDivergency5m │
// │ 102 │ TAOUSDT      │ 2024 05 06 10:10:00 │ 2024 05 06 18:30:00 │ LONG         │ -0.14% │ 10.30% │ 444.00     │ rsiDivergency5m │
// │ 103 │ SAGAUSDT     │ 2024 05 06 18:05:00 │ 2024 05 06 22:25:00 │ LONG         │ -0.51% │ 10.59% │ 3.18       │ rsiDivergency5m │
// │ 104 │ AMBUSDT      │ 2024 05 07 14:35:00 │ 2024 05 07 18:05:00 │ LONG         │ -0.51% │ 10.08% │ 0.01       │ rsiDivergency5m │
// │ 105 │ USTCUSDT     │ 2024 05 07 21:10:00 │ 2024 05 08 04:15:00 │ SHORT        │ 2.49%  │ 12.57% │ 0.02       │ rsiDivergency5m │
// │ 106 │ USTCUSDT     │ 2024 05 08 04:25:00 │ 2024 05 08 12:45:00 │ LONG         │ 0.93%  │ 13.49% │ 0.02       │ rsiDivergency5m │
// │ 107 │ API3USDT     │ 2024 05 08 13:25:00 │ 2024 05 08 14:45:00 │ SHORT        │ -0.51% │ 12.98% │ 2.62       │ rsiDivergency5m │
// │ 108 │ WLDUSDT      │ 2024 05 08 15:35:00 │ 2024 05 08 23:55:00 │ LONG         │ 0.99%  │ 13.97% │ 5.27       │ rsiDivergency5m │
// │ 109 │ ARKMUSDT     │ 2024 05 09 01:30:00 │ 2024 05 09 09:50:00 │ SHORT        │ 1.03%  │ 15.00% │ 2.55       │ rsiDivergency5m │
// │ 110 │ PORTALUSDT   │ 2024 05 09 10:40:00 │ 2024 05 09 19:00:00 │ SHORT        │ 0.95%  │ 15.94% │ 0.85       │ rsiDivergency5m │
// │ 111 │ GRTUSDT      │ 2024 05 09 20:50:00 │ 2024 05 09 21:15:00 │ SHORT        │ -0.51% │ 15.43% │ 0.31       │ rsiDivergency5m │
// │ 112 │ GRTUSDT      │ 2024 05 09 21:35:00 │ 2024 05 10 05:55:00 │ SHORT        │ 0.06%  │ 15.49% │ 0.31       │ rsiDivergency5m │
// │ 113 │ UMAUSDT      │ 2024 05 10 07:15:00 │ 2024 05 10 11:00:00 │ SHORT        │ 2.49%  │ 17.98% │ 3.91       │ rsiDivergency5m │
// │ 114 │ ACEUSDT      │ 2024 05 10 11:35:00 │ 2024 05 10 19:55:00 │ LONG         │ 1.44%  │ 19.42% │ 4.98       │ rsiDivergency5m │
// │ 115 │ ACEUSDT      │ 2024 05 10 20:20:00 │ 2024 05 11 04:40:00 │ SHORT        │ 0.94%  │ 20.36% │ 5.37       │ rsiDivergency5m │
// │ 116 │ PORTALUSDT   │ 2024 05 12 03:30:00 │ 2024 05 12 04:15:00 │ SHORT        │ -0.51% │ 19.85% │ 0.89       │ rsiDivergency5m │
// │ 117 │ PORTALUSDT   │ 2024 05 12 05:25:00 │ 2024 05 12 13:45:00 │ SHORT        │ 2.44%  │ 22.29% │ 0.92       │ rsiDivergency5m │
// │ 118 │ PORTALUSDT   │ 2024 05 12 21:15:00 │ 2024 05 12 21:30:00 │ LONG         │ -0.51% │ 21.78% │ 0.80       │ rsiDivergency5m │
// │ 119 │ ACEUSDT      │ 2024 05 12 21:55:00 │ 2024 05 12 22:10:00 │ LONG         │ -0.51% │ 21.26% │ 4.68       │ rsiDivergency5m │
// │ 120 │ ACEUSDT      │ 2024 05 12 22:15:00 │ 2024 05 13 06:35:00 │ LONG         │ 1.56%  │ 22.82% │ 4.62       │ rsiDivergency5m │
// │ 121 │ ARUSDT       │ 2024 05 13 09:15:00 │ 2024 05 13 17:35:00 │ SHORT        │ 1.06%  │ 23.89% │ 40.91      │ rsiDivergency5m │
// │ 122 │ UMAUSDT      │ 2024 05 13 17:55:00 │ 2024 05 13 19:05:00 │ SHORT        │ -0.51% │ 23.37% │ 4.03       │ rsiDivergency5m │
// │ 123 │ UMAUSDT      │ 2024 05 13 19:15:00 │ 2024 05 13 19:30:00 │ SHORT        │ -0.51% │ 22.86% │ 4.11       │ rsiDivergency5m │
// │ 124 │ SUPERUSDT    │ 2024 05 13 19:55:00 │ 2024 05 14 04:15:00 │ LONG         │ 0.17%  │ 23.03% │ 0.91       │ rsiDivergency5m │
// │ 125 │ UMAUSDT      │ 2024 05 14 08:55:00 │ 2024 05 14 17:15:00 │ LONG         │ -0.20% │ 22.83% │ 3.70       │ rsiDivergency5m │
// │ 126 │ WLDUSDT      │ 2024 05 14 19:30:00 │ 2024 05 14 20:15:00 │ SHORT        │ -0.51% │ 22.32% │ 4.87       │ rsiDivergency5m │
// │ 127 │ MYROUSDT     │ 2024 05 14 22:35:00 │ 2024 05 15 00:00:00 │ SHORT        │ -0.51% │ 21.80% │ 0.17       │ rsiDivergency5m │
// │ 128 │ LPTUSDT      │ 2024 05 15 05:20:00 │ 2024 05 15 07:30:00 │ SHORT        │ -0.51% │ 21.29% │ 18.24      │ rsiDivergency5m │
// │ 129 │ PHBUSDT      │ 2024 05 15 08:15:00 │ 2024 05 15 08:35:00 │ SHORT        │ -0.51% │ 20.78% │ 2.39       │ rsiDivergency5m │
// │ 130 │ PHBUSDT      │ 2024 05 15 08:40:00 │ 2024 05 15 08:45:00 │ SHORT        │ -0.51% │ 20.27% │ 2.44       │ rsiDivergency5m │
// │ 131 │ SEIUSDT      │ 2024 05 15 09:10:00 │ 2024 05 15 09:30:00 │ SHORT        │ -0.51% │ 19.75% │ 0.50       │ rsiDivergency5m │
// │ 132 │ LPTUSDT      │ 2024 05 15 09:20:00 │ 2024 05 15 09:40:00 │ SHORT        │ -0.51% │ 19.24% │ 20.37      │ rsiDivergency5m │
// │ 133 │ LPTUSDT      │ 2024 05 15 09:45:00 │ 2024 05 15 18:05:00 │ SHORT        │ 0.77%  │ 20.01% │ 20.64      │ rsiDivergency5m │
// │ 134 │ FTMUSDT      │ 2024 05 15 19:05:00 │ 2024 05 15 22:25:00 │ SHORT        │ -0.51% │ 19.49% │ 0.76       │ rsiDivergency5m │
// │ 135 │ ZETAUSDT     │ 2024 05 16 01:35:00 │ 2024 05 16 02:45:00 │ SHORT        │ -0.51% │ 18.98% │ 1.70       │ rsiDivergency5m │
// │ 136 │ RSRUSDT      │ 2024 05 16 02:40:00 │ 2024 05 16 11:00:00 │ SHORT        │ 1.26%  │ 20.24% │ 0.01       │ rsiDivergency5m │
// │ 137 │ BEAMXUSDT    │ 2024 05 17 01:20:00 │ 2024 05 17 05:10:00 │ LONG         │ -0.51% │ 20.72% │ 0.02       │ rsiDivergency5m │
// │ 138 │ RSRUSDT      │ 2024 05 17 04:55:00 │ 2024 05 17 12:15:00 │ SHORT        │ -0.51% │ 20.20% │ 0.01       │ rsiDivergency5m │
// │ 139 │ TRUUSDT      │ 2024 05 17 20:25:00 │ 2024 05 17 23:05:00 │ SHORT        │ -0.51% │ 19.69% │ 0.13       │ rsiDivergency5m │
// │ 140 │ ZRXUSDT      │ 2024 05 17 22:40:00 │ 2024 05 18 07:00:00 │ SHORT        │ 0.56%  │ 20.25% │ 0.61       │ rsiDivergency5m │
// │ 141 │ 1000PEPEUSDT │ 2024 05 18 09:45:00 │ 2024 05 18 18:05:00 │ LONG         │ 0.55%  │ 20.80% │ 0.01       │ rsiDivergency5m │
// │ 142 │ ACEUSDT      │ 2024 05 19 11:55:00 │ 2024 05 19 16:30:00 │ LONG         │ -0.51% │ 19.26% │ 4.56       │ rsiDivergency5m │
// │ 143 │ SAGAUSDT     │ 2024 05 19 20:35:00 │ 2024 05 20 04:55:00 │ LONG         │ 1.30%  │ 20.56% │ 1.96       │ rsiDivergency5m │
// │ 144 │ FTMUSDT      │ 2024 05 20 11:35:00 │ 2024 05 20 19:55:00 │ SHORT        │ 1.38%  │ 21.94% │ 0.96       │ rsiDivergency5m │
// │ 145 │ TAOUSDT      │ 2024 05 20 13:00:00 │ 2024 05 20 14:25:00 │ SHORT        │ -0.51% │ 20.29% │ 402.08     │ rsiDivergency5m │
// │ 146 │ 1000BONKUSDT │ 2024 05 20 22:30:00 │ 2024 05 21 05:45:00 │ SHORT        │ -0.51% │ 21.43% │ 0.03       │ rsiDivergency5m │
// │ 147 │ TAOUSDT      │ 2024 05 20 23:25:00 │ 2024 05 20 23:30:00 │ SHORT        │ -0.51% │ 19.77% │ 413.34     │ rsiDivergency5m │
// │ 148 │ STXUSDT      │ 2024 05 21 05:35:00 │ 2024 05 21 13:55:00 │ SHORT        │ 0.88%  │ 22.30% │ 2.27       │ rsiDivergency5m │
// │ 149 │ USTCUSDT     │ 2024 05 22 07:05:00 │ 2024 05 22 15:25:00 │ SHORT        │ 1.50%  │ 23.65% │ 0.02       │ rsiDivergency5m │
// │ 150 │ HOOKUSDT     │ 2024 05 22 19:25:00 │ 2024 05 22 22:25:00 │ SHORT        │ -0.51% │ 23.14% │ 0.96       │ rsiDivergency5m │
// │ 151 │ MANTAUSDT    │ 2024 05 22 23:20:00 │ 2024 05 23 07:40:00 │ SHORT        │ 0.29%  │ 23.43% │ 1.79       │ rsiDivergency5m │
// │ 152 │ YGGUSDT      │ 2024 05 23 08:00:00 │ 2024 05 23 08:45:00 │ LONG         │ -0.51% │ 22.92% │ 0.91       │ rsiDivergency5m │
// │ 153 │ ARKMUSDT     │ 2024 05 23 08:50:00 │ 2024 05 23 13:20:00 │ LONG         │ -0.51% │ 22.41% │ 2.36       │ rsiDivergency5m │
// │ 154 │ TAOUSDT      │ 2024 05 23 09:25:00 │ 2024 05 23 09:45:00 │ LONG         │ -0.51% │ 21.79% │ 450.05     │ rsiDivergency5m │
// │ 155 │ TAOUSDT      │ 2024 05 23 09:50:00 │ 2024 05 23 18:10:00 │ LONG         │ 0.37%  │ 22.15% │ 441.26     │ rsiDivergency5m │
// │ 156 │ WUSDT        │ 2024 05 23 15:05:00 │ 2024 05 23 23:25:00 │ LONG         │ 1.64%  │ 24.05% │ 0.53       │ rsiDivergency5m │
// │ 157 │ DEFIUSDT     │ 2024 05 23 23:40:00 │ 2024 05 24 08:00:00 │ SHORT        │ 0.15%  │ 24.20% │ 1019.60    │ rsiDivergency5m │
// │ 158 │ REZUSDT      │ 2024 05 24 03:30:00 │ 2024 05 24 11:50:00 │ LONG         │ 0.88%  │ 10.38% │ 0.12       │ rsiDivergency5m │
// │ 159 │ LDOUSDT      │ 2024 05 24 09:55:00 │ 2024 05 24 18:15:00 │ SHORT        │ 1.25%  │ 24.42% │ 2.48       │ rsiDivergency5m │
// │ 160 │ PENDLEUSDT   │ 2024 05 24 18:40:00 │ 2024 05 24 20:15:00 │ SHORT        │ -0.51% │ 23.91% │ 6.73       │ rsiDivergency5m │
// │ 161 │ CTSIUSDT     │ 2024 05 24 20:20:00 │ 2024 05 24 20:30:00 │ SHORT        │ -0.51% │ 23.39% │ 0.24       │ rsiDivergency5m │
// │ 162 │ DARUSDT      │ 2024 05 24 20:45:00 │ 2024 05 25 00:25:00 │ SHORT        │ -0.51% │ 22.88% │ 0.17       │ rsiDivergency5m │
// │ 163 │ MYROUSDT     │ 2024 05 25 06:35:00 │ 2024 05 25 14:55:00 │ SHORT        │ 0.07%  │ 22.95% │ 0.26       │ rsiDivergency5m │
// │ 164 │ MYROUSDT     │ 2024 05 25 20:15:00 │ 2024 05 25 21:00:00 │ SHORT        │ -0.51% │ 22.44% │ 0.27       │ rsiDivergency5m │
// │ 165 │ MYROUSDT     │ 2024 05 25 21:05:00 │ 2024 05 26 05:25:00 │ SHORT        │ 1.21%  │ 23.65% │ 0.28       │ rsiDivergency5m │
// │ 166 │ LDOUSDT      │ 2024 05 26 06:15:00 │ 2024 05 26 14:35:00 │ SHORT        │ 0.43%  │ 24.08% │ 2.69       │ rsiDivergency5m │
// │ 167 │ REZUSDT      │ 2024 05 26 10:45:00 │ 2024 05 26 11:45:00 │ SHORT        │ -0.51% │ 9.53%  │ 0.15       │ rsiDivergency5m │
// │ 168 │ VANRYUSDT    │ 2024 05 26 23:20:00 │ 2024 05 27 07:40:00 │ SHORT        │ 1.14%  │ 25.22% │ 0.21       │ rsiDivergency5m │
// │ 169 │ API3USDT     │ 2024 05 27 10:00:00 │ 2024 05 27 10:10:00 │ SHORT        │ -0.51% │ 24.71% │ 3.09       │ rsiDivergency5m │
// │ 170 │ API3USDT     │ 2024 05 27 10:20:00 │ 2024 05 27 11:05:00 │ SHORT        │ -0.51% │ 24.20% │ 3.15       │ rsiDivergency5m │
// │ 171 │ HIGHUSDT     │ 2024 05 27 16:15:00 │ 2024 05 27 16:40:00 │ SHORT        │ -0.51% │ 23.69% │ 6.07       │ rsiDivergency5m │
// │ 172 │ DARUSDT      │ 2024 05 27 17:50:00 │ 2024 05 27 19:05:00 │ SHORT        │ -0.51% │ 23.17% │ 0.19       │ rsiDivergency5m │
// │ 173 │ 1000BONKUSDT │ 2024 05 28 05:50:00 │ 2024 05 28 07:20:00 │ SHORT        │ -0.51% │ 22.66% │ 0.04       │ rsiDivergency5m │
// │ 174 │ DUSKUSDT     │ 2024 05 28 07:55:00 │ 2024 05 28 16:15:00 │ SHORT        │ 1.89%  │ 24.55% │ 0.43       │ rsiDivergency5m │
// │ 175 │ DUSKUSDT     │ 2024 05 28 23:50:00 │ 2024 05 29 00:55:00 │ SHORT        │ -0.51% │ 24.04% │ 0.41       │ rsiDivergency5m │
// │ 176 │ MYROUSDT     │ 2024 05 29 04:05:00 │ 2024 05 29 04:15:00 │ LONG         │ -0.51% │ 23.53% │ 0.30       │ rsiDivergency5m │
// │ 177 │ 1000PEPEUSDT │ 2024 05 29 04:15:00 │ 2024 05 29 07:35:00 │ LONG         │ -0.51% │ 23.02% │ 0.02       │ rsiDivergency5m │
// │ 178 │ AMBUSDT      │ 2024 05 29 22:35:00 │ 2024 05 30 02:50:00 │ SHORT        │ -0.51% │ 22.50% │ 0.01       │ rsiDivergency5m │
// │ 179 │ 1000PEPEUSDT │ 2024 05 30 02:55:00 │ 2024 05 30 09:05:00 │ LONG         │ 2.49%  │ 24.99% │ 0.01       │ rsiDivergency5m │
// │ 180 │ 1000BONKUSDT │ 2024 05 30 09:25:00 │ 2024 05 30 17:45:00 │ SHORT        │ 1.30%  │ 26.29% │ 0.04       │ rsiDivergency5m │
// │ 181 │ OMNIUSDT     │ 2024 05 31 07:35:00 │ 2024 05 31 07:50:00 │ SHORT        │ -0.51% │ 23.68% │ 20.62      │ rsiDivergency5m │
// │ 182 │ OMNIUSDT     │ 2024 05 31 08:00:00 │ 2024 05 31 08:10:00 │ SHORT        │ -0.51% │ 23.17% │ 21.18      │ rsiDivergency5m │
// │ 183 │ TLMUSDT      │ 2024 05 31 12:25:00 │ 2024 05 31 20:45:00 │ SHORT        │ 1.06%  │ 27.35% │ 0.02       │ rsiDivergency5m │
// │ 184 │ HIGHUSDT     │ 2024 06 01 02:30:00 │ 2024 06 01 03:15:00 │ LONG         │ -0.51% │ 26.84% │ 6.69       │ rsiDivergency5m │
// │ 185 │ PORTALUSDT   │ 2024 06 02 01:30:00 │ 2024 06 02 04:10:00 │ SHORT        │ -0.51% │ 26.32% │ 0.98       │ rsiDivergency5m │
// │ 186 │ VANRYUSDT    │ 2024 06 02 09:20:00 │ 2024 06 02 09:50:00 │ SHORT        │ -0.51% │ 25.81% │ 0.21       │ rsiDivergency5m │
// │ 187 │ VANRYUSDT    │ 2024 06 02 11:30:00 │ 2024 06 02 19:50:00 │ SHORT        │ 1.35%  │ 27.16% │ 0.23       │ rsiDivergency5m │
// │ 188 │ KLAYUSDT     │ 2024 06 02 20:05:00 │ 2024 06 02 20:40:00 │ SHORT        │ -0.51% │ 26.65% │ 0.24       │ rsiDivergency5m │
// │ 189 │ KLAYUSDT     │ 2024 06 02 20:50:00 │ 2024 06 02 21:25:00 │ SHORT        │ -0.51% │ 26.14% │ 0.25       │ rsiDivergency5m │
// │ 190 │ KLAYUSDT     │ 2024 06 02 21:40:00 │ 2024 06 03 02:55:00 │ SHORT        │ 2.49%  │ 28.62% │ 0.26       │ rsiDivergency5m │
// │ 191 │ MYROUSDT     │ 2024 06 03 17:10:00 │ 2024 06 04 01:30:00 │ LONG         │ 0.13%  │ 29.19% │ 0.24       │ rsiDivergency5m │
// │ 192 │ ALICEUSDT    │ 2024 06 04 08:00:00 │ 2024 06 04 16:20:00 │ LONG         │ 0.68%  │ 29.88% │ 2.12       │ rsiDivergency5m │
// │ 193 │ RIFUSDT      │ 2024 06 04 18:30:00 │ 2024 06 04 19:20:00 │ SHORT        │ -0.51% │ 29.36% │ 0.18       │ rsiDivergency5m │
// │ 194 │ CAKEUSDT     │ 2024 06 04 19:35:00 │ 2024 06 04 19:55:00 │ SHORT        │ -0.51% │ 28.85% │ 3.01       │ rsiDivergency5m │
// │ 195 │ IDUSDT       │ 2024 06 04 21:30:00 │ 2024 06 05 05:50:00 │ SHORT        │ 0.70%  │ 29.55% │ 0.77       │ rsiDivergency5m │
// │ 196 │ DENTUSDT     │ 2024 06 05 23:40:00 │ 2024 06 06 08:00:00 │ LONG         │ -0.13% │ 30.61% │ 0.00       │ rsiDivergency5m │
// │ 197 │ REZUSDT      │ 2024 06 06 09:45:00 │ 2024 06 06 18:05:00 │ SHORT        │ 0.98%  │ 21.23% │ 0.18       │ rsiDivergency5m │
// │ 198 │ WUSDT        │ 2024 06 06 16:15:00 │ 2024 06 06 20:20:00 │ SHORT        │ -0.51% │ 30.10% │ 0.69       │ rsiDivergency5m │
// │ 199 │ LQTYUSDT     │ 2024 06 06 20:35:00 │ 2024 06 07 04:55:00 │ LONG         │ 0.01%  │ 30.11% │ 1.24       │ rsiDivergency5m │
// │ 200 │ HIGHUSDT     │ 2024 06 07 08:45:00 │ 2024 06 07 09:00:00 │ SHORT        │ -0.51% │ 29.59% │ 8.30       │ rsiDivergency5m │
// │ 201 │ HIGHUSDT     │ 2024 06 07 09:05:00 │ 2024 06 07 13:30:00 │ SHORT        │ -0.51% │ 29.08% │ 8.40       │ rsiDivergency5m │
// │ 202 │ MAGICUSDT    │ 2024 06 07 14:05:00 │ 2024 06 07 22:25:00 │ LONG         │ 0.74%  │ 29.83% │ 0.80       │ rsiDivergency5m │
// │ 203 │ NKNUSDT      │ 2024 06 07 23:55:00 │ 2024 06 08 06:40:00 │ LONG         │ -0.51% │ 29.31% │ 0.11       │ rsiDivergency5m │
// │ 204 │ TRUUSDT      │ 2024 06 08 07:45:00 │ 2024 06 08 08:25:00 │ LONG         │ -0.51% │ 28.80% │ 0.20       │ rsiDivergency5m │
// │ 205 │ SUIUSDT      │ 2024 06 08 08:30:00 │ 2024 06 08 16:50:00 │ LONG         │ 0.89%  │ 29.69% │ 1.07       │ rsiDivergency5m │
// │ 206 │ SEIUSDT      │ 2024 06 08 21:25:00 │ 2024 06 09 05:45:00 │ LONG         │ 0.31%  │ 30.00% │ 0.48       │ rsiDivergency5m │
// │ 207 │ HIGHUSDT     │ 2024 06 09 11:40:00 │ 2024 06 09 20:00:00 │ SHORT        │ 1.90%  │ 31.91% │ 4.83       │ rsiDivergency5m │
// │ 208 │ HIFIUSDT     │ 2024 06 10 00:05:00 │ 2024 06 10 08:25:00 │ SHORT        │ 1.24%  │ 33.15% │ 0.75       │ rsiDivergency5m │
// │ 209 │ OMNIUSDT     │ 2024 06 10 02:40:00 │ 2024 06 10 11:00:00 │ LONG         │ 0.44%  │ 29.06% │ 15.39      │ rsiDivergency5m │
// │ 210 │ CRVUSDT      │ 2024 06 10 16:00:00 │ 2024 06 10 20:50:00 │ LONG         │ -0.51% │ 32.64% │ 0.38       │ rsiDivergency5m │
// │ 211 │ ARKMUSDT     │ 2024 06 10 21:25:00 │ 2024 06 11 05:45:00 │ LONG         │ 0.38%  │ 33.02% │ 2.07       │ rsiDivergency5m │
// │ 212 │ ZETAUSDT     │ 2024 06 11 20:00:00 │ 2024 06 11 20:25:00 │ LONG         │ -0.51% │ 33.54% │ 1.08       │ rsiDivergency5m │
// │ 213 │ ZETAUSDT     │ 2024 06 11 20:45:00 │ 2024 06 12 05:05:00 │ LONG         │ 0.96%  │ 34.50% │ 1.05       │ rsiDivergency5m │
// │ 214 │ OMNIUSDT     │ 2024 06 12 08:00:00 │ 2024 06 12 16:20:00 │ SHORT        │ 1.20%  │ 30.74% │ 16.80      │ rsiDivergency5m │
// │ 215 │ DUSKUSDT     │ 2024 06 12 14:55:00 │ 2024 06 12 18:05:00 │ LONG         │ -0.51% │ 35.52% │ 0.43       │ rsiDivergency5m │
// │ 216 │ DUSKUSDT     │ 2024 06 12 18:25:00 │ 2024 06 12 19:10:00 │ LONG         │ -0.51% │ 35.01% │ 0.42       │ rsiDivergency5m │
// │ 217 │ DUSKUSDT     │ 2024 06 12 21:15:00 │ 2024 06 12 22:00:00 │ LONG         │ -0.51% │ 34.50% │ 0.41       │ rsiDivergency5m │
// │ 218 │ DUSKUSDT     │ 2024 06 12 22:10:00 │ 2024 06 13 06:30:00 │ LONG         │ 0.30%  │ 34.79% │ 0.40       │ rsiDivergency5m │
// │ 219 │ POLYXUSDT    │ 2024 06 13 10:45:00 │ 2024 06 13 11:00:00 │ LONG         │ -0.51% │ 34.28% │ 0.46       │ rsiDivergency5m │
// │ 220 │ TRUUSDT      │ 2024 06 13 17:10:00 │ 2024 06 13 20:30:00 │ LONG         │ -0.51% │ 33.77% │ 0.20       │ rsiDivergency5m │
// │ 221 │ ARUSDT       │ 2024 06 13 21:40:00 │ 2024 06 13 23:20:00 │ SHORT        │ -0.51% │ 33.26% │ 30.52      │ rsiDivergency5m │
// │ 222 │ ARUSDT       │ 2024 06 13 23:30:00 │ 2024 06 13 23:50:00 │ SHORT        │ -0.51% │ 32.74% │ 31.08      │ rsiDivergency5m │
// │ 223 │ KNCUSDT      │ 2024 06 14 04:30:00 │ 2024 06 14 07:15:00 │ SHORT        │ -0.51% │ 32.23% │ 0.79       │ rsiDivergency5m │
// │ 224 │ ARUSDT       │ 2024 06 14 08:05:00 │ 2024 06 14 09:25:00 │ LONG         │ -0.51% │ 31.72% │ 30.01      │ rsiDivergency5m │
// │ 225 │ MYROUSDT     │ 2024 06 14 11:10:00 │ 2024 06 14 13:20:00 │ LONG         │ -0.51% │ 31.21% │ 0.18       │ rsiDivergency5m │
// │ 226 │ DODOXUSDT    │ 2024 06 14 13:10:00 │ 2024 06 14 21:30:00 │ LONG         │ 0.60%  │ 31.81% │ 0.16       │ rsiDivergency5m │
// │ 227 │ RIFUSDT      │ 2024 06 15 05:45:00 │ 2024 06 15 06:00:00 │ LONG         │ -0.51% │ 31.30% │ 0.12       │ rsiDivergency5m │
// │ 228 │ RIFUSDT      │ 2024 06 15 06:05:00 │ 2024 06 15 06:10:00 │ LONG         │ -0.51% │ 30.78% │ 0.11       │ rsiDivergency5m │
// │ 229 │ RIFUSDT      │ 2024 06 15 06:20:00 │ 2024 06 15 14:10:00 │ LONG         │ -0.51% │ 30.27% │ 0.11       │ rsiDivergency5m │
// │ 230 │ RIFUSDT      │ 2024 06 15 15:20:00 │ 2024 06 15 23:40:00 │ LONG         │ 0.68%  │ 30.95% │ 0.11       │ rsiDivergency5m │
// │ 231 │ LDOUSDT      │ 2024 06 16 10:10:00 │ 2024 06 16 10:55:00 │ SHORT        │ -0.51% │ 30.44% │ 2.17       │ rsiDivergency5m │
// │ 232 │ LDOUSDT      │ 2024 06 16 11:00:00 │ 2024 06 16 19:20:00 │ SHORT        │ 1.01%  │ 31.45% │ 2.24       │ rsiDivergency5m │
// │ 233 │ POLYXUSDT    │ 2024 06 16 21:05:00 │ 2024 06 17 02:10:00 │ LONG         │ -0.51% │ 30.93% │ 0.38       │ rsiDivergency5m │
// │ 234 │ HIFIUSDT     │ 2024 06 17 02:15:00 │ 2024 06 17 04:40:00 │ LONG         │ -0.51% │ 30.42% │ 0.54       │ rsiDivergency5m │
// │ 235 │ POLYXUSDT    │ 2024 06 17 04:50:00 │ 2024 06 17 10:30:00 │ LONG         │ -0.51% │ 29.91% │ 0.36       │ rsiDivergency5m │
// │ 236 │ KNCUSDT      │ 2024 06 17 10:55:00 │ 2024 06 17 11:15:00 │ LONG         │ -0.51% │ 29.40% │ 0.62       │ rsiDivergency5m │
// │ 237 │ JUPUSDT      │ 2024 06 17 13:35:00 │ 2024 06 17 20:35:00 │ SHORT        │ 2.49%  │ 31.88% │ 0.89       │ rsiDivergency5m │
// │ 238 │ MAVUSDT      │ 2024 06 17 20:25:00 │ 2024 06 17 20:40:00 │ LONG         │ -0.51% │ 31.37% │ 0.32       │ rsiDivergency5m │
// │ 239 │ BLURUSDT     │ 2024 06 17 20:45:00 │ 2024 06 18 05:05:00 │ LONG         │ 0.45%  │ 31.82% │ 0.25       │ rsiDivergency5m │
// │ 240 │ MTLUSDT      │ 2024 06 18 05:50:00 │ 2024 06 18 14:10:00 │ SHORT        │ 1.42%  │ 33.24% │ 1.05       │ rsiDivergency5m │
// │ 241 │ CRVUSDT      │ 2024 06 18 15:50:00 │ 2024 06 18 16:30:00 │ SHORT        │ -0.51% │ 32.73% │ 0.32       │ rsiDivergency5m │
// │ 242 │ ORBSUSDT     │ 2024 06 18 17:40:00 │ 2024 06 18 19:35:00 │ SHORT        │ -0.51% │ 32.22% │ 0.02       │ rsiDivergency5m │
// │ 243 │ ORBSUSDT     │ 2024 06 18 20:05:00 │ 2024 06 18 20:10:00 │ SHORT        │ -0.51% │ 31.71% │ 0.02       │ rsiDivergency5m │
// │ 244 │ ORBSUSDT     │ 2024 06 18 20:15:00 │ 2024 06 19 01:20:00 │ SHORT        │ -0.51% │ 31.19% │ 0.02       │ rsiDivergency5m │
// │ 245 │ MKRUSDT      │ 2024 06 19 01:40:00 │ 2024 06 19 10:00:00 │ SHORT        │ 0.94%  │ 32.13% │ 2490.30    │ rsiDivergency5m │
// │ 246 │ OMNIUSDT     │ 2024 06 19 04:40:00 │ 2024 06 19 13:00:00 │ LONG         │ 1.53%  │ 36.03% │ 13.66      │ rsiDivergency5m │
// │ 247 │ LDOUSDT      │ 2024 06 19 10:40:00 │ 2024 06 19 19:00:00 │ LONG         │ 0.84%  │ 32.97% │ 2.25       │ rsiDivergency5m │
// │ 248 │ NMRUSDT      │ 2024 06 20 00:35:00 │ 2024 06 20 08:55:00 │ SHORT        │ 0.52%  │ 33.50% │ 20.06      │ rsiDivergency5m │
// │ 249 │ WUSDT        │ 2024 06 20 11:10:00 │ 2024 06 20 19:30:00 │ LONG         │ 0.30%  │ 33.80% │ 0.34       │ rsiDivergency5m │
// │ 250 │ 1INCHUSDT    │ 2024 06 20 19:55:00 │ 2024 06 21 02:45:00 │ LONG         │ -0.51% │ 33.28% │ 0.42       │ rsiDivergency5m │
// │ 251 │ MYROUSDT     │ 2024 06 21 04:00:00 │ 2024 06 21 12:20:00 │ LONG         │ 0.46%  │ 33.75% │ 0.14       │ rsiDivergency5m │
// │ 252 │ GASUSDT      │ 2024 06 22 03:25:00 │ 2024 06 22 11:45:00 │ LONG         │ 0.01%  │ 33.76% │ 3.67       │ rsiDivergency5m │
// │ 253 │ SAGAUSDT     │ 2024 06 22 12:05:00 │ 2024 06 22 20:25:00 │ SHORT        │ -0.14% │ 33.63% │ 1.48       │ rsiDivergency5m │
// │ 254 │ MTLUSDT      │ 2024 06 23 01:00:00 │ 2024 06 23 01:10:00 │ SHORT        │ -0.51% │ 33.11% │ 1.25       │ rsiDivergency5m │
// │ 255 │ MTLUSDT      │ 2024 06 23 09:50:00 │ 2024 06 23 11:00:00 │ LONG         │ -0.51% │ 32.60% │ 1.22       │ rsiDivergency5m │
// │ 256 │ VANRYUSDT    │ 2024 06 23 11:55:00 │ 2024 06 23 15:30:00 │ LONG         │ -0.51% │ 32.09% │ 0.14       │ rsiDivergency5m │
// │ 257 │ TRUUSDT      │ 2024 06 23 17:10:00 │ 2024 06 23 18:15:00 │ LONG         │ -0.51% │ 31.58% │ 0.13       │ rsiDivergency5m │
// │ 258 │ TRUUSDT      │ 2024 06 23 18:20:00 │ 2024 06 24 00:05:00 │ LONG         │ -0.51% │ 31.06% │ 0.13       │ rsiDivergency5m │
// │ 259 │ ZETAUSDT     │ 2024 06 24 00:45:00 │ 2024 06 24 04:30:00 │ LONG         │ -0.51% │ 30.55% │ 0.78       │ rsiDivergency5m │
// │ 260 │ ETHWUSDT     │ 2024 06 24 04:35:00 │ 2024 06 24 12:55:00 │ LONG         │ 0.68%  │ 31.23% │ 2.25       │ rsiDivergency5m │
// │ 261 │ LDOUSDT      │ 2024 06 24 15:55:00 │ 2024 06 24 16:15:00 │ SHORT        │ -0.51% │ 30.72% │ 2.40       │ rsiDivergency5m │
// │ 262 │ LDOUSDT      │ 2024 06 24 16:20:00 │ 2024 06 25 00:40:00 │ SHORT        │ 0.07%  │ 30.78% │ 2.42       │ rsiDivergency5m │
// │ 263 │ STXUSDT      │ 2024 06 25 07:00:00 │ 2024 06 25 09:20:00 │ SHORT        │ -0.51% │ 30.27% │ 1.71       │ rsiDivergency5m │
// │ 264 │ 1000PEPEUSDT │ 2024 06 25 10:00:00 │ 2024 06 25 13:20:00 │ SHORT        │ -0.51% │ 29.76% │ 0.01       │ rsiDivergency5m │
// │ 265 │ STXUSDT      │ 2024 06 25 17:05:00 │ 2024 06 26 01:25:00 │ SHORT        │ 0.82%  │ 30.58% │ 1.79       │ rsiDivergency5m │
// │ 266 │ BLURUSDT     │ 2024 06 26 12:20:00 │ 2024 06 26 19:00:00 │ LONG         │ -0.51% │ 30.07% │ 0.21       │ rsiDivergency5m │
// │ 267 │ 1000BONKUSDT │ 2024 06 27 08:45:00 │ 2024 06 27 09:05:00 │ SHORT        │ -0.51% │ 29.56% │ 0.02       │ rsiDivergency5m │
// │ 268 │ JUPUSDT      │ 2024 06 27 09:15:00 │ 2024 06 27 09:25:00 │ SHORT        │ -0.51% │ 29.05% │ 0.87       │ rsiDivergency5m │
// │ 269 │ JUPUSDT      │ 2024 06 27 09:30:00 │ 2024 06 27 17:50:00 │ SHORT        │ 0.51%  │ 29.56% │ 0.88       │ rsiDivergency5m │
// │ 270 │ GASUSDT      │ 2024 06 28 17:25:00 │ 2024 06 29 01:45:00 │ LONG         │ 0.32%  │ 29.87% │ 3.71       │ rsiDivergency5m │
// │ 271 │ ARPAUSDT     │ 2024 06 29 19:15:00 │ 2024 06 29 20:00:00 │ LONG         │ -0.51% │ 29.36% │ 0.04       │ rsiDivergency5m │
// │ 272 │ ARPAUSDT     │ 2024 06 29 20:05:00 │ 2024 06 30 03:05:00 │ LONG         │ 2.49%  │ 31.85% │ 0.04       │ rsiDivergency5m │
// │ 273 │ JOEUSDT      │ 2024 06 30 17:35:00 │ 2024 07 01 01:55:00 │ SHORT        │ 0.24%  │ 32.09% │ 0.36       │ rsiDivergency5m │
// │ 274 │ PORTALUSDT   │ 2024 07 01 10:25:00 │ 2024 07 01 18:45:00 │ LONG         │ 0.20%  │ 32.29% │ 0.44       │ rsiDivergency5m │
// │ 275 │ REZUSDT      │ 2024 07 02 05:25:00 │ 2024 07 02 06:50:00 │ LONG         │ -0.51% │ 32.50% │ 0.08       │ rsiDivergency5m │
// │ 276 │ REZUSDT      │ 2024 07 02 06:55:00 │ 2024 07 02 15:15:00 │ LONG         │ 1.55%  │ 34.05% │ 0.08       │ rsiDivergency5m │
// │ 277 │ PENDLEUSDT   │ 2024 07 02 18:00:00 │ 2024 07 02 19:25:00 │ LONG         │ -0.51% │ 31.78% │ 4.12       │ rsiDivergency5m │
// │ 278 │ WLDUSDT      │ 2024 07 02 21:05:00 │ 2024 07 02 22:10:00 │ LONG         │ -0.51% │ 31.27% │ 2.21       │ rsiDivergency5m │
// │ 279 │ WLDUSDT      │ 2024 07 02 22:15:00 │ 2024 07 03 05:40:00 │ LONG         │ 2.49%  │ 33.75% │ 2.17       │ rsiDivergency5m │
// │ 280 │ 1000BONKUSDT │ 2024 07 03 07:40:00 │ 2024 07 03 10:55:00 │ LONG         │ -0.51% │ 33.24% │ 0.02       │ rsiDivergency5m │
// │ 281 │ WUSDT        │ 2024 07 03 11:15:00 │ 2024 07 03 14:20:00 │ LONG         │ -0.51% │ 32.73% │ 0.34       │ rsiDivergency5m │
// │ 282 │ 1000BONKUSDT │ 2024 07 03 14:25:00 │ 2024 07 03 22:45:00 │ LONG         │ 0.74%  │ 33.47% │ 0.02       │ rsiDivergency5m │
// │ 283 │ RSRUSDT      │ 2024 07 03 22:20:00 │ 2024 07 04 03:40:00 │ LONG         │ -0.51% │ 32.95% │ 0.00       │ rsiDivergency5m │
// │ 284 │ ETHWUSDT     │ 2024 07 04 05:20:00 │ 2024 07 04 08:00:00 │ LONG         │ -0.51% │ 32.44% │ 2.23       │ rsiDivergency5m │
// │ 285 │ OPUSDT       │ 2024 07 04 08:05:00 │ 2024 07 04 16:25:00 │ LONG         │ 0.33%  │ 32.77% │ 1.51       │ rsiDivergency5m │
// │ 286 │ TONUSDT      │ 2024 07 04 17:05:00 │ 2024 07 04 21:55:00 │ SHORT        │ 2.49%  │ 35.26% │ 7.34       │ rsiDivergency5m │
// │ 287 │ ARBUSDT      │ 2024 07 04 21:40:00 │ 2024 07 04 21:55:00 │ LONG         │ -0.51% │ 34.75% │ 0.62       │ rsiDivergency5m │
// │ 288 │ UMAUSDT      │ 2024 07 04 22:00:00 │ 2024 07 04 22:05:00 │ LONG         │ -0.51% │ 34.23% │ 1.76       │ rsiDivergency5m │
// │ 289 │ KEYUSDT      │ 2024 07 04 22:10:00 │ 2024 07 05 06:30:00 │ LONG         │ 2.41%  │ 36.65% │ 0.00       │ rsiDivergency5m │
// │ 290 │ USTCUSDT     │ 2024 07 05 06:45:00 │ 2024 07 05 15:05:00 │ SHORT        │ 0.02%  │ 36.67% │ 0.01       │ rsiDivergency5m │
// │ 291 │ KAVAUSDT     │ 2024 07 05 14:30:00 │ 2024 07 05 19:35:00 │ SHORT        │ -0.51% │ 36.16% │ 0.36       │ rsiDivergency5m │
// │ 292 │ 1000XECUSDT  │ 2024 07 05 22:55:00 │ 2024 07 06 07:15:00 │ SHORT        │ 0.13%  │ 36.29% │ 0.03       │ rsiDivergency5m │
// │ 293 │ 1000PEPEUSDT │ 2024 07 06 12:35:00 │ 2024 07 06 20:55:00 │ SHORT        │ 0.38%  │ 36.15% │ 0.01       │ rsiDivergency5m │
// │ 294 │ MANTAUSDT    │ 2024 07 06 23:35:00 │ 2024 07 07 07:55:00 │ LONG         │ 0.51%  │ 36.66% │ 0.81       │ rsiDivergency5m │
// │ 295 │ 1000PEPEUSDT │ 2024 07 07 08:40:00 │ 2024 07 07 09:20:00 │ LONG         │ -0.51% │ 36.15% │ 0.01       │ rsiDivergency5m │
// │ 296 │ USTCUSDT     │ 2024 07 07 11:40:00 │ 2024 07 07 19:35:00 │ SHORT        │ 2.49%  │ 38.63% │ 0.02       │ rsiDivergency5m │
// │ 297 │ SAGAUSDT     │ 2024 07 07 19:50:00 │ 2024 07 08 00:00:00 │ LONG         │ 2.49%  │ 41.12% │ 1.15       │ rsiDivergency5m │
// │ 298 │ POLYXUSDT    │ 2024 07 08 00:45:00 │ 2024 07 08 01:10:00 │ SHORT        │ -0.51% │ 40.61% │ 0.23       │ rsiDivergency5m │
// │ 299 │ POLYXUSDT    │ 2024 07 08 01:25:00 │ 2024 07 08 01:45:00 │ SHORT        │ -0.51% │ 40.10% │ 0.24       │ rsiDivergency5m │
// │ 300 │ VANRYUSDT    │ 2024 07 08 02:05:00 │ 2024 07 08 10:25:00 │ LONG         │ 0.91%  │ 41.01% │ 0.10       │ rsiDivergency5m │
// │ 301 │ TAOUSDT      │ 2024 07 08 05:00:00 │ 2024 07 08 06:15:00 │ SHORT        │ -0.51% │ 35.77% │ 230.97     │ rsiDivergency5m │
// │ 302 │ CFXUSDT      │ 2024 07 08 11:30:00 │ 2024 07 08 19:50:00 │ LONG         │ 0.44%  │ 41.45% │ 0.13       │ rsiDivergency5m │
// │ 303 │ FTMUSDT      │ 2024 07 10 03:50:00 │ 2024 07 10 06:25:00 │ LONG         │ -0.51% │ 40.94% │ 0.47       │ rsiDivergency5m │
// │ 304 │ WLDUSDT      │ 2024 07 10 09:55:00 │ 2024 07 10 10:40:00 │ SHORT        │ -0.51% │ 40.43% │ 2.01       │ rsiDivergency5m │
// └─────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴────────┴────────────┴─────────────────┘
