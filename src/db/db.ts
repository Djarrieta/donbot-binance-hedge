import { Database } from "bun:sqlite";

const db = new Database("DB.db");
db.run("PRAGMA busy_timeout = 5000");
db.run("PRAGMA journal_mode = WAL");

export const deleteTableService = (
	tableName: "symbolsBT" | "statsAccBT" | "statsSnapBT"
) => {
	db.query("DELETE FROM " + tableName).run();
};

//SymbolsBT
export type SymbolsBT = {
	pair: string;
	candlestickBT: string;
};

export const createTableSymbolsBTService = () => {
	db.query("CREATE TABLE IF NOT EXISTS symbolsBT (pair, candlestickBT)").run();
};

export const getSymbolsBTService = () => {
	const results = db.query("SELECT * FROM symbolsBT").all() as SymbolsBT[];

	return results;
};

export const insertSymbolBTService = (props: SymbolsBT) => {
	const columns = Object.keys(props).join(", ");
	const placeholders = Object.keys(props)
		.map(() => "?")
		.join(", ");
	const values = Object.values(props);

	const query = `INSERT INTO symbolsBT (${columns}) VALUES (${placeholders})`;

	db.query(query).run(...values);
};

//StatsAccBT

export type StatsAccBT = {
	maxTradeLength: number;
	sl: number;
	tp: number;
	tradesQty: number;
	maxAccPnl: number;
	minAccPnl: number;
	accPnl: number;
	drawdown: number;
	drawdownMonteCarlo: number;
	badRunMonteCarlo: number;
	winRate: number;
	avPnl: number;
	avTradeLength: number;
	closedPositions: string;
};

export const createTableStatsAccBTService = () => {
	db.query(
		"CREATE TABLE IF NOT EXISTS statsAccBT (maxTradeLength, sl, tp, tradesQty, maxAccPnl, minAccPnl, accPnl, drawdown, drawdownMonteCarlo, badRunMonteCarlo, winRate, avPnl, avTradeLength, closedPositions)"
	).run();
};

export const insertAccStatsBTService = (props: StatsAccBT) => {
	const columns = Object.keys(props).join(", ");
	const placeholders = Object.keys(props)
		.map(() => "?")
		.join(", ");
	const values = Object.values(props);

	const query = `INSERT INTO statsAccBT (${columns}) VALUES (${placeholders})`;

	db.query(query).run(...values);
};

export const getAccStatsBTService = () => {
	const results = db.query("SELECT * FROM statsAccBT").all() as StatsAccBT[];

	return results;
};

//StatsSnapBT

export type StatsSnapBT = {
	maxTradeLength: number;
	sl: number;
	tp: number;
	tradesQty: number;
	accPnl: number;
	winRate: number;
	avPnl: number;
	avTradeLength: number;
	winningPairs: string;
	closedPositions: string;
};

export const createTableStatsSnapBTService = () => {
	db.query(
		"CREATE TABLE IF NOT EXISTS statsSnapBT (maxTradeLength, sl, tp, tradesQty, accPnl, winRate, avPnl, avTradeLength, winningPairs, closedPositions)"
	).run();
};
export const insertSnapStatsBTService = (props: StatsSnapBT) => {
	const columns = Object.keys(props).join(", ");
	const placeholders = Object.keys(props)
		.map(() => "?")
		.join(", ");
	const values = Object.values(props);

	const query = `INSERT INTO statsSnapBT (${columns}) VALUES (${placeholders})`;

	db.query(query).run(...values);
};

export const getSnapStatsBTService = () => {
	const results = db.query("SELECT * FROM statsSnapBT").all() as StatsSnapBT[];

	return results;
};

createTableSymbolsBTService();
createTableStatsSnapBTService();
createTableStatsAccBTService();

export default db;
