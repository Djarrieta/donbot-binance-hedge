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
	endTime: Date | null;
	entryPriceUSDT: number;
	pnl: number;
	len: number;
	coinQuantity: string;
	status: PositionStatus;
	isHedgeUnbalance: boolean;
};
