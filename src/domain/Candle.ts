export type Candle = {
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	openTime: number;
};

export type CandleBt = Candle & { pair: string };
