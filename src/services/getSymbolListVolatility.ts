import { Candle } from "../models/Candle";
import { Context } from "../models/Context";

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
