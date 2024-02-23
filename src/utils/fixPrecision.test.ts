import { describe, expect, test } from "bun:test";
import { fixPrecision } from "./fixPrecision";

describe("fixPrecision function", () => {
	test("correctly fixes precision for a given value and precision", () => {
		const result1 = fixPrecision({ value: 123.456, precision: 2 });
		expect(result1).toBe("123.46");

		const result2 = fixPrecision({ value: 987.654, precision: 1 });
		expect(result2).toBe("987.7");
	});
	test("handles zero input", () => {
		const result = fixPrecision({ value: 0, precision: 2 });
		expect(result).toBe("0");
	});
	test("handles NaN input", () => {
		const result = fixPrecision({ value: NaN, precision: 2 });
		expect(result).toBe("0");
	});
	test("handles Infinity input", () => {
		const result = fixPrecision({ value: Infinity, precision: 2 });
		expect(result).toBe("0");
	});
});
