import { Plus, ShoppingBag, Store } from "lucide-react";
import ProductImage from "./ProductImage";
import HeartButton from "./ui/HeartButton";
import { CATEGORY_META, formatRupiah } from "../data/products";

const isNew = (iso) => iso && Date.now() - new Date(iso).getTime() < 7 * 864e5;

export default function ProductCard({ product, onAdd, onSelect, showStore = false }) {
  const soldOut = product.inStock === false;
  const meta = CATEGORY_META[product.category];
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn(product);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(product);
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-navy/[0.06] bg-white shadow-soft outline-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className={`relative ${soldOut ? "opacity-70" : ""}`}>
        <ProductImage product={product} zoom className="aspect-[4/3] sm:aspect-square" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/30 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-navy shadow-sm backdrop-blur">
          <span aria-hidden="true">{meta?.emoji}</span> {meta?.short || product.category}
        </span>

        <HeartButton product={product} className="absolute right-2.5 top-2.5" />

        {product.sold >= 5 && !soldOut && (
          <span className="absolute bottom-2.5 left-3 rounded-full bg-navy/85 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            🔥 Laris · {product.sold} terjual
          </span>
        )}
        {!product.sold && isNew(product.createdAt) && !soldOut && (
          <span className="absolute bottom-2.5 left-3 rounded-full bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white">
            Baru
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-navy-900/35">
            <span className="rotate-[-4deg] rounded-lg border-2 border-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white">
              Habis
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-navy sm:text-[15px]">{product.name}</h3>
        {showStore && product.storeName && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-navy/65">
            <Store size={11} /> {product.storeName}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <p className="text-sm font-extrabold text-price sm:text-base">{formatRupiah(product.price)}</p>
          <button
            type="button"
            disabled={soldOut}
            onClick={stop(onAdd)}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-bold text-white shadow-glow transition duration-200 hover:bg-price active:scale-90 disabled:cursor-not-allowed disabled:bg-navy/15 disabled:text-navy/65 disabled:shadow-none sm:h-10 sm:px-4"
          >
            <ShoppingBag size={14} />
            <span className="hidden sm:inline">{soldOut ? "Habis" : "Tambah"}</span>
            <Plus size={14} className="sm:hidden" />
          </button>
        </div>
      </div>
    </article>
  );
}
