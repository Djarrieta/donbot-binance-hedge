import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 450,
	defaultSL: 9 / 100,
	defaultTP: 7 / 100,
	defaultBE: 1 / 100,
	breakevenAlert: 2 / 100,
	maxProtectedPositions: 1,
	maxHedgePositions: 3,

	lookBackLengthBacktest: (5 * Interval["1d"]) / Interval["5m"],
	backtestSLArray: [1 / 100],
	backtestTPArray: [1 / 100],
	backtestMaxTradeLengthArray: [50],

	interval: Interval["5m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTrade: 6,
	amountToTradePt: 50 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
