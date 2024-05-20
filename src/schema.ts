import type { InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text, numeric } from "drizzle-orm/sqlite-core";

export const candlesticks = sqliteTable("candlesticks", {
	pair: text("pair")
		.references(() => symbols.pair)
		.notNull(),
	open: integer("open").notNull(),
	high: integer("high").notNull(),
	low: integer("low").notNull(),
	close: integer("close").notNull(),
	volume: integer("volume").notNull(),
	openTime: integer("openTime", { mode: "timestamp" }).notNull(),
});

export const symbols = sqliteTable("symbols", {
	pair: text("pair").notNull(),
	candlestick: text("candlestick", { mode: "json" }),
});
export type Symbol = InferSelectModel<typeof symbols>;

export type Candle = InferSelectModel<typeof candlesticks>;

export enum Interval {
	"1m" = 1000 * 60,
	"3m" = 1000 * 60 * 3,
	"5m" = 1000 * 60 * 5,
	"15m" = 1000 * 60 * 15,
	"30m" = 1000 * 60 * 30,
	"1h" = 1000 * 60 * 60,
	"2h" = 1000 * 60 * 60 * 2,
	"4h" = 1000 * 60 * 60 * 4,
	"6h" = 1000 * 60 * 60 * 6,
	"8h" = 1000 * 60 * 60 * 8,
	"12h" = 1000 * 60 * 60 * 12,
	"1d" = 1000 * 60 * 60 * 24,
	"3d" = 1000 * 60 * 60 * 24 * 3,
	"1w" = 1000 * 60 * 60 * 24 * 7,
	"1M" = 1000 * 60 * 60 * 24 * 30,
}
export enum CronInterval {
	"1m" = "*/1 * * * *",
	"3m" = "*/3 * * * *",
	"5m" = "*/5 * * * *",
	"15m" = "*/15 * * * *",
	"30m" = "*/30 * * * *",
	"1h" = "1 */1 * * *",
	"2h" = "1 */2 * * *",
	"4h" = "1 */4 * * *",
	"8h" = "1 */8 * * *",
}
