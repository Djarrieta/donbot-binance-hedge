import type { Candle } from "./Candle";
import type { StrategyResponse } from "./Strategy";

export type Alert = StrategyResponse & {
	profitStick: Candle[];
	start: number;
};

export interface AlertRepository {
	getAlerts: ({
		start,
		end,
	}: {
		start: number;
		end: number;
	}) => Promise<Alert[]>;
	saveAlerts: (alerts: Alert[]) => void;
	deleteAlerts: () => void;
}
