import { Link } from "react-router-dom";
import Logo from "./Logo";

const LINKS = {
  Jelajahi: [
    { to: "/cari", label: "Semua produk" },
    { to: "/cari?kategori=Minuman", label: "Minuman" },
    { to: "/cari?kategori=Snack", label: "Snack" },
    { to: "/wishlist", label: "Wishlist" },
  ],
  Pesanan: [
    { to: "/pesanan", label: "Pesanan saya" },
    { to: "/pesanan", label: "Lacak pesanan" },
  ],
  Penjual: [
    { to: "/dashboard", label: "Dashboard toko" },
    { to: "/dashboard/register", label: "Daftarkan toko" },
    { to: "/dashboard/login", label: "Masuk penjual" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />

      <div className="shell relative py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Temukan menu dari berbagai booth, pesan dengan mudah, dan pantau pesananmu.
            </p>
          </div>

          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">{title}</p>
              <ul className="mt-4 space-y-2.5">
                {items.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-white/65 transition hover:text-accent-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs text-white/55">© {new Date().getFullYear()} market day.</p>
        </div>
      </div>
    </footer>
  );
}
