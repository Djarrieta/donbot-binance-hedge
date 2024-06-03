import cron from "node-cron";
import { Context } from "./Context";
import { params } from "./Params";
import { CronInterval } from "./models/Interval";
import { getSymbolsData } from "./symbol/services/getSymbolsData";
import { subscribeToSymbolUpdates } from "./symbol/services/subscribeToSymbolUpdates";
import { getUsersData } from "./user/services/getUsersData";
import { delay } from "./utils/delay";
import { getDate } from "./utils/getDate";

const trade = async () => {
	cron.schedule(CronInterval["8h"], async () => {
		await startModel();
	});
	cron.schedule(CronInterval["5m"], async () => {
		const context = await Context.getInstance();
		await delay(1000);
		console.log("");
		console.log(getDate().dateString, "Checking for trades!");
	});
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
				await context.manageExistingPositions({ userName: user.name });
			};
			func();
		} catch (e) {
			console.error(e);
		}
	}
};
