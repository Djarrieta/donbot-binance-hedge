import { describe, expect, test } from "bun:test";
import { getDate, DateString } from "./getDate";

describe("getDate function", () => {
	test("returns the correct date for a given timestamp", () => {
		const timestamp = 1645678912345;

		expect(getDate(timestamp).dateMs).toBe(timestamp);
	});

	test("returns the correct date for a given date string", () => {
		const dateString = "2024 02 23 12:30:45" as DateString;

		expect(getDate(dateString).dateString).toBe(dateString);
	});

	test("returns the correct date for a given Date object", () => {
		const inputDate = new Date("2024-02-23T12:30:45");

		expect(getDate(inputDate).date.getTime()).toBe(inputDate.getTime());
	});
});
