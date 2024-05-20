import type { Candle, Interval } from "../schema";
import type { PositionSide } from "./Position";

export type StrategyResponse = {
	stgName: string;
	shouldTrade: PositionSide | null;
	sl: number;
	tp: number;
};

export type Strategy = {
	stgName: string;
	lookBackLength: number;
	interval: Interval;
	validate: (props: {
		candlestick: Candle[];
		pair: string;
	}) => StrategyResponse;
};

export type StrategyStat = {
	stgName: string;
	status: boolean;
	trades: number;
	avPnl: number;
	winRate: string;
};
