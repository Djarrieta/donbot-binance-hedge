import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 100,
	defaultSL: 1 / 100,
	defaultTP: 10 / 100,
	defaultBE: 1 / 100, // it is not considered in backtest
	breakevenAlert: 5 / 100, // it is not considered in backtest
	maxProtectedPositions: 1,
	maxHedgePositions: 15,

	lookBackLengthBacktest: (90 * Interval["1d"]) / Interval["5m"],
	backtestSLArray: [1 / 100, 2 / 100],
	backtestTPArray: [8 / 100, 10 / 100, 12 / 100],
	backtestMaxTradeLengthArray: [50, 100],

	interval: Interval["5m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTrade: 6,
	amountToTradePt: 25 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
