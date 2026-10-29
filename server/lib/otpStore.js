// Penyimpanan kode OTP di PostgreSQL.
//
// Aturan keamanan:
// - kode tidak pernah disimpan dalam bentuk asli, hanya HMAC-SHA256;
// - masa berlaku 5 menit;
// - maksimal 5 percobaan verifikasi per kode;
// - jeda 60 detik antar pengiriman dan maksimal 5 pengiriman per jam per nomor;
// - kode lama otomatis tidak berlaku saat kode baru dibuat.

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { pool } from "../db.js";

export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_SENDS_PER_WINDOW = 5;
export const OTP_WINDOW_SECONDS = 60 * 60;

const TTL_MS = OTP_TTL_SECONDS * 1000;
const COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
const WINDOW_MS = OTP_WINDOW_SECONDS * 1000;

export class OtpError extends Error {
  constructor(message, { status = 400, reason = "OTP_ERROR", retryAfter } = {}) {
    super(message);
    this.name = "OtpError";
    this.status = status;
    this.reason = reason;
    this.retryAfter = retryAfter;
  }
}

const signingKey = () => String(process.env.OTP_SECRET || process.env.SESSION_SECRET || "");

function hashCode(phone, code) {
  const key = signingKey();
  if (!key) throw new Error("OTP_SECRET atau SESSION_SECRET belum diatur untuk meng-hash kode OTP.");
  return createHmac("sha256", key).update(`${phone}:${code}`).digest("hex");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ""), "utf8");
  const b = Buffer.from(String(right ?? ""), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const secondsUntil = (date, now) => Math.max(1, Math.ceil((new Date(date).getTime() - now.getTime()) / 1000));

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

const CREATE_TABLE_SQL = `
  create table if not exists otp_codes (
    phone text primary key,
    code_hash text not null,
    expires_at timestamptz not null,
    attempts smallint not null default 0 check (attempts >= 0),
    send_count smallint not null default 1 check (send_count >= 0),
    window_started_at timestamptz not null default now(),
    last_sent_at timestamptz not null default now(),
    created_at timestamptz not null default now()
  );
  create index if not exists otp_codes_expires_idx on otp_codes (expires_at);
`;

export function createOtpStore(db = pool, { clock = () => new Date() } = {}) {
  let tableReady;

  // Tabel dibuat otomatis agar API tetap jalan walau `npm run db:setup` belum dijalankan.
  function ensureTable() {
    if (!tableReady) {
      tableReady = db.query(CREATE_TABLE_SQL).catch((error) => {
        tableReady = undefined;
        throw error;
      });
    }
    return tableReady;
  }

  /** Buat kode baru untuk nomor tertentu. Mengembalikan kode asli (hanya untuk dikirim via WA). */
  async function issueOtp(phone) {
    await ensureTable();
    const now = clock();

    await db.query("delete from otp_codes where expires_at < now() - interval '1 day'");

    const existing = await db.query(
      `select last_sent_at as "lastSentAt", window_started_at as "windowStartedAt", send_count as "sendCount"
       from otp_codes where phone = $1`,
      [phone]
    );
    const row = existing.rows[0];

    if (row) {
      const sinceLast = now.getTime() - new Date(row.lastSentAt).getTime();
      if (sinceLast < COOLDOWN_MS) {
        throw new OtpError("Tunggu sebentar sebelum meminta kode OTP baru.", {
          status: 429,
          reason: "OTP_COOLDOWN",
          retryAfter: Math.ceil((COOLDOWN_MS - sinceLast) / 1000),
        });
      }
      const inWindow = now.getTime() - new Date(row.windowStartedAt).getTime() < WINDOW_MS;
      if (inWindow && Number(row.sendCount) >= OTP_MAX_SENDS_PER_WINDOW) {
        throw new OtpError("Terlalu banyak permintaan OTP untuk nomor ini. Coba lagi nanti.", {
          status: 429,
          reason: "OTP_RATE_LIMITED",
          retryAfter: secondsUntil(new Date(row.windowStartedAt).getTime() + WINDOW_MS, now),
        });
      }
    }

    const inWindow = row && now.getTime() - new Date(row.windowStartedAt).getTime() < WINDOW_MS;
    const windowStartedAt = inWindow ? new Date(row.windowStartedAt) : now;
    const sendCount = (inWindow ? Number(row.sendCount) : 0) + 1;

    const code = generateOtp();
    const codeHash = hashCode(phone, code);
    const expiresAt = new Date(now.getTime() + TTL_MS);

    await db.query(
      `insert into otp_codes (phone, code_hash, expires_at, attempts, send_count, window_started_at, last_sent_at)
       values ($1, $2, $3, 0, $4, $5, $6)
       on conflict (phone) do update set
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         attempts = 0,
         send_count = excluded.send_count,
         window_started_at = excluded.window_started_at,
         last_sent_at = excluded.last_sent_at`,
      [phone, codeHash, expiresAt, sendCount, windowStartedAt, now]
    );

    return { code, expiresAt, expiresIn: OTP_TTL_SECONDS };
  }

  /** Hapus kode yang gagal terkirim agar tidak bisa dipakai. */
  async function discardOtp(phone) {
    await ensureTable();
    await db.query("delete from otp_codes where phone = $1", [phone]);
  }

  /**
   * Cocokkan kode dari pengguna.
   * @returns {Promise<{ ok: boolean, reason?: string, message: string, remainingAttempts?: number }>}
   */
  async function verifyOtp(phone, code) {
    await ensureTable();

    const result = await db.query(
      `select code_hash as "codeHash", expires_at as "expiresAt", attempts
       from otp_codes where phone = $1`,
      [phone]
    );
    const row = result.rows[0];

    if (!row) {
      return {
        ok: false,
        reason: "OTP_NOT_FOUND",
        message: "Kode OTP tidak ditemukan atau sudah dipakai. Minta kode baru.",
      };
    }

    if (new Date(row.expiresAt).getTime() <= clock().getTime()) {
      await db.query("delete from otp_codes where phone = $1", [phone]);
      return {
        ok: false,
        reason: "OTP_EXPIRED",
        message: "Kode OTP sudah kedaluwarsa. Minta kode baru.",
      };
    }

    if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
      await db.query("delete from otp_codes where phone = $1", [phone]);
      return {
        ok: false,
        reason: "OTP_ATTEMPTS_EXCEEDED",
        message: "Terlalu banyak percobaan. Minta kode OTP baru.",
      };
    }

    if (!safeEqual(row.codeHash, hashCode(phone, code))) {
      const attempts = Number(row.attempts) + 1;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await db.query("delete from otp_codes where phone = $1", [phone]);
        return {
          ok: false,
          reason: "OTP_ATTEMPTS_EXCEEDED",
          message: "Terlalu banyak percobaan. Minta kode OTP baru.",
        };
      }
      await db.query("update otp_codes set attempts = $2 where phone = $1", [phone, attempts]);
      return {
        ok: false,
        reason: "OTP_INVALID",
        message: `Kode OTP salah. Sisa percobaan: ${OTP_MAX_ATTEMPTS - attempts}.`,
        remainingAttempts: OTP_MAX_ATTEMPTS - attempts,
      };
    }

    // Kode sekali pakai: hapus hanya bila hash masih sama (aman dari balapan).
    const consumed = await db.query("delete from otp_codes where phone = $1 and code_hash = $2", [phone, row.codeHash]);
    if (!consumed.rowCount) {
      return {
        ok: false,
        reason: "OTP_NOT_FOUND",
        message: "Kode OTP tidak ditemukan atau sudah dipakai. Minta kode baru.",
      };
    }
    return { ok: true, message: "Nomor WhatsApp berhasil diverifikasi." };
  }

  return { ensureTable, issueOtp, discardOtp, verifyOtp };
}

const store = createOtpStore();

export const issueOtp = store.issueOtp;
export const discardOtp = store.discardOtp;
export const verifyOtp = store.verifyOtp;
