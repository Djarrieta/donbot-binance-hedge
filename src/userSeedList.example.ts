import type { UserSeedDTO } from "./domain/User";
import { getDate, type DateString } from "./utils/getDate";

export const users: UserSeedDTO[] = [
	{
		name: "User1",
		binanceApiKey: "",
		binanceApiSecret: "",
		startDate: getDate("2024 11 23 00:00:00" as DateString).dateMs,
	},
];
