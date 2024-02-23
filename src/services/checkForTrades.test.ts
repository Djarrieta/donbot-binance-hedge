import { describe, expect, jest, test } from "bun:test";
import { Candle } from "../models/Candle";
import { Interval } from "../models/Interval";
import { Strategy, StrategyStat } from "../models/Strategy";
import { Symbol } from "../models/Symbol";
import { checkForTrades } from "./checkForTrades";

global.console.log = jest.fn();

describe("checkForTrades function", () => {
	const mockInterval = Interval["1h"];
	const mockCandlestick: Candle[] = [
		{
			open: 145.2,
			high: 148.7,
			low: 143.5,
			close: 147.3,
			volume: 256789,
			openTime: new Date("2024-02-23T10:00:00Z"),
		},
		{
			open: 147.8,
			high: 152.4,
			low: 146.5,
			close: 150.2,
			volume: 312456,
			openTime: new Date("2024-02-23T11:00:00Z"),
		},
	];
	const mockSymbol: Symbol = {
		pair: "BTCUSDT",
		pricePrecision: 8,
		quantityPrecision: 6,
		minQuantityUSD: 10,
		minNotional: 5,
		candlestick: mockCandlestick,
		currentPrice: 45950,
		isReady: true,
		isLoading: false,
		volatility: 2.5,
	};
	const mockStrategyStats: StrategyStat[] = [
		{ stgName: "Strategy1", status: true, avPnl: 0.01, trades: 1 },
		{ stgName: "Strategy2", status: true, avPnl: 0.01, trades: 1 },
	];
	const mockChosenStrategies: Strategy[] = [
		{
			stgName: "Strategy1",
			interval: mockInterval,
			validate: jest.fn(),
			lookBackLength: 10,
		},
		{
			stgName: "Strategy2",
			interval: mockInterval,
			validate: jest.fn(),
			lookBackLength: 10,
		},
	];
	const mockReadySymbols: Symbol[] = [mockSymbol];

	const setupMockValidateFunctions = (
		shouldTradeStrategy1: boolean,
		shouldTradeStrategy2: boolean
	) => {
		mockChosenStrategies[0].validate = jest.fn().mockReturnValue({
			shouldTrade: shouldTradeStrategy1 ? "LONG" : null,
			stgName: "Strategy1",
		});
		mockChosenStrategies[1].validate = jest.fn().mockReturnValue({
			shouldTrade: shouldTradeStrategy2 ? "SHORT" : null,
			stgName: "Strategy2",
		});
	};

	test("returns correct response when there are 1 trade", async () => {
		setupMockValidateFunctions(true, false);

		const result = await checkForTrades({
			readySymbols: mockReadySymbols,
			interval: mockInterval,
			strategyStats: mockStrategyStats,
			chosenStrategies: mockChosenStrategies,
		});

		expect(result.text).toContain(
			"+ Should trade LONG in BTCUSDT with Strategy1"
		);
		expect(result.tradeArray.length).toBe(1);
	});

	test("returns correct response when there are 2 trades", async () => {
		setupMockValidateFunctions(true, true);

		const result = await checkForTrades({
			readySymbols: mockReadySymbols,
			interval: mockInterval,
			strategyStats: mockStrategyStats,
			chosenStrategies: mockChosenStrategies,
		});

		expect(result.text).toBe(
			"+ Should trade LONG in BTCUSDT with Strategy1,SHORT in BTCUSDT with Strategy2"
		);
		expect(result.tradeArray.length).toBe(2);
	});

	test("returns correct response when there are no trades", async () => {
		setupMockValidateFunctions(false, false);

		const result = await checkForTrades({
			readySymbols: mockReadySymbols,
			interval: mockInterval,
			strategyStats: mockStrategyStats,
			chosenStrategies: mockChosenStrategies,
		});

		expect(result.text).toContain("");
		expect(result.tradeArray.length).toBe(0);
	});
	test("returns correct response when there are no strategies to run", async () => {
		const result = await checkForTrades({
			readySymbols: mockReadySymbols,
			interval: mockInterval,
			strategyStats: [],
			chosenStrategies: mockChosenStrategies,
		});

		expect(result.text).toContain("");
		expect(result.tradeArray.length).toBe(0);
	});
	test("returns correct response when there are no ready symbols", async () => {
		const result = await checkForTrades({
			readySymbols: [],
			interval: mockInterval,
			strategyStats: mockStrategyStats,
			chosenStrategies: mockChosenStrategies,
		});

		expect(result.text).toContain("");
		expect(result.tradeArray.length).toBe(0);
	});
});
