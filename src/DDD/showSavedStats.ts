import { BacktestDataService } from "./infrastructure/BacktestDataService";

const backtestDataService = new BacktestDataService({
	databaseName: "DB.db",
	tableName: "BACKTEST_DATA",
	statsTableName: "STATS_DATA",
});

backtestDataService.showSavedStats();
