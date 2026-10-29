import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Halaman tidak ditemukan");

  return (
    <section className="shell flex max-w-xl flex-col items-center py-20 text-center">
      <p aria-hidden="true" data-step="404" className="step-num font-display text-7xl font-extrabold tracking-tight text-navy/10 sm:text-8xl" />
      <div className="-mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent">
        <Compass size={26} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-navy sm:text-3xl">Halaman ini nggak ada</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy/65">
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
