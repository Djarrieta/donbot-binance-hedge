import type { Candle } from "./Candle";
import type { Interval } from "./Interval";
import type { PositionSide } from "./Position";

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
