import { PlacePosition } from "../models/Position";

export const positionClean = async ({
	symbol,
	authExchange,
}: Pick<PlacePosition, "symbol" | "authExchange">) => {
	try {
		console.log("Canceling orders for " + symbol.pair);
		await authExchange.futuresCancelAllOpenOrders({
			symbol: symbol.pair,
		});
	} catch (e) {
		console.log("Problem canceling orders for " + symbol.pair);
		console.log(e);
	}
};
