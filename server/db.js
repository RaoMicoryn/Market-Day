import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum diatur. Salin .env.example menjadi .env dan isi connection string Neon.");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  // Serverless (Vercel) harus hemat koneksi: satu koneksi per instance.
  max: Number(process.env.PG_POOL_MAX || (process.env.VERCEL ? 1 : 10)),
  idleTimeoutMillis: process.env.VERCEL ? 10_000 : 30_000,
});
