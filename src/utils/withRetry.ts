export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
	const maxAttempts = 3;
	let attempt = 0;

	while (attempt < maxAttempts) {
		try {
			return await fn();
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
