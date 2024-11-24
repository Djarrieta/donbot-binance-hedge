import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 100,
	defaultSL: 1 / 100,
	defaultTP: 10 / 100,
	breakEventAlerts: [], // it is not considered in backtest
	maxProtectedPositions: 1,
	maxHedgePositions: 15,
	leverage: 10,

	lookBackLengthBacktest: (12 * Interval["1M"]) / Interval["5m"],
	backtestSLArray: [2 / 100],
	backtestTPArray: [10 / 100],
	backtestMaxTradeLengthArray: [100],
	backtestStartPt: 0 / 100,
	backtestEndPt: 100 / 100,

	interval: Interval["5m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTradeUSDT: 6,
	riskPt: 0.25 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
