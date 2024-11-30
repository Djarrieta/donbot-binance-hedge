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
		let maxAccPnl = 0;
		let accPnl = 0;
		let drawdown = 0;
		let badRun = 0;
		let badRunLocal = 0;
		for (let index = 0; index < shuffled.length; index++) {
			accPnl += Number(shuffled[index]);
			if (accPnl > maxAccPnl) maxAccPnl = accPnl;
			if (maxAccPnl - accPnl > drawdown) drawdown = maxAccPnl - accPnl;
			if (Number(shuffled[index]) <= 0) badRunLocal++;
			if (Number(shuffled[index]) > 0) {
				if (badRunLocal > badRun) badRun = badRunLocal;
				badRunLocal = 0;
			}
		}

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
