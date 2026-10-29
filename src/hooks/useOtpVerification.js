import { useCallback, useEffect, useRef, useState } from "react";
import { sendOtp, verifyOtp } from "../db/repository";

export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Logika form verifikasi OTP: kirim kode, hitung mundur, verifikasi, dan pesan error.
 * Bisa dipakai tanpa komponen OtpForm (misalnya di checkout atau modal sendiri).
 *
 * @param {{ phoneNumber: string, onVerified?: (result: object) => void }} options
 */
export function useOtpVerification({
  phoneNumber = "",
  onVerified,
  initialStatus = "idle",
  initialExpiresIn = 0,
  initialResendIn = 0,
} = {}) {
  const [status, setStatus] = useState(initialStatus); // idle | sending | sent | verifying | verified
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState(initialExpiresIn);
  const [resendIn, setResendIn] = useState(initialResendIn);
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  const verifiedRef = useRef(onVerified);
  verifiedRef.current = onVerified;

  const ticking = expiresIn > 0 || resendIn > 0;

  useEffect(() => {
    if (!ticking) return undefined;
    const timer = setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setResendIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [ticking]);

  const sendCode = useCallback(async () => {
    if (resendIn > 0) {
      setError(`Tunggu ${resendIn} detik sebelum meminta kode baru.`);
      return false;
    }
    if (!phoneNumber.trim()) {
      setError("Isi nomor WhatsApp terlebih dahulu.");
      return false;
    }
    setStatus("sending");
    setError("");
    try {
      const data = await sendOtp(phoneNumber);
      setStatus("sent");
      setExpiresIn(Number(data.expiresIn) || 300);
      setResendIn(OTP_RESEND_COOLDOWN_SECONDS);
      setRemainingAttempts(null);
      return true;
    } catch (requestError) {
      setStatus("idle");
      setError(requestError.message);
      if (requestError.retryAfter) setResendIn(Number(requestError.retryAfter) || 0);
      return false;
    }
  }, [phoneNumber, resendIn]);

  const verifyCode = useCallback(
    async (code) => {
      const clean = String(code ?? "").replace(/\D/g, "");
      if (!/^\d{6}$/.test(clean)) {
        setError("Masukkan 6 digit kode OTP.");
        return false;
      }
      setStatus("verifying");
      setError("");
      try {
        const data = await verifyOtp(phoneNumber, clean);
        setStatus("verified");
        setExpiresIn(0);
        setRemainingAttempts(null);
        verifiedRef.current?.(data);
        return true;
      } catch (requestError) {
        setStatus("sent");
        setError(requestError.message);
        if (requestError.remainingAttempts !== undefined) {
          setRemainingAttempts(requestError.remainingAttempts);
        }
        if (["OTP_EXPIRED", "OTP_NOT_FOUND", "OTP_ATTEMPTS_EXCEEDED"].includes(requestError.reason)) {
          setExpiresIn(0);
        }
        return false;
      }
    },
    [phoneNumber]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError("");
    setExpiresIn(0);
    setResendIn(0);
    setRemainingAttempts(null);
  }, []);

  return {
    status,
    error,
    expiresIn,
    resendIn,
    remainingAttempts,
    expired: status === "sent" && expiresIn === 0,
    canResend: status !== "sending" && status !== "verifying" && status !== "verified" && resendIn === 0,
    sendCode,
    verifyCode,
    reset,
  };
}
