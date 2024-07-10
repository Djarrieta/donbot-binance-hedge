export function withRetry<T>(fn: () => T | Promise<T>): T | Promise<T> {
	const maxAttempts = 3;
	let attempt = 0;

	while (attempt < maxAttempts) {
		try {
			const result = fn();
			if (result instanceof Promise) {
				return result.catch((error) => {
					attempt++;
					console.log(`Retrying attempt ${attempt}...`);
					if (attempt >= maxAttempts) {
						throw error;
					}
					return withRetry(fn as () => Promise<T>);
				});
			}
			return result;
		} catch (error) {
			attempt++;
			console.log(`Retrying attempt ${attempt}...`);
			if (attempt >= maxAttempts) {
				throw error;
			}
		}
	}

	throw new Error("Unreachable code");
}
