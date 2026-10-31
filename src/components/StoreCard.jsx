import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Package, Users } from "lucide-react";

export function StoreLogo({ store, className = "h-14 w-14 text-xl" }) {
  return store.logo ? (
    <img src={store.logo} alt={store.name} className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy font-display font-extrabold text-white`}
    >
      {store.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function OpenBadge({ isOpen, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-[11px] ${
        isOpen ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      } ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "animate-pulse bg-emerald-500" : "bg-red-400"}`} />
      {isOpen ? "Buka" : "Tutup"}
    </span>
  );
}

export default function StoreCard({ store }) {
  return (
    <Link
      to={`/toko/${store.slug}`}
      className={`group relative flex gap-3 overflow-hidden rounded-3xl border border-navy/[0.06] bg-white p-3 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift active:scale-[0.99] sm:flex-col sm:p-0 ${
        store.isOpen ? "" : "border-navy/10 bg-navy/[0.02]"
      }`}
    >
      <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-full sm:rounded-none">
        {store.cover ? (
          <img
            src={store.cover}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${store.isOpen ? "" : "grayscale"}`}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-navy-600 via-navy to-navy-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
        <div className="absolute left-2 top-2 sm:left-4 sm:top-3">
          <OpenBadge isOpen={store.isOpen} className="bg-white/90 backdrop-blur" />
        </div>
        <span className="absolute right-2 top-2 rounded-full bg-white/15 px-1.5 py-1 text-[9px] font-bold tracking-widest text-white backdrop-blur sm:right-3 sm:top-3 sm:px-2 sm:text-[10px]">
          {store.code}
        </span>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col justify-center sm:justify-start sm:px-5 sm:pb-5">
        <div className="flex items-center gap-2 sm:-mt-7 sm:items-end sm:justify-between">
          <StoreLogo store={store} className="h-8 w-8 text-sm ring-2 ring-white sm:h-14 sm:w-14 sm:text-xl sm:ring-4" />
          <span className="mb-0.5 hidden items-center gap-1 text-xs font-semibold text-navy/65 sm:inline-flex">
            <Package size={13} /> {store.productCount ?? 0} produk
          </span>
        </div>

        <h3 className="mt-1.5 flex items-center gap-1.5 text-sm font-bold leading-tight text-navy sm:mt-3 sm:text-base">
          <span className="truncate">{store.name}</span>
          <ArrowUpRight size={14} className="shrink-0 text-navy/20 transition group-hover:text-accent sm:h-[15px] sm:w-[15px]" />
        </h3>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-navy/65 sm:mt-1 sm:min-h-[2.5rem] sm:text-[13px]">
          {store.bio || "Lihat menu dan informasi dari booth ini."}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-semibold text-navy/65 sm:mt-3 sm:justify-between sm:border-t sm:border-dashed sm:border-navy/[0.08] sm:pt-3 sm:text-[11px]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} /> {store.kelas}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={11} /> {store.members?.length || 0} anggota
          </span>
          <span className="text-emerald-700">{store.soldCount ? `${store.soldCount} terjual` : "Baru"}</span>
        </div>
      </div>
    </Link>
  );
}
