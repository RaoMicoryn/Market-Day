import { useState } from "react";
import { CheckCheck, ChevronDown, Download, Footprints, MapPin, Phone, Search } from "lucide-react";
import EmptyState from "../ui/EmptyState";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { NEXT_STATUS, ORDER_STATUS, STATUS_TONE, getOrders, updateOrderStatus } from "../../db/repository";
import { useDb } from "../../db/useDb";
import { formatDateTime, formatRupiah, timeAgo } from "../../data/products";

const FILTERS = [{ id: "all", label: "Semua" }, ...Object.entries(ORDER_STATUS).map(([id, label]) => ({ id, label }))];

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function OrdersTab({ store }) {
  const { data: orders } = useDb(() => getOrders(store.id), [store.id]);
  const confirm = useConfirm();
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);

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
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1">
            {FILTERS.map((f) => {
              const n = f.id === "all" ? all.length : count(f.id);
              const active = status === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatus(f.id)}
                  aria-pressed={active}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active ? "bg-navy text-white shadow-soft" : "bg-navy-50 text-navy/65 hover:bg-navy-100 hover:text-navy"
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-white text-navy/65"}`}>
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
                className="h-9 w-full rounded-full border border-navy/10 bg-navy/[0.02] pl-9 pr-3 text-xs outline-none transition placeholder:text-navy/65 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
              />
            </label>
            <button type="button" onClick={exportCsv} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-navy/10 bg-white px-3 text-xs font-semibold text-navy/65 transition hover:border-accent/40 hover:text-price">
              <Download size={13} /> CSV
            </button>
          </div>
        </div>

        {pending.length > 0 && (
          <button type="button" onClick={acceptAll} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-[11px] font-bold text-price transition hover:bg-accent-100">
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
            const expanded = openId === o.id;
            const shown = expanded ? o.items : o.items.slice(0, 2);
            return (
              <article key={o.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-navy/10 p-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-navy px-2.5 py-1.5 font-display text-xs font-extrabold tracking-wider text-accent-300">
                      {o.queueNo}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-navy">{o.customer?.name || "Pembeli"}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-navy/65">
                        <span>{o.customer?.kelas}</span>
                        {o.customer?.phone && (
                          <a href={`https://wa.me/${o.customer.phone.replace(/^0/, "62")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-emerald-700">
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
                    <span className="text-sm font-extrabold text-price">{formatRupiah(o.total)}</span>
                  </div>
                </div>

                <div className="p-4">
                  <ul className="space-y-1 text-xs">
                    {shown.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span className="min-w-0 text-navy/70">
                          {i.name} <span className="text-navy/65">× {i.qty}</span>
                          {i.options && <span className="block text-[10px] text-navy/65">{i.options}</span>}
                          {i.note && <span className="block text-[10px] italic text-price">“{i.note}”</span>}
                        </span>
                        <span className="shrink-0 font-semibold text-navy/65">{formatRupiah(i.price * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  {o.items.length > 2 && (
                    <button type="button" onClick={() => setOpenId(expanded ? null : o.id)} className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-navy/65 hover:text-price">
                      {expanded ? "Sembunyikan" : `+${o.items.length - 2} item lainnya`}
                      <ChevronDown size={11} className={expanded ? "rotate-180 transition" : "transition"} />
                    </button>
                  )}

                  {o.note && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] leading-relaxed text-amber-800">
                      Catatan: {o.note}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-navy/[0.05] pt-3">
                    <span className="text-[10px] text-navy/65">
                      {timeAgo(o.createdAt)} · {formatDateTime(o.createdAt)}
                    </span>
                    {next ? (
                      <button
                        type="button"
                        onClick={() => advance(o)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-[11px] font-bold text-white transition hover:bg-accent active:scale-95"
                      >
                        {next[1]} <ChevronDown size={12} className="-rotate-90" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
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
