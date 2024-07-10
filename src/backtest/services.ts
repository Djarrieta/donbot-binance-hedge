import { Database } from "bun:sqlite";
import type { SymbolBT } from "./SymbolBT";
import type { StatAccBT } from "./StatAccBT";
import type { StatSnapBT } from "./StatSnapBT";

const db = new Database("DB.db");
db.run("PRAGMA busy_timeout = 5000");
db.run("PRAGMA journal_mode = WAL");

export const deleteTableService = (
	tableName: "symbolsBT" | "statsAccBT" | "statsSnapBT"
) => {
	db.query("DELETE FROM " + tableName).run();
};

//SymbolsBT

export const createTableSymbolsBTService = () => {
	db.query("CREATE TABLE IF NOT EXISTS symbolsBT (pair, candlestickBT)").run();
};

export const getSymbolsBTService = () => {
	const results = db.query("SELECT * FROM symbolsBT").all() as SymbolBT[];

	return results;
};

export const insertSymbolBTService = (props: SymbolBT) => {
	const columns = Object.keys(props).join(", ");
	const placeholders = Object.keys(props)
		.map(() => "?")
		.join(", ");
	const values = Object.values(props);

	const query = `INSERT INTO symbolsBT (${columns}) VALUES (${placeholders})`;

	db.query(query).run(...values);
};

//StatsAccBT

export const createTableStatsAccBTService = () => {
	db.query(
		"CREATE TABLE IF NOT EXISTS statsAccBT (maxTradeLength, sl, tp, tradesQty, maxAccPnl, minAccPnl, accPnl, drawdown, drawdownMonteCarlo, badRunMonteCarlo, winRate, avPnl, avTradeLength, closedPositions)"
	).run();
};

export const insertAccStatsBTService = (props: StatAccBT) => {
	const columns = Object.keys(props).join(", ");
	const placeholders = Object.keys(props)
		.map(() => "?")
		.join(", ");
	const values = Object.values(props);

	const query = `INSERT INTO statsAccBT (${columns}) VALUES (${placeholders})`;

	db.query(query).run(...values);
};

export const getAccStatsBTService = () => {
	const results = db.query("SELECT * FROM statsAccBT").all() as StatAccBT[];

	return results;
};

//StatsSnapBT

export const createTableStatsSnapBTService = () => {
	db.query(
		"CREATE TABLE IF NOT EXISTS statsSnapBT (maxTradeLength, sl, tp, tradesQty, accPnl, winRate, avPnl, avTradeLength, winningPairs, closedPositions)"
	).run();
};
export const insertSnapStatsBTService = (props: StatSnapBT) => {
	const columns = Object.keys(props).join(", ");
	const placeholders = Object.keys(props)
		.map(() => "?")
		.join(", ");
	const values = Object.values(props);

	const query = `INSERT INTO statsSnapBT (${columns}) VALUES (${placeholders})`;

	db.query(query).run(...values);
};

export const getSnapStatsBTService = () => {
	const results = db.query("SELECT * FROM statsSnapBT").all() as StatSnapBT[];

	return results;
};

createTableSymbolsBTService();
createTableStatsSnapBTService();
createTableStatsAccBTService();

export default db;
