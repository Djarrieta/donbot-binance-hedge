import {
	getDate,
	type DateString,
	type ShortDateString,
} from "../utils/getDate";
import Binance, { type CandleChartInterval_LT } from "binance-api-node";
import { Database } from "bun:sqlite";
import cliProgress from "cli-progress";
import { chosenStrategies } from "../strategies";
import { rsi } from "technicalindicators";
import { getVolatility } from "../utils/getVolatility";

export enum Interval {
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
export type Candle = {
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	openTime: number;
	pair: string;
};

export type Symbol = {
	pair: string;
	pricePrecision: number;
	quantityPrecision: number;
	currentPrice: number;
	isReady: boolean;
	candlestick: Candle[];
};

export type PositionSide = "LONG" | "SHORT";

export type PositionStatus =
	| "UNKNOWN"
	| "UNPROTECTED"
	| "PROTECTED"
	| "HEDGED"
	| "SECURED";

export type Position = {
	pair: string;
	positionSide: PositionSide;
	startTime: number;
	entryPriceUSDT: number;
	pnl: number;
	coinQuantity: number;
	status: PositionStatus;
	isHedgeUnbalance: boolean;
	stgName: string;
	sl: number;
	tp: number;
};
type BTPosition = Omit<
	Position,
	"coinQuantity" | "status" | "isHedgeUnbalance"
> & { tradeLength: number };

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
	pair: string;
	sl: number;
	tp: number;
};

class Strategy {
	constructor(props: {
		stgName: string;
		lookBackLength: number;
		interval: Interval;
		allowedPairs?: string[];
		sl: number;
		tp: number;
		validate: (props: {
			candlestick: Candle[];
			pair: string;
		}) => StrategyResponse;
	}) {
		this.stgName = props.stgName;
		this.lookBackLength = props.lookBackLength;
		this.interval = props.interval;
		this.allowedPairs = props.allowedPairs;
		this.sl = props.sl;
		this.tp = props.tp;
		this.validate = props.validate;
	}

	stgName: string;
	lookBackLength: number;
	interval: Interval;
	allowedPairs?: string[];
	sl: number;
	tp: number;
	validate: (props: {
		candlestick: Candle[];
		pair: string;
	}) => StrategyResponse;
}

const rsiDivergency5m = new Strategy({
	stgName: "rsiDivergency5m",
	lookBackLength: 200,
	interval: Interval["5m"],
	allowedPairs: [],
	sl: 0,
	tp: 0,

	validate({ candlestick, pair }) {
		const response: StrategyResponse = {
			positionSide: null,
			stgName: this.stgName,
			pair,
			sl: this.sl,
			tp: this.tp,
		};

		if (candlestick.length < params.lookBackLength) return response;
		if (this.allowedPairs?.length && !this.allowedPairs.includes(pair))
			return response;

		const MIN_RSI = 30;
		const CANDLESTICK_SIZE = 50;

		const closePrices = candlestick.map((candle) => candle.close);
		const rsiArray = rsi({ period: 14, values: closePrices });

		let candlestickValues: number[] = [];

		candlestick.forEach(({ close, high, low, open }) => {
			candlestickValues.push(close, high, low, open);
		});

		if (
			rsiArray[rsiArray.length - 1] <= MIN_RSI &&
			rsiArray[rsiArray.length - 2] <= MIN_RSI &&
			rsiArray[rsiArray.length - 1] > rsiArray[rsiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...rsiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal > MIN_RSI);

			const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
			const secondRange = rsiArray.slice(
				rsiArray.length - CANDLESTICK_SIZE,
				rsiArray.length - firstZeroCrossingIndex
			);

			const firstMin = Math.min(
				...firstRange.map((value) => Number(value) || 0)
			);
			const secondMin = Math.min(
				...secondRange.map((value) => Number(value) || 0)
			);

			if (firstMin !== 0 && secondMin !== 0 && firstMin > secondMin) {
				response.positionSide = "LONG";
			}
		}

		if (
			rsiArray[rsiArray.length - 1] >= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 2] >= 100 - MIN_RSI &&
			rsiArray[rsiArray.length - 1] < rsiArray[rsiArray.length - 2]
		) {
			const firstZeroCrossingIndex = [...rsiArray]
				.reverse()
				.findIndex((arrayVal) => arrayVal < 100 - MIN_RSI);

			const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
			const secondRange = rsiArray.slice(
				rsiArray.length - CANDLESTICK_SIZE,
				rsiArray.length - firstZeroCrossingIndex
			);

			const firstMax = Math.max(
				...firstRange.map((value) => Number(value) || 0)
			);
			const secondMax = Math.max(
				...secondRange.map((value) => Number(value) || 0)
			);

			if (firstMax !== 0 && secondMax !== 0 && firstMax < secondMax) {
				response.positionSide = "SHORT";
			}
		}

		return response;
	},
});

class BacktestDataService {
	private db: Database;

	constructor() {
		this.db = new Database("DB.db");
		this.configureDatabase();
	}

	private configureDatabase() {
		this.db.run("PRAGMA busy_timeout = 5000");
		this.db.query("PRAGMA journal_mode = WAL");
		this.db
			.query(
				"CREATE TABLE IF NOT EXISTS symbolsBT (pair TEXT, open REAL, high REAL, low REAL, close REAL, volume REAL, openTime INTEGER)"
			)
			.run();
	}

	saveCandlestick = (candlestick: Candle[]) => {
		const query = `INSERT INTO symbolsBT (pair, open, high, low, close, volume, openTime) VALUES (?, ?, ?, ?, ?, ?, ?)`;

		candlestick.forEach((candle) => {
			this.db
				.query(query)
				.run(
					candle.pair,
					candle.open,
					candle.high,
					candle.low,
					candle.close,
					candle.volume,
					candle.openTime
				);
		});
	};

	showNumberOfRows = async () => {
		const results = this.db.query("SELECT * FROM symbolsBT").all();
		console.log(results.length);
	};

	getCandlestick = (
		pairs?: string[],
		start?: number,
		end?: number
	): Candle[] => {
		const query = `SELECT * FROM symbolsBT ${
			pairs ? `WHERE pair IN (${pairs.map((p) => `'${p}'`).join(",")})` : ""
		} ${start ? `AND openTime >= ${start}` : ""} ${
			end ? `AND openTime <= ${end}` : ""
		} ORDER BY openTime ASC`;

		const results = this.db.query(query).all() as Candle[];
		return results;
	};

	deleteRows() {
		this.db.query("DELETE FROM symbolsBT").run();
		console.log("All rows deleted from symbolsBT");
	}

	closeConnection() {
		this.db.close();
	}
}
class SymbolService {
	getBacktestData({
		pairList,
		start,
		end,
	}: {
		pairList?: string[];
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
	async getPairList({
		minAmountToTradeUSDT,
	}: {
		minAmountToTradeUSDT: number;
	}): Promise<string[]> {
		const pairList: string[] = [];
		const exchange = Binance();
		const { symbols: unformattedList } = await exchange.futuresExchangeInfo();
		const prices = await exchange.futuresMarkPrice();
		for (const symbol of unformattedList.slice(0, 10)) {
			const {
				symbol: pair,
				status,
				quoteAsset,
				baseAsset,
				contractType,
				filters,
			}: any = symbol;

			const minQty = Number(
				filters.find((f: any) => f.filterType === "LOT_SIZE").minQty
			);
			const minNotional = Number(
				filters.find((f: any) => f.filterType === "MIN_NOTIONAL").notional
			);
			const currentPrice =
				Number(prices.find((p) => p.symbol === pair)?.markPrice) || 0;
			const minQuantityUSD = minQty * currentPrice;

			if (
				status !== "TRADING" ||
				quoteAsset !== "USDT" ||
				baseAsset === "USDT" ||
				contractType !== "PERPETUAL" ||
				minQuantityUSD > minAmountToTradeUSDT ||
				minNotional > minAmountToTradeUSDT
			) {
				continue;
			}
			pairList.push(pair);
		}
		return pairList;
	}
	async getCandlestick({
		pair,
		lookBackLength,
		interval,
		apiLimit,
	}: {
		pair: string;
		interval: Interval;
		lookBackLength: number;
		apiLimit: number;
	}): Promise<Candle[]> {
		let candlestick: Candle[] = [];

		const exchange = Binance();

		let n = lookBackLength;

		do {
			const startTime = getDate(getDate().dateMs - (n + 1) * interval).dateMs;
			const unformattedCandlestick = await exchange.futuresCandles({
				symbol: pair,
				interval: Interval[interval] as CandleChartInterval_LT,
				startTime,
				limit: Math.min(lookBackLength, apiLimit),
			});

			const formattedCandlestick = unformattedCandlestick.map(
				({ close, open, high, low, openTime, volume }) => {
					return {
						pair,
						close: Number(close),
						open: Number(open),
						high: Number(high),
						low: Number(low),
						openTime: Number(openTime),
						volume: Number(volume),
					};
				}
			);

			const firstCandle = formattedCandlestick.length
				? getDate(formattedCandlestick[0].openTime).dateMs
				: 0;
			const startTimeDiff = Math.abs(startTime - firstCandle) / interval;
			if (startTimeDiff <= 1) {
				candlestick.push(...formattedCandlestick);
			}

			n -= apiLimit;
		} while (n > 0);

		return candlestick;
	}
}

class UserService {
	getUser() {
		//TODO implement
	}
}

const params = {
	interval: Interval["5m"],
	lookBackLength: 200,
	maxTradeLength: 50,
	maxOpenPositions: 1,
	fee: 0.0005,
	riskPt: 0.5 / 100,
	minAmountToTradeUSDT: 6,
	candlestickAPILimit: 500,
	backtest: {
		start: getDate("2024 09 23 00:00:00" as DateString).dateMs,
		end: getDate("2024 09 24 00:00:00" as DateString).dateMs,
		maxTradeLengthArray: [100],
		slArray: [1 / 100],
		tpArray: [5 / 100],
	},
};

class Trade {
	params = params;
	backtestDataService = new BacktestDataService();
	symbolService = new SymbolService();
	userService = new UserService();
	symbols: Symbol[] = [];
	users: User[] = [];
	strategies: Strategy[] = [rsiDivergency5m];

	async prepareBacktest() {
		this.backtestDataService.deleteRows();

		const pairList = await this.symbolService.getPairList({
			minAmountToTradeUSDT: this.params.minAmountToTradeUSDT,
		});

		const progressBar = new cliProgress.SingleBar(
			{},
			cliProgress.Presets.shades_classic
		);
		progressBar.start(pairList.length, 0);

		const lookBackLength =
			(this.params.backtest.end - this.params.backtest.start) /
			this.params.interval;

		for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
			const pair = pairList[pairIndex];

			const candlestick = await this.symbolService.getCandlestick({
				pair,
				apiLimit: this.params.candlestickAPILimit,
				interval: this.params.interval,
				lookBackLength,
			});
			progressBar.stop();

			this.backtestDataService.saveCandlestick(candlestick);
			progressBar.update(pairIndex + 1);
		}
		console.log("Backtest data prepared for " + pairList.length + " pairs");
	}
	async backtest() {
		for (const sl of this.params.backtest.slArray) {
			for (const tp of this.params.backtest.tpArray) {
				const closedPositions: BTPosition[] = [];

				let start = this.params.backtest.start;
				let end =
					this.params.backtest.start +
					this.params.lookBackLength * this.params.interval;

				do {
					const symbols = await this.symbolService.getBacktestData({
						start,
						end,
					});
					const { trades } = this.checkForTrades({ symbols });

					for (const trade of trades) {
						const symbol = symbols.find((s) => s.pair === trade.pair);

						if (symbol && trade.positionSide) {
							for (const maxTradeLength of this.params.backtest
								.maxTradeLengthArray) {
								const { candlestick: profitStick } = (
									await this.symbolService.getBacktestData({
										pairList: [symbol.pair],
										start: start + this.params.interval,
										end: start + this.params.interval + maxTradeLength,
									})
								)[0];
								let pnl = 0;
								let stickIndex = 0;
								let done = false;
								do {
									const candle = profitStick[stickIndex];

									if (
										(trade.positionSide === "LONG" &&
											(candle.low <= trade.sl || candle.close <= trade.sl)) ||
										(trade.positionSide === "SHORT" &&
											(candle.high >= trade.sl || candle.close >= trade.sl))
									) {
										pnl = -this.params.riskPt - this.params.fee;
										done = true;
									}

									if (
										(trade.positionSide === "LONG" &&
											(candle.high >= trade.tp || candle.close >= trade.tp)) ||
										(trade.positionSide === "SHORT" &&
											(candle.low <= trade.tp || candle.close <= trade.tp))
									) {
										pnl = this.params.riskPt * (tp / sl) - this.params.fee;
										done = true;
									}

									stickIndex++;
								} while (done !== true && stickIndex < profitStick.length - 1);

								if (pnl === 0) {
									const lastPrice = profitStick[profitStick.length - 1].close;
									const pnlGraph =
										(trade.positionSide === "LONG"
											? lastPrice - profitStick[0].open
											: profitStick[0].open - lastPrice) / profitStick[0].open;

									pnl = this.params.riskPt * (pnlGraph / sl) - this.params.fee;
								}

								closedPositions.push({
									pair: symbol.pair,
									entryPriceUSDT: profitStick[0].open,
									startTime: profitStick[0].openTime,
									pnl,
									tradeLength: stickIndex,
									stgName: trade.stgName,
									positionSide: trade.positionSide,
									sl: trade.sl,
									tp: trade.tp,
								});
							}
						}
					}

					start += this.params.lookBackLength;
					end += this.params.lookBackLength;
				} while (end < this.params.backtest.end);
			}
		}
	}

	init() {
		//TODO implement
		//load symbols
		//load users
	}
	periodical() {
		//TODO implement
	}
	checkForTrades({ symbols }: { symbols: Symbol[] }) {
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

const trade = new Trade();
trade.backtest();
