import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import FormField from "../FormField";
import { CATEGORIES, CATEGORY_META, formatRupiah } from "../../data/products";
import { imageFileToDataUrl } from "../../utils/imageUpload";
import { sanitizePhone, validatePhone } from "../../utils/phone";

export default function ProductForm({ product, onSave, onClose, defaultSellerPhone = "" }) {
  const [f, setF] = useState({
    name: product?.name ?? "",
    price: product?.price ?? "",
    stockQuantity: product?.stockQuantity == null ? (product ? "" : "0") : String(product.stockQuantity),
    category: product?.category ?? CATEGORIES[0],
    description: product?.description ?? "",
    image: product?.image ?? "",
    sellerPhone: product?.sellerPhone || defaultSellerPhone || "",
    toppings: product?.toppings ?? [],
  });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const set = (e) => {
    setF((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErr((v) => ({ ...v, [e.target.name]: undefined }));
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const image = await imageFileToDataUrl(file);
      setF((v) => ({ ...v, image }));
      setErr((v) => ({ ...v, image: undefined }));
    } catch (error) {
      setErr((v) => ({ ...v, image: error.message }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!f.name.trim()) found.name = "Nama produk wajib diisi";
    if (!(Number(f.price) > 0)) found.price = "Harga harus lebih dari 0";
    if (f.stockQuantity !== "" && (!/^\d+$/.test(f.stockQuantity) || Number(f.stockQuantity) > 2_147_483_647)) {
      found.stockQuantity = "Stok harus berupa bilangan bulat 0 atau lebih.";
    }
    const activeToppings = f.toppings.filter((topping) => topping.name.trim() || topping.price !== "");
    if (activeToppings.some((topping) => !topping.name.trim())) {
      found.toppings = "Isi nama untuk setiap topping yang ditambahkan.";
    } else if (activeToppings.some((topping) => !Number.isInteger(Number(topping.price)) || Number(topping.price) < 0)) {
      found.toppings = "Harga topping harus berupa angka nol atau lebih.";
    } else if (new Set(activeToppings.map((topping) => topping.name.trim().toLowerCase())).size !== activeToppings.length) {
      found.toppings = "Nama topping tidak boleh duplikat.";
    }
    const sellerPhone = sanitizePhone(f.sellerPhone);
    if (sellerPhone) {
      const phoneCheck = validatePhone(sellerPhone);
      if (!phoneCheck.valid) found.sellerPhone = phoneCheck.message;
    }
    setErr(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await onSave({
        ...f,
        price: Number(f.price),
        stockQuantity: f.stockQuantity === "" ? null : Number(f.stockQuantity),
        sellerPhone,
        toppings: activeToppings.map((topping) => ({
          name: topping.name.trim(),
          price: Number(topping.price),
        })),
      });
    } catch (ex) {
      setErr({ form: ex.message });
      setSaving(false);
    }
  };

  const meta = CATEGORY_META[f.category];
  const addTopping = () => setF((value) => ({ ...value, toppings: [...value.toppings, { name: "", price: "" }] }));
  const updateTopping = (index, key, value) =>
    setF((current) => ({
      ...current,
      toppings: current.toppings.map((topping, i) => (i === index ? { ...topping, [key]: value } : topping)),
    }));
  const removeTopping = (index) =>
    setF((current) => ({ ...current, toppings: current.toppings.filter((_, i) => i !== index) }));

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center overflow-y-auto bg-navy-900/60 p-0 backdrop-blur-md sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto max-h-[92dvh] w-full max-w-lg animate-pop space-y-4 overflow-y-auto rounded-t-[30px] border border-white/60 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-lift ring-1 ring-navy/[0.04] sm:max-h-[88vh] sm:rounded-[30px] sm:p-6"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-navy/15 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">{product ? "Ubah menu" : "Menu baru"}</p>
            <h3 className="font-display text-xl font-extrabold tracking-tight text-navy">{product ? "Ubah produk" : "Tambah produk"}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/85 text-navy/50 shadow-soft backdrop-blur transition duration-300 hover:rotate-90 hover:text-navy active:scale-90">
            <X size={19} />
          </button>
        </div>

        <FormField label="Nama produk" name="name" value={f.name} onChange={set} error={err.name} placeholder="Nama produk" maxLength={60} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="mb-1.5 block text-[13px] font-bold text-navy">
              Harga
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-navy/45">Rp</span>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="500"
                value={f.price}
                onChange={set}
                placeholder="15000"
                className={`field pl-9 ${err.price ? "border-red-400 bg-red-50/40" : ""}`}
              />
            </div>
            {err.price ? (
              <p role="alert" className="mt-1.5 text-[11px] font-semibold text-red-700">{err.price}</p>
            ) : (
              f.price > 0 && <p className="tnum mt-1.5 text-[11px] font-semibold text-navy/55">{formatRupiah(f.price)}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="mb-1.5 block text-[13px] font-bold text-navy">
              Kategori
            </label>
            <select id="category" name="category" value={f.category} onChange={set} className="field cursor-pointer">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].emoji} {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="stockQuantity" className="mb-1.5 block text-[13px] font-bold text-navy">
            Stok tersedia
          </label>
          <input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            max="2147483647"
            step="1"
            value={f.stockQuantity}
            onChange={set}
            placeholder="Tidak dibatasi"
            aria-describedby="stockQuantity-hint"
            className={`field ${err.stockQuantity ? "border-red-400 bg-red-50/40" : ""}`}
          />
          {err.stockQuantity ? (
            <p role="alert" className="mt-1.5 text-[11px] font-semibold text-red-700">{err.stockQuantity}</p>
          ) : (
            <p id="stockQuantity-hint" className="mt-1.5 text-[11px] text-navy/55">
              Kosongkan untuk stok tidak dibatasi. Isi 0 jika sedang habis.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="sellerPhone" className="mb-1.5 block text-[13px] font-bold text-navy">
            Nomor WhatsApp penjual
          </label>
          <div className="relative">
            <input
              id="sellerPhone"
              name="sellerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={f.sellerPhone}
              onChange={set}
              placeholder="0812 3456 7890"
              aria-describedby="sellerPhone-hint"
              className={`field ${err.sellerPhone ? "border-red-400 bg-red-50/40" : ""}`}
            />
          </div>
          {err.sellerPhone ? (
            <p role="alert" className="mt-1.5 text-[11px] font-semibold text-red-700">{err.sellerPhone}</p>
          ) : (
            <p id="sellerPhone-hint" className="mt-1.5 text-[11px] leading-relaxed text-navy/55">
              Dipakai pembeli untuk konfirmasi pembayaran PO lewat WhatsApp. Boleh kosongkan jika memakai nomor default sekolah.
            </p>
          )}
        </div>

        <FormField
          label="Deskripsi"
          name="description"
          multiline
          value={f.description}
          onChange={set}
          placeholder="Ceritakan rasa, porsi, atau keunggulan produkmu..."
          maxLength={400}
          hint={`${f.description.length}/400`}
        />

        <fieldset className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <legend className="text-[13px] font-bold text-navy">Pilihan topping</legend>
            <button type="button" onClick={addTopping} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-accent/20 bg-accent-50 px-3 text-xs font-bold text-price transition duration-200 hover:bg-accent-100 active:scale-95">
              <Plus size={14} /> Tambah topping
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-navy/55">
            Tambahkan topping dan harga tambahan sesuai kebutuhan. Tidak ada batas jumlah topping.
          </p>
          {f.toppings.map((topping, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_8rem] gap-2">
                <input
                  value={topping.name}
                  onChange={(event) => updateTopping(index, "name", event.target.value)}
                  maxLength={60}
                  aria-label={`Nama topping ${index + 1}`}
                  placeholder="Nama topping"
                  className="field sm:text-xs"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-navy/45">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={topping.price}
                    onChange={(event) => updateTopping(index, "price", event.target.value)}
                    aria-label={`Harga tambahan topping ${index + 1}`}
                    placeholder="Harga"
                    className="field pl-8 sm:text-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeTopping(index)}
                aria-label={`Hapus topping ${index + 1}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-red-400 transition duration-200 hover:bg-red-50 hover:text-red-700 active:scale-90"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {err.toppings && <p role="alert" className="text-[11px] font-semibold text-red-700">{err.toppings}</p>}
        </fieldset>
        {err.form && (
          <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700">
            {err.form}
          </p>
        )}

        <div>
          <p className="mb-1.5 text-[13px] font-bold text-navy">Foto produk</p>
          <div className="flex items-center gap-3">
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm ring-1 ring-navy/[0.06] ${meta.tone}`}>
              {f.image ? (
                <img src={f.image} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <span className="text-3xl" aria-hidden="true">{meta.emoji}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <FormField
                label="URL foto"
                name="image"
                value={f.image.startsWith("data:") || f.image.startsWith("/api/img/") ? "" : f.image}
                onChange={set}
                placeholder="https://..."
                error={err.image}
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-navy/10 bg-white px-3 text-[11px] font-semibold text-navy/60 shadow-sm transition duration-200 hover:border-accent/40 hover:text-price active:scale-95">
                  <ImagePlus size={13} /> Unggah foto
                  <input type="file" accept="image/*" onChange={pickFile} className="sr-only" />
                </label>
                {f.image && (
                  <button type="button" onClick={() => setF((v) => ({ ...v, image: "" }))} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-navy/50 transition duration-200 hover:bg-red-50 hover:text-red-700">
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
                <span className="text-[10px] text-navy/45">Maks. 2 MB · otomatis dikompres</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-navy/[0.06] bg-white/95 px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 sm:flex-none">
            Batal
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 sm:flex-none">
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Simpan produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
