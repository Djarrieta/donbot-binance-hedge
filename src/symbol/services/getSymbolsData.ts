import Binance from "binance-api-node";
import type { Symbol } from "../Symbol";
import { getPairList } from "./getPairList";
import { getCandlestick } from "./getCandlestick";
import { InitialParams } from "../../InitialParams";

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
		console.log(symbolInfo);
		if (!symbolInfo) continue;

		const minQty = Number(
			symbolInfo.filters.find((f: any) => f.filterType === "LOT_SIZE").minQty
		);
		const minNotional = Number(
			symbolInfo.filters.find((f: any) => f.filterType === "MIN_NOTIONAL")
				.notional
		);
		const candlestick = await getCandlestick({
			pair,
			lookBackLength: InitialParams.lookBackLength,
			interval: InitialParams.interval,
			apiLimit: InitialParams.candlestickAPILimit,
		});
		const currentPrice =
			Number(candlestick[candlestick.length - 1]?.close) || 0;
		const minQuantityUSD = minQty * currentPrice;
		if (
			symbolInfo.status !== "TRADING" ||
			symbolInfo.quoteAsset !== "USDT" ||
			symbolInfo.baseAsset === "USDT" ||
			symbolInfo.contractType !== "PERPETUAL" ||
			minQuantityUSD > InitialParams.minAmountToTrade ||
			minNotional > InitialParams.minAmountToTrade
		) {
			continue;
		}

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
