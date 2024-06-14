import type { Candle } from "../sharedModels/Candle";
import type { Interval } from "../sharedModels/Interval";
import type { PositionSide } from "../sharedModels/Position";

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
