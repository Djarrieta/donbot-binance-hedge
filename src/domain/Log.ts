import type { ConfigTrade } from "./ConfigTrade";
import type { Strategy } from "./Strategy";
import type { Symbol } from "./Symbol";
import type { User } from "./User";

export type Log = {
	eventData?: any;
	type: LogType;
	date: number;
	tradeData: LogData;
};

export type LogType =
	| "Init"
	| "OpenPos"
	| "ClosePos"
	| "SecurePos"
	| "ProtectPos"
	| "Error";
export type LogData = {
	symbolList: Symbol[];
	userList: User[];
	strategies: Strategy[];
	config: ConfigTrade;
};
