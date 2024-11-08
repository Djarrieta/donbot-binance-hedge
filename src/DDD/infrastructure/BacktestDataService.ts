import { Database } from "bun:sqlite";
import { formatPercent } from "../../utils/formatPercent";
import { getDate } from "../../utils/getDate";
import type { Candle } from "../domain/Candle";
import type { PositionBT } from "../domain/Position";
import type { Stat } from "../domain/Stat";

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

	saveStats(stats: Stat) {
		const query = `INSERT INTO ${this.statsTableName} (
			sl,
			tp,
			maxTradeLength,
			positions,
			winningPairs,
			positionsWP,
			winRateWP,
			avPnlWP,
			winRateAcc,
			avPnlAcc,
			positionsAcc
		) VALUES (?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		const values = [
			stats.sl,
			stats.tp,
			stats.maxTradeLength,
			JSON.stringify(stats.positions),
			JSON.stringify(stats.winningPairs),
			JSON.stringify(stats.positionsWP),
			stats.winRateWP,
			stats.avPnlWP,
			stats.winRateAcc,
			stats.avPnlAcc,
			JSON.stringify(stats.positionsAcc),
		];
		this.db.query(query).run(...values);
		console.log("Stats saved successfully.");
	}

	getSavedStats() {
		const unformattedResults = this.db
			.query(`SELECT * FROM ${this.statsTableName} `)
			.all() as any[];

		const stats: Stat[] = unformattedResults.map((r) => ({
			sl: Number(r.sl),
			tp: Number(r.tp),
			maxTradeLength: Number(r.maxTradeLength),
			positions: JSON.parse(r.positions),
			winningPairs: JSON.parse(r.winningPairs),
			positionsWP: JSON.parse(r.positionsWP),
			winRateWP: Number(r.winRateWP),
			avPnlWP: Number(r.avPnlWP),
			winRateAcc: Number(r.winRateAcc),
			avPnlAcc: Number(r.avPnlAcc),
			positionsAcc: JSON.parse(r.positionsAcc),
		}));

		return stats;
	}

	getWinningPairs({
		sl,
		tp,
		maxTradeLength,
	}: {
		sl: number;
		tp: number;
		maxTradeLength: number;
	}) {
		const unformattedResults = this.db
			.query(
				`SELECT winningPairs 
				FROM ${this.statsTableName} 
				WHERE sl = ${sl}  
				AND tp = ${tp}  
				AND maxTradeLength = ${maxTradeLength} 
				AND winningPairs IS NOT NULL
				LIMIT 1`
			)
			.get() as any;
		return JSON.parse(unformattedResults.winningPairs);
	}

	getSavedStatsPositions({
		sl,
		tp,
		maxTradeLength,
		column,
	}: {
		sl: number;
		tp: number;
		maxTradeLength: number;
		column: "positionsWP" | "positionsAcc" | "positions";
	}) {
		const unformattedPositions = this.db
			.query(
				`SELECT ${column} 
				FROM ${this.statsTableName} 
				WHERE sl = ${sl}  
				AND tp = ${tp}  
				AND maxTradeLength = ${maxTradeLength} 
				AND ${column} IS NOT NULL
				LIMIT 1`
			)
			.get() as any;

		const positions: PositionBT[] = JSON.parse(unformattedPositions[column]);

		return positions;
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

	showSavedStats() {
		const stats = this.getSavedStats();

		const { sl, tp, maxTradeLength } = stats[0];
		console.log("\n\n");
		console.log(
			"======================================================================================================="
		);
		console.log(
			`Stats for sl=${formatPercent(sl)}, tp=${formatPercent(
				tp
			)}, maxTradeLength=${maxTradeLength}`
		);
		console.log(
			"======================================================================================================="
		);
		console.log("\n\n");

		const positions = this.getSavedStatsPositions({
			sl,
			tp,
			maxTradeLength,
			column: "positions",
		});
		console.log(`Showing last 100 possible Positions of ${positions.length}`);
		console.table(
			positions.slice(-100).map((p) => ({
				...p,
				startTime: getDate(p.startTime).dateString,
				pnl: formatPercent(p.pnl),
			}))
		);

		const winningPairs = this.getWinningPairs({
			sl,
			tp,
			maxTradeLength,
		});
		console.log(`Winning pairs : ${winningPairs.length}`);
		console.log(winningPairs);

		const positionsWP = this.getSavedStatsPositions({
			sl,
			tp,
			maxTradeLength,
			column: "positionsWP",
		});
		console.log(
			`Showing last 100 possible Positions for winning pairs: ${positionsWP.length}`
		);
		console.table(
			positionsWP.slice(-100).map((p) => ({
				...p,
				startTime: getDate(p.startTime).dateString,
				pnl: formatPercent(p.pnl),
			}))
		);

		const positionsAcc = this.getSavedStatsPositions({
			sl,
			tp,
			maxTradeLength,
			column: "positionsAcc",
		});
		console.log(
			`Showing last 100 possible Positions with accumulation for winning pairs: ${positionsAcc.length}`
		);
		console.table(
			positionsAcc.slice(-100).map((p) => ({
				...p,
				startTime: getDate(p.startTime).dateString,
				pnl: formatPercent(p.pnl),
			}))
		);

		console.table(
			stats.map((r) => ({
				sl: formatPercent(r.sl),
				tp: formatPercent(r.tp),
				maxLength: r.maxTradeLength,

				positions: r.positions.length,
				positionsWP: r.positionsWP.length,
				positionsAcc: r.positionsAcc.length,

				winRateWP: formatPercent(r.winRateWP),
				winRateAcc: formatPercent(r.winRateAcc),

				avPnlWP: formatPercent(r.avPnlWP),
				avPnlAcc: formatPercent(r.avPnlAcc),

				winningPairs: r.winningPairs.length,
			}))
		);
	}

	deleteStatsRows() {
		this.db.query(`DELETE FROM ${this.statsTableName}`).run();
		console.log(`All rows deleted from ${this.statsTableName}`);
	}

	deleteCandlestickRows() {
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

		this.db
			.query(
				`
				CREATE TABLE IF NOT EXISTS ${this.statsTableName} (
					sl REAL,
					tp REAL,
					maxTradeLength INTEGER,

					winRateWP REAL,
					avPnlWP REAL,
					
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
