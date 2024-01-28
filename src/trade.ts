import cron from "node-cron";
import { Context } from "./models/Context";
import { checkForTrades } from "./services/checkForTrades";
import {
	getSymbolList,
	getSymbolListVolatility,
} from "./services/getSymbolList";
import { getUserList } from "./services/getUserList";
import { manageAccounts } from "./services/manageAccounts";
import { markUnreadySymbols } from "./services/markUnreadySymbols";
import { openPosition } from "./services/openPosition";
import { updateUnreadySymbols } from "./services/updateUnreadySymbols";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";

export const trade = async () => {
	console.log(
		getDate({}).dateString,
		"Starting in " + Context.branch + " branch..."
	);
	const context = await Context.getInstance();

	await getSymbolList();
	console.log(
		getDate({}).dateString,
		context.symbolList.length + " symbols updated!"
	);

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
		context.symbolList.length + " symbols.";

		const readySymbols = context.symbolList
			.filter((s) => s.isReady && !s.isLoading)
			.sort((a, b) => Number(b.volatility) - Number(a.volatility));

		const tradeArray = await checkForTrades({
			readySymbols,
		});

		if (tradeArray.length) {
			tradeArray.length > 4
				? console.log(
						"+ Should trade " +
							tradeArray[0].symbol.pair +
							", " +
							tradeArray[1].symbol.pair +
							", ...(" +
							(tradeArray.length - 2) +
							" more) "
				  )
				: console.log(
						"+ Should trade " +
							tradeArray.map(
								(t) =>
									t.symbol.pair +
									" " +
									t.stgResponse.stgName +
									" -> " +
									t.stgResponse.shouldTrade +
									"; "
							)
				  );

			for (const user of context.userList) {
				for (const trade of tradeArray) {
					trade.stgResponse.shouldTrade &&
						openPosition({
							user,
							symbol: trade.symbol,
							shouldTrade: trade.stgResponse.shouldTrade,
							sl: trade.stgResponse.sl,
							tp: Number(trade.stgResponse.tp),
							tr: Number(trade.stgResponse.tr),
							callback: Number(trade.stgResponse.sl),
						});
				}
			}
		} else {
			console.log("No trades found");
		}
		await updateUnreadySymbols();
		await delay(5000);
		context.userList = await getUserList();
		for (const user of context.userList) {
			manageAccounts({ user });
		}
		context.userList = await getUserList();
	});
};

trade();
