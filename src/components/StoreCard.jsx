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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
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
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-navy/[0.06] bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift ${
        store.isOpen ? "" : "border-navy/10 bg-navy/[0.02]"
      }`}
    >
      <div className="relative h-28 overflow-hidden">
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
        <div className="absolute left-4 top-3">
          <OpenBadge isOpen={store.isOpen} className="bg-white/90 backdrop-blur" />
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur">
          {store.code}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-7 flex items-end justify-between">
          <StoreLogo store={store} className="h-14 w-14 text-xl ring-4 ring-white" />
          <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-navy/65">
            <Package size={13} /> {store.productCount ?? 0} produk
          </span>
        </div>

        <h3 className="mt-3 flex items-center gap-1.5 text-base font-bold text-navy">
          <span className="truncate">{store.name}</span>
          <ArrowUpRight size={15} className="shrink-0 text-navy/20 transition group-hover:text-accent" />
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-navy/65">
          {store.bio || "Lihat menu dan informasi dari booth ini."}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-dashed border-navy/[0.08] pt-3 text-[11px] font-semibold text-navy/65">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {store.kelas}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} /> {store.members?.length || 0} anggota
          </span>
          <span className="text-emerald-700">{store.soldCount ? `${store.soldCount} terjual` : "Baru"}</span>
        </div>
      </div>
    </Link>
  );
}
