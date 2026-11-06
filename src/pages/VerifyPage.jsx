import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { placeOrder } from "../db/repository";
import { formatRupiah } from "../data/products";
import { usePageTitle } from "../hooks/usePageTitle";
import { useOtpVerification } from "../hooks/useOtpVerification";
import { normalizePhone, sanitizePhone } from "../utils/phone";
import { clearPendingOrder, markOtpSent, readPendingOrder } from "../utils/pendingOrder";

const EMPTY_DIGITS = ["", "", "", "", "", ""];
const formatCountdown = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function VerifyPage() {
  usePageTitle("Verifikasi OTP");
  const navigate = useNavigate();
  const { cart, total, clear, saveCustomer, openTracker } = useCart();
  const pending = useMemo(() => readPendingOrder(), []);

  const wa = normalizePhone(pending?.customer?.wa || "") || "";
  const age = pending?.otpSentAt ? (Date.now() - pending.otpSentAt) / 1000 : Infinity;
  const initialResendIn = Math.max(0, Math.ceil(60 - age));
  const initialExpiresIn = Math.max(0, Math.ceil(300 - age));

  const [digits, setDigits] = useState(EMPTY_DIGITS);
  const [localError, setLocalError] = useState("");
  const [orders, setOrders] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const inputs = useRef([]);
  const autoSent = useRef(false);
  const code = digits.join("");

  const createOrders = async () => {
    if (!pending) return;
    setPlacing(true);
    setPlaceError("");
    try {
      const created = await placeOrder({ customer: { ...pending.customer, wa }, items: cart, method: pending.method });
      saveCustomer({
        nama: pending.customer.nama,
        kelas: pending.customer.kelas,
        wa,
        note: pending.customer.note || "",
      });
      clearPendingOrder();
      clear();
      setOrders(created);
      openTracker(created.map((order) => order.id));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setPlaceError(error.message);
    } finally {
      setPlacing(false);
    }
  };

  const otp = useOtpVerification({
    phoneNumber: wa,
    initialStatus: initialResendIn > 0 ? "sent" : "idle",
    initialExpiresIn,
    initialResendIn,
    onVerified: createOrders,
  });

  // Kirim kode pertama kali halaman dibuka. Ref guard mencegah kiriman ganda
  // saat React StrictMode menjalankan effect dua kali di mode development.
  useEffect(() => {
    if (autoSent.current || !pending) return;
    autoSent.current = true;
    if (initialResendIn > 0) return;
    otp.sendCode().then((ok) => {
      if (ok) markOtpSent();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    setLocalError("");
    const ok = await otp.sendCode();
    if (ok) markOtpSent();
    return ok;
  };

  const setDigit = (index, value) => {
    setLocalError("");
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((previous) => previous.map((digit, position) => (position === index ? "" : digit)));
      return;
    }
    setDigits((previous) => {
      const next = [...previous];
      clean
        .slice(0, 6 - index)
        .split("")
        .forEach((character, offset) => {
          next[index + offset] = character;
        });
      return next;
    });
    inputs.current[Math.min(5, index + clean.length)]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      setLocalError("");
      if (digits[index]) {
        setDigits((previous) => previous.map((digit, position) => (position === index ? "" : digit)));
      } else if (index > 0) {
        setDigits((previous) => previous.map((digit, position) => (position === index - 1 ? "" : digit)));
        inputs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setLocalError("");
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] || ""));
    inputs.current[Math.min(5, pasted.length - 1)]?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");
    if (code.length !== 6) {
      setLocalError("Masukkan 6 digit kode OTP.");
      inputs.current[digits.findIndex((digit) => !digit)]?.focus();
      return;
    }
    await otp.verifyCode(code);
  };

  if (orders) return <OrderSuccess orders={orders} customer={pending?.customer} onTrack={() => openTracker()} />;
  if (!pending || !wa) return <Navigate to="/checkout" replace />;
  if (otp.status === "verified") {
    return (
      <section className="shell max-w-lg py-10 sm:py-14">
        <div className="card p-6 text-center sm:p-8">
          {placeError ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-red-50 text-red-600 ring-1 ring-red-100">
                <AlertCircle size={26} />
              </span>
              <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-navy">Pesanan belum tersimpan</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy/60">{placeError}</p>
              <button type="button" onClick={createOrders} disabled={placing} className="btn-primary mt-5">
                {placing ? "Mencoba lagi..." : "Coba lagi"}
              </button>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-accent/10 text-accent ring-1 ring-accent/10">
                <Loader2 size={26} className="animate-spin" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-navy">Menyimpan pesanan...</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy/60">
                Nomor WhatsApp terverifikasi. Kami sedang membuat nomor antrean untukmu.
              </p>
            </>
          )}
        </div>
      </section>
    );
  }

  if (cart.length === 0) return <Navigate to="/checkout" replace />;

  const sent = otp.status === "sent" || otp.status === "verifying";
  const sending = otp.status === "sending";
  const errorMessage = localError || otp.error;

  return (
    <section className="shell max-w-lg pb-10 pt-4 sm:py-12">
      <button
        type="button"
        onClick={() => navigate("/checkout")}
        className="mb-5 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-navy/55 transition duration-200 hover:bg-white hover:text-price"
      >
        <ArrowLeft size={16} /> Kembali ke detail pesanan
      </button>

      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-accent/15 to-amber-100 text-accent shadow-sm ring-1 ring-accent/10">
          <ShieldCheck size={26} />
        </span>
        <h1 className="mt-4 font-display text-[26px] font-extrabold tracking-tight text-navy sm:text-3xl">Verifikasi OTP</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-navy/60 sm:text-sm">
          {sending
            ? `Kami sedang mengirim kode verifikasi 6 digit ke nomor WhatsApp ${wa}.`
            : sent
              ? `Kami telah mengirim kode verifikasi 6 digit ke nomor WhatsApp ${wa}.`
              : `Kami akan mengirim kode verifikasi 6 digit ke nomor WhatsApp ${wa}.`}
        </p>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {errorMessage}
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-6">
        <fieldset>
          <legend className="sr-only">Kode verifikasi 6 digit</legend>
          <div className="mx-auto grid max-w-sm grid-cols-6 gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${index + 1} dari 6`}
                disabled={otp.status === "verifying"}
                className={`tnum h-14 w-full rounded-2xl border-2 bg-white text-center font-display text-[22px] font-extrabold text-navy shadow-sm outline-none transition duration-200 hover:border-navy/20 focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:opacity-60 sm:h-16 sm:text-2xl ${
                  errorMessage ? "border-red-300" : "border-navy/10"
                }`}
              />
            ))}
          </div>
        </fieldset>

        <p className="mt-3 text-center text-[11px] font-semibold text-navy/60">
          {otp.expired
            ? "Kode sudah tidak berlaku. Kirim ulang OTP."
            : otp.expiresIn > 0
              ? `Kode berlaku ${formatCountdown(otp.expiresIn)}.`
              : "Kode berlaku 5 menit setelah dikirim."}
        </p>

        <button
          type="submit"
          disabled={code.length !== 6 || otp.status === "verifying"}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ backgroundImage: "linear-gradient(180deg,#163a63 0%,#0b2545 58%,#071a33 100%)" }}
        >
          {otp.status === "verifying" ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Memverifikasi...
            </>
          ) : (
            "Verifikasi OTP"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-navy/55">
        Belum menerima kode OTP?{" "}
        <button
          type="button"
          onClick={handleSend}
          disabled={!otp.canResend || sending}
          className="link-quiet disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
        >
          {otp.resendIn > 0 ? `Kirim ulang dalam ${otp.resendIn} detik` : "Kirim ulang OTP"}
        </button>
      </p>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 text-center text-[11px] leading-relaxed text-amber-800 shadow-sm">
        <span className="tnum font-semibold">
          Total pesanan {formatRupiah(total)} · {cart.reduce((count, item) => count + item.qty, 0)} item.
        </span>
        <br />
        <span className="font-semibold">Peringatan:</span> pembayaran dikonfirmasi langsung ke penjual melalui WhatsApp (sistem PO), bukan di tempat.
      </div>
    </section>
  );
}

function buildConfirmationMessage(orders, customer) {
  return [
    "Halo, saya sudah melakukan pemesanan di Tribiz Fest.",
    `Nama: ${customer?.nama || "-"} (${customer?.kelas || "-"})`,
    "",
    ...orders.map((order) => `No. antrean ${order.queueNo} · ${order.storeName} · ${formatRupiah(order.total)}`),
    "",
    "Mohon konfirmasi pesanan saya. Terima kasih!",
  ].join("\n");
}

function OrderSuccess({ orders, customer, onTrack }) {
  // Utamakan nomor penjual yang diisi di form produk; VITE_SELLER_WHATSAPP jadi cadangan.
  const productSellerPhone = orders
    .flatMap((order) => order.items || [])
    .map((item) => sanitizePhone(item.sellerPhone || ""))
    .find(Boolean);
  const sellerPhone = productSellerPhone || sanitizePhone(import.meta.env.VITE_SELLER_WHATSAPP || "");
  const waLink = sellerPhone
    ? `https://wa.me/62${sellerPhone.slice(1)}?text=${encodeURIComponent(buildConfirmationMessage(orders, customer))}`
    : "";

  // Setelah OTP valid, pembeli langsung diarahkan ke WhatsApp penjual untuk konfirmasi.
  useEffect(() => {
    if (!waLink) return undefined;
    const timer = setTimeout(() => {
      window.location.href = waLink;
    }, 5000);
    return () => clearTimeout(timer);
  }, [waLink]);

  return (
    <section className="shell max-w-2xl py-8 sm:py-14">
      <div className="animate-pop overflow-hidden rounded-[26px] border border-emerald-100 bg-white text-center shadow-lift sm:rounded-[32px]">
        <div className="relative px-5 pb-5 pt-7 sm:px-10 sm:pb-8 sm:pt-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-50/80 to-transparent" aria-hidden="true" />
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <CheckCircle2 size={32} />
          </span>
          <h1 className="relative mt-5 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Pesanan diterima!</h1>
          <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy/60">
            Nomor WhatsApp terverifikasi. Tunjukkan nomor antrean ini di booth, lalu pantau statusnya di halaman
            pesanan.
          </p>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            {orders.map((order) => (
              <div key={order.id} className="relative overflow-hidden rounded-2xl bg-navy p-4 text-left text-white shadow-soft ring-1 ring-white/10">
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/25 blur-2xl" aria-hidden="true" />
                <p className="relative text-[11px] font-semibold uppercase tracking-widest text-white/50">{order.storeName}</p>
                <p className="tnum relative mt-1 font-display text-2xl font-extrabold tracking-wider text-accent-300">
                  {order.queueNo}
                </p>
                <p className="tnum relative mt-1 text-xs text-white/60">
                  {order.items.length} item · {formatRupiah(order.total)}
                </p>
              </div>
            ))}
          </div>

          {waLink && (
            <div className="relative mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
              <p className="text-[11px] font-semibold text-emerald-800">
                Mengalihkan ke WhatsApp penjual untuk konfirmasi pesanan…
              </p>
              <a href={waLink} className="btn-accent mt-2 inline-flex">
                <MessageCircle size={16} /> Konfirmasi via WhatsApp sekarang
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-navy/10 bg-cream/60 px-5 py-5 sm:px-10">
          <div className="flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={onTrack} className="btn-accent w-full sm:w-auto">
              <Ticket size={16} /> Lihat tiket pesanan
            </button>
            <Link to="/pesanan" className="btn-ghost w-full sm:w-auto">
              Semua pesanan saya
            </Link>
            <Link to="/" className="btn-quiet w-full sm:w-auto">
              Kembali ke menu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
