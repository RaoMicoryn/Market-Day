import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { loginAdmin } from "../db/repository";
import { useSession } from "../db/useDb";
import { usePageTitle } from "../hooks/usePageTitle";

export default function AdminLoginPage() {
  usePageTitle("Masuk Admin");
  const navigate = useNavigate();
  const session = useSession();
  const [f, setF] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session && session.isAdmin) return <Navigate to="/admin" replace />;

  const set = (e) => {
    setF((v) => ({ ...v, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loginAdmin(f.email, f.password);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke admin"
      subtitle="Kelola semua toko dari satu tempat."
      footer={
        <>
          Kembali ke{" "}
          <Link to="/" className="link-quiet">
            beranda
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField
          label="Email admin"
          name="email"
          value={f.email}
          onChange={set}
          autoComplete="username"
          placeholder="Email admin"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={f.password}
          onChange={set}
          autoComplete="current-password"
          placeholder="Masukkan password admin"
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Memeriksa..." : "Masuk"} {!busy && <ArrowRight size={15} />}
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-navy/50">
          Halaman ini hanya untuk pembina website. Data admin diatur lewat
          environment variable (ADMIN_EMAIL &amp; ADMIN_PASSWORD_HASH).
        </p>
      </form>
    </AuthLayout>
  );
}
