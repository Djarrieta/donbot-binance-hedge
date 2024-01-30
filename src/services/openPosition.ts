import Binance from "binance-api-node";
import { Context } from "../models/Context";
import { PositionSide } from "../models/Position";
import { Symbol } from "../models/Symbol";
import { User } from "../models/User";
import { fixPrecision } from "../utils/fixPrecision";

export const openPosition = async ({
	user,
	symbol,
	shouldTrade,
	sl,
	tp,
	tr,
	callback,
}: {
	user: User;
	symbol: Symbol;
	shouldTrade: PositionSide;
	sl: number;
	tp: number;
	tr?: number;
	callback?: number;
}) => {
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
				await authExchange.futuresOrder({
					type: "MARKET",
					side: shouldTrade === "LONG" ? "SELL" : "BUY",
					positionSide: shouldTrade,
					symbol: symbol.pair,
					quantity: openPosPairLong[0].coinQuantity,
					recvWindow: 59999,
					newClientOrderId: "KP-" + symbol.pair,
					newOrderRespType: "FULL",
				});

				const SLPriceNumber =
					shouldTrade === "LONG"
						? symbol.currentPrice * (1 - sl)
						: symbol.currentPrice * (1 + sl);

				const SLPrice = fixPrecision({
					value: SLPriceNumber,
					precision: symbol.pricePrecision,
				});

				await authExchange.futuresOrder({
					type: "STOP_MARKET",
					side: shouldTrade === "LONG" ? "SELL" : "BUY",
					positionSide: shouldTrade,
					symbol: symbol.pair,
					quantity: openPosPairLong[0].coinQuantity,
					stopPrice: SLPrice,
					recvWindow: 59999,
					newClientOrderId: "SL-" + symbol.pair + "-" + SLPrice,
					timeInForce: "GTC",
					newOrderRespType: "FULL",
				});

				if (tp) {
					const TPPriceNumber =
						shouldTrade === "LONG"
							? symbol.currentPrice * (1 + tp)
							: symbol.currentPrice * (1 - tp);

					const TPPrice = fixPrecision({
						value: TPPriceNumber,
						precision: symbol.pricePrecision,
					});

					await authExchange.futuresOrder({
						type: "TAKE_PROFIT_MARKET",
						side: shouldTrade === "LONG" ? "SELL" : "BUY",
						positionSide: shouldTrade,
						symbol: symbol.pair,
						quantity: openPosPairLong[0].coinQuantity,
						stopPrice: TPPrice,
						recvWindow: 59999,
						newClientOrderId: "TP-" + symbol.pair + "-" + TPPrice,
						newOrderRespType: "FULL",
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

	const HEPriceNumber =
		shouldTrade === "LONG"
			? symbol.currentPrice * (1 - sl)
			: symbol.currentPrice * (1 + sl);

	const HEPrice = fixPrecision({
		value: HEPriceNumber,
		precision: symbol.pricePrecision,
	});

	try {
		await authExchange.futuresCancelAllOpenOrders({ symbol: symbol.pair });
		await authExchange.futuresOrder({
			type: "MARKET",
			side: shouldTrade === "LONG" ? "BUY" : "SELL",
			positionSide: shouldTrade,
			symbol: symbol.pair,
			quantity,
			recvWindow: 59999,
			newClientOrderId: "PS-" + symbol.pair,
			newOrderRespType: "FULL",
		});

		await authExchange.futuresOrder({
			type: "STOP_MARKET",
			side: shouldTrade === "LONG" ? "BUY" : "SELL",
			positionSide: shouldTrade === "LONG" ? "SHORT" : "LONG",
			symbol: symbol.pair,
			quantity,
			stopPrice: HEPrice,
			recvWindow: 59999,
			newClientOrderId: "HE-" + symbol.pair + "-" + HEPrice,
			timeInForce: "GTC",
			newOrderRespType: "FULL",
		});

		if (tp) {
			const TPPriceNumber =
				shouldTrade === "LONG"
					? symbol.currentPrice * (1 + tp)
					: symbol.currentPrice * (1 - tp);

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
				newClientOrderId: "TP-" + symbol.pair + "-" + TPPrice,
				newOrderRespType: "FULL",
			});
		}
	} catch (e) {
		console.log(
			"Problem opening position for " + user.name + " in " + symbol.pair
		);
		console.log(e);
	}
};
