import { describe, expect, test } from "bun:test";
import { Candle } from "../models/Candle";
import { getProfitStickAnalysis } from "../services/getProfitStickAnalysis";
import { PositionSide } from "../models/Position";

describe("getProfitStickAnalysis function", () => {
	const mockCandle: Candle = {
		open: 100,
		high: 110,
		low: 90,
		close: 105,
		volume: 1000,
		openTime: new Date(),
	};

	test("calculates profit and status correctly for a lost trade", () => {
		const result = getProfitStickAnalysis({
			pair: "BTC/USD",
			shouldTrade: "LONG" as PositionSide,
			profitStick: [mockCandle, mockCandle, mockCandle],
			sl: 0.02,
			tp: 0.05,
			fee: 0.001,
			stgName: "TestStrategy",
			maxPairLen: 10,
		});

		expect(result.status).toBe("LOST");
		expect(result.pnl).toBe(-0.021);
	});
	test("calculates profit and status correctly for a won trade", () => {
		const winningMockCandle = { ...mockCandle, low: 94, high: 101, close: 101 };
		const result = getProfitStickAnalysis({
			pair: "ETH/USD",
			shouldTrade: "SHORT" as PositionSide,
			profitStick: [winningMockCandle, winningMockCandle, winningMockCandle],
			sl: 0.02,
			tp: 0.05,
			fee: 0.001,
			stgName: "TestStrategy",
			maxPairLen: 10,
		});

		expect(result.status).toBe("WON");
		expect(result.pnl).toBe(0.049);
	});

	test("calculates profit and status correctly for a neutral trade", () => {
		const winningMockCandle = { ...mockCandle, low: 96, high: 101, close: 101 };
		const result = getProfitStickAnalysis({
			pair: "ETH/USD",
			shouldTrade: "SHORT" as PositionSide,
			profitStick: [winningMockCandle, winningMockCandle, winningMockCandle],
			sl: 0.02,
			tp: 0.05,
			fee: 0.001,
			stgName: "TestStrategy",
			maxPairLen: 10,
		});

		expect(result.status).toBe("LOST");
		expect(result.pnl).toBe(-0.01);
	});

	test("handles an empty profitStick array", () => {
		const result = getProfitStickAnalysis({
			pair: "XRP/USD",
			shouldTrade: "LONG" as PositionSide,
			profitStick: [],
			sl: 0.02,
			tp: 0.05,
			fee: 0.001,
			stgName: "TestStrategy",
			maxPairLen: 10,
		});

		expect(result.status).toBe("NEUTRAL");
		expect(result.pnl).toBe(0);
	});
});
