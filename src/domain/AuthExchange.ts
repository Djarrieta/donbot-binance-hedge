import type { Interval } from "./Interval";
import type { PositionSide } from "./Position";
import type { User } from "./User";
import type { Symbol } from "./Symbol";

export type AuthExchange = {
	getUsersData(props: GetUserDataProps): Promise<User[]>;
	quitPosition(props: QuitPositionProps): Promise<void>;
	cancelOrders(props: { user: User; pair: string }): Promise<void>;
	openPosition(props: openPositionProps): Promise<void>;
	subscribeToUserUpdates(props: SubscribeToUserUpdatesProps): Promise<void>;
};

export type HistoricalPnl = {
	time: string;
	value: number;
	acc: number;
};

export type GetUserDataProps = {
	interval: Interval;
};
export type QuitPositionProps = {
	user: User;
	symbol: Symbol;
	positionSide: PositionSide;
	coinQuantity: number;
};
export type openPositionProps = {
	user: User;
	symbol: Symbol;
	positionSide: PositionSide;
	coinQuantity: number;
	sl: number;
	tp: number;
};
export type SubscribeToUserUpdatesProps = {
	user: User;
	handleClearOrders: (props: HandleClearOrdersProps) => void;
};

export type HandleClearOrdersProps = {
	user: User;
	pair?: string;
};
