import cron from "node-cron";
import { Context } from "./Context";
import { params } from "./Params";
import { CronInterval } from "./sharedModels/Interval";
import { getSymbolsData } from "./symbol/services/getSymbolsData";
import { subscribeToSymbolUpdates } from "./symbol/services/subscribeToSymbolUpdates";
import { getUsersData } from "./user/services/getUsersData";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";
import { chosenStrategies } from "./strategies";
import { subscribeToUserUpdates } from "./user/services/subscribeToUserUpdates";

const trade = async () => {
	//Start model
	{
		const symbolList = await getSymbolsData();
		const userList = await getUsersData();
		const context = await Context.getInstance({
			symbolList,
			userList,
			strategies: chosenStrategies,
		});
		console.log(getDate().dateString);

		if (!context) return;

		console.log(context.text());
		for (const user of context.userList) {
			await context.handleExistingPositions({ userName: user.name });
		}
	}

	//Check for new trades
	cron.schedule(CronInterval["5m"], async () => {
		const context = await Context.getInstance();
		if (!context) return;
		await delay(1000);
		console.log(getDate().dateString, "Checking for trades!");
		console.log(context.text());

		const { text, tradeArray } = context.checkForTrades({
			logs: false,
		});

		if (tradeArray.length) {
			console.log(text);
			for (const user of context.userList) {
				for (const trade of tradeArray) {
					if (trade.stgResponse.positionSide) {
						const props = {
							userName: user.name,
							pair: trade.symbol.pair,
							positionSide: trade.stgResponse.positionSide,
						};
						try {
							context.handleNewPosition(props);
						} catch (_) {
							console.log("Failed to open position", props);
						}
					}
				}
			}
		} else {
			console.log("No trades found");
		}
		await delay(5000);
		context.updateUsers({ userList: await getUsersData() });
		for (const user of context.userList) {
			await context.handleExistingPositions({ userName: user.name });
		}
		context.updateUsers({ userList: await getUsersData() });
	});

	//Subscribe to symbol and user updates
	{
		const context = await Context.getInstance();
		if (!context) return;
		for (const symbol of context.symbolList) {
			subscribeToSymbolUpdates({
				pair: symbol.pair,
				interval: params.interval,
			});
		}

		for (const user of context.userList) {
			subscribeToUserUpdates({ user });
		}
	}
};
trade();
