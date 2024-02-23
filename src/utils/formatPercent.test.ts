import { describe, expect, test } from "bun:test";
import { formatPercent } from "./formatPercent";

describe("formatPercent function", () => {
	test("returns the correct percentage string for a given number", () => {
		expect(formatPercent(0)).toBe("0.00%");
		expect(formatPercent(-0.5)).toBe("-50.00%");
		expect(formatPercent(0.5)).toBe("50.00%");
		expect(formatPercent(0.123456)).toBe("12.35%");
		expect(formatPercent(1)).toBe("100.00%");
	});
});
