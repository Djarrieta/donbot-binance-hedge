import { EMA } from "technicalindicators";
import type { Strategy, StrategyResponse } from "./Strategy";
import { params } from "../Params";
import { getVolatility } from "../utils/getVolatility";
import { getSuperTrend } from "./getSuperTrend";

const STG_NAME = "superTrend";
const ALLOWED_PAIRS: string[] = [
	"XRPUSDT",
	"EOSUSDT",
	"DASHUSDT",
	"ONTUSDT",
	"IOTAUSDT",
	"NEOUSDT",
	"QTUMUSDT",
	"IOSTUSDT",
	"ZRXUSDT",
	"MKRUSDT",
	"RUNEUSDT",
	"SUSHIUSDT",
	"STORJUSDT",
	"FLMUSDT",
	"RENUSDT",
	"BELUSDT",
	"AXSUSDT",
	"ZENUSDT",
	"SKLUSDT",
	"1INCHUSDT",
	"LITUSDT",
	"XEMUSDT",
	"ALICEUSDT",
	"HBARUSDT",
	"ONEUSDT",
	"HOTUSDT",
	"NKNUSDT",
	"1000SHIBUSDT",
	"IOTXUSDT",
	"C98USDT",
	"CELOUSDT",
	"ARPAUSDT",
	"CTSIUSDT",
	"PEOPLEUSDT",
	"DUSKUSDT",
	"OPUSDT",
	"STGUSDT",
	"SPELLUSDT",
	"LUNA2USDT",
	"LDOUSDT",
	"FETUSDT",
	"MAGICUSDT",
	"TUSDT",
	"RNDRUSDT",
	"HIGHUSDT",
	"MINAUSDT",
	"SSVUSDT",
	"CKBUSDT",
	"IDUSDT",
	"TLMUSDT",
	"AMBUSDT",
	"SUIUSDT",
	"1000PEPEUSDT",
	"UMAUSDT",
	"COMBOUSDT",
	"MAVUSDT",
	"WLDUSDT",
	"OXTUSDT",
	"CYBERUSDT",
	"ARKUSDT",
	"FRONTUSDT",
	"LOOMUSDT",
	"BONDUSDT",
	"WAXPUSDT",
	"BSVUSDT",
	"RIFUSDT",
	"GASUSDT",
	"POWRUSDT",
	"TOKENUSDT",
	"STEEMUSDT",
	"KASUSDT",
	"1000BONKUSDT",
	"PYTHUSDT",
	"SUPERUSDT",
	"USTCUSDT",
	"ONGUSDT",
	"ETHWUSDT",
	"MOVRUSDT",
	"AIUSDT",
	"XAIUSDT",
	"WIFUSDT",
	"LSKUSDT",
	"DYMUSDT",
	"MYROUSDT",
	"AEVOUSDT",
	"VANRYUSDT",
	"ETHFIUSDT",
	"SAGAUSDT",
	"TAOUSDT",
	"REZUSDT",
	"NOTUSDT",
	"TURBOUSDT",
	"IOUSDT",
	"ZKUSDT",
	"MEWUSDT",
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

		const MIN_VOL = 10 / 100;
		const volatility = getVolatility({ candlestick });

		const ema200Array = EMA.calculate({
			period: 200,
			values: candlestick.map((candle) => candle.close),
		});

		const stA1 = getSuperTrend({
			candlestick,
			multiplier: 3,
			period: 12,
		});
		const stA2 = getSuperTrend({
			candlestick,
			multiplier: 2,
			period: 11,
		});
		const stA3 = getSuperTrend({
			candlestick,
			multiplier: 1,
			period: 10,
		});

		const lastPrice = candlestick[candlestick.length - 1].close;

		if (
			volatility > MIN_VOL &&
			lastPrice > ema200Array[ema200Array.length - 1] &&
			lastPrice > stA3[stA3.length - 2] &&
			stA3[stA3.length - 2] > stA2[stA2.length - 2] &&
			stA2[stA2.length - 2] > stA1[stA1.length - 2] &&
			stA1[stA1.length - 3] > stA2[stA2.length - 3] &&
			stA2[stA2.length - 3] > stA3[stA3.length - 3] &&
			stA1[stA1.length - 4] > stA2[stA2.length - 4] &&
			stA2[stA2.length - 4] > stA3[stA3.length - 4] &&
			stA1[stA1.length - 6] > stA2[stA2.length - 6] &&
			stA2[stA2.length - 6] > stA3[stA3.length - 6] &&
			stA1[stA1.length - 8] > stA2[stA2.length - 8] &&
			stA2[stA2.length - 8] > stA3[stA3.length - 8] &&
			stA1[stA1.length - 10] > stA2[stA2.length - 10] &&
			stA2[stA2.length - 10] > stA3[stA3.length - 10]
		) {
			response.positionSide = "LONG";
		}
		if (
			volatility > MIN_VOL &&
			lastPrice < ema200Array[ema200Array.length - 1] &&
			lastPrice < stA3[stA3.length - 2] &&
			stA3[stA3.length - 2] < stA2[stA2.length - 2] &&
			stA2[stA2.length - 2] < stA1[stA1.length - 2] &&
			stA1[stA1.length - 3] < stA2[stA2.length - 3] &&
			stA2[stA2.length - 3] < stA3[stA3.length - 3] &&
			stA1[stA1.length - 4] < stA2[stA2.length - 4] &&
			stA2[stA2.length - 4] < stA3[stA3.length - 4] &&
			stA1[stA1.length - 6] < stA2[stA2.length - 6] &&
			stA2[stA2.length - 6] < stA3[stA3.length - 6] &&
			stA1[stA1.length - 8] < stA2[stA2.length - 8] &&
			stA2[stA2.length - 8] < stA3[stA3.length - 8] &&
			stA1[stA1.length - 10] < stA2[stA2.length - 10] &&
			stA2[stA2.length - 10] < stA3[stA3.length - 10]
		) {
			response.positionSide = "SHORT";
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
// │ 0 │ 2.00% │ 10.00% │ 100            │ 1234      │ 0.19% │ 37.03%  │
// └───┴───────┴────────┴────────────────┴───────────┴───────┴─────────┘
// Accumulated data saved for 1 pairs.
// ┌───┬───────┬────────┬────────────────┬───────────┬───────────┬───────────┬─────────┬──────────┬────────────────────┬──────────────────┬─────────┬───────────────┐
// │   │ sl    │ tp     │ maxTradeLength │ tradesQty │ maxAccPnl │ minAccPnl │ accPnl  │ drawdown │ drawdownMonteCarlo │ badRunMonteCarlo │ winRate │ avTradeLength │
// ├───┼───────┼────────┼────────────────┼───────────┼───────────┼───────────┼─────────┼──────────┼────────────────────┼──────────────────┼─────────┼───────────────┤
// │ 0 │ 2.00% │ 10.00% │ 100            │ 554       │ 156.13%   │ -0.51%    │ 155.15% │ 10.15%   │ 10.94%             │ 12               │ 39.71%  │ 50.19         │
// └───┴───────┴────────┴────────────────┴───────────┴───────────┴───────────┴─────────┴──────────┴────────────────────┴──────────────────┴─────────┴───────────────┘
// ┌─────┬──────────────┬─────────────────────┬─────────────────────┬──────────────┬────────┬─────────┬────────────┬────────────┐
// │     │ pair         │ startTime           │ endTime             │ positionSide │ pnl    │ accPnl  │ entryPrice │ stgName    │
// ├─────┼──────────────┼─────────────────────┼─────────────────────┼──────────────┼────────┼─────────┼────────────┼────────────┤
// │   0 │ ZRXUSDT      │ 2023 10 17 10:30:00 │ 2023 10 17 12:10:00 │ LONG         │ -0.51% │ -0.51%  │ 0.26       │ superTrend │
// │   1 │ LUNA2USDT    │ 2023 10 17 12:35:00 │ 2023 10 17 20:55:00 │ SHORT        │ 0.05%  │ -0.46%  │ 0.41       │ superTrend │
// │   2 │ LOOMUSDT     │ 2023 10 18 20:10:00 │ 2023 10 18 20:40:00 │ SHORT        │ 2.49%  │ 2.03%   │ 0.14       │ superTrend │
// │   3 │ TUSDT        │ 2023 10 19 04:35:00 │ 2023 10 19 12:55:00 │ SHORT        │ 0.38%  │ 2.41%   │ 0.02       │ superTrend │
// │   4 │ LOOMUSDT     │ 2023 10 19 20:15:00 │ 2023 10 20 00:05:00 │ LONG         │ 2.49%  │ 4.90%   │ 0.11       │ superTrend │
// │   5 │ BSVUSDT      │ 2023 10 22 20:30:00 │ 2023 10 22 22:10:00 │ LONG         │ -0.51% │ 4.39%   │ 52.77      │ superTrend │
// │   6 │ RIFUSDT      │ 2023 10 23 07:05:00 │ 2023 10 23 07:25:00 │ SHORT        │ -0.51% │ 3.88%   │ 0.11       │ superTrend │
// │   7 │ BONDUSDT     │ 2023 10 23 07:35:00 │ 2023 10 23 15:55:00 │ SHORT        │ 0.33%  │ 4.21%   │ 3.83       │ superTrend │
// │   8 │ DUSKUSDT     │ 2023 10 23 23:30:00 │ 2023 10 24 00:55:00 │ LONG         │ -0.51% │ 3.70%   │ 0.12       │ superTrend │
// │   9 │ MAVUSDT      │ 2023 10 24 03:15:00 │ 2023 10 24 10:25:00 │ LONG         │ -0.51% │ 3.18%   │ 0.24       │ superTrend │
// │  10 │ CYBERUSDT    │ 2023 10 24 16:55:00 │ 2023 10 25 00:45:00 │ LONG         │ 2.49%  │ 5.67%   │ 4.73       │ superTrend │
// │  11 │ AMBUSDT      │ 2023 10 25 02:15:00 │ 2023 10 25 06:50:00 │ SHORT        │ -0.51% │ 5.16%   │ 0.01       │ superTrend │
// │  12 │ PEOPLEUSDT   │ 2023 10 26 01:00:00 │ 2023 10 26 02:20:00 │ SHORT        │ -0.51% │ 4.65%   │ 0.01       │ superTrend │
// │  13 │ PEOPLEUSDT   │ 2023 10 26 02:25:00 │ 2023 10 26 05:40:00 │ LONG         │ -0.51% │ 4.13%   │ 0.01       │ superTrend │
// │  14 │ WAXPUSDT     │ 2023 10 26 13:05:00 │ 2023 10 26 16:10:00 │ LONG         │ 2.49%  │ 6.62%   │ 0.05       │ superTrend │
// │  15 │ STORJUSDT    │ 2023 10 26 18:35:00 │ 2023 10 27 02:55:00 │ SHORT        │ 0.50%  │ 7.13%   │ 0.40       │ superTrend │
// │  16 │ GASUSDT      │ 2023 10 28 18:25:00 │ 2023 10 28 18:30:00 │ LONG         │ -0.51% │ 6.61%   │ 5.19       │ superTrend │
// │  17 │ LOOMUSDT     │ 2023 10 28 19:55:00 │ 2023 10 28 20:00:00 │ SHORT        │ -0.51% │ 6.10%   │ 0.13       │ superTrend │
// │  18 │ ARKUSDT      │ 2023 10 29 02:15:00 │ 2023 10 29 02:20:00 │ LONG         │ 2.49%  │ 8.59%   │ 0.62       │ superTrend │
// │  19 │ ARKUSDT      │ 2023 10 29 05:25:00 │ 2023 10 29 08:50:00 │ LONG         │ 2.49%  │ 11.08%  │ 0.64       │ superTrend │
// │  20 │ XEMUSDT      │ 2023 10 30 03:25:00 │ 2023 10 30 11:45:00 │ LONG         │ 0.15%  │ 11.23%  │ 0.03       │ superTrend │
// │  21 │ MAVUSDT      │ 2023 10 31 21:00:00 │ 2023 11 01 05:20:00 │ SHORT        │ 0.95%  │ 12.18%  │ 0.23       │ superTrend │
// │  22 │ AMBUSDT      │ 2023 11 01 18:55:00 │ 2023 11 02 00:20:00 │ LONG         │ -0.51% │ 11.67%  │ 0.01       │ superTrend │
// │  23 │ FETUSDT      │ 2023 11 02 05:35:00 │ 2023 11 02 13:55:00 │ SHORT        │ 1.01%  │ 12.68%  │ 0.36       │ superTrend │
// │  24 │ RNDRUSDT     │ 2023 11 02 15:20:00 │ 2023 11 02 23:40:00 │ SHORT        │ 1.43%  │ 14.11%  │ 2.30       │ superTrend │
// │  25 │ SUSHIUSDT    │ 2023 11 03 01:15:00 │ 2023 11 03 01:20:00 │ SHORT        │ -0.51% │ 13.60%  │ 1.03       │ superTrend │
// │  26 │ GASUSDT      │ 2023 11 03 14:05:00 │ 2023 11 03 14:10:00 │ LONG         │ -0.51% │ 13.09%  │ 8.59       │ superTrend │
// │  27 │ NEOUSDT      │ 2023 11 03 19:05:00 │ 2023 11 04 02:35:00 │ LONG         │ 2.49%  │ 15.58%  │ 10.19      │ superTrend │
// │  28 │ RENUSDT      │ 2023 11 04 02:50:00 │ 2023 11 04 03:20:00 │ SHORT        │ 2.49%  │ 18.06%  │ 0.07       │ superTrend │
// │  29 │ AMBUSDT      │ 2023 11 04 11:05:00 │ 2023 11 04 19:25:00 │ LONG         │ -0.01% │ 18.06%  │ 0.01       │ superTrend │
// │  30 │ CTSIUSDT     │ 2023 11 05 05:55:00 │ 2023 11 05 07:40:00 │ LONG         │ -0.51% │ 17.54%  │ 0.17       │ superTrend │
// │  31 │ FLMUSDT      │ 2023 11 05 19:05:00 │ 2023 11 05 19:20:00 │ SHORT        │ -0.51% │ 17.03%  │ 0.09       │ superTrend │
// │  32 │ SUSHIUSDT    │ 2023 11 05 20:50:00 │ 2023 11 06 05:10:00 │ SHORT        │ -0.13% │ 16.91%  │ 1.00       │ superTrend │
// │  33 │ ZENUSDT      │ 2023 11 06 06:10:00 │ 2023 11 06 08:40:00 │ LONG         │ -0.51% │ 16.39%  │ 10.22      │ superTrend │
// │  34 │ CELOUSDT     │ 2023 11 06 11:15:00 │ 2023 11 06 17:50:00 │ SHORT        │ -0.51% │ 15.88%  │ 0.55       │ superTrend │
// │  35 │ STGUSDT      │ 2023 11 07 03:10:00 │ 2023 11 07 04:35:00 │ LONG         │ -0.51% │ 15.37%  │ 0.59       │ superTrend │
// │  36 │ GASUSDT      │ 2023 11 07 05:15:00 │ 2023 11 07 07:20:00 │ LONG         │ -0.51% │ 14.86%  │ 12.02      │ superTrend │
// │  37 │ RIFUSDT      │ 2023 11 07 10:25:00 │ 2023 11 07 10:35:00 │ LONG         │ -0.51% │ 14.34%  │ 0.13       │ superTrend │
// │  38 │ RUNEUSDT     │ 2023 11 08 02:55:00 │ 2023 11 08 11:15:00 │ SHORT        │ 0.00%  │ 14.35%  │ 3.32       │ superTrend │
// │  39 │ SKLUSDT      │ 2023 11 08 11:50:00 │ 2023 11 08 19:10:00 │ LONG         │ -0.51% │ 13.83%  │ 0.03       │ superTrend │
// │  40 │ STORJUSDT    │ 2023 11 08 19:50:00 │ 2023 11 08 20:00:00 │ LONG         │ -0.51% │ 13.32%  │ 0.70       │ superTrend │
// │  41 │ STORJUSDT    │ 2023 11 09 05:45:00 │ 2023 11 09 06:45:00 │ LONG         │ 2.49%  │ 15.81%  │ 0.72       │ superTrend │
// │  42 │ MINAUSDT     │ 2023 11 09 10:30:00 │ 2023 11 09 11:10:00 │ SHORT        │ 2.49%  │ 18.30%  │ 0.69       │ superTrend │
// │  43 │ ARKUSDT      │ 2023 11 09 11:15:00 │ 2023 11 09 11:45:00 │ SHORT        │ -0.51% │ 17.78%  │ 1.47       │ superTrend │
// │  44 │ XEMUSDT      │ 2023 11 09 19:20:00 │ 2023 11 10 03:40:00 │ SHORT        │ -0.01% │ 17.77%  │ 0.04       │ superTrend │
// │  45 │ SSVUSDT      │ 2023 11 10 09:45:00 │ 2023 11 10 09:50:00 │ LONG         │ -0.51% │ 17.26%  │ 20.07      │ superTrend │
// │  46 │ BONDUSDT     │ 2023 11 10 19:20:00 │ 2023 11 10 19:35:00 │ LONG         │ -0.51% │ 16.75%  │ 4.52       │ superTrend │
// │  47 │ SUSHIUSDT    │ 2023 11 10 21:40:00 │ 2023 11 10 22:25:00 │ LONG         │ -0.51% │ 16.23%  │ 1.02       │ superTrend │
// │  48 │ OXTUSDT      │ 2023 11 10 23:55:00 │ 2023 11 11 08:15:00 │ LONG         │ 1.17%  │ 17.40%  │ 0.08       │ superTrend │
// │  49 │ ARKUSDT      │ 2023 11 11 12:10:00 │ 2023 11 11 19:45:00 │ SHORT        │ 2.49%  │ 19.89%  │ 1.49       │ superTrend │
// │  50 │ TOKENUSDT    │ 2023 11 11 21:55:00 │ 2023 11 11 22:15:00 │ SHORT        │ -0.51% │ 19.38%  │ 0.03       │ superTrend │
// │  51 │ FETUSDT      │ 2023 11 12 03:20:00 │ 2023 11 12 03:50:00 │ SHORT        │ -0.51% │ 18.86%  │ 0.42       │ superTrend │
// │  52 │ STEEMUSDT    │ 2023 11 12 08:20:00 │ 2023 11 12 16:40:00 │ LONG         │ 0.45%  │ 19.31%  │ 0.27       │ superTrend │
// │  53 │ LUNA2USDT    │ 2023 11 12 18:55:00 │ 2023 11 12 19:25:00 │ LONG         │ -0.51% │ 18.80%  │ 0.79       │ superTrend │
// │  54 │ ZRXUSDT      │ 2023 11 12 19:30:00 │ 2023 11 12 19:40:00 │ LONG         │ -0.51% │ 18.28%  │ 0.52       │ superTrend │
// │  55 │ LUNA2USDT    │ 2023 11 13 09:35:00 │ 2023 11 13 16:35:00 │ SHORT        │ 2.49%  │ 20.77%  │ 0.79       │ superTrend │
// │  56 │ ZRXUSDT      │ 2023 11 13 20:05:00 │ 2023 11 13 20:10:00 │ LONG         │ -0.51% │ 20.26%  │ 0.55       │ superTrend │
// │  57 │ COMBOUSDT    │ 2023 11 13 23:30:00 │ 2023 11 14 01:05:00 │ SHORT        │ -0.51% │ 19.75%  │ 0.65       │ superTrend │
// │  58 │ CKBUSDT      │ 2023 11 14 01:40:00 │ 2023 11 14 10:00:00 │ SHORT        │ 0.62%  │ 20.36%  │ 0.00       │ superTrend │
// │  59 │ STGUSDT      │ 2023 11 14 19:10:00 │ 2023 11 14 23:35:00 │ SHORT        │ -0.51% │ 19.85%  │ 0.53       │ superTrend │
// │  60 │ 1000PEPEUSDT │ 2023 11 14 23:55:00 │ 2023 11 15 08:15:00 │ LONG         │ 0.44%  │ 20.29%  │ 0.00       │ superTrend │
// │  61 │ STGUSDT      │ 2023 11 15 13:15:00 │ 2023 11 15 13:30:00 │ LONG         │ -0.51% │ 19.78%  │ 0.57       │ superTrend │
// │  62 │ TOKENUSDT    │ 2023 11 15 21:50:00 │ 2023 11 15 22:25:00 │ LONG         │ -0.51% │ 19.27%  │ 0.04       │ superTrend │
// │  63 │ FETUSDT      │ 2023 11 16 10:50:00 │ 2023 11 16 11:00:00 │ SHORT        │ -0.51% │ 18.75%  │ 0.42       │ superTrend │
// │  64 │ COMBOUSDT    │ 2023 11 16 18:05:00 │ 2023 11 16 20:45:00 │ SHORT        │ -0.51% │ 18.24%  │ 0.64       │ superTrend │
// │  65 │ GASUSDT      │ 2023 11 16 21:25:00 │ 2023 11 17 05:45:00 │ SHORT        │ 1.40%  │ 19.64%  │ 8.55       │ superTrend │
// │  66 │ RNDRUSDT     │ 2023 11 17 08:50:00 │ 2023 11 17 12:55:00 │ SHORT        │ -0.51% │ 19.12%  │ 2.89       │ superTrend │
// │  67 │ SUSHIUSDT    │ 2023 11 17 18:30:00 │ 2023 11 18 02:50:00 │ SHORT        │ 1.61%  │ 20.73%  │ 1.03       │ superTrend │
// │  68 │ ARKUSDT      │ 2023 11 18 03:15:00 │ 2023 11 18 11:35:00 │ SHORT        │ 1.33%  │ 22.06%  │ 1.59       │ superTrend │
// │  69 │ WAXPUSDT     │ 2023 11 18 16:20:00 │ 2023 11 18 18:10:00 │ SHORT        │ -0.51% │ 21.55%  │ 0.07       │ superTrend │
// │  70 │ ARKUSDT      │ 2023 11 20 09:30:00 │ 2023 11 20 09:40:00 │ SHORT        │ -0.51% │ 21.04%  │ 1.56       │ superTrend │
// │  71 │ PEOPLEUSDT   │ 2023 11 20 21:30:00 │ 2023 11 21 05:50:00 │ SHORT        │ 0.52%  │ 21.56%  │ 0.01       │ superTrend │
// │  72 │ LITUSDT      │ 2023 11 21 12:35:00 │ 2023 11 21 20:55:00 │ SHORT        │ 1.09%  │ 22.65%  │ 0.86       │ superTrend │
// │  73 │ FETUSDT      │ 2023 11 22 01:10:00 │ 2023 11 22 09:30:00 │ LONG         │ 0.73%  │ 23.38%  │ 0.52       │ superTrend │
// │  74 │ UMAUSDT      │ 2023 11 23 04:15:00 │ 2023 11 23 09:25:00 │ LONG         │ -0.51% │ 22.86%  │ 1.91       │ superTrend │
// │  75 │ SPELLUSDT    │ 2023 11 25 04:20:00 │ 2023 11 25 12:40:00 │ LONG         │ -0.21% │ 22.65%  │ 0.00       │ superTrend │
// │  76 │ COMBOUSDT    │ 2023 11 26 18:05:00 │ 2023 11 27 02:25:00 │ SHORT        │ 1.17%  │ 23.82%  │ 0.68       │ superTrend │
// │  77 │ 1000BONKUSDT │ 2023 11 27 14:10:00 │ 2023 11 27 16:55:00 │ SHORT        │ -0.51% │ 23.31%  │ 0.00       │ superTrend │
// │  78 │ ARKUSDT      │ 2023 11 27 19:15:00 │ 2023 11 28 00:50:00 │ SHORT        │ 2.49%  │ 25.80%  │ 1.14       │ superTrend │
// │  79 │ 1000BONKUSDT │ 2023 11 28 02:55:00 │ 2023 11 28 06:35:00 │ LONG         │ 2.49%  │ 28.28%  │ 0.00       │ superTrend │
// │  80 │ ONGUSDT      │ 2023 11 28 17:40:00 │ 2023 11 28 20:20:00 │ SHORT        │ -0.51% │ 27.77%  │ 0.45       │ superTrend │
// │  81 │ USTCUSDT     │ 2023 11 29 10:40:00 │ 2023 11 29 11:15:00 │ LONG         │ -0.51% │ 27.26%  │ 0.05       │ superTrend │
// │  82 │ SUPERUSDT    │ 2023 11 29 15:35:00 │ 2023 11 29 23:55:00 │ SHORT        │ 0.52%  │ 27.78%  │ 0.37       │ superTrend │
// │  83 │ PYTHUSDT     │ 2023 12 03 06:10:00 │ 2023 12 03 14:30:00 │ SHORT        │ 0.63%  │ 28.41%  │ 0.45       │ superTrend │
// │  84 │ ONGUSDT      │ 2023 12 03 16:05:00 │ 2023 12 03 18:55:00 │ SHORT        │ -0.51% │ 27.89%  │ 0.40       │ superTrend │
// │  85 │ IOTAUSDT     │ 2023 12 03 19:10:00 │ 2023 12 04 00:15:00 │ LONG         │ 2.49%  │ 30.38%  │ 0.33       │ superTrend │
// │  86 │ IOTXUSDT     │ 2023 12 04 01:15:00 │ 2023 12 04 02:50:00 │ LONG         │ -0.51% │ 29.87%  │ 0.03       │ superTrend │
// │  87 │ ALICEUSDT    │ 2023 12 04 17:35:00 │ 2023 12 04 19:30:00 │ SHORT        │ -0.51% │ 29.36%  │ 1.17       │ superTrend │
// │  88 │ RENUSDT      │ 2023 12 04 21:45:00 │ 2023 12 05 05:35:00 │ LONG         │ -0.51% │ 28.84%  │ 0.07       │ superTrend │
// │  89 │ 1000BONKUSDT │ 2023 12 05 06:00:00 │ 2023 12 05 06:15:00 │ SHORT        │ -0.51% │ 28.33%  │ 0.01       │ superTrend │
// │  90 │ MAGICUSDT    │ 2023 12 05 07:10:00 │ 2023 12 05 12:20:00 │ LONG         │ -0.51% │ 27.82%  │ 0.94       │ superTrend │
// │  91 │ RENUSDT      │ 2023 12 06 04:45:00 │ 2023 12 06 13:05:00 │ SHORT        │ 0.09%  │ 27.90%  │ 0.06       │ superTrend │
// │  92 │ TOKENUSDT    │ 2023 12 07 01:55:00 │ 2023 12 07 02:15:00 │ SHORT        │ -0.51% │ 27.39%  │ 0.05       │ superTrend │
// │  93 │ SUIUSDT      │ 2023 12 07 15:20:00 │ 2023 12 07 23:40:00 │ LONG         │ 0.52%  │ 27.91%  │ 0.67       │ superTrend │
// │  94 │ ONEUSDT      │ 2023 12 09 01:35:00 │ 2023 12 09 03:35:00 │ LONG         │ -0.51% │ 27.40%  │ 0.02       │ superTrend │
// │  95 │ 1000BONKUSDT │ 2023 12 10 10:15:00 │ 2023 12 10 11:00:00 │ LONG         │ -0.51% │ 26.88%  │ 0.01       │ superTrend │
// │  96 │ BELUSDT      │ 2023 12 10 18:20:00 │ 2023 12 10 21:10:00 │ SHORT        │ 2.49%  │ 29.37%  │ 0.74       │ superTrend │
// │  97 │ SUPERUSDT    │ 2023 12 10 21:15:00 │ 2023 12 10 22:25:00 │ SHORT        │ -0.51% │ 28.86%  │ 0.57       │ superTrend │
// │  98 │ ETHWUSDT     │ 2023 12 11 07:45:00 │ 2023 12 11 11:55:00 │ SHORT        │ -0.51% │ 28.35%  │ 2.67       │ superTrend │
// │  99 │ BONDUSDT     │ 2023 12 11 13:15:00 │ 2023 12 11 19:00:00 │ SHORT        │ -0.51% │ 27.83%  │ 3.65       │ superTrend │
// │ 100 │ HOTUSDT      │ 2023 12 12 02:05:00 │ 2023 12 12 04:30:00 │ LONG         │ -0.51% │ 27.32%  │ 0.00       │ superTrend │
// │ 101 │ PYTHUSDT     │ 2023 12 12 05:15:00 │ 2023 12 12 06:40:00 │ LONG         │ -0.51% │ 26.81%  │ 0.43       │ superTrend │
// │ 102 │ 1000BONKUSDT │ 2023 12 12 09:05:00 │ 2023 12 12 17:25:00 │ SHORT        │ 1.92%  │ 28.73%  │ 0.01       │ superTrend │
// │ 103 │ 1000BONKUSDT │ 2023 12 12 20:00:00 │ 2023 12 12 20:05:00 │ LONG         │ -0.51% │ 28.22%  │ 0.01       │ superTrend │
// │ 104 │ POWRUSDT     │ 2023 12 12 21:05:00 │ 2023 12 12 21:25:00 │ LONG         │ -0.51% │ 27.70%  │ 0.41       │ superTrend │
// │ 105 │ USTCUSDT     │ 2023 12 13 10:05:00 │ 2023 12 13 18:25:00 │ LONG         │ 0.74%  │ 28.44%  │ 0.04       │ superTrend │
// │ 106 │ SUPERUSDT    │ 2023 12 14 08:55:00 │ 2023 12 14 09:05:00 │ LONG         │ -0.51% │ 27.93%  │ 0.64       │ superTrend │
// │ 107 │ HBARUSDT     │ 2023 12 14 19:30:00 │ 2023 12 15 03:50:00 │ LONG         │ 0.12%  │ 28.05%  │ 0.08       │ superTrend │
// │ 108 │ POWRUSDT     │ 2023 12 15 07:15:00 │ 2023 12 15 15:35:00 │ SHORT        │ 0.51%  │ 28.56%  │ 0.37       │ superTrend │
// │ 109 │ IOTXUSDT     │ 2023 12 15 22:50:00 │ 2023 12 16 00:15:00 │ SHORT        │ -0.51% │ 28.05%  │ 0.04       │ superTrend │
// │ 110 │ 1000BONKUSDT │ 2023 12 16 07:25:00 │ 2023 12 16 08:00:00 │ SHORT        │ -0.51% │ 27.54%  │ 0.02       │ superTrend │
// │ 111 │ TOKENUSDT    │ 2023 12 16 11:10:00 │ 2023 12 16 19:30:00 │ LONG         │ 1.19%  │ 28.73%  │ 0.04       │ superTrend │
// │ 112 │ FRONTUSDT    │ 2023 12 17 20:25:00 │ 2023 12 18 04:45:00 │ SHORT        │ 0.78%  │ 29.52%  │ 0.36       │ superTrend │
// │ 113 │ STORJUSDT    │ 2023 12 18 16:10:00 │ 2023 12 18 17:05:00 │ LONG         │ -0.51% │ 29.00%  │ 1.08       │ superTrend │
// │ 114 │ STORJUSDT    │ 2023 12 18 19:05:00 │ 2023 12 19 03:15:00 │ LONG         │ -0.51% │ 28.49%  │ 1.09       │ superTrend │
// │ 115 │ NKNUSDT      │ 2023 12 19 06:35:00 │ 2023 12 19 07:35:00 │ LONG         │ -0.51% │ 27.98%  │ 0.13       │ superTrend │
// │ 116 │ WLDUSDT      │ 2023 12 19 08:15:00 │ 2023 12 19 16:35:00 │ SHORT        │ 1.40%  │ 29.38%  │ 4.03       │ superTrend │
// │ 117 │ LUNA2USDT    │ 2023 12 19 19:10:00 │ 2023 12 20 01:40:00 │ LONG         │ -0.51% │ 28.86%  │ 0.97       │ superTrend │
// │ 118 │ MINAUSDT     │ 2023 12 21 01:35:00 │ 2023 12 21 09:55:00 │ LONG         │ 0.16%  │ 29.02%  │ 0.89       │ superTrend │
// │ 119 │ 1000BONKUSDT │ 2023 12 21 12:35:00 │ 2023 12 21 13:35:00 │ LONG         │ -0.51% │ 28.51%  │ 0.02       │ superTrend │
// │ 120 │ USTCUSDT     │ 2023 12 22 00:20:00 │ 2023 12 22 01:50:00 │ LONG         │ -0.51% │ 28.00%  │ 0.04       │ superTrend │
// │ 121 │ CTSIUSDT     │ 2023 12 22 09:05:00 │ 2023 12 22 17:25:00 │ LONG         │ 1.13%  │ 29.13%  │ 0.20       │ superTrend │
// │ 122 │ SUPERUSDT    │ 2023 12 23 00:15:00 │ 2023 12 23 02:30:00 │ LONG         │ -0.51% │ 28.61%  │ 0.68       │ superTrend │
// │ 123 │ OPUSDT       │ 2023 12 23 07:40:00 │ 2023 12 23 11:35:00 │ SHORT        │ -0.51% │ 28.10%  │ 3.17       │ superTrend │
// │ 124 │ SUPERUSDT    │ 2023 12 24 00:40:00 │ 2023 12 24 06:45:00 │ SHORT        │ -0.51% │ 27.59%  │ 0.67       │ superTrend │
// │ 125 │ TLMUSDT      │ 2023 12 24 23:10:00 │ 2023 12 25 07:30:00 │ LONG         │ 0.61%  │ 28.20%  │ 0.02       │ superTrend │
// │ 126 │ HIGHUSDT     │ 2023 12 25 15:15:00 │ 2023 12 25 23:35:00 │ SHORT        │ -0.17% │ 28.03%  │ 1.94       │ superTrend │
// │ 127 │ HIGHUSDT     │ 2023 12 26 00:15:00 │ 2023 12 26 08:35:00 │ SHORT        │ -0.48% │ 27.55%  │ 1.93       │ superTrend │
// │ 128 │ DUSKUSDT     │ 2023 12 26 15:50:00 │ 2023 12 27 00:10:00 │ LONG         │ 0.48%  │ 28.03%  │ 0.19       │ superTrend │
// │ 129 │ PEOPLEUSDT   │ 2023 12 27 00:15:00 │ 2023 12 27 01:10:00 │ LONG         │ -0.51% │ 27.52%  │ 0.01       │ superTrend │
// │ 130 │ FRONTUSDT    │ 2023 12 27 03:00:00 │ 2023 12 27 03:45:00 │ SHORT        │ -0.51% │ 27.00%  │ 0.42       │ superTrend │
// │ 131 │ RIFUSDT      │ 2023 12 27 06:55:00 │ 2023 12 27 15:15:00 │ SHORT        │ 1.41%  │ 28.41%  │ 0.15       │ superTrend │
// │ 132 │ 1000BONKUSDT │ 2023 12 27 20:30:00 │ 2023 12 28 02:10:00 │ SHORT        │ 2.49%  │ 30.90%  │ 0.01       │ superTrend │
// │ 133 │ MINAUSDT     │ 2023 12 28 07:25:00 │ 2023 12 28 12:05:00 │ SHORT        │ -0.51% │ 30.39%  │ 1.27       │ superTrend │
// │ 134 │ BSVUSDT      │ 2023 12 28 19:25:00 │ 2023 12 28 20:30:00 │ SHORT        │ 2.49%  │ 32.87%  │ 88.60      │ superTrend │
// │ 135 │ OPUSDT       │ 2023 12 30 02:10:00 │ 2023 12 30 10:30:00 │ SHORT        │ 0.54%  │ 33.41%  │ 3.75       │ superTrend │
// │ 136 │ ETHWUSDT     │ 2023 12 30 11:45:00 │ 2023 12 30 13:00:00 │ SHORT        │ -0.51% │ 32.90%  │ 3.61       │ superTrend │
// │ 137 │ WLDUSDT      │ 2023 12 30 18:35:00 │ 2023 12 31 02:55:00 │ LONG         │ 0.12%  │ 33.02%  │ 3.72       │ superTrend │
// │ 138 │ 1INCHUSDT    │ 2023 12 31 19:05:00 │ 2023 12 31 19:30:00 │ LONG         │ -0.51% │ 32.51%  │ 0.48       │ superTrend │
// │ 139 │ ETHWUSDT     │ 2024 01 01 02:35:00 │ 2024 01 01 07:35:00 │ SHORT        │ -0.51% │ 31.99%  │ 3.27       │ superTrend │
// │ 140 │ BSVUSDT      │ 2024 01 01 13:20:00 │ 2024 01 01 16:00:00 │ LONG         │ -0.51% │ 31.48%  │ 103.44     │ superTrend │
// │ 141 │ 1INCHUSDT    │ 2024 01 01 19:10:00 │ 2024 01 01 19:55:00 │ SHORT        │ -0.51% │ 30.97%  │ 0.48       │ superTrend │
// │ 142 │ SUIUSDT      │ 2024 01 02 03:25:00 │ 2024 01 02 05:40:00 │ LONG         │ -0.51% │ 30.46%  │ 0.91       │ superTrend │
// │ 143 │ OXTUSDT      │ 2024 01 02 20:40:00 │ 2024 01 03 05:00:00 │ SHORT        │ 1.18%  │ 31.63%  │ 0.12       │ superTrend │
// │ 144 │ SSVUSDT      │ 2024 01 03 07:05:00 │ 2024 01 03 07:10:00 │ SHORT        │ -0.51% │ 31.12%  │ 23.65      │ superTrend │
// │ 145 │ DUSKUSDT     │ 2024 01 03 17:20:00 │ 2024 01 03 18:15:00 │ SHORT        │ -0.51% │ 30.61%  │ 0.18       │ superTrend │
// │ 146 │ SUIUSDT      │ 2024 01 03 19:10:00 │ 2024 01 03 20:15:00 │ LONG         │ -0.51% │ 30.10%  │ 0.86       │ superTrend │
// │ 147 │ IOTXUSDT     │ 2024 01 03 20:20:00 │ 2024 01 03 20:50:00 │ SHORT        │ -0.51% │ 29.58%  │ 0.05       │ superTrend │
// │ 148 │ FRONTUSDT    │ 2024 01 03 21:00:00 │ 2024 01 04 03:00:00 │ LONG         │ 2.49%  │ 32.07%  │ 0.44       │ superTrend │
// │ 149 │ TOKENUSDT    │ 2024 01 04 03:15:00 │ 2024 01 04 05:15:00 │ LONG         │ -0.51% │ 31.56%  │ 0.03       │ superTrend │
// │ 150 │ SSVUSDT      │ 2024 01 04 05:55:00 │ 2024 01 04 10:10:00 │ LONG         │ 2.49%  │ 34.05%  │ 31.50      │ superTrend │
// │ 151 │ CELOUSDT     │ 2024 01 04 11:15:00 │ 2024 01 04 19:35:00 │ SHORT        │ 0.38%  │ 34.43%  │ 0.76       │ superTrend │
// │ 152 │ OPUSDT       │ 2024 01 05 05:35:00 │ 2024 01 05 13:55:00 │ SHORT        │ 1.08%  │ 35.51%  │ 3.51       │ superTrend │
// │ 153 │ UMAUSDT      │ 2024 01 05 18:05:00 │ 2024 01 05 21:15:00 │ LONG         │ -0.51% │ 34.99%  │ 2.11       │ superTrend │
// │ 154 │ SUIUSDT      │ 2024 01 06 00:00:00 │ 2024 01 06 02:55:00 │ SHORT        │ -0.51% │ 34.48%  │ 0.83       │ superTrend │
// │ 155 │ IOTXUSDT     │ 2024 01 06 06:40:00 │ 2024 01 06 09:40:00 │ SHORT        │ -0.51% │ 33.97%  │ 0.04       │ superTrend │
// │ 156 │ TUSDT        │ 2024 01 06 09:50:00 │ 2024 01 06 17:45:00 │ SHORT        │ 2.49%  │ 36.46%  │ 0.03       │ superTrend │
// │ 157 │ TUSDT        │ 2024 01 06 19:05:00 │ 2024 01 07 03:10:00 │ SHORT        │ -0.51% │ 35.94%  │ 0.03       │ superTrend │
// │ 158 │ POWRUSDT     │ 2024 01 07 03:40:00 │ 2024 01 07 03:45:00 │ SHORT        │ 2.49%  │ 38.43%  │ 0.93       │ superTrend │
// │ 159 │ NKNUSDT      │ 2024 01 07 14:20:00 │ 2024 01 07 21:50:00 │ SHORT        │ 2.49%  │ 40.92%  │ 0.12       │ superTrend │
// │ 160 │ RNDRUSDT     │ 2024 01 08 01:55:00 │ 2024 01 08 03:10:00 │ SHORT        │ -0.51% │ 40.41%  │ 3.51       │ superTrend │
// │ 161 │ KASUSDT      │ 2024 01 08 04:55:00 │ 2024 01 08 05:40:00 │ SHORT        │ -0.51% │ 39.89%  │ 0.10       │ superTrend │
// │ 162 │ RIFUSDT      │ 2024 01 08 06:20:00 │ 2024 01 08 12:45:00 │ LONG         │ 2.49%  │ 42.38%  │ 0.12       │ superTrend │
// │ 163 │ SUPERUSDT    │ 2024 01 08 12:50:00 │ 2024 01 08 21:10:00 │ LONG         │ 0.81%  │ 43.19%  │ 0.52       │ superTrend │
// │ 164 │ CYBERUSDT    │ 2024 01 08 23:10:00 │ 2024 01 09 03:55:00 │ LONG         │ -0.51% │ 42.67%  │ 6.96       │ superTrend │
// │ 165 │ MINAUSDT     │ 2024 01 09 14:25:00 │ 2024 01 09 16:10:00 │ SHORT        │ -0.51% │ 42.16%  │ 1.12       │ superTrend │
// │ 166 │ RIFUSDT      │ 2024 01 09 16:15:00 │ 2024 01 09 22:40:00 │ LONG         │ 2.49%  │ 44.65%  │ 0.16       │ superTrend │
// │ 167 │ 1000PEPEUSDT │ 2024 01 09 23:55:00 │ 2024 01 10 02:40:00 │ LONG         │ -0.51% │ 44.14%  │ 0.00       │ superTrend │
// │ 168 │ ETHWUSDT     │ 2024 01 10 04:20:00 │ 2024 01 10 07:20:00 │ LONG         │ -0.51% │ 43.62%  │ 2.98       │ superTrend │
// │ 169 │ TOKENUSDT    │ 2024 01 10 16:00:00 │ 2024 01 10 17:30:00 │ LONG         │ 2.49%  │ 46.11%  │ 0.02       │ superTrend │
// │ 170 │ TUSDT        │ 2024 01 10 20:20:00 │ 2024 01 10 20:30:00 │ LONG         │ -0.51% │ 45.60%  │ 0.03       │ superTrend │
// │ 171 │ CTSIUSDT     │ 2024 01 10 23:20:00 │ 2024 01 11 01:10:00 │ LONG         │ -0.51% │ 45.09%  │ 0.22       │ superTrend │
// │ 172 │ SSVUSDT      │ 2024 01 11 01:35:00 │ 2024 01 11 09:55:00 │ LONG         │ 0.56%  │ 45.64%  │ 36.07      │ superTrend │
// │ 173 │ 1000PEPEUSDT │ 2024 01 11 15:40:00 │ 2024 01 11 18:45:00 │ SHORT        │ -0.51% │ 45.13%  │ 0.00       │ superTrend │
// │ 174 │ FRONTUSDT    │ 2024 01 12 05:10:00 │ 2024 01 12 05:25:00 │ LONG         │ -0.51% │ 44.62%  │ 0.51       │ superTrend │
// │ 175 │ XAIUSDT      │ 2024 01 12 07:50:00 │ 2024 01 12 09:05:00 │ SHORT        │ -0.51% │ 44.11%  │ 0.58       │ superTrend │
// │ 176 │ SUIUSDT      │ 2024 01 12 09:30:00 │ 2024 01 12 11:50:00 │ LONG         │ -0.51% │ 43.59%  │ 1.16       │ superTrend │
// │ 177 │ ONTUSDT      │ 2024 01 12 20:10:00 │ 2024 01 12 23:25:00 │ SHORT        │ -0.51% │ 43.08%  │ 0.24       │ superTrend │
// │ 178 │ PEOPLEUSDT   │ 2024 01 13 05:00:00 │ 2024 01 13 09:15:00 │ LONG         │ 2.49%  │ 45.57%  │ 0.04       │ superTrend │
// │ 179 │ PEOPLEUSDT   │ 2024 01 13 10:05:00 │ 2024 01 13 10:25:00 │ SHORT        │ -0.51% │ 45.06%  │ 0.04       │ superTrend │
// │ 180 │ PYTHUSDT     │ 2024 01 13 20:30:00 │ 2024 01 13 21:00:00 │ LONG         │ -0.51% │ 44.54%  │ 0.32       │ superTrend │
// │ 181 │ TOKENUSDT    │ 2024 01 14 02:40:00 │ 2024 01 14 10:40:00 │ LONG         │ -0.51% │ 44.03%  │ 0.03       │ superTrend │
// │ 182 │ AMBUSDT      │ 2024 01 14 12:15:00 │ 2024 01 14 12:20:00 │ LONG         │ 2.49%  │ 46.52%  │ 0.01       │ superTrend │
// │ 183 │ TUSDT        │ 2024 01 15 04:30:00 │ 2024 01 15 06:25:00 │ SHORT        │ 2.49%  │ 49.01%  │ 0.04       │ superTrend │
// │ 184 │ AMBUSDT      │ 2024 01 15 11:35:00 │ 2024 01 15 16:25:00 │ LONG         │ -0.51% │ 48.49%  │ 0.01       │ superTrend │
// │ 185 │ AMBUSDT      │ 2024 01 15 19:05:00 │ 2024 01 16 03:25:00 │ SHORT        │ 0.77%  │ 49.26%  │ 0.01       │ superTrend │
// │ 186 │ MINAUSDT     │ 2024 01 16 04:05:00 │ 2024 01 16 08:30:00 │ LONG         │ -0.51% │ 48.75%  │ 1.28       │ superTrend │
// │ 187 │ MAVUSDT      │ 2024 01 17 15:50:00 │ 2024 01 17 16:20:00 │ LONG         │ -0.51% │ 48.24%  │ 0.68       │ superTrend │
// │ 188 │ MAVUSDT      │ 2024 01 18 13:50:00 │ 2024 01 18 22:10:00 │ SHORT        │ 1.74%  │ 49.98%  │ 0.60       │ superTrend │
// │ 189 │ FRONTUSDT    │ 2024 01 18 23:45:00 │ 2024 01 19 05:30:00 │ SHORT        │ -0.51% │ 49.47%  │ 0.41       │ superTrend │
// │ 190 │ USTCUSDT     │ 2024 01 19 09:10:00 │ 2024 01 19 17:30:00 │ SHORT        │ 0.52%  │ 49.99%  │ 0.03       │ superTrend │
// │ 191 │ STEEMUSDT    │ 2024 01 20 00:25:00 │ 2024 01 20 04:50:00 │ LONG         │ -0.51% │ 49.48%  │ 0.24       │ superTrend │
// │ 192 │ HIGHUSDT     │ 2024 01 20 07:30:00 │ 2024 01 20 15:50:00 │ LONG         │ 0.29%  │ 49.76%  │ 1.67       │ superTrend │
// │ 193 │ MAVUSDT      │ 2024 01 21 07:45:00 │ 2024 01 21 08:35:00 │ LONG         │ -0.51% │ 49.25%  │ 0.54       │ superTrend │
// │ 194 │ OXTUSDT      │ 2024 01 22 07:10:00 │ 2024 01 22 15:30:00 │ SHORT        │ 0.30%  │ 49.55%  │ 0.09       │ superTrend │
// │ 195 │ AMBUSDT      │ 2024 01 22 23:55:00 │ 2024 01 23 08:15:00 │ SHORT        │ 1.43%  │ 50.99%  │ 0.01       │ superTrend │
// │ 196 │ XAIUSDT      │ 2024 01 23 16:20:00 │ 2024 01 23 17:15:00 │ SHORT        │ -0.51% │ 50.47%  │ 0.69       │ superTrend │
// │ 197 │ MOVRUSDT     │ 2024 01 23 22:05:00 │ 2024 01 24 06:25:00 │ LONG         │ 1.72%  │ 52.19%  │ 22.32      │ superTrend │
// │ 198 │ 1000BONKUSDT │ 2024 01 24 09:35:00 │ 2024 01 24 13:20:00 │ LONG         │ -0.51% │ 51.68%  │ 0.01       │ superTrend │
// │ 199 │ IOTAUSDT     │ 2024 01 24 17:15:00 │ 2024 01 25 00:05:00 │ LONG         │ 2.49%  │ 54.17%  │ 0.22       │ superTrend │
// │ 200 │ ONTUSDT      │ 2024 01 25 00:15:00 │ 2024 01 25 00:30:00 │ LONG         │ -0.51% │ 53.65%  │ 0.24       │ superTrend │
// │ 201 │ XEMUSDT      │ 2024 01 25 05:45:00 │ 2024 01 25 06:10:00 │ LONG         │ -0.51% │ 53.14%  │ 0.05       │ superTrend │
// │ 202 │ WIFUSDT      │ 2024 01 25 13:05:00 │ 2024 01 25 14:35:00 │ LONG         │ 2.49%  │ 55.63%  │ 0.37       │ superTrend │
// │ 203 │ LDOUSDT      │ 2024 01 25 21:15:00 │ 2024 01 26 04:50:00 │ LONG         │ -0.51% │ 55.12%  │ 3.06       │ superTrend │
// │ 204 │ PEOPLEUSDT   │ 2024 01 27 18:25:00 │ 2024 01 28 01:05:00 │ LONG         │ -0.51% │ 54.60%  │ 0.03       │ superTrend │
// │ 205 │ ZRXUSDT      │ 2024 01 28 07:20:00 │ 2024 01 28 15:40:00 │ SHORT        │ 0.31%  │ 54.91%  │ 0.36       │ superTrend │
// │ 206 │ CTSIUSDT     │ 2024 01 30 01:55:00 │ 2024 01 30 05:00:00 │ LONG         │ -0.51% │ 54.40%  │ 0.25       │ superTrend │
// │ 207 │ RNDRUSDT     │ 2024 01 30 16:55:00 │ 2024 01 30 17:30:00 │ LONG         │ -0.51% │ 53.89%  │ 4.74       │ superTrend │
// │ 208 │ NEOUSDT      │ 2024 01 30 20:05:00 │ 2024 01 31 03:10:00 │ LONG         │ -0.51% │ 53.38%  │ 11.69      │ superTrend │
// │ 209 │ SUPERUSDT    │ 2024 01 31 04:10:00 │ 2024 01 31 12:30:00 │ SHORT        │ 1.22%  │ 54.59%  │ 0.63       │ superTrend │
// │ 210 │ ARPAUSDT     │ 2024 01 31 14:20:00 │ 2024 01 31 22:40:00 │ SHORT        │ 0.71%  │ 55.31%  │ 0.06       │ superTrend │
// │ 211 │ STORJUSDT    │ 2024 02 01 00:20:00 │ 2024 02 01 08:40:00 │ SHORT        │ -0.37% │ 54.94%  │ 0.63       │ superTrend │
// │ 212 │ MAVUSDT      │ 2024 02 02 03:50:00 │ 2024 02 02 12:05:00 │ SHORT        │ -0.51% │ 54.43%  │ 0.68       │ superTrend │
// │ 213 │ WIFUSDT      │ 2024 02 02 20:55:00 │ 2024 02 02 22:55:00 │ LONG         │ -0.51% │ 53.92%  │ 0.27       │ superTrend │
// │ 214 │ CKBUSDT      │ 2024 02 05 10:05:00 │ 2024 02 05 18:25:00 │ SHORT        │ -0.16% │ 53.76%  │ 0.00       │ superTrend │
// │ 215 │ 1000PEPEUSDT │ 2024 02 05 23:20:00 │ 2024 02 06 07:40:00 │ SHORT        │ 0.13%  │ 53.90%  │ 0.00       │ superTrend │
// │ 216 │ TOKENUSDT    │ 2024 02 07 19:05:00 │ 2024 02 07 20:30:00 │ LONG         │ -0.51% │ 53.38%  │ 0.03       │ superTrend │
// │ 217 │ CKBUSDT      │ 2024 02 09 01:05:00 │ 2024 02 09 03:20:00 │ LONG         │ -0.51% │ 52.87%  │ 0.01       │ superTrend │
// │ 218 │ DYMUSDT      │ 2024 02 09 10:15:00 │ 2024 02 09 18:35:00 │ SHORT        │ 0.90%  │ 53.77%  │ 7.46       │ superTrend │
// │ 219 │ 1000BONKUSDT │ 2024 02 09 19:10:00 │ 2024 02 10 00:45:00 │ LONG         │ 2.49%  │ 56.25%  │ 0.01       │ superTrend │
// │ 220 │ WIFUSDT      │ 2024 02 11 21:00:00 │ 2024 02 12 05:20:00 │ SHORT        │ 1.79%  │ 58.04%  │ 0.31       │ superTrend │
// │ 221 │ SUPERUSDT    │ 2024 02 12 19:10:00 │ 2024 02 12 22:35:00 │ LONG         │ 2.49%  │ 60.53%  │ 0.92       │ superTrend │
// │ 222 │ WIFUSDT      │ 2024 02 13 08:05:00 │ 2024 02 13 08:15:00 │ LONG         │ -0.51% │ 60.02%  │ 0.40       │ superTrend │
// │ 223 │ 1000BONKUSDT │ 2024 02 13 08:35:00 │ 2024 02 13 16:55:00 │ SHORT        │ 0.11%  │ 60.13%  │ 0.01       │ superTrend │
// │ 224 │ DUSKUSDT     │ 2024 02 13 18:30:00 │ 2024 02 14 02:50:00 │ LONG         │ 0.24%  │ 60.38%  │ 0.34       │ superTrend │
// │ 225 │ PYTHUSDT     │ 2024 02 14 11:10:00 │ 2024 02 14 19:30:00 │ LONG         │ 0.04%  │ 60.41%  │ 0.66       │ superTrend │
// │ 226 │ 1000PEPEUSDT │ 2024 02 14 22:55:00 │ 2024 02 15 00:45:00 │ LONG         │ -0.51% │ 59.90%  │ 0.00       │ superTrend │
// │ 227 │ WIFUSDT      │ 2024 02 15 05:00:00 │ 2024 02 15 08:25:00 │ LONG         │ -0.51% │ 59.39%  │ 0.44       │ superTrend │
// │ 228 │ RIFUSDT      │ 2024 02 15 12:10:00 │ 2024 02 15 13:00:00 │ LONG         │ -0.51% │ 58.87%  │ 0.23       │ superTrend │
// │ 229 │ RIFUSDT      │ 2024 02 15 15:15:00 │ 2024 02 15 18:15:00 │ SHORT        │ -0.51% │ 58.36%  │ 0.22       │ superTrend │
// │ 230 │ SKLUSDT      │ 2024 02 15 23:15:00 │ 2024 02 16 00:00:00 │ LONG         │ 2.49%  │ 60.85%  │ 0.09       │ superTrend │
// │ 231 │ WLDUSDT      │ 2024 02 16 03:50:00 │ 2024 02 16 05:40:00 │ LONG         │ 2.49%  │ 63.34%  │ 3.84       │ superTrend │
// │ 232 │ AIUSDT       │ 2024 02 16 06:50:00 │ 2024 02 16 08:25:00 │ SHORT        │ -0.51% │ 62.82%  │ 1.59       │ superTrend │
// │ 233 │ USTCUSDT     │ 2024 02 16 09:20:00 │ 2024 02 16 17:40:00 │ SHORT        │ 0.48%  │ 63.31%  │ 0.03       │ superTrend │
// │ 234 │ AIUSDT       │ 2024 02 17 00:00:00 │ 2024 02 17 03:30:00 │ LONG         │ -0.51% │ 62.80%  │ 1.50       │ superTrend │
// │ 235 │ ZENUSDT      │ 2024 02 17 18:50:00 │ 2024 02 17 22:35:00 │ LONG         │ -0.51% │ 62.28%  │ 12.28      │ superTrend │
// │ 236 │ C98USDT      │ 2024 02 18 02:20:00 │ 2024 02 18 03:15:00 │ LONG         │ -0.51% │ 61.77%  │ 0.34       │ superTrend │
// │ 237 │ CKBUSDT      │ 2024 02 18 08:15:00 │ 2024 02 18 08:35:00 │ SHORT        │ -0.51% │ 61.26%  │ 0.01       │ superTrend │
// │ 238 │ CKBUSDT      │ 2024 02 18 09:50:00 │ 2024 02 18 10:25:00 │ LONG         │ -0.51% │ 60.75%  │ 0.01       │ superTrend │
// │ 239 │ TOKENUSDT    │ 2024 02 19 05:15:00 │ 2024 02 19 13:35:00 │ LONG         │ -0.03% │ 60.71%  │ 0.04       │ superTrend │
// │ 240 │ FETUSDT      │ 2024 02 19 20:35:00 │ 2024 02 19 21:40:00 │ LONG         │ -0.51% │ 60.20%  │ 1.01       │ superTrend │
// │ 241 │ HOTUSDT      │ 2024 02 19 23:55:00 │ 2024 02 20 04:45:00 │ LONG         │ -0.51% │ 59.69%  │ 0.00       │ superTrend │
// │ 242 │ HBARUSDT     │ 2024 02 20 07:35:00 │ 2024 02 20 07:50:00 │ LONG         │ -0.51% │ 59.18%  │ 0.11       │ superTrend │
// │ 243 │ CKBUSDT      │ 2024 02 20 09:25:00 │ 2024 02 20 17:45:00 │ SHORT        │ 1.13%  │ 60.30%  │ 0.01       │ superTrend │
// │ 244 │ MOVRUSDT     │ 2024 02 20 19:45:00 │ 2024 02 21 04:05:00 │ SHORT        │ 0.91%  │ 61.22%  │ 23.83      │ superTrend │
// │ 245 │ RNDRUSDT     │ 2024 02 21 04:10:00 │ 2024 02 21 12:30:00 │ SHORT        │ -0.08% │ 61.14%  │ 6.24       │ superTrend │
// │ 246 │ IOTAUSDT     │ 2024 02 21 12:40:00 │ 2024 02 21 17:35:00 │ SHORT        │ -0.51% │ 60.63%  │ 0.27       │ superTrend │
// │ 247 │ DYMUSDT      │ 2024 02 21 20:15:00 │ 2024 02 21 20:45:00 │ LONG         │ -0.51% │ 60.12%  │ 7.14       │ superTrend │
// │ 248 │ SPELLUSDT    │ 2024 02 22 08:05:00 │ 2024 02 22 08:15:00 │ LONG         │ -0.51% │ 59.60%  │ 0.00       │ superTrend │
// │ 249 │ DUSKUSDT     │ 2024 02 22 10:35:00 │ 2024 02 22 18:55:00 │ LONG         │ -0.21% │ 59.40%  │ 0.29       │ superTrend │
// │ 250 │ RNDRUSDT     │ 2024 02 22 20:05:00 │ 2024 02 22 20:25:00 │ LONG         │ -0.51% │ 58.89%  │ 7.57       │ superTrend │
// │ 251 │ SUSHIUSDT    │ 2024 02 23 02:50:00 │ 2024 02 23 09:20:00 │ SHORT        │ -0.51% │ 58.37%  │ 1.28       │ superTrend │
// │ 252 │ CTSIUSDT     │ 2024 02 23 18:25:00 │ 2024 02 24 01:35:00 │ LONG         │ -0.51% │ 57.86%  │ 0.33       │ superTrend │
// │ 253 │ WIFUSDT      │ 2024 02 24 02:05:00 │ 2024 02 24 02:50:00 │ SHORT        │ -0.51% │ 57.35%  │ 0.30       │ superTrend │
// │ 254 │ WIFUSDT      │ 2024 02 24 07:10:00 │ 2024 02 24 08:45:00 │ SHORT        │ -0.51% │ 56.84%  │ 0.30       │ superTrend │
// │ 255 │ TLMUSDT      │ 2024 02 24 11:55:00 │ 2024 02 24 20:15:00 │ LONG         │ -0.10% │ 56.74%  │ 0.02       │ superTrend │
// │ 256 │ XAIUSDT      │ 2024 02 25 02:20:00 │ 2024 02 25 03:15:00 │ LONG         │ -0.51% │ 56.22%  │ 1.52       │ superTrend │
// │ 257 │ SPELLUSDT    │ 2024 02 25 14:25:00 │ 2024 02 25 15:00:00 │ LONG         │ -0.51% │ 55.71%  │ 0.00       │ superTrend │
// │ 258 │ SUPERUSDT    │ 2024 02 25 19:25:00 │ 2024 02 26 03:45:00 │ LONG         │ 0.40%  │ 56.11%  │ 1.03       │ superTrend │
// │ 259 │ BSVUSDT      │ 2024 02 26 19:10:00 │ 2024 02 26 19:30:00 │ LONG         │ -0.51% │ 55.60%  │ 80.62      │ superTrend │
// │ 260 │ CELOUSDT     │ 2024 02 26 20:30:00 │ 2024 02 26 22:35:00 │ LONG         │ -0.51% │ 55.08%  │ 0.96       │ superTrend │
// │ 261 │ WIFUSDT      │ 2024 02 27 04:45:00 │ 2024 02 27 05:00:00 │ LONG         │ -0.51% │ 54.57%  │ 0.55       │ superTrend │
// │ 262 │ 1000PEPEUSDT │ 2024 02 27 17:30:00 │ 2024 02 27 18:00:00 │ LONG         │ -0.51% │ 54.06%  │ 0.00       │ superTrend │
// │ 263 │ ALICEUSDT    │ 2024 02 27 19:25:00 │ 2024 02 27 19:30:00 │ LONG         │ -0.51% │ 53.55%  │ 2.03       │ superTrend │
// │ 264 │ ALICEUSDT    │ 2024 02 28 06:40:00 │ 2024 02 28 12:30:00 │ SHORT        │ 2.49%  │ 56.03%  │ 1.91       │ superTrend │
// │ 265 │ CKBUSDT      │ 2024 02 28 17:05:00 │ 2024 02 28 22:30:00 │ LONG         │ -0.51% │ 55.52%  │ 0.02       │ superTrend │
// │ 266 │ BSVUSDT      │ 2024 02 28 23:25:00 │ 2024 02 29 07:45:00 │ LONG         │ -0.18% │ 55.34%  │ 84.86      │ superTrend │
// │ 267 │ 1000PEPEUSDT │ 2024 02 29 11:20:00 │ 2024 02 29 13:30:00 │ SHORT        │ -0.51% │ 54.83%  │ 0.00       │ superTrend │
// │ 268 │ SKLUSDT      │ 2024 02 29 16:10:00 │ 2024 03 01 00:00:00 │ SHORT        │ -0.51% │ 54.31%  │ 0.10       │ superTrend │
// │ 269 │ PEOPLEUSDT   │ 2024 03 01 03:25:00 │ 2024 03 01 03:40:00 │ SHORT        │ -0.51% │ 53.80%  │ 0.04       │ superTrend │
// │ 270 │ COMBOUSDT    │ 2024 03 01 06:25:00 │ 2024 03 01 14:45:00 │ LONG         │ 0.73%  │ 54.53%  │ 0.94       │ superTrend │
// │ 271 │ SKLUSDT      │ 2024 03 01 18:15:00 │ 2024 03 01 20:10:00 │ LONG         │ -0.51% │ 54.02%  │ 0.11       │ superTrend │
// │ 272 │ SUPERUSDT    │ 2024 03 02 03:10:00 │ 2024 03 02 10:40:00 │ SHORT        │ -0.51% │ 53.50%  │ 1.40       │ superTrend │
// │ 273 │ LITUSDT      │ 2024 03 02 12:00:00 │ 2024 03 02 20:20:00 │ LONG         │ 0.20%  │ 53.70%  │ 1.42       │ superTrend │
// │ 274 │ HOTUSDT      │ 2024 03 03 00:50:00 │ 2024 03 03 01:15:00 │ LONG         │ -0.51% │ 53.19%  │ 0.00       │ superTrend │
// │ 275 │ LSKUSDT      │ 2024 03 03 09:20:00 │ 2024 03 03 17:40:00 │ LONG         │ 0.76%  │ 53.95%  │ 1.59       │ superTrend │
// │ 276 │ AIUSDT       │ 2024 03 03 18:00:00 │ 2024 03 04 02:20:00 │ SHORT        │ -0.24% │ 53.71%  │ 1.73       │ superTrend │
// │ 277 │ ONGUSDT      │ 2024 03 04 06:35:00 │ 2024 03 04 06:50:00 │ LONG         │ -0.51% │ 53.20%  │ 0.44       │ superTrend │
// │ 278 │ ONEUSDT      │ 2024 03 04 07:10:00 │ 2024 03 04 07:25:00 │ LONG         │ 2.49%  │ 55.69%  │ 0.03       │ superTrend │
// │ 279 │ RIFUSDT      │ 2024 03 04 07:40:00 │ 2024 03 04 12:45:00 │ LONG         │ -0.51% │ 55.18%  │ 0.26       │ superTrend │
// │ 280 │ SUSHIUSDT    │ 2024 03 04 18:35:00 │ 2024 03 04 23:25:00 │ SHORT        │ -0.51% │ 54.66%  │ 1.69       │ superTrend │
// │ 281 │ SKLUSDT      │ 2024 03 05 00:05:00 │ 2024 03 05 00:45:00 │ SHORT        │ -0.51% │ 54.15%  │ 0.11       │ superTrend │
// │ 282 │ WLDUSDT      │ 2024 03 05 03:00:00 │ 2024 03 05 04:25:00 │ SHORT        │ -0.51% │ 53.64%  │ 7.30       │ superTrend │
// │ 283 │ PEOPLEUSDT   │ 2024 03 05 09:05:00 │ 2024 03 05 11:05:00 │ SHORT        │ 2.49%  │ 56.13%  │ 0.05       │ superTrend │
// │ 284 │ QTUMUSDT     │ 2024 03 05 12:10:00 │ 2024 03 05 14:50:00 │ SHORT        │ 2.49%  │ 58.61%  │ 5.25       │ superTrend │
// │ 285 │ LSKUSDT      │ 2024 03 05 17:10:00 │ 2024 03 05 17:25:00 │ LONG         │ 2.49%  │ 61.10%  │ 2.56       │ superTrend │
// │ 286 │ BELUSDT      │ 2024 03 06 05:40:00 │ 2024 03 06 07:40:00 │ LONG         │ -0.51% │ 60.59%  │ 0.84       │ superTrend │
// │ 287 │ DYMUSDT      │ 2024 03 06 08:00:00 │ 2024 03 06 16:20:00 │ LONG         │ 1.12%  │ 61.71%  │ 6.08       │ superTrend │
// │ 288 │ LSKUSDT      │ 2024 03 06 19:05:00 │ 2024 03 07 03:25:00 │ SHORT        │ 0.83%  │ 62.55%  │ 2.25       │ superTrend │
// │ 289 │ RUNEUSDT     │ 2024 03 07 10:35:00 │ 2024 03 07 16:30:00 │ LONG         │ 2.49%  │ 65.03%  │ 6.13       │ superTrend │
// │ 290 │ SUPERUSDT    │ 2024 03 07 17:40:00 │ 2024 03 08 02:00:00 │ LONG         │ 0.04%  │ 65.07%  │ 1.50       │ superTrend │
// │ 291 │ WIFUSDT      │ 2024 03 08 04:00:00 │ 2024 03 08 08:45:00 │ LONG         │ 2.49%  │ 67.56%  │ 2.09       │ superTrend │
// │ 292 │ CYBERUSDT    │ 2024 03 08 09:45:00 │ 2024 03 08 09:55:00 │ LONG         │ 2.49%  │ 70.05%  │ 12.44      │ superTrend │
// │ 293 │ CYBERUSDT    │ 2024 03 08 16:30:00 │ 2024 03 08 17:05:00 │ LONG         │ -0.51% │ 69.54%  │ 12.56      │ superTrend │
// │ 294 │ RNDRUSDT     │ 2024 03 08 17:10:00 │ 2024 03 09 01:30:00 │ LONG         │ 1.79%  │ 71.32%  │ 10.33      │ superTrend │
// │ 295 │ COMBOUSDT    │ 2024 03 09 03:05:00 │ 2024 03 09 08:25:00 │ LONG         │ 2.49%  │ 73.81%  │ 1.12       │ superTrend │
// │ 296 │ WAXPUSDT     │ 2024 03 09 10:50:00 │ 2024 03 09 19:10:00 │ LONG         │ 1.21%  │ 75.02%  │ 0.09       │ superTrend │
// │ 297 │ MAGICUSDT    │ 2024 03 09 19:15:00 │ 2024 03 10 02:00:00 │ LONG         │ 2.49%  │ 77.51%  │ 1.39       │ superTrend │
// │ 298 │ CYBERUSDT    │ 2024 03 10 04:20:00 │ 2024 03 10 12:40:00 │ SHORT        │ 0.16%  │ 77.66%  │ 11.25      │ superTrend │
// │ 299 │ QTUMUSDT     │ 2024 03 10 16:25:00 │ 2024 03 11 00:40:00 │ SHORT        │ -0.51% │ 77.15%  │ 4.99       │ superTrend │
// │ 300 │ 1INCHUSDT    │ 2024 03 11 01:55:00 │ 2024 03 11 10:15:00 │ LONG         │ 0.91%  │ 78.06%  │ 0.63       │ superTrend │
// │ 301 │ AMBUSDT      │ 2024 03 11 10:30:00 │ 2024 03 11 11:00:00 │ LONG         │ -0.51% │ 77.55%  │ 0.01       │ superTrend │
// │ 302 │ LUNA2USDT    │ 2024 03 11 11:10:00 │ 2024 03 11 11:20:00 │ LONG         │ -0.51% │ 77.04%  │ 1.17       │ superTrend │
// │ 303 │ IOTAUSDT     │ 2024 03 11 11:40:00 │ 2024 03 11 20:00:00 │ LONG         │ 0.68%  │ 77.72%  │ 0.38       │ superTrend │
// │ 304 │ IDUSDT       │ 2024 03 12 04:00:00 │ 2024 03 12 07:45:00 │ LONG         │ 2.49%  │ 80.20%  │ 1.35       │ superTrend │
// │ 305 │ WIFUSDT      │ 2024 03 12 09:15:00 │ 2024 03 12 10:00:00 │ SHORT        │ -0.51% │ 79.69%  │ 1.91       │ superTrend │
// │ 306 │ TUSDT        │ 2024 03 12 11:25:00 │ 2024 03 12 17:35:00 │ SHORT        │ -0.51% │ 79.18%  │ 0.04       │ superTrend │
// │ 307 │ POWRUSDT     │ 2024 03 12 18:25:00 │ 2024 03 12 19:05:00 │ LONG         │ -0.51% │ 78.67%  │ 0.47       │ superTrend │
// │ 308 │ IOTXUSDT     │ 2024 03 12 20:10:00 │ 2024 03 13 04:30:00 │ LONG         │ 0.18%  │ 78.84%  │ 0.09       │ superTrend │
// │ 309 │ RUNEUSDT     │ 2024 03 13 09:15:00 │ 2024 03 13 09:35:00 │ LONG         │ -0.51% │ 78.33%  │ 11.12      │ superTrend │
// │ 310 │ MAVUSDT      │ 2024 03 13 13:30:00 │ 2024 03 13 19:15:00 │ SHORT        │ -0.51% │ 77.82%  │ 0.69       │ superTrend │
// │ 311 │ 1000BONKUSDT │ 2024 03 14 06:50:00 │ 2024 03 14 07:10:00 │ LONG         │ -0.51% │ 77.31%  │ 0.04       │ superTrend │
// │ 312 │ ONGUSDT      │ 2024 03 14 13:50:00 │ 2024 03 14 16:15:00 │ SHORT        │ -0.51% │ 76.79%  │ 0.44       │ superTrend │
// │ 313 │ IOTAUSDT     │ 2024 03 14 19:10:00 │ 2024 03 14 22:25:00 │ SHORT        │ 2.49%  │ 79.28%  │ 0.39       │ superTrend │
// │ 314 │ QTUMUSDT     │ 2024 03 15 03:25:00 │ 2024 03 15 04:55:00 │ SHORT        │ -0.51% │ 78.77%  │ 4.77       │ superTrend │
// │ 315 │ AEVOUSDT     │ 2024 03 15 06:25:00 │ 2024 03 15 06:30:00 │ SHORT        │ -0.51% │ 78.26%  │ 2.72       │ superTrend │
// │ 316 │ ARPAUSDT     │ 2024 03 15 09:10:00 │ 2024 03 15 09:40:00 │ SHORT        │ -0.51% │ 77.74%  │ 0.09       │ superTrend │
// │ 317 │ PEOPLEUSDT   │ 2024 03 15 11:10:00 │ 2024 03 15 13:05:00 │ SHORT        │ -0.51% │ 77.23%  │ 0.04       │ superTrend │
// │ 318 │ ZRXUSDT      │ 2024 03 15 17:05:00 │ 2024 03 15 18:00:00 │ LONG         │ -0.51% │ 76.72%  │ 1.34       │ superTrend │
// │ 319 │ IDUSDT       │ 2024 03 15 19:10:00 │ 2024 03 15 22:50:00 │ SHORT        │ -0.51% │ 76.21%  │ 1.60       │ superTrend │
// │ 320 │ ZRXUSDT      │ 2024 03 16 05:45:00 │ 2024 03 16 09:30:00 │ LONG         │ -0.51% │ 75.69%  │ 1.35       │ superTrend │
// │ 321 │ ZRXUSDT      │ 2024 03 16 09:35:00 │ 2024 03 16 09:50:00 │ SHORT        │ 2.49%  │ 78.18%  │ 1.31       │ superTrend │
// │ 322 │ SUSHIUSDT    │ 2024 03 16 12:45:00 │ 2024 03 16 21:05:00 │ SHORT        │ 0.86%  │ 79.04%  │ 1.84       │ superTrend │
// │ 323 │ RUNEUSDT     │ 2024 03 16 23:45:00 │ 2024 03 17 07:05:00 │ SHORT        │ -0.51% │ 78.53%  │ 8.49       │ superTrend │
// │ 324 │ VANRYUSDT    │ 2024 03 17 09:00:00 │ 2024 03 17 11:55:00 │ LONG         │ 2.49%  │ 81.02%  │ 0.28       │ superTrend │
// │ 325 │ WLDUSDT      │ 2024 03 17 15:05:00 │ 2024 03 17 19:55:00 │ LONG         │ -0.51% │ 80.50%  │ 9.61       │ superTrend │
// │ 326 │ MYROUSDT     │ 2024 03 17 23:40:00 │ 2024 03 18 02:15:00 │ LONG         │ -0.51% │ 79.99%  │ 0.31       │ superTrend │
// │ 327 │ CYBERUSDT    │ 2024 03 18 08:40:00 │ 2024 03 18 10:15:00 │ LONG         │ -0.51% │ 79.48%  │ 11.89      │ superTrend │
// │ 328 │ LUNA2USDT    │ 2024 03 18 19:40:00 │ 2024 03 19 02:10:00 │ SHORT        │ 2.49%  │ 81.97%  │ 0.89       │ superTrend │
// │ 329 │ 1000PEPEUSDT │ 2024 03 19 19:20:00 │ 2024 03 20 00:00:00 │ LONG         │ -0.51% │ 81.45%  │ 0.01       │ superTrend │
// │ 330 │ SKLUSDT      │ 2024 03 20 01:40:00 │ 2024 03 20 06:10:00 │ LONG         │ 2.49%  │ 83.94%  │ 0.09       │ superTrend │
// │ 331 │ BONDUSDT     │ 2024 03 20 06:25:00 │ 2024 03 20 10:15:00 │ LONG         │ -0.51% │ 83.43%  │ 4.04       │ superTrend │
// │ 332 │ PYTHUSDT     │ 2024 03 20 12:15:00 │ 2024 03 20 15:30:00 │ LONG         │ 2.49%  │ 85.92%  │ 0.93       │ superTrend │
// │ 333 │ FETUSDT      │ 2024 03 20 19:45:00 │ 2024 03 20 20:50:00 │ LONG         │ -0.51% │ 85.40%  │ 2.77       │ superTrend │
// │ 334 │ RIFUSDT      │ 2024 03 20 22:10:00 │ 2024 03 20 23:35:00 │ LONG         │ -0.51% │ 84.89%  │ 0.24       │ superTrend │
// │ 335 │ HIGHUSDT     │ 2024 03 21 00:50:00 │ 2024 03 21 09:10:00 │ LONG         │ 1.03%  │ 85.92%  │ 1.87       │ superTrend │
// │ 336 │ FRONTUSDT    │ 2024 03 21 10:10:00 │ 2024 03 21 18:30:00 │ SHORT        │ 0.49%  │ 86.41%  │ 1.29       │ superTrend │
// │ 337 │ IOSTUSDT     │ 2024 03 22 11:35:00 │ 2024 03 22 19:55:00 │ SHORT        │ -0.08% │ 86.33%  │ 0.01       │ superTrend │
// │ 338 │ WIFUSDT      │ 2024 03 23 16:25:00 │ 2024 03 23 17:20:00 │ LONG         │ -0.51% │ 85.82%  │ 2.36       │ superTrend │
// │ 339 │ TLMUSDT      │ 2024 03 23 19:50:00 │ 2024 03 23 20:10:00 │ LONG         │ -0.51% │ 85.31%  │ 0.03       │ superTrend │
// │ 340 │ LDOUSDT      │ 2024 03 24 20:40:00 │ 2024 03 25 05:00:00 │ LONG         │ 0.89%  │ 86.20%  │ 3.16       │ superTrend │
// │ 341 │ ETHWUSDT     │ 2024 03 25 05:25:00 │ 2024 03 25 10:40:00 │ SHORT        │ -0.51% │ 85.68%  │ 3.91       │ superTrend │
// │ 342 │ ZRXUSDT      │ 2024 03 25 19:05:00 │ 2024 03 25 19:35:00 │ LONG         │ -0.51% │ 85.17%  │ 1.02       │ superTrend │
// │ 343 │ ETHFIUSDT    │ 2024 03 25 20:50:00 │ 2024 03 25 21:55:00 │ LONG         │ -0.51% │ 84.66%  │ 4.61       │ superTrend │
// │ 344 │ 1000PEPEUSDT │ 2024 03 25 23:10:00 │ 2024 03 26 01:50:00 │ SHORT        │ -0.51% │ 84.15%  │ 0.01       │ superTrend │
// │ 345 │ ETHFIUSDT    │ 2024 03 26 09:10:00 │ 2024 03 26 15:25:00 │ LONG         │ 2.49%  │ 86.63%  │ 4.75       │ superTrend │
// │ 346 │ MYROUSDT     │ 2024 03 26 19:10:00 │ 2024 03 26 19:20:00 │ SHORT        │ -0.51% │ 86.12%  │ 0.26       │ superTrend │
// │ 347 │ UMAUSDT      │ 2024 03 26 23:25:00 │ 2024 03 27 02:15:00 │ LONG         │ -0.51% │ 85.61%  │ 4.63       │ superTrend │
// │ 348 │ TOKENUSDT    │ 2024 03 27 05:20:00 │ 2024 03 27 06:10:00 │ SHORT        │ -0.51% │ 85.10%  │ 0.21       │ superTrend │
// │ 349 │ TUSDT        │ 2024 03 27 08:30:00 │ 2024 03 27 08:45:00 │ LONG         │ -0.51% │ 84.58%  │ 0.06       │ superTrend │
// │ 350 │ DUSKUSDT     │ 2024 03 27 12:15:00 │ 2024 03 27 18:15:00 │ LONG         │ -0.51% │ 84.07%  │ 0.65       │ superTrend │
// │ 351 │ SUIUSDT      │ 2024 03 27 19:05:00 │ 2024 03 27 19:15:00 │ LONG         │ -0.51% │ 83.56%  │ 2.15       │ superTrend │
// │ 352 │ RUNEUSDT     │ 2024 03 27 21:35:00 │ 2024 03 28 00:20:00 │ SHORT        │ -0.51% │ 83.05%  │ 8.87       │ superTrend │
// │ 353 │ TOKENUSDT    │ 2024 03 28 04:00:00 │ 2024 03 28 09:20:00 │ SHORT        │ 2.49%  │ 85.53%  │ 0.19       │ superTrend │
// │ 354 │ ARPAUSDT     │ 2024 03 28 18:25:00 │ 2024 03 28 20:40:00 │ LONG         │ 2.49%  │ 88.02%  │ 0.10       │ superTrend │
// │ 355 │ MYROUSDT     │ 2024 03 29 20:00:00 │ 2024 03 29 22:00:00 │ LONG         │ 2.49%  │ 90.51%  │ 0.28       │ superTrend │
// │ 356 │ CYBERUSDT    │ 2024 03 30 01:25:00 │ 2024 03 30 02:20:00 │ LONG         │ -0.51% │ 90.00%  │ 14.14      │ superTrend │
// │ 357 │ MYROUSDT     │ 2024 03 30 19:05:00 │ 2024 03 30 21:45:00 │ LONG         │ -0.51% │ 89.48%  │ 0.34       │ superTrend │
// │ 358 │ CKBUSDT      │ 2024 04 01 00:50:00 │ 2024 04 01 00:55:00 │ SHORT        │ -0.51% │ 88.97%  │ 0.02       │ superTrend │
// │ 359 │ PEOPLEUSDT   │ 2024 04 01 09:30:00 │ 2024 04 01 17:50:00 │ SHORT        │ 0.04%  │ 89.01%  │ 0.04       │ superTrend │
// │ 360 │ CKBUSDT      │ 2024 04 01 18:55:00 │ 2024 04 02 03:15:00 │ SHORT        │ 1.63%  │ 90.65%  │ 0.02       │ superTrend │
// │ 361 │ HIGHUSDT     │ 2024 04 02 04:55:00 │ 2024 04 02 05:00:00 │ SHORT        │ -0.51% │ 90.13%  │ 2.31       │ superTrend │
// │ 362 │ RENUSDT      │ 2024 04 02 08:05:00 │ 2024 04 02 09:30:00 │ SHORT        │ -0.51% │ 89.62%  │ 0.09       │ superTrend │
// │ 363 │ IDUSDT       │ 2024 04 02 10:50:00 │ 2024 04 02 19:10:00 │ SHORT        │ 0.41%  │ 90.03%  │ 0.88       │ superTrend │
// │ 364 │ NKNUSDT      │ 2024 04 02 20:15:00 │ 2024 04 02 20:35:00 │ LONG         │ -0.51% │ 89.52%  │ 0.17       │ superTrend │
// │ 365 │ AEVOUSDT     │ 2024 04 02 20:40:00 │ 2024 04 02 22:30:00 │ LONG         │ -0.51% │ 89.01%  │ 3.04       │ superTrend │
// │ 366 │ NKNUSDT      │ 2024 04 03 00:25:00 │ 2024 04 03 00:45:00 │ LONG         │ -0.51% │ 88.49%  │ 0.18       │ superTrend │
// │ 367 │ IOTXUSDT     │ 2024 04 03 03:35:00 │ 2024 04 03 09:25:00 │ LONG         │ 2.49%  │ 90.98%  │ 0.07       │ superTrend │
// │ 368 │ ETHWUSDT     │ 2024 04 03 18:05:00 │ 2024 04 04 02:25:00 │ SHORT        │ 0.39%  │ 91.37%  │ 4.59       │ superTrend │
// │ 369 │ AIUSDT       │ 2024 04 05 02:10:00 │ 2024 04 05 09:45:00 │ SHORT        │ -0.51% │ 90.86%  │ 1.45       │ superTrend │
// │ 370 │ ETHFIUSDT    │ 2024 04 05 17:30:00 │ 2024 04 05 21:25:00 │ LONG         │ -0.51% │ 90.35%  │ 5.37       │ superTrend │
// │ 371 │ NKNUSDT      │ 2024 04 06 03:10:00 │ 2024 04 06 08:25:00 │ LONG         │ -0.51% │ 89.83%  │ 0.18       │ superTrend │
// │ 372 │ CKBUSDT      │ 2024 04 06 17:15:00 │ 2024 04 07 01:35:00 │ LONG         │ 1.47%  │ 91.31%  │ 0.02       │ superTrend │
// │ 373 │ BELUSDT      │ 2024 04 07 03:05:00 │ 2024 04 07 11:25:00 │ LONG         │ 1.01%  │ 92.32%  │ 2.03       │ superTrend │
// │ 374 │ NKNUSDT      │ 2024 04 07 17:25:00 │ 2024 04 07 20:05:00 │ LONG         │ -0.51% │ 91.81%  │ 0.20       │ superTrend │
// │ 375 │ CKBUSDT      │ 2024 04 07 20:15:00 │ 2024 04 07 21:10:00 │ LONG         │ -0.51% │ 91.30%  │ 0.03       │ superTrend │
// │ 376 │ C98USDT      │ 2024 04 08 00:25:00 │ 2024 04 08 07:45:00 │ LONG         │ 2.49%  │ 93.78%  │ 0.41       │ superTrend │
// │ 377 │ CKBUSDT      │ 2024 04 08 09:50:00 │ 2024 04 08 12:45:00 │ LONG         │ 2.49%  │ 96.27%  │ 0.03       │ superTrend │
// │ 378 │ 1INCHUSDT    │ 2024 04 08 15:55:00 │ 2024 04 08 20:05:00 │ LONG         │ -0.51% │ 95.76%  │ 0.62       │ superTrend │
// │ 379 │ FLMUSDT      │ 2024 04 09 04:45:00 │ 2024 04 09 13:05:00 │ SHORT        │ -0.29% │ 95.47%  │ 0.14       │ superTrend │
// │ 380 │ RNDRUSDT     │ 2024 04 09 16:10:00 │ 2024 04 10 00:30:00 │ SHORT        │ 0.39%  │ 95.86%  │ 9.47       │ superTrend │
// │ 381 │ FRONTUSDT    │ 2024 04 10 01:55:00 │ 2024 04 10 10:15:00 │ SHORT        │ 1.01%  │ 96.87%  │ 1.20       │ superTrend │
// │ 382 │ BONDUSDT     │ 2024 04 10 13:20:00 │ 2024 04 10 21:40:00 │ SHORT        │ 0.26%  │ 97.13%  │ 4.15       │ superTrend │
// │ 383 │ FRONTUSDT    │ 2024 04 10 23:25:00 │ 2024 04 11 07:45:00 │ SHORT        │ 0.81%  │ 97.94%  │ 1.14       │ superTrend │
// │ 384 │ FLMUSDT      │ 2024 04 11 11:35:00 │ 2024 04 11 12:20:00 │ SHORT        │ -0.51% │ 97.42%  │ 0.15       │ superTrend │
// │ 385 │ CKBUSDT      │ 2024 04 12 06:35:00 │ 2024 04 12 07:10:00 │ LONG         │ -0.51% │ 96.91%  │ 0.03       │ superTrend │
// │ 386 │ SAGAUSDT     │ 2024 04 12 12:30:00 │ 2024 04 12 13:30:00 │ SHORT        │ 2.49%  │ 99.40%  │ 4.33       │ superTrend │
// │ 387 │ CKBUSDT      │ 2024 04 12 13:35:00 │ 2024 04 12 15:50:00 │ SHORT        │ 2.49%  │ 101.89% │ 0.03       │ superTrend │
// │ 388 │ ONGUSDT      │ 2024 04 12 17:25:00 │ 2024 04 12 19:45:00 │ SHORT        │ 2.49%  │ 104.37% │ 0.53       │ superTrend │
// │ 389 │ CTSIUSDT     │ 2024 04 13 00:40:00 │ 2024 04 13 05:30:00 │ SHORT        │ -0.51% │ 103.86% │ 0.22       │ superTrend │
// │ 390 │ CKBUSDT      │ 2024 04 13 06:05:00 │ 2024 04 13 11:20:00 │ LONG         │ -0.51% │ 103.35% │ 0.03       │ superTrend │
// │ 391 │ SAGAUSDT     │ 2024 04 13 14:55:00 │ 2024 04 13 15:05:00 │ SHORT        │ 2.49%  │ 105.84% │ 3.88       │ superTrend │
// │ 392 │ AMBUSDT      │ 2024 04 13 19:25:00 │ 2024 04 13 23:15:00 │ SHORT        │ -0.51% │ 105.32% │ 0.01       │ superTrend │
// │ 393 │ NEOUSDT      │ 2024 04 14 07:05:00 │ 2024 04 14 08:40:00 │ LONG         │ -0.51% │ 104.81% │ 18.21      │ superTrend │
// │ 394 │ MYROUSDT     │ 2024 04 14 09:45:00 │ 2024 04 14 12:20:00 │ LONG         │ -0.51% │ 104.30% │ 0.14       │ superTrend │
// │ 395 │ WIFUSDT      │ 2024 04 14 17:05:00 │ 2024 04 14 19:50:00 │ LONG         │ -0.51% │ 103.79% │ 2.97       │ superTrend │
// │ 396 │ NEOUSDT      │ 2024 04 15 00:05:00 │ 2024 04 15 01:25:00 │ LONG         │ 2.49%  │ 106.27% │ 20.21      │ superTrend │
// │ 397 │ OXTUSDT      │ 2024 04 15 07:40:00 │ 2024 04 15 09:40:00 │ LONG         │ -0.51% │ 105.76% │ 0.11       │ superTrend │
// │ 398 │ VANRYUSDT    │ 2024 04 15 19:30:00 │ 2024 04 15 20:20:00 │ SHORT        │ -0.51% │ 105.25% │ 0.15       │ superTrend │
// │ 399 │ BELUSDT      │ 2024 04 15 22:40:00 │ 2024 04 16 00:40:00 │ SHORT        │ -0.51% │ 104.74% │ 0.84       │ superTrend │
// │ 400 │ MYROUSDT     │ 2024 04 16 19:50:00 │ 2024 04 16 20:00:00 │ LONG         │ -0.51% │ 104.22% │ 0.15       │ superTrend │
// │ 401 │ ONTUSDT      │ 2024 04 17 00:50:00 │ 2024 04 17 09:10:00 │ SHORT        │ 1.04%  │ 105.27% │ 0.31       │ superTrend │
// │ 402 │ IDUSDT       │ 2024 04 17 09:20:00 │ 2024 04 17 11:10:00 │ SHORT        │ -0.51% │ 104.76% │ 0.72       │ superTrend │
// │ 403 │ RUNEUSDT     │ 2024 04 17 18:20:00 │ 2024 04 18 02:40:00 │ SHORT        │ 1.97%  │ 106.72% │ 4.78       │ superTrend │
// │ 404 │ GASUSDT      │ 2024 04 18 19:05:00 │ 2024 04 18 21:00:00 │ LONG         │ -0.51% │ 106.21% │ 5.38       │ superTrend │
// │ 405 │ DUSKUSDT     │ 2024 04 19 01:40:00 │ 2024 04 19 10:00:00 │ LONG         │ 1.19%  │ 107.40% │ 0.37       │ superTrend │
// │ 406 │ IDUSDT       │ 2024 04 19 17:00:00 │ 2024 04 19 18:00:00 │ LONG         │ -0.51% │ 106.89% │ 0.77       │ superTrend │
// │ 407 │ MOVRUSDT     │ 2024 04 20 18:10:00 │ 2024 04 20 19:35:00 │ LONG         │ -0.51% │ 106.38% │ 14.09      │ superTrend │
// │ 408 │ WIFUSDT      │ 2024 04 20 20:05:00 │ 2024 04 21 04:25:00 │ LONG         │ 1.10%  │ 107.48% │ 3.02       │ superTrend │
// │ 409 │ ONTUSDT      │ 2024 04 21 19:05:00 │ 2024 04 21 21:00:00 │ LONG         │ 2.49%  │ 109.96% │ 0.40       │ superTrend │
// │ 410 │ WLDUSDT      │ 2024 04 23 10:20:00 │ 2024 04 23 18:40:00 │ SHORT        │ 0.74%  │ 110.70% │ 5.58       │ superTrend │
// │ 411 │ WIFUSDT      │ 2024 04 23 19:05:00 │ 2024 04 23 19:20:00 │ LONG         │ -0.51% │ 110.19% │ 3.08       │ superTrend │
// │ 412 │ TOKENUSDT    │ 2024 04 23 19:25:00 │ 2024 04 24 00:45:00 │ LONG         │ -0.51% │ 109.68% │ 0.13       │ superTrend │
// │ 413 │ STEEMUSDT    │ 2024 04 24 03:10:00 │ 2024 04 24 04:40:00 │ LONG         │ 2.49%  │ 112.16% │ 0.32       │ superTrend │
// │ 414 │ 1000PEPEUSDT │ 2024 04 24 17:20:00 │ 2024 04 25 01:40:00 │ SHORT        │ 0.43%  │ 112.60% │ 0.01       │ superTrend │
// │ 415 │ FETUSDT      │ 2024 04 25 05:10:00 │ 2024 04 25 07:10:00 │ SHORT        │ -0.51% │ 112.09% │ 2.23       │ superTrend │
// │ 416 │ WIFUSDT      │ 2024 04 25 09:10:00 │ 2024 04 25 12:00:00 │ LONG         │ 2.49%  │ 114.57% │ 3.00       │ superTrend │
// │ 417 │ LOOMUSDT     │ 2024 04 25 16:25:00 │ 2024 04 25 17:35:00 │ LONG         │ -0.51% │ 114.06% │ 0.09       │ superTrend │
// │ 418 │ STEEMUSDT    │ 2024 04 25 19:05:00 │ 2024 04 25 19:55:00 │ LONG         │ -0.51% │ 113.55% │ 0.30       │ superTrend │
// │ 419 │ FRONTUSDT    │ 2024 04 25 20:45:00 │ 2024 04 25 22:35:00 │ LONG         │ -0.51% │ 113.04% │ 0.92       │ superTrend │
// │ 420 │ 1000BONKUSDT │ 2024 04 26 08:50:00 │ 2024 04 26 09:35:00 │ LONG         │ -0.51% │ 112.52% │ 0.03       │ superTrend │
// │ 421 │ 1000BONKUSDT │ 2024 04 26 15:50:00 │ 2024 04 27 00:10:00 │ SHORT        │ 1.89%  │ 114.42% │ 0.03       │ superTrend │
// │ 422 │ DYMUSDT      │ 2024 04 27 01:10:00 │ 2024 04 27 09:30:00 │ LONG         │ 0.32%  │ 114.73% │ 3.65       │ superTrend │
// │ 423 │ COMBOUSDT    │ 2024 04 27 12:40:00 │ 2024 04 27 21:00:00 │ LONG         │ 1.68%  │ 116.42% │ 0.73       │ superTrend │
// │ 424 │ OPUSDT       │ 2024 04 28 00:50:00 │ 2024 04 28 09:10:00 │ LONG         │ 0.30%  │ 116.72% │ 2.67       │ superTrend │
// │ 425 │ VANRYUSDT    │ 2024 04 28 21:40:00 │ 2024 04 29 06:00:00 │ SHORT        │ 0.86%  │ 117.58% │ 0.17       │ superTrend │
// │ 426 │ LSKUSDT      │ 2024 04 30 11:20:00 │ 2024 04 30 12:40:00 │ SHORT        │ -0.51% │ 117.07% │ 1.55       │ superTrend │
// │ 427 │ CKBUSDT      │ 2024 04 30 17:50:00 │ 2024 05 01 01:25:00 │ SHORT        │ 2.49%  │ 119.55% │ 0.02       │ superTrend │
// │ 428 │ OPUSDT       │ 2024 05 01 12:55:00 │ 2024 05 01 18:30:00 │ LONG         │ 2.49%  │ 122.04% │ 2.53       │ superTrend │
// │ 429 │ ETHFIUSDT    │ 2024 05 01 21:50:00 │ 2024 05 02 00:30:00 │ LONG         │ -0.51% │ 121.53% │ 3.68       │ superTrend │
// │ 430 │ 1000PEPEUSDT │ 2024 05 02 01:30:00 │ 2024 05 02 07:10:00 │ LONG         │ 2.49%  │ 124.02% │ 0.01       │ superTrend │
// │ 431 │ MYROUSDT     │ 2024 05 02 16:40:00 │ 2024 05 02 19:25:00 │ LONG         │ -0.51% │ 123.50% │ 0.14       │ superTrend │
// │ 432 │ MYROUSDT     │ 2024 05 03 19:40:00 │ 2024 05 04 04:00:00 │ LONG         │ 0.92%  │ 124.43% │ 0.16       │ superTrend │
// │ 433 │ VANRYUSDT    │ 2024 05 04 11:50:00 │ 2024 05 04 20:10:00 │ LONG         │ -0.37% │ 124.06% │ 0.18       │ superTrend │
// │ 434 │ SAGAUSDT     │ 2024 05 06 16:20:00 │ 2024 05 07 00:40:00 │ SHORT        │ 0.63%  │ 124.69% │ 3.22       │ superTrend │
// │ 435 │ WIFUSDT      │ 2024 05 07 08:25:00 │ 2024 05 07 11:40:00 │ SHORT        │ -0.51% │ 124.18% │ 3.27       │ superTrend │
// │ 436 │ REZUSDT      │ 2024 05 07 13:40:00 │ 2024 05 07 22:00:00 │ SHORT        │ 0.20%  │ 124.39% │ 0.15       │ superTrend │
// │ 437 │ FRONTUSDT    │ 2024 05 07 23:35:00 │ 2024 05 08 03:30:00 │ SHORT        │ -0.51% │ 123.87% │ 1.26       │ superTrend │
// │ 438 │ MINAUSDT     │ 2024 05 08 04:35:00 │ 2024 05 08 09:05:00 │ SHORT        │ -0.51% │ 123.36% │ 0.80       │ superTrend │
// │ 439 │ FETUSDT      │ 2024 05 08 14:15:00 │ 2024 05 08 22:35:00 │ SHORT        │ -0.21% │ 123.15% │ 2.20       │ superTrend │
// │ 440 │ UMAUSDT      │ 2024 05 09 00:15:00 │ 2024 05 09 03:25:00 │ LONG         │ -0.51% │ 122.64% │ 3.23       │ superTrend │
// │ 441 │ FRONTUSDT    │ 2024 05 09 04:15:00 │ 2024 05 09 06:50:00 │ SHORT        │ -0.51% │ 122.12% │ 1.61       │ superTrend │
// │ 442 │ UMAUSDT      │ 2024 05 09 07:15:00 │ 2024 05 09 08:35:00 │ LONG         │ 2.49%  │ 124.61% │ 3.34       │ superTrend │
// │ 443 │ HIGHUSDT     │ 2024 05 09 09:30:00 │ 2024 05 09 17:50:00 │ LONG         │ 0.83%  │ 125.45% │ 4.48       │ superTrend │
// │ 444 │ QTUMUSDT     │ 2024 05 09 20:15:00 │ 2024 05 09 20:45:00 │ LONG         │ -0.51% │ 124.93% │ 3.87       │ superTrend │
// │ 445 │ FRONTUSDT    │ 2024 05 10 05:20:00 │ 2024 05 10 13:40:00 │ SHORT        │ 1.95%  │ 126.89% │ 1.55       │ superTrend │
// │ 446 │ FETUSDT      │ 2024 05 10 19:35:00 │ 2024 05 10 20:10:00 │ SHORT        │ -0.51% │ 126.37% │ 2.18       │ superTrend │
// │ 447 │ TOKENUSDT    │ 2024 05 11 01:25:00 │ 2024 05 11 05:35:00 │ LONG         │ -0.51% │ 125.86% │ 0.10       │ superTrend │
// │ 448 │ REZUSDT      │ 2024 05 13 05:05:00 │ 2024 05 13 13:25:00 │ SHORT        │ 1.78%  │ 127.64% │ 0.13       │ superTrend │
// │ 449 │ REZUSDT      │ 2024 05 13 17:15:00 │ 2024 05 14 01:35:00 │ SHORT        │ 1.71%  │ 129.35% │ 0.12       │ superTrend │
// │ 450 │ WLDUSDT      │ 2024 05 14 09:15:00 │ 2024 05 14 09:20:00 │ SHORT        │ -0.51% │ 128.84% │ 4.95       │ superTrend │
// │ 451 │ MYROUSDT     │ 2024 05 14 09:30:00 │ 2024 05 14 09:45:00 │ LONG         │ -0.51% │ 128.32% │ 0.17       │ superTrend │
// │ 452 │ MYROUSDT     │ 2024 05 15 07:35:00 │ 2024 05 15 07:45:00 │ LONG         │ -0.51% │ 127.81% │ 0.18       │ superTrend │
// │ 453 │ DUSKUSDT     │ 2024 05 15 19:05:00 │ 2024 05 16 00:05:00 │ LONG         │ -0.51% │ 127.30% │ 0.31       │ superTrend │
// │ 454 │ ETHFIUSDT    │ 2024 05 16 17:10:00 │ 2024 05 16 22:25:00 │ SHORT        │ -0.51% │ 126.79% │ 3.21       │ superTrend │
// │ 455 │ LDOUSDT      │ 2024 05 17 01:55:00 │ 2024 05 17 10:15:00 │ LONG         │ 1.46%  │ 128.25% │ 1.68       │ superTrend │
// │ 456 │ PEOPLEUSDT   │ 2024 05 18 19:05:00 │ 2024 05 19 03:25:00 │ SHORT        │ 0.34%  │ 128.59% │ 0.05       │ superTrend │
// │ 457 │ IOTAUSDT     │ 2024 05 20 10:15:00 │ 2024 05 20 18:35:00 │ LONG         │ 1.47%  │ 130.06% │ 0.22       │ superTrend │
// │ 458 │ SSVUSDT      │ 2024 05 20 18:40:00 │ 2024 05 20 19:00:00 │ LONG         │ -0.51% │ 129.55% │ 47.86      │ superTrend │
// │ 459 │ MAGICUSDT    │ 2024 05 20 20:50:00 │ 2024 05 21 05:10:00 │ LONG         │ 0.21%  │ 129.76% │ 0.77       │ superTrend │
// │ 460 │ OPUSDT       │ 2024 05 21 05:15:00 │ 2024 05 21 13:35:00 │ LONG         │ -0.07% │ 129.69% │ 2.85       │ superTrend │
// │ 461 │ PEOPLEUSDT   │ 2024 05 21 20:05:00 │ 2024 05 21 22:50:00 │ LONG         │ 2.49%  │ 132.17% │ 0.05       │ superTrend │
// │ 462 │ TAOUSDT      │ 2024 05 21 23:40:00 │ 2024 05 22 01:00:00 │ SHORT        │ -0.51% │ 131.66% │ 419.04     │ superTrend │
// │ 463 │ MYROUSDT     │ 2024 05 22 01:05:00 │ 2024 05 22 06:50:00 │ LONG         │ 2.49%  │ 134.15% │ 0.20       │ superTrend │
// │ 464 │ CKBUSDT      │ 2024 05 22 11:05:00 │ 2024 05 22 19:25:00 │ SHORT        │ 0.27%  │ 134.42% │ 0.02       │ superTrend │
// │ 465 │ 1000BONKUSDT │ 2024 05 22 20:05:00 │ 2024 05 22 20:55:00 │ SHORT        │ -0.51% │ 133.91% │ 0.03       │ superTrend │
// │ 466 │ PEOPLEUSDT   │ 2024 05 22 22:35:00 │ 2024 05 22 22:40:00 │ SHORT        │ -0.51% │ 133.39% │ 0.06       │ superTrend │
// │ 467 │ AEVOUSDT     │ 2024 05 23 07:55:00 │ 2024 05 23 16:15:00 │ SHORT        │ 0.62%  │ 134.01% │ 0.87       │ superTrend │
// │ 468 │ ETHWUSDT     │ 2024 05 23 19:40:00 │ 2024 05 24 00:40:00 │ LONG         │ -0.51% │ 133.50% │ 3.85       │ superTrend │
// │ 469 │ ONEUSDT      │ 2024 05 24 02:55:00 │ 2024 05 24 11:15:00 │ LONG         │ 0.09%  │ 133.58% │ 0.02       │ superTrend │
// │ 470 │ RENUSDT      │ 2024 05 24 15:05:00 │ 2024 05 24 23:25:00 │ LONG         │ 1.48%  │ 135.07% │ 0.07       │ superTrend │
// │ 471 │ NOTUSDT      │ 2024 05 26 22:35:00 │ 2024 05 27 03:20:00 │ LONG         │ 2.49%  │ 137.56% │ 0.01       │ superTrend │
// │ 472 │ SSVUSDT      │ 2024 05 27 14:50:00 │ 2024 05 27 23:10:00 │ SHORT        │ 1.22%  │ 138.78% │ 46.24      │ superTrend │
// │ 473 │ DUSKUSDT     │ 2024 05 28 07:45:00 │ 2024 05 28 09:00:00 │ LONG         │ -0.51% │ 138.27% │ 0.43       │ superTrend │
// │ 474 │ TOKENUSDT    │ 2024 05 28 11:10:00 │ 2024 05 28 11:20:00 │ LONG         │ -0.51% │ 137.75% │ 0.16       │ superTrend │
// │ 475 │ NOTUSDT      │ 2024 05 28 23:25:00 │ 2024 05 29 02:25:00 │ LONG         │ -0.51% │ 137.24% │ 0.01       │ superTrend │
// │ 476 │ 1INCHUSDT    │ 2024 05 29 03:15:00 │ 2024 05 29 11:35:00 │ LONG         │ 1.34%  │ 138.58% │ 0.47       │ superTrend │
// │ 477 │ 1000BONKUSDT │ 2024 05 29 23:45:00 │ 2024 05 30 02:20:00 │ SHORT        │ 2.49%  │ 141.07% │ 0.04       │ superTrend │
// │ 478 │ STGUSDT      │ 2024 05 30 02:30:00 │ 2024 05 30 02:50:00 │ LONG         │ 2.49%  │ 143.56% │ 0.63       │ superTrend │
// │ 479 │ DUSKUSDT     │ 2024 05 30 11:35:00 │ 2024 05 30 12:10:00 │ LONG         │ -0.51% │ 143.04% │ 0.46       │ superTrend │
// │ 480 │ USTCUSDT     │ 2024 05 30 14:25:00 │ 2024 05 30 15:10:00 │ LONG         │ -0.51% │ 142.53% │ 0.02       │ superTrend │
// │ 481 │ ETHFIUSDT    │ 2024 05 30 18:10:00 │ 2024 05 31 02:30:00 │ LONG         │ 0.27%  │ 142.80% │ 4.59       │ superTrend │
// │ 482 │ 1INCHUSDT    │ 2024 05 31 17:00:00 │ 2024 05 31 19:10:00 │ SHORT        │ -0.51% │ 142.29% │ 0.48       │ superTrend │
// │ 483 │ AEVOUSDT     │ 2024 06 02 17:20:00 │ 2024 06 02 19:00:00 │ LONG         │ -0.51% │ 141.78% │ 1.07       │ superTrend │
// │ 484 │ XEMUSDT      │ 2024 06 02 22:05:00 │ 2024 06 02 23:40:00 │ SHORT        │ 2.49%  │ 144.27% │ 0.03       │ superTrend │
// │ 485 │ SPELLUSDT    │ 2024 06 03 07:20:00 │ 2024 06 03 08:45:00 │ LONG         │ 2.49%  │ 146.75% │ 0.00       │ superTrend │
// │ 486 │ TLMUSDT      │ 2024 06 03 10:25:00 │ 2024 06 03 10:55:00 │ LONG         │ 2.49%  │ 149.24% │ 0.02       │ superTrend │
// │ 487 │ KASUSDT      │ 2024 06 03 20:15:00 │ 2024 06 03 21:10:00 │ LONG         │ -0.51% │ 148.73% │ 0.18       │ superTrend │
// │ 488 │ KASUSDT      │ 2024 06 03 23:35:00 │ 2024 06 04 01:00:00 │ LONG         │ -0.51% │ 148.22% │ 0.18       │ superTrend │
// │ 489 │ TOKENUSDT    │ 2024 06 06 01:20:00 │ 2024 06 06 09:40:00 │ SHORT        │ -0.03% │ 148.18% │ 0.17       │ superTrend │
// │ 490 │ MYROUSDT     │ 2024 06 06 23:45:00 │ 2024 06 07 08:05:00 │ SHORT        │ 0.76%  │ 148.94% │ 0.27       │ superTrend │
// │ 491 │ BELUSDT      │ 2024 06 07 19:05:00 │ 2024 06 08 03:25:00 │ SHORT        │ 0.09%  │ 149.03% │ 0.88       │ superTrend │
// │ 492 │ WLDUSDT      │ 2024 06 08 04:00:00 │ 2024 06 08 12:20:00 │ SHORT        │ 1.05%  │ 150.07% │ 4.42       │ superTrend │
// │ 493 │ MOVRUSDT     │ 2024 06 08 21:20:00 │ 2024 06 08 22:45:00 │ SHORT        │ -0.51% │ 149.56% │ 15.85      │ superTrend │
// │ 494 │ PEOPLEUSDT   │ 2024 06 09 20:05:00 │ 2024 06 10 04:25:00 │ SHORT        │ 0.68%  │ 150.24% │ 0.13       │ superTrend │
// │ 495 │ ALICEUSDT    │ 2024 06 10 20:55:00 │ 2024 06 10 22:05:00 │ SHORT        │ -0.51% │ 149.73% │ 1.56       │ superTrend │
// │ 496 │ BONDUSDT     │ 2024 06 11 02:00:00 │ 2024 06 11 10:20:00 │ SHORT        │ 0.46%  │ 150.19% │ 2.79       │ superTrend │
// │ 497 │ CKBUSDT      │ 2024 06 11 17:25:00 │ 2024 06 12 01:45:00 │ SHORT        │ 0.22%  │ 150.41% │ 0.01       │ superTrend │
// │ 498 │ PEOPLEUSDT   │ 2024 06 12 07:35:00 │ 2024 06 12 08:05:00 │ LONG         │ -0.51% │ 149.90% │ 0.12       │ superTrend │
// │ 499 │ TOKENUSDT    │ 2024 06 12 10:05:00 │ 2024 06 12 13:00:00 │ LONG         │ -0.51% │ 149.39% │ 0.13       │ superTrend │
// │ 500 │ SAGAUSDT     │ 2024 06 12 13:20:00 │ 2024 06 12 13:45:00 │ LONG         │ -0.51% │ 148.88% │ 2.10       │ superTrend │
// │ 501 │ TOKENUSDT    │ 2024 06 13 01:35:00 │ 2024 06 13 03:05:00 │ SHORT        │ -0.51% │ 148.36% │ 0.12       │ superTrend │
// │ 502 │ AEVOUSDT     │ 2024 06 13 04:40:00 │ 2024 06 13 07:30:00 │ SHORT        │ -0.51% │ 147.85% │ 0.66       │ superTrend │
// │ 503 │ DUSKUSDT     │ 2024 06 13 07:45:00 │ 2024 06 13 16:05:00 │ SHORT        │ 1.62%  │ 149.47% │ 0.40       │ superTrend │
// │ 504 │ TOKENUSDT    │ 2024 06 13 19:15:00 │ 2024 06 14 01:45:00 │ SHORT        │ -0.51% │ 148.96% │ 0.10       │ superTrend │
// │ 505 │ BONDUSDT     │ 2024 06 14 20:45:00 │ 2024 06 15 00:40:00 │ SHORT        │ -0.51% │ 148.44% │ 2.69       │ superTrend │
// │ 506 │ LDOUSDT      │ 2024 06 15 01:10:00 │ 2024 06 15 09:30:00 │ LONG         │ -0.30% │ 148.15% │ 2.07       │ superTrend │
// │ 507 │ RIFUSDT      │ 2024 06 15 18:05:00 │ 2024 06 16 02:20:00 │ SHORT        │ -0.51% │ 147.63% │ 0.11       │ superTrend │
// │ 508 │ LDOUSDT      │ 2024 06 16 21:25:00 │ 2024 06 17 00:05:00 │ SHORT        │ -0.51% │ 147.12% │ 2.12       │ superTrend │
// │ 509 │ IOTXUSDT     │ 2024 06 17 01:05:00 │ 2024 06 17 09:25:00 │ SHORT        │ 1.07%  │ 148.19% │ 0.05       │ superTrend │
// │ 510 │ IOSTUSDT     │ 2024 06 17 10:20:00 │ 2024 06 17 18:40:00 │ SHORT        │ 0.74%  │ 148.94% │ 0.01       │ superTrend │
// │ 511 │ VANRYUSDT    │ 2024 06 18 01:30:00 │ 2024 06 18 09:50:00 │ SHORT        │ 1.11%  │ 150.04% │ 0.15       │ superTrend │
// │ 512 │ KASUSDT      │ 2024 06 18 10:00:00 │ 2024 06 18 13:25:00 │ SHORT        │ -0.51% │ 149.53% │ 0.14       │ superTrend │
// │ 513 │ TOKENUSDT    │ 2024 06 19 07:05:00 │ 2024 06 19 07:20:00 │ LONG         │ -0.51% │ 149.02% │ 0.08       │ superTrend │
// │ 514 │ IOUSDT       │ 2024 06 20 11:05:00 │ 2024 06 20 12:10:00 │ SHORT        │ -0.51% │ 148.50% │ 3.90       │ superTrend │
// │ 515 │ DUSKUSDT     │ 2024 06 20 21:35:00 │ 2024 06 21 05:55:00 │ SHORT        │ -0.18% │ 148.32% │ 0.31       │ superTrend │
// │ 516 │ WIFUSDT      │ 2024 06 21 10:40:00 │ 2024 06 21 19:00:00 │ SHORT        │ 0.96%  │ 149.29% │ 1.83       │ superTrend │
// │ 517 │ LDOUSDT      │ 2024 06 23 20:20:00 │ 2024 06 23 23:50:00 │ SHORT        │ -0.51% │ 148.78% │ 2.06       │ superTrend │
// │ 518 │ AEVOUSDT     │ 2024 06 24 11:15:00 │ 2024 06 24 19:35:00 │ LONG         │ 1.24%  │ 150.02% │ 0.49       │ superTrend │
// │ 519 │ CKBUSDT      │ 2024 06 25 02:05:00 │ 2024 06 25 10:25:00 │ LONG         │ 1.23%  │ 151.24% │ 0.01       │ superTrend │
// │ 520 │ DUSKUSDT     │ 2024 06 25 17:10:00 │ 2024 06 26 01:30:00 │ LONG         │ -0.33% │ 150.92% │ 0.32       │ superTrend │
// │ 521 │ FETUSDT      │ 2024 06 26 03:35:00 │ 2024 06 26 11:55:00 │ LONG         │ 1.02%  │ 151.93% │ 1.70       │ superTrend │
// │ 522 │ ONGUSDT      │ 2024 06 26 19:05:00 │ 2024 06 26 19:20:00 │ SHORT        │ -0.51% │ 151.42% │ 0.35       │ superTrend │
// │ 523 │ BONDUSDT     │ 2024 06 27 19:10:00 │ 2024 06 27 20:35:00 │ LONG         │ 2.49%  │ 153.91% │ 2.21       │ superTrend │
// │ 524 │ WLDUSDT      │ 2024 06 30 20:15:00 │ 2024 06 30 22:35:00 │ LONG         │ -0.51% │ 153.39% │ 2.48       │ superTrend │
// │ 525 │ MEWUSDT      │ 2024 07 01 07:50:00 │ 2024 07 01 16:10:00 │ LONG         │ 0.89%  │ 154.29% │ 0.00       │ superTrend │
// │ 526 │ CYBERUSDT    │ 2024 07 02 19:35:00 │ 2024 07 02 21:05:00 │ LONG         │ -0.51% │ 153.77% │ 4.88       │ superTrend │
// │ 527 │ LDOUSDT      │ 2024 07 03 05:20:00 │ 2024 07 03 13:40:00 │ SHORT        │ 0.38%  │ 154.15% │ 1.75       │ superTrend │
// │ 528 │ WIFUSDT      │ 2024 07 03 20:10:00 │ 2024 07 03 21:00:00 │ SHORT        │ -0.51% │ 153.64% │ 1.77       │ superTrend │
// │ 529 │ SUIUSDT      │ 2024 07 04 11:35:00 │ 2024 07 04 19:35:00 │ SHORT        │ 2.49%  │ 156.13% │ 0.71       │ superTrend │
// │ 530 │ MOVRUSDT     │ 2024 07 05 03:20:00 │ 2024 07 05 05:10:00 │ SHORT        │ -0.51% │ 155.62% │ 8.20       │ superTrend │
// │ 531 │ SUPERUSDT    │ 2024 07 05 08:00:00 │ 2024 07 05 08:30:00 │ SHORT        │ -0.51% │ 155.10% │ 0.47       │ superTrend │
// │ 532 │ LDOUSDT      │ 2024 07 05 11:25:00 │ 2024 07 05 11:55:00 │ LONG         │ -0.51% │ 154.59% │ 1.62       │ superTrend │
// │ 533 │ CTSIUSDT     │ 2024 07 05 16:40:00 │ 2024 07 06 01:00:00 │ LONG         │ -0.09% │ 154.51% │ 0.14       │ superTrend │
// │ 534 │ IOTXUSDT     │ 2024 07 06 17:50:00 │ 2024 07 06 20:00:00 │ LONG         │ -0.51% │ 153.99% │ 0.04       │ superTrend │
// │ 535 │ ZENUSDT      │ 2024 07 06 21:05:00 │ 2024 07 06 22:40:00 │ LONG         │ -0.51% │ 153.48% │ 9.65       │ superTrend │
// │ 536 │ MEWUSDT      │ 2024 07 07 02:15:00 │ 2024 07 07 10:35:00 │ SHORT        │ 1.19%  │ 154.67% │ 0.00       │ superTrend │
// │ 537 │ DYMUSDT      │ 2024 07 07 11:10:00 │ 2024 07 07 16:20:00 │ LONG         │ -0.51% │ 154.16% │ 1.16       │ superTrend │
// │ 538 │ NOTUSDT      │ 2024 07 07 21:00:00 │ 2024 07 07 21:05:00 │ LONG         │ -0.51% │ 153.64% │ 0.02       │ superTrend │
// │ 539 │ BONDUSDT     │ 2024 07 08 02:05:00 │ 2024 07 08 02:10:00 │ SHORT        │ -0.51% │ 153.13% │ 1.37       │ superTrend │
// │ 540 │ MEWUSDT      │ 2024 07 08 02:15:00 │ 2024 07 08 03:00:00 │ SHORT        │ -0.51% │ 152.62% │ 0.00       │ superTrend │
// │ 541 │ XAIUSDT      │ 2024 07 08 03:05:00 │ 2024 07 08 09:25:00 │ LONG         │ -0.51% │ 152.11% │ 0.33       │ superTrend │
// │ 542 │ XEMUSDT      │ 2024 07 08 09:30:00 │ 2024 07 08 09:35:00 │ SHORT        │ -0.51% │ 151.59% │ 0.01       │ superTrend │
// │ 543 │ 1000PEPEUSDT │ 2024 07 08 10:15:00 │ 2024 07 08 10:55:00 │ LONG         │ -0.51% │ 151.08% │ 0.01       │ superTrend │
// │ 544 │ MEWUSDT      │ 2024 07 08 18:40:00 │ 2024 07 08 20:10:00 │ SHORT        │ -0.51% │ 150.57% │ 0.00       │ superTrend │
// │ 545 │ REZUSDT      │ 2024 07 09 00:40:00 │ 2024 07 09 01:55:00 │ SHORT        │ -0.51% │ 150.06% │ 0.07       │ superTrend │
// │ 546 │ BONDUSDT     │ 2024 07 09 02:05:00 │ 2024 07 09 05:05:00 │ SHORT        │ -0.51% │ 149.54% │ 1.27       │ superTrend │
// │ 547 │ XAIUSDT      │ 2024 07 09 09:15:00 │ 2024 07 09 09:40:00 │ LONG         │ 2.49%  │ 152.03% │ 0.36       │ superTrend │
// │ 548 │ XAIUSDT      │ 2024 07 09 11:10:00 │ 2024 07 09 11:35:00 │ LONG         │ -0.51% │ 151.52% │ 0.38       │ superTrend │
// │ 549 │ SAGAUSDT     │ 2024 07 09 23:10:00 │ 2024 07 10 04:20:00 │ LONG         │ -0.51% │ 151.01% │ 1.37       │ superTrend │
// │ 550 │ BONDUSDT     │ 2024 07 10 14:45:00 │ 2024 07 10 23:05:00 │ SHORT        │ 0.67%  │ 151.68% │ 1.35       │ superTrend │
// │ 551 │ TOKENUSDT    │ 2024 07 11 20:20:00 │ 2024 07 11 20:40:00 │ SHORT        │ -0.51% │ 151.17% │ 0.07       │ superTrend │
// │ 552 │ TOKENUSDT    │ 2024 07 11 22:20:00 │ 2024 07 12 06:40:00 │ SHORT        │ 1.50%  │ 152.66% │ 0.07       │ superTrend │
// │ 553 │ FLMUSDT      │ 2024 07 12 19:15:00 │ 2024 07 12 21:00:00 │ LONG         │ 2.49%  │ 155.15% │ 0.07       │ superTrend │
// └─────┴──────────────┴─────────────────────┴─────────────────────┴──────────────┴────────┴─────────┴────────────┴────────────┘
