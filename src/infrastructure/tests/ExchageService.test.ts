import { describe, expect, test } from "bun:test";
import { Interval } from "../../domain/Interval";
import { getDate, type DateString } from "../../utils/getDate";
import { ExchangeService } from "../ExchangeService";

describe("Exchange Service", () => {
	test("gets pair list", async () => {
		const exchange = new ExchangeService();
		const pairList = await exchange.getPairList({
			minAmountToTradeUSDT: 6,
			strategies: [],
		});

		expect(pairList).toBeInstanceOf(Array);
		expect(pairList.length).toBeGreaterThan(200);
		expect(pairList.includes("XRPUSDT")).toBeTruthy();
	});

	test("gets candlesticks under api limit", async () => {
		const exchange = new ExchangeService();
		const candlestick = await exchange.getCandlestick({
			pair: "XRPUSDT",
			start: getDate("2024-11-01" as DateString).dateMs,
			end: getDate("2024-11-03" as DateString).dateMs,
			interval: Interval["1h"],
			candlestickAPILimit: 100,
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
		const exchange = new ExchangeService();
		const candlestick = await exchange.getCandlestick({
			pair: "XRPUSDT",
			start: getDate("2024-11-01" as DateString).dateMs,
			end: getDate("2024-11-03" as DateString).dateMs,
			interval: Interval["1h"],
			candlestickAPILimit: 20,
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