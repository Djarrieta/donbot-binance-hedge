export const promiseWithTimeout = <T>(
	promise: Promise<T>,
	ms: number
): Promise<T> => {
	return new Promise<T>((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error(`Promise timed out after ${ms} ms`));
		}, ms);

		promise.then(
			(result) => {
				clearTimeout(timeoutId);
				resolve(result);
			},
			(error) => {
				clearTimeout(timeoutId);
				reject(error);
			}
		);
	});
};
