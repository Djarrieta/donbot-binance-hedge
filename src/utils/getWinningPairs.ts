import type { Interval } from "../domain/Interval";
import type { PositionBT } from "../domain/Position";
import { getStats } from "../getStats";
import { getAccPositions } from "./getAccPositions";

type GetWinningPairsProps = {
	positions: PositionBT[];
	pairList: string[];
	interval: Interval;
};
export const getWinningPairs = ({
	positions,
	pairList,
	interval,
}: GetWinningPairsProps) => {
	const winningPairs: string[] = [];

	for (const pair of pairList) {
		const positionsPerPair = positions.filter((pos) => pos.pair === pair);
		const { avPnl } = getStats(positionsPerPair);

		const accPositions = getAccPositions({
			positions: positionsPerPair,
			interval,
		});
		const { avPnl: avPnlAcc } = getStats(accPositions);

		if (avPnl > 0 && avPnlAcc > 0) {
			winningPairs.push(pair);
		}
	}

	return winningPairs;
};
