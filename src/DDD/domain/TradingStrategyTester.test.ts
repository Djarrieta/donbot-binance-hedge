import { describe, expect, test } from "bun:test";
import { BacktestDataService } from "../infrastructure/BacktestDataService";
import { MarketDataService } from "../infrastructure/MarketDataService";
import type { Candle } from "./Candle";
import { Interval } from "./Interval";
import type { PositionBT } from "./Position";
import type { Strategy } from "./Strategy";
import {
	TradingStrategyTester,
	type BacktestConfig,
} from "./TradingStrategyTester";

const backtestDataService = new BacktestDataService({
	databaseName: "TEST.db",
	tableName: "BACKTEST_DATA",
	statsTableName: "STATS_DATA",
});
const marketDataService = new MarketDataService();
const backtestConfig: BacktestConfig = {
	backtestStart: 0,
	backtestEnd: 0,
	forwardTestEnd: 0,
	interval: Interval["1d"],
	lookBackLength: 0,
	slArray: [0],
	tpArray: [0],
	riskPt: 0,
	feePt: 0,
	maxTradeLengthArray: [0],
	minAmountToTradeUSDT: 0,
	apiLimit: 0,
};
const strategies: Strategy[] = [];

const tradingStrategyTester = new TradingStrategyTester(
	backtestConfig,
	backtestDataService,
	marketDataService,
	strategies
);

const fakePositions: PositionBT[] = [
	{
		pair: "XRPUSDT",
		startTime: 1,
		pnl: -1,
		tradeLength: 1,
		positionSide: "LONG",
		entryPriceUSDT: 0,
		stgName: "",
	},
	{
		pair: "MANAUSDT",
		startTime: 2,
		pnl: 1,
		tradeLength: 1,
		positionSide: "SHORT",
		entryPriceUSDT: 0,
		stgName: "",
	},
	{
		pair: "MANAUSDT",
		startTime: 2,
		pnl: 1,
		tradeLength: 1,
		positionSide: "SHORT",
		entryPriceUSDT: 0,
		stgName: "",
	},
	{
		pair: "SOLUSDT",
		startTime: 3,
		pnl: 1,
		tradeLength: 1,
		positionSide: "LONG",
		entryPriceUSDT: 0,
		stgName: "",
	},
	{
		pair: "MANAUSDT",
		startTime: 4,
		pnl: 1,
		tradeLength: 1,
		positionSide: "LONG",
		entryPriceUSDT: 0,
		stgName: "",
	},
	{
		pair: "MANAUSDT",
		startTime: 4,
		pnl: 1,
		tradeLength: 1,
		positionSide: "LONG",
		entryPriceUSDT: 0,
		stgName: "",
	},
	{
		pair: "XRPUSDT",
		startTime: 5,
		pnl: 1,
		tradeLength: 1,
		positionSide: "LONG",
		entryPriceUSDT: 0,
		stgName: "",
	},
];

describe("TradingStrategyTester", () => {
	test("processStats", () => {
		const stats = tradingStrategyTester.processStats({
			maxTradeLength: 0,
			sl: 0,
			tp: 0,
			positions: fakePositions,
			backtestEnd: 3,
		});

		expect(stats.positions).toBe(fakePositions);
		expect(stats.winningPairs).toEqual(["MANAUSDT", "SOLUSDT"]);
		expect(stats.positionsWP).toEqual([
			{
				pair: "MANAUSDT",
				startTime: 2,
				pnl: 1,
				tradeLength: 1,
				positionSide: "SHORT",
				entryPriceUSDT: 0,
				stgName: "",
			},
			{
				pair: "MANAUSDT",
				startTime: 2,
				pnl: 1,
				tradeLength: 1,
				positionSide: "SHORT",
				entryPriceUSDT: 0,
				stgName: "",
			},
			{
				pair: "SOLUSDT",
				startTime: 3,
				pnl: 1,
				tradeLength: 1,
				positionSide: "LONG",
				entryPriceUSDT: 0,
				stgName: "",
			},
		]);
		expect(stats.positionsAcc).toEqual([
			{
				pair: "MANAUSDT",
				startTime: 2,
				pnl: 1,
				tradeLength: 1,
				positionSide: "SHORT",
				entryPriceUSDT: 0,
				stgName: "",
			},
		]);
		expect(stats.positionsFwd).toEqual([
			{
				entryPriceUSDT: 0,
				pair: "MANAUSDT",
				pnl: 1,
				positionSide: "LONG",
				startTime: 4,
				stgName: "",
				tradeLength: 1,
			},
		]);
	});

	test("fixCandlestick", () => {
		const fakeCandlestick: Candle[] = [
			{
				pair: "MANAUSDT",
				open: 2,
				high: 2,
				low: 2,
				close: 2,
				volume: 2,
				openTime: 2 * Interval["1h"],
			},
			{
				pair: "MANAUSDT",
				open: 3,
				high: 3,
				low: 3,
				close: 3,
				volume: 3,
				openTime: 3 * Interval["1h"],
			},
		];
		const fixedCandlestick = tradingStrategyTester.fixCandlestick({
			candlestick: fakeCandlestick,
			start: 1 * Interval["1h"],
			end: 4 * Interval["1h"],
			interval: Interval["1h"],
		});
		expect(fixedCandlestick).toEqual([
			{
				pair: "MANAUSDT",
				open: 0,
				high: 0,
				low: 0,
				close: 0,
				volume: 0,
				openTime: 1 * Interval["1h"],
			},
			...fakeCandlestick,
			{
				pair: "MANAUSDT",
				open: 3,
				high: 3,
				low: 3,
				close: 3,
				volume: 3,
				openTime: 4 * Interval["1h"],
			},
		]);
	});
});
