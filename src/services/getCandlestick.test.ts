import { describe, expect, test, mock, jest, setSystemTime } from "bun:test";
import { getCandlestick } from "./getCandlestick";
import { Interval } from "../models/Interval";
import { getDate } from "../utils/getDate";

describe("getCandlestick function", () => {
	const date = new Date("1999-01-01T00:00:00.000Z");
	setSystemTime(date);

	mock.module("binance-api-node", () => ({
		__esModule: true,
		default: () => ({
			futuresCandles: jest.fn().mockReturnValue(mockCandlestick),
		}),
		CandleChartInterval_LT: Interval,
	}));

	const mockPair = "BTCUSDT";
	const mockInterval = Interval["5m"];
	const mockLookBackLength = 2;
	const mockCandlestick = Array.from({ length: 10 }).map((_, index) => ({
		close: "1",
		open: "1",
		high: "1",
		low: "1",
		openTime: getDate(getDate().dateMs - (3 - index) * mockInterval).dateMs,
		volume: "1",
	}));

	test("returns the correct candlestick data", async () => {
		const result = await getCandlestick({
			pair: mockPair,
			interval: mockInterval,
			lookBackLength: mockLookBackLength,
		});

		expect(result).toBeInstanceOf(Array);
		expect(result.length).toBe(mockCandlestick.length);

		const expectedResults = mockCandlestick.map((candle) => ({
			close: 1,
			high: 1,
			low: 1,
			open: 1,
			openTime: getDate(candle.openTime).date,
			volume: 1,
		}));

		expect(result).toEqual(expectedResults);
	});
});
