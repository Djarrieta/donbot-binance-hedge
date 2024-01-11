import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import { updateSymbolList } from "./services/updateSymbolList";

const context = await Context.getInstance();
context.symbolList = await getSymbolList();

for (const symbol of context.symbolList) {
	updateSymbolList({ pair: symbol.pair, interval: Context.interval });
}

console.log(...context.symbolList.map((s) => s.pair));
setInterval(() => {
	const s = context.symbolList.find((s) => s.pair === "XRPUSDT");
	console.log(s?.pair + "-" + s?.currentPrice);
}, 1000);
