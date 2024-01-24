import { Candle } from "./Candle";
import { Interval } from "./Interval";
import { PositionSide } from "./Position";

export interface StrategyResponse {
	shouldTrade: PositionSide | null;
	sl: number;
	tp?: number;
	tr?: {
		tr: number;
		callback: number;
	};
	name: string;
}

export interface Strategy {
	name: string;
	lookBackLength: number;
	interval: Interval;
	validate: (props: {
		candlestick: Candle[];
		pair?: string;
	}) => StrategyResponse;
}

export interface StrategyStat {
	name: string;
	status: boolean;
}
