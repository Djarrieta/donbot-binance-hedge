import { db } from "../../db";
import { statsSnapBT } from "../../schema";
import { formatPercent } from "../../utils/formatPercent";

export const showSnapStats = async () => {
	const results = await db.select().from(statsSnapBT);

	console.table(
		results
			.sort((a, b) => Number(b.tradesQty) - Number(a.tradesQty))
			.sort((a, b) => Number(b.winRate) - Number(a.winRate))
			.sort((a, b) => Number(b.accPnl) - Number(a.accPnl))
			.map((r) => ({
				sl: formatPercent(Number(r.sl)),
				tp: formatPercent(Number(r.tp)),
				maxTradeLength: Number(r.maxTradeLength),
				totalPositions: Number(r.tradesQty),
				accPnl: formatPercent(Number(r.accPnl)),
				winRate: formatPercent(Number(r.winRate)),
			}))
	);
	console.log(JSON.parse(results[0].winningPairs as string));
};

showSnapStats();
