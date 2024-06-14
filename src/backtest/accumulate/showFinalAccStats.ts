import { accumulate } from ".";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";

const results = await accumulate({
	log: false,
});

if (results) {
	const { closedPositions, ...r } = results;

	console.log(chosenStrategies.map((s) => s.stgName).join(", "));
	console.table({
		maxTradeLength: r.maxTradeLength,
		sl: formatPercent(Number(r.sl)),
		tp: formatPercent(Number(r.tp)),
		tradesQty: r.tradesQty,
		avPnl: formatPercent(Number(r.avPnl)),
		avTradeLength: Number(r.avTradeLength).toFixed(1),
		winRate: formatPercent(Number(r.winRate)),
	});
}

// ┌────────────────┬────────┐
// │                │ Values │
// ├────────────────┼────────┤
// │ maxTradeLength │ 300    │
// │             sl │ 10.00% │
// │             tp │ 10.00% │
// │      tradesQty │ 71     │
// │          avPnl │ 0.09%  │
// │  avTradeLength │ 227.1  │
// │        winRate │ 52.11% │
// └────────────────┴────────┘
