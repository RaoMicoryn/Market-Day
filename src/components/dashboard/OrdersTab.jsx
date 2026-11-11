import { useState } from "react";
import { CheckCheck, ChevronDown, Download, Footprints, MapPin, Phone, Search, XCircle } from "lucide-react";
import EmptyState from "../ui/EmptyState";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import {
  NEXT_STATUS,
  ORDER_POLL_INTERVAL_MS,
  ORDER_STATUS,
  STATUS_TONE,
  cancelOrder,
  getOrders,
  updateOrderStatus,
} from "../../db/repository";
import { useDb } from "../../db/useDb";
import { formatDateTime, formatRupiah, timeAgo } from "../../data/products";

const FILTERS = [{ id: "all", label: "Semua" }, ...Object.entries(ORDER_STATUS).map(([id, label]) => ({ id, label }))];

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function OrdersTab({ store }) {
  const { data: orders } = useDb(() => getOrders(store.id), [store.id], {
    pollIntervalMs: ORDER_POLL_INTERVAL_MS,
  });
  const confirm = useConfirm();
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const all = orders || [];
  const term = q.trim().toLowerCase();
  const rows = all
    .filter((o) => status === "all" || o.status === status)
    .filter(
      (o) =>
        !term ||
        [o.queueNo, o.customer?.name, o.customer?.phone, ...o.items.map((i) => i.name)].some((t) =>
          String(t || "").toLowerCase().includes(term)
        )
    );

  const count = (s) => all.filter((o) => o.status === s).length;
  const pending = all.filter((o) => o.status === "pending");

  const advance = async (o) => {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    await updateOrderStatus(o.id, next[0]);
    toast(`${o.queueNo} → ${ORDER_STATUS[next[0]]}`, { type: "success", duration: 2000 });
  };

  const cancel = async (o) => {
    const ok = await confirm({
      title: `Batalkan pesanan ${o.queueNo}?`,
      message: `Pesanan dari ${o.customer?.name || "pembeli"} akan ditandai Dibatalkan dan tidak bisa diaktifkan lagi. Hubungi pembeli lewat WhatsApp bila perlu menjelaskan alasannya.`,
      confirmLabel: "Ya, batalkan",
      cancelLabel: "Tidak jadi",
      danger: true,
    });
    if (!ok) return;
    try {
      await cancelOrder(o.id);
      toast(`${o.queueNo} dibatalkan.`, { type: "success", duration: 2500 });
    } catch (error) {
      toast(error.message || "Pesanan gagal dibatalkan.", { type: "error" });
    }
  };

  const acceptAll = async () => {
    const ok = await confirm({
      title: `Terima ${pending.length} pesanan?`,
      message: "Semua pesanan baru akan ditandai sebagai Diterima dan siap diproses.",
      confirmLabel: "Ya, terima semua",
    });
    if (!ok) return;
    await Promise.all(pending.map((o) => updateOrderStatus(o.id, "accepted")));
    toast(`${pending.length} pesanan diterima.`, { type: "success" });
  };

  const exportCsv = () => {
    if (!all.length) return;
    const header = ["Antrean", "Waktu", "Pembeli", "Kelas", "WhatsApp", "Metode", "Produk", "Total", "Status", "Catatan"];
    const lines = all.map((o) =>
      [
        o.queueNo,
        formatDateTime(o.createdAt),
        o.customer?.name,
        o.customer?.kelas,
        o.customer?.phone,
        o.method === "delivery" ? "Antar ke kelas" : "Ambil di booth",
        o.items.map((i) => `${i.name} x${i.qty}${i.options ? ` (${i.options})` : ""}`).join("; "),
        o.total,
        ORDER_STATUS[o.status],
        o.note,
      ]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([`\uFEFF${header.map(csvCell).join(",")}\n${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `pesanan-${store.slug}-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("File CSV diunduh.", { type: "success", duration: 2000 });
  };

  return (
    <div className="space-y-4">
      <div className="card p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5">
            {FILTERS.map((f) => {
              const n = f.id === "all" ? all.length : count(f.id);
              const active = status === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatus(f.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition duration-200 active:scale-95 ${
                    active ? "bg-navy text-white shadow-soft" : "bg-navy-50 text-navy/60 hover:bg-navy-100 hover:text-navy"
                  }`}
                >
                  {f.label}
                  <span className={`tnum rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-white text-navy/55"}`}>
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <label className="relative flex-1 sm:w-52">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari antrean / pembeli..."
                aria-label="Cari pesanan"
                className="h-10 w-full rounded-full border border-navy/10 bg-navy/[0.02] pl-9 pr-3 text-base outline-none transition placeholder:text-navy/55 hover:border-navy/20 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 sm:h-9 sm:text-xs"
              />
            </label>
            <button type="button" onClick={exportCsv} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-navy/10 bg-white px-3 text-xs font-semibold text-navy/60 shadow-sm transition duration-200 hover:border-accent/40 hover:text-price active:scale-95 sm:h-9">
              <Download size={13} /> CSV
            </button>
          </div>
        </div>

        {pending.length > 0 && (
          <button type="button" onClick={acceptAll} className="mt-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent/20 bg-accent-50 px-3 text-[11px] font-bold text-price transition duration-200 hover:bg-accent-100 active:scale-95">
            <CheckCheck size={13} /> Terima semua pesanan baru ({pending.length})
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title={all.length ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"}
          description={all.length ? "Coba ubah filter status atau kata kunci pencarian." : "Pesanan dari pembeli akan muncul di sini secara otomatis."}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((o) => {
            const next = NEXT_STATUS[o.status];
            const shown = o.items;
            return (
              <article key={o.id} className={`card relative overflow-hidden transition duration-200 hover:shadow-lift ${o.status === "cancelled" ? "opacity-70" : ""}`}>
                <span
                  className={`absolute inset-y-0 left-0 w-[3px] ${
                    o.status === "pending" ? "bg-accent" : o.status === "done" ? "bg-emerald-500" : o.status === "cancelled" ? "bg-rose-400" : "bg-navy/20"
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-navy/10 p-4 pl-[1.15rem]">
                  <div className="flex items-start gap-3">
                    <span className="tnum rounded-xl bg-gradient-to-br from-navy-600 to-navy px-2.5 py-1.5 font-display text-xs font-extrabold tracking-wider text-accent-300 shadow-sm">
                      {o.queueNo}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-navy">{o.customer?.name || "Pembeli"}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-navy/55">
                        <span>{o.customer?.kelas}</span>
                        {o.customer?.phone && (
                          <a href={`https://wa.me/${o.customer.phone.replace(/^0/, "62")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition hover:text-emerald-700">
                            <Phone size={10} /> {o.customer.phone}
                          </a>
                        )}
                        <span className="inline-flex items-center gap-1">
                          {o.method === "delivery" ? <Footprints size={10} /> : <MapPin size={10} />}
                          {o.method === "delivery" ? "Antar ke kelas" : "Ambil di booth"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_TONE[o.status] || ""}`}>
                      {ORDER_STATUS[o.status]}
                    </span>
                    <span className={`tnum text-sm font-extrabold ${o.status === "cancelled" ? "text-navy/40 line-through" : "text-price"}`}>{formatRupiah(o.total)}</span>
                  </div>
                </div>

                <div className="p-4 pl-[1.15rem]">
                  <ul className="space-y-1 text-xs">
                    {shown.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span className="min-w-0 text-navy/70">
                          {i.name} <span className="text-navy/45">× {i.qty}</span>
                          {i.options && <span className="block text-[10px] text-navy/50">{i.options}</span>}
                          {i.note && <span className="block text-[10px] italic text-price">“{i.note}”</span>}
                        </span>
                        <span className="tnum shrink-0 font-semibold text-navy/60">{formatRupiah(i.price * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  {o.note && (
                    <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-relaxed text-amber-800">
                      Catatan: {o.note}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-navy/[0.05] pt-3">
                    <span className="text-[10px] text-navy/50">
                      {timeAgo(o.createdAt)} · {formatDateTime(o.createdAt)}
                    </span>
                    {next ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cancel(o)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 text-xs font-bold text-rose-600 transition duration-200 hover:bg-rose-50 active:scale-95"
                        >
                          <XCircle size={13} /> Batalkan
                        </button>
                        <button
                          type="button"
                          onClick={() => advance(o)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-95"
                          style={{ backgroundImage: "linear-gradient(180deg,#163a63 0%,#0b2545 100%)" }}
                        >
                          {next[1]} <ChevronDown size={12} className="-rotate-90" />
                        </button>
                      </div>
                    ) : o.status === "cancelled" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                        <XCircle size={12} /> Dibatalkan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCheck size={12} /> Selesai
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
