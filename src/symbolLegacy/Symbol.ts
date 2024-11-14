import type { Candle } from "../sharedModels/Candle";

export type Symbol = {
	pair: string;
	pricePrecision: number;
	quantityPrecision: number;
	candlestick: Candle[];
	currentPrice: number;
	isReady: boolean;
	volatility?: number;
};
