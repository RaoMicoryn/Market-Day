import { Link } from "react-router-dom";
import { ArrowUpRight, Banknote, ClipboardList, Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import SalesChart from "./SalesChart";
import StoreCodeCard from "../StoreCodeCard";
import { useDb } from "../../db/useDb";
import { ORDER_STATUS, STATUS_TONE, getStoreStats } from "../../db/repository";
import { formatRupiah, timeAgo } from "../../data/products";

export default function OverviewTab({ store, orders }) {
  const { data: stats, loading } = useDb(() => getStoreStats(store.id), [store.id]);

  const cards = [
    {
      label: "Total omzet",
      value: stats ? formatRupiah(stats.revenue) : "—",
      sub: "dari pesanan selesai",
      Icon: Banknote,
      tone: "bg-navy text-white border-navy/60",
      iconTone: "bg-white/10 text-accent-300 ring-1 ring-white/10",
      subTone: "text-white/50",
      valueTone: "text-white",
    },
    {
      label: "Pesanan selesai",
      value: stats ? stats.doneCount : "—",
      sub: `${stats?.orderCount ?? 0} pesanan total`,
      Icon: ClipboardList,
      tone: "bg-white text-navy border-navy/[0.07]",
      iconTone: "bg-sky-50 text-sky-600 ring-1 ring-sky-100",
      subTone: "text-navy/50",
      valueTone: "text-navy",
    },
    {
      label: "Rata-rata pesanan",
      value: stats ? formatRupiah(stats.avgOrder) : "—",
      sub: "per transaksi",
      Icon: TrendingUp,
      tone: "bg-white text-navy border-navy/[0.07]",
      iconTone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      subTone: "text-navy/50",
      valueTone: "text-navy",
    },
    {
      label: "Perlu diproses",
      value: stats ? formatRupiah(stats.pendingRevenue) : "—",
      sub: `${orders.filter((o) => o.status !== "done" && o.status !== "cancelled").length} pesanan aktif`,
      Icon: Wallet,
      tone: "bg-white text-navy border-navy/[0.07]",
      iconTone: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      subTone: "text-navy/50",
      valueTone: "text-navy",
    },
  ];

  const top = stats?.topProducts || [];
  const maxQty = Math.max(...top.map((t) => t.qty), 1);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`relative overflow-hidden rounded-[18px] border p-3.5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:rounded-[22px] sm:p-4 ${c.tone}`}>
            {c.tone.includes("bg-navy") && (
              <>
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent/25 blur-2xl" aria-hidden="true" />
              </>
            )}
            <div className="relative flex items-start justify-between gap-2">
              <p className={`text-[10px] font-semibold leading-tight sm:text-[11px] ${c.tone.includes("bg-navy") ? "text-white/60" : "text-navy/55"}`}>
                {c.label}
              </p>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-8 sm:w-8 ${c.iconTone}`}>
                <c.Icon size={14} />
              </span>
            </div>
            <p className={`tnum relative mt-2 font-display text-lg font-extrabold tracking-tight sm:text-xl ${c.valueTone}`}>
              {loading ? "…" : c.value}
            </p>
            <p className={`relative mt-0.5 text-[10px] ${c.subTone}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          {stats ? <SalesChart labels={stats.days} values={stats.revenueByDay} /> : <div className="skeleton h-48 w-full" />}
        </div>

        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-navy">Produk terlaris</h2>
              <p className="mt-0.5 text-[10px] text-navy/50">Berdasarkan qty terjual</p>
            </div>
            <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-bold text-navy/60">Top {top.length}</span>
          </div>
          {top.length === 0 ? (
            <p className="py-8 text-center text-xs text-navy/50">Belum ada penjualan selesai.</p>
          ) : (
            <ul className="space-y-3">
              {top.map((t, i) => (
                <li key={t.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-navy/75">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-navy-50 text-[9px] font-bold text-navy/60">
                        {i + 1}
                      </span>
                      <span className="truncate">{t.name}</span>
                    </span>
                    <span className="tnum shrink-0 text-[10px] font-semibold text-navy/50">
                      {t.qty}× · {formatRupiah(t.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-navy-50">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent to-amber-300 transition-all duration-500" style={{ width: `${(t.qty / maxQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-navy/[0.06] px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-sm font-bold text-navy">Pesanan terbaru</h2>
          <span className="tnum rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-bold text-navy/60">{orders.length} total</span>
        </div>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-xs text-navy/50">Belum ada pesanan masuk.</p>
        ) : (
          <ul className="divide-y divide-navy/[0.05]">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center gap-2.5 px-4 py-3 transition hover:bg-navy/[0.015] sm:gap-3 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy/60">
                  <Receipt size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-navy">
                    <span className="tnum">{o.queueNo}</span> · {o.customer?.name || "Pembeli"}
                  </p>
                  <p className="truncate text-[10px] text-navy/50">
                    {o.items.length} item · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[o.status] || ""}`}>
                  {ORDER_STATUS[o.status]}
                </span>
                <span className="tnum hidden shrink-0 text-xs font-bold text-price sm:block">{formatRupiah(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <StoreCodeCard code={store.code} slug={store.slug} />
        <div className="card flex flex-col justify-between p-5">
          <div>
            <h2 className="text-sm font-bold text-navy">Siap jualan?</h2>
            <p className="mt-1 text-xs leading-relaxed text-navy/60">
              Pastikan menu dan stok sudah diperbarui sebelum jam istirahat. Booth yang tutup tidak bisa menerima pesanan.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/toko/${store.slug}`} className="btn-ghost">
              <Package size={14} /> Cek tampilan toko
            </Link>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
              <ArrowUpRight size={12} /> {store.productCount ?? 0} produk aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
