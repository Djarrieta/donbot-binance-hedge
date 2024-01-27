import { StrategyResponse } from "../models/Strategy";
import { Symbol } from "../models/Symbol";
import { chosenStrategies } from "../strategies";

export const checkForTrades = async ({
	readySymbols,
}: {
	readySymbols: Symbol[];
}) => {
	readySymbols.length > 4
		? console.log(
				"Checking for trades in  " +
					readySymbols[0].pair +
					", " +
					readySymbols[1].pair +
					", ...(" +
					(readySymbols.length - 2) +
					" more) "
		  )
		: console.log(
				"Checking for trades in  " + readySymbols.map((s) => s.pair).join(", ")
		  );

	const response: { symbol: Symbol; stgResponse: StrategyResponse }[] = [];
	for (const strategy of chosenStrategies) {
		for (const symbol of readySymbols) {
			const stgResponse = strategy.validate({
				candlestick: symbol.candlestick,
				pair: symbol.pair,
			});
			if (stgResponse.shouldTrade !== null) {
				response.push({ symbol, stgResponse });
			}
		}
	}

	return response;
};
