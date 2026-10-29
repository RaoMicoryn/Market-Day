import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const directory = path.dirname(fileURLToPath(import.meta.url));

try {
  const schema = await readFile(path.join(directory, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("Skema Neon berhasil disiapkan.");
} finally {
  await pool.end();
}
