import Binance, { Binance as IBinance } from "binance-api-node";
import OldBinance from "node-binance-api";
import { PosType } from "../models/Position";
import { User } from "../models/User";

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

	const typeVal = clientOrderId.split("__")[0];
	const orderType = Object.keys(PosType).includes(typeVal) ? typeVal : "UN";

	if (orderStatus === "FILLED" && Number(quantity) > 0) {
		if (
			orderType === PosType.HE ||
			orderType === PosType.TP ||
			orderType === PosType.TR
		) {
			authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});
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
