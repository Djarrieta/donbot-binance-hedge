import type { UserSeed } from "./user/User";
import { getDate, type DateString } from "./utils/getDate";

export const userSeedList: UserSeed[] = [
	{
		name: "userName",
		binanceApiKey: "binanceApiKey",
		binanceApiSecret: "binanceApiSecret",
		startDate: getDate("2024 06 02 08:30:00" as DateString).date,
	},
];
