import Binance from "binance-api-node";
import { User } from "../models/User";

export const manageAccounts = async ({ user }: { user: User }) => {
	const authExchange = Binance({
		apiKey: user.key,
		apiSecret: user.secret || "",
	});

	// Cancel orders if no open positions
	if (user.openOrders.length > 0 && user.openPositions.length === 0) {
		const openOrdersUniquePairs = Array.from(
			new Set(user.openOrders.map((x) => x.pair))
		);
		for (const pair of openOrdersUniquePairs) {
			console.log("Canceling orders for " + user.name + " in " + pair);
			await authExchange.futuresCancelAllOpenOrders({
				symbol: pair,
			});
		}
		return;
	}

	//Cancel orders if Hedge is reached
	if (user.openPositions.length) {
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
				openPosPairLong.length === 1 &&
				openPosPairShort.length === 1 &&
				openPosPairLong[0].coinQuantity === openPosPairShort[0].coinQuantity
			) {
				console.log("Canceling orders for " + user.name + " in " + pair);
				await authExchange.futuresCancelAllOpenOrders({
					symbol: pair,
				});
			}
		}
	}

	//Protect positions with no orders
	if (user.openPositions.length) {
		const openPosUniquePairs = Array.from(
			new Set(user.openPositions.map((x) => x.pair))
		);
		for (const pair of openPosUniquePairs) {
			const openPos = user.openPositions.filter((p) => p.pair === pair);
			const openOrders = user.openOrders.filter((o) => o.pair === pair);

			if (openPos.length === 1 && openOrders.length === 0) {
				console.log("Protecting position for " + user.name + " in " + pair);
				await authExchange.futuresCancelAllOpenOrders({
					symbol: pair,
				});

				return;
			}
		}
	}
};
