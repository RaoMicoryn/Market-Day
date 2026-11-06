import { Link } from "react-router-dom";
import { BadgeCheck, ChartNoAxesColumn, ShieldCheck } from "lucide-react";
import Logo from "./Logo";

const POINTS = [
  { icon: ChartNoAxesColumn, text: "Pantau omzet, pesanan, dan produk terlaris." },
  { icon: BadgeCheck, text: "Kode toko otomatis untuk dibagikan ke pembeli." },
  { icon: ShieldCheck, text: "Kelola stok dan status buka dalam satu klik." },
];

export default function AuthLayout({ title, subtitle, children, footer, eyebrow = "Dashboard penjual" }) {
  return (
    <section className="shell max-w-5xl py-6 sm:py-14">
      <div className="grid grid-cols-1 overflow-hidden rounded-[26px] border border-navy/[0.07] bg-white shadow-lift sm:rounded-[32px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy via-navy-700 to-navy-900 p-8 text-white lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <Logo light />
            <h2 className="mt-8 font-display text-3xl font-extrabold leading-tight tracking-tight text-white">
              Jualan lebih rapi,
              <br />
              <span className="text-accent-300">tanpa buku catatan.</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Kelola menu, terima pesanan, dan pantau performa booth dari satu dashboard.
            </p>
          </div>

          <ul className="relative mt-10 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-sm text-white/70">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-accent-300">
                  <p.icon size={15} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>

          <Link to="/" className="relative mt-10 text-xs font-semibold text-white/55 transition hover:text-white">
            ← Kembali ke katalog pembeli
          </Link>
        </div>

        <div className="min-w-0 bg-gradient-to-b from-white to-cream/40 p-5 sm:p-9">
          <p className="eyebrow mb-1.5">{eyebrow}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-navy/60">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
      {footer && <p className="mt-5 text-center text-sm text-navy/55">{footer}</p>}
    </section>
  );
}
