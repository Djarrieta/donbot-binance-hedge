import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 100,
	defaultSL: 2 / 100,
	defaultTP: 10 / 100,
	defaultBE: 1 / 100, // it is not considered in backtest
	breakevenAlert: 5 / 100, // it is not considered in backtest
	maxProtectedPositions: 1,
	maxHedgePositions: 15,
	leverage: 10,

	lookBackLengthBacktest: (9 * Interval["1M"]) / Interval["5m"],
	backtestSLArray: [2 / 100],
	backtestTPArray: [10 / 100],
	backtestMaxTradeLengthArray: [100],

	interval: Interval["5m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTradeUSDT: 6,
	riskPt: 0.5 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
