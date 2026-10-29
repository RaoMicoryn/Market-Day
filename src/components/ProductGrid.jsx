import ProductCard from "./ProductCard";
import { CATEGORY_META } from "../data/products";

export default function ProductGrid({ title, products, onAdd, onSelect, showStore = false }) {
  if (!products.length) return null;
  return (
    <section className="shell pb-10 pt-8">
      <div className="mb-5 flex items-center gap-3">
        {CATEGORY_META[title] && (
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xl shadow-soft" aria-hidden="true">
            {CATEGORY_META[title].emoji}
          </span>
        )}
        <div>
          <h2 className="font-display text-xl font-extrabold text-navy sm:text-2xl">{title}</h2>
          <p className="text-xs text-navy/65">{products.length} produk</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} onSelect={onSelect} showStore={showStore} />
        ))}
      </div>
    </section>
  );
}
