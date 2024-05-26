import { snapshot } from ".";
import { chosenStrategies } from "../../strategies";
import { formatPercent } from "../../utils/formatPercent";

const { closedPositions, winningPairs, ...r } = await snapshot({
	log: false,
});

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

// ┌────────────────┬────────┐
// │                │ Values │
// ├────────────────┼────────┤
// │ maxTradeLength │ 300    │
// │             sl │ 10.00% │
// │             tp │ 10.00% │
// │      tradesQty │ 4788   │
// │          avPnl │ 2.88%  │
// │  avTradeLength │ 216.0  │
// │        winRate │ 66.75% │
// └────────────────┴────────┘
