import type { Interval } from "../domain/Interval";
import type { PositionBT } from "../domain/Position";

type GetAccPositionsProps = { positions: PositionBT[]; interval: Interval };

export const getAccPositions = ({
	positions,
	interval,
}: GetAccPositionsProps) => {
	const positionsAcc = [];
	let lastAccClosedTime = 0;
	for (const position of positions) {
		if (position.startTime > lastAccClosedTime) {
			positionsAcc.push(position);
			lastAccClosedTime = position.secureLength
				? position.startTime + position.secureLength * interval
				: position.startTime + position.tradeLength * interval;
		}
	}
	return positionsAcc;
};
