import { Interval } from "./models/Interval";

export const params = {
	branch: "main" as "main" | "dev",

	maxTradeLength: 300,
	defaultSL: 10 / 100,
	defaultTP: 10 / 100,
	maxProtectedPositions: 1,
	maxHedgePositions: 3,

	lookBackLengthBacktest: (1 * Interval["1d"]) / Interval["5m"],
	backtestSLArray: [5 / 100, 7 / 100, 10 / 100],
	backtestTPArray: [3 / 100, 7 / 100, 10 / 100],
	backtestMaxTradeLengthArray: [150, 300, 450],

	interval: Interval["5m"],
	lookBackLength: 200,
	fee: 0.0005,
	minAmountToTrade: 6,
	amountToTradePt: 50 / 100,
	candlestickAPILimit: 500,
};
export type Params = typeof params;
