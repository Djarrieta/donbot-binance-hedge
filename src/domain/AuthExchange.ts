import type { Interval } from "./Interval";
import type { PositionSide } from "./Position";
import type { User } from "./User";
import type { Symbol } from "./Symbol";

export type AuthExchange = {
	getUsersData(props: GetUserDataProps): Promise<User[]>;
	quitPosition(props: QuitPositionProps): Promise<void>;
	cancelOrders(props: { user: User; pair: string }): Promise<void>;
	openPosition(props: openPositionProps): Promise<void>;
	protectPosition(props: openPositionProps): Promise<void>;
	securePosition(props: securePositionProps): Promise<void>;
	subscribeToUserUpdates(props: SubscribeToUserUpdatesProps): Promise<void>;
};

export type securePositionProps = {
	user: User;
	symbol: Symbol;
	positionSide: PositionSide;
	coinQuantity: number;
	bePrice: number;
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
	slPrice: number;
	tpPrice: number;
};
export type SubscribeToUserUpdatesProps = {
	user: User;
	handleClearOrders: (props: HandleClearOrdersProps) => void;
};

export type HandleClearOrdersProps = {
	user: User;
	pair?: string;
};
