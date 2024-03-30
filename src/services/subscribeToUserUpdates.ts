import Binance, { Binance as IBinance } from "binance-api-node";
import OldBinance from "node-binance-api";
import { Context } from "../models/Context";
import { User } from "../models/User";
import { ORDER_ID_DIV, OrderType } from "../models/Order";

export const subscribeToUserUpdates = async ({ user }: { user: User }) => {
	const oldExchange = new OldBinance().options({
		APIKEY: user.key,
		APISECRET: user.secret,
	});

	oldExchange.websockets.userFutureData(
		() => {},
		() => {}, // account update
		(event: any) => handleOrderUpdate({ user, event }),
		() => {}, // Connection
		() => {}
	);
};

const handleOrderUpdate = async ({
	user,
	event,
}: {
	user: User;
	event: any;
}) => {
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	const {
		symbol: pair,
		clientOrderId,
		orderStatus,
		originalQuantity: quantity,
	} = event.order;

	const orderType =
		OrderType[clientOrderId.split(ORDER_ID_DIV)[0] as OrderType] ||
		OrderType.UNKNOWN;

	if (orderStatus === "FILLED" && Number(quantity) > 0) {
		if (
			orderType === OrderType.HEDGE ||
			orderType === OrderType.PROFIT ||
			orderType === OrderType.BREAK
		) {
			const context = await Context.getInstance();
			const userIndex = context.userList.findIndex((u) => u.id === user.id);

			await authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});

			context.userList[userIndex].openOrders = context.userList[
				userIndex
			].openOrders.filter((p) => p.pair !== pair);

			if (orderType === OrderType.HEDGE) {
				context.strategyStats = [];
			}
			if (orderType === OrderType.PROFIT || orderType === OrderType.BREAK) {
				context.userList[userIndex].openPositions = context.userList[
					userIndex
				].openPositions.filter((p) => p.pair !== pair);
			}
			return;
		}

		const positionRisk = (
			await authExchange.futuresPositionRisk({
				recvWindow: 59999,
			})
		).filter((x) => Number(x.positionAmt) && x.symbol === pair);

		if (!positionRisk.length) {
			authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});
		}
	}
};
