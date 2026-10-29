import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { login } from "../db/repository";
import { useSession } from "../db/useDb";
import { usePageTitle } from "../hooks/usePageTitle";

export default function LoginPage() {
  usePageTitle("Masuk penjual");
  const navigate = useNavigate();
  const session = useSession();
  const [f, setF] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const set = (e) => {
    setF((v) => ({ ...v, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(f.email, f.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke dashboard"
      subtitle="Kelola produk dan pesanan booth kamu."
      footer={
        <>
          Belum punya toko?{" "}
          <Link to="/dashboard/register" className="link-quiet">
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField
          label="Email / username"
          name="email"
          value={f.email}
          onChange={set}
          autoComplete="username"
          placeholder="Email atau username"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={f.password}
          onChange={set}
          autoComplete="current-password"
          placeholder="Minimal 6 karakter"
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Memeriksa..." : "Masuk"} {!busy && <ArrowRight size={15} />}
        </button>

      </form>
    </AuthLayout>
  );
}
