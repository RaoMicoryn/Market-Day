import { useCallback, useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Store, X } from "lucide-react";
import ProductImage from "./ProductImage";
import HeartButton from "./ui/HeartButton";
import { ICE_LEVELS, SPICY_LEVELS, formatRupiah, hasIce, hasSpicy, unitPrice } from "../data/products";

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
            className={`min-h-9 rounded-full border px-3.5 text-xs font-semibold transition duration-200 ${
              value === o
                ? "border-navy bg-navy text-white shadow-sm"
                : "border-navy/10 bg-white text-navy/65 hover:border-accent/50 hover:text-navy"
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
  const [spicy, setSpicy] = useState(SPICY_LEVELS[0]);
  const [toppings, setToppings] = useState([]);
  const [qty, setQty] = useState(1);
  const soldOut = product.inStock === false;
  const closed = product.storeOpen === false;
  const disabled = soldOut || closed;

  const options = {
    ...(hasIce(product.category) ? { ice } : {}),
    ...(hasSpicy(product.category) ? { spicy } : {}),
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
    onAdd(product, { options, qty });
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
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-navy-900/55 backdrop-blur-sm transition-opacity duration-[250ms] sm:items-center sm:p-4 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-lift transition duration-[250ms] ease-out sm:rounded-[28px] ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
        }`}
      >
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <HeartButton product={product} />
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-navy shadow-soft backdrop-blur transition duration-300 hover:rotate-90 hover:bg-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          <ProductImage product={product} className="aspect-[16/10]" />
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy/65">
                  {product.category}
                </p>
                <h3 id="product-modal-title" className="text-xl font-extrabold leading-tight text-navy">
                  {product.name}
                </h3>
                {product.storeName && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-navy/65">
                    <Store size={12} /> {product.storeName}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-lg font-extrabold text-price">{formatRupiah(product.price)}</p>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-navy/65">{product.description}</p>

            {closed && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                Toko sedang tutup. Kamu masih bisa melihat menu, tapi belum bisa memesan.
              </p>
            )}

            {hasIce(product.category) && <Choice label="Level es" options={ICE_LEVELS} value={ice} onChange={setIce} />}
            {hasSpicy(product.category) && (
              <Choice label="Level pedas" options={SPICY_LEVELS} value={spicy} onChange={setSpicy} />
            )}

            {toppingList.length > 0 && (
              <fieldset className="mt-4">
                <legend className="mb-2 text-[13px] font-bold text-navy">Extra topping</legend>
                <div className="space-y-2">
                  {toppingList.map((t) => {
                    const checked = toppings.some((x) => x.name === t.name);
                    return (
                      <label
                        key={t.name}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
                          checked ? "border-accent bg-accent-50" : "border-navy/10 hover:border-accent/40"
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

        <div className="border-t border-navy/[0.06] bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Kurangi jumlah"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy transition hover:bg-navy-100"
              >
                <Minus size={15} />
              </button>
              <span className="w-6 text-center text-sm font-extrabold text-navy" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                aria-label="Tambah jumlah"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy transition hover:bg-navy-100"
              >
                <Plus size={15} />
              </button>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/65">Subtotal</p>
              <p className="text-base font-extrabold text-price">{formatRupiah(lineTotal)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={addToCart}
              aria-label="Tambah ke keranjang"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-glow transition duration-300 hover:scale-105 hover:bg-price disabled:cursor-not-allowed disabled:bg-navy/15 disabled:text-navy/65 disabled:shadow-none"
            >
              <ShoppingBag size={19} />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={buyNow}
              className="h-11 flex-1 rounded-full bg-navy text-sm font-bold text-white transition duration-300 hover:bg-navy-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-navy/15 disabled:text-navy/65"
            >
              {closed ? "Toko tutup" : soldOut ? "Stok habis" : "Beli sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
