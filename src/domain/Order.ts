export enum OrderType {
	NEW = "NEW",
	HEDGE = "HEDGE",
	PROFIT = "PROFIT",
	BREAK = "BREAK",
	QUIT = "QUIT",
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
