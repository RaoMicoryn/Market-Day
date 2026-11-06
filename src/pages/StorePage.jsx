import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  Package,
  Search,
  Share2,
  Users,
} from "lucide-react";
import CategoryChips from "../components/CategoryChips";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import EmptyState from "../components/ui/EmptyState";
import { OpenBadge, StoreLogo } from "../components/StoreCard";
import { GridSkeleton } from "../components/ui/Skeletons";
import { SORT_OPTIONS, formatRupiah } from "../data/products";
import { getProducts, getStoreBySlug } from "../db/repository";
import { useDb } from "../db/useDb";
import { useShopping } from "../hooks/useShopping";
import { copyText } from "../utils/clipboard";
import { useToast } from "../context/ToastContext";

export default function StorePage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recommended");
  const { selected, setSelected, onAdd, onBuy } = useShopping();

  const { data: store, loading } = useDb(() => getStoreBySlug(slug), [slug]);
  const { data: products, loading: loadingProducts } = useDb(
    () => (store ? getProducts(store.id) : Promise.resolve([])),
    [store?.id]
  );

  const items = useMemo(
    () =>
      (products || []).map((p) => ({
        ...p,
        storeName: store?.name,
        storeSlug: store?.slug,
        storeOpen: store?.isOpen,
      })),
    [products, store]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = items.filter(
      (p) =>
        (!category || p.category === category) &&
        (!term || [p.name, p.description].some((t) => t.toLowerCase().includes(term)))
    );
    const byName = (a, b) => a.name.localeCompare(b.name, "id");
    const sorters = {
      recommended: byName,
      newest: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      name: byName,
    };
    return rows.sort(sorters[sort] || byName);
  }, [items, category, q, sort]);

  // Buka detail produk dari URL (?produk=p1) — dipakai hasil pencarian global.
  useEffect(() => {
    const id = params.get("produk");
    if (!id || !items.length) return;
    const p = items.find((x) => x.id === id);
    if (p) setSelected(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, params]);

  const closeModal = () => {
    setSelected(null);
    if (params.get("produk")) {
      const next = new URLSearchParams(params);
      next.delete("produk");
      setParams(next, { replace: true });
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/toko/${store.slug}`;
    const ok = await copyText(url);
    if (ok) toast("Link toko disalin", { type: "success", duration: 2000 });
  };

  if (loading) return <div className="shell py-16"><GridSkeleton count={6} /></div>;

  if (!store)
    return (
      <div className="shell py-20">
        <EmptyState
          icon={MapPin}
          title="Toko tidak ditemukan"
          description="Mungkin link sudah berubah atau kode toko salah. Coba jelajahi booth lain."
          action={<Link to="/" className="btn-primary">Kembali ke beranda</Link>}
        />
      </div>
    );

  const groups = ["Makanan Berat", "Minuman", "Snack", "Paket Bundling"]
    .map((c) => ({ title: c, products: filtered.filter((p) => p.category === c) }))
    .filter((g) => g.products.length);

  return (
    <>
      <section className="relative overflow-hidden bg-navy">
        <div className="relative h-44 overflow-hidden sm:h-64">
          {store.cover ? (
            <img src={store.cover} alt="" className="h-full w-full scale-105 object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-navy-600 via-navy to-navy-900" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20" />
          <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        </div>

        <div className="shell relative -mt-24 pb-6 sm:-mt-32 sm:pb-8">
          <Link
            to="/"
            className="mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85 shadow-sm backdrop-blur transition duration-200 hover:bg-white/20 hover:text-white active:scale-95 sm:mb-4"
          >
            <ArrowLeft size={13} /> Semua booth
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="flex items-end gap-3 sm:gap-4">
              <StoreLogo store={store} className="h-16 w-16 text-xl shadow-lift ring-[3px] ring-white/95 sm:h-24 sm:w-24 sm:text-3xl sm:ring-4" />
              <div className="min-w-0 pb-0.5 sm:pb-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-white sm:text-4xl">{store.name}</h1>
                  <OpenBadge isOpen={store.isOpen} className="bg-white/90 shadow-sm" />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold text-white/70 sm:gap-x-3 sm:text-xs">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {store.kelas}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={11} /> {store.members?.join(", ")}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 tracking-widest">{store.code}</span>
                </p>
              </div>
            </div>

            <button type="button" onClick={share} className="inline-flex min-h-10 w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-semibold text-white shadow-sm backdrop-blur transition duration-200 hover:bg-white/20 active:scale-95 sm:text-xs">
              <Share2 size={14} /> Bagikan toko
            </button>
          </div>

          {store.bio && <p className="mt-3 line-clamp-3 max-w-2xl text-[13px] leading-relaxed text-white/70 sm:mt-4 sm:text-sm">{store.bio}</p>}

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:max-w-md sm:gap-3">
            {[
              { icon: Package, label: "Menu", value: store.productCount ?? items.length },
              { icon: BadgeCheck, label: "Terjual", value: store.soldCount ?? 0 },
              { icon: Clock3, label: "Pesanan", value: store.orderCount ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.08] px-2.5 py-2.5 text-white shadow-sm backdrop-blur-md transition duration-200 hover:bg-white/[0.14] sm:px-3.5 sm:py-3">
                <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-white/60 sm:text-[10px]">
                  <s.icon size={10} /> {s.label}
                </p>
                <p className="tnum font-display text-base font-extrabold sm:text-lg">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!store.isOpen && (
        <p className="mt-6 border-y border-red-100 bg-red-50/80 py-2.5 text-center text-xs font-semibold text-red-700 backdrop-blur">
          Toko sedang tutup. Kamu bisa lihat menu, tapi pesanan belum bisa dibuat.
        </p>
      )}

      <section className="shell pt-4 sm:pt-8">
        <div className="glass-bar sticky top-16 z-40 -mx-4 border-b px-4 pb-2.5 pt-2 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <CategoryChips value={category} onChange={setCategory} className="lg:order-1" />
            <div className="flex items-center gap-2 lg:order-2">
              <label className="relative flex-1 lg:w-56">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari di toko ini..."
                  aria-label="Cari produk di toko ini"
                  className="h-10 w-full rounded-full border border-navy/10 bg-white pl-9 pr-3 text-base shadow-sm outline-none transition placeholder:text-navy/50 hover:border-navy/20 focus:border-accent focus:ring-4 focus:ring-accent/10 sm:h-9 sm:text-xs"
                />
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Urutkan produk"
                className="h-10 max-w-[7.75rem] cursor-pointer rounded-full border border-navy/10 bg-white px-3 text-base font-semibold text-navy shadow-sm outline-none hover:border-navy/20 focus:border-accent sm:h-9 sm:max-w-none sm:text-xs"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loadingProducts ? (
          <div className="pt-6 sm:pt-8"><GridSkeleton count={6} /></div>
        ) : filtered.length === 0 ? (
          <div className="pt-6 sm:pt-8">
            <EmptyState
              icon={Search}
              title={q ? `Tidak ada hasil untuk “${q}”` : "Belum ada produk di kategori ini"}
              description="Coba kata kunci lain atau pilih kategori berbeda."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setCategory("");
                  }}
                  className="btn-ghost"
                >
                  Reset pencarian
                </button>
              }
            />
          </div>
        ) : sort === "recommended" && !q ? (
          groups.map((g) => (
            <div key={g.title} className="pt-7 sm:pt-9">
              <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight text-navy sm:text-xl">
                    <span className="h-4 w-1 rounded-full bg-gradient-to-b from-accent to-amber-400 sm:h-5" aria-hidden="true" />
                    {g.title}
                  </h2>
                  <p className="pl-3 text-[11px] text-navy/60">{g.products.length} menu</p>
                </div>
                <span className="tnum shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy/60 shadow-sm ring-1 ring-navy/[0.06]">
                  Mulai {formatRupiah(Math.min(...g.products.map((p) => p.price)))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {g.products.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={onAdd} onSelect={setSelected} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="pt-7 sm:pt-9">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
              <p className="tnum text-sm font-bold text-navy">{filtered.length} produk</p>
              <Link to="/cari" className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-price shadow-sm ring-1 ring-navy/[0.06] transition hover:ring-accent/30">
                Cari di semua booth <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={onAdd} onSelect={setSelected} />
              ))}
            </div>
          </div>
        )}
        <div className="h-8 sm:h-14" />
      </section>

      {selected && (
        <ProductModal key={selected.id} product={selected} onAdd={onAdd} onBuy={onBuy} onClose={closeModal} />
      )}
    </>
  );
}
