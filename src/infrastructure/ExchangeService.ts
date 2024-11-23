import Binance, {
	type CandleChartInterval_LT,
	type CandleChartResult,
	type FuturesUserTradeResult,
} from "binance-api-node";
import OldBinance from "node-binance-api";
import type { Candle } from "../domain/Candle";
import { Interval } from "../domain/Interval";
import { OrderType, type Order } from "../domain/Order";
import type { PositionSide } from "../domain/Position";
import { type Position } from "../domain/Position";
import type {
	Exchange,
	GetSymbolsDataProps,
	HistoricalPnl,
	openPositionProps,
	UpdateSymbolProps,
} from "../domain/Trade/Exchange";
import type { Symbol } from "../domain/Trade/Symbol";
import type { User, UserSeedDTO } from "../domain/Trade/User";
import { fixPrecision } from "../utils/fixPrecision";
import { getDate } from "../utils/getDate";
import {
	ORDER_ID_DIV,
	orderIdNameGenerator,
} from "../utils/orderIdNameGenerator";
import { formatPercent } from "../utils/formatPercent";
import { userSeedList } from "../userSeedList";

export class ExchangeService implements Exchange {
	subscribeToSymbolUpdates({
		pair,
		interval,
		updateSymbol,
	}: {
		pair: string;
		interval: Interval;
		updateSymbol: (props: UpdateSymbolProps) => void;
	}) {
		const exchange = new OldBinance();
		const intervalText = Interval[interval] as CandleChartInterval_LT;

		exchange.futuresSubscribe(
			pair.toLocaleLowerCase() + "@kline_" + intervalText,
			(data) => {
				if (!data.k.x) {
					updateSymbol({ pair: data?.s, price: Number(data.k.c), interval });
					return;
				}

				const newCandle: Candle = {
					open: Number(data.k.o),
					high: Number(data.k.h),
					close: Number(data.k.c),
					low: Number(data.k.l),
					openTime: getDate(Number(data.k.t)).dateMs,
					volume: Number(data.k.v),
				};

				updateSymbol({
					pair: data?.s,
					interval,
					newCandle,
				});
			}
		);
	}
	async subscribeToUserUpdates({ user }: { user: User }) {
		const oldExchange = new OldBinance().options({
			APIKEY: user.binanceApiKey,
			APISECRET: user.binanceApiSecret || "",
		});

		const handleOrderUpdate = async ({
			user,
			event,
		}: {
			user: User;
			event: any;
		}) => {
			const authExchange = Binance({
				apiKey: user.binanceApiKey,
				apiSecret: user.binanceApiSecret || "",
			});

			const {
				symbol: pair,
				clientOrderId,
				orderStatus,
				originalQuantity: quantity,
			} = event.order;

			const orderType = orderIdNameGenerator(clientOrderId).orderType;

			if (orderStatus === "FILLED" && Number(quantity) > 0) {
				if (
					orderType === OrderType.HEDGE ||
					orderType === OrderType.PROFIT ||
					orderType === OrderType.BREAK
				) {
					console.log("orderType", orderType);

					// context.cancelOrders({ userName: user.name, pair });

					// if (!context.userList.length) return;

					// context.clearPositions({
					//     userName: user.name,
					//     pair,
					// });
					// context.clearOrders({ userName: user.name, pair });

					return;
				}

				const positionRisk = (
					await authExchange.futuresPositionRisk({
						recvWindow: 59999,
					})
				).filter((x) => Number(x.positionAmt) && x.symbol === pair);

				if (!positionRisk.length) {
					// const context = await Context.getInstance();
					// if (!context) return;
					// context.cancelOrders({ userName: user.name, pair });

					return;
				}
			}
		};

		oldExchange.websockets.userFutureData(
			() => {},
			() => {}, // account update
			(event: any) => handleOrderUpdate({ user, event }),
			() => {}, // Connection
			() => {}
		);
	}
	async quitPosition({
		user,
		symbol,
		positionSide,
		coinQuantity,
	}: {
		user: User;
		symbol: Symbol;
		positionSide: PositionSide;
		coinQuantity: number;
	}) {
		if (!coinQuantity) {
			throw new Error("No coin quantity");
		}
		const quantity = fixPrecision({
			value: Number(coinQuantity),
			precision: symbol.quantityPrecision,
		});

		const authExchange = Binance({
			apiKey: user.binanceApiKey,
			apiSecret: user.binanceApiSecret || "",
		});
		await authExchange.futuresOrder({
			type: "MARKET",
			side: positionSide === "LONG" ? "SELL" : "BUY",
			positionSide,
			symbol: symbol.pair,
			quantity,
			newClientOrderId: orderIdNameGenerator({
				orderType: OrderType.QUIT,
				positionSide,
				price: symbol.currentPrice.toString(),
			}).fullIdName,
			recvWindow: 59999,
		});
	}
	async cancelOrders({ user, pair }: { user: User; pair: any }): Promise<void> {
		const authExchange = Binance({
			apiKey: user.binanceApiKey,
			apiSecret: user.binanceApiSecret || "",
		});
		await authExchange.futuresCancelAllOpenOrders({
			symbol: pair,
		});
	}

	async openPosition({
		user,
		symbol,
		positionSide,
		coinQuantity,
		sl,
		tp,
		stgName,
	}: openPositionProps) {
		const authExchange = Binance({
			apiKey: user.binanceApiKey,
			apiSecret: user.binanceApiSecret || "",
		});

		const HEPrice = fixPrecision({
			value: sl, //price fix not percent
			precision: symbol.pricePrecision,
		});

		const quantity = fixPrecision({
			value: coinQuantity,
			precision: symbol.quantityPrecision,
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: positionSide === "LONG" ? "SELL" : "BUY",
			positionSide: positionSide === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: HEPrice,
			recvWindow: 59999,
			newClientOrderId: orderIdNameGenerator({
				orderType: OrderType.HEDGE,
				positionSide,
				price: HEPrice,
			}).fullIdName,
			timeInForce: "GTC",
		});

		const TPPrice = fixPrecision({
			value: tp, //price fix not percent
			precision: symbol.pricePrecision,
		});

		await authExchange.futuresOrder({
			type: "TAKE_PROFIT_MARKET",
			side: positionSide === "LONG" ? "SELL" : "BUY",
			positionSide: positionSide,
			symbol: symbol.pair,
			quantity,
			stopPrice: TPPrice,
			recvWindow: 59999,
			newClientOrderId: orderIdNameGenerator({
				orderType: OrderType.PROFIT,
				positionSide,
				price: TPPrice,
			}).fullIdName,
		});

		await authExchange.futuresOrder({
			type: "MARKET",
			side: positionSide === "LONG" ? "BUY" : "SELL",
			positionSide: positionSide,
			symbol: symbol.pair,
			quantity,
			recvWindow: 59999,
			newClientOrderId: orderIdNameGenerator({
				orderType: OrderType.NEW,
				positionSide,
				price: symbol.currentPrice.toString(),
			}).fullIdName,
		});
	}
	async getUsersData({ interval }: { interval: Interval }): Promise<User[]> {
		const userList: User[] = [];

		for (let index = 0; index < userSeedList.length; index++) {
			const userSeed = userSeedList[index];
			const authExchange = Binance({
				apiKey: userSeed.binanceApiKey,
				apiSecret: userSeed.binanceApiSecret || "",
			});

			//Balance
			const futuresUser = await authExchange.futuresAccountBalance({
				recvWindow: 59999,
			});
			const balanceUSDT = Number(
				futuresUser.filter((pair) => pair.asset === "USDT")[0].balance
			);

			//Open Orders
			const unformattedOpenOrders = await authExchange.futuresOpenOrders({});
			const openOrders: Order[] = unformattedOpenOrders.map((o) => {
				return {
					orderId: Number(o.orderId),
					pair: o.symbol,
					clientOrderId: o.clientOrderId,
					price: Number(
						o.stopPrice || o.clientOrderId.split(ORDER_ID_DIV)[2] || ""
					),
					coinQuantity: Number(o.origQty),
					orderType: orderIdNameGenerator(o.clientOrderId).orderType,
				};
			});

			//Open Positions
			const positionRisk = await authExchange.futuresPositionRisk({
				recvWindow: 59999,
			});
			const openPositionsUnformatted = positionRisk.filter((x) =>
				Number(x.positionAmt)
			);

			const openPositions: Position[] = openPositionsUnformatted.map((p) => {
				const pair = p.symbol;
				const positionSide = p.positionSide as PositionSide;
				const coinQuantity = Math.abs(Math.abs(Number(p.positionAmt)));
				const entryPriceUSDT = Number(p.entryPrice);
				const pnl = Number(p.unRealizedProfit) / balanceUSDT;
				return {
					pair,
					positionSide,
					coinQuantity,
					startTime: getDate(p.updateTime).dateMs,
					entryPriceUSDT,
					status: "UNKNOWN",
					pnl,
					isHedgeUnbalance: false,
					len: 0,
					stgName: "",
					sl: 0,
					tp: 0,
				};
			});

			for (let posIndex = 0; posIndex < openPositions.length; posIndex++) {
				const pos = openPositions[posIndex];

				const samePairPositions = openPositions.filter(
					(s) => s.pair === pos.pair
				);
				const openPosPairLong = openPositions.filter(
					(p) => p.pair === pos.pair && p.positionSide === "LONG"
				);
				const openPosPairShort = openPositions.filter(
					(p) => p.pair === pos.pair && p.positionSide === "SHORT"
				);
				const samePairOpenOrders = openOrders.filter(
					(o) => o.pair === pos.pair
				);

				const startTimeMM = Math.min(
					...samePairPositions.map((p) => getDate(p.startTime).dateMs)
				);

				openPositions[posIndex].tradeLength =
					(getDate().dateMs - startTimeMM) / interval;

				if (
					samePairPositions.length === 1 &&
					samePairOpenOrders.filter((o) => o.orderType === OrderType.HEDGE)
						.length >= 2
				) {
					openPositions[posIndex].status = "PROTECTED";
				}
				if (
					samePairPositions.length === 1 &&
					samePairOpenOrders.filter((o) => o.orderType === OrderType.HEDGE)
						.length >= 1 &&
					samePairOpenOrders.filter((o) => o.orderType === OrderType.PROFIT)
						.length >= 1
				) {
					openPositions[posIndex].status = "PROTECTED";
				}
				if (
					samePairPositions.length === 1 &&
					pos.pnl > 0 &&
					samePairOpenOrders.filter((o) => o.orderType === OrderType.BREAK)
						.length >= 1
				) {
					openPositions[posIndex].status = "SECURED";
				}
				if (openPosPairLong.length === 1 && openPosPairShort.length === 1) {
					openPositions[posIndex].status = "HEDGED";
				}
				if (
					pos.status === "HEDGED" &&
					samePairPositions[0].coinQuantity !==
						samePairPositions[1].coinQuantity
				) {
					openPositions[posIndex].isHedgeUnbalance = true;
				}
				if (
					pos.status === "UNKNOWN" &&
					samePairPositions.length === 1 &&
					samePairOpenOrders.length < 2
				) {
					openPositions[posIndex].status = "UNPROTECTED";
				}

				if (
					pos.status === "UNKNOWN" &&
					samePairPositions.length === 1 &&
					samePairOpenOrders.length === 2 &&
					samePairOpenOrders.filter((o) => o.orderType === OrderType.PROFIT)
						.length === 2
				) {
					openPositions[posIndex].status = "UNPROTECTED";
				}
			}
			const daysAgo = (
				(getDate().dateMs - getDate(userSeed.startDate).dateMs) /
				Interval["1d"]
			).toFixed();

			const openPosPnlPt = openPositions?.reduce((acc, pos) => {
				return acc + pos.pnl;
			}, 0);

			//PNL
			const { historicalPnl } = await this.getHistoricalPnl({ userSeed });
			const totalPnlPt = historicalPnl.length
				? historicalPnl[historicalPnl.length - 1].acc /
				  (balanceUSDT - historicalPnl[historicalPnl.length - 1].acc)
				: 0;

			//Text
			let text =
				(userSeed.name?.split(" ")[0] || "") +
				" " +
				daysAgo +
				" days $" +
				(balanceUSDT || 0).toFixed(2) +
				"; OpenPosPnl $" +
				(openPosPnlPt * balanceUSDT).toFixed(2) +
				" " +
				formatPercent(Number(openPosPnlPt)) +
				"; Total $" +
				(Number(totalPnlPt || 0) * balanceUSDT).toFixed(2) +
				" " +
				formatPercent(Number(totalPnlPt || 0));

			if (openPositions.length) {
				const loggedPos: string[] = [];

				for (const pos of openPositions) {
					if (loggedPos.includes(pos.pair)) continue;
					const pnl = openPositions
						.filter((s) => s.pair === pos.pair)
						.reduce((acc, val) => acc + val.pnl, 0);

					text += `\n ${pos.pair} ${pos.status} ${
						pos.isHedgeUnbalance ? "UNBALANCE" : ""
					}; len ${Number(pos.tradeLength).toFixed()}; pnl $${(
						pnl * balanceUSDT
					).toFixed(2)} ${formatPercent(pnl)}`;

					loggedPos.push(pos.pair);
				}
			}

			userList.push({
				...userSeed,
				openPositions,
				openOrders,
				balanceUSDT,
				totalPnlPt,
				openPosPnlPt,
				isAddingPosition: false,
				text,
			});
		}

		return userList;
	}
	async getHistoricalPnl({ userSeed }: { userSeed: UserSeedDTO }) {
		const historicalPnl: HistoricalPnl[] = [];

		const API_LIMIT = 7;
		const authExchange = Binance({
			apiKey: userSeed.binanceApiKey,
			apiSecret: userSeed.binanceApiSecret,
		});

		const trades: FuturesUserTradeResult[] = [];
		const daysAgo = Math.ceil(
			(getDate().dateMs - getDate(userSeed.startDate).dateMs) / Interval["1d"]
		);

		let n = daysAgo;
		if (n > 0) {
			do {
				const startTime =
					getDate(new Date().setHours(0, 0, 0)).dateMs -
					(n - 1) * Interval["1d"];

				const endTime = Math.min(
					getDate().dateMs,
					getDate(new Date().setHours(0, 0, 0)).dateMs -
						(n - API_LIMIT - 1) * Interval["1d"]
				);

				const newTrades = await authExchange.futuresUserTrades({
					startTime,
					endTime,
				});

				trades.push(...newTrades);

				n -= API_LIMIT;
			} while (n > 0);
		}

		let acc = 0;

		for (const trade of trades) {
			const { realizedPnl, commission, time: tradeTime } = trade;
			const pnl = Number(realizedPnl) - Number(commission);
			acc += pnl;

			const existingDayPnl = historicalPnl.find(
				({ time }) => time === getDate(tradeTime).shortDateString
			);

			if (existingDayPnl) {
				existingDayPnl.value += pnl;
				existingDayPnl.acc += pnl;
			} else {
				historicalPnl.push({
					time: getDate(tradeTime).shortDateString,
					value: pnl,
					acc,
				});
			}
		}

		return { historicalPnl };
	}

	async getSymbolsData({
		minAmountToTradeUSDT,
		interval,
		lookBackLength,
		candlestickAPILimit,
	}: GetSymbolsDataProps): Promise<Symbol[]> {
		const exchange = Binance();
		const symbolList: Symbol[] = [];
		const pairList = await this.getPairList({ minAmountToTradeUSDT });
		if (!pairList.length) return symbolList;

		const symbolListInfo = await exchange.futuresExchangeInfo();
		for (const pair of pairList) {
			const symbolInfo = symbolListInfo.symbols.find(
				(p) => p.symbol === pair
			) as any;
			if (!symbolInfo) continue;

			const start = getDate().dateMs - (lookBackLength + 1) * interval;
			const end = start + lookBackLength * interval;

			const candlestick = await this.getCandlestick({
				pair,
				start,
				end,
				interval,
				candlestickAPILimit,
			});
			const currentPrice =
				Number(candlestick[candlestick.length - 1]?.close) || 0;

			symbolList.push({
				pair,
				pricePrecision: Number(symbolInfo.pricePrecision),
				quantityPrecision: Number(symbolInfo.quantityPrecision),
				isReady: true,
				candlestick,
				currentPrice,
			});
		}

		return symbolList;
	}

	public async getPairList({
		minAmountToTradeUSDT,
	}: {
		minAmountToTradeUSDT: number;
	}): Promise<string[]> {
		const exchange = Binance();

		const pairList: string[] = [];

		try {
			const { symbols: unformattedList } = await exchange.futuresExchangeInfo();
			const prices = await exchange.futuresMarkPrice();

			for (const symbol of unformattedList) {
				if (this.isValidSymbol(symbol, prices, minAmountToTradeUSDT)) {
					pairList.push(symbol.symbol);
				}
			}
		} catch (error) {
			console.error("Error fetching pair list:", error);
		}
		return pairList;
	}

	public async getCandlestick({
		pair,
		start,
		end,
		interval,
		candlestickAPILimit,
	}: {
		pair: string;
		interval: Interval;
		start: number;
		end: number;
		candlestickAPILimit: number;
	}): Promise<Candle[]> {
		let candlestick: Candle[] = [];

		let dynamicStart = start;

		while (dynamicStart < end) {
			const lookBackLength = Math.min(
				Math.floor((end - dynamicStart) / interval),
				candlestickAPILimit
			);
			const unformattedCandlestick = await this.fetchCandles(
				pair,
				interval,
				dynamicStart,
				lookBackLength
			);

			candlestick.push(...this.formatCandlestick(unformattedCandlestick, pair));

			dynamicStart = dynamicStart + lookBackLength * interval;
		}

		return candlestick;
	}

	private isValidSymbol(
		symbol: any,
		prices: any[],
		minAmountToTradeUSDT: number
	): boolean {
		const {
			symbol: pair,
			status,
			quoteAsset,
			baseAsset,
			contractType,
			filters,
		} = symbol;

		const minQty = Number(
			filters.find((f: any) => f.filterType === "LOT_SIZE").minQty
		);
		const minNotional = Number(
			filters.find((f: any) => f.filterType === "MIN_NOTIONAL").notional
		);
		const currentPrice =
			Number(prices.find((p: any) => p.symbol === pair)?.markPrice) || 0;
		const minQuantityUSD = minQty * currentPrice;

		return (
			status === "TRADING" &&
			quoteAsset === "USDT" &&
			baseAsset !== "USDT" &&
			contractType === "PERPETUAL" &&
			minQuantityUSD <= minAmountToTradeUSDT &&
			minNotional <= minAmountToTradeUSDT
		);
	}

	private async fetchCandles(
		pair: string,
		interval: Interval,
		startTime: number,
		limit: number
	): Promise<CandleChartResult[]> {
		const exchange = Binance();

		return (await exchange.futuresCandles({
			symbol: pair,
			interval: Interval[interval] as CandleChartInterval_LT,
			startTime,
			limit,
		})) as CandleChartResult[];
	}

	private formatCandlestick(
		unformattedCandlestick: CandleChartResult[],
		pair: string
	): Candle[] {
		return unformattedCandlestick.map(
			({ close, open, high, low, openTime, volume }) => ({
				pair,
				close: Number(close),
				open: Number(open),
				high: Number(high),
				low: Number(low),
				openTime: Number(openTime),
				volume: Number(volume),
			})
		);
	}
}
