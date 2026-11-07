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
        `relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2.5 text-[10px] font-bold transition ${
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
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
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

function CartTab({ count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Buka keranjang, ${count} item`}
      className="relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2.5 text-[10px] font-bold text-navy/50 transition active:text-navy"
    >
      <span className="relative flex h-8 min-w-[2.75rem] items-center justify-center rounded-full text-navy/55">
        <ShoppingBag size={18} strokeWidth={2.2} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
      <span>Keranjang</span>
    </button>
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
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-navy/[0.07] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(11,37,69,0.35)] backdrop-blur-2xl md:hidden"
    >
      <div className="flex items-stretch px-1.5 py-1">
        <Tab to="/" end icon={Home} label="Beranda" />
        <Tab to="/cari" icon={Compass} label="Jelajahi" />
        <CartTab count={cartCount} onClick={openDrawer} />
        <Tab to="/pesanan" icon={ReceiptText} label="Pesanan" />
        <Tab to="/wishlist" icon={Heart} label="Wishlist" badge={wishCount} />
      </div>
    </nav>
  );
}
