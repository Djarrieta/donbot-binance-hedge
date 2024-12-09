import type { PositionBT } from "./Position";

export type WinningPair = {
	pair: string;
	avPnl: number;
	qty: number;
	winRate: number;
	accPnl: number;
	winRateAcc: number;
	accPnlAcc: number;
	avPnlAcc: number;
	drawdownAcc: number;
};

export type Stat = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
	positions: PositionBT[];

	winningPairs: WinningPair[];
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

	drawdownMC: number;
	badRunMC: number;
};
