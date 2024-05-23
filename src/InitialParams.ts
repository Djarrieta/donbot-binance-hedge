import { Interval } from "./models/Interval";

export const InitialParams = {
	branch: "main" as "main" | "dev",
	interval: Interval["5m"],
	candlestickAPILimit: 500,
	lookBackLength: 50,
	lookBackLengthBacktest: (7 * Interval["1d"]) / Interval["5m"],
	minAmountToTrade: 6,
	maxTradeLength: 100,
	defaultSL: 10 / 100,
	defaultTP: 15 / 100,
	fee: 0.0005,
};
