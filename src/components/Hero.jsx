import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Store } from "lucide-react";
import { formatRupiah } from "../data/products";
import ProductImage from "./ProductImage";
import { getMarketStats, searchProducts } from "../db/repository";
import { useDb } from "../db/useDb";

export default function Hero() {
  const { data } = useDb(async () => {
    const [products, stats] = await Promise.all([
      searchProducts({ onlyOpen: true, onlyAvailable: true }),
      getMarketStats(),
    ]);
    return { product: products[0] || null, stats };
  });
  const { product, stats } = data || {};

  return (
    <section className="shell pt-3 sm:pt-8">
      <div className="relative overflow-hidden rounded-[26px] bg-navy text-white shadow-lift sm:rounded-[36px]">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-7 px-5 pb-6 pt-7 sm:gap-10 sm:px-10 sm:pb-10 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-14 lg:py-16">
          <div className="animate-rise">
            <p className="mb-3 flex max-w-full flex-wrap items-center gap-x-1 text-[9px] leading-relaxed text-white/50 sm:mb-4 sm:text-[10px]">
              <span className="font-medium text-white/65">Dibuat oleh Kyo.Motion</span>
              <span aria-hidden="true">·</span>
              <span>WB, Steven, Cherryl</span>
            </p>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur sm:text-[11px]">
              <Sparkles size={12} className="text-accent-300" />
              Jajanan dari berbagai booth
            </span>

            <h1 className="mt-4 font-display text-[2.15rem] font-extrabold leading-[1.03] tracking-tight text-balance sm:mt-5 sm:text-6xl lg:text-[4.2rem]">
              <span className="text-white">Jajan favoritmu,</span>
              <br />
              <span className="relative inline-block text-accent-300">
                tanpa antre.
                <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" aria-hidden="true">
                  <path d="M2 7.5C48 3 100 2.5 198 6.5" stroke="#F97316" strokeWidth="4" strokeLinecap="round" opacity=".7" />
                </svg>
              </span>
            </h1>

            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/60 sm:mt-5 sm:text-base">
              Pesan dari berbagai booth sekaligus, dapat nomor antrean, lalu ambil saat pesanan siap.
              Nggak perlu berdiri lama di depan booth.
            </p>

            <div className="mt-5 flex gap-2 sm:mt-7 sm:flex-wrap sm:gap-2.5">
              <Link
                to="/cari"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-white shadow-glow transition duration-300 hover:bg-price active:scale-[0.98] sm:min-h-11 sm:flex-none sm:px-6"
              >
                Jelajahi menu <ArrowRight size={16} />
              </Link>
              <a
                href="#kode-toko"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white/85 backdrop-blur transition duration-300 hover:border-white/40 hover:bg-white/10 active:scale-[0.98] sm:min-h-11 sm:flex-none sm:px-5"
              >
                <Store size={15} /> Kode toko
              </a>
            </div>

            <dl className="mt-6 grid max-w-md grid-cols-3 gap-2 border-t border-white/10 pt-4 sm:mt-8 sm:gap-3 sm:pt-5">
              {[
                { label: "Booth buka", value: stats?.stores ?? "—" },
                { label: "Menu", value: stats?.products ?? "—" },
                { label: "Terjual", value: stats?.sold ?? "—" },
              ].map((s) => (
                <div key={s.label}>
                  <dd className="font-display text-xl font-extrabold text-white sm:text-3xl">{s.value}</dd>
                  <dt className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55 sm:text-[10px]">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border border-white/15 bg-navy-700 shadow-lift sm:aspect-[4/3.6] sm:rounded-[26px] lg:aspect-[4/4.2]">
              {product ? (
                <>
                  <ProductImage product={product} className="absolute inset-0 h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/10 to-transparent" />

                  <Link
                    to={`/toko/${product.storeSlug}`}
                    className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-navy-900/55 p-3 backdrop-blur-md active:scale-[0.99] sm:inset-x-4 sm:bottom-4 sm:p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold text-white sm:text-base">{product.name}</p>
                        <p className="truncate text-[10px] text-white/60 sm:text-[11px]">{product.storeName}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-extrabold text-accent-300 sm:text-sm">{formatRupiah(product.price)}</p>
                        <p className="text-[9px] font-semibold text-white/60 sm:text-[10px]">{product.category}</p>
                      </div>
                    </div>
                  </Link>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-navy-700 via-navy to-navy-900 p-6 text-center">
                  <Store size={30} className="text-accent-300" />
                  <p className="mt-3 font-display text-base font-bold text-white sm:mt-4 sm:text-lg">Belum ada menu</p>
                  <p className="mt-1 max-w-xs text-xs text-white/60 sm:text-sm">
                    Menu dari booth yang buka akan tampil di sini.
                  </p>
                  <Link to="/cari" className="mt-4 text-sm font-bold text-accent-300 hover:text-white">
                    Lihat katalog
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
