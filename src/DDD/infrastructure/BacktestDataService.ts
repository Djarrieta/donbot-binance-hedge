import { Database } from "bun:sqlite";
import { getDate } from "../../utils/getDate";
import type { Candle } from "../domain/Candle";

export class BacktestDataService {
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

	saveCandlestick = (candlesticks: Candle[]) => {
		if (candlesticks.length === 0) return;
		const query = `INSERT INTO ${
			this.tableName
		} (pair, open, high, low, close, volume, openTime) VALUES ${candlesticks
			.map(() => "(?, ?, ?, ?, ?, ?, ?)")
			.join(", ")}`;

		const params = candlesticks.map((c) => [
			c.pair,
			c.open,
			c.high,
			c.low,
			c.close,
			c.volume,
			c.openTime,
		]);

		this.db.query(query).run(...params.flat());
	};

	getPairList = () => {
		const results = this.db
			.query(`SELECT DISTINCT pair FROM ${this.tableName}`)
			.all() as { pair: string }[];
		const pairList = results.map(
			(result: { pair: string }) => result.pair
		) as string[];

		return pairList;
	};

	getCandlestick = ({
		start,
		end,
	}: {
		start: number;
		end: number;
	}): Candle[] => {
		const query = `SELECT * FROM ${this.tableName} WHERE openTime >= ${start} AND openTime <= ${end} ORDER BY openTime ASC`;
		const results = this.db.query(query).all() as Candle[];
		return results;
	};

	deleteRows() {
		this.db.query(`DELETE FROM ${this.tableName}`).run();
		console.log("All rows deleted from symbolsBT");
	}

	showSavedInformation = () => {
		const items = 5;
		const results = this.db
			.query(
				`SELECT pair, COUNT(*) AS count, MIN(openTime) AS startTime, MAX(openTime) AS endTime FROM ${this.tableName} GROUP BY pair`
			)
			.all() as {
			pair: string;
			count: number;
			startTime: number;
			endTime: number;
		}[];

		results.sort((a, b) => a.count - b.count);
		console.log(
			`Pairs in ${
				this.tableName
			} table with number of candles and time range:\n${results
				.slice(0, items)
				.map(
					({ pair, count, startTime, endTime }) =>
						`${pair} - ${count} candles from ${
							getDate(startTime).dateString
						} to ${getDate(endTime).dateString}`
				)
				.join(",\n")}${
				results.length > items
					? `,\n ...and ${results.length - items} others`
					: ""
			}`
		);
	};

	private configureDatabase() {
		this.db
			.query(
				`CREATE TABLE IF NOT EXISTS ${this.tableName} (pair TEXT, open REAL, high REAL, low REAL, close REAL, volume REAL, openTime BIGINT)`
			)
			.run();
	}
}
