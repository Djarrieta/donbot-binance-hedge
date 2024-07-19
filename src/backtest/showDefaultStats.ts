import { params } from "../Params";
import { formatPercent } from "../utils/formatPercent";
import { getDate, type DateString } from "../utils/getDate";
import { getSortedAccResults } from "./accumulate/sortAccResults";
import { showBacktestData } from "./showBacktestData";
import { getSortedSnapResults } from "./snapshot/sortSnapResults";

export const showDefaultStats = async () => {
	const snapSortedResults = await getSortedSnapResults();
	const snapFilteredResults = snapSortedResults.filter(
		(s) =>
			s.sl === params.defaultSL &&
			s.tp === params.defaultTP &&
			s.maxTradeLength === params.maxTradeLength
	);

	const accResults = await getSortedAccResults();
	const filteredAccResults = accResults.filter(
		(s) =>
			s.sl === params.defaultSL &&
			s.tp === params.defaultTP &&
			s.maxTradeLength === params.maxTradeLength
	);

	type ClosedPosition = {
		pair: string;
		startTime: DateString;
		endTime: DateString;
		positionSide: string;
		pnl: string;
		accPnl: string;
		entryPrice: string;
		stgName: string;
	};

	const closedPositions: ClosedPosition[] = filteredAccResults.length
		? JSON.parse(filteredAccResults[0].closedPositions as string).map(
				(c: any) => {
					return {
						pair: c.pair,
						startTime: getDate(c.startTime).dateString,
						endTime: getDate(c.endTime).dateString,
						positionSide: c.positionSide,
						pnl: formatPercent(Number(c.pnl)),
						accPnl: formatPercent(Number(c.accPnl)),
						entryPrice: Number(c.entryPriceUSDT).toFixed(2),
						stgName: c.stgName,
					};
				}
		  )
		: [];
	closedPositions
		.sort((a, b) => a.pair.localeCompare(b.pair))
		.sort((a, b) => a.startTime.localeCompare(b.startTime));

	showBacktestData();
	console.table({
		tp: formatPercent(params.defaultTP),
		sl: formatPercent(params.defaultSL),
		maxTradeLength: params.maxTradeLength,
		risk: formatPercent(params.riskPt),
	});

	console.log("Snapshot");
	console.table(
		snapFilteredResults.map((r) => ({
			sl: formatPercent(Number(r.sl)),
			tp: formatPercent(Number(r.tp)),
			maxTradeLength: Number(r.maxTradeLength),
			tradesQty: Number(r.tradesQty),
			avPnl: formatPercent(Number(r.accPnl) / Number(r.tradesQty)),
			winRate: formatPercent(Number(r.winRate)),
		}))
	);

	console.log("Accumulated");
	console.table(
		filteredAccResults.map((r) => ({
			sl: formatPercent(Number(r.sl)),
			tp: formatPercent(Number(r.tp)),
			maxTradeLength: Number(r.maxTradeLength),
			tradesQty: Number(r.tradesQty),
			maxAccPnl: formatPercent(Number(r.maxAccPnl)),
			minAccPnl: formatPercent(Number(r.minAccPnl)),
			accPnl: formatPercent(Number(r.accPnl)),
			drawdown: formatPercent(Number(r.drawdown)),
			drawdownMonteCarlo: formatPercent(Number(r.drawdownMonteCarlo)),
			badRunMonteCarlo: r.badRunMonteCarlo,
			winRate: formatPercent(Number(r.winRate)),
			avTradeLength: Number(r.avTradeLength).toFixed(2),
		}))
	);
	console.table(closedPositions);
	console.log("Winning pairs:");
	if (snapFilteredResults.length) {
		console.log(JSON.parse(snapFilteredResults[0].winningPairs as string));
	}
};
showDefaultStats();
