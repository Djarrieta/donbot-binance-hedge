import { Candle } from "./Candle";

export interface Symbol {
	pair: string;
	pricePrecision: number;
	quantityPrecision: number;
	minQuantityUSD: number;
	minNotional: number;

	candlestick: Candle[];
	currentPrice: number;
	isReady: boolean;
}
