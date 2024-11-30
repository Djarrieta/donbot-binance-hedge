export type PositionSide = "LONG" | "SHORT";

export type PositionStatus =
	| "UNKNOWN"
	| "UNPROTECTED"
	| "PROTECTED"
	| "HEDGED"
	| "SECURED";

export type Position = {
	pair: string;
	positionSide: PositionSide;
	startTime: number;
	tradeLength?: number;
	entryPriceUSDT: number;
	pnl: number;
	coinQuantity: number;
	status: PositionStatus;
	isHedgeUnbalance?: boolean;
	stgName: string;
	sl: number;
	tp: number;
};

export type PositionBT = Pick<
	Position,
	"pair" | "positionSide" | "startTime" | "entryPriceUSDT" | "pnl" | "stgName"
> & {
	tradeLength: number;
	secureLength?: number;
};
