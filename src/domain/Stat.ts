import type { PositionBT } from "./Position";

export type Stat = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;

	positions: PositionBT[];

	winRate: number;
	winRateAcc: number;
	winRateFwd: number;

	avPnl: number;
	avPnlAcc: number;
	avPnlFwd: number;

	accPnl: number;
	accPnlAcc: number;
	accPnlFwd: number;

	drawdown: number;
	badRun: number;
	drawdownMC: number;
	badRunMC: number;
	avPnlPerDay: number;
	avPosPerDay: number;
};
