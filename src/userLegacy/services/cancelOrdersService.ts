import type { User } from "../User";
import Binance from "binance-api-node";

export const cancelOrdersService = async ({
	user,
	pair,
}: {
	user: User;
	pair: string;
}) => {
	const authExchange = Binance({
		apiKey: user.binanceApiKey,
		apiSecret: user.binanceApiSecret || "",
	});
	await authExchange.futuresCancelAllOpenOrders({
		symbol: pair,
	});
};
