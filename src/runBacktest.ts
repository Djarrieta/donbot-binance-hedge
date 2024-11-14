import { backtestConfig, strategies } from "./config";
import { TradingStrategyTester } from "./domain/TradingStrategyTester";
import { AlertService } from "./infrastructure/AlertService";
import { BacktestDataService } from "./infrastructure/BacktestDataService";
import { MarketDataService } from "./infrastructure/MarketDataService";

const backtestDataService = new BacktestDataService({
	databaseName: "DB.db",
	tableName: "BACKTEST_DATA",
	statsTableName: "STATS_DATA",
});
const alertService = new AlertService({
	databaseName: "DB.db",
	tableName: "ALERT_DATA",
});

const marketDataService = new MarketDataService();

const tradingStrategyTester = new TradingStrategyTester(
	backtestConfig,
	backtestDataService,
	marketDataService,
	alertService,
	strategies
);

tradingStrategyTester.backtest({ deleteAlerts: true });
