import { Interval } from "./models/Interval";

export const InitialParams = {
	branch: "main" as "main" | "dev",
	interval: Interval["5m"],
	candlestickAPILimit: 500,
	lookBackLength: 200,
	lookBackLengthBacktest: (7 * Interval["1d"]) / Interval["5m"],
	minAmountToTrade: 6,
	maxTradeLength: 50,
	defaultSL: 10 / 100,
	defaultTP: 5 / 100,
	fee: 0.0005,
	backtestSLArray: [1 / 100, 10 / 100, 20 / 100],
	backtestTPArray: [1 / 100, 10 / 100, 20 / 100],
	backtestMaxTradeLengthArray: [50, 150, 300],
};
