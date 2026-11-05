import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum diatur. Salin .env.example menjadi .env dan isi connection string Neon.");
}

// Ubah connection string menjadi opsi koneksi eksplisit.
//
// Alasan: `pg-connection-string` masih memakai `url.parse()` (deprecated) dan
// menerjemahkan `sslmode=require|prefer|verify-ca` sebagai alias yang memicu
// "SECURITY WARNING" di log Vercel. Dengan mengurai URL sendiri dan mengirim
// host/port/user/password/database + `ssl` secara langsung, kedua warning itu
// hilang tanpa mengubah perilaku koneksi (sertifikat tetap diverifikasi).
function buildPoolConfig(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { connectionString: rawUrl };
  }

  const mode = (url.searchParams.get("sslmode") || "").toLowerCase();
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const useSsl = mode ? mode !== "disable" && mode !== "allow" : !isLocal;

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")) || undefined,
    ssl: useSsl ? { rejectUnauthorized: true } : undefined,
  };
}

const config = buildPoolConfig(process.env.DATABASE_URL);

export const pool = new pg.Pool({
  ...config,
  // Serverless (Vercel) harus hemat koneksi: satu koneksi per instance.
  max: Number(process.env.PG_POOL_MAX || (process.env.VERCEL ? 1 : 10)),
  idleTimeoutMillis: process.env.VERCEL ? 10_000 : 30_000,
});
