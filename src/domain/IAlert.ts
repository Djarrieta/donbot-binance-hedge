import type { Alert } from "./Alert";

export type IAlert = {
	getAlerts: ({
		start,
		end,
	}: {
		start: number;
		end: number;
	}) => Promise<Alert[]>;
	saveAlerts: (alerts: Alert[]) => void;
	deleteAlerts: () => void;
};
