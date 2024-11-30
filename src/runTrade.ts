import cron from "node-cron";
import { strategies, tradeConfig } from "./config";
import { Interval } from "./domain/Interval";
import { Trade } from "./domain/Trade";
import { AuthExchangeService } from "./infrastructure/AuthExchangeService";
import { ExchangeService } from "./infrastructure/ExchangeService";
import { intervalToCron } from "./utils/intervalToCron";

const exchangeService = new ExchangeService();
const authExchangeService = new AuthExchangeService();

const trade = new Trade(
	exchangeService,
	authExchangeService,
	tradeConfig,
	strategies
);

trade.initialize();

const cronInterval = intervalToCron(Interval["5m"]);

cron.schedule(cronInterval, async () => {
	await trade.loop();
});
