import { DATA_BASE_NAME } from "./config";
import { LogService } from "./infrastructure/LogService";

const logService = new LogService({
	databaseName: DATA_BASE_NAME,
	tableName: "TRADE_DATA",
});

logService.showLogs({
	start: 0,
	end: Date.now(),
});
