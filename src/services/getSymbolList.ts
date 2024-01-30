import Binance from "binance-api-node";
import { Candle } from "../models/Candle";
import { Context } from "../models/Context";
import { getCandlestick } from "./getCandlestick";
import { subscribeToSymbolUpdates } from "./subscribeToSymbolUpdates";

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

		subscribeToSymbolUpdates({ pair: symbol.pair, interval: Context.interval });
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
	return symbolList.slice(0, 10);
};

export const getSymbolListVolatility = async () => {
	const context = await Context.getInstance();

	for (let index = 0; index < context.symbolList.length; index++) {
		const symbol = context.symbolList[index];

		if (!symbol.isReady || symbol.isLoading) continue;

		const volatility = getVolatility({ candlestick: symbol.candlestick });

		context.symbolList[index].volatility = volatility;
	}
};

export const getVolatility = ({ candlestick }: { candlestick: Candle[] }) => {
	const { close: lastPrice } = candlestick[candlestick.length - 1];

	const array = [
		...candlestick.map((c) => c.high),
		...candlestick.map((c) => c.low),
	];

	const max = Math.max(...array);
	const min = Math.min(...array);

	const volatility = (max - min) / lastPrice;
	return volatility;
};
