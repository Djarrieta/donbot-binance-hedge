import { Context } from "../models/Context";
import { getCandlestick } from "./getCandlestick";

export const updateUnreadyPairsWithOpenPos = async () => {
	const context = await Context.getInstance();

	const unReadyPairs = [...context.symbolList]
		.filter((s) => !s.isReady)
		.map((s) => s.pair);

	let unreadyPairsWithOpenPos = context.userList
		.map((u) => Array.from(new Set(u.openPositions.map((x) => x.pair))))
		.flat()
		.filter((s) => unReadyPairs.includes(s));

	for (const pair of unreadyPairsWithOpenPos) {
		const candlestick = await getCandlestick({
			pair,
			lookBackLength: Context.lookBackLength,
			interval: Context.interval,
			apiLimit: Context.candlestickAPILimit,
		});
		const updatedSymbol = context.symbolList.filter((s) => s.pair === pair)[0];
		updatedSymbol.currentPrice = candlestick[candlestick.length - 1].close;
		updatedSymbol.candlestick = candlestick;
		updatedSymbol.isReady = true;

		context.symbolList = [
			...context.symbolList.filter((s) => s.pair !== pair),
			updatedSymbol,
		];
	}
};
