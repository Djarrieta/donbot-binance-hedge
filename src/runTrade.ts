import cron from "node-cron";
import type { User } from "./userLegacy/User";
import type { Symbol } from "./domain/Trade/Symbol";
import type { TradeConfig } from "./domain/Trade/TradeConfig";
import { getDate } from "./utils/getDate";
import { delay } from "./utils/delay";

type Exchange = {
	getUsersData(): unknown;
	getSymbolsData(): unknown;
	subscribeToUserUpdates(arg0: { user: User }): unknown;
	subscribeToSymbolUpdates(arg0: {
		pair: string;
		interval: any;
	}): Promise<void>;
};

const exchange = {
	subscribeToSymbolUpdates: async (arg0: { pair: string; interval: any }) => {},
	subscribeToUserUpdates: async (arg0: { user: User }) => {},
	getUsersData: async () => {},
	getSymbolsData: async () => {},
};

//TRADE FILE, DOMAIN FOLDER

class Trade {
	async start() {
		trade.showConfig();

		await trade.exchange.getSymbolsData();
		await trade.exchange.getUsersData();

		for (const user of trade.userList) {
			trade.handleExistingPositions({ userName: user.name });
		}

		trade.securePositions();
		this.runSubscribers();
	}
	async loop() {
		await delay(5000);
		console.log(getDate().dateString);

		const { alertText, alerts } = this.checkForTrades({
			logs: true,
		});

		if (alerts.length) {
			console.log(alertText);
			for (const user of this.userList) {
				for (const alert of alerts) {
					if (alert.positionSide) {
						this.handleNewPosition({
							userName: user.name,
							pair: alert.pair,
							positionSide: alert.positionSide,
							sl: alert.sl,
							tp: alert.tp,
						});
					}
				}
			}
		} else {
			console.log("No trades found");
		}
		await delay(5000);
		trade.exchange.getUsersData();
		for (const user of trade.userList) {
			trade.handleExistingPositions({ userName: user.name });
		}
		trade.exchange.getUsersData();
		trade.securePositions();
		this.runSubscribers();
	}
	runSubscribers() {
		console.log("Running subscribers");
		for (const symbol of trade.symbolList) {
			try {
				trade.exchange.subscribeToSymbolUpdates({
					pair: symbol.pair,
					interval: trade.config.interval,
				});
			} catch (e) {
				console.error(e);
			}
		}

		for (const user of trade.userList) {
			try {
				trade.exchange.subscribeToUserUpdates({ user });
			} catch (e) {
				console.error(e);
			}
		}
	}
	handleNewPosition(arg0: {
		userName: string;
		pair: any;
		positionSide: any;
		sl: any;
		tp: any;
	}) {
		throw new Error("Method not implemented.");
	}
	checkForTrades(arg0: { logs: boolean }): { alertText: any; alerts: any } {
		throw new Error("Method not implemented.");
	}
	securePositions() {
		throw new Error("Method not implemented.");
	}
	handleExistingPositions(arg0: { userName: string }) {
		throw new Error("Method not implemented.");
	}
	showConfig() {
		throw new Error("Method not implemented.");
	}
	exchange: Exchange;
	constructor(exchange: Exchange) {
		this.exchange = exchange;
	}

	symbolList: Symbol[] = [];
	userList: User[] = [];
	config: TradeConfig = {} as TradeConfig;
}

const trade = new Trade(exchange);

//MAIN.TS

trade.start();
cron.schedule("* * * * *", async () => {
	await trade.loop();
});
