import { accumulate } from ".";
import { db } from "../../db";
import { statsAccBT } from "../../schema";

await db.delete(statsAccBT);
const result = await accumulate();
await db.insert(statsAccBT).values(result);
