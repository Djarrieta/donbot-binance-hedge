import type { Order } from "../sharedModels/Order";
import type { Position } from "../sharedModels/Position";

export type User = {
	name: string;
	binanceApiKey: string;
	binanceApiSecret: string;
	startDate: Date;

	openPositions: Position[];
	openOrders: Order[];
	openPosPnlPt: number;

	balanceUSDT: number;
	totalPnlPt: number;
	isAddingPosition: boolean;
	text: string;
};

export type UserSeed = Pick<
	User,
	"name" | "binanceApiKey" | "binanceApiSecret" | "startDate"
>;
