import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import FormField from "./FormField";
import { useOtpVerification } from "../hooks/useOtpVerification";

const formatCountdown = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Form verifikasi OTP WhatsApp yang siap dipakai.
 *
 * Mode tidak terkontrol:
 *   <OtpForm onVerified={(result) => ...} />
 *
 * Mode terkontrol (nomor diatur parent):
 *   <OtpForm phoneNumber={wa} onPhoneNumberChange={setWa} onVerified={...} hidePhoneField />
 */
export default function OtpForm({
  phoneNumber,
  onPhoneNumberChange,
  onVerified,
  title = "Verifikasi WhatsApp",
  description = "Masukkan nomor WhatsApp aktif. Kami akan mengirim kode 6 digit.",
  hidePhoneField = false,
  className = "",
}) {
  const controlled = phoneNumber !== undefined;
  const [localPhone, setLocalPhone] = useState("");
  const phone = controlled ? phoneNumber : localPhone;
  const showPhoneField = !hidePhoneField && !(controlled && !onPhoneNumberChange);

  const [code, setCode] = useState("");
  const inputRef = useRef(null);
  const uid = useId();
  const titleId = `otp-title-${uid}`;
  const codeId = `otp-code-${uid}`;
  const hintId = `otp-hint-${uid}`;
  const errorId = `otp-error-${uid}`;
  const {
    status,
    error,
    expiresIn,
    resendIn,
    expired,
    canResend,
    sendCode,
    verifyCode,
    reset,
  } = useOtpVerification({ phoneNumber: phone, onVerified });

  // Ganti nomor = mulai dari awal supaya kode lama tidak tertukar.
  useEffect(() => {
    setCode("");
    reset();
  }, [phone, reset]);

  useEffect(() => {
    if (status === "sent") inputRef.current?.focus();
  }, [status]);

  const updatePhone = (event) => {
    if (!controlled) setLocalPhone(event.target.value);
    onPhoneNumberChange?.(event.target.value);
  };

  const submit = async (event) => {
    event.preventDefault();
    const ok = await verifyCode(code);
    if (ok) setCode("");
  };

  const onCodeChange = (event) => {
    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
  };

  const showForm = status === "sent" || status === "verifying";

  return (
    <section className={`card p-5 sm:p-6 ${className}`} aria-labelledby={titleId}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent" aria-hidden="true">
          <ShieldCheck size={20} />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="font-display text-lg font-extrabold text-navy">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-navy/65">{description}</p>
        </div>
      </div>

      <p role="status" className="sr-only">
        {status === "sent" ? "Kode OTP telah dikirim ke WhatsApp." : ""}
      </p>

      {status === "verified" ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Nomor WhatsApp berhasil diverifikasi.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {showPhoneField && (
            <FormField
              label="Nomor WhatsApp"
              name="otp-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={updatePhone}
              disabled={status === "sending" || status === "verifying"}
              hint="Contoh: 081234567890"
            />
          )}

          {!showPhoneField && phone.trim() && (
            <p className="rounded-xl bg-navy/[0.04] px-3 py-2 text-xs font-semibold text-navy/70">
              Kode dikirim ke <span className="text-navy">{phone}</span>.
            </p>
          )}

          {showForm ? (
            <form onSubmit={submit} noValidate className="space-y-3">
              <div>
                <label htmlFor={codeId} className="mb-1.5 block text-[13px] font-bold text-navy">
                  Kode OTP
                </label>
                <input
                  id={codeId}
                  ref={inputRef}
                  name="otp-code"
                  value={code}
                  onChange={onCodeChange}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="······"
                  aria-invalid={!!error}
                  aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                  className={`field tracking-[0.5em] ${error ? "border-red-400 bg-red-50/40" : ""}`}
                />
                <p id={hintId} className="mt-1.5 text-[11px] text-navy/65">
                  {expired
                    ? "Kode sudah tidak berlaku. Minta kode baru."
                    : `Kode berlaku ${formatCountdown(expiresIn)}.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={status === "verifying" || code.length !== 6} className="btn-primary">
                  {status === "verifying" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Memeriksa...
                    </>
                  ) : (
                    "Verifikasi"
                  )}
                </button>
                <button type="button" onClick={sendCode} disabled={!canResend} className="btn-ghost">
                  {resendIn > 0 ? `Kirim ulang (${resendIn}s)` : "Kirim ulang kode"}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={sendCode}
              disabled={status === "sending" || resendIn > 0 || !phone.trim()}
              className="btn-primary w-full sm:w-auto"
            >
              {status === "sending" ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Mengirim...
                </>
              ) : (
                <>
                  <MessageCircle size={15} aria-hidden="true" /> Kirim kode OTP
                </>
              )}
            </button>
          )}

          {error && (
            <p
              id={errorId}
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
