// Endpoint OTP WhatsApp: POST /api/otp/send dan POST /api/otp/verify.

import express from "express";
import { validateWhatsAppNumber } from "../lib/validator.js";
import {
  issueOtp as defaultIssueOtp,
  discardOtp as defaultDiscardOtp,
  verifyOtp as defaultVerifyOtp,
  OtpError,
} from "../lib/otpStore.js";
import {
  sendOtpWA as defaultSendOtpWA,
  isFonnteConfigured as defaultIsFonnteConfigured,
  FonnteError,
} from "../services/fonnte.js";

const defaultStore = {
  issueOtp: defaultIssueOtp,
  discardOtp: defaultDiscardOtp,
  verifyOtp: defaultVerifyOtp,
};

const defaultSender = {
  sendOtpWA: defaultSendOtpWA,
  isFonnteConfigured: defaultIsFonnteConfigured,
};

const fail = (res, status, error, extra = {}) => res.status(status).json({ success: false, error, ...extra });

// Nomor ngasal / troll ditolak sebelum OTP dibuat dan sebelum memanggil Fonnte,
// supaya kuota WhatsApp tidak terpakai.
const invalidPhone = (res, result) =>
  fail(res, 400, result.message || "Nomor tidak valid. Masukkan nomor WhatsApp aktif yang benar.", {
    reason: result.reason || "INVALID_PHONE",
  });

/** Factory agar penyimpanan OTP dan pengirim WA bisa diganti saat pengujian. */
export function createOtpRouter({ store = defaultStore, sender = defaultSender } = {}) {
  const router = express.Router();

  router.post("/send", async (req, res, next) => {
    const check = validateWhatsAppNumber(req.body?.phoneNumber);
    if (!check.valid) return invalidPhone(res, check);
    const phone = check.e164;

    if (!sender.isFonnteConfigured()) {
      return fail(res, 500, "Layanan OTP belum dikonfigurasi. Hubungi admin.", {
        reason: "FONNTE_NOT_CONFIGURED",
      });
    }

    let otp;
    try {
      otp = await store.issueOtp(phone);
    } catch (error) {
      if (error instanceof OtpError) {
        if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
        return fail(res, error.status, error.message, {
          reason: error.reason,
          ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
        });
      }
      return next(error);
    }

    try {
      await sender.sendOtpWA({ target: phone, otpCode: otp.code });
    } catch (error) {
      // Jangan biarkan kode yang gagal terkirim tetap valid.
      await store.discardOtp(phone).catch(() => {});
      if (error instanceof FonnteError) {
        return fail(res, error.status, error.message, { reason: error.reason });
      }
      return next(error);
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: otp.expiresIn,
    });
  });

  router.post("/verify", async (req, res, next) => {
    const check = validateWhatsAppNumber(req.body?.phoneNumber);
    if (!check.valid) return invalidPhone(res, check);
    const phone = check.e164;

    const code = String(req.body?.code ?? "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(code)) {
      return fail(res, 400, "Kode OTP harus 6 digit angka.", { reason: "INVALID_OTP_FORMAT" });
    }

    try {
      const result = await store.verifyOtp(phone, code);
      if (result.ok) {
        return res.json({ success: true, message: result.message, phoneNumber: phone });
      }
      const status = result.reason === "OTP_ATTEMPTS_EXCEEDED" ? 429 : 400;
      return fail(res, status, result.message, {
        reason: result.reason,
        ...(result.remainingAttempts !== undefined ? { remainingAttempts: result.remainingAttempts } : {}),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createOtpRouter();
