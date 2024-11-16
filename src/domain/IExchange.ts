export type IExchange = {
	securePosition(arg0: {
		symbol: import("./Symbol").Symbol;
		user: import("./User").User;
		positionSide: import("./Position").PositionSide;
		coinQuantity: number;
		bePrice: number;
	}): unknown;
	protectPosition(arg0: {
		symbol: import("./Symbol").Symbol;
		user: import("./User").User;
		positionSide: import("./Position").PositionSide;
		coinQuantity: number;
		slPrice: number;
		tpPrice: number;
	}): unknown;
	openPosition(arg0: {
		symbol: import("./Symbol").Symbol;
		user: import("./User").User;
		positionSide: import("./Position").PositionSide;
		coinQuantity: number;
		slPrice: number;
		tpPrice: number;
	}): unknown;
	cancelOrders(arg0: { user: import("./User").User; pair: string }): unknown;
	quitPosition(arg0: {
		user: import("./User").User;
		symbol: import("./Symbol").Symbol;
		positionSide: import("./Position").PositionSide;
		coinQuantity: number;
	}): unknown;
};
