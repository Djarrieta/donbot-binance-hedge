import { getAccStatsBTService } from "../services";

export const getSortedAccResults = async () => {
	const results = getAccStatsBTService();

	const sortedResults = results
		.sort((a, b) => Number(b.tradesQty) - Number(a.tradesQty))
		.sort((a, b) => Number(b.winRate) - Number(a.winRate))
		.sort((a, b) => Number(a.minAccPnl) - Number(b.minAccPnl))
		.sort((a, b) => Number(b.drawdownMonteCarlo) - Number(a.drawdownMonteCarlo))
		.sort((a, b) => Number(b.accPnl) - Number(a.accPnl));

	return sortedResults;
};
