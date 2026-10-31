import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Search } from "lucide-react";
import { findStoreByCode, normalizeCode } from "../db/repository";

export default function CodeSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!normalizeCode(value)) return setError("Kode toko harus diawali MD- dan diikuti 4 angka.");
    setBusy(true);
    try {
      const store = await findStoreByCode(value);
      if (!store) return setError("Kode toko tidak ditemukan. Cek lagi ya.");
      navigate(`/toko/${store.slug}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="kode-toko" className="shell pt-7 sm:pt-10">
      <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-r from-accent-50 via-white to-amber-50 p-4 shadow-soft sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />
        <form onSubmit={submit} className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-start gap-3 sm:flex-1">
            <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-glow sm:flex">
              <KeyRound size={19} />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-navy sm:text-lg">Punya kode dari penjual?</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-navy/65 sm:text-sm">
                Masukkan kode toko untuk langsung membuka katalognya tanpa scroll.
              </p>
            </div>
          </div>

          <div className="sm:w-[22rem]">
            <div className="flex gap-2">
              <input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                placeholder="Masukkan kode"
                aria-label="Kode toko"
                maxLength={8}
                className="min-h-11 min-w-0 flex-1 rounded-full border border-navy/10 bg-white px-4 py-2.5 text-base font-bold uppercase tracking-[0.15em] text-navy outline-none transition placeholder:font-medium placeholder:tracking-widest placeholder:text-navy/65 focus:border-accent focus:ring-4 focus:ring-accent/10 sm:min-h-0 sm:text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-navy px-4 text-sm font-semibold text-white transition duration-300 hover:bg-accent active:scale-95 disabled:opacity-60 sm:min-h-10"
              >
                <Search size={15} /> Cek
              </button>
            </div>
            {error ? (
              <p role="alert" className="mt-1.5 pl-2 text-[11px] font-semibold text-red-700">
                {error}
              </p>
            ) : (
              <p className="mt-1.5 pl-2 text-[10px] text-navy/65">
                Kode toko terdiri dari MD- dan 4 angka.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
