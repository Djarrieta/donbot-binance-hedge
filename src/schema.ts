import type { InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const symbolsBT = sqliteTable("symbols", {
	pair: text("pair").notNull(),
	candlestickBT: text("candlestick", { mode: "json" }),
});
export type SymbolBT = InferSelectModel<typeof symbolsBT>;

export const statsAccBT = sqliteTable("statsAccBT", {
	maxTradeLength: integer("maxTradeLength"),
	sl: integer("sl"),
	tp: integer("tp"),
	tradesQty: integer("tradesQty"),
	maxAccPnl: integer("maxAccPnl"),
	minAccPnl: integer("minAccPnl"),
	accPnl: integer("accPnl"),
	maxDrawdown: integer("maxDrawdown"),
	winRate: integer("winRate"),
	avPnl: integer("avPnl"),
	avTradeLength: integer("avTradeLength"),
});
export type StatsAccBT = InferSelectModel<typeof statsAccBT>;

export const statsSnapBT = sqliteTable("statsSnapBT", {
	maxTradeLength: integer("maxTradeLength"),
	sl: integer("sl"),
	tp: integer("tp"),
	tradesQty: integer("tradesQty"),
	accPnl: integer("accPnl"),
	winRate: integer("winRate"),
	avPnl: integer("avPnl"),
	avTradeLength: integer("avTradeLength"),
	winningPairs: text("winningPairs", { mode: "json" }),
});
export type StatsSnapBT = InferSelectModel<typeof statsSnapBT>;
