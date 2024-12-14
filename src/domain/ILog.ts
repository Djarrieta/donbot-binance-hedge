import type { Log, LogType } from "./Log";

export type ILog = {
	get: (props: GetLogsProps) => Promise<Log[]>;
	save: (log: Log) => void;
	deleteAll: () => void;
	showLogs: () => void;
};
export type GetLogsProps = {
	start: number;
	end: number;
	type?: LogType;
};
