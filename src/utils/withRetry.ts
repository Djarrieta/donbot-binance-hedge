import { delay } from "./delay";

export function withRetry<T>(fn: () => T | Promise<T>): T | Promise<T> {
	const maxAttempts = 30;
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
			delay(5000);
		}
	}

	throw new Error("Unreachable code");
}
