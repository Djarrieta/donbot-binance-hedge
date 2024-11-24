import type { CandleBt } from "../domain/Candle";
import { Interval } from "../domain/Interval";
import type { Symbol } from "../domain/Symbol";

export type Exchange = {
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
