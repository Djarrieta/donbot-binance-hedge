import { backtestConfig, DATA_BASE_NAME, strategies } from "./config";
import { TradingStrategyTester } from "./domain/TradingStrategyTester";
import { AlertService } from "./infrastructure/AlertService";
import { ExchangeService } from "./infrastructure/ExchangeService";
import { HistoryDataService } from "./infrastructure/HistoryDataService";
import { StatsDataService } from "./infrastructure/StatsDataService";

const exchangeService = new ExchangeService();

const statsDataService = new StatsDataService({
	databaseName: DATA_BASE_NAME,
	tableName: "STATS_DATA",
});

const historyDataService = new HistoryDataService({
	databaseName: DATA_BASE_NAME,
	tableName: "BACKTEST_DATA",
});

const alertService = new AlertService({
	databaseName: DATA_BASE_NAME,
	tableName: "ALERT_DATA",
});

const tradingStrategyTester = new TradingStrategyTester(
	backtestConfig,
	exchangeService,
	statsDataService,
	historyDataService,
	alertService,
	strategies
);

tradingStrategyTester.backtest();
