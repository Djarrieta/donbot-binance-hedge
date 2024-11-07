import type { PositionBT } from "./Position";

export type Stat = {
	sl: number;
	tp: number;
	maxTradeLength: number;
	positions: PositionBT[];
	winningPairs: string[];
	positionsWP: PositionBT[];

	tradesQtyWP: number;
	winRateWP: number;
	avPnlWP: number;
	tradesQtyAcc: number;
	winRateAcc: number;
	avPnlAcc: number;

	positionsAcc: PositionBT[];
};
