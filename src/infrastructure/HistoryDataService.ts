import { Database } from "bun:sqlite";
import type { CandleBt } from "../domain/Candle";
import { getDate } from "../utils/getDate";
import type { IHistoryData } from "../domain/IHistoryData";

export class HistoryDataService implements IHistoryData {
	private db: Database;
	private candlestickTableName: string;

	constructor({
		databaseName,
		tableName,
	}: {
		databaseName: string;
		tableName: string;
	}) {
		this.db = new Database(databaseName);
		this.candlestickTableName = tableName;
		this.configureDatabase();
	}

	saveCandlestick = (candlesticks: CandleBt[]) => {
		if (candlesticks.length === 0) return;

		const batchSize = 500; // Adjust this as needed
		for (let i = 0; i < candlesticks.length; i += batchSize) {
			const batch = candlesticks.slice(i, i + batchSize);
			const query = `
				INSERT INTO ${this.candlestickTableName}
				(pair, open, high, low, close, volume, openTime)
				VALUES ${batch.map(() => "(?,?,?,?,?,?,?)").join(",")}
			`;

			const params: (string | number)[] = [];
			batch.forEach((c) => {
				params.push(
					c.pair,
					c.open,
					c.high,
					c.low,
					c.close,
					c.volume,
					c.openTime
				);
			});

			try {
				this.db.query(query).run(...params);
			} catch (error) {
				console.error("Error saving candlestick data:", error);
			}
		}
	};

	getPairList = () => {
		const results = this.db
			.query(`SELECT DISTINCT pair FROM ${this.candlestickTableName}`)
			.all() as { pair: string }[];
		const pairList = results.map(
			(result: { pair: string }) => result.pair
		) as string[];

		return pairList;
	};

	getCandlestick = ({
		start,
		end,
		pair,
	}: {
		start: number;
		end: number;
		pair?: string;
	}): CandleBt[] => {
		const query = `SELECT * FROM ${
			this.candlestickTableName
		} WHERE openTime >= ${start} AND openTime <= ${end} ${
			pair ? `AND pair = '${pair}'` : ""
		} ORDER BY openTime ASC`;
		const results = this.db.query(query).all() as CandleBt[];
		return results;
	};

	showSavedCandlestick = () => {
		const result = this.db
			.query(
				`SELECT pair, COUNT(*) AS count, MIN(openTime) AS startTime, MAX(openTime) AS endTime FROM ${this.candlestickTableName} GROUP BY pair`
			)
			.all() as {
			pair: string;
			count: number;
			startTime: number;
			endTime: number;
		}[];
		const pairsCount = result.length;
		console.log(
			`
			Saved candlestick for ${pairsCount} pairs. 
			From ${getDate(result[0].startTime).dateString} 
			To ${getDate(result[0].endTime).dateString}
			resulted in ${result[0].count}  candles`
		);
	};

	deleteRows() {
		this.db.query(`DELETE FROM ${this.candlestickTableName}`).run();
		console.log(`All rows deleted from ${this.candlestickTableName}`);
	}
	private configureDatabase() {
		this.db
			.query(
				`
				CREATE TABLE IF NOT EXISTS ${this.candlestickTableName} (
					pair TEXT,
					open REAL,
					high REAL,
					low REAL,
					close REAL,
					volume REAL,
					openTime BIGINT
				)
			`
			)
			.run();
	}
}
