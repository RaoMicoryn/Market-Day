import { useCallback, useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Store, X } from "lucide-react";
import ProductImage from "./ProductImage";
import HeartButton from "./ui/HeartButton";
import { ICE_LEVELS, formatRupiah, hasIce, unitPrice } from "../data/products";

const DURATION = 250;

function Choice({ label, options, value, onChange }) {
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-[13px] font-bold text-navy">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={`min-h-10 rounded-full border px-3.5 text-[13px] font-semibold transition duration-200 active:scale-95 sm:min-h-9 sm:text-xs ${
              value === o
                ? "border-navy bg-navy text-white shadow-sm"
                : "border-navy/10 bg-white text-navy/60 hover:border-accent/50 hover:text-navy"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function ProductModal({ product, onClose, onAdd, onBuy }) {
  const [open, setOpen] = useState(false);
  const [ice, setIce] = useState(ICE_LEVELS[0]);
  const [toppings, setToppings] = useState([]);
  const [qty, setQty] = useState(1);
  const soldOut = product.inStock === false;
  const closed = product.storeOpen === false;
  const disabled = soldOut || closed;
  const maxQty = product.stockQuantity == null ? 99 : Math.min(99, product.stockQuantity);

  const options = {
    ...(hasIce(product.category) ? { ice } : {}),
    toppings,
  };
  const lineTotal = unitPrice(product.price, options) * qty;
  const toppingList = product.toppings || [];

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(onClose, DURATION);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  const toggleTopping = (t) =>
    setToppings((cur) => (cur.some((x) => x.name === t.name) ? cur.filter((x) => x.name !== t.name) : [...cur, t]));

  const addToCart = () => {
    if (disabled) return;
    if (onAdd(product, { options, qty }) === false) return;
    close();
  };
  const buyNow = () => {
    if (disabled) return;
    setOpen(false);
    setTimeout(() => {
      onClose();
      onBuy(product, { options, qty });
    }, DURATION);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-navy-900/60 backdrop-blur-md transition-opacity duration-[250ms] sm:items-center sm:p-4 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[30px] border border-white/60 bg-white shadow-lift ring-1 ring-navy/[0.04] transition duration-[250ms] ease-out sm:max-h-[88vh] sm:rounded-[30px] ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-navy/15 sm:hidden" aria-hidden="true" />
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <HeartButton product={product} className="!h-10 !w-10" />
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-navy shadow-soft backdrop-blur transition duration-300 hover:rotate-90 hover:bg-white active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scroll-contain overflow-y-auto">
          <div className="relative">
            <ProductImage product={product} className="aspect-[4/3] sm:aspect-[16/10]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" aria-hidden="true" />
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy/60">
                  {product.category}
                </p>
                <h3 id="product-modal-title" className="font-display text-xl font-extrabold leading-tight tracking-tight text-navy">
                  {product.name}
                </h3>
                {product.storeName && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-navy/55">
                    <Store size={12} /> {product.storeName}
                  </p>
                )}
              </div>
              <p className="tnum shrink-0 rounded-full bg-accent-50 px-3 py-1.5 text-base font-extrabold text-price">{formatRupiah(product.price)}</p>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-navy/60">{product.description}</p>
            {product.stockQuantity != null && product.stockQuantity > 0 && (
              <p className="tnum mt-2 text-xs font-semibold text-navy/55">Stok tersisa: {product.stockQuantity}</p>
            )}

            {closed && (
              <p className="mt-4 rounded-2xl bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                Toko sedang tutup. Kamu masih bisa melihat menu, tapi belum bisa memesan.
              </p>
            )}

            {hasIce(product.category) && <Choice label="Level es" options={ICE_LEVELS} value={ice} onChange={setIce} />}

            {toppingList.length > 0 && (
              <fieldset className="mt-4">
                <legend className="mb-2 text-[13px] font-bold text-navy">Extra topping</legend>
                <div className="space-y-2">
                  {toppingList.map((t) => {
                    const checked = toppings.some((x) => x.name === t.name);
                    return (
                      <label
                        key={t.name}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3.5 py-2.5 text-sm transition duration-200 ${
                          checked ? "border-accent/60 bg-accent-50 shadow-[0_0_0_3px_rgba(194,65,12,.06)]" : "border-navy/10 bg-white hover:border-accent/40"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 font-medium text-navy/80">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTopping(t)}
                            className="h-4 w-4 accent-orange-500"
                          />
                          {t.name}
                        </span>
                        <span className="font-bold text-price">+{formatRupiah(t.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>
        </div>

        <div className="border-t border-navy/[0.07] bg-gradient-to-b from-white to-cream/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Kurangi jumlah"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/10 bg-white text-navy shadow-sm transition duration-200 hover:bg-navy-50 active:scale-90"
              >
                <Minus size={16} />
              </button>
              <span className="tnum w-7 text-center text-base font-extrabold text-navy" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                aria-label="Tambah jumlah"
                disabled={qty >= maxQty}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/10 bg-white text-navy shadow-sm transition duration-200 hover:bg-navy-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/50">Subtotal</p>
              <p className="tnum text-base font-extrabold text-price">{formatRupiah(lineTotal)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={addToCart}
              aria-label="Tambah ke keranjang"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-glow transition duration-300 hover:-translate-y-0.5 active:scale-90 disabled:cursor-not-allowed disabled:bg-navy/15 disabled:text-navy/55 disabled:shadow-none"
              style={{ backgroundImage: "linear-gradient(180deg,#ea580c 0%,#c2410c 62%,#9a3412 100%)" }}
            >
              <ShoppingBag size={20} />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={buyNow}
              className="h-12 flex-1 rounded-full text-sm font-bold text-white shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-navy/15 disabled:text-navy/55 disabled:shadow-none"
              style={{ backgroundImage: "linear-gradient(180deg,#163a63 0%,#0b2545 58%,#071a33 100%)" }}
            >
              {closed ? "Toko tutup" : soldOut ? "Stok habis" : "Beli sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
