import Binance from "binance-api-node";
import OldBinance from "node-binance-api";
import { Context } from "../../Context";
import { OrderType } from "../../sharedModels/Order";
import { orderIdNameGenerator } from "../../utils/orderIdNameGenerator";
import type { User } from "../User";

export const subscribeToUserUpdates = async ({ user }: { user: User }) => {
	const oldExchange = new OldBinance().options({
		APIKEY: user.binanceApiKey,
		APISECRET: user.binanceApiSecret || "",
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
			const context = await Context.getInstance();
			if (!context) return;

			context.cancelOrders({ userName: user.name, pair });

			if (!context.userList.length) return;

			context.clearPositions({
				userName: user.name,
				pair,
			});
			context.clearOrders({ userName: user.name, pair });

			return;
		}

		const positionRisk = (
			await authExchange.futuresPositionRisk({
				recvWindow: 59999,
			})
		).filter((x) => Number(x.positionAmt) && x.symbol === pair);

		if (!positionRisk.length) {
			const context = await Context.getInstance();
			if (!context) return;
			context.cancelOrders({ userName: user.name, pair });

			return;
		}
	}
};
