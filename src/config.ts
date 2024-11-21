import { getDate, type DateString } from "./utils/getDate";
import { Interval } from "./domain/Interval";
import type { Strategy } from "./domain/Strategy";
import type { BacktestConfig } from "./domain/TradingStrategyTester";
import { rsiDivergency5m } from "./strategies/rsiDivergency5m";

export const DATA_BASE_NAME = "DB.db";

export const backtestConfig: BacktestConfig = {
	backtestStart: getDate("2024 11 17 12:45:00" as DateString).dateMs,
	backtestEnd: getDate("2024 11 20 03:10:00" as DateString).dateMs,
	forwardTestEnd: getDate("2024 11 21 00:00:00" as DateString).dateMs,
	interval: Interval["5m"],
	lookBackLength: 200,
	minAmountToTradeUSDT: 6,
	apiLimit: 500,
	slArray: [1 / 100],
	tpArray: [10 / 100],
	maxTradeLengthArray: [100],
	riskPt: 0.5 / 100,
	feePt: 0.0005,
	steps: {
		overrideHistoricalRecords: true,
		overrideAlerts: true,
	},
};

export const strategies: Strategy[] = [rsiDivergency5m];
