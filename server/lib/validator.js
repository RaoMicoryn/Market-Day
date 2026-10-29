// Validasi nomor WhatsApp Indonesia: format, prefix operator, dan anti-troll.
// Dipakai oleh endpoint OTP (server/routes/otp.js) dan pembuatan pesanan (server/index.js).
//
// Contoh pemakaian:
//   import { validateWhatsAppNumber } from "./lib/validator.js";
//   const check = validateWhatsAppNumber("+62 813-7721-9045");
//   check.valid  // true
//   check.local  // "081377219045"  (untuk disimpan & ditampilkan)
//   check.e164   // "6281377219045" (untuk Fonnte)

export const PHONE_ERROR_MESSAGE = "Nomor tidak valid. Masukkan nomor WhatsApp aktif yang benar.";

export const MIN_DIGITS = 10;
export const MAX_DIGITS = 13;

/** Prefix 4 digit operator seluler Indonesia yang aktif. */
export const OPERATOR_PREFIXES = [
  // Telkomsel
  "0811", "0812", "0813", "0821", "0822", "0823", "0851", "0852", "0853",
  // Indosat Ooredoo / IM3
  "0814", "0815", "0816", "0855", "0856", "0857", "0858",
  // XL Axiata
  "0817", "0818", "0819", "0859", "0877", "0878",
  // Axis
  "0831", "0832", "0833", "0838",
  // Tri (3)
  "0895", "0896", "0897", "0898", "0899",
  // Smartfren
  "0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889",
];

/** Nomor contoh/dummy yang sering dipakai untuk iseng (jaring pengaman terakhir). */
const DUMMY_NUMBERS = new Set([
  "0800000000",
  "08000000000",
  "080000000000",
  "0800000000000",
  "081200000000",
  "081300000000",
]);

const SEQUENTIAL_MIN_RUN = 6; // 6 digit berurutan dianggap pola iseng
const SAME_DIGIT_MIN_RUN = 6; // 6 digit sama berturut-turut dianggap iseng

/**
 * Bersihkan input: buang spasi, tanda minus, titik, kurung, dan tanda plus,
 * lalu seragamkan awalan 62 / +62 / 8 menjadi 08.
 */
export function sanitizeWhatsAppNumber(input) {
  const digits = String(input ?? "")
    .replace(/[\s\-().]/g, "") // spasi, minus, titik, kurung
    .replace(/\+/g, "") // tanda plus (di mana pun)
    .replace(/\D/g, ""); // sisa karakter non-angka

  if (!digits) return "";
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  if (digits.startsWith("8")) return `0${digits}`;
  return digits;
}

/** Deretan digit terpanjang yang naik/turun satu per satu (contoh: 123456, 987654). */
function longestSequentialRun(digits) {
  let longest = 1;
  let up = 1;
  let down = 1;
  for (let index = 1; index < digits.length; index += 1) {
    const difference = Number(digits[index]) - Number(digits[index - 1]);
    up = difference === 1 ? up + 1 : 1;
    down = difference === -1 ? down + 1 : 1;
    longest = Math.max(longest, up, down);
  }
  return longest;
}

/** Deretan digit terpanjang yang sama (contoh: 111111, 000000). */
function longestSameDigitRun(digits) {
  let longest = 1;
  let current = 1;
  for (let index = 1; index < digits.length; index += 1) {
    current = digits[index] === digits[index - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

/** Blok angka yang diulang-ulang, contoh: 0812-1212-1212 atau 0813-1313-1313. */
function hasRepeatingBlock(digits) {
  for (let size = 1; size <= 4; size += 1) {
    const minimumRepeat = size === 1 ? SAME_DIGIT_MIN_RUN : size === 2 ? 4 : 3;
    for (let start = 0; start + size * minimumRepeat <= digits.length; start += 1) {
      const block = digits.slice(start, start + size);
      if (block.repeat(minimumRepeat) === digits.slice(start, start + size * minimumRepeat)) return true;
    }
  }
  return false;
}

/**
 * Validasi lengkap nomor WhatsApp Indonesia.
 *
 * @param {string} input nomor mentah dari form/API
 * @returns {{ valid: boolean, local: string, e164: string, reason: string, message: string }}
 *   reason: EMPTY | TOO_SHORT | TOO_LONG | NOT_MOBILE | UNKNOWN_OPERATOR |
 *           DUMMY_NUMBER | REPEATED_DIGITS | SEQUENTIAL_DIGITS | REPEATED_PATTERN
 */
export function validateWhatsAppNumber(input) {
  const local = sanitizeWhatsAppNumber(input);

  const invalid = (reason, message) => ({ valid: false, local, e164: "", reason, message });

  if (!local) return invalid("EMPTY", "Nomor WhatsApp wajib diisi.");
  if (local.length < MIN_DIGITS) {
    return invalid("TOO_SHORT", `Nomor terlalu pendek. Minimal ${MIN_DIGITS} digit (contoh: 081377219045).`);
  }
  if (local.length > MAX_DIGITS) {
    return invalid("TOO_LONG", `Nomor terlalu panjang. Maksimal ${MAX_DIGITS} digit (contoh: 081377219045).`);
  }
  if (!local.startsWith("08")) {
    return invalid("NOT_MOBILE", "Nomor harus nomor seluler Indonesia yang diawali 08.");
  }
  if (!OPERATOR_PREFIXES.includes(local.slice(0, 4))) {
    return invalid("UNKNOWN_OPERATOR", "Prefix nomor tidak dikenali. Gunakan nomor seluler Indonesia yang aktif.");
  }
  if (longestSameDigitRun(local) >= SAME_DIGIT_MIN_RUN) {
    return invalid("REPEATED_DIGITS", "Nomor ini tidak valid (angka berulang). Masukkan nomor WhatsApp aktif yang benar.");
  }
  if (longestSequentialRun(local) >= SEQUENTIAL_MIN_RUN) {
    return invalid("SEQUENTIAL_DIGITS", "Nomor ini tidak valid (angka berurutan). Masukkan nomor WhatsApp aktif yang benar.");
  }
  if (hasRepeatingBlock(local)) {
    return invalid("REPEATED_PATTERN", "Nomor ini tidak valid (pola angka berulang). Masukkan nomor WhatsApp aktif yang benar.");
  }
  if (DUMMY_NUMBERS.has(local)) {
    return invalid("DUMMY_NUMBER", PHONE_ERROR_MESSAGE);
  }

  return { valid: true, local, e164: `62${local.slice(1)}`, reason: "OK", message: "" };
}

/** Versi ringkas: true bila nomor lolos semua aturan. */
export const isValidWhatsAppNumber = (input) => validateWhatsAppNumber(input).valid;

export default validateWhatsAppNumber;
