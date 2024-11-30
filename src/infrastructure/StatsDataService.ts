import { Database } from "bun:sqlite";
import type { IStatsData } from "../domain/IStatsData";
import type { PositionBT } from "../domain/Position";
import type { Stat } from "../domain/Stat";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";

export class StatsDataService implements IStatsData {
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
			.query(`SELECT * FROM ${this.tableName} ORDER BY accPnlAcc DESC`)
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
			positionsFwd.slice(-100).map((p) => ({
				...p,
				startTime: getDate(p.startTime).dateString,
				pnl: formatPercent(p.pnl),
			}))
		);
		console.log("Stats summary:");
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
