import { getDrawdown } from "./getDrawdown";

export const monteCarloAnalysis = ({
	values,
	amountOfSimulations,
	confidenceLevel,
}: {
	values: number[];
	amountOfSimulations: number;
	confidenceLevel: number;
}) => {
	const shuffleArray = (values: number[]) => {
		for (let i = values.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[values[i], values[j]] = [values[j], values[i]];
		}
		return values;
	};
	const result = [];
	for (let index = 0; index < amountOfSimulations; index++) {
		const shuffled = shuffleArray(values);
		const { drawdown, badRun } = getDrawdown({ pnlArray: shuffled });

		result.push({
			drawdown,
			badRun,
		});
	}
	result.sort((a, b) => a.drawdown - b.drawdown);
	const response = result[Math.floor(amountOfSimulations * confidenceLevel)];
	return {
		drawdownMonteCarlo: response.drawdown,
		badRunMonteCarlo: response.badRun,
	};
};
