import type { BreakEventAlert } from "./BreakEvenAlert";
import type { Interval } from "./Interval";

export type ConfigBacktest = {
	backtestStart: number;
	backtestEnd: number;
	forwardTestEnd: number;
	interval: Interval;
	lookBackLength: number;
	maxSlArray: number[];
	tpSlRatioArray: number[];
	minSlTp: number;
	feePt: number;
	maxTradeLengthArray: number[];
	minAmountToTradeUSDT: number;
	apiLimit: number;
	breakEventAlerts: BreakEventAlert[];
	steps: {
		overrideHistoricalRecords: boolean;
		overrideAlerts: boolean;
	};
	leverage: number;
	balanceUSDT: number;
	winningPairsOnly: boolean;
};
