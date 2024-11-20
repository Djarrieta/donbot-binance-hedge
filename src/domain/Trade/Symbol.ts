import type { Candle } from "../Candle";

export type Symbol = {
	pair: string;
	pricePrecision: number;
	quantityPrecision: number;
	candlestick: Candle[];
	currentPrice: number;
	isReady: boolean;
	volatility?: number;
};
