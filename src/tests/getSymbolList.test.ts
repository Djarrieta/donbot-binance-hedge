import { describe, expect, jest, mock, test } from "bun:test";
import { Interval } from "../models/Interval";
import { getSymbolList } from "./getSymbolList";

describe("getSymbolList function", async () => {
	mock.module("binance-api-node", () => ({
		__esModule: true,
		default: () => ({
			futuresExchangeInfo: jest.fn().mockReturnValue({
				symbols: [
					{ symbol: "BTCUSDT", pricePrecision: 2, quantityPrecision: 3 },
					{ symbol: "ETHUSDT", pricePrecision: 3, quantityPrecision: 2 },
				],
			}),
		}),
		CandleChartInterval_LT: Interval,
	}));
	mock.module("./getSymbolList", () => ({
		__esModule: true,
		getCompletePairList: () => [
			{
				pair: "BTCUSDT",
				minQuantityUSD: 10,
				minNotional: 5,
				candlestick: [],
				currentPrice: 5000,
			},
			{
				pair: "ETHUSDT",
				minQuantityUSD: 5,
				minNotional: 2,
				candlestick: [],
				currentPrice: 200,
			},
		],
	}));
	test("returns the correct symbol list", async () => {
		const result = await getSymbolList();
		expect(result).toEqual([
			{
				pair: "BTCUSDT",
				minQuantityUSD: 10,
				minNotional: 5,
				pricePrecision: 2,
				quantityPrecision: 3,
				candlestick: [],
				currentPrice: 5000,
				isReady: true,
				isLoading: true,
			},
			{
				pair: "ETHUSDT",
				minQuantityUSD: 5,
				minNotional: 2,
				pricePrecision: 3,
				quantityPrecision: 2,
				candlestick: [],
				currentPrice: 200,
				isReady: true,
				isLoading: true,
			},
		]);
	});
});
