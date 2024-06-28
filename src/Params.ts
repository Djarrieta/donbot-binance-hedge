import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 50,
	defaultSL: 10 / 100,
	defaultTP: 1 / 100,
	defaultBE: 0 / 100, // it is not considered in backtest
	breakevenAlert: 0 / 100, // it is not considered in backtest
	maxProtectedPositions: 1,
	maxHedgePositions: 3,

	lookBackLengthBacktest: (120 * Interval["1d"]) / Interval["5m"],
	backtestSLArray: [1 / 100, 5 / 100, 10 / 100],
	backtestTPArray: [1 / 100, 5 / 100, 10 / 100],
	backtestMaxTradeLengthArray: [30, 50, 100],

	interval: Interval["5m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTrade: 6,
	amountToTradePt: 50 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
