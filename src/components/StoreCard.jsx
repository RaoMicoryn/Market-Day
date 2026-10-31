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
  const sold = store.soldCount ? `${store.soldCount} terjual` : null;

  return (
    <Link
      to={`/toko/${store.slug}`}
      className={`group relative flex gap-3.5 overflow-hidden rounded-3xl border bg-white p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:scale-[0.99] sm:flex-col sm:gap-0 sm:p-0 ${
        store.isOpen ? "border-navy/[0.06]" : "border-navy/10 bg-navy/[0.02]"
      }`}
    >
      {/* Cover */}
      <div className="relative h-[104px] w-[104px] shrink-0 sm:h-32 sm:w-full">
        <div className="h-full w-full overflow-hidden rounded-2xl sm:rounded-none">
          {store.cover ? (
            <img
              src={store.cover}
              alt=""
              loading="lazy"
              className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${store.isOpen ? "" : "grayscale"}`}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-600 via-navy to-navy-900">
              <span className="font-display text-4xl font-extrabold text-white/15 sm:text-5xl" aria-hidden="true">
                {store.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-navy/60 via-transparent to-transparent sm:rounded-none" />
        </div>

        <div className="absolute left-2 top-2 sm:left-4 sm:top-3">
          <OpenBadge isOpen={store.isOpen} className="bg-white/95 shadow-sm backdrop-blur" />
        </div>

        {/* Kode toko: di desktop tampil di cover, di mobile pindah ke kolom info */}
        <span className="absolute right-3 top-3 hidden rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur sm:block">
          {store.code}
        </span>

        {/* Logo kecil menempel di sudut cover (mobile) */}
        <StoreLogo store={store} className="absolute -bottom-1.5 -right-1.5 h-9 w-9 text-sm ring-[3px] ring-white sm:hidden" />
      </div>

      {/* Info */}
      <div className="relative flex min-w-0 flex-1 flex-col py-0.5 sm:px-5 sm:pb-5 sm:pt-0">
        <div className="hidden items-end justify-between gap-2 sm:-mt-7 sm:flex">
          <StoreLogo store={store} className="h-14 w-14 text-xl ring-4 ring-white" />
          <span className="mb-0.5 inline-flex items-center gap-1 text-xs font-semibold text-navy/65">
            <Package size={13} /> {store.productCount ?? 0} produk
          </span>
        </div>

        <p className="text-[10px] font-bold tracking-[0.14em] text-navy/40 sm:hidden">{store.code}</p>

        <h3 className="mt-0.5 flex items-center gap-1.5 font-display text-base font-extrabold leading-tight text-navy sm:mt-3">
          <span className="truncate">{store.name}</span>
          <ArrowUpRight size={15} className="shrink-0 text-navy/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-navy/65 sm:min-h-[2.5rem] sm:text-[13px]">
          {store.bio || "Lihat menu dan informasi dari booth ini."}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2.5 text-[11px] font-semibold text-navy/65 sm:mt-3 sm:justify-between sm:border-t sm:border-dashed sm:border-navy/[0.08] sm:pt-3">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} className="text-navy/40" /> {store.kelas}
          </span>
          <span className="inline-flex items-center gap-1 sm:hidden">
            <Package size={12} className="text-navy/40" /> {store.productCount ?? 0} produk
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Users size={12} className="text-navy/40" /> {store.members?.length || 0} anggota
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              sold ? "bg-emerald-50 text-emerald-700" : "bg-accent-50 text-accent-700"
            }`}
          >
            {sold || "Baru"}
          </span>
        </div>
      </div>
    </Link>
  );
}