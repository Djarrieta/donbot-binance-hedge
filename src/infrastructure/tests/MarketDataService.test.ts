import { expect, test, describe } from "bun:test";
import { MarketDataService } from "../MarketDataService";
import { getDate, type DateString } from "../../utils/getDate";
import { Interval } from "../../domain/Interval";

describe("Market Data Service", () => {
	test("gets pair list", async () => {
		const marketDataService = new MarketDataService();
		const pairList = await marketDataService.getPairList({
			minAmountToTradeUSDT: 6,
		});

		expect(pairList).toBeInstanceOf(Array);
		expect(pairList.length).toBeGreaterThan(200);
		expect(pairList.includes("XRPUSDT")).toBeTruthy();
	});

	test("gets candlesticks under api limit", async () => {
		const marketDataService = new MarketDataService();
		const candlestick = await marketDataService.getCandlestick({
			pair: "XRPUSDT",
			start: getDate("2024-11-01" as DateString).dateMs,
			end: getDate("2024-11-03" as DateString).dateMs,
			interval: Interval["1h"],
			apiLimit: 100,
		});

		expect(candlestick[0].openTime).toBe(
			getDate("2024-11-01" as DateString).dateMs
		);

		expect(
			getDate(candlestick[candlestick.length - 1].openTime).dateString
		).toBe("2024 11 02 23:00:00" as DateString);
		expect(candlestick).toBeInstanceOf(Array);
		expect(candlestick.length).toBe(48);
		expect(candlestick[0].pair).toEqual("XRPUSDT");
	});

	test("gets candlesticks over api limit", async () => {
		const marketDataService = new MarketDataService();
		const candlestick = await marketDataService.getCandlestick({
			pair: "XRPUSDT",
			start: getDate("2024-11-01" as DateString).dateMs,
			end: getDate("2024-11-03" as DateString).dateMs,
			interval: Interval["1h"],
			apiLimit: 20,
		});

		expect(candlestick[0].openTime).toBe(
			getDate("2024-11-01" as DateString).dateMs
		);

		expect(
			getDate(candlestick[candlestick.length - 1].openTime).dateString
		).toBe("2024 11 02 23:00:00" as DateString);
		expect(candlestick).toBeInstanceOf(Array);
		expect(candlestick.length).toBe(48);
		expect(candlestick[0].pair).toEqual("XRPUSDT");
	});
});
