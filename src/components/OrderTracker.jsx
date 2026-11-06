import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChefHat, Clock, MapPin, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatRupiah, timeAgo } from "../data/products";
import { getOrdersByIds, ORDER_POLL_INTERVAL_MS } from "../db/repository";
import { useDb } from "../db/useDb";

// Status pembeli: Diantre (pending/accepted) -> Sedang Dimasak -> Siap Diambil/Diantar
const stepOf = (s) => (s === "done" ? 2 : s === "processing" ? 1 : 0);

function Ticket({ o }) {
  const step = stepOf(o.status);
  const steps = ["Diantre", "Sedang dimasak", o.method === "delivery" ? "Siap diantar" : "Siap diambil"];
  const Icon = [Clock, ChefHat, CheckCircle2][step];

  return (
    <div className="overflow-hidden rounded-[24px] border border-navy/[0.07] bg-white shadow-card">
      <div className="relative border-b border-dashed border-navy/10 p-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy/[0.02] to-transparent" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-navy/55">
              {o.storeName} · {o.method === "delivery" ? "Antar ke kelas" : "Ambil di booth"}
            </p>
            <p className="tnum font-display text-3xl font-extrabold tracking-wider text-navy">{o.queueNo}</p>
            <p className="mt-0.5 text-[10px] text-navy/50">Dibuat {timeAgo(o.createdAt)}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
              step === 2
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : step === 1
                  ? "bg-sky-50 text-sky-700 ring-sky-100"
                  : "bg-amber-50 text-amber-700 ring-amber-100"
            }`}
          >
            <Icon size={13} /> {steps[step]}
          </span>
        </div>
      </div>

      <div className="p-4">
        <ol className="flex items-center" aria-label="Progres pesanan">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col items-start last:flex-none">
              <div className="flex w-full items-center">
                <span
                  className={`tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-500 ${
                    i <= step ? "bg-accent text-white shadow-glow" : "bg-navy-50 text-navy/30"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className={`mx-1 h-1 flex-1 rounded-full transition-colors duration-500 ${
                      i < step ? "bg-accent" : "bg-navy-50"
                    }`}
                  />
                )}
              </div>
              <span className={`mt-1.5 max-w-[6.5rem] text-[10px] font-semibold ${i <= step ? "text-navy" : "text-navy/45"}`}>
                {label}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-4 rounded-xl border border-navy/[0.06] bg-navy-50/70 px-3 py-2 text-[11px] leading-relaxed text-navy/60">
          {step === 2
            ? "Pesananmu sudah siap. Silakan ambil di booth atau tunggu diantar ya!"
            : `Estimasi tunggu sekitar ${o.minutes} menit. Status diperbarui langsung oleh penjual.`}
        </p>

        <ul className="mt-4 space-y-1 border-t border-dashed border-navy/10 pt-3 text-xs">
          {o.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span className="min-w-0 text-navy/70">
                {i.name} <span className="text-navy/45">× {i.qty}</span>
                {i.options && <span className="block text-[10px] text-navy/50">{i.options}</span>}
                {i.note && <span className="block text-[10px] italic text-price">“{i.note}”</span>}
              </span>
              <span className="tnum shrink-0 font-semibold text-navy/60">{formatRupiah(i.price * i.qty)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-navy/10 pt-2 font-bold text-price">
            <span>Total</span>
            <span className="tnum">{formatRupiah(o.total)}</span>
          </li>
        </ul>
        {o.note && (
          <p className="mt-2 flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-800">
            <MapPin size={11} className="mt-0.5 shrink-0" /> Catatan: {o.note}
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrderTracker() {
  const { trackerOpen, closeTracker, trackIds } = useCart();
  const navigate = useNavigate();
  const { data: orders } = useDb(
    () => (trackerOpen && trackIds.length ? getOrdersByIds(trackIds) : Promise.resolve([])),
    [trackIds.join(","), trackerOpen],
    { pollIntervalMs: ORDER_POLL_INTERVAL_MS }
  ); // live: ikut berubah saat penjual update (polling hanya saat tiket dibuka)

  useEffect(() => {
    if (!trackerOpen) return;
    const onKey = (e) => e.key === "Escape" && closeTracker();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [trackerOpen, closeTracker]);

  if (!trackerOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center bg-navy-900/60 backdrop-blur-md sm:items-center sm:p-4"
      onClick={closeTracker}
      role="dialog"
      aria-modal="true"
      aria-label="Tiket pesanan"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="scroll-contain relative max-h-[92dvh] w-full max-w-md animate-rise overflow-y-auto rounded-t-[30px] border border-white/60 bg-cream/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-lift backdrop-blur-2xl sm:max-h-[90vh] sm:rounded-[30px] sm:p-5"
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-navy/15 sm:hidden" aria-hidden="true" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-extrabold tracking-tight text-navy">Tiket pesanan</h3>
            <p className="text-[11px] text-navy/55">Status diperbarui otomatis saat penjual memproses.</p>
          </div>
          <button
            type="button"
            onClick={closeTracker}
            aria-label="Tutup"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white text-navy/55 shadow-soft transition duration-200 hover:text-navy active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {orders?.length ? (
            orders.map((o) => <Ticket key={o.id} o={o} />)
          ) : (
            <p className="py-10 text-center text-sm text-navy/50">Belum ada pesanan.</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            closeTracker();
            navigate("/pesanan");
          }}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full text-sm font-bold text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
          style={{ backgroundImage: "linear-gradient(180deg,#163a63 0%,#0b2545 58%,#071a33 100%)" }}
        >
          Lihat semua pesanan <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
