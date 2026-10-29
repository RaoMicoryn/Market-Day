import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import ProductForm from "./ProductForm";
import ProductImage from "../ProductImage";
import EmptyState from "../ui/EmptyState";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { createProduct, deleteProduct, getProducts, setProductStock, updateProduct } from "../../db/repository";
import { useDb } from "../../db/useDb";
import { CATEGORIES, CATEGORY_META, formatRupiah } from "../../data/products";

function StockSwitch({ product, onToggle }) {
  const on = product.inStock !== false;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${product.name}: ${on ? "tersedia" : "habis"}`}
      onClick={() => onToggle(product)}
      className="flex items-center gap-2"
    >
      <span className={`relative h-6 w-10 rounded-full transition-colors duration-300 ${on ? "bg-emerald-500" : "bg-navy/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span className={`hidden w-14 text-left text-[10px] font-bold sm:block ${on ? "text-emerald-700" : "text-navy/65"}`}>
        {on ? "Tersedia" : "Habis"}
      </span>
    </button>
  );
}

export default function ProductsTab({ store }) {
  const { data: products } = useDb(() => getProducts(store.id), [store.id]);
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const confirm = useConfirm();
  const toast = useToast();

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products || [])
      .filter((p) => (!category || p.category === category) && (!term || p.name.toLowerCase().includes(term)))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [products, q, category]);

  const save = async (data) => {
    if (editing === "new") {
      await createProduct(store.id, data);
      toast("Produk baru ditambahkan.", { type: "success" });
    } else {
      await updateProduct(editing.id, data);
      toast("Produk diperbarui.", { type: "success" });
    }
    setEditing(null);
  };

  const remove = async (p) => {
    const ok = await confirm({
      title: `Hapus “${p.name}”?`,
      message: "Produk akan dihapus dari toko. Pesanan lama tetap menyimpan nama produk.",
      confirmLabel: "Ya, hapus",
      danger: true,
    });
    if (!ok) return;
    await deleteProduct(p.id);
    toast("Produk dihapus.", { type: "info" });
  };

  const toggleStock = async (p) => {
    const next = p.inStock === false;
    await setProductStock(p.id, next);
    toast(next ? `${p.name} ditandai tersedia.` : `${p.name} ditandai habis.`, { type: next ? "success" : "warning", duration: 2000 });
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2 p-4">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk..."
            aria-label="Cari produk"
            className="h-9 w-full rounded-full border border-navy/10 bg-navy/[0.02] pl-9 pr-3 text-xs outline-none transition placeholder:text-navy/65 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
          />
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter kategori"
          className="h-9 cursor-pointer rounded-full border border-navy/10 bg-white px-3 text-xs font-semibold text-navy outline-none focus:border-accent"
        >
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="hidden text-[11px] font-semibold text-navy/65 sm:block">{rows.length} produk</span>
        <button type="button" onClick={() => setEditing("new")} className="btn-accent ml-auto">
          <Plus size={15} /> Tambah produk
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={products?.length ? "Tidak ada produk yang cocok" : "Menu masih kosong"}
          description={products?.length ? "Coba kata kunci atau kategori lain." : "Tambahkan produk pertamamu supaya pembeli bisa mulai memesan."}
          action={
            <button type="button" onClick={() => setEditing("new")} className="btn-primary">
              <Plus size={15} /> Tambah produk
            </button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((p) => (
            <li key={p.id} className="card flex items-center gap-3 p-3">
              <ProductImage product={p} className={`h-16 w-16 shrink-0 rounded-xl ${p.inStock === false ? "opacity-50 grayscale" : ""}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy">{p.name}</p>
                <p className="text-[10px] font-semibold text-navy/65">
                  {CATEGORY_META[p.category]?.emoji} {p.category}
                </p>
                <p className="text-sm font-extrabold text-price">{formatRupiah(p.price)}</p>
              </div>
              <StockSwitch product={p} onToggle={toggleStock} />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  aria-label={`Ubah ${p.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-navy/65 transition hover:bg-navy-50 hover:text-navy"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  aria-label={`Hapus ${p.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 transition hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProductForm product={editing === "new" ? null : editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
