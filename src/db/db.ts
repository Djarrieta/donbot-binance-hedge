import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database("../data/BOT.db");
sqlite.run("PRAGMA busy_timeout = 5000");
sqlite.run("PRAGMA journal_mode = WAL");
export const db = drizzle(sqlite);
