import cron from "node-cron";
import { Context } from "./Context";
import { params } from "./Params";
import { snapshot } from "./backtest/snapshot";
import { CronInterval, Interval } from "./sharedModels/Interval";
import { chosenStrategies } from "./strategies";
import type { Symbol } from "./symbol/Symbol";
import { getCandlestick } from "./symbol/services/getCandlestick";
import { getPairList } from "./symbol/services/getPairList";
import { getSymbolsData } from "./symbol/services/getSymbolsData";
import { subscribeToSymbolUpdates } from "./symbol/services/subscribeToSymbolUpdates";
import { getUsersData } from "./user/services/getUsersData";
import { subscribeToUserUpdates } from "./user/services/subscribeToUserUpdates";
import { delay } from "./utils/delay";
import { formatPercent } from "./utils/formatPercent";
import { getDate } from "./utils/getDate";

const runSubscribers = async () => {
	console.log("Running subscribers");
	const context = await Context.getInstance();
	if (!context) return;

	for (const symbol of context.symbolList) {
		try {
			subscribeToSymbolUpdates({
				pair: symbol.pair,
				interval: params.interval,
			});
		} catch (e) {
			console.error(e);
		}
	}

	for (const user of context.userList) {
		try {
			subscribeToUserUpdates({ user });
		} catch (e) {
			console.error(e);
		}
	}
};

const startModel = async () => {
	console.log(getDate().dateString);
	console.table({
		Interval: params.interval / Interval["1m"] + "m",
		"Lookback Length": params.lookBackLength,
		"Default SL": formatPercent(params.defaultSL),
		"Default TP": formatPercent(params.defaultTP),
		Breakeven:
			formatPercent(params.defaultBE) +
			" @ " +
			formatPercent(params.breakevenAlert),
		"Amount to trade": formatPercent(params.amountToTradePt),
		"Max Trade Length": params.maxTradeLength,
		"Max Protected Positions": params.maxProtectedPositions,
		"Max Hedge Positions": params.maxHedgePositions,
	});
	console.log(
		"Strategies: ",
		chosenStrategies.map((s) => s.stgName).join(", ")
	);
	Context.resetInstance();
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
	runSubscribers();
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
	});

	cron.schedule(CronInterval["1h"], async () => {
		console.log("Running dynamic backtest");
		const context = await Context.getInstance();
		if (!context) return;

		const pairList = await getPairList();
		let symbolList: Symbol[] = [];
		for (const pair of pairList) {
			const candlestick = await getCandlestick({
				pair,
				lookBackLength: params.lookBackLengthDynamicBacktest,
				interval: params.interval,
				apiLimit: params.candlestickAPILimit,
			});
			symbolList.push({
				pair,
				candlestick,
				currentPrice: candlestick[candlestick.length - 1].close,
				quantityPrecision: 0,
				pricePrecision: 0,
				isReady: true,
			});
		}
		let badStgIndexes = [];
		for (let stgIndex = 0; stgIndex < context.strategies.length; stgIndex++) {
			for (let i = 0; i < context.strategies.length; i++) {
				if (i != stgIndex) {
					context.strategies[i].isEnabled = false;
				} else {
					context.strategies[i].isEnabled = true;
				}
			}
			const snapStats = await snapshot({ log: false, symbolList });
			if (Number(snapStats?.avPnl) < 0) {
				badStgIndexes.push(stgIndex);
			}
		}
		for (let stgIndex = 0; stgIndex < context.strategies.length; stgIndex++) {
			if (badStgIndexes.includes(stgIndex)) {
				context.strategies[stgIndex].isEnabled = false;
			} else {
				context.strategies[stgIndex].isEnabled = true;
			}
		}

		console.log(context.text());
	});

	do {
		await delay(Interval["15m"]);
		runSubscribers();
	} while (true);
};

trade();
