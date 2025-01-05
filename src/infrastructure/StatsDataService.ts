import { Database } from "bun:sqlite";
import type { IStatsData } from "../domain/IStatsData";
import type { PositionBT } from "../domain/Position";
import type { Stat, WinningPair } from "../domain/Stat";
import { formatPercent } from "../utils/formatPercent";
import { Link } from "../server/components/link";

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
			tpSlRatio,
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
			badRunMC,
			avPnlPerDay,
			avPosPerDay
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		const values = [
			stats.sl,
			stats.tpSlRatio,
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
			stats.avPnlPerDay,
			stats.avPosPerDay,
		];

		this.db.query(query).run(...values);
	}

	getStats() {
		const unformattedResults = this.db
			.query(`SELECT * FROM ${this.tableName} ORDER BY accPnlAcc DESC`)
			.all() as any[];

		const stats: Stat[] = unformattedResults.map((r) => ({
			sl: Number(r.sl),
			tpSlRatio: Number(r.tpSlRatio),
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
			avPnlPerDay: Number(r.avPnlPerDay || 0),
			avPosPerDay: Number(r.avPosPerDay || 0),
		}));

		return stats;
	}

	getWinningPairs({
		sl,
		tpSlRatio,
		maxTradeLength,
	}: {
		sl: number;
		tpSlRatio: number;
		maxTradeLength: number;
	}) {
		const unformattedResults = this.db
			.query(
				`SELECT winningPairs 
				FROM ${this.tableName} 
				WHERE sl = ${sl}  
				AND tpSlRatio = ${tpSlRatio}  
				AND maxTradeLength = ${maxTradeLength} 
				AND winningPairs IS NOT NULL
				LIMIT 1`
			)
			.get() as any;

		const winningPairs: WinningPair[] = JSON.parse(
			unformattedResults.winningPairs
		);
		return winningPairs;
	}

	getPositions({
		sl,
		tpSlRatio,
		maxTradeLength,
		column,
	}: {
		sl: number;
		tpSlRatio: number;
		maxTradeLength: number;
		column: "positionsWP" | "positionsAcc" | "positionsFwd" | "positions";
	}) {
		const unformattedPositions = this.db
			.query(
				`SELECT ${column} 
				FROM ${this.tableName} 
				WHERE sl = ${sl}  
				AND tpSlRatio = ${tpSlRatio}  
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
		const statsWithHeaders = [
			{
				SL: "sl tp/sl MaxLen",
				QTY: "ps  wp      acc      fwd",
				WINRATE: "wp      acc      fwd",
				AVPNL: "wp      acc      fwd",
				ACCPNL: "wp      acc      fwd",
				"DD badRun": "",
				PerDay: "pnl     Qty",
				pairs: "",
			},
			...stats.map((r) => ({
				SL: `${formatPercent(r.sl)} ${r.tpSlRatio} ${r.maxTradeLength}`,

				QTY: `${r.positions?.length || 0} ${r.positionsWP?.length || 0} ${
					r.positionsAcc?.length || 0
				} ${r.positionsFwd?.length || 0}`,

				WINRATE: `${formatPercent(r.winRateWP)} ${formatPercent(
					r.winRateAcc
				)} ${formatPercent(r.winRateFwd)}`,

				AVPNL: `${formatPercent(r.avPnlWP)} ${formatPercent(
					r.avPnlAcc
				)} ${formatPercent(r.avPnlFwd)}`,

				ACCPNL: `${formatPercent(r.accPnlWP)} ${formatPercent(
					r.accPnlAcc
				)} ${formatPercent(r.accPnlFwd)}`,

				"DD badRun": `${formatPercent(r.drawdownMC)} ${r.badRunMC}`,

				PerDay: `${formatPercent(r.avPnlPerDay)} ${r.avPosPerDay.toFixed(2)}`,

				pairs: r.winningPairs.length,
			})),
		];

		console.log("Stats summary:");
		console.table(statsWithHeaders);
		console.table(
			stats.map((r) => {
				return {
					params: `${formatPercent(r.sl)} ${r.tpSlRatio} ${r.maxTradeLength}`,
					Url: Link({
						sl: r.sl,
						tpSlRatio: r.tpSlRatio,
						maxTradeLength: r.maxTradeLength,
						timeFrame: "Backtest",
						pair: "Winning",
					}),
				};
			})
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
					tpSlRatio REAL,
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
					badRunMC REAL,
					avPnlPerDay REAL,
					avPosPerDay REAL
				)
			`
			)
			.run();
	}
}
