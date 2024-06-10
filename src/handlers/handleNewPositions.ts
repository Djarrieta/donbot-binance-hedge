import { Context } from "../Context";
import { params } from "../Params";
import type { PositionSide } from "../models/Position";
import type { User } from "../user/User";

export const handleNewPosition = async ({
	user,
	pair,
	positionSide,
}: {
	user: User;
	pair: string;
	positionSide: PositionSide;
}) => {
	const context = await Context.getInstance();
	if (!context) return;

	const hedgedPosUniquePairs = Array.from(
		new Set(
			user.openPositions.filter((p) => p.status === "HEDGED").map((x) => x.pair)
		)
	);

	const openPosUniquePairs = Array.from(
		new Set(user.openPositions.map((x) => x.pair))
	);

	const openPosUnsecuredUniquePairs = Array.from(
		new Set(
			user.openPositions
				.filter((p) => p.status !== "SECURED")
				.map((x) => x.pair)
		)
	);

	const tooManyOpenWithoutHedge =
		!hedgedPosUniquePairs.length &&
		openPosUnsecuredUniquePairs.length >= params.maxProtectedPositions;

	const tooManyOpenWithHedge =
		hedgedPosUniquePairs.length &&
		openPosUnsecuredUniquePairs.length - hedgedPosUniquePairs.length >=
			params.maxProtectedPositions;

	const tooManyHedge = hedgedPosUniquePairs.length >= params.maxHedgePositions;

	if (
		tooManyOpenWithoutHedge ||
		tooManyOpenWithHedge ||
		tooManyHedge ||
		user.isAddingPosition ||
		openPosUniquePairs.includes(pair)
	) {
		return;
	}
	const symbol = context.symbolList.find((s) => s.pair === pair);

	if (!symbol) return;

	await context.openPosition({
		userName: user.name,
		symbol,
		positionSide,
	});
};
