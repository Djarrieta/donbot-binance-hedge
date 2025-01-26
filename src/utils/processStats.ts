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
	positions = positions.sort((a, b) => a.startTime - b.startTime);

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

		const { avPnl } = getAccStats(positionsForPair);
		const { avPnl: avPnlAcc, sharpeRatio } = getAccStats(positionsForPairAcc);

		if (avPnl > 0 && avPnlAcc > 0 && sharpeRatio > 0) {
			winningPairs.push(pair);
		}
	}

	const positionsAcc = getAccPositions({
		positions,
		interval,
	});

	const { winRate, accPnl, avPnl, start,
		end,
		totalDays } =
		getAccStats(positions);

	const {
		winRate: winRateAcc,
		accPnl: accPnlAcc,
		avPnl: avPnlAcc,
		drawdownMonteCarlo: drawdownMonteCarloAcc,
		badRunMonteCarlo: badRunMonteCarloAcc,
		drawdown: drawdownAcc,
		badRun: badRunAcc,
		sharpeRatio,
		avPnlPerDay, 
		avPosPerDay,
	} = getAccStats(positionsAcc);

	return {
		sl,
		tpSlRatio,
		maxTradeLength,

		positionsAcc,
		winningPairs,

		winRate,
		winRateAcc,

		avPnl,
		avPnlAcc,

		accPnl,
		accPnlAcc,

		drawdownAcc,
		drawdownMonteCarloAcc,

		badRunAcc,
		badRunMonteCarloAcc,

		sharpeRatio,
		avPnlPerDay, 
		avPosPerDay,
		start,
		end,
		totalDays 
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

export const getAccStats = (positions: PositionBT[]) => {
	if (positions.length === 0) {
		return {
			winRate: 0,
			accPnl: 0,
			avPnl: 0,
			avPnlPerDay: 0,
			avPosPerDay: 0,
			drawdownMonteCarlo: 0,
			badRunMonteCarlo: 0,
			sharpeRatio: 0
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

	const RISK_FREE_RATE = (5.4 / 100) / 365; // Using current 3-month T-Bill rate
	const stdDev = Math.sqrt(positions.map(p => p.pnl).reduce((acc, r) => acc + Math.pow(r - avPnlPerDay, 2), 0) / (tradesQty - 1));
	const sharpeRatio = (avPnlPerDay - RISK_FREE_RATE) / stdDev || 0;

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
		sharpeRatio,
		drawdownMonteCarlo,
		badRunMonteCarlo,
		drawdown,
		badRun,
		start,
		end,
		totalDays
	};
};
