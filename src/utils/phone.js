// Validasi nomor WhatsApp Indonesia (dipakai di form checkout).
// Aturannya sengaja dibuat sama dengan server/lib/validator.js supaya
// pesan error di UI dan respons API selalu konsisten.

export const PHONE_ERROR_MESSAGE = "Nomor tidak valid. Masukkan nomor WhatsApp aktif yang benar.";

const MIN_DIGITS = 10;
const MAX_DIGITS = 13;

const OPERATOR_PREFIXES = [
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

const DUMMY_NUMBERS = new Set([
  "0800000000",
  "08000000000",
  "080000000000",
  "0800000000000",
  "081200000000",
  "081300000000",
]);

const SEQUENTIAL_MIN_RUN = 6;
const SAME_DIGIT_MIN_RUN = 6;

/** Buang spasi/tanda minus/plus, lalu seragamkan 62 / +62 / 8 menjadi 08. */
export function sanitizePhone(input) {
  const digits = String(input ?? "")
    .replace(/[\s\-().]/g, "")
    .replace(/\+/g, "")
    .replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  if (digits.startsWith("8")) return `0${digits}`;
  return digits;
}

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

function longestSameDigitRun(digits) {
  let longest = 1;
  let current = 1;
  for (let index = 1; index < digits.length; index += 1) {
    current = digits[index] === digits[index - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

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
 * @returns {{ valid: boolean, local: string, message: string }}
 */
export function validatePhone(input) {
  const local = sanitizePhone(input);
  const invalid = (message) => ({ valid: false, local, message });

  if (!local) return invalid("Nomor WhatsApp wajib diisi.");
  if (local.length < MIN_DIGITS) return invalid(`Nomor terlalu pendek. Minimal ${MIN_DIGITS} digit (contoh: 081377219045).`);
  if (local.length > MAX_DIGITS) return invalid(`Nomor terlalu panjang. Maksimal ${MAX_DIGITS} digit (contoh: 081377219045).`);
  if (!local.startsWith("08")) return invalid("Nomor harus nomor seluler Indonesia yang diawali 08.");
  if (!OPERATOR_PREFIXES.includes(local.slice(0, 4))) {
    return invalid("Prefix nomor tidak dikenali. Gunakan nomor seluler Indonesia yang aktif.");
  }
  if (longestSameDigitRun(local) >= SAME_DIGIT_MIN_RUN) {
    return invalid("Nomor ini tidak valid (angka berulang). Masukkan nomor WhatsApp aktif yang benar.");
  }
  if (longestSequentialRun(local) >= SEQUENTIAL_MIN_RUN) {
    return invalid("Nomor ini tidak valid (angka berurutan). Masukkan nomor WhatsApp aktif yang benar.");
  }
  if (hasRepeatingBlock(local)) {
    return invalid("Nomor ini tidak valid (pola angka berulang). Masukkan nomor WhatsApp aktif yang benar.");
  }
  if (DUMMY_NUMBERS.has(local)) return invalid(PHONE_ERROR_MESSAGE);

  return { valid: true, local, message: "" };
}

/** Kompatibilitas: "08xx" / "+62 8xx" / "62 8xx" -> "08xxxxxxxxxx", atau null bila tidak valid. */
export function normalizePhone(input = "") {
  const result = validatePhone(input);
  return result.valid ? result.local : null;
}
