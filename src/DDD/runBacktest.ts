import { backtestConfig, strategies } from "./config";
import { TradingStrategyTester } from "./domain/TradingStrategyTester";
import { BacktestDataService } from "./infrastructure/BacktestDataService";
import { MarketDataService } from "./infrastructure/MarketDataService";

const backtestDataService = new BacktestDataService({
	databaseName: "DB.db",
	tableName: "BACKTEST_DATA",
});
const marketDataService = new MarketDataService();

const tradingStrategyTester = new TradingStrategyTester(
	backtestConfig,
	backtestDataService,
	marketDataService,
	strategies
);

tradingStrategyTester.backtest();
