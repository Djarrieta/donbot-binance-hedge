import { Context } from "../models/Context";
import { User } from "../models/User";
import Binance from "binance-api-node";

export const fixUserParams = async (user: User) => {
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});
	const context = await Context.getInstance();

	const positionRisk = await authExchange.futuresPositionRisk({
		recvWindow: 59999,
	});
	for (
		let symbolIndex = 0;
		symbolIndex < context.symbolList.length;
		symbolIndex++
	) {
		const { pair } = context.symbolList[symbolIndex];

		try {
			await authExchange.futuresLeverage({
				symbol: pair,
				leverage: Context.leverage,
			});
			await authExchange.futuresMarginType({
				symbol: pair,
				marginType: "CROSSED",
			});
		} catch (e: any) {
			if (e.code != "-4046") {
				console.log(
					"There were a problem setting leverage for " +
						user.name +
						" in " +
						pair
				);
			}
		}
	}
};
