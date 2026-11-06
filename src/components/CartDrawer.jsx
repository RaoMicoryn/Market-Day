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

  const btn = "flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy transition hover:bg-accent hover:text-white active:scale-90 sm:h-7 sm:w-7";

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
        className={`absolute inset-0 bg-navy-900/60 backdrop-blur-md transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang belanja"
        className={`absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col border-l border-white/60 bg-cream/95 shadow-lift backdrop-blur-2xl transition-transform duration-300 ease-out sm:rounded-l-[30px] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-navy/[0.06] bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-navy">
              Keranjang <span className="tnum text-sm font-semibold text-navy/50">({cartCount})</span>
            </h2>
            <p className="text-[11px] text-navy/55">Pesanan dipisah otomatis per toko</p>
          </div>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={emptyAll}
                className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-navy/55 transition duration-200 hover:bg-red-50 hover:text-red-700"
              >
                Kosongkan
              </button>
            )}
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Tutup keranjang"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-navy/55 shadow-soft backdrop-blur transition duration-200 hover:text-navy active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="scroll-contain flex-1 space-y-4 overflow-y-auto p-4">
          {groups.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-white text-navy/20 shadow-card ring-1 ring-navy/[0.04]">
                <ShoppingBag size={34} />
              </span>
              <div>
                <p className="font-display text-base font-bold text-navy">Keranjangmu masih kosong</p>
                <p className="mt-1 text-xs text-navy/55">Yuk pilih jajanan favoritmu dari booth hari ini.</p>
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
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy/50">{g.name}</h3>
                <span className="tnum rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-navy/50 shadow-sm ring-1 ring-navy/[0.06]">{g.items.length} item</span>
              </div>
              <ul className="space-y-2">
                {g.items.map((i) => {
                  const productQty = cart.reduce(
                    (totalQty, item) => totalQty + (item.product.id === i.product.id ? item.qty : 0),
                    0
                  );
                  return (
                    <li key={i.key} className="relative flex gap-3 rounded-[18px] border border-navy/[0.06] bg-white p-2.5 shadow-card transition duration-200 hover:border-accent/20 hover:shadow-lift">
                      <ProductImage product={i.product} className="h-16 w-16 shrink-0 rounded-2xl ring-1 ring-navy/[0.06]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate pr-5 text-sm font-bold text-navy">{i.product.name}</p>
                        {optionsText(i.options) && (
                          <p className="truncate text-[11px] text-navy/55">{optionsText(i.options)}</p>
                        )}
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="tnum text-sm font-extrabold text-price">{formatRupiah(i.unit * i.qty)}</span>
                          <span className="flex items-center gap-1.5">
                            <button type="button" onClick={() => changeQty(i.key, -1)} aria-label={`Kurangi ${i.product.name}`} className={btn}>
                              <Minus size={12} />
                            </button>
                            <span className="tnum w-4 text-center text-xs font-bold text-navy">{i.qty}</span>
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
                        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-navy/30 transition hover:bg-red-50 hover:text-red-700 active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {cart.length > 0 && (
          <footer className="space-y-3 border-t border-navy/[0.06] bg-gradient-to-b from-white to-cream/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            {trackIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  openTracker();
                }}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold text-price transition duration-200 hover:bg-accent-50"
              >
                <ReceiptText size={14} /> Lacak pesanan terakhir
              </button>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-navy/55">Subtotal</span>
              <b className="tnum text-xl font-extrabold text-price">{formatRupiah(total)}</b>
            </div>
            <p className="flex items-start gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50/70 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800">
              <ShoppingBag size={11} className="mt-0.5 shrink-0" />
              Pesanan ini memakai sistem PO. Pembayaran dikonfirmasi langsung ke penjual lewat WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                navigate("/checkout");
              }}
              className="btn-primary w-full"
            >
              Lanjut ke checkout <ArrowRight size={16} />
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
