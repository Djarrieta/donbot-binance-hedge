import { Users } from "../xata";
import { Position } from "./Position";

export interface User extends Users {
	balanceUSDT: number;
	openPositions: Position[];
	todayPnlPt: number;
	totalPnlPt: number;
	addingPosition: boolean;
}
