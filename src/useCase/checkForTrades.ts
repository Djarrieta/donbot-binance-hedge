import { Context } from "../models/Context";
import { checkCandlestick } from "../utils/checkCandlestick";
import { getDate } from "../utils/getDate";

export const checkForTrades = async () => {
	const context = await Context.getInstance();
	console.log("");
	console.log(getDate({}).dateString);
	console.log(
		"Users: " + context.userList.map((u) => u.name?.split(" ")[0]).join(", ")
	);

	for (let index = 0; index < context.symbolList.length; index++) {
		const { candlestick } = context.symbolList[index];

		const isOk = checkCandlestick({ candlestick });
		if (!isOk) {
			context.symbolList[index] = {
				...context.symbolList[index],
				isReady: false,
			};
		}
	}
	const readySymbols = context.symbolList.filter((s) => s.isReady);
	console.log(
		"Checking for trades in  " +
			readySymbols.length +
			" symbols of " +
			context.symbolList.length
	);
	console.log(getDate({}).dateString);
};
