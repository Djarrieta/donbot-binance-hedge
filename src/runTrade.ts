import cron from "node-cron";
import { strategies, tradeConfig } from "./config";
import { Trade } from "./domain/Trade";
import { ExchangeService } from "./infrastructure/ExchangeService";

const exchangeService = new ExchangeService();

const trade = new Trade(exchangeService, tradeConfig, strategies);

trade.initialize();

cron.schedule("* * * * *", async () => {
	await trade.loop();
});
