import { getDate, type ShortDateString } from "./utils/getDate";

enum Interval {
	"1m" = 1000 * 60,
	"3m" = 1000 * 60 * 3,
	"5m" = 1000 * 60 * 5,
	"15m" = 1000 * 60 * 15,
	"30m" = 1000 * 60 * 30,
	"1h" = 1000 * 60 * 60,
	"2h" = 1000 * 60 * 60 * 2,
	"4h" = 1000 * 60 * 60 * 4,
	"6h" = 1000 * 60 * 60 * 6,
	"8h" = 1000 * 60 * 60 * 8,
	"12h" = 1000 * 60 * 60 * 12,
	"1d" = 1000 * 60 * 60 * 24,
	"3d" = 1000 * 60 * 60 * 24 * 3,
	"1w" = 1000 * 60 * 60 * 24 * 7,
	"1M" = 1000 * 60 * 60 * 24 * 30,
}
type Candle = {
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	openTime: number;
	pair: string;
};

type Symbol = {
	pair: string;
	pricePrecision: number;
	quantityPrecision: number;
	currentPrice: number;
	isReady: boolean;
	candlestick: Candle[];
};

export type PositionSide = "LONG" | "SHORT";

type PositionStatus =
	| "UNKNOWN"
	| "UNPROTECTED"
	| "PROTECTED"
	| "HEDGED"
	| "SECURED";

type Position = {
	pair: string;
	positionSide: PositionSide;
	startTime: Date;
	entryPriceUSDT: number;
	pnl: number;
	coinQuantity: number;
	status: PositionStatus;
	isHedgeUnbalance: boolean;
	stgName: string;
	sl: number;
	tp: number;
};

type OrderType = "NEW" | "HEDGE" | "PROFIT" | "BREAK" | "QUIT" | "UNKNOWN";

type Order = {
	orderId: number;
	pair: string;
	clientOrderId: string;
	price: number;
	coinQuantity: number;
	orderType: OrderType;
};
type User = {
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

type StrategyResponse = {
	stgName: string;
	positionSide: PositionSide | null;
	sl: number;
	tp: number;
	pair: string;
};

type Strategy = {
	stgName: string;
	lookBackLength: number;
	interval: Interval;
	validate: (props: {
		candlestick: Candle[];
		pair: string;
	}) => StrategyResponse;
};

class BacktestDataService {
	saveBacktestData = (candleBT: Candle[]): Promise<void> => {
		//TODO implement

		return Promise.resolve();
	};

	getCandlestick = ({
		pair,
		startDate,
		endDate,
	}: {
		pair: string;
		startDate: Date;
		endDate: Date;
	}): Promise<Candle[]> => {
		//TODO implement
		return Promise.resolve([]);
	};
}
class SymbolService {
	getBacktestData({
		start,
		end,
	}: {
		start: number;
		end: number;
	}): Promise<Symbol[]> {
		//TODO implement
		return Promise.resolve([]);
	}
	getSymbolsData({
		start,
		end,
	}: {
		start: number;
		end: number;
	}): Promise<Symbol[]> {
		//TODO implement
		return Promise.resolve([]);
	}
	getPairList(): Promise<string[]> {
		//TODO implement
		return Promise.resolve([]);
	}
	getCandlestick({
		pair,
		start,
		end,
	}: {
		pair: string;
		start: number;
		end: number;
	}): Promise<Candle[]> {
		//TODO implement
		return Promise.resolve([]);
	}
}

class UserService {
	getUser() {
		//TODO implement
	}
}

class Trade {
	params = {
		interval: Interval["15m"],
		lookBackLength: 200,
		backtest: {
			start: getDate("2024-09-22" as ShortDateString).dateMs,
			end: getDate("2024-09-23" as ShortDateString).dateMs,
			lookBackLengthArray: [100],
			slArray: [1 / 100],
			tpArray: [5 / 100],
		},
	};
	backtestDataService = new BacktestDataService();
	symbolService = new SymbolService();
	userService = new UserService();
	symbols: Symbol[] = [];
	users: User[] = [];
	strategies: Strategy[] = [];

	async prepareBacktest() {
		const pairList = await this.symbolService.getPairList();
		for (const pair of pairList) {
			const candlestick = await this.backtestDataService.getCandlestick({
				pair,
				startDate: new Date(), //TODO
				endDate: new Date(), //TODO
			});

			await this.backtestDataService.saveBacktestData(candlestick);
		}
	}
	async backtest({ startBt, endBt }: { startBt: number; endBt: number }) {
		for (const sl of this.params.backtest.slArray) {
			for (const tp of this.params.backtest.tpArray) {
				for (const lookBackLength of this.params.backtest.lookBackLengthArray) {
					let start = startBt;
					let end = startBt + lookBackLength * this.params.interval;
					do {
						const symbols = await this.symbolService.getBacktestData({
							start,
							end,
						});
						const response = this.check({ symbols });

						start += this.params.lookBackLength;
						end += this.params.lookBackLength;
					} while (end < endBt);
				}
			}
		}
	}

	init() {
		//TODO implement
		//load symbols
		//load users
	}
	check({ symbols }: { symbols: Symbol[] }) {
		const readySymbols = symbols.filter((s) => s.isReady);
		const response: {
			text: string;
			trades: StrategyResponse[];
		} = { text: "", trades: [] };
		for (const strategy of this.strategies) {
			for (const symbol of readySymbols) {
				const stgResponse = strategy?.validate({
					candlestick: symbol.candlestick,
					pair: symbol.pair,
				});
				if (stgResponse.positionSide) {
					response.trades.push(stgResponse);
				}
			}
		}

		if (response.trades.length > 4) {
			response.text =
				"+ Should trade " +
				response.trades[0].pair +
				", " +
				response.trades[1].pair +
				", ...(" +
				(response.trades.length - 2) +
				" more) ";
		}
		if (response.trades.length && response.trades.length <= 4) {
			response.text =
				"+ Should trade " +
				response.trades.map(
					(t) => " " + t.positionSide + " in " + t.pair + " with " + t.stgName
				);
		}

		return response;
	}
}
