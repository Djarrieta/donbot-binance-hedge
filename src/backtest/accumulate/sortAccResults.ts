import { db } from "../../db";
import { statsAccBT } from "../../schema";

export const getSortedAccResults = async () => {
	const results = await db.select().from(statsAccBT);

	const sortedResults = results
		.sort((a, b) => Number(b.tradesQty) - Number(a.tradesQty))
		.sort((a, b) => Number(b.winRate) - Number(a.winRate))
		.sort((a, b) => Number(a.minAccPnl) - Number(b.minAccPnl))
		.sort((a, b) => Number(b.minDrawdown) - Number(a.minDrawdown))
		.sort((a, b) => Number(b.accPnl) - Number(a.accPnl));

	return sortedResults;
};
