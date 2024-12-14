import { Database } from "bun:sqlite";
import type { GetLogsProps, ILog } from "../domain/ILog";
import type { Log } from "../domain/Log";
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
			(eventData, type, date, symbolList, userList, strategies, config)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`;

		const values = [
			JSON.stringify(log.eventData),
			log.type,
			log.date,
			JSON.stringify(log.tradeData.symbolList),
			JSON.stringify(log.tradeData.userList),
			JSON.stringify(log.tradeData.strategies),
			JSON.stringify(log.tradeData.config),
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
			},
		}));

		return results;
	}

	async showLogs() {
		const logs = await this.get({ start: 0, end: Date.now() });
		console.log(
			logs.map((l) => {
				return {
					type: l.type,
					date: getDate(l.date).dateString,
					eventData: l.eventData,
				};
			})
		);
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
                        config TEXT
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
