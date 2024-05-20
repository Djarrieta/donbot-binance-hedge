import fs from "fs";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync("./data/temp")) fs.mkdirSync("./data/temp");

const sqlite = new Database("./data/BOT.db");
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });
