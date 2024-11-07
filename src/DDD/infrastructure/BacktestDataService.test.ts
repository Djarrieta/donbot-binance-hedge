import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "fs";
import { BacktestDataService } from "./BacktestDataService";
import type { Candle } from "../domain/Candle";

const DB_NAME = "TEST.db";
const deletePreviousDB = () => {
	try {
		unlinkSync(DB_NAME);
	} catch (e) {}
};

describe("Backtest Data Service", () => {
	beforeAll(() => {
		deletePreviousDB();
	});
	afterAll(() => {
		deletePreviousDB();
	});
	test("gets pair list", async () => {
		const backtestDataService = new BacktestDataService({
			databaseName: DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});
		const fakeCandlestick: Candle[] = [
			{
				pair: "XRPUSDT",
				open: 1,
				high: 1,
				low: 1,
				close: 1,
				volume: 1,
				openTime: 1,
			},
			{
				pair: "MANAUSDT",
				open: 1,
				high: 1,
				low: 1,
				close: 1,
				volume: 1,
				openTime: 1,
			},
			{
				pair: "XRPUSDT",
				open: 1,
				high: 1,
				low: 1,
				close: 1,
				volume: 1,
				openTime: 1,
			},
		];

		backtestDataService.saveCandlestick(fakeCandlestick);
		const pairList = backtestDataService.getPairList();

		expect(pairList).toEqual(["XRPUSDT", "MANAUSDT"]);
	});
	test("get candlesticks in the range", async () => {
		const backtestDataService = new BacktestDataService({
			databaseName: DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const fakeCandlestick: Candle[] = [
			{
				pair: "GLMUSDT",
				open: 1,
				high: 1,
				low: 1,
				close: 1,
				volume: 1,
				openTime: 1730736204001,
			},
			{
				pair: "XRPUSDT",
				open: 1,
				high: 1,
				low: 1,
				close: 1,
				volume: 1,
				openTime: 1730736204002,
			},
			{
				pair: "MANAUSDT",
				open: 1,
				high: 1,
				low: 1,
				close: 1,
				volume: 1,
				openTime: 1730736204003,
			},
		];
		backtestDataService.saveCandlestick(fakeCandlestick);

		const candlesticks = backtestDataService.getCandlestick({
			start: 1730736204001,
			end: 1730736204002,
		});
		expect(candlesticks).toEqual(fakeCandlestick.slice(0, 2));
	});
});
