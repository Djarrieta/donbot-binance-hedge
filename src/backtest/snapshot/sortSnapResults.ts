import { db } from "../../db/db";
import { statsSnapBT } from "../../db/schema";

export const getSortedSnapResults = async () => {
	const results = await db.select().from(statsSnapBT);

	const sortedResults = results
		.sort((a, b) => Number(b.tradesQty) - Number(a.tradesQty))
		.sort((a, b) => Number(b.winRate) - Number(a.winRate))
		.sort((a, b) => Number(b.accPnl) - Number(a.accPnl));

	return sortedResults;
};
