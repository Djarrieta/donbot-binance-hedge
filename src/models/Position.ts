import { Order } from "./Order";

export type PositionSide = "LONG" | "SHORT";
export type PositionStatus = "open" | "covered" | "unprotected" | "unknown";

export interface Position {
	pair: string;
	positionSide: PositionSide;
	coinQuantity: string;
	startTime: Date;
	entryPriceUSDT: number;
	orders: Order[];
	status: PositionStatus;
}
