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
	public static interval = Interval["1h"];
	public static leverage = 10; //WIP: Implement
	public static lookBackLength = 200;
	public static lookBackLengthBacktest = (12 * Interval["1M"]) / Interval["1h"]; // six months
	public static maxOpenPos = 1;
	public static amountToTradePt = 0.25;
	public static maxTradeLength = 1000; // Implement in trade
	public static minVolatility = 10 / 100;
	public static minAmountToTrade = 5;
	public static fee = 0.0005;
	public static defaultSL = 1 / 100;
	public static defaultTP = 0.5 / 100;
	public static shouldStop = false;
}
