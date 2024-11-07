import type { PositionBT } from "./Position";

export type Stat = {
	sl: number;
	tp: number;
	maxTradeLength: number;
	positions: PositionBT[];
	winningPairs: string[];
	positionsWP: PositionBT[];

	winRateWP: number;
	avPnlWP: number;
	winRateAcc: number;
	avPnlAcc: number;

	positionsAcc: PositionBT[];
};
