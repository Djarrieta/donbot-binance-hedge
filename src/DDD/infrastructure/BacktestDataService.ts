import { Database } from "bun:sqlite";
import { getDate } from "../../utils/getDate";
import type { Candle } from "../domain/Candle";
import type { Stat } from "../domain/Stat";
import { formatPercent } from "../../utils/formatPercent";

export class BacktestDataService {
	private db: Database;
	private candlestickTableName: string;
	private statsTableName: string;

	constructor({
		databaseName,
		tableName,
		statsTableName,
	}: {
		databaseName: string;
		tableName: string;
		statsTableName: string;
	}) {
		this.db = new Database(databaseName);
		this.candlestickTableName = tableName;
		this.statsTableName = statsTableName;
		this.configureDatabase();
	}

	saveCandlestick = (candlesticks: Candle[]) => {
		if (candlesticks.length === 0) return;
		const query = `INSERT INTO ${
			this.candlestickTableName
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
	}: {
		start: number;
		end: number;
	}): Candle[] => {
		const query = `SELECT * FROM ${this.candlestickTableName} WHERE openTime >= ${start} AND openTime <= ${end} ORDER BY openTime ASC`;
		const results = this.db.query(query).all() as Candle[];
		return results;
	};

	deleteCandlestickRows() {
		this.db.query(`DELETE FROM ${this.candlestickTableName}`).run();
		console.log(`All rows deleted from ${this.candlestickTableName}`);
	}

	showSavedCandlestick = () => {
		const items = 5;
		const results = this.db
			.query(
				`SELECT pair, COUNT(*) AS count, MIN(openTime) AS startTime, MAX(openTime) AS endTime FROM ${this.candlestickTableName} GROUP BY pair`
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
				this.candlestickTableName
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

	saveStats(stats: Stat) {
		const query = `INSERT INTO ${this.statsTableName} (
			sl,
			tp,
			maxTradeLength,
			positions,
			winningPairs,
			positionsWP,
			tradesQtyWP,
			winRateWP,
			avPnlWP,
			tradesQtyAcc,
			winRateAcc,
			avPnlAcc,
			positionsAcc
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		const values = [
			stats.sl,
			stats.tp,
			stats.maxTradeLength,
			JSON.stringify(stats.positions),
			JSON.stringify(stats.winningPairs),
			JSON.stringify(stats.positionsWP),
			stats.tradesQtyWP,
			stats.winRateWP,
			stats.avPnlWP,
			stats.tradesQtyAcc,
			stats.winRateAcc,
			stats.avPnlAcc,
			JSON.stringify(stats.positionsAcc),
		];
		this.db.query(query).run(...values);
		console.log("Stats saved successfully.");
	}

	showSavedStats() {
		const results = this.db
			.query(
				`SELECT * FROM ${this.statsTableName} ORDER BY maxTradeLength DESC`
			)
			.all() as Stat[];

		console.table(
			results.map((r) => ({
				...r,
				sl: formatPercent(r.sl),
				tp: formatPercent(r.tp),
				avPnlWP: formatPercent(r.avPnlWP),
				avPnlAcc: formatPercent(r.avPnlAcc),
				winRateWP: formatPercent(r.winRateWP),
				winRateAcc: formatPercent(r.winRateAcc),
				positions: r.positions.length,
				positionsWP: r.positionsWP.length,
				positionsAcc: r.positionsAcc.length,
				winningPairs: r.winningPairs.length,
			}))
		);
	}

	deleteStatsRows() {
		this.db.query(`DELETE FROM ${this.statsTableName}`).run();
		console.log(`All rows deleted from ${this.statsTableName}`);
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

		this.db
			.query(
				`
				CREATE TABLE IF NOT EXISTS ${this.statsTableName} (
					sl REAL,
					tp REAL,
					maxTradeLength INTEGER,

					tradesQtyWP INTEGER,
					winRateWP REAL,
					avPnlWP REAL,
					
					tradesQtyAcc INTEGER,
					winRateAcc REAL,
					avPnlAcc REAL,
					
					winningPairs TEXT,
					positions TEXT,
					positionsWP TEXT,
					positionsAcc TEXT
				)
			`
			)
			.run();
	}
}
