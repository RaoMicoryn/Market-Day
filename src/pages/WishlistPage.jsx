import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Trash2 } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import EmptyState from "../components/ui/EmptyState";
import { GridSkeleton } from "../components/ui/Skeletons";
import { useWishlist } from "../context/WishlistContext";
import { useConfirm } from "../context/ConfirmContext";
import { getProductsByIds, getStores } from "../db/repository";
import { useDb } from "../db/useDb";
import { useShopping } from "../hooks/useShopping";
import { usePageTitle } from "../hooks/usePageTitle";

export default function WishlistPage() {
  usePageTitle("Wishlist");
  const { ids, count, clear } = useWishlist();
  const confirm = useConfirm();
  const [sort, setSort] = useState("newest");
  const { selected, setSelected, onAdd, onBuy } = useShopping();

  const { data: products, loading } = useDb(() => getProductsByIds(ids), [ids.join(",")]);
  const { data: stores } = useDb(getStores);
  const storeById = Object.fromEntries((stores || []).map((s) => [s.id, s]));

  const rows = (products || [])
    .map((p) => ({
      ...p,
      storeName: storeById[p.storeId]?.name,
      storeSlug: storeById[p.storeId]?.slug,
      storeOpen: storeById[p.storeId]?.isOpen,
    }))
    .sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : String(b.createdAt).localeCompare(String(a.createdAt))
    );

  const clearAll = async () => {
    const ok = await confirm({
      title: "Kosongkan wishlist?",
      message: "Semua produk yang kamu simpan akan dihapus dari daftar ini.",
      confirmLabel: "Ya, hapus semua",
      danger: true,
    });
    if (ok) clear();
  };

  return (
    <section className="shell pb-8 pt-4 sm:py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7 sm:gap-4">
        <div>
          <p className="eyebrow mb-1.5">Simpanan</p>
          <h1 className="flex items-center gap-2 font-display text-[22px] font-extrabold text-navy sm:text-3xl">
            Wishlist <Heart size={20} className="text-red-700" fill="currentColor" />
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-navy/65 sm:text-sm">
            {count > 0 ? `${count} produk kamu simpan. Jangan sampai kehabisan!` : "Simpan menu favorit supaya mudah ditemukan nanti."}
          </p>
        </div>

        {count > 0 && (
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Urutkan wishlist"
              className="h-10 flex-1 cursor-pointer rounded-full border border-navy/10 bg-white px-3 text-base font-semibold text-navy outline-none focus:border-accent sm:h-9 sm:flex-none sm:text-xs"
            >
              <option value="newest">Terbaru</option>
              <option value="price-asc">Harga terendah</option>
              <option value="price-desc">Harga tertinggi</option>
            </select>
            <button type="button" onClick={clearAll} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95">
              <Trash2 size={13} /> Hapus semua
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <GridSkeleton count={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Wishlist masih kosong"
          description="Tekan ikon hati di produk mana pun untuk menyimpannya di sini."
          action={
            <Link to="/cari" className="btn-accent">
              Jelajahi menu <ArrowRight size={15} />
            </Link>
          }
        />
      ) : (
        <>
          <h2 className="sr-only">Produk tersimpan</h2>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {rows.map((p) => (
              <ProductCard key={p.id} product={p} showStore onAdd={onAdd} onSelect={setSelected} />
            ))}
          </div>
        </>
      )}

      {selected && (
        <ProductModal key={selected.id} product={selected} onAdd={onAdd} onBuy={onBuy} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
