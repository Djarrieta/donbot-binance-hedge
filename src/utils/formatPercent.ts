export const formatPercent = (input: number) => {
	const percent = (input * 100).toFixed(2);

	return `${percent}%`;
};
