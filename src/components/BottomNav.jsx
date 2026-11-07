import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Compass, Heart, Home, ReceiptText, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

// Bottom navigation khas aplikasi mobile. Disembunyikan di halaman fokus
// (checkout, verifikasi, dashboard) agar tidak menutupi tombol utama.
const HIDE_PREFIXES = ["/checkout", "/verifikasi", "/dashboard"];

// Posisi tab (0-4) untuk trail yang meluncur. Keranjang (2) bukan route.
function tabIndexFromPath(pathname) {
  if (pathname === "/") return 0;
  if (pathname === "/cari" || pathname.startsWith("/cari/")) return 1;
  if (pathname === "/pesanan" || pathname.startsWith("/pesanan/")) return 3;
  if (pathname === "/wishlist" || pathname.startsWith("/wishlist/")) return 4;
  return null;
}

function trailLeft(index, widthRem) {
  return `calc(${index * 20}% + 10% - ${widthRem / 2}rem)`;
}

function Tab({ to, end, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative z-10 flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-bold transition ${
          isActive ? "text-navy" : "text-navy/50 active:text-navy"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative flex h-8 min-w-[2.75rem] items-center justify-center rounded-full transition-all duration-200 group-active:animate-press ${
              isActive
                ? "bg-navy text-white shadow-soft group-active:bg-navy-700"
                : "text-navy/55 group-active:bg-navy/10 group-active:text-navy"
            }`}
          >
            <Icon size={18} strokeWidth={2.2} />
            {badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          <span className="transition-colors duration-150 group-active:text-navy">{label}</span>
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
      className="group relative z-10 flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-1 text-[10px] font-bold text-navy/60 transition active:text-navy"
    >
      <span
        className={`relative -mt-1.5 flex h-11 w-11 items-center justify-center rounded-full group-active:animate-press ${
          count > 0 ? "animate-glow" : ""
        }`}
      >
        {/* Aksen oranye yang mengelilingi keranjang */}
        <span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-full bg-gradient-to-b from-accent/45 via-accent/25 to-orange-200/10 blur-[7px] transition duration-300 group-hover:from-accent/60 group-hover:via-accent/35"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full ring-4 ring-accent/20"
        />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700 text-white shadow-glow ring-2 ring-white transition duration-200 group-active:from-orange-600 group-active:via-orange-700 group-active:to-orange-800">
          <ShoppingBag size={20} strokeWidth={2.3} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-navy px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </span>
      </span>
      <span className="transition-colors duration-150 group-active:text-navy">Keranjang</span>
    </button>
  );
}

export default function BottomNav() {
  const { cartCount, openDrawer } = useCart();
  const { count: wishCount } = useWishlist();
  const { pathname } = useLocation();
  const activeIndex = tabIndexFromPath(pathname);
  const [trailIndex, setTrailIndex] = useState(activeIndex ?? 0);

  useEffect(() => {
    if (activeIndex !== null) setTrailIndex(activeIndex);
  }, [activeIndex]);

  if (HIDE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;

  const showTrail = activeIndex !== null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-navy/[0.07] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(11,37,69,0.35)] backdrop-blur-2xl md:hidden"
    >
      <div className="px-1.5 py-1">
        <div className="relative flex items-stretch">
          {/* Trail oranye yang meluncur mengikuti perpindahan tab */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1.5 h-9 w-14 rounded-full bg-accent/25 blur-[8px] ${
              showTrail ? "opacity-100" : "opacity-0"
            }`}
            style={{
              left: trailLeft(trailIndex, 3.5),
              transition: "left 520ms cubic-bezier(.22,1,.36,1) 40ms, opacity 200ms",
            }}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-2 h-8 w-12 rounded-full bg-accent/40 blur-[4px] ${
              showTrail ? "opacity-100" : "opacity-0"
            }`}
            style={{
              left: trailLeft(trailIndex, 3),
              transition: "left 380ms cubic-bezier(.22,1,.36,1), opacity 200ms",
            }}
          />

          <Tab to="/" end icon={Home} label="Beranda" />
          <Tab to="/cari" icon={Compass} label="Jelajahi" />
          <CartTab count={cartCount} onClick={openDrawer} />
          <Tab to="/pesanan" icon={ReceiptText} label="Pesanan" />
          <Tab to="/wishlist" icon={Heart} label="Wishlist" badge={wishCount} />
        </div>
      </div>
    </nav>
  );
}
