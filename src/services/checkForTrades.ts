import { PositionSide } from "../models/Position";
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
					" more) " +
					readySymbols
		  )
		: console.log(
				"Checking for trades in  " + readySymbols.map((s) => s.pair).join(", ")
		  );

	const response: { symbol: Symbol; shouldTrade: PositionSide }[] = [];
	for (const stg of chosenStrategies) {
		for (const symbol of readySymbols) {
			const stgResponse = stg.validate({
				candlestick: symbol.candlestick,
				pair: symbol.pair,
			});
			if (stgResponse.shouldTrade !== null) {
				response.push({ symbol, shouldTrade: stgResponse.shouldTrade });
			}
		}
	}

	return response;
};
