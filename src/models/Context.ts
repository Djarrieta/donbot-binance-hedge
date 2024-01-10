import { Interval } from "./Interval";
import { StrategyStat } from "./Strategy";
import { Symbol } from "./Symbol";
import { User } from "./User";

export class Context {
	private static instance: Context | null = null;
	public static async getInstance() {
		if (Context.instance === null) {
			Context.instance = new Context();
		}

		return Context.instance;
	}

	private constructor() {}

	public static branch: "main" | "test" | "risk" = "test";

	public static interval = Interval["1m"];
	public static leverage = 10;
	public static lookBackLength = 200;
	public static maxOpenPos = 1;
	public static amountToTradeMultiplier = 0.25;
	public static maxTradeLength = 100;
	public static minChange24Hours = 10 / 100;
	public static backTestLookBackDays = 2;

	public static minAmountToTrade = 5;
	public static fee = 0.0005;

	symbolList: Symbol[] = [];
	userList: User[] = [];
	strategyStats: StrategyStat[] = [];
}
