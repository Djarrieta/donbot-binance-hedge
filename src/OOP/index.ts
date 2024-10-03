import Binance, { type CandleChartInterval_LT } from "binance-api-node";
import { Database } from "bun:sqlite";
import cliProgress from "cli-progress";
import { rsi } from "technicalindicators";
import { getDate, type DateString } from "../utils/getDate";

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
	"coinQuantity" | "status" | "isHedgeUnbalance" | "sl" | "tp"
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
	sl: 1 / 100,
	tp: 5 / 100,

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

class BacktestSymbolService {
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

	showNumberOfPairs = async () => {
		const pairList = this.getSavedPairList();

		const firstTwoPairs = pairList.slice(0, 2).join(", ");
		const remainingPairs = pairList.length - 2;
		console.log(
			`Pairs in symbolsBT table: ${firstTwoPairs}${
				remainingPairs > 0 ? `, and ${remainingPairs} others` : ""
			}`
		);
	};

	showSavedInformation = () => {
		const items = 5;
		const results = this.db
			.query(
				"SELECT pair, COUNT(*) AS count, MIN(openTime) AS startTime, MAX(openTime) AS endTime FROM symbolsBT GROUP BY pair"
			)
			.all() as {
			pair: string;
			count: number;
			startTime: number;
			endTime: number;
		}[];

		results.sort((a, b) => a.count - b.count);
		console.log(
			`Pairs in symbolsBT table with number of candles and time range:\n${results
				.slice(0, items)
				.map(
					({ pair, count, startTime, endTime }) =>
						`${pair} - ${count} candles from ${
							getDate(startTime).dateString
						} to ${getDate(endTime).dateString}`
				)
				.join(",\n")}${
				results.length > items
					? `,\n ...and ${results.length - items} others`
					: ""
			}`
		);
	};

	getSavedPairList = () => {
		const results = this.db
			.query("SELECT DISTINCT pair FROM symbolsBT")
			.all() as { pair: string }[];
		const pairList = results.map(
			(result: { pair: string }) => result.pair
		) as string[];

		return pairList;
	};

	getCandlestick = ({
		pairs,
		start,
		end,
	}: {
		pairs?: string[];
		start?: number;
		end?: number;
	}): Candle[] => {
		const query = `SELECT * FROM symbolsBT ${
			pairs ? `WHERE pair IN (${pairs.map((p) => `'${p}'`).join(",")})` : ""
		} ${start ? `AND openTime >= ${start}` : ""} ${
			end ? `AND openTime < ${end}` : ""
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
class BacktestPositionService {
	private db: Database;

	constructor() {
		this.db = new Database("DB.db");
		this.configureDatabase();
	}

	closeConnection() {
		this.db.close();
	}

	deleteRows() {
		this.db.query("DELETE FROM positionsBT").run();
		console.log("All rows deleted from positionsBT");
	}

	save(position: BTPosition) {
		const query = `INSERT INTO positionsBT (pair, positionSide, startTime, entryPriceUSDT, pnl, tradeLength, stgName, sl, tp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		this.db
			.query(query)
			.run(
				position.pair,
				position.positionSide,
				position.startTime,
				position.entryPriceUSDT,
				position.pnl,
				position.tradeLength,
				position.stgName
			);
	}

	get({
		pair,
		sl,
		tp,
		tradeLength,
	}: {
		pair: string;
		sl: number;
		tp: number;
		tradeLength: number;
	}): BTPosition[] {
		const query = `SELECT * FROM positionsBT 
			WHERE pair = '${pair}' 
			AND sl = ${sl} 
			AND tp = ${tp} 
			AND tradeLength = ${tradeLength} 
			ORDER BY startTime ASC`;

		const results = this.db.query(query).all() as BTPosition[];
		return results;
	}

	configureDatabase() {
		this.db.run("PRAGMA busy_timeout = 5000");
		this.db.query("PRAGMA journal_mode = WAL");
		this.db
			.query(
				"CREATE TABLE IF NOT EXISTS positionsBT (pair TEXT, positionSide TEXT, startTime INTEGER, endTime INTEGER, entryPriceUSDT REAL, pnl REAL, accPnl REAL, tradeLength INTEGER, coinQuantity REAL, status TEXT, isHedgeUnbalance INTEGER, stgName TEXT, sl REAL, tp REAL)"
			)
			.run();
	}
}
class SymbolService {
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
		for (const symbol of unformattedList) {
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
		start,
		end,
		interval,
		apiLimit,
	}: {
		pair: string;
		interval: Interval;
		start: number;
		end: number;
		apiLimit: number;
	}): Promise<Candle[]> {
		let candlestick: Candle[] = [];

		const exchange = Binance();
		let startTime = start;
		let endTime = end + interval;

		do {
			let lookBackLength = Math.floor((endTime - startTime) / interval);
			if (lookBackLength > apiLimit) {
				endTime = startTime + (apiLimit - 1) * interval;
				lookBackLength = apiLimit;
			}

			const unformattedCandlestick = await exchange.futuresCandles({
				symbol: pair,
				interval: Interval[interval] as CandleChartInterval_LT,
				startTime,
				limit: lookBackLength,
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
			candlestick.push(...formattedCandlestick);

			startTime = endTime + interval;
			endTime = end + interval;
		} while (startTime < end);

		return candlestick;
	}

	fixCandlestick({
		candlestick,
		start,
		end,
		interval,
	}: {
		candlestick: Candle[];
		start: number;
		end: number;
		interval: Interval;
	}): Candle[] {
		const fixedCandlestick: Candle[] = [];
		let time = start;
		let prevCandle: Candle | undefined;
		do {
			const candle = candlestick.find((c) => c.openTime === time);
			if (candle) {
				fixedCandlestick.push(candle);
				prevCandle = candle;
			} else if (prevCandle) {
				fixedCandlestick.push({
					...prevCandle,
					openTime: time,
				});
			}
			time += interval;
		} while (time <= end);
		return fixedCandlestick;
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
		start: getDate("2024 09 20 00:00:00" as DateString).dateMs,
		end: getDate("2024 09 30 00:00:00" as DateString).dateMs,
		maxTradeLengthArray: [100],
		slArray: [1 / 100],
		tpArray: [5 / 100],
	},
};

class Trade {
	params = params;
	backtestSymbolService = new BacktestSymbolService();
	backtestPositionService = new BacktestPositionService();
	symbolService = new SymbolService();
	userService = new UserService();
	symbols: Symbol[] = [];
	users: User[] = [];
	strategies: Strategy[] = [rsiDivergency5m];

	async prepareBacktest() {
		this.backtestSymbolService.deleteRows();

		const pairList = (
			await this.symbolService.getPairList({
				minAmountToTradeUSDT: this.params.minAmountToTradeUSDT,
			})
		).slice(0, 10);

		const progressBar = new cliProgress.SingleBar(
			{},
			cliProgress.Presets.shades_classic
		);
		progressBar.start(pairList.length, 0);

		for (let pairIndex = 0; pairIndex < pairList.length; pairIndex++) {
			const pair = pairList[pairIndex];

			const candlestick = await this.symbolService.getCandlestick({
				pair,
				apiLimit: this.params.candlestickAPILimit,
				interval: this.params.interval,
				start: this.params.backtest.start,
				end: this.params.backtest.end,
			});

			const fixedCandlestick = this.symbolService.fixCandlestick({
				candlestick,
				start: this.params.backtest.start,
				end: this.params.backtest.end,
				interval: this.params.interval,
			});
			if (candlestick.length !== fixedCandlestick.length) {
				console.log(candlestick.length, fixedCandlestick.length);
			}

			this.backtestSymbolService.saveCandlestick(fixedCandlestick);
			progressBar.update(pairIndex + 1);
		}
		progressBar.stop();

		console.log("Backtest data prepared for " + pairList.length + " pairs");
	}
	async backtest() {
		this.backtestSymbolService.showSavedInformation();
		const pairList = this.backtestSymbolService.getSavedPairList();

		const totalLookBackLength =
			(this.params.backtest.end -
				this.params.backtest.start -
				this.params.interval * (1 + this.params.lookBackLength)) /
			this.params.interval;
		const progressTotal =
			this.params.backtest.slArray.length *
			this.params.backtest.tpArray.length *
			this.params.backtest.maxTradeLengthArray.length *
			totalLookBackLength;

		const progressBar = new cliProgress.SingleBar(
			{},
			cliProgress.Presets.shades_classic
		);
		progressBar.start(progressTotal, 0);
		let progress = 0;

		for (const sl of this.params.backtest.slArray) {
			for (const tp of this.params.backtest.tpArray) {
				for (const maxTradeLength of this.params.backtest.maxTradeLengthArray) {
					let start = this.params.backtest.start;
					let end =
						this.params.backtest.start +
						this.params.lookBackLength * this.params.interval;

					const closedPositions: BTPosition[] = [];
					do {
						const trades = [];
						for (const pair of pairList) {
							const candlestick = this.backtestSymbolService.getCandlestick({
								pairs: [pair],
								start,
								end,
							});

							for (const strategy of this.strategies) {
								const trade = strategy?.validate({
									candlestick,
									pair,
								});

								if (trade.positionSide) {
									trades.push(trade);
									this.symbols.push({
										pair,
										pricePrecision: 0,
										quantityPrecision: 0,
										currentPrice: candlestick[candlestick.length - 1].close,
										isReady: true,
										candlestick,
									});
								}
							}
						}

						tradeLoop: for (const trade of trades) {
							const symbol = this.symbols.find((s) => s.pair === trade.pair);
							if (!symbol) continue tradeLoop;
							if (!trade.positionSide) continue tradeLoop;

							const profitStick = this.backtestSymbolService.getCandlestick({
								pairs: [symbol.pair],
								start: end,
								end: end + maxTradeLength * this.params.interval,
							});

							const entryPriceUSDT = profitStick[0].open;

							let pnl = 0;
							let stickIndex = 0;
							let done = false;
							do {
								const candle = profitStick[stickIndex];
								const stopLoss =
									trade.positionSide === "LONG"
										? entryPriceUSDT * (1 - sl)
										: entryPriceUSDT * (1 + sl);
								const takeProfit = tp
									? trade.positionSide === "LONG"
										? entryPriceUSDT * (1 + tp)
										: entryPriceUSDT * (1 - tp)
									: 0;

								if (
									(trade.positionSide === "LONG" &&
										(candle.low <= stopLoss || candle.close <= stopLoss)) ||
									(trade.positionSide === "SHORT" &&
										(candle.high >= stopLoss || candle.close >= stopLoss))
								) {
									pnl = -this.params.riskPt - this.params.fee;
									done = true;
								}

								if (
									(trade.positionSide === "LONG" &&
										(candle.high >= takeProfit ||
											candle.close >= takeProfit)) ||
									(trade.positionSide === "SHORT" &&
										(candle.low <= takeProfit || candle.close <= takeProfit))
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
								positionSide: trade.positionSide,
								startTime: profitStick[0].openTime,
								entryPriceUSDT: profitStick[0].open,
								pnl,
								tradeLength: stickIndex,
								stgName: trade.stgName,
							});
						}

						start += this.params.interval;
						end += this.params.interval;
						progress++;
						progressBar.update(progress);
					} while (end < this.params.backtest.end);

					const tradesQty = closedPositions.length;
					const winningPositions = closedPositions.filter((p) => p.pnl > 0);
					const winRate = winningPositions.length / tradesQty;
					const accPnl = closedPositions.reduce((acc, p) => acc + p.pnl, 0);
					const avPnl = accPnl / tradesQty || 0;
					const avTradeLength =
						closedPositions.reduce((acc, a) => acc + Number(a.tradeLength), 0) /
							tradesQty || 0;

					let winningPairs: string[] = [];

					for (
						let symbolIndex = 0;
						symbolIndex < pairList.length;
						symbolIndex++
					) {
						const pair = pairList[symbolIndex];
						const closedPosForSymbol = closedPositions.filter(
							(pos) => pos.pair === pair
						);
						const tradesQty = closedPosForSymbol.length;
						const totalPnl = closedPosForSymbol.reduce(
							(acc, a) => acc + a.pnl,
							0
						);
						const avPnl = totalPnl / tradesQty || 0;

						if (avPnl > 0) {
							winningPairs.push(pair);
						}
					}

					console.table({
						sl,
						tp,
						maxTradeLength,
						tradesQty,
						winRate,
						avPnl,
						avTradeLength,
						winningPairs: winningPairs.join(","),
					});
					console.table(
						closedPositions.map((p) => {
							return {
								...p,
								startTime: getDate(p.startTime).dateString,
							};
						})
					);
				}
			}
		}

		progressBar.stop();
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
//trade.prepareBacktest();
trade.backtest();
