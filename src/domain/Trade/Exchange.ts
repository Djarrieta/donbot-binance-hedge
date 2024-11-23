import type { PositionSide } from "../Position";
import type { User } from "./User";
import type { Symbol } from "./Symbol";
import type { Interval } from "../Interval";
import type { Candle } from "../Candle";

export type UpdateSymbolProps = {
	pair: string;
	price?: number;
	newCandle?: Candle;
	interval: Interval;
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
export type Exchange = {
	quitPosition(props: {
		user: User;
		symbol: Symbol;
		positionSide: PositionSide;
		coinQuantity: number;
	}): Promise<void>;
	cancelOrders(props: { user: User; pair: any }): Promise<void>;
	openPosition(props: openPositionProps): Promise<void>;
	getUsersData({
		interval,
		amountToTrade,
	}: {
		interval: Interval;
		amountToTrade: number;
	}): Promise<User[]>;
	getSymbolsData(): Promise<Symbol[]>;
	subscribeToUserUpdates(props: { user: User }): Promise<void>;
	subscribeToSymbolUpdates(props: {
		pair: string;
		interval: Interval;
		updateSymbol: (props: UpdateSymbolProps) => void;
	}): void;
};
