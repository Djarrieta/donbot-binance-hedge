export type PositionSide = "LONG" | "SHORT";
import { Binance as IBinance } from "binance-api-node";
import { Symbol } from "../models/Symbol";

export const PosType = {
	PS: "PS",
	HE: "HE",
	TP: "TP",
	KP: "KP",
	UN: "UN",
};

export interface Position {
	pair: string;
	positionSide: PositionSide;
	coinQuantity: string;
	startTime: Date;
	entryPriceUSDT: number;
}
export interface PlacePosition {
	symbol: Symbol;
	price: number;
	sl: number;
	tp: number;
	shouldTrade: PositionSide;
	authExchange: IBinance;
	quantity: string;
}
