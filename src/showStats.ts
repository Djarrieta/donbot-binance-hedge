import { DATA_BASE_NAME } from "./config";
import { StatsDataService } from "./infrastructure/StatsDataService";


const statsDataService = new StatsDataService({
	databaseName: DATA_BASE_NAME,
	tableName: "STATS_DATA",
});

statsDataService.showStats();
