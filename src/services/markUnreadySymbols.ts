import { Context } from "../models/Context";
import { checkCandlestick } from "../utils/checkCandlestick";

export const markUnreadySymbols = async () => {
	const context = await Context.getInstance();

	for (let index = 0; index < context.symbolList.length; index++) {
		const symbol = context.symbolList[index];

		const isOk = checkCandlestick({ candlestick: symbol.candlestick });

		if (!isOk && !symbol.isLoading) {
			context.symbolList[index].isReady = false;
		}
	}
};
