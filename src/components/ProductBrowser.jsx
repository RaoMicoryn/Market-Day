import { useEffect, useState } from "react";
import { ArrowDownWideNarrow, SearchX, SlidersHorizontal } from "lucide-react";
import CategoryChips from "./CategoryChips";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import EmptyState from "./ui/EmptyState";
import { GridSkeleton } from "./ui/Skeletons";
import { SORT_OPTIONS } from "../data/products";
import { searchProducts } from "../db/repository";
import { useDb } from "../db/useDb";
import { useShopping } from "../hooks/useShopping";

const PAGE = 12;

export default function ProductBrowser({ title, q = "", initialCategory = "" }) {
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("recommended");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const { selected, setSelected, onAdd, onBuy } = useShopping();

  useEffect(() => setCategory(initialCategory), [initialCategory]);
  useEffect(() => setLimit(PAGE), [q, category, sort, onlyOpen, onlyAvailable]);

  const { data: products, loading } = useDb(
    () => searchProducts({ q, category, sort, onlyOpen, onlyAvailable }),
    [q, category, sort, onlyOpen, onlyAvailable]
  );

  const rows = products || [];
  const visible = rows.slice(0, limit);
  const filtered = category || onlyOpen || onlyAvailable;

  const toggle = (active, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition active:scale-95 ${
        active
          ? "border-accent bg-accent-50 text-price"
          : "border-navy/10 bg-white text-navy/65 hover:border-accent/40 hover:text-navy"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-navy/20"}`} />
      {label}
    </button>
  );

  return (
    <section className="shell pb-8 pt-6 sm:pb-14 sm:pt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-1 text-sm text-navy/65">
            {loading ? "Memuat produk..." : `${rows.length} produk dari ${new Set(rows.map((p) => p.storeName)).size || 0} toko`}
          </p>
        </div>

        <label className="relative inline-flex items-center gap-2 text-xs font-semibold text-navy/65">
          <ArrowDownWideNarrow size={14} className="text-navy/65" />
          <span className="sr-only">Urutkan produk</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="min-h-10 cursor-pointer appearance-none rounded-full border border-navy/10 bg-white py-2 pl-3 pr-8 text-base font-semibold text-navy shadow-sm outline-none transition hover:border-accent/40 focus:border-accent sm:min-h-0 sm:text-xs"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 text-[9px] text-navy/65">▼</span>
        </label>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CategoryChips value={category} onChange={setCategory} />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-navy/65 sm:inline-flex">
            <SlidersHorizontal size={12} /> Filter
          </span>
          {toggle(onlyAvailable, () => setOnlyAvailable((v) => !v), "Tersedia")}
          {toggle(onlyOpen, () => setOnlyOpen((v) => !v), "Toko buka")}
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setOnlyOpen(false);
                setOnlyAvailable(false);
              }}
              className="text-xs font-semibold text-price hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <GridSkeleton count={8} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Produk tidak ditemukan"
          description="Coba kata kunci lain atau hapus filter yang aktif. Mungkin menu ini sedang tidak dijual hari ini."
          action={
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setOnlyOpen(false);
                setOnlyAvailable(false);
              }}
              className="btn-ghost"
            >
              Reset filter
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} showStore onAdd={onAdd} onSelect={setSelected} />
            ))}
          </div>
          {rows.length > visible.length && (
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="btn-ghost w-full sm:w-auto">
                Muat {Math.min(PAGE, rows.length - visible.length)} produk lagi
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <ProductModal key={selected.id} product={selected} onAdd={onAdd} onBuy={onBuy} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
