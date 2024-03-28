import Binance, { Binance as IBinance } from "binance-api-node";
import { Context } from "../models/Context";
import { ORDER_ID_DIV, OrderType } from "../models/Order";
import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { fixPrecision } from "../utils/fixPrecision";

interface PositionSecureProps {
	alertPt: number;
	breakEven: number;
}
export const positionSecure = async ({
	breakEven,
	alertPt,
}: PositionSecureProps) => {
	const context = await Context.getInstance();

	for (let userIndex = 0; userIndex < context.userList.length; userIndex++) {
		const user = context.userList[userIndex];

		for (let posIndex = 0; posIndex < user.openPositions.length; posIndex++) {
			const pos = user.openPositions[posIndex];

			if (pos.status !== "PROTECTED" && pos.status !== "SECURED") continue;

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

				await placeSecureOrder({
					positionSide: pos.positionSide,
					entryPriceUSDT: pos.entryPriceUSDT,
					price: breakEven,
					symbol,
					authExchange,
					quantity: pos.coinQuantity,
				});
				context.userList[userIndex].openOrders.push({
					price: breakEven,
					pair: symbol.pair,
					orderType: OrderType.BREAK,
					orderId: 0,
					coinQuantity: Number(pos.coinQuantity),
					clientOrderId: OrderType.BREAK + ORDER_ID_DIV + breakEven,
				});
				continue;
			}

			if (
				context.userList[userIndex].openPositions[posIndex].status === "SECURED"
			) {
				if (
					pnlGraph > breakEven * 4 &&
					ordersSamePair.filter((o) => o.orderType === "BREAK").length === 1
				) {
					await placeSecureOrder({
						positionSide: pos.positionSide,
						entryPriceUSDT: pos.entryPriceUSDT,
						price: breakEven * 3,
						symbol,
						authExchange,
						quantity: pos.coinQuantity,
					});

					const orderTP = ordersSamePair.find((o) => o.orderType === "PROFIT");

					if (!orderTP) continue;

					await authExchange.futuresCancelOrder({
						orderId: orderTP.orderId,
						symbol: pos.pair,
					});

					context.userList[userIndex].openOrders.push({
						price: breakEven * 3,
						pair: symbol.pair,
						orderType: OrderType.BREAK,
						orderId: 0,
						coinQuantity: Number(pos.coinQuantity),
						clientOrderId: OrderType.BREAK + ORDER_ID_DIV + breakEven * 3,
					});

					continue;
				}
				if (
					pnlGraph > breakEven * 7 &&
					ordersSamePair.filter((o) => o.orderType === "BREAK").length === 2
				) {
					await placeSecureOrder({
						positionSide: pos.positionSide,
						entryPriceUSDT: pos.entryPriceUSDT,
						price: breakEven * 5,
						symbol,
						authExchange,
						quantity: pos.coinQuantity,
					});

					context.userList[userIndex].openOrders.push({
						price: breakEven * 5,
						pair: symbol.pair,
						orderType: OrderType.BREAK,
						orderId: 0,
						coinQuantity: Number(pos.coinQuantity),
						clientOrderId: OrderType.BREAK + ORDER_ID_DIV + breakEven * 5,
					});
					const TRPriceNumber =
						pos.positionSide === "LONG"
							? pos.entryPriceUSDT * (1 + breakEven * 10)
							: pos.entryPriceUSDT * (1 - breakEven * 10);

					const TRPrice = fixPrecision({
						value: TRPriceNumber,
						precision: symbol.pricePrecision,
					});

					await authExchange.futuresOrder({
						type: "TRAILING_STOP_MARKET",
						side: pos.positionSide === "LONG" ? "SELL" : "BUY",
						positionSide: pos.positionSide,
						symbol: symbol.pair,
						quantity: pos.coinQuantity,
						callbackRate: (breakEven * 5 * 100).toFixed(1),
						activationPrice: TRPrice,
						recvWindow: 59999,
						newClientOrderId: OrderType.BREAK + ORDER_ID_DIV + TRPrice,
					});
					continue;
				}

				continue;
			}
		}
	}
};

const placeSecureOrder = async ({
	positionSide,
	entryPriceUSDT,
	price,
	symbol,
	authExchange,
	quantity,
}: {
	positionSide: PositionSide;
	entryPriceUSDT: number;
	price: number;
	symbol: Symbol;
	authExchange: IBinance;
	quantity: string;
}) => {
	const SCPriceNumber =
		positionSide === "LONG"
			? entryPriceUSDT * (1 + price)
			: entryPriceUSDT * (1 - price);

	const SCPrice = fixPrecision({
		value: SCPriceNumber,
		precision: symbol.pricePrecision,
	});

	await authExchange.futuresOrder({
		type: "STOP_MARKET",
		side: positionSide === "LONG" ? "SELL" : "BUY",
		positionSide: positionSide,
		symbol: symbol.pair,
		quantity,
		stopPrice: SCPrice,
		recvWindow: 59999,
		newClientOrderId: OrderType.BREAK + ORDER_ID_DIV + SCPrice,
		timeInForce: "GTC",
	});
};
