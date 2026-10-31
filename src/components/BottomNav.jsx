import { NavLink, useLocation } from "react-router-dom";
import { Compass, Heart, Home, ReceiptText, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

// Bottom navigation khas aplikasi mobile. Disembunyikan di halaman fokus
// (checkout, verifikasi, dashboard) agar tidak menutupi tombol utama.
const HIDE_PREFIXES = ["/checkout", "/verifikasi", "/dashboard"];

function Tab({ to, end, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-bold transition ${
          isActive ? "text-navy" : "text-navy/50 active:text-navy"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative flex h-8 min-w-[2.75rem] items-center justify-center rounded-full transition-all duration-300 ${
              isActive ? "bg-navy text-white shadow-soft" : "text-navy/55"
            }`}
          >
            <Icon size={18} strokeWidth={2.2} />
            {badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-cream">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const { cartCount, openDrawer } = useCart();
  const { count: wishCount } = useWishlist();
  const { pathname } = useLocation();

  if (HIDE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-[90] md:hidden"
    >
      <div className="border-t border-navy/[0.07] bg-cream/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(11,37,69,.35)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-stretch px-1.5">
          <Tab to="/" end icon={Home} label="Beranda" />
          <Tab to="/cari" icon={Compass} label="Jelajahi" />

          <div className="flex w-[4.75rem] shrink-0 flex-col items-center">
            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Buka keranjang, ${cartCount} item`}
              className="relative -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-glow ring-4 ring-cream transition active:scale-90"
            >
              <ShoppingBag size={22} strokeWidth={2.3} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1 text-[10px] font-bold text-white ring-2 ring-cream">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <span className="mt-0.5 text-[10px] font-bold text-navy/70">Keranjang</span>
          </div>

          <Tab to="/pesanan" icon={ReceiptText} label="Pesanan" />
          <Tab to="/wishlist" icon={Heart} label="Wishlist" badge={wishCount} />
        </div>
      </div>
    </nav>
  );
}
