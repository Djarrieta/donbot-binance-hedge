import type { Candle } from "./Candle";
import type { StrategyResponse } from "./Strategy";

export type Alert = StrategyResponse & {
	profitStick: Candle[];
	start: number;
};
