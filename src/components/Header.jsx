import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, Store, X } from "lucide-react";
import Logo from "./Logo";
import SearchBox from "./SearchBox";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const NAV = [
  { to: "/", label: "Beranda", end: true },
  { to: "/cari", label: "Jelajahi" },
  { to: "/pesanan", label: "Pesanan" },
];

export default function Header() {
  const { cartCount, openDrawer } = useCart();
  const { count: wishCount } = useWishlist();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setMobileSearch(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 768px)").matches) {
          document.querySelector("#global-search input")?.focus();
        } else {
          setMobileSearch(true);
        }
      }
      if (e.key === "Escape") {
        setMobileSearch(false);
        setMenu(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileSearch && !menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSearch, menu]);

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-navy/70 transition hover:bg-navy/5 hover:text-navy active:scale-90";

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-cream/85 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? "border-navy/[0.07] shadow-soft" : "border-transparent"
        }`}
      >
        <div className="shell flex h-[60px] items-center gap-1 sm:h-[72px] sm:gap-2">
          <Logo className="shrink-0" />

          <nav aria-label="Navigasi utama" className="ml-5 hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-navy text-white" : "text-navy/65 hover:bg-navy/5 hover:text-navy"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div id="global-search" className="mx-auto hidden w-full max-w-sm md:block lg:max-w-md">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <button type="button" onClick={() => setMobileSearch(true)} aria-label="Cari" className={`${iconBtn} md:hidden`}>
              <Search size={20} />
            </button>

            <Link to="/wishlist" aria-label={`Wishlist, ${wishCount} produk`} className={`${iconBtn} hidden md:flex`}>
              <Heart size={20} />
              {wishCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Buka keranjang, ${cartCount} item`}
              className={iconBtn}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-glow items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <Link to="/dashboard" className="ml-1 hidden items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-soft transition hover:bg-navy-700 sm:inline-flex">
              <Store size={14} /> Jual
            </Link>

            <button type="button" onClick={() => setMenu(true)} aria-label="Buka menu" className={`${iconBtn} lg:hidden`}>
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {mobileSearch && (
        <div
          className="fixed inset-0 z-[110] min-h-[100dvh] overflow-y-auto bg-cream px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Pencarian"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-lg font-extrabold text-navy">Cari sesuatu</p>
            <button type="button" onClick={() => setMobileSearch(false)} aria-label="Tutup pencarian" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy shadow-soft active:scale-95">
              <X size={20} />
            </button>
          </div>
          <SearchBox autoFocus onNavigate={() => setMobileSearch(false)} />
          <p className="mt-4 text-center text-xs text-navy/65">Tekan Enter untuk melihat semua hasil</p>
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-[105] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={() => setMenu(false)} />
          <div className="absolute right-0 top-0 flex h-[100dvh] w-[86%] max-w-xs animate-rise flex-col bg-cream px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] shadow-lift">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setMenu(false)} aria-label="Tutup menu" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy shadow-soft active:scale-95">
                <X size={19} />
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-1" aria-label="Menu seluler">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold transition active:scale-[0.99] ${
                      isActive ? "bg-navy text-white" : "text-navy/70 hover:bg-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink to="/wishlist" className="flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-semibold text-navy/70 transition hover:bg-white active:scale-[0.99]">
                Wishlist <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">{wishCount}</span>
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  openDrawer();
                }}
                className="flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-semibold text-navy/70 transition hover:bg-white active:scale-[0.99]"
              >
                Keranjang <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-bold text-price">{cartCount}</span>
              </button>
            </nav>

            <div className="mt-auto space-y-2 border-t border-navy/10 pt-4">
              <Link to="/dashboard" className="btn-primary w-full">
                <Store size={16} /> Dashboard penjual
              </Link>
              <p className="pt-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-navy/35">
                market day · SMK Tri Ratna
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
