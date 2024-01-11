import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { Symbol } from "../models/Symbol";
import { getCandlestick } from "./getCandlestick";

export const getSymbolList = async () => {
	let symbolList: Symbol[] = [];

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

		const { symbols: pairs } = await exchange.futuresExchangeInfo();
		const symbolInfo = pairs.filter((p) => p.symbol === pair)[0];
		const { pricePrecision, quantityPrecision } = symbolInfo;

		const array = [
			...candlestick.map((c) => c.close),
			...candlestick.map((c) => c.open),
		];
		const max = Math.max(...array);
		const min = Math.min(...array);

		const volatility = Math.abs(max - min) / currentPrice || 0;

		symbolList.push({
			pair,
			minQuantityUSD,
			minNotional,
			currentPrice,
			pricePrecision,
			quantityPrecision,
			candlestick,
			volatility,
		});

		if (symbolList.length >= 5) {
			//temporal break
			break;
		}
	}

	return symbolList;
};
