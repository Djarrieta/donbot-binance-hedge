import { StatsDataService } from "./infrastructure/StatsDataService";

const statsDataService = new StatsDataService({
	databaseName: "DB.db",
	tableName: "STATS_DATA",
});

statsDataService.showStats();
