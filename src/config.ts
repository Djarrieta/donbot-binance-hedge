import { Interval } from "./domain/Interval";
import type { Strategy } from "./domain/Strategy";
import type { TradeConfig } from "./domain/TradeConfig";
import type { BacktestConfig } from "./domain/TradingStrategyTester";
import { rsiDivergency5m } from "./strategies/rsiDivergency5m";
import { getSuggestedDates } from "./utils/getSuggestedDates";

export const DATA_BASE_NAME = "DB.db";

const interval = Interval["5m"];
const { backtestStart, backtestEnd, forwardTestEnd } = getSuggestedDates({
	candleCount: 200000,
	backtestPercent: 0.75,
	interval,
});

export const backtestConfig: BacktestConfig = {
	backtestStart,
	backtestEnd,
	forwardTestEnd,
	interval,
	lookBackLength: 200,
	minAmountToTradeUSDT: 6,
	apiLimit: 500,
	slArray: [1 / 100],
	tpArray: [10 / 100],
	maxTradeLengthArray: [100],
	riskPt: 0.25 / 100,
	feePt: 0.0005,
	steps: {
		overrideHistoricalRecords: true,
		overrideAlerts: true,
	},
};

export const tradeConfig: TradeConfig = {
	interval: Interval["5m"],
	lookBackLength: 200,
	sl: 1 / 100,
	tp: 10 / 100,
	riskPt: 0.25 / 100,
	feePt: 0.0005,
	maxTradeLength: 100,
	minAmountToTradeUSDT: 6,
	apiLimit: 500,
	maxProtectedPositions: 1,
	maxHedgePositions: 20,
	breakEventAlerts: [],
};

export const strategies: Strategy[] = [rsiDivergency5m];
