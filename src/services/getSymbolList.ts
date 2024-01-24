import Binance from "binance-api-node";
import { Candle } from "../models/Candle";
import { Context } from "../models/Context";
import { getCandlestick } from "./getCandlestick";
import { updateSymbol } from "./updateSymbol";

export const getSymbolList = async () => {
	const context = await Context.getInstance();

	const exchange = Binance();

	const symbolList = await getCompletePairList();
	const symbolListInfo = await exchange.futuresExchangeInfo();

	for (const symbol of symbolList) {
		const symbolInfo = symbolListInfo.symbols.filter(
			(p) => p.symbol === symbol.pair
		)[0];

		context.symbolList.push({
			pair: symbol.pair,
			minQuantityUSD: symbol.minQuantityUSD,
			minNotional: symbol.minNotional,
			pricePrecision: symbolInfo.pricePrecision,
			quantityPrecision: symbolInfo.quantityPrecision,
			candlestick: symbol.candlestick,
			currentPrice: symbol.currentPrice,
			isReady: true,
			isLoading: true,
		});

		updateSymbol({ pair: symbol.pair, interval: Context.interval });
	}
};

export const getCompletePairList = async () => {
	const symbolList: {
		pair: string;
		minQuantityUSD: number;
		minNotional: number;
		candlestick: Candle[];
		currentPrice: number;
	}[] = [];

	const exchange = Binance();

	const { symbols: unformattedList } = await exchange.futuresExchangeInfo();
	for (const symbol of unformattedList) {
		const {
			symbol: pair,
			status,
			quoteAsset,
			baseAsset,
			contractType,
			filters,
		}: any = symbol;

		const minQty = Number(
			filters.find((f: any) => f.filterType === "LOT_SIZE").minQty
		);
		const minNotional = Number(
			filters.find((f: any) => f.filterType === "MIN_NOTIONAL").notional
		);

		const candlestick = await getCandlestick({
			pair,
			lookBackLength: Context.lookBackLength,
			interval: Context.interval,
		});

		const currentPrice = Number(candlestick[candlestick.length - 1].close) || 0;
		const minQuantityUSD = minQty * currentPrice;

		if (
			status !== "TRADING" ||
			quoteAsset !== "USDT" ||
			baseAsset === "USDT" ||
			contractType !== "PERPETUAL" ||
			minQuantityUSD > Context.minAmountToTrade ||
			minNotional > Context.minAmountToTrade
		) {
			continue;
		}
		symbolList.push({
			pair,
			minQuantityUSD,
			minNotional,
			candlestick,
			currentPrice,
		});
	}
	return symbolList;
};
