import cron from "node-cron";
import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import { updateSymbolList } from "./services/updateSymbolList";
import { delay } from "./utils/delay";

const context = await Context.getInstance();
context.symbolList = await getSymbolList();

const { pair, candlestick } = context.symbolList[0];
console.log({ pair, candlestick });

for (const symbol of context.symbolList) {
	updateSymbolList({ pair: symbol.pair, interval: Context.interval });
}

cron.schedule("*/1 * * * *", async () => {
	await delay(1000);
	const { pair, candlestick, currentPrice } = context.symbolList[0];
	console.log({ pair, candlestick, currentPrice });
});
