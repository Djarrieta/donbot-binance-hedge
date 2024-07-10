import { getSnapStatsBTService } from "../services";

export const getSortedSnapResults = async () => {
	const results = getSnapStatsBTService();

	const sortedResults = results
		.sort((a, b) => Number(b.tradesQty) - Number(a.tradesQty))
		.sort((a, b) => Number(b.winRate) - Number(a.winRate))
		.sort((a, b) => Number(b.accPnl) - Number(a.accPnl));

	return sortedResults;
};
