import type { Candle } from "./Candle";
import type { Interval } from "./Interval";
import type { PositionSide } from "./Position";

export class Strategy {
	constructor(props: {
		stgName: string;
		lookBackLength: number;
		interval: Interval;
		allowedPairs?: string[];
		validate: (props: {
			candlestick: Candle[];
			pair: string;
		}) => StrategyResponse;
	}) {
		this.stgName = props.stgName;
		this.lookBackLength = props.lookBackLength;
		this.interval = props.interval;
		this.allowedPairs = props.allowedPairs;
		this.validate = props.validate;
	}

	stgName: string;
	lookBackLength: number;
	interval: Interval;
	allowedPairs?: string[];
	validate: (props: {
		candlestick: Candle[];
		pair: string;
	}) => StrategyResponse;
}

export type StrategyResponse = {
	stgName: string;
	positionSide: PositionSide | null;
	pair: string;
	sl?: number;
	tp?: number;
};
