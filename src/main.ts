import cron from "node-cron";
import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import { getUserList } from "./services/getUserList";
import { updateSymbolList } from "./services/updateSymbolList";
import { checkForTrades } from "./useCase/checkForTrades";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";

console.log(
	getDate({}).dateString,
	"Starting in " + Context.branch + " branch..."
);
const context = await Context.getInstance();

context.userList = await getUserList();
console.log(getDate({}).dateString, "User list updated!");

context.symbolList = await getSymbolList();
console.log(getDate({}).dateString, "Symbol list updated!");

for (const symbol of context.symbolList) {
	updateSymbolList({ pair: symbol.pair, interval: Context.interval });
}

cron.schedule("*/1 * * * *", async () => {
	// Check trades
	await delay(1000);

	await checkForTrades();
});
