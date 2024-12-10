import { Interval } from "./domain/Interval";
import type { Strategy } from "./domain/Strategy";
import type { ConfigTrade } from "./domain/ConfigTrade";
import { rsiDivergency5m } from "./strategies/rsiDivergency5m";
import { getDate, type DateString } from "./utils/getDate";
import { getSuggestedDates } from "./utils/getSuggestedDates";
import type { ConfigBacktest } from "./domain/ConfigBacktest";

export const DATA_BASE_NAME = "DYNAMIC_PARAMS.db";

const interval = Interval["5m"];
const { backtestStart, backtestEnd, forwardTestEnd } = getSuggestedDates({
	candleCount: 80000,
	backtestPercent: 0.75,
	interval,
	lastDate: getDate("2024 12 08 00:00:00" as DateString).dateMs,
});
//TODO: add daily pnl
export const backtestConfig: ConfigBacktest = {
	backtestStart,
	backtestEnd,
	forwardTestEnd,
	interval,
	lookBackLength: 200,
	maxTradeLengthArray: [100],

	minAmountToTradeUSDT: 6,
	leverage: 2,
	balanceUSDT: 25.2,
	feePt: 0.0005,

	maxSlArray: [1 / 100],
	tpSlRatioArray: [10],
	minSlTp: 1 / 100,
	breakEventAlerts: [],

	steps: {
		overrideHistoricalRecords: false,
		overrideAlerts: false,
	},
	apiLimit: 500,
};

export const tradeConfig: ConfigTrade = {
	interval: Interval["5m"],
	lookBackLength: 200,
	maxTradeLength: 100,

	minSl: 2 / 100,
	tpSlRatio: 4,
	minSlTp: 4 / 100,

	riskPt: 0.25 / 100,
	minAmountToTradeUSDT: 6,
	leverage: 10,
	feePt: 0.0005,

	maxProtectedPositions: 1,
	maxHedgePositions: 20,

	breakEventAlerts: [
		{
			trigger: 5 / 100,
			break: 1 / 100,
			minLength: 5,
		},
	],
	apiLimit: 500,
	setLeverage: false,
};

export const strategies: Strategy[] = [rsiDivergency5m];
