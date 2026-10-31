import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import FormField from "../FormField";
import MembersInput from "../MembersInput";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { deleteStore, updateStore } from "../../db/repository";
import { imageFileToDataUrl } from "../../utils/imageUpload";

export default function StoreProfileForm({ store }) {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [f, setF] = useState({
    name: store.name || "",
    kelas: store.kelas || "",
    bio: store.bio || "",
    members: store.members || [],
    logo: store.logo || "",
    cover: store.cover || "",
  });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setF({
      name: store.name || "",
      kelas: store.kelas || "",
      bio: store.bio || "",
      members: store.members || [],
      logo: store.logo || "",
      cover: store.cover || "",
    });
  }, [store.id, store.name, store.kelas, store.bio, store.logo, store.cover, store.members]);

  const set = (e) => {
    setF((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErr((v) => ({ ...v, [e.target.name]: undefined }));
  };

  const pick = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const image = await imageFileToDataUrl(file);
      setF((v) => ({ ...v, [key]: image }));
      setErr((v) => ({ ...v, [key]: undefined }));
    } catch (error) {
      setErr((v) => ({ ...v, [key]: error.message }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!f.name.trim()) found.name = "Nama toko wajib diisi";
    if (!f.kelas.trim()) found.kelas = "Kelas wajib diisi";
    setErr(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await updateStore(store.id, {
        name: f.name,
        kelas: f.kelas,
        bio: f.bio,
        logo: f.logo,
        cover: f.cover,
        members: f.members,
      });
      toast("Profil toko disimpan.", { type: "success" });
    } catch (ex) {
      setErr({ name: ex.message });
    } finally {
      setSaving(false);
    }
  };

  const removeStore = async () => {
    const approved = await confirm({
      title: `Hapus toko “${store.name}” secara permanen?`,
      message: "Toko, akun penjual, semua produk, dan seluruh riwayat pesanan terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Hapus permanen",
      danger: true,
    });
    if (!approved) return;

    setDeleting(true);
    try {
      await deleteStore(store.id);
      toast("Toko dan seluruh datanya telah dihapus.", { type: "success" });
      navigate("/", { replace: true });
    } catch (error) {
      toast(error.message || "Toko gagal dihapus. Coba lagi.", { type: "error" });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="card overflow-hidden">
        <div className="relative h-36 bg-gradient-to-br from-navy-600 via-navy to-navy-900">
          {f.cover && <img src={f.cover} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
          <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
            <label className="relative inline-flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-navy shadow-soft backdrop-blur transition hover:bg-white">
              <ImagePlus size={12} /> Ganti cover
              <input
                type="file"
                accept="image/*"
                onChange={pick("cover")}
                aria-label="Pilih gambar cover toko"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            {f.cover && (
              <button type="button" onClick={() => setF((v) => ({ ...v, cover: "" }))} aria-label="Hapus cover" className="rounded-full bg-white/90 p-1.5 text-navy/65 shadow-soft transition hover:text-red-700">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="relative px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="-mt-10 flex items-end gap-3 sm:gap-4">
            <div className="relative">
              {f.logo ? (
                <img src={f.logo} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-white" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy font-display text-2xl font-extrabold text-white ring-4 ring-white">
                  {(f.name || "T").slice(0, 1).toUpperCase()}
                </span>
              )}
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-accent text-white shadow-glow transition hover:bg-price" title="Ganti logo">
                <ImagePlus size={13} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={pick("logo")}
                  aria-label="Pilih gambar logo toko"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
            <div className="pb-1">
              <p className="text-sm font-bold text-navy">{f.name || "Nama toko"}</p>
              <p className="text-[11px] text-navy/65">
                {store.code} · {f.kelas || "Kelas"}
              </p>
            </div>
            {f.logo && (
              <button type="button" onClick={() => setF((v) => ({ ...v, logo: "" }))} className="mb-1 ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-navy/65 hover:text-red-700">
                <Trash2 size={11} /> Hapus logo
              </button>
            )}
          </div>
          {err.logo && <p className="mt-2 text-[11px] font-semibold text-red-700">{err.logo}</p>}
          {err.cover && <p className="mt-2 text-[11px] font-semibold text-red-700">{err.cover}</p>}
          <p className="mt-2 text-[10px] text-navy/65">Logo dan banner maksimal 2 MB per file; gambar dikompres otomatis.</p>
        </div>
      </div>

      <div className="card space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nama toko" name="name" value={f.name} onChange={set} error={err.name} maxLength={40} />
          <FormField label="Kelas / jurusan" name="kelas" value={f.kelas} onChange={set} error={err.kelas} placeholder="Kelas / jurusan" />
        </div>

        <FormField
          label="Deskripsi toko"
          name="bio"
          multiline
          value={f.bio}
          onChange={set}
          maxLength={240}
          hint={`${f.bio.length}/240`}
          placeholder="Ceritakan keunikan booth kamu, menu andalan, atau jam buka."
        />

        <MembersInput value={f.members} onChange={(members) => setF((v) => ({ ...v, members }))} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="URL logo"
            name="logo"
            value={f.logo.startsWith("data:") ? "" : f.logo}
            onChange={set}
            placeholder="https://..."
            hint="Opsional"
          />
          <FormField
            label="URL cover"
            name="cover"
            value={f.cover.startsWith("data:") ? "" : f.cover}
            onChange={set}
            placeholder="https://..."
            hint="Opsional"
          />
        </div>

        <div className="flex justify-end border-t border-navy/[0.06] pt-4">
          <button type="submit" disabled={saving || deleting} className="btn-primary w-full sm:w-auto">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>
      </div>
    </form>
    <section className="card flex flex-col gap-3 border border-red-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <h2 className="text-sm font-bold text-red-800">Hapus toko</h2>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-navy/65">
          Menghapus akun, produk, dan riwayat pesanan secara permanen. Tindakan ini tidak bisa dibatalkan.
        </p>
      </div>
      <button
        type="button"
        onClick={removeStore}
        disabled={saving || deleting}
        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {deleting ? <Loader2 size={15} className="animate-spin" /> : <AlertTriangle size={15} />}
        {deleting ? "Menghapus..." : "Hapus toko"}
      </button>
    </section>
    </div>
  );
}
