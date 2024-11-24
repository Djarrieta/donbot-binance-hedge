import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "fs";
import type { CandleBt } from "../../domain/Candle";
import type { Stat } from "../../domain/Stat";
import { BacktestDataService } from "../BacktestDataService";

const TEST_DB_NAME = "TEST.db";
const deletePreviousDB = () => {
	try {
		unlinkSync(TEST_DB_NAME);
	} catch (e) {
		console.log(e);
	}
};

const fakeCandlestick: CandleBt[] = [
	{
		pair: "MANAUSDT",
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

const fakeStat: Stat = {
	sl: 1,
	tp: 1,
	maxTradeLength: 1,

	winningPairs: ["XRPUSDT", "MANAUSDT"],

	winRateWP: 1,
	winRateAcc: 1,
	winRateFwd: 1,

	avPnlWP: 1,
	avPnlFwd: 1,
	avPnlAcc: 1,

	accPnlWP: 0,
	accPnlFwd: 0,
	accPnlAcc: 0,

	positions: [
		{
			pair: "XRPUSDT",
			startTime: 1,
			pnl: 1,
			tradeLength: 1,
			entryPriceUSDT: 1,
			positionSide: "LONG",
			stgName: "stgName",
		},
	],
	positionsWP: [
		{
			pair: "BTCUSDT",
			startTime: 1,
			pnl: 1,
			tradeLength: 1,
			entryPriceUSDT: 1,
			positionSide: "LONG",
			stgName: "stgName",
		},
	],
	positionsAcc: [
		{
			pair: "MANAUSDT",
			startTime: 1,
			pnl: 1,
			tradeLength: 1,
			entryPriceUSDT: 1,
			positionSide: "LONG",
			stgName: "stgName",
		},
	],
	positionsFwd: [
		{
			pair: "MANAUSDT",
			startTime: 1,
			pnl: 1,
			tradeLength: 1,
			entryPriceUSDT: 1,
			positionSide: "LONG",
			stgName: "stgName",
		},
	],
};

describe("Backtest Data Service", () => {
	beforeAll(() => {
		deletePreviousDB();

		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});
		backtestDataService.saveCandlestick(fakeCandlestick);
		backtestDataService.saveStats(fakeStat);
	});

	afterAll(() => {
		deletePreviousDB();
	});

	test("gets pair list", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const pairList = backtestDataService.getPairList();

		expect(pairList).toEqual(["MANAUSDT", "XRPUSDT"]);
	});

	test("get candlesticks in the range", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const candlesticks = backtestDataService.getCandlestick({
			start: 1730736204001,
			end: 1730736204002,
		});
		expect(candlesticks).toEqual(fakeCandlestick.slice(0, 2));
	});

	test(" delete Candlestick Rows", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});
		backtestDataService.deleteCandlestickRows();

		const candlesticks = backtestDataService.getCandlestick({
			start: 1730736204001,
			end: 1730736204003,
		});

		expect(candlesticks).toEqual([]);
	});

	test("get stats", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const stats = backtestDataService.getSavedStats();
		expect(stats).toEqual([fakeStat]);
	});

	test("get positionsWP", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const positionsWP = backtestDataService.getSavedStatsPositions({
			sl: 1,
			tp: 1,
			maxTradeLength: 1,
			column: "positionsWP",
		});
		expect(positionsWP).toEqual(fakeStat.positionsWP);
	});

	test("get positionsAcc", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const positionsAcc = backtestDataService.getSavedStatsPositions({
			sl: 1,
			tp: 1,
			maxTradeLength: 1,
			column: "positionsAcc",
		});
		expect(positionsAcc).toEqual(fakeStat.positionsAcc);
	});

	test("get positionsFwd", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const positionsFwd = backtestDataService.getSavedStatsPositions({
			sl: 1,
			tp: 1,
			maxTradeLength: 1,
			column: "positionsFwd",
		});
		expect(positionsFwd).toEqual(fakeStat.positionsFwd);
	});

	test("get positions", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		const positions = backtestDataService.getSavedStatsPositions({
			sl: 1,
			tp: 1,
			maxTradeLength: 1,
			column: "positions",
		});
		expect(positions).toEqual(fakeStat.positions);
	});

	test("delete stats rows", () => {
		const backtestDataService = new BacktestDataService({
			databaseName: TEST_DB_NAME,
			tableName: "symbolsBT",
			statsTableName: "statsBT",
		});

		backtestDataService.deleteStatsRows();
		const stats = backtestDataService.getSavedStats();
		expect(stats).toEqual([]);
	});
});
