export type PositionSide = "LONG" | "SHORT";
import { Binance as IBinance } from "binance-api-node";
import { Symbol } from "../models/Symbol";

type PositionStatus =
	| "UNKNOWN"
	| "UNPROTECTED"
	| "PROTECTED"
	| "HEDGED"
	| "SECURED";

export interface Position {
	pair: string;
	positionSide: PositionSide;
	coinQuantity: string;
	startTime: Date;
	entryPriceUSDT: number;
	status: PositionStatus;
	pnl: number;
}
export interface PlacePosition {
	symbol: Symbol;
	price: number;
	sl?: number;
	he?: number;
	tp: number;
	tr?: number;
	cb?: number;
	shouldTrade: PositionSide;
	authExchange: IBinance;
	quantity: string;
}
