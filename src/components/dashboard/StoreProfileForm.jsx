import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Save, Trash2, Users } from "lucide-react";
import FormField from "../FormField";
import { useToast } from "../../context/ToastContext";
import { updateStore } from "../../db/repository";

const MAX_BYTES = 400 * 1024;

export default function StoreProfileForm({ store }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: store.name || "",
    kelas: store.kelas || "",
    bio: store.bio || "",
    members: (store.members || []).join(", "),
    logo: store.logo || "",
    cover: store.cover || "",
  });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const coverInput = useRef(null);
  const logoInput = useRef(null);

  useEffect(() => {
    setF({
      name: store.name || "",
      kelas: store.kelas || "",
      bio: store.bio || "",
      members: (store.members || []).join(", "),
      logo: store.logo || "",
      cover: store.cover || "",
    });
  }, [store.id, store.name, store.kelas, store.bio, store.logo, store.cover, store.members]);

  const set = (e) => {
    setF((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErr((v) => ({ ...v, [e.target.name]: undefined }));
  };

  const pick = (key) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > MAX_BYTES) {
      setErr((v) => ({ ...v, [key]: "Maksimal 400 KB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setF((v) => ({ ...v, [key]: reader.result }));
      setErr((v) => ({ ...v, [key]: undefined }));
    };
    reader.onerror = () => {
      setErr((v) => ({ ...v, [key]: "Gagal membaca file gambar. Coba pilih file lain." }));
    };
    reader.readAsDataURL(file);
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
        members: f.members.split(/[,\n]/).map((m) => m.trim()).filter(Boolean),
      });
      toast("Profil toko disimpan.", { type: "success" });
    } catch (ex) {
      setErr({ name: ex.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="card overflow-hidden">
        <div className="relative h-36 bg-gradient-to-br from-navy-600 via-navy to-navy-900">
          {f.cover && <img src={f.cover} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <button type="button" onClick={() => coverInput.current?.click()} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-navy shadow-soft backdrop-blur transition hover:bg-white">
              <ImagePlus size={12} /> Ganti cover
            </button>
            <input ref={coverInput} type="file" accept="image/*" onChange={pick("cover")} className="hidden" aria-label="Pilih gambar cover toko" />
            {f.cover && (
              <button type="button" onClick={() => setF((v) => ({ ...v, cover: "" }))} aria-label="Hapus cover" className="rounded-full bg-white/90 p-1.5 text-navy/65 shadow-soft transition hover:text-red-700">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="relative px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <div className="relative">
              {f.logo ? (
                <img src={f.logo} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-white" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy font-display text-2xl font-extrabold text-white ring-4 ring-white">
                  {(f.name || "T").slice(0, 1).toUpperCase()}
                </span>
              )}
              <button type="button" onClick={() => logoInput.current?.click()} className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-glow transition hover:bg-price" title="Ganti logo" aria-label="Ganti logo">
                <ImagePlus size={13} />
              </button>
              <input ref={logoInput} type="file" accept="image/*" onChange={pick("logo")} className="hidden" aria-label="Pilih gambar logo toko" />
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
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
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

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="members" className="text-[13px] font-bold text-navy">
              Anggota kelompok
            </label>
            <span className="flex items-center gap-1 text-[11px] text-navy/65">
              <Users size={11} /> pisahkan dengan koma
            </span>
          </div>
          <input
            id="members"
            name="members"
            value={f.members}
            onChange={set}
            placeholder="Nama anggota"
            className="field"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>
      </div>
    </form>
  );
}
