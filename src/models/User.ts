import { Users } from "../xata";
import { Order } from "./Order";
import { Position } from "./Position";

export interface User extends Users {
	balanceUSDT: number;
	openPositions: Position[];
	todayPnlPt: number;
	totalPnlPt: number;
	openPosPnlPt: number;
	openOrders: Order[];
	isAddingPosition: boolean;
	text: string;
}
