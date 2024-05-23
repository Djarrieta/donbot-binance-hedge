import { db } from "../../db";
import { statsAccBT } from "../../schema";
import { formatPercent } from "../../utils/formatPercent";

export const showAccStats = async () => {
	const results = await db.select().from(statsAccBT);

	console.table(
		results
			.sort((a, b) => Number(b.tradesQty) - Number(a.tradesQty))
			.sort((a, b) => Number(b.winRate) - Number(a.winRate))
			.sort((a, b) => Number(a.minAccPnl) - Number(b.minAccPnl))
			.sort((a, b) => Number(b.maxDrawdown) - Number(a.maxDrawdown))
			.sort((a, b) => Number(b.accPnl) - Number(a.accPnl))
			.map((r) => ({
				sl: formatPercent(Number(r.sl)),
				tp: formatPercent(Number(r.tp)),
				maxTradeLength: Number(r.maxTradeLength),
				totalPositions: Number(r.tradesQty),
				maxAccPnl: formatPercent(Number(r.maxAccPnl)),
				minAccPnl: formatPercent(Number(r.minAccPnl)),
				accPnl: formatPercent(Number(r.accPnl)),
				maxDrawdown: formatPercent(Number(r.maxDrawdown)),
				winRate: formatPercent(Number(r.winRate)),
			}))
	);
};

showAccStats();
