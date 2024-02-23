import { describe, expect, test } from "bun:test";
import { checkCandlestick } from "./checkCandlestick";
import { Interval } from "../models/Interval";
import { Candle } from "../models/Candle";

describe("checkCandlestick function", () => {
	test("returns true for a valid candlestick with consecutive intervals", () => {
		const interval = Interval["1h"];
		const now = new Date();
		const candlestick: Candle[] = [
			{
				open: 100,
				high: 110,
				low: 90,
				close: 105,
				volume: 1000,
				openTime: new Date(now.getTime() - interval),
			},
			{
				open: 105,
				high: 115,
				low: 95,
				close: 110,
				volume: 1200,
				openTime: now,
			},
		];

		const result = checkCandlestick({ candlestick, interval });
		expect(result).toBe(true);
	});

	test("returns false for a candlestick with a gap larger than 2 intervals", () => {
		const interval = Interval["1h"];
		const now = new Date();
		const candlestick: Candle[] = [
			{
				open: 100,
				high: 110,
				low: 90,
				close: 105,
				volume: 1000,
				openTime: new Date(now.getTime() - interval * 3),
			},
			{
				open: 105,
				high: 115,
				low: 95,
				close: 110,
				volume: 1200,
				openTime: now,
			},
		];

		const result = checkCandlestick({ candlestick, interval });
		expect(result).toBe(false);
	});

	test("returns false for a candlestick with non-consecutive intervals", () => {
		const interval = Interval["1h"];
		const now = new Date();
		const candlestick: Candle[] = [
			{
				open: 100,
				high: 110,
				low: 90,
				close: 105,
				volume: 1000,
				openTime: new Date(now.getTime() - interval),
			},
			{
				open: 105,
				high: 115,
				low: 95,
				close: 110,
				volume: 1200,
				openTime: new Date(now.getTime() - interval * 2),
			},
		];

		const result = checkCandlestick({ candlestick, interval });
		expect(result).toBe(false);
	});

	test("returns false for an empty candlestick", () => {
		const interval = Interval["1h"];
		const candlestick: Candle[] = [];

		const result = checkCandlestick({ candlestick, interval });
		expect(result).toBe(false);
	});
});
