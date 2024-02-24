import { describe, expect, test } from "bun:test";
import { delay } from "../utils/delay";

describe("delay function", () => {
	test("resolves after the specified delay", async () => {
		const delayTime = 1000;
		const startTime = Date.now();

		await delay(delayTime);

		const endTime = Date.now();
		const elapsed = endTime - startTime;

		expect(elapsed).toBeGreaterThanOrEqual(delayTime - 50);
		expect(elapsed).toBeLessThanOrEqual(delayTime + 50);
	});

	test("handles negative delay gracefully", async () => {
		const delayTime = -1000;
		const startTime = Date.now();

		await delay(delayTime);

		const endTime = Date.now();
		const elapsed = endTime - startTime;

		expect(elapsed).toBeGreaterThanOrEqual(0);
		expect(elapsed).toBeLessThanOrEqual(50);
	});

	test("handles 0 delay gracefully", async () => {
		const delayTime = 0;
		const startTime = Date.now();

		await delay(delayTime);

		const endTime = Date.now();
		const elapsed = endTime - startTime;

		expect(elapsed).toBeGreaterThanOrEqual(0);
		expect(elapsed).toBeLessThanOrEqual(50);
	});
});
