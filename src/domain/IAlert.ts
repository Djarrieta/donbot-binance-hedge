import type { Alert } from "./Alert";

export interface IAlert {
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
