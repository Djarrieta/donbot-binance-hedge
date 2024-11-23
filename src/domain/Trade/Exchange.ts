import type { PositionSide } from "../Position";
import type { User } from "./User";
import type { Symbol } from "./Symbol";
import type { Interval } from "../Interval";
import type { Candle } from "../Candle";

export type Exchange = {
	getPairList(props: GetPairListProps): Promise<string[]>;
	getSymbolsData(props: GetSymbolsDataProps): Promise<Symbol[]>;
	subscribeToSymbolUpdates(props: SubscribeToSymbolUpdatesProps): void;
	getUsersData(props: GetUserDataProps): Promise<User[]>;
	quitPosition(props: QuitPositionProps): Promise<void>;
	cancelOrders(props: { user: User; pair: string }): Promise<void>;
	openPosition(props: openPositionProps): Promise<void>;
	subscribeToUserUpdates(props: { user: User }): Promise<void>;
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
	newCandle?: Candle;
};
export type openPositionProps = {
	user: User;
	symbol: Symbol;
	positionSide: PositionSide;
	coinQuantity: number;
	sl: number;
	tp: number;
	stgName: string;
};

export type HistoricalPnl = {
	time: string;
	value: number;
	acc: number;
};
export type QuitPositionProps = {
	user: User;
	symbol: Symbol;
	positionSide: PositionSide;
	coinQuantity: number;
};
export type GetUserDataProps = {
	interval: Interval;
};
export type SubscribeToSymbolUpdatesProps = {
	pair: string;
	interval: Interval;
	updateSymbol: (props: UpdateSymbolProps) => void;
};
