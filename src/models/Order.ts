export const ORDER_ID_DIV = "__|__";

export enum OrderType {
	NEW = "NEW",
	HEDGE = "HEDGE",
	PROFIT = "PROFIT",
	SECURE = "SECURE",
	UNKNOWN = "UNKNOWN",
}

export interface Order {
	pair: string;
	clientOrderId: string;
	price: number;
	coinQuantity: number;
	orderType: OrderType;
}
