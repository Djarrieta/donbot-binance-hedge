import { Interval } from "./Interval";
import { StrategyStat } from "./Strategy";
import { Symbol } from "./Symbol";
import { User } from "./User";

export class Context {
	private constructor() {}
	private static instance: Context | null = null;
	public static async getInstance() {
		if (Context.instance === null) {
			Context.instance = new Context();
		}

		return Context.instance;
	}
	symbolList: Symbol[] = [];
	userList: User[] = [];
	strategyStats: StrategyStat[] = [];

	public static branch: "main" | "test" | "risk" = "test";
	public static interval = Interval["5m"];
	public static leverage = 10;
	public static lookBackLength = Interval["1d"] / Interval["5m"];
	public static maxOpenPos = 1;
	public static amountToTradeMultiplier = 0.25;
	public static maxTradeLength = 1000;
	public static minVolatility = 10 / 100;
	public static backTestLookBackDays = 2;
	public static minAmountToTrade = 5;
	public static fee = 0.0005;
	public static defaultSL = 10 / 100;
	public static defaultTP = 1 / 10;
}
