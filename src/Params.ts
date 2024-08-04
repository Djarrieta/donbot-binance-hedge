import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 100,
	defaultSL: 2 / 100,
	defaultTP: 10 / 100,
	breakEventAlerts: [
		{ alert: 1 / 100, value: 0.5 / 100, len: 1 },
		{ alert: 3 / 100, value: 1 / 100, len: 1 },
		{ alert: 5 / 100, value: 3 / 100, len: 1 },
		{ alert: 7 / 100, value: 5 / 100, len: 1 },
		{ alert: 9 / 100, value: 7 / 100, len: 1 },
	], // it is not considered in backtest
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
	riskPt: 0.5 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
