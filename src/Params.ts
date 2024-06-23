import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 450,
	defaultSL: 10 / 100,
	defaultTP: 7 / 100,
	maxProtectedPositions: 1,
	maxHedgePositions: 3,

	lookBackLengthBacktest: (90 * Interval["1d"]) / Interval["5m"],
	backtestSLArray: [7 / 100, 10 / 100],
	backtestTPArray: [7 / 100, 10 / 100],
	backtestMaxTradeLengthArray: [300, 450],

	interval: Interval["5m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTrade: 6,
	amountToTradePt: 50 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
