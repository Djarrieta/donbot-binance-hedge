import cron from "node-cron";
import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import { updateSymbolList } from "./services/updateSymbolList";
import { checkCandlestick } from "./utils/checkCandlestick";
import { delay } from "./utils/delay";

const context = await Context.getInstance();
context.symbolList = await getSymbolList();

for (const symbol of context.symbolList) {
	updateSymbolList({ pair: symbol.pair, interval: Context.interval });
}

cron.schedule("*/1 * * * *", async () => {
	await delay(1000);
	// Check trades

	for (const symbolList of context.symbolList) {
		const { candlestick, pair } = symbolList;
		const isOk = checkCandlestick({ candlestick });
		if (!isOk) {
			console.log(pair);
		}
	}
});
