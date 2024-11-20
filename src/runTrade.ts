import cron from "node-cron";
import type { User } from "./userLegacy/User";
import type { Symbol } from "./domain/Trade/Symbol";
import type { TradeConfig } from "./domain/Trade/TradeConfig";
import { getDate } from "./utils/getDate";
import { delay } from "./utils/delay";
import { Interval } from "./domain/Interval";

type Exchange = {
	getUsersData(): Promise<unknown>;
	getSymbolsData(): Promise<unknown>;
	subscribeToUserUpdates(arg0: { user: User }): Promise<void>;
	subscribeToSymbolUpdates(arg0: {
		pair: string;
		interval: any;
	}): Promise<void>;
};

class Trade {
	exchange: Exchange;
	symbolList: Symbol[] = [];
	userList: User[] = [];
	config: TradeConfig;

	constructor(exchange: Exchange, config: TradeConfig) {
		this.exchange = exchange;
		this.config = config;
	}

	async initialize() {
		this.showConfig();
		await Promise.all([
			this.exchange.getSymbolsData(),
			this.exchange.getUsersData(),
		]);

		for (const user of this.userList) {
			this.handleExistingPositions({ userName: user.name });
		}

		this.securePositions();
		this.runSubscribers();
	}

	async loop() {
		await delay(5000);
		console.log(getDate().dateString);

		const { alertText, alerts } = this.checkForTrades({ logs: true });

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
		await this.exchange.getUsersData();

		for (const user of this.userList) {
			this.handleExistingPositions({ userName: user.name });
		}

		await this.exchange.getUsersData();
		this.securePositions();
		this.runSubscribers();
	}

	private runSubscribers() {
		console.log("Running subscribers");

		// Subscribe to symbol updates
		for (const symbol of this.symbolList) {
			try {
				this.exchange.subscribeToSymbolUpdates({
					pair: symbol.pair,
					interval: this.config.interval,
				});
			} catch (e) {
				console.error(e);
			}
		}

		// Subscribe to user updates
		for (const user of this.userList) {
			try {
				this.exchange.subscribeToUserUpdates({ user });
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
}

const exchangeService: Exchange = {
	subscribeToSymbolUpdates: async (arg0) => {},
	subscribeToUserUpdates: async (arg0) => {},
	getUsersData: async () => {},
	getSymbolsData: async () => {},
};

//main.ts

const config: TradeConfig = {
	interval: Interval["1m"],
	lookBackLength: 200,
	sl: 0.02,
	tp: 0.05,
	riskPt: 0.5 / 100,
	feePt: 0.0005,
	maxTradeLength: 100,
	minAmountToTradeUSDT: 6,
	apiLimit: 500,
	maxProtectedPositions: 10,
	maxHedgePositions: 5,
	breakEventAlerts: [],
};

const trade = new Trade(exchangeService, config);

trade.initialize();

cron.schedule("* * * * *", async () => {
	await trade.loop();
});
