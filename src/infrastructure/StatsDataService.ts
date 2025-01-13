import { Database } from "bun:sqlite";
import type { IStatsData } from "../domain/IStatsData";
import type { PositionBT } from "../domain/Position";
import type { Stat } from "../domain/Stat";
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
	
			positions,
	
			winRate,
			winRateAcc,
			winRateFwd,
			
			avPnl,
			avPnlAcc,
			avPnlFwd,
	
			accPnl,
			accPnlAcc,
			accPnlFwd,
	
			drawdown,
			drawdownMC,

			badRun,
			badRunMC,

			avPnlPerDay,
			avPosPerDay
		) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
		const values = [
			stats.sl,
			stats.tpSlRatio,
			stats.maxTradeLength,

			JSON.stringify(stats.positions),

			stats.winRate,
			stats.winRateAcc,
			stats.winRateFwd,

			stats.avPnl,
			stats.avPnlAcc,
			stats.avPnlFwd,

			stats.accPnl,
			stats.accPnlAcc,
			stats.accPnlFwd,

			stats.drawdown,
			stats.drawdownMC,

			stats.badRun,
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

			positions: JSON.parse(r.positions),

			winRate: Number(r.winRate),
			winRateAcc: Number(r.winRateAcc),
			winRateFwd: Number(r.winRateFwd),

			avPnl: Number(r.avPnl),
			avPnlAcc: Number(r.avPnlAcc),
			avPnlFwd: Number(r.avPnlFwd),

			accPnl: Number(r.accPnl || 0),
			accPnlAcc: Number(r.accPnlAcc || 0),
			accPnlFwd: Number(r.accPnlFwd || 0),

			drawdown: Number(r.drawdown || 0),
			drawdownMC: Number(r.drawdownMC || 0),

			badRun: Number(r.badRun || 0),
			badRunMC: Number(r.badRunMC || 0),

			avPnlPerDay: Number(r.avPnlPerDay || 0),
			avPosPerDay: Number(r.avPosPerDay || 0),
		}));

		return stats;
	}

	getPositions({
		sl,
		tpSlRatio,
		maxTradeLength,
	}: {
		sl: number;
		tpSlRatio: number;
		maxTradeLength: number;
	}) {
		const unformattedPositions = this.db
			.query(
				`SELECT positions 
				FROM ${this.tableName} 
				WHERE sl = ${sl}  
				AND tpSlRatio = ${tpSlRatio}  
				AND maxTradeLength = ${maxTradeLength} 
				LIMIT 1`
			)
			.get() as any;

		const positions: PositionBT[] =
			(unformattedPositions && JSON.parse(unformattedPositions.positions)) ||
			[];

		return positions;
	}

	showStats() {
		//TODO: add qty
		const stats = this.getStats();
		const statsWithHeaders = [
			{
				SL: "sl tp/sl MaxLen",
				WINRATE: "all     accWP      fwd",
				AVPNL: "all      accWP      fwd",
				ACCPNL: "all      accWP      fwd",
				Drawdown: "DD MC",
				BadRun: "BR MC",
				PerDay: "pnl     Qty",
			},
			...stats.map((r) => ({
				SL: `${formatPercent(r.sl)} ${r.tpSlRatio} ${r.maxTradeLength}`,
				WINRATE: `${formatPercent(r.winRate)} ${formatPercent(
					r.winRateAcc
				)} ${formatPercent(r.winRateFwd)}`,

				AVPNL: `${formatPercent(r.avPnl)} ${formatPercent(
					r.avPnlAcc
				)} ${formatPercent(r.avPnlFwd)}`,

				ACCPNL: `${formatPercent(r.accPnl)} ${formatPercent(
					r.accPnlAcc
				)} ${formatPercent(r.accPnlFwd)}`,

				Drawdown: `${formatPercent(r.drawdown)} ${formatPercent(r.drawdownMC)}`,
				BadRun: `${r.badRun} ${r.badRunMC}`,
				PerDay: `${formatPercent(r.avPnlPerDay)} ${r.avPosPerDay.toFixed(2)}`,
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

					positions TEXT,
					
					winRate REAL,
					winRateAcc REAL,
					winRateFwd REAL,
					
					avPnl REAL,
					avPnlAcc REAL,
					avPnlFwd REAL,
					
					accPnl REAL,
					accPnlAcc REAL,
					accPnlFwd REAL,

					drawdown REAL,
					drawdownMC REAL,
					
					badRun REAL,
					badRunMC REAL,
					
					avPnlPerDay REAL,
					avPosPerDay REAL
				)
			`
			)
			.run();
	}
}
