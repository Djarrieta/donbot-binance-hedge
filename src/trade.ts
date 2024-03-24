import cron from "node-cron";
import { updateStrategyStat } from "./backtest";
import { Context } from "./models/Context";
import { CronInterval } from "./models/Interval";
import { checkForTrades } from "./services/checkForTrades";
import {
	getSymbolList,
	getSymbolListVolatility,
} from "./services/getSymbolList";
import { getUserList } from "./services/getUserList";
import { markUnreadySymbols } from "./services/markUnreadySymbols";
import { positionManageExisting } from "./services/positionManageExisting";
import { positionManageNew } from "./services/positionManageNew";
import { subscribeToSymbolUpdates } from "./services/subscribeToSymbolUpdates";
import { updateUnreadySymbols } from "./services/updateUnreadySymbols";
import { chosenStrategies } from "./strategies";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";
import { subscribeToUserUpdates } from "./services/subscribeToUserUpdates";

export const trade = async () => {
	await startModel();

	cron.schedule(CronInterval["4h"], async () => {
		await startModel();
	});

	cron.schedule(CronInterval["5m"], async () => {
		try {
			const context = await Context.getInstance();
			await delay(1000);
			console.log("");
			console.log(getDate().dateString, "Checking for trades!");

			await markUnreadySymbols();
			await getSymbolListVolatility();

			const readySymbols = [...context.symbolList]
				.filter((s) => s.isReady && !s.isLoading)
				.sort((a, b) => Number(b.volatility) - Number(a.volatility));

			const { text: tradeArrayText, tradeArray } = await checkForTrades({
				readySymbols,
				interval: Context.interval,
				strategyStats: context.strategyStats,
				chosenStrategies,
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
							});
					}
				}
			} else {
				console.log("No trades found");
			}

			await delay(5000);
			context.userList = await getUserList();
			for (const user of context.userList) {
				positionManageExisting({ user });
			}
			context.userList = await getUserList();
			for (const user of context.userList) {
				console.log(user.text);
			}
		} catch (_) {}
	});

	cron.schedule(CronInterval["15m"], async () => {
		try {
			console.log("");
			console.log(getDate().dateString, "Updating symbols");
			await updateUnreadySymbols();
		} catch (_) {}
	});

	const context = await Context.getInstance();

	for (const symbol of context.symbolList) {
		subscribeToSymbolUpdates({ pair: symbol.pair, interval: Context.interval });
	}

	for (const user of context.userList) {
		subscribeToUserUpdates({ user });
	}
};

const startModel = async () => {
	try {
		Context.resetInstance();

		const context = await Context.getInstance();
		console.log(
			getDate().dateString,
			"Getting values for " + Context.branch + " branch..."
		);

		context.symbolList = await getSymbolList();
		console.log(
			getDate().dateString,
			context.symbolList.length + " symbols updated!"
		);

		context.userList = await getUserList();
		console.log(getDate().dateString, "User list updated!");
		console.log(
			"Users: " + context.userList.map((u) => u.name?.split(" ")[0]).join(", ")
		);

		for (const user of context.userList) {
			await positionManageExisting({ user });
		}
		for (const user of context.userList) {
			console.log(user.text);
		}

		updateStrategyStat();
	} catch (_) {}
};

trade();
