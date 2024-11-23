import Binance, { type CandleChartInterval_LT } from "binance-api-node";
import OldBinance from "node-binance-api";
import type { Candle } from "../domain/Candle";
import { Interval } from "../domain/Interval";
import { OrderType, type Order } from "../domain/Order";
import type { PositionSide } from "../domain/Position";
import { type Position } from "../domain/Position";
import type {
	Exchange,
	openPositionProps,
	UpdateSymbolProps,
} from "../domain/Trade/Exchange";
import type { Symbol } from "../domain/Trade/Symbol";
import type { User } from "../domain/Trade/User";
import { fixPrecision } from "../utils/fixPrecision";
import { getDate } from "../utils/getDate";
import {
	ORDER_ID_DIV,
	orderIdNameGenerator,
} from "../utils/orderIdNameGenerator";
import { formatPercent } from "../utils/formatPercent";

export class exchangeService implements Exchange {
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
	async getUsersData({
		interval,
		amountToTrade,
	}: {
		interval: Interval;
		amountToTrade: number;
	}): Promise<User[]> {
		const userList: User[] = [];

		for (let index = 0; index < userSeedList.length; index++) {
			const user = userSeedList[index];
			const authExchange = Binance({
				apiKey: user.binanceApiKey,
				apiSecret: user.binanceApiSecret || "",
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
				(getDate().dateMs - getDate(user.startDate).dateMs) /
				Interval["1d"]
			).toFixed();

			const openPosPnlPt = openPositions?.reduce((acc, pos) => {
				return acc + pos.pnl;
			}, 0);

			//PNL
			const { historicalPnl } = await getHistoricalPnl({ user });
			const totalPnlPt = historicalPnl.length
				? historicalPnl[historicalPnl.length - 1].acc /
				  (balanceUSDT - historicalPnl[historicalPnl.length - 1].acc)
				: 0;

			//Text
			let text =
				(user.name?.split(" ")[0] || "") +
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
				formatPercent(Number(totalPnlPt || 0)) +
				"; Amount to trade: $" +
				amountToTrade.toFixed(2);

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
				...user,
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
}
