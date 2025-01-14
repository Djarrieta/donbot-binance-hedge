import type { ConfigBacktest } from "./domain/ConfigBacktest";
import type { ConfigTrade } from "./domain/ConfigTrade";
import { Interval } from "./domain/Interval";
import type { Strategy } from "./domain/Strategy";
import { getDate, type DateString } from "./utils/getDate";
import { getSuggestedDates } from "./utils/getSuggestedDates";

import { stg as rsiDivergency5m } from "./strategies/rsiDivergency5m";

const interval = Interval["5m"];
const { backtestStart, backtestEnd, forwardTestEnd } = getSuggestedDates({
	candleCount: 300000,
	backtestPercent: 0.75,
	interval,
	lastDate: getDate().dateMs,
});

export const DATA_BASE_NAME = "./db/letsSee.db";
export const strategies: Strategy[] = [rsiDivergency5m];
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

	maxSlArray: [4 / 100, 5 / 100, 6 / 100, 7 / 100],
	tpSlRatioArray: [5, 6, 7],
	minSlTp: 1 / 100,
	breakEventAlerts: [],

	steps: {
		overrideHistoricalRecords: false,
		overrideAlerts: false,
	},
	apiLimit: 500,
};
export const tradeConfig: ConfigTrade = {
	interval,
	lookBackLength: 200,
	maxTradeLength: 100,

	maxSl: 6 / 100,
	tpSlRatio: 6,
	minSlTp: 1 / 100,
	breakEventAlerts: [
		{
			trigger: 7 / 100,
			break: 1 / 100,
			minLength: 3,
		},
	],

	riskPt: 0.25 / 100,
	minAmountToTradeUSDT: 6,
	feePt: 0.0005,

	leverage: 10,
	setLeverage: false,

	maxProtectedPositions: 1,
	maxHedgePositions: 20,

	apiLimit: 500,
};
