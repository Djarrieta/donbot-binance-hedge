export type PositionSide = "LONG" | "SHORT";

export interface Position {
	pair: string;
	positionSide: PositionSide;
	coinQuantity: string;
	startTime: Date;
	entryPriceUSDT: number;
	status: "open" | "covered";
}
