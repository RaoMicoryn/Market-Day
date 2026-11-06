import { Link, useSearchParams } from "react-router-dom";
import { SearchX, Store } from "lucide-react";
import ProductBrowser from "../components/ProductBrowser";
import StoreCard from "../components/StoreCard";
import EmptyState from "../components/ui/EmptyState";
import { getStores } from "../db/repository";
import { useDb } from "../db/useDb";
import { usePageTitle } from "../hooks/usePageTitle";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const kategori = params.get("kategori") || "";
  const { data: stores } = useDb(getStores);
  const term = q.trim().toLowerCase();
  const matched = term
    ? (stores || []).filter((s) => [s.name, s.kelas, s.code].some((t) => String(t).toLowerCase().includes(term)))
    : [];

  usePageTitle(q ? `Hasil untuk “${q}”` : kategori || "Jelajahi menu");

  return (
    <>
      <section className="shell pt-4 sm:pt-8">
        <p className="eyebrow mb-1.5">{q ? "Hasil pencarian" : "Katalog"}</p>
        <h1 className="font-display text-[22px] font-extrabold tracking-tight text-navy sm:text-3xl">
          {q ? (
            <>
              Hasil untuk <span className="text-price">“{q}”</span>
            </>
          ) : (
            "Semua menu hari ini"
          )}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-navy/60 sm:text-sm">
          {q
            ? "Produk dan booth yang cocok dengan kata kunci kamu. Gunakan filter untuk mempersempit."
            : "Jelajahi menu dari semua booth. Filter kategori atau urutkan sesuai selera."}
        </p>
        {q && (
          <Link to="/cari" className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-price shadow-sm ring-1 ring-navy/[0.06] transition hover:ring-accent/30">
            Hapus pencarian
          </Link>
        )}
      </section>

      {q && matched.length > 0 && (
        <section className="shell pt-6 sm:pt-8">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent-50 text-accent">
              <Store size={15} />
            </span>
            <h2 className="font-display text-base font-extrabold tracking-tight text-navy sm:text-lg">Booth yang cocok</h2>
            <span className="tnum rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-bold text-navy/60">{matched.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {matched.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        </section>
      )}

      <ProductBrowser title={q ? `Produk untuk “${q}”` : "Semua produk"} q={q} initialCategory={kategori} />

      {q && matched.length === 0 && (
        <div className="shell pb-10">
          <EmptyState
            icon={SearchX}
            title="Tidak ada booth yang cocok"
            description="Coba cari nama booth, kelas, kategori, atau kode toko."
          />
        </div>
      )}
    </>
  );
}
