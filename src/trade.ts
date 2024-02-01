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
import { CronInterval } from "./models/Interval";
import { positionClean } from "./services/positionClean";

import Binance from "binance-api-node";
import { positionProtect } from "./services/positionProtect";
import { positionOpen } from "./services/positionOpen";
import { subscribeToUserUpdates } from "./services/subscribeToUserUpdates";
import { positionManageNew } from "./services/positionManageNew";
import { positionKeep } from "./services/positionKeep";

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

	///test start
	const symbol = context.symbolList.find((s) => s.pair === "AGLDUSDT");
	if (!symbol) return;

	const authExchange = Binance({
		apiKey: context.userList[0].key,
		apiSecret: context.userList[0].secret || "",
	});

	await positionKeep({
		authExchange,
		symbol: symbol,
		tp: Context.defaultTP,
		sl: Context.defaultSL,
		shouldTrade: "LONG",
		quantity: "5",
		price: symbol.currentPrice,
	});

	// await positionOpen({
	// 	authExchange,
	// 	symbol: symbol,
	// 	tp: Context.defaultTP,
	// 	sl: Context.defaultSL,
	// 	shouldTrade: "LONG",
	// 	quantity: "5",
	// 	price: symbol.currentPrice,
	// });

	// await positionProtect({
	// 	authExchange,
	// 	symbol: symbol,
	// 	tp: Context.defaultTP,
	// 	sl: Context.defaultSL,
	// 	shouldTrade: "SHORT",
	// 	quantity: "10",
	// 	price: symbol.currentPrice,
	// });
	//positionClean({ authExchange, symbol: symbol[0] });
	return;
	for (const user of context.userList) {
		manageAccounts({ user });
	}

	cron.schedule(CronInterval["1m"], async () => {
		await delay(1000);
		console.log("");
		console.log(getDate({}).dateString, "Checking for trades!");
		console.log(
			"Users: " + context.userList.map((u) => u.name?.split(" ")[0]).join(", ")
		);

		await markUnreadySymbols();
		await getSymbolListVolatility();

		const readySymbols = [...context.symbolList]
			.filter((s) => s.isReady && !s.isLoading)
			.sort((a, b) => Number(b.volatility) - Number(a.volatility));

		const { text: tradeArrayText, tradeArray } = await checkForTrades({
			readySymbols,
		});

		if (tradeArray.length) {
			console.log(tradeArrayText);

			for (const user of context.userList) {
				for (const trade of tradeArray) {
					trade.stgResponse.shouldTrade &&
						positionManageNew({
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
