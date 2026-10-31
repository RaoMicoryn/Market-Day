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
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-navy/[0.06] bg-white shadow-soft outline-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.99] sm:rounded-3xl"
    >
      <div className={`relative ${soldOut ? "opacity-70" : ""}`}>
        <ProductImage product={product} zoom className="aspect-square" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/30 to-transparent" />

        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-navy shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
          <span aria-hidden="true">{meta?.emoji}</span> {meta?.short || product.category}
        </span>

        <HeartButton product={product} className="absolute right-2 top-2 !h-9 !w-9 sm:right-2.5 sm:top-2.5" size={15} />

        {product.sold >= 5 && !soldOut && (
          <span className="absolute bottom-2 left-2 rounded-full bg-navy/85 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur sm:bottom-2.5 sm:left-3 sm:px-2 sm:py-1 sm:text-[10px]">
            🔥 Laris · {product.sold}
          </span>
        )}
        {!product.sold && isNew(product.createdAt) && !soldOut && (
          <span className="absolute bottom-2 left-2 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold text-white sm:bottom-2.5 sm:left-3 sm:px-2 sm:py-1 sm:text-[10px]">
            Baru
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-navy-900/35">
            <span className="rotate-[-4deg] rounded-lg border-2 border-white/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white sm:px-3 sm:text-xs">
              Habis
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-navy sm:line-clamp-1 sm:text-[15px]">{product.name}</h3>
        {showStore && product.storeName && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium text-navy/65 sm:text-[11px]">
            <Store size={10} /> {product.storeName}
          </p>
        )}
        {product.stockQuantity != null && (
          <p className="mt-0.5 text-[9px] font-semibold text-navy/65 sm:mt-1 sm:text-[10px]">
            {product.stockQuantity > 0 ? `Sisa ${product.stockQuantity}` : "Stok habis"}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-1.5 pt-2 sm:pt-2.5">
          <p className="text-[13px] font-extrabold leading-none text-price sm:text-base">{formatRupiah(product.price)}</p>
          <button
            type="button"
            disabled={soldOut}
            onClick={stop(onAdd)}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-glow transition duration-200 hover:bg-price active:scale-90 disabled:cursor-not-allowed disabled:bg-navy/15 disabled:text-navy/65 disabled:shadow-none sm:h-10 sm:w-auto sm:gap-1.5 sm:px-4"
          >
            <ShoppingBag size={14} className="hidden sm:block" />
            <span className="hidden sm:inline">{soldOut ? "Habis" : "Tambah"}</span>
            <Plus size={16} className="sm:hidden" />
          </button>
        </div>
      </div>
    </article>
  );
}
