import { Context } from "../models/Context";
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

	const context = await Context.getInstance();

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

	const strategiesToRun = chosenStrategies.filter(
		(s) =>
			s.interval === Context.interval &&
			context.strategyStats
				.filter((stat) => stat.status)
				.map((stat) => stat.stgName)
				.includes(s.stgName)
	);

	console.log(
		"Strategies: " + strategiesToRun.map((s) => s?.stgName).join(", ")
	);

	for (const strategy of strategiesToRun) {
		for (const symbol of readySymbols) {
			const stgResponse =
				strategy?.validate({
					candlestick: symbol.candlestick,
					pair: symbol.pair,
				}) || undefined;
			if (stgResponse && stgResponse.shouldTrade !== null) {
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
	if (response.tradeArray.length && response.tradeArray.length <= 4) {
		response.text =
			"+ Should trade " +
			response.tradeArray.map(
				(t) =>
					t.stgResponse.shouldTrade +
					" in " +
					t.symbol.pair +
					" with " +
					t.stgResponse.stgName
			);
	}

	return response;
};
