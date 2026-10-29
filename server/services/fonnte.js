// Layanan pengiriman WhatsApp via Fonnte (https://fonnte.com).
// Token dibaca dari environment variable FONNTE_TOKEN dan tidak pernah dikirim ke client.

const FONNTE_ENDPOINT = "https://api.fonnte.com/send";
const REQUEST_TIMEOUT_MS = 15_000;

export class FonnteError extends Error {
  constructor(message, { status = 502, reason = "FONNTE_ERROR" } = {}) {
    super(message);
    this.name = "FonnteError";
    this.status = status;
    this.reason = reason;
  }
}

export const isFonnteConfigured = () => Boolean(String(process.env.FONNTE_TOKEN || "").trim());

export function buildOtpMessage(otpCode) {
  return `Kode OTP Market Day: ${otpCode}. Berlaku 5 menit. Jangan bagikan kode ini ke siapapun.`;
}

/**
 * Kirim kode OTP ke nomor tujuan.
 * @param {{ target: string, otpCode: string }} params target = format 628xxxxxxxxxx
 * @returns {Promise<object>} respons Fonnte yang sudah tervalidasi
 */
export async function sendOtpWA({ target, otpCode }) {
  const token = String(process.env.FONNTE_TOKEN || "").trim();
  if (!token) {
    throw new FonnteError("FONNTE_TOKEN belum diatur. Tambahkan token Fonnte ke file .env.", {
      status: 500,
      reason: "FONNTE_NOT_CONFIGURED",
    });
  }
  if (!target || !otpCode) {
    throw new FonnteError("Nomor tujuan atau kode OTP tidak valid.", {
      status: 400,
      reason: "INVALID_TARGET",
    });
  }

  const payload = new URLSearchParams({
    target,
    message: buildOtpMessage(otpCode),
    countryCode: "62",
  });

  let response;
  try {
    response = await fetch(FONNTE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    throw new FonnteError(
      timedOut
        ? "Layanan WhatsApp tidak merespons. Coba lagi beberapa saat."
        : "Layanan WhatsApp sedang tidak dapat dihubungi. Coba lagi beberapa saat.",
      { reason: timedOut ? "FONNTE_TIMEOUT" : "FONNTE_UNREACHABLE" }
    );
  }

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  const accepted = data?.status === true || data?.status === "true";
  if (!response.ok || !accepted) {
    // Catat alasan dari Fonnte tanpa membocorkan token atau kode OTP.
    const detail = data?.reason || data?.message || `HTTP ${response.status}`;
    console.error(`[fonnte] pengiriman OTP gagal: ${String(detail).slice(0, 200)}`);
    throw new FonnteError("Gagal mengirim kode OTP melalui WhatsApp. Coba lagi beberapa saat.", {
      reason: "FONNTE_REJECTED",
    });
  }

  return data;
}
