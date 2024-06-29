export type PositionSide = "LONG" | "SHORT";

type PositionStatus =
	| "UNKNOWN"
	| "UNPROTECTED"
	| "PROTECTED"
	| "HEDGED"
	| "SECURED";

export type Position = {
	pair: string;
	positionSide: PositionSide;
	startTime: Date;
	endTime?: Date;
	entryPriceUSDT: number;
	pnl: number;
	accPnl?: number;
	tradeLength?: number;
	coinQuantity?: number;
	status: PositionStatus;
	isHedgeUnbalance?: boolean;
	stgName?: string;
	sl?: number;
	tp?: number;
};
