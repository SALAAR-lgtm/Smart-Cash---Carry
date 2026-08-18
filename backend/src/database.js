import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const database = new Pool({
  connectionString: config.databaseUrl,
});

export async function verifyDatabaseConnection() {
  await database.query("SELECT 1");
}

