import Binance from "binance-api-node";
import { params } from "../../Params";

export const getPairList = async () => {
	const pairList: string[] = [];
	const exchange = Binance();
	const { symbols: unformattedList } = await exchange.futuresExchangeInfo();
	const prices = await exchange.futuresMarkPrice();
	//TBD: Remove slice
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
		const currentPrice =
			Number(prices.find((p) => p.symbol === pair)?.markPrice) || 0;
		const minQuantityUSD = minQty * currentPrice;

		if (
			status !== "TRADING" ||
			quoteAsset !== "USDT" ||
			baseAsset === "USDT" ||
			contractType !== "PERPETUAL" ||
			minQuantityUSD > params.minAmountToTrade ||
			minNotional > params.minAmountToTrade
		) {
			continue;
		}
		pairList.push(pair);
	}
	return pairList;
};
