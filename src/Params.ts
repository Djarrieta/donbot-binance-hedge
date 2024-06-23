import { Interval } from "./sharedModels/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 300,
	defaultSL: 1 / 100,
	defaultTP: 1 / 100,
	maxProtectedPositions: 1,
	maxHedgePositions: 3,

	lookBackLengthBacktest: (1 * Interval["1d"]) / Interval["5m"],
	backtestSLArray: [7 / 100, 10 / 100],
	backtestTPArray: [7 / 100, 10 / 100],
	backtestMaxTradeLengthArray: [300, 450],

	interval: Interval["1m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTrade: 6,
	amountToTradePt: 50 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
