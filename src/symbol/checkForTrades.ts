import type { Interval } from "../models/Interval";
import type { Strategy, StrategyResponse } from "../strategies/Strategy";
import type { Symbol } from "./Symbol";

export const checkForTrades = async ({
	symbolList,
	strategies,
	logs = true,
}: {
	symbolList: Symbol[];
	interval: Interval;
	strategies: Strategy[];
	logs?: boolean;
}) => {
	const response: {
		text: string;
		tradeArray: { symbol: Symbol; stgResponse: StrategyResponse }[];
	} = { text: "", tradeArray: [] };

	if (logs) {
		symbolList.length > 4
			? console.log(
					"Checking for trades in  " +
						symbolList[0].pair +
						", " +
						symbolList[1].pair +
						", ...(" +
						(symbolList.length - 2) +
						" more) "
			  )
			: console.log(
					"Checking for trades in  " + symbolList.map((s) => s.pair).join(", ")
			  );
	}

	logs &&
		console.log("Strategies: " + strategies.map((s) => s?.stgName).join(", "));

	for (const strategy of strategies) {
		for (const symbol of symbolList) {
			const stgResponse = strategy?.validate({
				candlestick: symbol.candlestick,
				pair: symbol.pair,
			});
			if (stgResponse && stgResponse.positionSide !== null) {
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
					t.stgResponse.positionSide +
					" in " +
					t.symbol.pair +
					" with " +
					t.stgResponse.stgName
			);
	}

	return response;
};
