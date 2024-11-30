import { Database } from "bun:sqlite";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import type { CandleBt as Candle } from "../domain/Candle";
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

		const batchSize = 500; // Adjust this as needed
		for (let i = 0; i < candlesticks.length; i += batchSize) {
			const batch = candlesticks.slice(i, i + batchSize);
			const query = `
				INSERT INTO ${this.candlestickTableName}
				(pair, open, high, low, close, volume, openTime)
				VALUES ${batch.map(() => "(?,?,?,?,?,?,?)").join(",")}
			`;

			// Prepare parameters for the current batch
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

			// Execute the query with correctly structured parameters
			try {
				this.db.query(query).run(...params); // Use spread operator to pass params
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
	}): Candle[] => {
		const query = `SELECT * FROM ${
			this.candlestickTableName
		} WHERE openTime >= ${start} AND openTime <= ${end} ${
			pair ? `AND pair = '${pair}'` : ""
		} ORDER BY openTime ASC`;
		const results = this.db.query(query).all() as Candle[];
		return results;
	};

	saveStats(stats: Stat) {
		const query = `INSERT INTO ${this.statsTableName} (
			sl,
			tp,
			maxTradeLength,
	
			winningPairs,
			positions,
			positionsWP,
			positionsAcc,
			positionsFwd,
	
			winRateWP,
			winRateAcc,
			winRateFwd,
			
			avPnlWP,
			avPnlAcc,
			avPnlFwd,
	
			accPnlWP,
			accPnlAcc,
			accPnlFwd,
	
			drawdownMC,
			badRunMC
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		const values = [
			stats.sl,
			stats.tp,
			stats.maxTradeLength,

			JSON.stringify(stats.winningPairs),
			JSON.stringify(stats.positions),
			JSON.stringify(stats.positionsWP),
			JSON.stringify(stats.positionsAcc),
			JSON.stringify(stats.positionsFwd),

			stats.winRateWP,
			stats.winRateAcc,
			stats.winRateFwd,

			stats.avPnlWP,
			stats.avPnlAcc,
			stats.avPnlFwd,

			stats.accPnlWP,
			stats.accPnlAcc,
			stats.accPnlFwd,

			stats.drawdownMC,
			stats.badRunMC,
		];

		this.db.query(query).run(...values);
	}

	getSavedStats() {
		const unformattedResults = this.db
			.query(`SELECT * FROM ${this.statsTableName} ORDER BY avPnlFwd DESC`)
			.all() as any[];

		const stats: Stat[] = unformattedResults.map((r) => ({
			sl: Number(r.sl),
			tp: Number(r.tp),
			maxTradeLength: Number(r.maxTradeLength),

			winningPairs: JSON.parse(r.winningPairs),
			positions: JSON.parse(r.positions),
			positionsAcc: JSON.parse(r.positionsAcc),
			positionsFwd: JSON.parse(r.positionsFwd),
			positionsWP: JSON.parse(r.positionsWP),

			winRateWP: Number(r.winRateWP),
			winRateAcc: Number(r.winRateAcc),
			winRateFwd: Number(r.winRateFwd),

			avPnlWP: Number(r.avPnlWP),
			avPnlAcc: Number(r.avPnlAcc),
			avPnlFwd: Number(r.avPnlFwd),

			accPnlWP: Number(r.accPnlWP || 0),
			accPnlAcc: Number(r.accPnlAcc || 0),
			accPnlFwd: Number(r.accPnlFwd || 0),

			drawdownMC: Number(r.drawdownMC || 0),
			badRunMC: Number(r.badRunMC || 0),
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
		column: "positionsWP" | "positionsAcc" | "positionsFwd" | "positions";
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

		const positions: PositionBT[] =
			(unformattedPositions && JSON.parse(unformattedPositions[column])) || [];

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
			`Stats for the best combination sl=${formatPercent(
				sl
			)}, tp=${formatPercent(tp)}, maxTradeLength=${maxTradeLength}`
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

		const positionsFwd = this.getSavedStatsPositions({
			sl,
			tp,
			maxTradeLength,
			column: "positionsFwd",
		});
		console.log(
			`Showing last possible Positions in forward test: ${positionsFwd.length}`
		);
		console.table(
			positionsFwd.map((p) => ({
				...p,
				startTime: getDate(p.startTime).dateString,
				pnl: formatPercent(p.pnl),
			}))
		);
		console.log("WinningParis Accumulation ForwardTest");
		console.table(
			stats.map((r) => ({
				"sl tp maxLen": `${formatPercent(r.sl)} ${formatPercent(r.tp)} ${
					r.maxTradeLength
				}`,

				"QTY ps wp acc fwd": `${r.positions?.length || 0} ${
					r.positionsWP?.length || 0
				} ${r.positionsAcc?.length || 0} ${r.positionsFwd?.length || 0}`,

				"WINRATE wp acc fwd": `${formatPercent(r.winRateWP)} ${formatPercent(
					r.winRateAcc
				)} ${formatPercent(r.winRateFwd)}`,

				"AVPNL wp acc fwd": `${formatPercent(r.avPnlWP)} ${formatPercent(
					r.avPnlAcc
				)} ${formatPercent(r.avPnlFwd)}`,

				"ACCPNL wp acc fwd": `${formatPercent(r.accPnlWP)} ${formatPercent(
					r.accPnlAcc
				)} ${formatPercent(r.accPnlFwd)}`,

				"DD badRun": `${formatPercent(r.drawdownMC)} ${r.badRunMC}`,

				pairs: r.winningPairs.length,
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

					winningPairs TEXT,
					positions TEXT,
					positionsWP TEXT,
					positionsAcc TEXT,
					positionsFwd TEXT,
					
					winRateWP REAL,
					winRateAcc REAL,
					winRateFwd REAL,
					
					avPnlWP REAL,
					avPnlAcc REAL,
					avPnlFwd REAL,
					
					accPnlWP REAL,
					accPnlAcc REAL,
					accPnlFwd REAL,

					drawdownMC REAL,
					badRunMC REAL
				)
			`
			)
			.run();
	}
}

export type IStatsDataService = {
	save: (stats: Stat) => void;
	getStats: () => Stat[];
	getWinningPairs: (props: {
		sl: number;
		tp: number;
		maxTradeLength: number;
	}) => string[];
	getPositions: (props: {
		sl: number;
		tp: number;
		maxTradeLength: number;
		column: "positionsWP" | "positionsAcc" | "positionsFwd" | "positions";
	}) => PositionBT[];
	showStats: () => void;
	deleteRows: () => void;
};

export class StatsDataService implements IStatsDataService {
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

	save(stats: Stat) {
		const query = `INSERT INTO ${this.tableName} (
			sl,
			tp,
			maxTradeLength,
	
			winningPairs,
			positions,
			positionsWP,
			positionsAcc,
			positionsFwd,
	
			winRateWP,
			winRateAcc,
			winRateFwd,
			
			avPnlWP,
			avPnlAcc,
			avPnlFwd,
	
			accPnlWP,
			accPnlAcc,
			accPnlFwd,
	
			drawdownMC,
			badRunMC
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		const values = [
			stats.sl,
			stats.tp,
			stats.maxTradeLength,

			JSON.stringify(stats.winningPairs),
			JSON.stringify(stats.positions),
			JSON.stringify(stats.positionsWP),
			JSON.stringify(stats.positionsAcc),
			JSON.stringify(stats.positionsFwd),

			stats.winRateWP,
			stats.winRateAcc,
			stats.winRateFwd,

			stats.avPnlWP,
			stats.avPnlAcc,
			stats.avPnlFwd,

			stats.accPnlWP,
			stats.accPnlAcc,
			stats.accPnlFwd,

			stats.drawdownMC,
			stats.badRunMC,
		];

		this.db.query(query).run(...values);
	}

	getStats() {
		const unformattedResults = this.db
			.query(`SELECT * FROM ${this.tableName} ORDER BY avPnlFwd DESC`)
			.all() as any[];

		const stats: Stat[] = unformattedResults.map((r) => ({
			sl: Number(r.sl),
			tp: Number(r.tp),
			maxTradeLength: Number(r.maxTradeLength),

			winningPairs: JSON.parse(r.winningPairs),
			positions: JSON.parse(r.positions),
			positionsAcc: JSON.parse(r.positionsAcc),
			positionsFwd: JSON.parse(r.positionsFwd),
			positionsWP: JSON.parse(r.positionsWP),

			winRateWP: Number(r.winRateWP),
			winRateAcc: Number(r.winRateAcc),
			winRateFwd: Number(r.winRateFwd),

			avPnlWP: Number(r.avPnlWP),
			avPnlAcc: Number(r.avPnlAcc),
			avPnlFwd: Number(r.avPnlFwd),

			accPnlWP: Number(r.accPnlWP || 0),
			accPnlAcc: Number(r.accPnlAcc || 0),
			accPnlFwd: Number(r.accPnlFwd || 0),

			drawdownMC: Number(r.drawdownMC || 0),
			badRunMC: Number(r.badRunMC || 0),
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
				FROM ${this.tableName} 
				WHERE sl = ${sl}  
				AND tp = ${tp}  
				AND maxTradeLength = ${maxTradeLength} 
				AND winningPairs IS NOT NULL
				LIMIT 1`
			)
			.get() as any;
		return JSON.parse(unformattedResults.winningPairs);
	}

	getPositions({
		sl,
		tp,
		maxTradeLength,
		column,
	}: {
		sl: number;
		tp: number;
		maxTradeLength: number;
		column: "positionsWP" | "positionsAcc" | "positionsFwd" | "positions";
	}) {
		const unformattedPositions = this.db
			.query(
				`SELECT ${column} 
				FROM ${this.tableName} 
				WHERE sl = ${sl}  
				AND tp = ${tp}  
				AND maxTradeLength = ${maxTradeLength} 
				AND ${column} IS NOT NULL
				LIMIT 1`
			)
			.get() as any;

		const positions: PositionBT[] =
			(unformattedPositions && JSON.parse(unformattedPositions[column])) || [];

		return positions;
	}

	showStats() {
		const stats = this.getStats();

		const { sl, tp, maxTradeLength } = stats[0];
		console.log("\n\n");
		console.log(
			"======================================================================================================="
		);
		console.log(
			`Stats for the best combination sl=${formatPercent(
				sl
			)}, tp=${formatPercent(tp)}, maxTradeLength=${maxTradeLength}`
		);
		console.log(
			"======================================================================================================="
		);
		console.log("\n\n");

		const positions = this.getPositions({
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

		const positionsWP = this.getPositions({
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

		const positionsAcc = this.getPositions({
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

		const positionsFwd = this.getPositions({
			sl,
			tp,
			maxTradeLength,
			column: "positionsFwd",
		});
		console.log(
			`Showing last possible Positions in forward test: ${positionsFwd.length}`
		);
		console.table(
			positionsFwd.map((p) => ({
				...p,
				startTime: getDate(p.startTime).dateString,
				pnl: formatPercent(p.pnl),
			}))
		);
		console.log("WinningParis Accumulation ForwardTest");
		console.table(
			stats.map((r) => ({
				"sl tp maxLen": `${formatPercent(r.sl)} ${formatPercent(r.tp)} ${
					r.maxTradeLength
				}`,

				"QTY ps wp acc fwd": `${r.positions?.length || 0} ${
					r.positionsWP?.length || 0
				} ${r.positionsAcc?.length || 0} ${r.positionsFwd?.length || 0}`,

				"WINRATE wp acc fwd": `${formatPercent(r.winRateWP)} ${formatPercent(
					r.winRateAcc
				)} ${formatPercent(r.winRateFwd)}`,

				"AVPNL wp acc fwd": `${formatPercent(r.avPnlWP)} ${formatPercent(
					r.avPnlAcc
				)} ${formatPercent(r.avPnlFwd)}`,

				"ACCPNL wp acc fwd": `${formatPercent(r.accPnlWP)} ${formatPercent(
					r.accPnlAcc
				)} ${formatPercent(r.accPnlFwd)}`,

				"DD badRun": `${formatPercent(r.drawdownMC)} ${r.badRunMC}`,

				pairs: r.winningPairs.length,
			}))
		);
	}

	deleteRows() {
		this.db.query(`DELETE FROM ${this.tableName}`).run();
		console.log(`All rows deleted from ${this.tableName}`);
	}

	private configureDatabase() {
		this.db
			.query(
				`
				CREATE TABLE IF NOT EXISTS ${this.tableName} (
					sl REAL,
					tp REAL,
					maxTradeLength INTEGER,

					winningPairs TEXT,
					positions TEXT,
					positionsWP TEXT,
					positionsAcc TEXT,
					positionsFwd TEXT,
					
					winRateWP REAL,
					winRateAcc REAL,
					winRateFwd REAL,
					
					avPnlWP REAL,
					avPnlAcc REAL,
					avPnlFwd REAL,
					
					accPnlWP REAL,
					accPnlAcc REAL,
					accPnlFwd REAL,

					drawdownMC REAL,
					badRunMC REAL
				)
			`
			)
			.run();
	}
}

export class HistoryDataService implements IHistoryDataService {
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

	saveCandlestick = (candlesticks: Candle[]) => {
		if (candlesticks.length === 0) return;

		const batchSize = 500; // Adjust this as needed
		for (let i = 0; i < candlesticks.length; i += batchSize) {
			const batch = candlesticks.slice(i, i + batchSize);
			const query = `
				INSERT INTO ${this.candlestickTableName}
				(pair, open, high, low, close, volume, openTime)
				VALUES ${batch.map(() => "(?,?,?,?,?,?,?)").join(",")}
			`;

			// Prepare parameters for the current batch
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

			// Execute the query with correctly structured parameters
			try {
				this.db.query(query).run(...params); // Use spread operator to pass params
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
	}): Candle[] => {
		const query = `SELECT * FROM ${
			this.candlestickTableName
		} WHERE openTime >= ${start} AND openTime <= ${end} ${
			pair ? `AND pair = '${pair}'` : ""
		} ORDER BY openTime ASC`;
		const results = this.db.query(query).all() as Candle[];
		return results;
	};

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

export type IHistoryDataService = {
	saveCandlestick: (candlesticks: Candle[]) => void;
	getPairList: () => string[];
	getCandlestick: ({
		start,
		end,
		pair,
	}: {
		start: number;
		end: number;
		pair?: string;
	}) => Candle[];
	showSavedCandlestick: () => void;
	deleteRows: () => void;
};
