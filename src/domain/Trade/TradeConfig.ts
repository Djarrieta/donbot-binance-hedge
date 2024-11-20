import type { Interval } from "../Interval";

export type TradeConfig = {
	interval: Interval;
	lookBackLength: number;
	sl: number;
	tp: number;
	riskPt: number;
	feePt: number;
	maxTradeLength: number;
	minAmountToTradeUSDT: number;
	apiLimit: number;
	maxProtectedPositions: number;
	maxHedgePositions: number;
	breakEventAlerts: { alert: number; value: number; len: number }[];
};
