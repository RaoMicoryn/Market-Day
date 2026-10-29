// Menyimpan data checkout sementara selama proses verifikasi OTP.
// Disimpan di sessionStorage supaya tahan refresh, tapi hilang saat tab ditutup.

const KEY = "mrpl:pending-order:v1";
const MAX_AGE_MS = 30 * 60 * 1000;

export function savePendingOrder(order) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...order, createdAt: Date.now() }));
  } catch {
    // sessionStorage bisa diblokir (mode privat); checkout tetap jalan tanpa ini.
  }
}

export function readPendingOrder() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value?.customer?.nama || !value?.customer?.wa) return null;
    if (!["pickup", "delivery"].includes(value.method)) return null;
    if (Date.now() - Number(value.createdAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function markOtpSent(at = Date.now()) {
  const current = readPendingOrder();
  if (!current) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...current, otpSentAt: at }));
  } catch {
    // abaikan
  }
}

export function clearPendingOrder() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
