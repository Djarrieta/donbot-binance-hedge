import { Context } from "../models/Context";
import { checkCandlestick } from "../utils/checkCandlestick";
import { getCandlestick } from "./getCandlestick";
import { subscribeToSymbolUpdates } from "./subscribeToSymbolUpdates";

export const updateUnreadySymbols = async () => {
	const context = await Context.getInstance();

	for (let index = 0; index < context.symbolList.length; index++) {
		const symbol = context.symbolList[index];
		if (!symbol.isLoading) continue;

		const isOk = checkCandlestick({
			candlestick: symbol.candlestick,
			interval: Context.interval,
		});
		if (!isOk) {
			const candlestick = await getCandlestick({
				pair: symbol.pair,
				lookBackLength: Context.lookBackLength,
				interval: Context.interval,
			});

			context.symbolList[index].currentPrice =
				candlestick[candlestick.length - 1].close;
			context.symbolList[index].candlestick = candlestick;
			context.symbolList[index].isReady = true;

			subscribeToSymbolUpdates({
				pair: symbol.pair,
				interval: Context.interval,
			});
		}
	}
};
