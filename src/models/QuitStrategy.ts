import { Candle } from "./Candle";
import { Interval } from "./Interval";
import { PositionSide } from "./Position";

export interface QuitStrategyResponse {
	shouldQuit: boolean;
}

export interface QuitStrategy {
	name: string;
	lookBackLength: number;
	interval: Interval;
	validate: (props: {
		candlestick: Candle[];
		side: PositionSide;
		pair?: string;
	}) => QuitStrategyResponse;
}
