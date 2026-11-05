import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Store,
  Trash2,
  Users,
  MapPin,
  Package,
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { getStores, deleteStoreAdmin } from "../db/repository";
import { useDb } from "../db/useDb";
import { usePageTitle } from "../hooks/usePageTitle";

/**
 * Halaman admin khusus pembina / pembuat website.
 * Bisa diakses langsung tanpa login penjual. Digunakan untuk membersihkan
 * toko uji / coba (asalan) yang dibuat saat percobaan.
 */
export default function AdminPage() {
  usePageTitle("Admin Pembina");
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  const { data: stores, loading } = useDb(getStores, []);
  const [deleting, setDeleting] = useState(null);

  if (loading) {
    return (
      <div className="shell max-w-4xl py-4 sm:py-10">
        <div className="skeleton h-24 w-full rounded-3xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="skeleton h-28 rounded-3xl" />
          <div className="skeleton h-28 rounded-3xl" />
        </div>
      </div>
    );
  }

  const list = (stores || []).sort((a, b) => b.productCount - a.productCount);

  const handleDelete = async (store) => {
    const ok = await confirm({
      title: `Hapus toko “${store.name}”?`,
      message:
        "Produk, riwayat pesanan, dan akun terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Ya, hapus toko ini",
      cancelLabel: "Batal",
      danger: true,
    });
    if (!ok) return;

    setDeleting(store.id);
    try {
      await deleteStoreAdmin(store.id);
      toast(`Toko “${store.name}” dihapus.`, { type: "success", duration: 2500 });
    } catch (error) {
      toast(error.message || "Gagal menghapus toko.", { type: "error", duration: 3500 });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="shell pb-8 pt-4 sm:py-10">
      <Link to="/" className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-navy/65 transition hover:text-price">
        <ArrowLeft size={16} /> Kembali ke beranda
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7 sm:gap-4">
        <div>
          <p className="eyebrow mb-1.5">Admin Pembina</p>
          <h1 className="font-display text-[22px] font-extrabold text-navy sm:text-3xl">
            Kelola semua toko
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-navy/65 sm:text-sm">
            Halaman khusus pembina website. Hapus toko uji / coba yang dibuat saat percobaan.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700">
          <AlertCircle size={12} /> Hanya untuk pembina website
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/10 bg-white/60 p-10 text-center">
          <Store size={32} className="mx-auto text-navy/20" />
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy sm:text-xl">
            Belum ada toko terdaftar
          </h2>
          <p className="mt-1 text-[13px] text-navy/65 sm:text-sm">
            Data toko kosong. Tidak ada yang perlu dibersihkan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((s) => {
            const itemCount = s.productCount ?? 0;
            return (
              <article
                key={s.id}
                className="card p-4 sm:p-5 transition-all duration-300 border-navy bg-white shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl sm:h-16 sm:w-16 border-2 border-accent"
                    >
                      {s.cover ? (
                        <img
                          src={s.cover}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-600 via-navy to-navy-900">
                          <span className="font-display text-3xl font-extrabold text-white/15">
                            {s.name.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold leading-tight text-navy sm:text-base">
                        {s.name}
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] text-navy/65 sm:text-[12px]">
                        {s.code} · {s.kelas} · {itemCount} produk
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      to={`/toko/${s.slug}`}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-navy/10 px-3 text-[11px] font-bold text-navy/65 transition hover:text-price sm:min-h-11 sm:text-sm"
                    >
                      <ExternalLinkIcon size={13} className="text-navy/20" /> Lihat
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      disabled={deleting === s.id}
                      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition active:scale-95 sm:min-h-11 sm:text-sm ${
                        deleting === s.id
                          ? "bg-navy/10 text-navy/40 cursor-not-allowed"
                          : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                      }`}
                    >
                      {deleting === s.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Trash2 size={13} /> Hapus
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-4 sm:gap-4">
                  <div className="rounded-xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold text-navy/65 uppercase tracking-wider">
                      Produk
                    </p>
                    <p className="font-display text-lg font-extrabold text-navy">
                      {itemCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold text-navy/65 uppercase tracking-wider">
                      Kode toko
                    </p>
                    <p className="truncate font-display text-sm font-extrabold text-navy sm:text-base">
                      {s.code}
                    </p>
                  </div>
                  <div className="rounded-xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold text-navy/65 uppercase tracking-wider">
                      Anggota
                    </p>
                    <p className="font-display text-lg font-extrabold text-navy">
                      {s.members?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold text-navy/65 uppercase tracking-wider">
                      Status
                    </p>
                    <p className="font-display text-sm font-extrabold text-navy sm:text-base">
                      {s.isOpen ? "Buka" : "Tutup"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10 border-t border-navy/[0.06] pt-6 sm:mt-16 sm:pt-8">
        <p className="text-center text-xs text-navy/55">
          Tribiz Fest &copy; {new Date().getFullYear()} · Admin pembina
        </p>
      </div>
    </section>
  );
}

function ExternalLinkIcon({ size = 13, className = "" }) {
  return (
    <svg
      className={`h-${size} w-${size} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function Loader2({ size = 14, className = "" }) {
  return (
    <svg
      className={`animate-spin h-${size} w-${size} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
