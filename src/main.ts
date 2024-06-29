import cron from "node-cron";
import { Context } from "./Context";
import { params } from "./Params";
import { CronInterval, Interval } from "./sharedModels/Interval";
import { chosenStrategies } from "./strategies";
import { getSymbolsData } from "./symbol/services/getSymbolsData";
import { subscribeToSymbolUpdates } from "./symbol/services/subscribeToSymbolUpdates";
import { getUsersData } from "./user/services/getUsersData";
import { subscribeToUserUpdates } from "./user/services/subscribeToUserUpdates";
import { delay } from "./utils/delay";
import { formatPercent } from "./utils/formatPercent";
import { getDate } from "./utils/getDate";

const startModel = async () => {
	console.log(getDate().dateString);
	console.table({
		"Interval (m)": params.interval / Interval["1m"],
		"Lookback Length": params.lookBackLength,
		"Default SL (%)": formatPercent(params.defaultSL),
		"Default TP (%)": formatPercent(params.defaultTP),
		"Default Breakeven (%)": formatPercent(params.defaultBE),
		"Max Trade Length": params.maxTradeLength,
		"Max Protected Positions": params.maxProtectedPositions,
		"Max Hedge Positions": params.maxHedgePositions,
	});

	const symbolList = await getSymbolsData();
	const userList = await getUsersData();
	const context = await Context.getInstance({
		symbolList,
		userList,
		strategies: chosenStrategies,
	});
	console.log("...Starting model");

	if (!context) return;

	console.log(context.text());
	for (const user of context.userList) {
		await context.handleExistingPositions({ userName: user.name });
	}
};

const trade = async () => {
	await startModel();

	cron.schedule(CronInterval["5m"], async () => {
		const context = await Context.getInstance();
		if (!context) return;
		await delay(1000);
		console.log("");
		console.log(getDate().dateString);
		console.log(context.text());

		const { text: tradesText, trades } = context.checkForTrades({
			logs: true,
		});

		if (trades.length) {
			console.log(tradesText);
			for (const user of context.userList) {
				for (const trade of trades) {
					if (trade.positionSide) {
						context.handleNewPosition({
							userName: user.name,
							pair: trade.pair,
							positionSide: trade.positionSide,
							sl: trade.sl,
							tp: trade.tp,
						});
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
		context.securePositions();

		for (const symbol of context.symbolList) {
			subscribeToSymbolUpdates({
				pair: symbol.pair,
				interval: params.interval,
			});
		}

		for (const user of context.userList) {
			subscribeToUserUpdates({ user });
		}
	});
};

trade();
