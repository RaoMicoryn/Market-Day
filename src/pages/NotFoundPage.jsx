import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Halaman tidak ditemukan");

  return (
    <section className="shell flex max-w-xl flex-col items-center py-20 text-center">
      <div className="relative" aria-hidden="true">
        <div className="pointer-events-none absolute inset-0 -z-10 mx-auto h-24 w-40 rounded-full bg-accent/15 blur-3xl" />
        <p data-step="404" className="step-num bg-gradient-to-b from-navy/20 to-navy/[0.04] bg-clip-text font-display text-7xl font-extrabold tracking-tighter text-transparent sm:text-8xl" />
      </div>
      <div className="-mt-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-accent/15 to-amber-100 text-accent shadow-sm ring-1 ring-accent/10">
        <Compass size={26} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Halaman ini nggak ada</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy/60">
        Mungkin linknya salah, atau booth sudah pindah. Yuk balik ke menu utama dan cari jajanan lain.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn-primary">
          <ArrowLeft size={15} /> Ke beranda
        </Link>
        <Link to="/cari" className="btn-ghost">
          <Search size={15} /> Jelajahi menu
        </Link>
      </div>
    </section>
  );
}
