import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ReceiptText, ShoppingBag, Trash2, X } from "lucide-react";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";
import { useConfirm } from "../context/ConfirmContext";
import { formatRupiah, optionsText } from "../data/products";

export default function CartDrawer() {
  const {
    cart,
    groups,
    total,
    cartCount,
    changeQty,
    removeItem,
    clear,
    drawerOpen,
    closeDrawer,
    trackIds,
    openTracker,
  } = useCart();
  const navigate = useNavigate();
  const confirm = useConfirm();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeDrawer]);

  const btn = "flex h-7 w-7 items-center justify-center rounded-full bg-navy-50 text-navy transition hover:bg-accent hover:text-white active:scale-90";

  const emptyAll = async () => {
    const ok = await confirm({
      title: "Kosongkan keranjang?",
      message: "Semua produk yang sudah kamu pilih akan dihapus.",
      confirmLabel: "Ya, kosongkan",
      danger: true,
    });
    if (ok) clear();
  };

  return (
    <div className={`fixed inset-0 z-[120] ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div
        onClick={closeDrawer}
        className={`absolute inset-0 bg-navy-900/45 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang belanja"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-lift transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-navy/[0.06] bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-navy">
              Keranjang <span className="text-sm font-semibold text-navy/65">({cartCount})</span>
            </h2>
            <p className="text-[11px] text-navy/65">Pesanan dipisah otomatis per toko</p>
          </div>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={emptyAll}
                className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-navy/65 transition hover:bg-red-50 hover:text-red-700"
              >
                Kosongkan
              </button>
            )}
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Tutup keranjang"
              className="rounded-full p-2 text-navy/65 transition hover:bg-navy/5 hover:text-navy"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {groups.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-navy/20 shadow-soft">
                <ShoppingBag size={34} />
              </span>
              <div>
                <p className="font-display text-base font-bold text-navy">Keranjangmu masih kosong</p>
                <p className="mt-1 text-xs text-navy/65">Yuk pilih jajanan favoritmu dari booth hari ini.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  navigate("/cari");
                }}
                className="btn-accent"
              >
                Mulai belanja <ArrowRight size={15} />
              </button>
            </div>
          )}

          {groups.map((g) => (
            <section key={g.id}>
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy/65">{g.name}</h3>
                <span className="text-[11px] font-semibold text-navy/65">{g.items.length} item</span>
              </div>
              <ul className="space-y-2">
                {g.items.map((i) => {
                  const productQty = cart.reduce(
                    (totalQty, item) => totalQty + (item.product.id === i.product.id ? item.qty : 0),
                    0
                  );
                  return (
                    <li key={i.key} className="relative flex gap-3 rounded-2xl border border-navy/[0.05] bg-white p-2.5 shadow-soft">
                      <ProductImage product={i.product} className="h-16 w-16 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate pr-5 text-sm font-bold text-navy">{i.product.name}</p>
                        {optionsText(i.options) && (
                          <p className="truncate text-[11px] text-navy/65">{optionsText(i.options)}</p>
                        )}
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-sm font-extrabold text-price">{formatRupiah(i.unit * i.qty)}</span>
                          <span className="flex items-center gap-1.5">
                            <button type="button" onClick={() => changeQty(i.key, -1)} aria-label={`Kurangi ${i.product.name}`} className={btn}>
                              <Minus size={12} />
                            </button>
                            <span className="w-4 text-center text-xs font-bold text-navy">{i.qty}</span>
                            <button
                              type="button"
                              onClick={() => changeQty(i.key, 1)}
                              aria-label={`Tambah ${i.product.name}`}
                              disabled={i.product.stockQuantity != null && productQty >= i.product.stockQuantity}
                              className={`${btn} disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              <Plus size={12} />
                            </button>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(i.key)}
                        aria-label={`Hapus ${i.product.name}`}
                        className="absolute right-2 top-2 rounded-full p-1 text-navy/25 transition hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {cart.length > 0 && (
          <footer className="safe-bottom space-y-3 border-t border-navy/[0.06] bg-white p-4">
            {trackIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  openTracker();
                }}
                className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-price hover:underline"
              >
                <ReceiptText size={14} /> Lacak pesanan terakhir
              </button>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-navy/65">Subtotal</span>
              <b className="text-xl font-extrabold text-price">{formatRupiah(total)}</b>
            </div>
            <p className="text-[11px] leading-relaxed text-navy/65">
              Pembayaran dilakukan di booth. Tidak ada biaya tambahan dari aplikasi.
            </p>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                navigate("/checkout");
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-bold text-white shadow-soft transition duration-300 hover:bg-navy-700 active:scale-[0.98]"
            >
              Lanjut ke checkout <ArrowRight size={16} />
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
