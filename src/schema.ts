import type { InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const symbolsBT = sqliteTable("symbols", {
	pair: text("pair").notNull(),
	candlestickBT: text("candlestick", { mode: "json" }),
});
export type SymbolBT = InferSelectModel<typeof symbolsBT>;

export const statsBT = sqliteTable("statsBT", {
	maxTradeLength: integer("maxTradeLength"),
	sl: integer("sl"),
	tp: integer("tp"),
	totalPositions: integer("totalPositions"),
	maxAccPnl: integer("maxAccPnl"),
	minAccPnl: integer("minAccPnl"),
	accPnl: integer("accPnl"),
	maxDrawdown: integer("maxDrawdown"),
	winRate: integer("winRate"),
});
export type StatsBT = InferSelectModel<typeof statsBT>;
