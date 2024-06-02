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
	coinQuantity: string;
	startTime: Date;
	entryPriceUSDT: number;
	status: PositionStatus;
	pnl: number;
	len: number;
	isHedgeUnbalance: boolean;
};
