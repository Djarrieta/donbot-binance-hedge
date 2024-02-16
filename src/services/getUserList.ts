import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { Interval } from "../models/Interval";
import { Order } from "../models/Order";
import { Position, PositionSide } from "../models/Position";
import { User } from "../models/User";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import { getXataClient } from "../xata";
import { getHistoricalPnl } from "./getHistoricalPnl";
import { subscribeToUserUpdates } from "./subscribeToUserUpdates";

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

		//Open Positions
		const positionRisk = await authExchange.futuresPositionRisk({
			recvWindow: 59999,
		});
		const openPositionsUnformatted = positionRisk.filter((x) =>
			Number(x.positionAmt)
		);

		const openPositions: Position[] = openPositionsUnformatted.map((p) => {
			return {
				pair: p.symbol,
				positionSide: p.positionSide as PositionSide,
				coinQuantity: Math.abs(Math.abs(Number(p.positionAmt))).toString(),
				startTime: getDate(p.updateTime).date,
				entryPriceUSDT: Number(p.entryPrice),
				status: "UNKNOWN",
			};
		});

		//Open Orders
		const unformattedOpenOrders = await authExchange.futuresOpenOrders({});
		const openOrders: Order[] = unformattedOpenOrders.map((o) => {
			return {
				pair: o.symbol,
				clientOrderId: o.clientOrderId,
				price: Number(o.stopPrice || o.clientOrderId.split("-")[2] || ""),
				coinQuantity: Number(o.origQty),
				orderType: (o.clientOrderId.split("-")[0] || "  ").slice(-2),
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

			if (samePairPositions.length === 1 && samePairOpenOrders.length < 2) {
				openPositions[posIndex].status = "UNPROTECTED";
			}
			if (samePairPositions.length === 1 && samePairOpenOrders.length === 2) {
				openPositions[posIndex].status = "PROTECTED"; //WIP validate order type
			}
			if (
				openPosPairLong.length === 1 &&
				openPosPairShort.length === 1 &&
				!samePairOpenOrders.length
			) {
				openPositions[posIndex].status = "HEDGED";
			}
		}

		//Balance
		const pricesList = await authExchange.futuresPrices();
		const futuresUser = await authExchange.futuresAccountBalance({
			recvWindow: 59999,
		});
		const balanceUSDT = Number(
			futuresUser.filter((pair) => pair.asset === "USDT")[0].balance
		);

		//PNL
		const { historicalPnl } = await getHistoricalPnl({ user });

		const year = new Date().getFullYear();
		const month = new Date().getMonth() + 1;
		const day = new Date().getDate();

		const today = `${year}-${month < 10 ? "0" : ""}${month}-${
			day < 10 ? "0" : ""
		}${day}`;

		const todayPnl =
			today === historicalPnl[historicalPnl.length - 1].time
				? historicalPnl[historicalPnl.length - 1].value
				: 0;
		const todayPnlPt = todayPnl ? todayPnl / (balanceUSDT - todayPnl) || 0 : 0;

		const totalPnlPt = historicalPnl.length
			? historicalPnl[historicalPnl.length - 1].acc /
			  (balanceUSDT - historicalPnl[historicalPnl.length - 1].acc)
			: 0;

		const openPosPnl = openPositions?.reduce((acc, val) => {
			const currentPrice = Number(pricesList[val.pair]) || 0;

			const pnl =
				val.positionSide === "LONG"
					? (currentPrice - val.entryPriceUSDT) / currentPrice
					: (val.entryPriceUSDT - currentPrice) / currentPrice;

			return (
				acc +
				((pnl - Context.fee / 2) * (currentPrice * Number(val.coinQuantity))) /
					Context.leverage
			);
		}, 0);
		const openPosPnlPt =
			Number(openPosPnl) / Number(balanceUSDT - openPosPnl) || 0;

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
			"; OpenPosPnl " +
			formatPercent(Number(openPosPnlPt)) +
			"; Today " +
			formatPercent(Number(todayPnlPt || 0)) +
			"; Total  " +
			formatPercent(Number(totalPnlPt || 0));

		if (openPositions.length) {
			const loggedPos: string[] = [];

			for (const pos of openPositions) {
				if (loggedPos.includes(pos.pair)) continue;
				text += `\n ${pos.pair} ${pos.status}`;
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
		subscribeToUserUpdates({ user });
	}

	return userList;
};
