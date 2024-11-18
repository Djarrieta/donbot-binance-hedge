// import cron from "node-cron";
// import { Trade } from "./domain/Trade";

// const runSubscribers = async () => {
// 	console.log("Running subscribers");
// 	const trade = await Trade.getInstance();
// 	if (!trade) return;

// 	for (const symbol of trade.symbolList) {
// 		try {
// 			trade.subscribeToSymbolUpdates({
// 				pair: symbol.pair,
// 				interval: trade.config.interval,
// 			});
// 		} catch (e) {
// 			console.error(e);
// 		}
// 	}

// 	for (const user of context.userList) {
// 		try {
// 			subscribeToUserUpdates({ user });
// 		} catch (e) {
// 			console.error(e);
// 		}
// 	}
// };

// const startModel = async () => {
// 	console.log(getDate().dateString);
// 	console.table({
// 		Interval: params.interval / Interval["1m"] + "m",
// 		"Lookback Length": params.lookBackLength,
// 		"Default SL": formatPercent(params.defaultSL),
// 		"Default TP": formatPercent(params.defaultTP),
// 		"Break Even": params.breakEventAlerts
// 			.map((a) => formatPercent(a.value))
// 			.join(", "),

// 		"Risk per trade": formatPercent(params.riskPt),
// 		"Max Trade Length": params.maxTradeLength,
// 		"Max Protected Positions": params.maxProtectedPositions,
// 		"Max Hedge Positions": params.maxHedgePositions,
// 	});
// 	console.log(
// 		"Strategies: ",
// 		chosenStrategies.map((s) => s.stgName).join(", ")
// 	);
// 	Context.resetInstance();
// 	const symbolList = await getSymbolsData();
// 	const userList = await getUsersData();
// 	const context = await Context.getInstance({
// 		symbolList,
// 		userList,
// 		strategies: chosenStrategies,
// 	});
// 	console.log("...Starting model");

// 	if (!context) return;

// 	console.log(context.text());
// 	for (const user of context.userList) {
// 		await context.handleExistingPositions({ userName: user.name });
// 	}
// 	context.securePositions();

// 	runSubscribers();
// };

// const trade = async () => {
// 	await startModel();

// 	cron.schedule(CronInterval["5m"], async () => {
// 		const context = await Context.getInstance();
// 		if (!context) return;
// 		await delay(1000);
// 		console.log("");
// 		console.log(getDate().dateString);
// 		console.log(context.text());

// 		const { text: tradesText, trades } = context.checkForTrades({
// 			logs: true,
// 		});

// 		if (trades.length) {
// 			console.log(tradesText);
// 			for (const user of context.userList) {
// 				for (const trade of trades) {
// 					if (trade.positionSide) {
// 						context.handleNewPosition({
// 							userName: user.name,
// 							pair: trade.pair,
// 							positionSide: trade.positionSide,
// 							sl: trade.sl,
// 							tp: trade.tp,
// 						});
// 					}
// 				}
// 			}
// 		} else {
// 			console.log("No trades found");
// 		}
// 		await delay(5000);
// 		context.updateUsers({ userList: await getUsersData() });
// 		for (const user of context.userList) {
// 			await context.handleExistingPositions({ userName: user.name, trades });
// 		}
// 		context.updateUsers({ userList: await getUsersData() });
// 		context.securePositions();
// 	});

// 	do {
// 		await delay(Interval["15m"]);
// 		try {
// 			runSubscribers();
// 		} catch (e) {
// 			console.error(e);
// 		}
// 	} while (true);
// };

// trade();
