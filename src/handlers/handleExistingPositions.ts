import { Context } from "../Context";
import type { User } from "../user/User";

export const handleExistingPositions = async ({ user }: { user: User }) => {
	const context = await Context.getInstance();
	if (!context) return;
	const userIndex = context.userList.findIndex((x) => x.name === user.name);
	if (userIndex === -1) return;

	const openOrdersUniquePairs = Array.from(
		new Set(context.userList[userIndex].openOrders.map((x) => x.pair))
	);
	const openPosUniquePairs = Array.from(
		new Set(context.userList[userIndex].openPositions.map((x) => x.pair))
	);
	const hedgePosUniquePairs = Array.from(
		new Set(
			context.userList[userIndex].openPositions
				.filter((p) => p.status === "HEDGED")
				.map((x) => x.pair)
		)
	);
	const unprotectedPosUniquePairs = Array.from(
		new Set(
			context.userList[userIndex].openPositions
				.filter((p) => p.status === "UNPROTECTED")
				.map((x) => x.pair)
		)
	);

	//Cancel orders when no open positions
	for (const pair of openOrdersUniquePairs) {
		if (openPosUniquePairs.includes(pair)) continue;

		console.log(
			"Canceling orders for " + context.userList[userIndex].name + " in " + pair
		);
		await context.cancelOrders({ userName: user.name, pair });
	}

	//Cancel orders for Hedge positions
	for (const pair of hedgePosUniquePairs) {
		const openOrders = context.userList[userIndex].openOrders.filter(
			(o) => o.pair === pair
		);

		if (openOrders.length >= 1) {
			console.log(
				"Canceling orders for " +
					context.userList[userIndex].name +
					" in " +
					pair
			);
			await context.cancelOrders({ userName: user.name, pair });
		}
	}

	//Protect unprotected positions
	for (const pair of unprotectedPosUniquePairs) {
		console.log(
			"Protecting position for " +
				context.userList[userIndex].name +
				" in " +
				pair
		);
		const symbol = context.symbolList.find((s) => s.pair === pair);
		if (!symbol) continue;
		await context.protectPosition({
			userName: user.name,
			symbol,
			positionSide: "LONG",
		});
	}

	//Quit if total Pnl > hedge open PosPnl
	for (const pair of hedgePosUniquePairs) {
		const openPosSamePair = context.userList[userIndex].openPositions.filter(
			(p) => p.pair === pair
		);
		const samePairOpenPosPnlPt = openPosSamePair.reduce((acc, pos) => {
			return acc + pos.pnl;
		}, 0);
		const symbol = context.symbolList.find((s) => s.pair === pair);
		if (!symbol) continue;

		if (context.userList[userIndex].totalPnlPt + samePairOpenPosPnlPt > 0) {
			for (const pos of openPosSamePair) {
				if (!pos.coinQuantity) continue;
				console.log("Quit Hedged position for " + pos.pair);
				await context.quitPosition({
					user: context.userList[userIndex],
					positionSide: pos.positionSide,
					symbol,
					coinQuantity: pos.coinQuantity,
				});
			}
			return;
		}
	}
};
