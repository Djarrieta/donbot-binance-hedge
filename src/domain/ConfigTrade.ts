import type { BreakEventAlert } from "./BreakEvenAlert";
import type { Interval } from "./Interval";

export type ConfigTrade = {
	interval: Interval;
	lookBackLength: number;
	minSl: number;
	tpSlRatio: number;
	minSlTp: number;
	riskPt: number;
	feePt: number;
	maxTradeLength: number;
	minAmountToTradeUSDT: number;
	apiLimit: number;
	maxProtectedPositions: number;
	maxHedgePositions: number;
	breakEventAlerts: BreakEventAlert[];
	leverage: number;
	setLeverage: boolean;
};
