// Normalisasi nomor WhatsApp Indonesia.
// Fonnte memakai format internasional tanpa "+" (628xxxxxxxxxx),
// sedangkan UI dan tabel customers memakai format lokal (08xxxxxxxxxx).
//
// Aturan validasi (panjang, prefix operator, anti-troll) ada di ./validator.js.

import { validateWhatsAppNumber } from "./validator.js";

/** "0812-3456-7890" / "+62 812 3456 7890" / "62812..." -> "6281234567890" (atau "" bila tidak valid). */
export function normalizePhone(input) {
  const result = validateWhatsAppNumber(input);
  return result.valid ? result.e164 : "";
}

/** "0812-3456-7890" -> "081234567890" (atau "" bila tidak valid). */
export function normalizeLocalPhone(input) {
  const result = validateWhatsAppNumber(input);
  return result.valid ? result.local : "";
}

/** "6281234567890" -> "081234567890" untuk ditampilkan ke pengguna. */
export function toLocalPhone(phone) {
  const value = String(phone ?? "");
  return value.startsWith("62") ? `0${value.slice(2)}` : value;
}

export { validateWhatsAppNumber };
