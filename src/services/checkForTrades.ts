import { Context } from "../models/Context";
import { StrategyResponse } from "../models/Strategy";
import { Symbol } from "../models/Symbol";
import { chosenStrategies } from "../strategies";
import { formatPercent } from "../utils/formatPercent";

export const checkForTrades = async ({
	readySymbols,
}: {
	readySymbols: Symbol[];
}) => {
	const context = await Context.getInstance();
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
	console.log(
		"Strategies: " + chosenStrategies.map((s) => s.stgName).join(", ")
	);

	let usersLogs = "Users: ";

	context.userList.forEach((u) => {
		const openPosUniquePairs = Array.from(
			new Set(u.openPositions.map((x) => x.pair))
		);
		usersLogs += ` ${u.name}\n`;
		usersLogs += `$${u.balanceUSDT.toFixed(2)} USDT Today: ${formatPercent(
			u.todayPnlPt
		)}  Open: ${formatPercent(u.openPosPnlPt)}  Total: ${formatPercent(
			u.totalPnlPt
		)}\n`;

		usersLogs += " " + openPosUniquePairs.join(", ");
	});
	console.log(usersLogs);

	for (const strategy of chosenStrategies.filter(
		(s) => s.interval === Context.interval
	)) {
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
