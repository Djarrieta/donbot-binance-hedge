import Binance, { type FuturesUserTradeResult } from "binance-api-node";
import OldBinance from "node-binance-api";
import type {
	AuthExchange,
	HistoricalPnl,
	openPositionProps,
	securePositionProps,
	SubscribeToUserUpdatesProps,
} from "../domain/AuthExchange";
import { Interval } from "../domain/Interval";
import { OrderType, type Order } from "../domain/Order";
import type { PositionSide } from "../domain/Position";
import { type Position } from "../domain/Position";
import type { Symbol } from "../domain/Symbol";
import type { User, UserSeedDTO } from "../domain/User";
import { userSeedList } from "../userSeedList";
import { fixPrecision } from "../utils/fixPrecision";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import {
	ORDER_ID_DIV,
	orderIdNameGenerator,
} from "../utils/orderIdNameGenerator";

export class AuthExchangeService implements AuthExchange {
	async subscribeToUserUpdates({
		user,
		handleClearOrders,
	}: SubscribeToUserUpdatesProps) {
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
					handleClearOrders({
						pair,
						user,
					});

					return;
				}

				const positionRisk = (
					await authExchange.futuresPositionRisk({
						recvWindow: 59999,
					})
				).filter((x) => Number(x.positionAmt) && x.symbol === pair);

				if (!positionRisk.length) {
					handleClearOrders({
						pair,
						user,
					});

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
		slPrice,
		tpPrice,
	}: openPositionProps) {
		const authExchange = Binance({
			apiKey: user.binanceApiKey,
			apiSecret: user.binanceApiSecret || "",
		});

		const quantity = fixPrecision({
			value: coinQuantity,
			precision: symbol.quantityPrecision,
		});

		const HEPrice = fixPrecision({
			value: slPrice,
			precision: symbol.pricePrecision,
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
			value: tpPrice,
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
	async protectPosition({
		user,
		symbol,
		positionSide,
		coinQuantity,
		slPrice,
		tpPrice,
	}: openPositionProps): Promise<void> {
		const authExchange = Binance({
			apiKey: user.binanceApiKey,
			apiSecret: user.binanceApiSecret || "",
		});

		const quantity = fixPrecision({
			value: coinQuantity,
			precision: symbol.quantityPrecision,
		});

		const HEPrice = fixPrecision({
			value: slPrice,
			precision: symbol.pricePrecision,
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
			value: tpPrice,
			precision: symbol.pricePrecision,
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: positionSide === "LONG" ? "BUY" : "SELL",
			positionSide: positionSide === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: TPPrice,
			recvWindow: 59999,
			newClientOrderId: orderIdNameGenerator({
				orderType: OrderType.HEDGE,
				positionSide,
				price: TPPrice,
			}).fullIdName,
			timeInForce: "GTC",
		});
	}
	async securePosition({
		user,
		symbol,
		positionSide,
		coinQuantity,
		bePrice,
	}: securePositionProps) {
		const authExchange = Binance({
			apiKey: user.binanceApiKey,
			apiSecret: user.binanceApiSecret || "",
		});

		const BEPriceFixed = fixPrecision({
			value: bePrice,
			precision: symbol.pricePrecision,
		});

		const quantity = fixPrecision({
			value: coinQuantity,
			precision: symbol.quantityPrecision,
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: positionSide === "LONG" ? "SELL" : "BUY",
			positionSide,
			symbol: symbol.pair,
			quantity,
			stopPrice: BEPriceFixed,
			recvWindow: 59999,
			newClientOrderId: orderIdNameGenerator({
				orderType: OrderType.BREAK,
				positionSide,
				price: BEPriceFixed,
			}).fullIdName,
			timeInForce: "GTC",
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
}
