import cron from "node-cron";
import { DATA_BASE_NAME, strategies, tradeConfig } from "./config";
import { Interval } from "./domain/Interval";
import { Trade } from "./domain/Trade";
import { AuthExchangeService } from "./infrastructure/AuthExchangeService";
import { ExchangeService } from "./infrastructure/ExchangeService";
import { intervalToCron } from "./utils/intervalToCron";
import { LogService } from "./infrastructure/LogService";

const exchangeService = new ExchangeService();
const authExchangeService = new AuthExchangeService();
const logService = new LogService({
	databaseName: DATA_BASE_NAME,
	tableName: "TRADE_DATA",
});

const trade = new Trade(
	exchangeService,
	authExchangeService,
	tradeConfig,
	strategies,
	logService
);

trade.initialize();

const cronInterval = intervalToCron(Interval["5m"]);

cron.schedule(cronInterval, async () => {
	try {
		await trade.loop();
	} catch (error) {
		trade.saveLogs({ type: "Error", eventData: error });
	}
});
