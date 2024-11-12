import type { PositionBT } from "./Position";

export type Stat = {
	sl: number;
	tp: number;
	maxTradeLength: number;
	positions: PositionBT[];

	winningPairs: string[];
	positionsWP: PositionBT[];
	positionsAcc: PositionBT[];
	positionsFwd: PositionBT[];

	winRateWP: number;
	winRateAcc: number;
	winRateFwd: number;

	avPnlWP: number;
	avPnlAcc: number;
	avPnlFwd: number;

	accPnlWP: number;
	accPnlAcc: number;
	accPnlFwd: number;
};
