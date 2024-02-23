import { Interval } from "../models/Interval";
import { Strategy, StrategyResponse, StrategyStat } from "../models/Strategy";
import { Symbol } from "../models/Symbol";

export const checkForTrades = async ({
	readySymbols,
	interval,
	strategyStats,
	chosenStrategies,
}: {
	readySymbols: Symbol[];
	interval: Interval;
	strategyStats: StrategyStat[];
	chosenStrategies: Strategy[];
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

	const strategiesToRun = chosenStrategies.filter(
		(s) =>
			s.interval === interval &&
			strategyStats
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
