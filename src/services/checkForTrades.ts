import { StrategyResponse } from "../models/Strategy";
import { Symbol } from "../models/Symbol";
import { chosenStrategies } from "../strategies";

export const checkForTrades = async ({
	readySymbols,
}: {
	readySymbols: Symbol[];
}) => {
	const response: {
		text: string;
		tradeArray: { symbol: Symbol; stgResponse: StrategyResponse }[];
	} = { text: "", tradeArray: [] };

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

	for (const strategy of chosenStrategies) {
		for (const symbol of readySymbols) {
			const stgResponse = strategy.validate({
				candlestick: symbol.candlestick,
				pair: symbol.pair,
			});
			if (stgResponse.shouldTrade !== null) {
				response.tradeArray.push({ symbol, stgResponse });
			}
		}
	}

	if (response.tradeArray.length > 4) {
		response.text =
			"+ Should trade " +
			response.tradeArray[0].symbol.pair +
			", " +
			response.tradeArray[1].symbol.pair +
			", ...(" +
			(response.tradeArray.length - 2) +
			" more) ";
	}
	if (response.tradeArray.length > 0 && response.tradeArray.length <= 4) {
		"+ Should trade " +
			response.tradeArray.map(
				(t) =>
					t.symbol.pair +
					" " +
					t.stgResponse.stgName +
					" -> " +
					t.stgResponse.shouldTrade +
					"; "
			);
	}

	return response;
};
