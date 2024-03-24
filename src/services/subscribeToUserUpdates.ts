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
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	oldExchange.websockets.userFutureData(
		() => {},
		() => {},
		(event: any) => handleOrderUpdate({ authExchange, event }),
		() => {}, // Connection
		() => {}
	);
};

const handleOrderUpdate = async ({
	authExchange,
	event,
}: {
	authExchange: IBinance;
	event: any;
}) => {
	const {
		symbol: pair,
		clientOrderId,
		orderStatus,
		originalQuantity: quantity,
		originalPrice: price,
	} = event.order;

	const orderType =
		OrderType[clientOrderId.split(ORDER_ID_DIV)[0] as OrderType] ||
		OrderType.UNKNOWN;

	if (orderStatus === "FILLED" && Number(quantity) > 0) {
		if (
			orderType === OrderType.HEDGE ||
			orderType === OrderType.PROFIT ||
			orderType === OrderType.TRAILING
		) {
			authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});
			if (orderType === OrderType.HEDGE) {
				const context = await Context.getInstance();
				context.strategyStats = [];
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
