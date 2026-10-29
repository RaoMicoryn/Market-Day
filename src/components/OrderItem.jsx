import { Minus, Plus } from "lucide-react";
import ProductImage from "./ProductImage";
import { formatRupiah, optionsText } from "../data/products";

const qtyBtn =
  "flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy transition duration-200 hover:bg-accent hover:text-white active:scale-90";

export default function OrderItem({ item, onChangeQty, onNote }) {
  const { product, qty, options, unit, note } = item;
  return (
    <li className="rounded-2xl border border-navy/[0.06] bg-white p-3 sm:p-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <ProductImage product={product} className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-navy sm:text-base">{product.name}</h3>
          {optionsText(options) && <p className="truncate text-[11px] text-navy/65">{optionsText(options)}</p>}
          <p className="mt-1 text-sm font-extrabold text-price">{formatRupiah(unit)}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onChangeQty(item.key, 1)}
              aria-label={`Tambah ${product.name}`}
              className={qtyBtn}
            >
              <Plus size={14} strokeWidth={3} />
            </button>
            <span className="w-5 text-center text-sm font-bold text-navy" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onChangeQty(item.key, -1)}
              aria-label={`Kurangi ${product.name}`}
              className={qtyBtn}
            >
              <Minus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
      <input
        value={note}
        onChange={(e) => onNote(item.key, e.target.value)}
        maxLength={80}
        placeholder="Catatan untuk item ini (mis. tanpa saus)"
        aria-label={`Catatan untuk ${product.name}`}
        className="mt-3 w-full rounded-lg border border-navy/[0.08] bg-navy/[0.02] px-3 py-2 text-xs outline-none transition placeholder:text-navy/65 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
      />
    </li>
  );
}
