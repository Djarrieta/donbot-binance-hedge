import type { Candle } from "../models/Candle";
import type { Interval } from "../models/Interval";
import type { PositionSide } from "../models/Position";

export type StrategyResponse = {
	stgName: string;
	positionSide: PositionSide | null;
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
