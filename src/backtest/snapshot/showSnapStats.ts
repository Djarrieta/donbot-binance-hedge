import { formatPercent } from "../../utils/formatPercent";
import { getSortedSnapResults } from "./sortSnapResults";

export const showSnapStats = async () => {
	const sortedResults = await getSortedSnapResults();

	console.table(
		sortedResults.map((r) => ({
			sl: formatPercent(Number(r.sl)),
			tp: formatPercent(Number(r.tp)),
			maxTradeLength: Number(r.maxTradeLength),
			tradesQty: Number(r.tradesQty),
			avPnl: formatPercent(Number(r.accPnl) / Number(r.tradesQty)),
			winRate: formatPercent(Number(r.winRate)),
		}))
	);
	console.log("Winning pairs for the first result:");
	console.log(JSON.parse(sortedResults[0].winningPairs as string));
};

showSnapStats();
