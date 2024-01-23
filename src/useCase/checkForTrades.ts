import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { chosenStrategies } from "../strategies";

export const checkForTrades = async ({
	readySymbols,
}: {
	readySymbols: Symbol[];
}) => {
	console.log("Checking for trades in  " + readySymbols.length + " symbols");

	const response: { symbol: Symbol; shouldTrade: PositionSide }[] = [];
	for (const stg of chosenStrategies) {
		for (const symbol of readySymbols) {
			const stgResponse = stg.validate({
				candlestick: symbol.candlestick,
				pair: symbol.pair,
				volatility: symbol.volatility,
			});
			if (stgResponse.shouldTrade !== null) {
				response.push({ symbol, shouldTrade: stgResponse.shouldTrade });
			}
		}
	}

	return response;
};
