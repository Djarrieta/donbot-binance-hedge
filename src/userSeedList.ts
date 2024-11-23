import type { UserSeedDTO } from "./domain/Trade/User";
import { getDate, type DateString } from "./utils/getDate";

export const userSeedList: UserSeedDTO[] = [
	{
		name: "Dario",
		binanceApiKey:
			"0I8R3mv1g8FJVBdMwuMKRLBXXd4ahvHNAQNNaFyoBX7PnEnt6m7tIaJtEHgst8x0",
		binanceApiSecret:
			"mRjKmse3LsIK7l3TmdxOC13Zg4ie72sQ3wkrU48VW6PADkI2XrOy1iqvzkKozn5p",
		startDate: getDate("2024 11 23 00:00:00" as DateString).dateMs,
	},
];
