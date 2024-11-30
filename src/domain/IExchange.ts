import type { CandleBt } from "./Candle";
import { Interval } from "./Interval";
import type { Symbol } from "./Symbol";
import type { Strategy } from "./Strategy";

export type IExchange = {
	getPairList(props: GetPairListProps): Promise<string[]>;
	getCandlestick: (props: GetCandlestickProps) => Promise<CandleBt[]>;
	getSymbolsData(props: GetSymbolsDataProps): Promise<Symbol[]>;
	subscribeToSymbolUpdates(props: SubscribeToSymbolUpdatesProps): void;
};

export type GetCandlestickProps = {
	pair: string;
	interval: Interval;
	start: number;
	end: number;
	candlestickAPILimit: number;
};

export type GetSymbolsDataProps = {
	minAmountToTradeUSDT: number;
	interval: Interval;
	lookBackLength: number;
	candlestickAPILimit: number;
	apiLimit: number;
	strategies: Strategy[];
};
export type GetPairListProps = {
	minAmountToTradeUSDT: number;
};
export type UpdateSymbolProps = {
	pair: string;
	price?: number;
	newCandle?: CandleBt;
};

export type SubscribeToSymbolUpdatesProps = {
	pair: string;
	interval: Interval;
	updateSymbol: (props: UpdateSymbolProps) => void;
};
