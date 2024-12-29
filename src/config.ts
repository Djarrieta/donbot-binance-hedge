import type { ConfigBacktest } from "./domain/ConfigBacktest";
import type { ConfigTrade } from "./domain/ConfigTrade";
import { Interval } from "./domain/Interval";
import type { Strategy } from "./domain/Strategy";
import { getDate, type DateString } from "./utils/getDate";
import { getSuggestedDates } from "./utils/getSuggestedDates";

import { stg as rsiDivergency5m } from "./strategies/rsiDivergency5m";
import { stg as rsiDivergency15m } from "./strategies/rsiDivergency15m";
import { stg as supertrend5m } from "./strategies/supertrend5m";
import { stg as mfiDivergency5m } from "./strategies/mfiDivergency5m";

const interval = Interval["5m"];
const { backtestStart, backtestEnd, forwardTestEnd } = getSuggestedDates({
	candleCount: 160000,
	backtestPercent: 0.75,
	interval,
	lastDate: getDate("2024 12 26 00:00:00" as DateString).dateMs,
});

export const DATA_BASE_NAME = "./db/rsiDivergency5m_2.db";
export const strategies: Strategy[] = [rsiDivergency5m];
export const backtestConfig: ConfigBacktest = {
	backtestStart,
	backtestEnd,
	forwardTestEnd,
	interval,
	lookBackLength: 200,
	maxTradeLengthArray: [100],
	winningPairsOnly: false,

	minAmountToTradeUSDT: 6,
	leverage: 2,
	balanceUSDT: 25.2,
	feePt: 0.0005,

	maxSlArray: [5 / 100],
	tpSlRatioArray: [3],
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

	maxSl: 5 / 100,
	tpSlRatio: 3,
	minSlTp: 1 / 100,

	riskPt: 0.25 / 100,
	minAmountToTradeUSDT: 6,
	feePt: 0.0005,

	leverage: 10,
	setLeverage: false,

	maxProtectedPositions: 1,
	maxHedgePositions: 20,

	breakEventAlerts: [],
	apiLimit: 500,
};
