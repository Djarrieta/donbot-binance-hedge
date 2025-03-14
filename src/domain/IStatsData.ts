import type { PositionBT } from "./Position";
import type { Stat } from "./Stat";

export type IStatsData = {
	save: (stats: Stat) => void;
	getStats: () => Stat[];
	getPositions: (props: GetPositionsStatsDataProps) => PositionBT[];
	showStats: () => void;
	deleteRows: () => void;
};

export type GetWinningPairsStatsDataProps = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
};

export type GetPositionsStatsDataProps = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
	column: "positionsWP" | "positionsAcc" | "positionsFwd" | "positions";
};
