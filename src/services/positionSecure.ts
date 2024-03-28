import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { fixPrecision } from "../utils/fixPrecision";
import { getDate } from "../utils/getDate";

interface PositionSecureProps {
	alertPt: number;
	sc: number;
}
export const positionSecure = async ({ sc, alertPt }: PositionSecureProps) => {
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
			if (
				context.userList[userIndex].openPositions[posIndex].status === "SECURED"
			)
				continue;

			console.log("Securing position for " + user.name + " in " + pos.pair);

			context.userList[userIndex].openPositions[posIndex].status = "SECURED";

			const SCPriceNumber =
				pos.positionSide === "LONG"
					? pos.entryPriceUSDT * (1 + sc)
					: pos.entryPriceUSDT * (1 - sc);

			const SCPrice = fixPrecision({
				value: SCPriceNumber,
				precision: symbol.pricePrecision,
			});

			const authExchange = Binance({
				apiKey: user.key,
				apiSecret: user.secret || "",
			});

			await authExchange.futuresOrder({
				type: "STOP_MARKET",
				side: pos.positionSide === "LONG" ? "SELL" : "BUY",
				positionSide: pos.positionSide,
				symbol: symbol.pair,
				quantity: pos.coinQuantity,
				stopPrice: SCPrice,
				recvWindow: 59999,
				newClientOrderId:
					OrderType.BREAK +
					ORDER_ID_DIV +
					SCPrice.replace(".", "").replace(",", ""),
				timeInForce: "GTC",
			});
		}
	}
};
