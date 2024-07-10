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
	const response = [];
	for (let index = 0; index < amountOfSimulations; index++) {
		const shuffled = shuffleArray(values);
		let maxAccPnl = 0;
		let accPnl = 0;
		let drawdown = 0;
		for (let index = 0; index < shuffled.length; index++) {
			accPnl += Number(shuffled[index]);
			if (accPnl > maxAccPnl) maxAccPnl = accPnl;
			if (maxAccPnl - accPnl > drawdown) drawdown = maxAccPnl - accPnl;
		}

		response.push({
			drawdown,
		});
	}
	response.sort((a, b) => a.drawdown - b.drawdown);
	const drawdownMonteCarlo =
		response[Math.floor(amountOfSimulations * confidenceLevel)].drawdown;
	return { drawdownMonteCarlo };
};
