import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, PartyPopper } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import MembersInput from "../components/MembersInput";
import StoreCodeCard from "../components/StoreCodeCard";
import { register } from "../db/repository";
import { useSession } from "../db/useDb";
import { usePageTitle } from "../hooks/usePageTitle";

const empty = { nama: "", email: "", password: "", namaToko: "", kelas: "" };

export default function RegisterPage() {
  usePageTitle("Daftar penjual");
  const navigate = useNavigate();
  const session = useSession();
  const [f, setF] = useState(empty);
  const [members, setMembers] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  if (created)
    return (
      <AuthLayout
        eyebrow="Selesai"
        title="Toko berhasil dibuat!"
        subtitle={`Selamat, ${created.name} siap berjualan. Simpan kode tokomu ya.`}
      >
        <PartyPopper className="mx-auto mb-4 text-accent" size={38} />
        <StoreCodeCard code={created.code} slug={created.slug} />
        <button type="button" onClick={() => navigate("/dashboard")} className="btn-primary mt-4 w-full">
          Ke dashboard toko
        </button>
      </AuthLayout>
    );

  if (session) return <Navigate to="/dashboard" replace />;

  const set = (e) => {
    setF((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((v) => ({ ...v, [e.target.name]: undefined }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!f.nama.trim()) found.nama = "Nama akun wajib diisi";
    if (f.email.trim().length < 3) found.email = "Minimal 3 karakter";
    if (f.password.length < 6) found.password = "Password minimal 6 karakter";
    if (!f.namaToko.trim()) found.namaToko = "Nama toko wajib diisi";
    if (!f.kelas.trim()) found.kelas = "Kelas/jurusan wajib diisi";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      setCreated(await register({ ...f, members }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Daftarkan booth kamu"
      subtitle="Buat toko dan mulai menerima pesanan. Kode toko dibuat otomatis."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/dashboard/login" className="link-quiet">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nama akun" name="nama" value={f.nama} onChange={set} error={errors.nama} autoComplete="name" placeholder="Nama kamu" />
          <FormField label="Kelas" name="kelas" value={f.kelas} onChange={set} error={errors.kelas} placeholder="Kelas / jurusan" />
        </div>
        <FormField
          label="Email / username"
          name="email"
          value={f.email}
          onChange={set}
          error={errors.email}
          autoComplete="username"
          placeholder="Email atau username"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={f.password}
          onChange={set}
          error={errors.password}
          hint="Minimal 6 karakter"
          autoComplete="new-password"
        />
        <FormField
          label="Nama toko"
          name="namaToko"
          value={f.namaToko}
          onChange={set}
          error={errors.namaToko}
          placeholder="Nama toko"
        />
        <MembersInput
          value={members}
          onChange={setMembers}
          leading={f.nama.trim() || "Nama akunmu"}
          hint="Opsional · bisa diubah nanti"
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Membuat toko..." : "Buat toko"}
        </button>
        <p className="text-center text-[11px] leading-relaxed text-navy/65">
          Dengan mendaftar, kamu menjadi penanggung jawab konten toko. Data tersimpan di server Market Day.
        </p>
      </form>
    </AuthLayout>
  );
}