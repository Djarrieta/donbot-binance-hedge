import { Candle } from "./Candle";
import { Interval } from "./Interval";
import { PositionSide } from "./Position";

export interface StrategyResponse {
	stgName: string;
	shouldTrade: PositionSide | null;
	sl: number;
	tp: number;
	tr?: number;
	cb?: number;
}

export interface Strategy {
	stgName: string;
	lookBackLength: number;
	interval: Interval;
	validate: (props: {
		candlestick: Candle[];
		pair?: string;
	}) => StrategyResponse;
}

export interface StrategyStat {
	stgName: string;
	status: boolean;
	trades: number;
	avPnl: number;
	winRate: string;
}
