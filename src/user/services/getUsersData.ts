import Binance from "binance-api-node";
import { params } from "../../Params";
import { Interval } from "../../sharedModels/Interval";
import { ORDER_ID_DIV, OrderType, type Order } from "../../sharedModels/Order";
import type { Position, PositionSide } from "../../sharedModels/Position";
import { userSeedList } from "../../userSeed";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";
import type { User } from "../User";
import { getHistoricalPnl } from "./getHistoricalPnl";

export const getUsersData = async () => {
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
				orderType:
					OrderType[o.clientOrderId.split(ORDER_ID_DIV)[0] as OrderType] ||
					OrderType.UNKNOWN,
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
				startTime: getDate(p.updateTime).date,
				entryPriceUSDT,
				status: "UNKNOWN",
				pnl,
				isHedgeUnbalance: false,
				len: 0,
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
			const samePairOpenOrders = openOrders.filter((o) => o.pair === pos.pair);

			const startTimeMM = Math.min(
				...samePairPositions.map((p) => getDate(p.startTime).dateMs)
			);

			openPositions[posIndex].tradeLength =
				(getDate().dateMs - startTimeMM) / params.interval;

			if (
				samePairPositions.length === 1 &&
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.HEDGE
				).length >= 2
			) {
				openPositions[posIndex].status = "PROTECTED";
			}
			if (
				samePairPositions.length === 1 &&
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.HEDGE
				).length >= 1 &&
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.PROFIT
				).length >= 1
			) {
				openPositions[posIndex].status = "PROTECTED";
			}
			if (
				samePairPositions.length === 1 &&
				pos.pnl > 0 &&
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.BREAK
				).length >= 1
			) {
				openPositions[posIndex].status = "SECURED";
			}
			if (openPosPairLong.length === 1 && openPosPairShort.length === 1) {
				openPositions[posIndex].status = "HEDGED";
			}
			if (
				pos.status === "HEDGED" &&
				samePairPositions[0].coinQuantity !== samePairPositions[1].coinQuantity
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
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.PROFIT
				).length === 2
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
			Math.max(
				(balanceUSDT * params.riskPt) / params.defaultSL,
				params.minAmountToTradeUSDT
			).toFixed(2);

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
};
