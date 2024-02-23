import { describe, expect, test } from "bun:test";
import { getDate, DateString, ShortDateString } from "./getDate";

describe("getDate function", () => {
	test("returns the correct date for a given timestamp", () => {
		const timestamp = 1645678912345;
		expect(getDate(timestamp).dateMs).toBe(timestamp);
	});

	test("returns the correct date for a given date string with time", () => {
		const dateString = "2024 02 23 12:30:45" as DateString;
		expect(getDate(dateString).dateString).toBe(dateString);
	});

	test("returns the correct date for a given date string without time", () => {
		const shortDateString = "2024-02-23" as ShortDateString;
		expect(getDate(shortDateString).shortDateString).toBe(shortDateString);
	});

	test("returns the correct date for a given Date object", () => {
		const inputDate = new Date("2024-02-23T12:30:45");
		expect(getDate(inputDate).dateMs).toBe(inputDate.getTime());
	});
	test("returns the current date when no date is passed", () => {
		expect(getDate().dateMs).toBe(new Date().getTime());
		expect(getDate(null).dateMs).toBe(new Date().getTime());
	});
});
