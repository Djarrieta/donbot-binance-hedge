import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { fixPrecision } from "../utils/fixPrecision";

interface PositionSecureProps {
	alertPt: number;
	breakEven: number;
	trailing: number;
}
export const positionSecure = async ({
	breakEven,
	alertPt,
	trailing,
}: PositionSecureProps) => {
	const context = await Context.getInstance();

	for (let userIndex = 0; userIndex < context.userList.length; userIndex++) {
		const user = context.userList[userIndex];

		for (let posIndex = 0; posIndex < user.openPositions.length; posIndex++) {
			const pos = user.openPositions[posIndex];

			if (pos.status !== "PROTECTED") continue;

			const symbol = context.symbolList.find((s) => s.pair === pos.pair);

			if (!symbol || !symbol.currentPrice) continue;

			const pnlGraph =
				pos.positionSide === "LONG"
					? (symbol.currentPrice - pos.entryPriceUSDT) / pos.entryPriceUSDT
					: (pos.entryPriceUSDT - symbol.currentPrice) / pos.entryPriceUSDT;

			if (pnlGraph < alertPt) continue;

			const authExchange = Binance({
				apiKey: user.key,
				apiSecret: user.secret || "",
			});
			const ordersSamePair = context.userList[userIndex].openOrders.filter(
				(o) => o.pair === pos.pair
			);

			if (
				context.userList[userIndex].openPositions[posIndex].status ===
					"PROTECTED" &&
				!ordersSamePair.filter((o) => o.orderType === "BREAK").length
			) {
				console.log("Securing position for " + user.name + " in " + pos.pair);

				context.userList[userIndex].openPositions[posIndex].status = "SECURED";

				context.userList[userIndex].openOrders.push({
					price: breakEven,
					pair: symbol.pair,
					orderType: OrderType.BREAK,
					orderId: 0,
					coinQuantity: Number(pos.coinQuantity),
					clientOrderId: OrderType.BREAK + ORDER_ID_DIV + breakEven,
				});
				const SCPriceNumber =
					pos.positionSide === "LONG"
						? pos.entryPriceUSDT * (1 + breakEven)
						: pos.entryPriceUSDT * (1 - breakEven);

				const BEPrice = fixPrecision({
					value: SCPriceNumber,
					precision: symbol.pricePrecision,
				});

				await authExchange.futuresOrder({
					type: "STOP_MARKET",
					side: pos.positionSide === "LONG" ? "SELL" : "BUY",
					positionSide: pos.positionSide,
					symbol: symbol.pair,
					quantity: pos.coinQuantity,
					stopPrice: BEPrice,
					recvWindow: 59999,
					newClientOrderId: OrderType.BREAK + ORDER_ID_DIV + BEPrice,
					timeInForce: "GTC",
				});

				const TRPriceNumber =
					pos.positionSide === "LONG"
						? pos.entryPriceUSDT * (1 + trailing)
						: pos.entryPriceUSDT * (1 - trailing);

				const TRPrice = fixPrecision({
					value: TRPriceNumber,
					precision: symbol.pricePrecision,
				});
				console.log(
					"Placing trailing order for " + user.name + " in " + pos.pair
				);
				context.userList[userIndex].openOrders.push({
					price: trailing,
					pair: symbol.pair,
					orderType: OrderType.BREAK,
					orderId: 0,
					coinQuantity: Number(pos.coinQuantity),
					clientOrderId: OrderType.BREAK + ORDER_ID_DIV + trailing,
				});
				await authExchange.futuresOrder({
					type: "TRAILING_STOP_MARKET",
					side: pos.positionSide === "LONG" ? "SELL" : "BUY",
					positionSide: pos.positionSide,
					symbol: symbol.pair,
					quantity: pos.coinQuantity,
					callbackRate: (trailing * 100).toFixed(1),
					activationPrice: TRPrice,
					recvWindow: 59999,
					newClientOrderId: OrderType.BREAK + ORDER_ID_DIV + TRPrice,
				});

				const orderTP = ordersSamePair.find((o) => o.orderType === "PROFIT");

				if (!orderTP) continue;

				await authExchange.futuresCancelOrder({
					orderId: orderTP.orderId,
					symbol: pos.pair,
				});
				continue;
			}
		}
	}
};
