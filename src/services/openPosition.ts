import Binance, { Binance as IBinance } from "binance-api-node";
import { Context } from "../models/Context";
import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { User } from "../models/User";
import { fixPrecision } from "../utils/fixPrecision";

interface IOpenPosition {
	user: User;
	symbol: Symbol;
	shouldTrade: PositionSide;
	sl: number;
	tp: number;
	tr?: number;
	callback?: number;
}

export const openPosition = async ({
	user,
	symbol,
	shouldTrade,
	sl,
	tp,
	tr,
	callback,
}: IOpenPosition) => {
	const context = await Context.getInstance();

	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});
	const userIndex = context.userList.findIndex((u) => u.id === user.id);
	const openPosUniquePairs = Array.from(
		new Set(user.openPositions.map((x) => x.pair))
	);

	for (const pair of openPosUniquePairs) {
		const openPosPairLong = user.openPositions.filter(
			(p) => p.pair === pair && p.positionSide === "LONG"
		);
		const openPosPairShort = user.openPositions.filter(
			(p) => p.pair === pair && p.positionSide === "SHORT"
		);

		if (
			symbol.pair === pair &&
			openPosPairLong.length === 1 &&
			openPosPairShort.length === 1 &&
			openPosPairLong[0].coinQuantity === openPosPairShort[0].coinQuantity
		) {
			console.log(
				"Keeping " + shouldTrade + " position for " + user.name + " in " + pair
			);
			context.userList[userIndex].isAddingPosition = true;
			try {
				await placeKPOrder({
					symbol,
					authExchange,
					quantity: openPosPairLong[0].coinQuantity,
					shouldTrade,
				});

				await placeHEOrder({
					symbol,
					authExchange,
					price: symbol.currentPrice,
					quantity: openPosPairLong[0].coinQuantity,
					percent: sl,
					shouldTrade,
				});

				if (tp) {
					await placeTPOrder({
						symbol,
						authExchange,
						price: symbol.currentPrice,
						quantity: openPosPairLong[0].coinQuantity,
						percent: sl,
						shouldTrade,
					});
				}
			} catch (e) {
				console.log(
					"Problem keeping " +
						shouldTrade +
						" position for " +
						user.name +
						" in " +
						symbol.pair
				);
				console.log(e);
			}
		}
	}

	if (
		user.isAddingPosition ||
		openPosUniquePairs.length >= Context.maxOpenPos ||
		openPosUniquePairs.includes(symbol.pair)
	) {
		return;
	}

	console.log("Open  position for " + user.name + " in " + symbol.pair);

	context.userList[userIndex].isAddingPosition = true;

	let quantityNumber =
		Math.max(
			1.1 * Context.minAmountToTrade,
			user.balanceUSDT * Context.amountToTradePt
		) / symbol.currentPrice;

	const quantity = fixPrecision({
		value: quantityNumber,
		precision: symbol.quantityPrecision,
	});

	try {
		await authExchange.futuresCancelAllOpenOrders({ symbol: symbol.pair });
		await placeEntryOrder({ symbol, authExchange, quantity, shouldTrade });
		await placeHEOrder({
			symbol,
			authExchange,
			price: symbol.currentPrice,
			quantity,
			percent: sl,
			shouldTrade,
		});

		if (tp) {
			await placeTPOrder({
				symbol,
				authExchange,
				price: symbol.currentPrice,
				quantity,
				percent: sl,
				shouldTrade,
			});
		}
	} catch (e) {
		console.log(
			"Problem opening position for " + user.name + " in " + symbol.pair
		);
		console.log(e);
	}
};

export interface PlaceOrder {
	symbol: Symbol;
	price: number;
	percent: number;
	shouldTrade: PositionSide;
	authExchange: IBinance;
	quantity: string;
}

export const placeHEOrder = async ({
	symbol,
	price,
	shouldTrade,
	percent,
	authExchange,
	quantity,
}: PlaceOrder) => {
	const HEPriceNumber =
		shouldTrade === "LONG" ? price * (1 - percent) : price * (1 + percent);

	const HEPrice = fixPrecision({
		value: HEPriceNumber,
		precision: symbol.pricePrecision,
	});

	await authExchange.futuresOrder({
		type: "STOP_MARKET",
		side: shouldTrade === "LONG" ? "SELL" : "BUY",
		positionSide: shouldTrade === "LONG" ? "SHORT" : "LONG",
		symbol: symbol.pair,
		quantity,
		stopPrice: HEPrice,
		recvWindow: 59999,
		newClientOrderId: "HE__" + symbol.pair + "-" + HEPrice,
		timeInForce: "GTC",
	});
};

export const placeTPOrder = async ({
	symbol,
	price,
	shouldTrade,
	percent,
	authExchange,
	quantity,
}: PlaceOrder) => {
	const TPPriceNumber =
		shouldTrade === "LONG" ? price * (1 + percent) : price * (1 - percent);

	const TPPrice = fixPrecision({
		value: TPPriceNumber,
		precision: symbol.pricePrecision,
	});

	await authExchange.futuresOrder({
		type: "TAKE_PROFIT_MARKET",
		side: shouldTrade === "LONG" ? "SELL" : "BUY",
		positionSide: shouldTrade,
		symbol: symbol.pair,
		quantity,
		stopPrice: TPPrice,
		recvWindow: 59999,
		newClientOrderId: "TP__" + symbol.pair + "__" + TPPrice,
	});
};

export const placeEntryOrder = async ({
	symbol,
	shouldTrade,
	authExchange,
	quantity,
}: Pick<
	PlaceOrder,
	"symbol" | "shouldTrade" | "authExchange" | "quantity"
>) => {
	await authExchange.futuresOrder({
		type: "MARKET",
		side: shouldTrade === "LONG" ? "BUY" : "SELL",
		positionSide: shouldTrade,
		symbol: symbol.pair,
		quantity,
		recvWindow: 59999,
		newClientOrderId: "PS__" + symbol.pair + "__" + symbol.currentPrice,
	});
};
export const placeKPOrder = async ({
	symbol,
	shouldTrade,
	authExchange,
	quantity,
}: Pick<
	PlaceOrder,
	"symbol" | "shouldTrade" | "authExchange" | "quantity"
>) => {
	await authExchange.futuresOrder({
		type: "MARKET",
		side: shouldTrade === "LONG" ? "SELL" : "BUY",
		positionSide: shouldTrade,
		symbol: symbol.pair,
		quantity,
		recvWindow: 59999,
		newClientOrderId: "KP__" + symbol.pair + "__" + symbol.currentPrice,
	});
};
