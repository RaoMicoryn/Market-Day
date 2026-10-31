import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Store,
} from "lucide-react";
import Hero from "../components/Hero";
import CodeSearch from "../components/CodeSearch";
import StoreCard from "../components/StoreCard";
import ProductBrowser from "../components/ProductBrowser";
import SectionHeading from "../components/ui/SectionHeading";
import { StoreCardSkeleton } from "../components/ui/Skeletons";
import { CATEGORIES, CATEGORY_META } from "../data/products";
import { getStores } from "../db/repository";
import { useDb } from "../db/useDb";

export default function HomePage() {
  const { data: stores, loading } = useDb(getStores);
  const [onlyOpen, setOnlyOpen] = useState(false);

  const list = (stores || [])
    .filter((s) => !onlyOpen || s.isOpen)
    .sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || (b.productCount || 0) - (a.productCount || 0));

  return (
    <>
      <Hero />

      <section className="shell pt-7 sm:pt-8">
        <div className="relative overflow-hidden rounded-[26px] bg-navy px-5 py-7 text-white shadow-lift sm:rounded-[32px] sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/75 sm:text-[11px]">
                <Sparkles size={12} className="text-accent-300" /> Untuk penjual
              </span>
              <h2 className="mt-3 font-display text-xl font-extrabold text-white sm:text-3xl">
                Punya booth? Buka tokomu dalam 2 menit.
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55 sm:text-sm">
                Dapat kode toko otomatis, kelola menu & stok, terima pesanan, dan pantau omzet dari satu dashboard.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link to="/dashboard/register" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-bold text-white shadow-glow transition hover:bg-price active:scale-[0.98] sm:min-h-11 sm:w-auto">
                <Store size={16} /> Daftarkan booth
              </Link>
              <Link to="/dashboard/login" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/85 transition hover:bg-white/10 active:scale-[0.98] sm:min-h-11 sm:w-auto">
                Masuk dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CodeSearch />

      <section className="shell pt-9 sm:pt-12">
        <SectionHeading
          eyebrow="Kategori"
          title="Mau cari apa hari ini?"
          description="Pilih kategori untuk langsung memfilter menu dari semua booth."
          action={
            <Link to="/cari" className="hidden items-center gap-1.5 text-sm font-bold text-price hover:underline sm:inline-flex">
              Semua menu <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-4 sm:gap-4">
          {CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            return (
              <Link
                key={c}
                to={`/cari?kategori=${encodeURIComponent(c)}`}
                className={`group relative overflow-hidden rounded-2xl border border-navy/[0.06] bg-gradient-to-br ${meta.tone} p-3.5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift active:scale-[0.98] sm:rounded-3xl sm:p-5`}
              >
                <span className="text-2xl transition duration-300 group-hover:scale-110 sm:text-4xl" aria-hidden="true">
                  {meta.emoji}
                </span>
                <p className="mt-2 font-display text-[13px] font-extrabold leading-tight text-navy sm:mt-3 sm:text-base">{meta.short}</p>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-navy/65 sm:text-[11px]">{meta.desc}</p>
                <ArrowRight
                  size={15}
                  className="absolute right-3 top-3 hidden text-navy/20 transition group-hover:translate-x-0.5 group-hover:text-accent sm:block sm:right-4 sm:top-4"
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section id="toko" className="shell pt-10 sm:pt-14">
        <SectionHeading
          eyebrow="Direktori"
          title="Booth yang bisa kamu kunjungi"
          description="Setiap booth dikelola langsung oleh penjual. Cek status buka sebelum memesan."
          action={
            <div className="flex w-full gap-1.5 sm:w-auto">
              <button type="button" onClick={() => setOnlyOpen(false)} className={`flex-1 sm:flex-none ${onlyOpen ? "chip" : "chip-on"}`}>
                Semua
              </button>
              <button type="button" onClick={() => setOnlyOpen(true)} className={`flex-1 sm:flex-none ${onlyOpen ? "chip-on" : "chip"}`}>
                Buka sekarang
              </button>
            </div>
          }
        />

        <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StoreCardSkeleton key={i} />)
            : list.map((s) => <StoreCard key={s.id} store={s} />)}
        </div>
        {!loading && list.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-navy/10 bg-white/60 py-10 text-center text-sm text-navy/65">
            Belum ada booth yang buka. Coba lagi nanti ya.
          </p>
        )}
      </section>

      <div className="mt-10 border-y border-navy/[0.06] bg-white/60 sm:mt-16">
        <ProductBrowser title="Jelajahi menu" q="" />
      </div>

    </>
  );
}
