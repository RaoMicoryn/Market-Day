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
        <div className="relative h-44 overflow-hidden sm:h-60">
          {store.cover ? (
            <img src={store.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-navy-600 via-navy to-navy-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />
        </div>

        <div className="shell relative -mt-24 pb-7 sm:-mt-28">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft size={13} /> Semua booth
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <StoreLogo store={store} className="h-20 w-20 text-2xl ring-4 ring-white sm:h-24 sm:w-24 sm:text-3xl" />
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-extrabold text-white sm:text-4xl">{store.name}</h1>
                  <OpenBadge isOpen={store.isOpen} className="bg-white/90" />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-white/70 sm:text-xs">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {store.kelas}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} /> {store.members?.join(", ")}
                  </span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 tracking-widest">{store.code}</span>
                </p>
              </div>
            </div>

            <button type="button" onClick={share} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20">
              <Share2 size={14} /> Bagikan toko
            </button>
          </div>

          {store.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{store.bio}</p>}

          <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md sm:gap-3">
            {[
              { icon: Package, label: "Menu", value: store.productCount ?? items.length },
              { icon: BadgeCheck, label: "Terjual", value: store.soldCount ?? 0 },
              { icon: Clock3, label: "Pesanan", value: store.orderCount ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white backdrop-blur">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/65">
                  <s.icon size={11} /> {s.label}
                </p>
                <p className="font-display text-lg font-extrabold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!store.isOpen && (
        <p className="mt-6 border-y border-red-100 bg-red-50 py-2.5 text-center text-xs font-semibold text-red-700">
          Toko sedang tutup. Kamu bisa lihat menu, tapi pesanan belum bisa dibuat.
        </p>
      )}

      <section className="shell pt-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CategoryChips value={category} onChange={setCategory} className="lg:order-1" />
          <div className="flex items-center gap-2 lg:order-2">
            <label className="relative flex-1 lg:w-56">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari di toko ini..."
                aria-label="Cari produk di toko ini"
                className="h-9 w-full rounded-full border border-navy/10 bg-white pl-9 pr-3 text-xs outline-none transition placeholder:text-navy/65 focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Urutkan produk"
              className="h-9 cursor-pointer rounded-full border border-navy/10 bg-white px-3 text-xs font-semibold text-navy outline-none focus:border-accent"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingProducts ? (
          <div className="pt-8"><GridSkeleton count={6} /></div>
        ) : filtered.length === 0 ? (
          <div className="pt-8">
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
            <div key={g.title} className="pt-8">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-navy sm:text-xl">{g.title}</h2>
                  <p className="text-[11px] text-navy/65">{g.products.length} menu</p>
                </div>
                <span className="text-[11px] font-semibold text-navy/65">Mulai {formatRupiah(Math.min(...g.products.map((p) => p.price)))}</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                {g.products.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={onAdd} onSelect={setSelected} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="pt-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-navy">{filtered.length} produk</p>
              <Link to="/cari" className="inline-flex items-center gap-1 text-xs font-semibold text-price hover:underline">
                Cari di semua booth <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={onAdd} onSelect={setSelected} />
              ))}
            </div>
          </div>
        )}
        <div className="h-14" />
      </section>

      {selected && (
        <ProductModal key={selected.id} product={selected} onAdd={onAdd} onBuy={onBuy} onClose={closeModal} />
      )}
    </>
  );
}
