import { Database } from "bun:sqlite";
import type { GetLogsProps, ILog } from "../domain/ILog";
import type { Log, LogType } from "../domain/Log";
import { getDate } from "../utils/getDate";
export class LogService implements ILog {
	private db: Database;
	private tableName: string;

	constructor({
		databaseName,
		tableName,
	}: {
		databaseName: string;
		tableName: string;
	}) {
		this.db = new Database(databaseName);
		this.tableName = tableName;
		this.configureDatabase();
	}

	save(log: Log) {
		const query = `
			INSERT INTO ${this.tableName}
			(eventData, type, date, symbolList, userList, strategies, config, isLoading)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const values = [
			JSON.stringify(log.eventData),
			log.type,
			log.date,
			JSON.stringify(log.tradeData.symbolList),
			JSON.stringify(log.tradeData.userList),
			JSON.stringify(log.tradeData.strategies),
			JSON.stringify(log.tradeData.config),
			log.tradeData.isLoading,
		];

		this.db.query(query).run(...values);
	}
	async get({ start, end, type }: GetLogsProps): Promise<Log[]> {
		let query = `
			SELECT *
			FROM ${this.tableName}
			WHERE date >= ${start} AND date <= ${end}
		`;

		if (type) {
			query += ` AND type = '${type}'`;
		}

		query += ` ORDER BY date ASC`;

		const rawResults = this.db.query(query).all() as any[];

		const results: Log[] = rawResults.map((r) => ({
			date: r.date,
			type: r.type,
			eventData: JSON.parse(r.eventData),
			tradeData: {
				symbolList: JSON.parse(r.symbolList),
				userList: JSON.parse(r.userList),
				strategies: JSON.parse(r.strategies),
				config: JSON.parse(r.config),
				isLoading: r.isLoading,
			},
		}));

		return results;
	}

	async showLogs(logType?: LogType) {
		const logs = await this.get({ start: 0, end: Date.now() });

		const filteredLogs = logType
			? logs.filter((l) => l.type === logType)
			: logs;
		console.log(
			filteredLogs.map((l) => {
				return {
					type: l.type,
					date: getDate(l.date).dateString,
					eventData: l.eventData,
					users: l.tradeData.userList.map(
						(u) => `${u.text} ${u.isAddingPosition ? " (adding position)" : ""}`
					),
					readySymbols: l.tradeData.symbolList
						.filter((s) => s.isReady)
						.map((s) => s.pair),
					isTradeLoading: l.tradeData.isLoading,
				};
			})
		);

		const logCounts: { [key in LogType]: number } = {
			Init: 0,
			OpenPos: 0,
			ClosePos: 0,
			SecurePos: 0,
			ProtectPos: 0,
			Loop: 0,
			Alert: 0,
			Error: 0,
		};

		logs.forEach((l) => {
			logCounts[l.type]++;
		});

		console.table(logCounts);
	}
	private configureDatabase() {
		this.db
			.query(
				`
                    CREATE TABLE IF NOT EXISTS ${this.tableName} (
                        eventData TEXT,
                        type TEXT,
                        date BIGINT,
                        symbolList TEXT,
                        userList TEXT,
                        strategies TEXT,
                        config TEXT,
						isLoading BOOLEAN
                    )
                `
			)
			.run();
	}
	async deleteAll(): Promise<void> {
		this.db.query(`DELETE FROM ${this.tableName}`).run();
		console.log(`All rows deleted from ${this.tableName}`);
	}
}
