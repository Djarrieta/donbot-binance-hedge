import Binance, { Binance as IBinance } from "binance-api-node";
import { Context } from "../models/Context";
import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { fixPrecision } from "../utils/fixPrecision";

interface PositionSecureProps {
	symbol: Symbol;
	currentPrice: number;
	pair: string;
	alertPt: number;
	sc: number;
}
export const positionSecure = async ({
	symbol,
	currentPrice,
	pair,
	sc,
	alertPt,
}: PositionSecureProps) => {
	const context = await Context.getInstance();

	for (let userIndex = 0; userIndex < context.userList.length; userIndex++) {
		const user = context.userList[userIndex];

		for (let posIndex = 0; posIndex < user.openPositions.length; posIndex++) {
			const pos = user.openPositions[posIndex];

			if (pos.status !== "PROTECTED" || pos.pair !== pair) continue;

			const pnlGraph =
				pos.positionSide === "LONG"
					? (currentPrice - pos.entryPriceUSDT) / pos.entryPriceUSDT
					: (pos.entryPriceUSDT - currentPrice) / pos.entryPriceUSDT;

			if (pnlGraph >= alertPt) {
				context.userList[userIndex].openPositions[posIndex].status ===
					"SECURED";

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
					type: "TAKE_PROFIT_MARKET",
					side: pos.positionSide === "LONG" ? "SELL" : "BUY",
					positionSide: pos.positionSide,
					symbol: symbol.pair,
					quantity: pos.coinQuantity,
					stopPrice: SCPrice,
					recvWindow: 59999,
					newClientOrderId: OrderType.SECURE + ORDER_ID_DIV + SCPrice,
				});
			}

			pos.entryPriceUSDT;
		}
	}
};
