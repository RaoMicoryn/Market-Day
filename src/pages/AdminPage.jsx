import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Store,
  Trash2,
} from "lucide-react";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { getStores, deleteStoreAdmin, logout } from "../db/repository";
import { useDb, useSession } from "../db/useDb";
import { usePageTitle } from "../hooks/usePageTitle";

/**
 * Halaman admin khusus pembina / pembuat website.
 * Membutuhkan login admin (isAdmin) sebelum bisa mengakses.
 * Digunakan untuk membersihkan toko uji / coba (asalan).
 */
export default function AdminPage() {
  usePageTitle("Admin Pembina");
  const session = useSession();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const isAdmin = Boolean(session && session.isAdmin);

  // Semua hook wajib dipanggil sebelum return kondisi apa pun (aturan React).
  const { data: stores, loading } = useDb(
    () => (isAdmin ? getStores() : Promise.resolve([])),
    [isAdmin],
  );
  const [deleting, setDeleting] = useState(null);

  if (session === undefined) {
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
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

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

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <section className="shell pb-8 pt-4 sm:py-10">
      <Link to="/" className="mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-navy/55 transition duration-200 hover:bg-white hover:text-price">
        <ArrowLeft size={16} /> Kembali ke beranda
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7 sm:gap-4">
        <div>
          <p className="eyebrow mb-1.5">Admin Pembina</p>
          <h1 className="font-display text-[22px] font-extrabold tracking-tight text-navy sm:text-3xl">
            Kelola semua toko
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-navy/60 sm:text-sm">
            Halaman khusus pembina website. Hapus toko uji / coba yang dibuat saat percobaan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700">
            <AlertCircle size={12} /> Hanya untuk pembina website
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-navy/10 bg-white px-3 py-1.5 text-[11px] font-bold text-navy/60 shadow-sm transition duration-200 hover:border-red-200 hover:text-red-700"
          >
            Keluar
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-navy/10 bg-white/70 p-10 text-center shadow-card">
          <Store size={32} className="mx-auto text-navy/20" />
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy sm:text-xl">
            Belum ada toko terdaftar
          </h2>
          <p className="mt-1 text-[13px] text-navy/55 sm:text-sm">
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
                className="card p-4 transition duration-300 hover:border-accent/20 hover:shadow-lift sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-navy/10 sm:h-16 sm:w-16"
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
                      <p className="mt-0.5 truncate text-[11px] text-navy/60 sm:text-[12px]">
                        {s.code} · {s.kelas} · {itemCount} produk
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      to={`/toko/${s.slug}`}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-navy/10 bg-white px-3 text-[11px] font-bold text-navy/60 shadow-sm transition duration-200 hover:border-accent/40 hover:text-price sm:min-h-11 sm:text-sm"
                    >
                      <ExternalLink size={13} className="text-navy/25" /> Lihat
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      disabled={deleting === s.id}
                      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition duration-200 active:scale-95 sm:min-h-11 sm:text-sm ${
                        deleting === s.id
                          ? "cursor-not-allowed bg-navy/10 text-navy/40"
                          : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
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

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
                  <div className="rounded-2xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy/50">
                      Produk
                    </p>
                    <p className="tnum font-display text-lg font-extrabold text-navy">
                      {itemCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy/50">
                      Kode toko
                    </p>
                    <p className="tnum truncate font-display text-sm font-extrabold text-navy sm:text-base">
                      {s.code}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy/50">
                      Anggota
                    </p>
                    <p className="tnum font-display text-lg font-extrabold text-navy">
                      {s.members?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-navy/[0.06] bg-navy/[0.02] p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-navy/50">
                      Status
                    </p>
                    <p className={`font-display text-sm font-extrabold sm:text-base ${s.isOpen ? "text-emerald-700" : "text-red-700"}`}>
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
        <p className="text-center text-xs text-navy/50">
          Tribiz Fest &copy; {new Date().getFullYear()} · Admin pembina
        </p>
      </div>
    </section>
  );
}
