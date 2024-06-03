import Binance, { type Binance as IBinance } from "binance-api-node";
import OldBinance from "node-binance-api";
import type { User } from "../User";
import { ORDER_ID_DIV, OrderType } from "../../models/Order";
import { Context } from "../../Context";

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
			if (!context) return;

			await authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});
			if (!context.userList.length) return;

			context.updateUser({
				userName: user.name,
				newOpenPositions: user.openPositions.filter((p) => p.pair !== pair),
			});

			if (orderType === OrderType.PROFIT || orderType === OrderType.BREAK) {
				context.updateUser({
					userName: user.name,
					newOpenOrders: user.openOrders.filter((o) => o.pair !== pair),
				});
			}
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
