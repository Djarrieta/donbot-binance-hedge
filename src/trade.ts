import cron from "node-cron";
import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import { getSymbolListVolatility } from "./services/getSymbolListVolatility";
import { getUserList } from "./services/getUserList";
import { markUnreadySymbols } from "./services/markUnreadySymbols";
import { updateUnreadySymbols } from "./services/updateUnreadySymbols";
import { checkForTrades } from "./services/checkForTrades";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";

console.log(
	getDate({}).dateString,
	"Starting in " + Context.branch + " branch..."
);
const context = await Context.getInstance();

console.log("");
await getSymbolList();
console.log(getDate({}).dateString, "Symbol list updated!");

console.log("");
context.userList = await getUserList();
console.log(getDate({}).dateString, "User list updated!");
console.log(
	"Users: " + context.userList.map((u) => u.name?.split(" ")[0]).join(", ")
);

cron.schedule("*/5 * * * *", async () => {
	await delay(2000);
	console.log("");
	console.log(getDate({}).dateString, "Checking for trades!");
	console.log(
		"Users: " + context.userList.map((u) => u.name?.split(" ")[0]).join(", ")
	);

	await markUnreadySymbols();
	await getSymbolListVolatility();

	const readySymbols = context.symbolList
		.filter((s) => s.isReady && !s.isLoading)
		.sort((a, b) => Number(b.volatility) - Number(a.volatility));

	const tradeArray = await checkForTrades({
		readySymbols,
	});

	if (tradeArray.length) {
		for (const user of context.userList) {
			console.log(
				"Should trade " +
					user.name +
					" " +
					tradeArray.map((s) => s.symbol.pair + " -> " + s.shouldTrade)
			);
		}
	} else {
		console.log(getDate({}).dateString, "No trades found");
	}

	await updateUnreadySymbols();
	context.userList = await getUserList();
});
