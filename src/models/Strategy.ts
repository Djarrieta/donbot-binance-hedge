import { Candle } from "./Candle";
import { Interval } from "./Interval";
import { PositionSide } from "./Position";

export interface Strategy {
	name: string;
	lookBackLength: number;
	interval: Interval;
	validate: (props: {
		candlestick: Candle[];
		volatility?: number;
		pair?: string;
	}) => StrategyResponse;
}
export interface StrategyResponse {
	shouldTrade: PositionSide | null;
	name: string;
	sl: {
		val?: number;
		quitCriteria?: StrategyQuitCriteria;
	};
	tp: {
		val?: number;
		quitCriteria?: StrategyQuitCriteria;
	};
	tr?: {
		val: number;
		callback: number;
	};
}
export type StrategyQuitCriteria = (props: {
	candlestick: Candle[];
}) => boolean;

export interface StrategyStat {
	name: string;
	status: boolean;
}
