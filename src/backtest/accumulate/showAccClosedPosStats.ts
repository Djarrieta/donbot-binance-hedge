import { getSortedAccResults } from "./sortAccResults";

export const showAccClosedPosStats = async () => {
	const sortedResults = await getSortedAccResults();

	const closedPositions = JSON.parse(
		sortedResults[0].closedPositions as string
	);

	console.table(closedPositions);
};

showAccClosedPosStats();
