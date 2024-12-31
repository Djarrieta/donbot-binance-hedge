import { Interval } from "./domain/Interval";
import type { PositionBT } from "./domain/Position";
import { monteCarloAnalysis } from "./utils/monteCarloAnalysis";

export const getStats = (positions: PositionBT[]) => {
	if (positions.length === 0) {
		return {
			winRate: 0,
			accPnl: 0,
			avPnl: 0,
			avPnlPerDay: 0,
			avPosPerDay: 0,
			drawdownMonteCarlo: 0,
			badRunMonteCarlo: 0,
		};
	}
	const start = positions[0].startTime;
	const end = positions[positions.length - 1].startTime;
	const totalDays = (end - start) / Interval["1d"];

	const tradesQty = positions.length;
	const winningPositions = positions.filter((p) => p.pnl > 0);
	const lostPositions = positions.filter((p) => p.pnl < 0);
	const winRate =
		winningPositions.length / (winningPositions.length + lostPositions.length);
	const accPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
	const avPnl = accPnl / tradesQty || 0;
	const avPnlPerDay = accPnl / totalDays;
	const avPosPerDay = tradesQty / totalDays;

	const { drawdownMonteCarlo, badRunMonteCarlo } = monteCarloAnalysis({
		values: positions.map((p) => p.pnl),
		confidenceLevel: 0.95,
		amountOfSimulations: 1000,
	});

	return {
		winRate,
		accPnl,
		avPnl,
		avPnlPerDay,
		avPosPerDay,
		drawdownMonteCarlo,
		badRunMonteCarlo,
	};
};
