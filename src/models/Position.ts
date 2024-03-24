export type PositionSide = "LONG" | "SHORT";
import { Binance as IBinance } from "binance-api-node";
import { Symbol } from "../models/Symbol";

export const PosType = {
	PS: "PS",
	HE: "HE",
	TP: "TP",
	TR: "TR",
	UN: "UN",
};

export interface Position {
	pair: string;
	positionSide: PositionSide;
	coinQuantity: string;
	startTime: Date;
	entryPriceUSDT: number;
	status: "UNKNOWN" | "UNPROTECTED" | "PROTECTED" | "HEDGED" | "SECURED";
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
