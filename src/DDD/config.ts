import { getDate, type DateString } from "../utils/getDate";
import { Interval } from "./domain/Interval";
import type { Strategy } from "./domain/Strategy";
import type { BacktestConfig } from "./domain/TradingStrategyTester";
import { rsiDivergency5m } from "./strategies/rsiDivergency5m";

export const backtestConfig: BacktestConfig = {
	backtestStart: getDate("2024 10 29 00:00:00" as DateString).dateMs,
	backtestEnd: getDate("2024 11 05 00:00:00" as DateString).dateMs,
	forwardTestEnd: getDate("2024 11 08 00:00:00" as DateString).dateMs,
	interval: Interval["5m"],
	lookBackLength: 200,
	minAmountToTradeUSDT: 6,
	apiLimit: 500,
	slArray: [1 / 100],
	tpArray: [5 / 100],
	maxTradeLengthArray: [100],
	riskPt: 0.5 / 100,
	feePt: 0.0005,
};

export const strategies: Strategy[] = [rsiDivergency5m];
