import Binance from "binance-api-node";
import { OrderType } from "../../sharedModels/Order";
import type { PositionSide } from "../../sharedModels/Position";
import { type Symbol } from "../../symbol/Symbol";
import { fixPrecision } from "../../utils/fixPrecision";
import { orderIdNameGenerator } from "../../utils/orderIdNameGenerator";
import type { User } from "../User";

interface SecurePositionServiceProps {
	user: User;
	symbol: Symbol;
	bePrice: number;
	positionSide: PositionSide;
	coinQuantity: number;
}
export const securePositionService = async ({
	symbol,
	user,
	positionSide,
	coinQuantity,
	bePrice,
}: SecurePositionServiceProps) => {
	const authExchange = Binance({
		apiKey: user.binanceApiKey,
		apiSecret: user.binanceApiSecret || "",
	});

	const BEPrice = fixPrecision({
		value: bePrice,
		precision: symbol.pricePrecision,
	});

	const quantity = fixPrecision({
		value: coinQuantity,
		precision: symbol.quantityPrecision,
	});

	await authExchange.futuresOrder({
		type: "STOP_MARKET",
		side: positionSide === "LONG" ? "SELL" : "BUY",
		positionSide,
		symbol: symbol.pair,
		quantity,
		stopPrice: BEPrice,
		recvWindow: 59999,
		newClientOrderId: orderIdNameGenerator({
			orderType: OrderType.BREAK,
			positionSide,
			price: BEPrice,
		}).fullIdName,
		timeInForce: "GTC",
	});
};
