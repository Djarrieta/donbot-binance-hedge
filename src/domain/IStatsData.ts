import type { PositionBT } from "./Position";
import type { Stat } from "./Stat";

export type IStatsData = {
	save: (stats: Stat) => void;
	getStats: () => Stat[];
	getWinningPairs: (props: GetWinningPairsStatsDataProps) => string[];
	getPositions: (props: GetPositionsStatsDataProps) => PositionBT[];
	showStats: () => void;
	deleteRows: () => void;
};

export type GetWinningPairsStatsDataProps = {
	sl: number;
	tp: number;
	maxTradeLength: number;
};

export type GetPositionsStatsDataProps = {
	sl: number;
	tp: number;
	maxTradeLength: number;
	column: "positionsWP" | "positionsAcc" | "positionsFwd" | "positions";
};
