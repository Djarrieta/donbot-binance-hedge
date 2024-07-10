import { formatPercent } from "../../utils/formatPercent";
import { getSortedAccResults } from "./sortAccResults";

export const showAccStats = async () => {
	const sortedResults = await getSortedAccResults();

	console.table(
		sortedResults.map((r) => ({
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
};

showAccStats();
