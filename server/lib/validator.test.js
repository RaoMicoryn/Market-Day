// Tes aturan validasi nomor WhatsApp. Jalankan: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { validateWhatsAppNumber, sanitizeWhatsAppNumber } from "./validator.js";
import { normalizePhone } from "./phone.js";

test("menerima nomor seluler Indonesia yang wajar", () => {
  const valid = ["081377219045", "085719823104", "081298441567", "089674182035", "088817492036"];
  for (const phone of valid) {
    const result = validateWhatsAppNumber(phone);
    assert.equal(result.valid, true, `${phone} seharusnya valid`);
    assert.equal(result.local, phone);
    assert.equal(result.e164, `62${phone.slice(1)}`);
  }
});

test("membersihkan spasi, minus, titik, dan plus", () => {
  assert.equal(sanitizeWhatsAppNumber("+62 813-7721-9045"), "081377219045");
  assert.equal(sanitizeWhatsAppNumber("62.813.7721.9045"), "081377219045");
  assert.equal(sanitizeWhatsAppNumber("0813 7721 9045"), "081377219045");
  assert.equal(sanitizeWhatsAppNumber("81377219045"), "081377219045");
});

test("menolak nomor berurutan", () => {
  for (const phone of ["081234567890", "08987654321", "0812345678"]) {
    const result = validateWhatsAppNumber(phone);
    assert.equal(result.valid, false, `${phone} seharusnya ditolak`);
    assert.equal(result.reason, "SEQUENTIAL_DIGITS");
  }
});

test("menolak nomor berulang", () => {
  for (const phone of ["081111111111", "082222222222", "081999999999"]) {
    const result = validateWhatsAppNumber(phone);
    assert.equal(result.valid, false, `${phone} seharusnya ditolak`);
    assert.equal(result.reason, "REPEATED_DIGITS");
  }
});

test("menolak nomor dummy dan pola berulang", () => {
  assert.equal(validateWhatsAppNumber("080000000000").valid, false);
  assert.equal(validateWhatsAppNumber("081212121212").reason, "REPEATED_PATTERN");
});

test("menolak panjang dan prefix yang salah", () => {
  assert.equal(validateWhatsAppNumber("").reason, "EMPTY");
  assert.equal(validateWhatsAppNumber("08137721").reason, "TOO_SHORT");
  assert.equal(validateWhatsAppNumber("08137721904567").reason, "TOO_LONG");
  assert.equal(validateWhatsAppNumber("0212345678").reason, "NOT_MOBILE");
  assert.equal(validateWhatsAppNumber("0800123456").reason, "UNKNOWN_OPERATOR");
});

test("normalizePhone mengembalikan format Fonnte", () => {
  assert.equal(normalizePhone("+62 813-7721-9045"), "6281377219045");
  assert.equal(normalizePhone("081234567890"), "");
});
