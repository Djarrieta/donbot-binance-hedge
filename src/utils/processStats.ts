import { Interval } from "../domain/Interval";
import type { PositionBT } from "../domain/Position";
import type { Strategy } from "../domain/Strategy";
import { getDrawdown } from "./getDrawdown";
import { monteCarloAnalysis } from "./monteCarloAnalysis";

type ProcessStatsProps = {
	positions: PositionBT[];
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
	strategies: Strategy[];
	interval: Interval;
};

export const processStats = ({
	positions,
	sl,
	tpSlRatio,
	maxTradeLength,
	strategies,
	interval,
}: ProcessStatsProps) => {
	const pairsInStrategies = Array.from(
		new Set(strategies.map((s) => s.allowedPairs).flat())
	) as string[];

	const pairList = pairsInStrategies.length
		? pairsInStrategies
		: new Set<string>(positions.map((p) => p.pair));

	let winningPairs: string[] = [];

	for (const pair of pairList) {
		const positionsForPair = positions.filter((pos) => pos.pair === pair);
		const positionsForPairAcc = getAccPositions({
			positions: positionsForPair,
			interval,
		});

		const { avPnl } = getStats(positionsForPair);
		const { avPnl: avPnlAcc } = getStats(positionsForPairAcc);

		if (avPnl > 0 && avPnlAcc > 0) {
			winningPairs.push(pair);
		}
	}

	const positionsAcc = getAccPositions({
		positions,
		interval,
	});

	const { winRate, accPnl, avPnl, avPnlPerDay, avPosPerDay } =
		getStats(positions);

	const {
		winRate: winRateAcc,
		accPnl: accPnlAcc,
		avPnl: avPnlAcc,
		drawdownMonteCarlo: drawdownMonteCarloAcc,
		badRunMonteCarlo: badRunMonteCarloAcc,
		drawdown: drawdownAcc,
		badRun: badRunAcc,
	} = getStats(positionsAcc);

	return {
		sl,
		tpSlRatio,
		maxTradeLength,

		positions,
		winningPairs,

		winRate,
		winRateAcc,

		avPnl,
		avPnlAcc,

		accPnl,
		accPnlAcc,

		drawdownAcc,
		badRunAcc,
		drawdownMonteCarloAcc,
		badRunMonteCarloAcc,
		avPnlPerDay,
		avPosPerDay,
	};
};

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

	const { drawdown, badRun } = getDrawdown({
		pnlArray: positions.map((p) => p.pnl),
	});

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
		drawdown,
		badRun,
	};
};
