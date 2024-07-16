import Binance from "binance-api-node";
import type { Symbol } from "../Symbol";
import { getPairList } from "./getPairList";
import { getCandlestick } from "./getCandlestick";
import { params } from "../../Params";

export const getSymbolsData = async () => {
	const exchange = Binance();
	const symbolList: Symbol[] = [];
	const pairList = await getPairList();
	if (!pairList.length) return symbolList;

	const symbolListInfo = await exchange.futuresExchangeInfo();
	for (const pair of pairList) {
		const symbolInfo = symbolListInfo.symbols.find(
			(p) => p.symbol === pair
		) as any;
		if (!symbolInfo) continue;

		const candlestick = await getCandlestick({
			pair,
			lookBackLength: params.lookBackLength,
			interval: params.interval,
			apiLimit: params.candlestickAPILimit,
		});
		const currentPrice =
			Number(candlestick[candlestick.length - 1]?.close) || 0;

		symbolList.push({
			pair,
			pricePrecision: Number(symbolInfo.pricePrecision),
			quantityPrecision: Number(symbolInfo.quantityPrecision),
			isReady: true,
			candlestick,
			currentPrice,
		});
	}

	return symbolList;
};
