import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { Interval } from "../models/Interval";
import { ORDER_ID_DIV, Order, OrderType } from "../models/Order";
import { Position, PositionSide } from "../models/Position";
import { User } from "../models/User";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import { getXataClient } from "../xata";
import { getHistoricalPnl } from "./getHistoricalPnl";

export const getUserList = async () => {
	const xata = getXataClient();

	const page = await xata.db.users
		.select([
			"id",
			"key",
			"secret",
			"isActive",
			"name",
			"authorized",
			"branch",
			"startTime",
		])
		.filter({ branch: Context.branch })
		.getPaginated({
			pagination: {
				size: 10,
			},
		});

	let userList = page.records.map((u) => {
		return {
			id: u.id,
			name: u.name,
			isActive: u.isActive,
			authorized: u.authorized,
			key: u.key,
			secret: u.secret,
			branch: u.branch,
			startTime: u.startTime,
		};
	}) as User[];

	for (let index = 0; index < userList.length; index++) {
		const user = userList[index];
		const authExchange = Binance({
			apiKey: user.key,
			apiSecret: user.secret || "",
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
			const coinQuantity = Math.abs(Math.abs(Number(p.positionAmt))).toString();
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

			openPositions[posIndex].len =
				(getDate().dateMs - startTimeMM) / Context.interval;

			if (
				samePairPositions.length === 1 &&
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.HEDGE
				).length === 2
			) {
				openPositions[posIndex].status = "PROTECTED";
			}
			if (
				samePairPositions.length === 1 &&
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.HEDGE
				).length === 1 &&
				samePairOpenOrders.filter(
					(o) => o.clientOrderId.split(ORDER_ID_DIV)[0] === OrderType.PROFIT
				).length === 1
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
		}

		//PNL
		const { historicalPnl } = await getHistoricalPnl({ user });

		const todayPnl =
			historicalPnl.length &&
			getDate().shortDateString === historicalPnl[historicalPnl.length - 1].time
				? historicalPnl[historicalPnl.length - 1].value
				: 0;
		const todayPnlPt = todayPnl ? todayPnl / (balanceUSDT - todayPnl) || 0 : 0;

		const totalPnlPt = historicalPnl.length
			? historicalPnl[historicalPnl.length - 1].acc /
			  (balanceUSDT - historicalPnl[historicalPnl.length - 1].acc)
			: 0;

		const openPosPnlPt = openPositions?.reduce((acc, pos) => {
			return acc + pos.pnl;
		}, 0);

		//Days working
		const daysAgo = (
			(getDate().dateMs - getDate(user.startTime).dateMs) /
			Interval["1d"]
		).toFixed();

		//Text
		let text =
			(user.name?.split(" ")[0] || "") +
			" (" +
			user.branch +
			") " +
			daysAgo +
			" days $" +
			(balanceUSDT || 0).toFixed(2) +
			"; OpenPosPnl $" +
			(openPosPnlPt * balanceUSDT).toFixed(2) +
			" " +
			formatPercent(Number(openPosPnlPt)) +
			"; Today $" +
			(Number(todayPnlPt || 0) * balanceUSDT).toFixed(2) +
			" " +
			formatPercent(Number(todayPnlPt || 0)) +
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
				}; len ${pos.len.toFixed()}; pnl $${(pnl * balanceUSDT).toFixed(
					2
				)} ${formatPercent(pnl)}`;

				loggedPos.push(pos.pair);
			}
		}

		userList[index] = {
			...user,
			openPositions,
			openOrders,
			totalPnlPt,
			todayPnlPt,
			openPosPnlPt,
			balanceUSDT,
			isAddingPosition: false,
			text,
		};
	}

	return userList;
};
