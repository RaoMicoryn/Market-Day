import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, MapPin, Package, ReceiptText, RotateCcw, Store } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatRupiah, optionsText, timeAgo } from "../data/products";
import {
  getOrdersByIds,
  getProductsByIds,
  ORDER_POLL_INTERVAL_MS,
  ORDER_STATUS,
  STATUS_TONE,
} from "../db/repository";
import { useDb } from "../db/useDb";
import { usePageTitle } from "../hooks/usePageTitle";

const STEPS = ["Diantre", "Dimasak", "Siap"];

export default function OrdersPage() {
  usePageTitle("Pesanan saya");
  const { trackIds, openTracker, addSilently } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: orders } = useDb(() => getOrdersByIds(trackIds), [trackIds.join(",")], {
    pollIntervalMs: ORDER_POLL_INTERVAL_MS,
  });

  const reorder = async (o) => {
    const products = await getProductsByIds(o.items.map((i) => i.productId));
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));
    let added = 0;
    let skipped = 0;
    o.items.forEach((it) => {
      const p = byId[it.productId];
      if (!p || p.inStock === false) {
        skipped += 1;
        return;
      }
      const didAdd = addSilently(
        { ...p, storeName: o.storeName, storeOpen: true },
        { options: it.optionsObj || {}, qty: it.qty }
      );
      if (didAdd) added += 1;
      else skipped += 1;
    });
    if (!added) {
      toast("Produk dari pesanan ini sudah tidak tersedia.", { type: "error" });
      return;
    }
    toast(`${added} item ditambahkan ke keranjang${skipped ? `, ${skipped} tidak tersedia` : ""}.`, {
      type: "success",
    });
    navigate("/checkout");
  };

  return (
    <section className="shell max-w-4xl pb-8 pt-4 sm:py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7 sm:gap-4">
        <div>
          <p className="eyebrow mb-1.5">Riwayat</p>
          <h1 className="font-display text-[22px] font-extrabold text-navy sm:text-3xl">Pesanan saya</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-navy/65 sm:text-sm">
            Pesanan yang dibuat dari perangkat ini. Status diperbarui langsung saat penjual memproses.
          </p>
        </div>
        {orders?.length > 0 && (
          <button type="button" onClick={() => openTracker()} className="btn-primary w-full sm:w-auto">
            <ReceiptText size={15} /> Buka tiket aktif
          </button>
        )}
      </div>

      {!orders?.length ? (
        <EmptyState
          icon={Package}
          title="Belum ada pesanan"
          description="Setelah kamu memesan, nomor antrean dan status pesanan akan muncul di sini."
          action={
            <Link to="/cari" className="btn-accent">
              Mulai pesan <ArrowRight size={15} />
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const step = o.status === "done" ? 2 : o.status === "processing" ? 1 : 0;
            const stepLabels = ["Diantre", "Dimasak", o.method === "delivery" ? "Diantar" : "Siap ambil"];
            return (
              <article key={o.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-navy/10 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-accent-300">
                      <Store size={18} />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-navy/65">{o.storeName}</p>
                      <p className="font-display text-xl font-extrabold tracking-wide text-navy">{o.queueNo}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-navy/65">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={10} /> {timeAgo(o.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={10} /> {o.method === "delivery" ? "Antar ke kelas" : "Ambil di booth"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_TONE[o.status] || ""}`}>
                    {ORDER_STATUS[o.status] || o.status}
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
                  <div>
                    <ol className="flex items-center gap-1 text-[9px] font-semibold sm:gap-1.5 sm:text-[10px]" aria-label="Progres pesanan">
                      {STEPS.map((_, i) => (
                        <li key={i} className="flex flex-1 items-center gap-1 last:flex-none sm:gap-1.5">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                              i <= step ? "bg-accent text-white" : "bg-navy-50 text-navy/30"
                            }`}
                          >
                            {i < step ? "✓" : i + 1}
                          </span>
                          <span className={i <= step ? "text-navy" : "text-navy/65"}>{stepLabels[i]}</span>
                          {i < STEPS.length - 1 && (
                            <span className={`h-0.5 flex-1 rounded ${i < step ? "bg-accent" : "bg-navy-50"}`} />
                          )}
                        </li>
                      ))}
                    </ol>

                    <ul className="mt-3 space-y-1 text-xs">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between gap-3">
                          <span className="min-w-0 text-navy/65">
                            {it.name} <span className="text-navy/65">× {it.qty}</span>
                            {optionsText(it.optionsObj) && (
                              <span className="block text-[10px] text-navy/65">{optionsText(it.optionsObj)}</span>
                            )}
                          </span>
                          <span className="shrink-0 font-semibold text-navy/65">{formatRupiah(it.price * it.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] text-navy/65">{formatDateTime(o.createdAt)}</p>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 border-t border-dashed border-navy/10 pt-3 sm:min-w-[10rem] sm:items-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <div className="sm:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy/65">Total</p>
                      <p className="font-display text-lg font-extrabold text-price">{formatRupiah(o.total)}</p>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                      <button
                        type="button"
                        onClick={() => openTracker()}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-navy px-3 text-xs font-bold text-white transition hover:bg-navy-700 active:scale-95 sm:flex-none"
                      >
                        <ReceiptText size={13} /> Tiket
                      </button>
                      <button
                        type="button"
                        onClick={() => reorder(o)}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-navy/10 px-3 text-xs font-bold text-navy/70 transition hover:border-accent/50 hover:text-price active:scale-95 sm:flex-none"
                      >
                        <RotateCcw size={13} /> Pesan lagi
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] leading-relaxed text-navy/65">
        Tiket pesanan tersimpan di perangkat ini. Hapus data browser akan menghapus daftar tiket.
      </p>
    </section>
  );
}
