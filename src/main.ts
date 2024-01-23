import cron from "node-cron";
import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import { getUserList } from "./services/getUserList";
import { updateSymbol } from "./services/updateSymbol";
import { checkForTrades } from "./useCase/checkForTrades";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";
import { getCandlestick } from "./services/getCandlestick";
import { checkCandlestick } from "./utils/checkCandlestick";

console.log(
	getDate({}).dateString,
	"Starting in " + Context.branch + " branch..."
);
const context = await Context.getInstance();

await getSymbolList();
console.log(getDate({}).dateString, "Symbol list updated!");

context.userList = await getUserList();
console.log(getDate({}).dateString, "User list updated!");

cron.schedule("*/1 * * * *", async () => {
	await delay(1000);

	const readySymbols = context.symbolList.filter((s) => s.isReady);
	console.log(
		"Users: " + context.userList.map((u) => u.name?.split(" ")[0]).join(", ")
	);

	await checkForTrades({ readySymbols });

	for (let index = 0; index < context.symbolList.length; index++) {
		const symbol = context.symbolList[index];

		const isOk = checkCandlestick({ candlestick: symbol.candlestick });
		if (!isOk) {
			const candlestick = await getCandlestick({
				pair: symbol.pair,
				lookBackLength: Context.lookBackLength,
				interval: Context.interval,
			});

			context.symbolList[index] = {
				...context.symbolList[index],
				currentPrice: candlestick[candlestick.length - 1].close,
				candlestick,
				isReady: true,
			};
			updateSymbol({ pair: symbol.pair, interval: Context.interval });
		}
	}
});
