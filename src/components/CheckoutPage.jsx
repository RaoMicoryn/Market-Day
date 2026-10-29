import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Footprints,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Store,
  Ticket,
  Wallet,
} from "lucide-react";
import OrderItem from "./OrderItem";
import FormField from "./FormField";
import EmptyState from "./ui/EmptyState";
import { useCart } from "../context/CartContext";
import { useConfirm } from "../context/ConfirmContext";
import { formatRupiah } from "../data/products";
import { validatePhone } from "../utils/phone";
import { readPendingOrder, savePendingOrder } from "../utils/pendingOrder";

const METHODS = [
  { id: "pickup", title: "Ambil di booth", desc: "Ambil sendiri saat pesanan siap", Icon: MapPin },
  { id: "delivery", title: "Antar ke kelas", desc: "Diantar ke kelasmu oleh tim booth", Icon: Footprints },
];

function validate(f) {
  const e = {};
  if (!f.nama.trim()) e.nama = "Nama wajib diisi";
  if (!f.kelas.trim()) e.kelas = "Kelas wajib diisi";
  const phone = validatePhone(f.wa);
  if (!phone.valid) e.wa = phone.message;
  return e;
}

export default function CheckoutPage({ cart, total, onChangeQty }) {
  const { groups, cartCount, setNote, customer } = useCart();
  const confirm = useConfirm();
  const navigate = useNavigate();
  // Kalau pengguna kembali dari halaman verifikasi, isi ulang form dari data sementara
  // supaya tidak perlu mengetik ulang.
  const [form, setForm] = useState(() => {
    const pending = readPendingOrder();
    return {
      nama: pending?.customer?.nama || customer?.nama || "",
      kelas: pending?.customer?.kelas || customer?.kelas || "",
      wa: pending?.customer?.wa || customer?.wa || "",
      note: pending?.customer?.note || "",
    };
  });
  const [method, setMethod] = useState(() => readPendingOrder()?.method || "pickup");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleChangeQty = async (key, delta) => {
    const item = cart.find((i) => i.key === key);
    if (delta < 0 && item?.qty === 1) {
      const ok = await confirm({
        title: `Hapus ${item.product.name}?`,
        message: "Produk ini akan dihapus dari keranjang.",
        confirmLabel: "Ya, hapus",
        danger: true,
      });
      if (!ok) return;
    }
    onChangeQty(key, delta);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    savePendingOrder({ customer: { ...form, wa: validatePhone(form.wa).local }, method });
    setBusy(true);
    navigate("/verifikasi");
  };

  if (cart.length === 0)
    return (
      <section className="shell max-w-2xl py-14">
        <EmptyState
          icon={ShoppingBag}
          title="Keranjangmu masih kosong"
          description="Pilih menu dari booth favoritmu dulu, lalu kembali ke sini untuk menyelesaikan pesanan."
          action={
            <Link to="/cari" className="btn-accent">
              Jelajahi menu <ArrowRight size={15} />
            </Link>
          }
        />
      </section>
    );

  return (
    <section className="shell py-8 sm:py-10">
      <Link to="/cari" className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-navy/65 transition hover:text-price">
        <ArrowLeft size={14} /> Lanjut belanja
      </Link>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Langkah terakhir</p>
          <h1 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">Selesaikan pesananmu</h1>
          <p className="mt-1 text-sm text-navy/65">Isi data, verifikasi WhatsApp, lalu pesanan diteruskan ke booth. Bayar langsung di booth.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
          <ShieldCheck size={13} /> Data hanya dipakai untuk pesanan
        </span>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <form id="checkout-form" onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="card overflow-hidden">
            <div className="border-b border-navy/[0.06] px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                <ShoppingBag size={15} className="text-accent" /> Produk pesanan
              </h2>
            </div>
            <div className="space-y-5 p-4 sm:p-5">
              {groups.map((g) => (
                <div key={g.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy/65">
                      <Store size={12} /> {g.name}
                    </p>
                    <span className="text-xs font-bold text-price">
                      {formatRupiah(g.items.reduce((n, i) => n + i.unit * i.qty, 0))}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {g.items.map((item) => (
                      <OrderItem key={item.key} item={item} onChangeQty={handleChangeQty} onNote={setNote} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <fieldset className="card p-5">
            <legend className="sr-only">Metode pengambilan</legend>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
              <MapPin size={15} className="text-accent" /> Metode pengambilan
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {METHODS.map(({ id, title, desc, Icon }) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 transition ${
                    method === id ? "border-accent bg-accent-50" : "border-navy/10 bg-white hover:border-accent/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={id}
                    checked={method === id}
                    onChange={() => setMethod(id)}
                    className="mt-0.5 h-4 w-4 accent-orange-500"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-navy">
                      <Icon size={14} /> {title}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-navy/65">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="card space-y-4 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
              <Ticket size={15} className="text-accent" /> Data pembeli
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nama lengkap" name="nama" value={form.nama} onChange={handleChange} error={errors.nama} autoComplete="name" placeholder="Nama kamu" />
              <FormField
                label="Kelas"
                name="kelas"
                value={form.kelas}
                onChange={handleChange}
                error={errors.kelas}
                placeholder={method === "delivery" ? "Kelas tujuan" : "Kelas"}
              />
            </div>
            <FormField
              label="No. WhatsApp"
              name="wa"
              type="tel"
              inputMode="tel"
              value={form.wa}
              onChange={handleChange}
              error={errors.wa}
              placeholder="08xxxxxxxxxx"
              hint="Untuk konfirmasi pesanan"
              autoComplete="tel"
            />
            <FormField
              label="Catatan untuk penjual"
              name="note"
              multiline
              value={form.note}
              onChange={handleChange}
              placeholder="Opsional misalnya; jangan pakai saus, ambil jam istirahat"
              maxLength={200}
            />
          </div>

          <div className="lg:hidden">
            <button
              type="submit"
              disabled={busy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-bold text-white shadow-soft transition hover:bg-navy-700 active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "Menyimpan..." : `Buat pesanan · ${formatRupiah(total)}`}
              {!busy && <ArrowRight size={16} />}
            </button>
          </div>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Summary total={total} cartCount={cartCount} groups={groups} />
            <button
              type="submit"
              form="checkout-form"
              disabled={busy}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-bold text-white shadow-soft transition hover:bg-navy-700 active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "Menyimpan..." : "Buat pesanan"} <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-navy/65">
              Dengan memesan, kamu setuju mengambil pesanan sesuai metode yang dipilih.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Summary({ total, cartCount, groups }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold text-navy">Ringkasan pesanan</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between text-navy/65">
          <dt>Jumlah item</dt>
          <dd className="font-semibold text-navy">{cartCount}</dd>
        </div>
        <div className="flex justify-between text-navy/65">
          <dt>Jumlah toko</dt>
          <dd className="font-semibold text-navy">{groups.length}</dd>
        </div>
        <div className="flex justify-between text-navy/65">
          <dt>Biaya layanan</dt>
          <dd className="font-semibold text-emerald-700">Gratis</dd>
        </div>
        <div className="flex items-end justify-between border-t border-dashed border-navy/10 pt-3">
          <dt className="font-semibold text-navy">Total bayar</dt>
          <dd className="font-display text-xl font-extrabold text-price">{formatRupiah(total)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
        <Wallet size={13} className="mt-0.5 shrink-0" />
        Bayar tunai di booth saat mengambil pesanan. Nomor antrean muncul setelah pesanan dikirim.
      </div>
    </div>
  );
}
