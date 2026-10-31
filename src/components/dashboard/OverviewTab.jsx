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
      tone: "bg-navy text-white",
      iconTone: "bg-white/10 text-accent-300",
      subTone: "text-white/50",
    },
    {
      label: "Pesanan selesai",
      value: stats ? stats.doneCount : "—",
      sub: `${stats?.orderCount ?? 0} pesanan total`,
      Icon: ClipboardList,
      tone: "bg-white text-navy",
      iconTone: "bg-sky-50 text-sky-600",
      subTone: "text-navy/65",
    },
    {
      label: "Rata-rata pesanan",
      value: stats ? formatRupiah(stats.avgOrder) : "—",
      sub: "per transaksi",
      Icon: TrendingUp,
      tone: "bg-white text-navy",
      iconTone: "bg-emerald-50 text-emerald-700",
      subTone: "text-navy/65",
    },
    {
      label: "Perlu diproses",
      value: stats ? formatRupiah(stats.pendingRevenue) : "—",
      sub: `${orders.filter((o) => o.status !== "done").length} pesanan aktif`,
      Icon: Wallet,
      tone: "bg-white text-navy",
      iconTone: "bg-amber-50 text-amber-700",
      subTone: "text-navy/65",
    },
  ];

  const top = stats?.topProducts || [];
  const maxQty = Math.max(...top.map((t) => t.qty), 1);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border border-navy/[0.06] p-3.5 shadow-soft sm:p-4 ${c.tone}`}>
            <div className="flex items-start justify-between gap-2">
              <p className={`text-[10px] font-semibold leading-tight sm:text-[11px] ${c.tone.includes("bg-navy") ? "text-white/60" : "text-navy/65"}`}>
                {c.label}
              </p>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-8 sm:w-8 ${c.iconTone}`}>
                <c.Icon size={14} />
              </span>
            </div>
            <p className="mt-2 font-display text-lg font-extrabold tracking-tight sm:text-xl">{loading ? "…" : c.value}</p>
            <p className={`mt-0.5 text-[10px] ${c.subTone}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          {stats ? <SalesChart labels={stats.days} values={stats.revenueByDay} /> : <div className="skeleton h-48 w-full" />}
        </div>

        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy">Produk terlaris</h2>
            <span className="text-[10px] font-semibold text-navy/65">Berdasarkan qty terjual</span>
          </div>
          {top.length === 0 ? (
            <p className="py-8 text-center text-xs text-navy/65">Belum ada penjualan selesai.</p>
          ) : (
            <ul className="space-y-3">
              {top.map((t, i) => (
                <li key={t.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold text-navy/75">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-navy-50 text-[9px] font-bold text-navy/65">
                        {i + 1}
                      </span>
                      <span className="truncate">{t.name}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-navy/65">
                      {t.qty}× · {formatRupiah(t.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-navy-50">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent to-amber-300" style={{ width: `${(t.qty / maxQty) * 100}%` }} />
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
          <span className="text-[10px] font-semibold text-navy/65">{orders.length} total</span>
        </div>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-xs text-navy/65">Belum ada pesanan masuk.</p>
        ) : (
          <ul className="divide-y divide-navy/[0.05]">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy/65">
                  <Receipt size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-navy">
                    {o.queueNo} · {o.customer?.name || "Pembeli"}
                  </p>
                  <p className="truncate text-[10px] text-navy/65">
                    {o.items.length} item · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[o.status] || ""}`}>
                  {ORDER_STATUS[o.status]}
                </span>
                <span className="hidden shrink-0 text-xs font-bold text-price sm:block">{formatRupiah(o.total)}</span>
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
            <p className="mt-1 text-xs leading-relaxed text-navy/65">
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
