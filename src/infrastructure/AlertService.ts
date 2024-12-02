import { Database } from "bun:sqlite";
import type { IAlert } from "../domain/IAlert";
import type { Alert } from "../domain/Alert";
export class AlertService implements IAlert {
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

	async getAlerts(props: { start: number; end: number }) {
		const query = `
			SELECT *
			FROM ${this.tableName}
			WHERE start >= ${props.start} AND start <= ${props.end}
			ORDER BY start ASC
		`;
		const rawResults = this.db.query(query).all() as any[];
		const results: Alert[] = rawResults.map((r) => ({
			...r,
			profitStick: JSON.parse(r.profitStick),
		}));
		return results;
	}
	async saveAlerts(alerts: Alert[]): Promise<void> {
		if (alerts.length === 0) return;

		const batchSize = 500;
		for (let i = 0; i < alerts.length; i += batchSize) {
			const batch = alerts.slice(i, i + batchSize);
			const query = `
				INSERT INTO ${this.tableName}
				(start, stgName, positionSide, pair, profitStick, sl, tp)
				VALUES ${batch.map(() => "(?,?,?,?,?,?,?)").join(",")}
			`;

			const params: (string | number)[] = [];
			batch.forEach((a) => {
				params.push(
					a.start,
					a.stgName,
					a.positionSide as string,
					a.pair,
					a.sl || 0,
					a.tp || 0,
					JSON.stringify(a.profitStick)
				);
			});

			try {
				this.db.query(query).run(...params);
			} catch (error) {
				console.error("Error saving alert data:", error);
			}
		}
	}

	async deleteAlerts(): Promise<void> {
		this.db.query(`DELETE FROM ${this.tableName}`).run();
		console.log(`All rows deleted from ${this.tableName}`);
	}

	private configureDatabase() {
		this.db
			.query(
				`
				CREATE TABLE IF NOT EXISTS ${this.tableName} (
					start BIGINT,
					stgName TEXT,
					positionSide TEXT,
					pair TEXT,
					sl REAL,
					tp REAL,
					profitStick TEXT
				)
			`
			)
			.run();
	}
}
