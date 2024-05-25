import { db } from "../../db";
import { statsSnapBT } from "../../schema";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";

export const showSnapClosedPosStats = async () => {
	const results = await db.select().from(statsSnapBT);
	const sortedResults = results
		.sort((a, b) => Number(b.tradesQty) - Number(a.tradesQty))
		.sort((a, b) => Number(b.winRate) - Number(a.winRate))
		.sort((a, b) => Number(b.accPnl) - Number(a.accPnl))
		.map((r) => ({
			closedPositions: JSON.parse(r.closedPositions as string),
		}));
	const closedPositions = sortedResults[0].closedPositions
		.sort(
			(a: any, b: any) =>
				getDate(b.startTime).dateMs - getDate(a.startTime).dateMs
		)
		.map((c: any) => {
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

	console.table(closedPositions);
};

showSnapClosedPosStats();
