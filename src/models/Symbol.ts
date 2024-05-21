import type { Candle } from "./Candle";

export type Symbol = {
	pair: string;
	pricePrecision: number;
	quantityPrecision: number;
	minQuantityUSD: number;
	minNotional: number;
	candlestick: Candle[];
	currentPrice: number;
	isReady: boolean;
	isLoading: boolean;
	volatility?: number;
};
