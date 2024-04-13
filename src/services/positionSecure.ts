import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { fixPrecision } from "../utils/fixPrecision";

interface PositionSecureProps {
	alertPt: number;
	breakEvenPt: number;
}
export const positionSecure = async ({
	breakEvenPt,
	alertPt,
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
					price: breakEvenPt,
					pair: symbol.pair,
					orderType: OrderType.BREAK,
					orderId: 0,
					coinQuantity: Number(pos.coinQuantity),
					clientOrderId: OrderType.BREAK + ORDER_ID_DIV + breakEvenPt,
				});
				const BEPriceNumber =
					pos.positionSide === "LONG"
						? pos.entryPriceUSDT * (1 + breakEvenPt)
						: pos.entryPriceUSDT * (1 - breakEvenPt);

				const BEPrice = fixPrecision({
					value: BEPriceNumber,
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
			}
		}
	}
};
