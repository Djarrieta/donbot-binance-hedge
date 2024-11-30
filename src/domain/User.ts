import type { Order } from "./Order";
import type { Position } from "./Position";

export type User = {
	name: string;
	binanceApiKey: string;
	binanceApiSecret: string;
	startDate: number;

	openPositions: Position[];
	openOrders: Order[];
	openPosPnlPt: number;

	balanceUSDT: number;
	totalPnlPt: number;
	isAddingPosition: boolean;
	text: string;
};

export type UserSeedDTO = Pick<
	User,
	"name" | "binanceApiKey" | "binanceApiSecret" | "startDate"
>;
