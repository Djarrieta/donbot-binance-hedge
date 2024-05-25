import { formatPercent } from "../../utils/formatPercent";
import { getDate, type DateString } from "../../utils/getDate";
import { getSortedAccResults } from "./sortAccResults";

export const showAccClosedPosStats = async () => {
	const sortedResults = await getSortedAccResults();
	console.log("Accumulated data saved for " + sortedResults.length + " pairs.");

	type ClosedPosition = {
		pair: string;
		startTime: DateString;
		endTime: DateString;
		positionSide: string;
		pnl: string;
		entryPrice: string;
		stgName: string;
	};

	const closedPositions: ClosedPosition[] = JSON.parse(
		sortedResults[0].closedPositions as string
	).map((c: any) => {
		return {
			pair: c.pair,
			startTime: getDate(c.startTime).dateString,
			endTime: getDate(c.endTime).dateString,
			positionSide: c.positionSide,
			pnl: formatPercent(Number(c.pnl)),
			entryPrice: Number(c.entryPriceUSDT).toFixed(2),
			stgName: c.stgName,
		};
	});
	closedPositions
		.sort((a, b) => a.pair.localeCompare(b.pair))
		.sort((a, b) => a.startTime.localeCompare(b.startTime));

	console.table(closedPositions);
};
showAccClosedPosStats();
