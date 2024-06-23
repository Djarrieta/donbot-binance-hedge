import { snapshot } from ".";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";

const results = await snapshot({
	log: false,
});
if (results) {
	const { closedPositions, winningPairs, ...r } = results;

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

	console.log("Winning pairs for the first result:");
	console.log(JSON.parse(winningPairs as string));
}

// ┌────────────────┬────────┐
// │                │ Values │
// ├────────────────┼────────┤
// │ maxTradeLength │ 450    │
// │             sl │ 10.00% │
// │             tp │ 7.00%  │
// │      tradesQty │ 37087  │
// │          avPnl │ 1.07%  │
// │  avTradeLength │ 320.0  │
// │        winRate │ 62.00% │
// └────────────────┴────────┘
