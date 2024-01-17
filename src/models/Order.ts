import { PositionSide } from "./Position";

export interface Order {
	pair: string;
	clientOrderId: string;
	price: number;
	coinQuantity: number;
	orderType: string;
}
