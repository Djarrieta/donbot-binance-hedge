import cron from "node-cron";
import { Context } from "./Context";
import { params } from "./Params";
import { CronInterval } from "./models/Interval";
import { getSymbolsData } from "./symbol/services/getSymbolsData";
import { subscribeToSymbolUpdates } from "./symbol/services/subscribeToSymbolUpdates";
import { getUsersData } from "./user/services/getUsersData";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";
import { handleExistingPositions } from "./handlers/handleExistingPositions";
import { checkForTrades } from "./symbol/checkForTrades";
import { chosenStrategies } from "./strategies";
import { handleNewPosition } from "./handlers/handleNewPositions";

const trade = async () => {
	//Restart model every 8 hours
	cron.schedule(CronInterval["8h"], async () => {
		await startModel();
	});

	//Check for new trades
	cron.schedule(CronInterval["5m"], async () => {
		const context = await Context.getInstance();
		if (!context) return;
		await delay(1000);
		console.log("");
		console.log(getDate().dateString, "Checking for trades!");

		const readySymbols = [...context.symbolList]
			.filter((s) => s.isReady)
			.sort((a, b) => Number(b.volatility) - Number(a.volatility));

		const { text: tradeArrayText, tradeArray } = await checkForTrades({
			symbolList: readySymbols,
			interval: params.interval,
			strategies: chosenStrategies,
			logs: false,
		});

		if (tradeArray.length) {
			console.log(tradeArrayText);

			for (const user of context.userList) {
				for (const trade of tradeArray) {
					trade.stgResponse.positionSide &&
						handleNewPosition({
							user,
							pair: trade.symbol.pair,
							positionSide: trade.stgResponse.positionSide,
						});
				}
			}
		} else {
			console.log("No trades found");
		}
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
	}
};
trade();

const startModel = async () => {
	Context.resetInstance();

	const symbolList = await getSymbolsData();
	const userList = await getUsersData();
	const context = await Context.getInstance({
		symbolList,
		userList,
	});
	console.log(getDate().dateString);

	console.log(
		"Users: " + context?.userList.map((u) => u.name?.split(" ")[0]).join(", ")
	);

	if (!context) return;

	for (const user of context.userList) {
		try {
			const func = async () => {
				await handleExistingPositions({ user });
			};
			func();
		} catch (e) {
			console.error(e);
		}
	}
};
