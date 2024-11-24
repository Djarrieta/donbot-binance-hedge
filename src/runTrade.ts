import cron from "node-cron";
import { strategies, tradeConfig } from "./config";
import { Trade } from "./domain/Trade";
import { AuthExchangeService } from "./infrastructure/AuthExchangeService";
import { ExchangeService } from "./infrastructure/ExchangeService";

const exchangeService = new ExchangeService();
const authExchangeService = new AuthExchangeService();

const trade = new Trade(
	exchangeService,
	authExchangeService,
	tradeConfig,
	strategies
);

trade.initialize();

cron.schedule("* * * * *", async () => {
	await trade.loop();
});
