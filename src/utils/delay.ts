export const delay = (ms: number): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms < 0 ? 0 : ms);
	});
};
