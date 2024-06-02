export const ORDER_ID_DIV = "____";

export enum OrderType {
	NEW = "NEW",
	HEDGE = "HEDGE",
	PROFIT = "PROFIT",
	BREAK = "BREAK",
	UNKNOWN = "UNKNOWN",
}

export type Order = {
	orderId: number;
	pair: string;
	clientOrderId: string;
	price: number;
	coinQuantity: number;
	orderType: OrderType;
};
