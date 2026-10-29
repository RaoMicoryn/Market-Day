import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ClipboardList, ExternalLink, LayoutDashboard, LogOut, Package, Store } from "lucide-react";
import { OpenBadge, StoreLogo } from "../components/StoreCard";
import OverviewTab from "../components/dashboard/OverviewTab";
import OrdersTab from "../components/dashboard/OrdersTab";
import ProductsTab from "../components/dashboard/ProductsTab";
import StoreProfileForm from "../components/dashboard/StoreProfileForm";
import { getOrders, getStoreById, logout, setStoreOpen } from "../db/repository";
import { useDb, useSession } from "../db/useDb";
import { useToast } from "../context/ToastContext";
import { usePageTitle } from "../hooks/usePageTitle";

const TABS = [
  { id: "overview", label: "Ringkasan", Icon: LayoutDashboard },
  { id: "orders", label: "Pesanan", Icon: ClipboardList },
  { id: "products", label: "Produk", Icon: Package },
  { id: "store", label: "Toko", Icon: Store },
];

export default function DashboardPage() {
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle("Dashboard penjual");
  const [tab, setTab] = useState("overview");

  const { data: store, loading } = useDb(
    () => (session ? getStoreById(session.storeId) : Promise.resolve(null)),
    [session?.storeId]
  );
  const { data: orders } = useDb(
    () => (session ? getOrders(session.storeId) : Promise.resolve([])),
    [session?.storeId]
  );

  if (session === null) return <Navigate to="/dashboard/login" replace />;

  if (session === undefined || loading || !store)
    return (
      <div className="shell max-w-4xl py-10">
        <div className="skeleton h-24 w-full rounded-3xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="skeleton h-28 rounded-3xl" />
          <div className="skeleton h-28 rounded-3xl" />
        </div>
      </div>
    );

  const pending = (orders || []).filter((o) => o.status === "pending").length;

  const toggleOpen = async () => {
    await setStoreOpen(store.id, !store.isOpen);
    toast(store.isOpen ? "Toko ditutup sementara." : "Toko dibuka. Pembeli bisa memesan lagi.", {
      type: store.isOpen ? "warning" : "success",
    });
  };

  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <section className="shell py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-navy/[0.06] bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-center gap-3">
          <StoreLogo store={store} className="h-14 w-14 text-xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-lg font-extrabold text-navy sm:text-xl">{store.name}</h1>
              <OpenBadge isOpen={store.isOpen} />
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-navy/65">
              {store.kelas} · {store.code} · {store.members?.length || 0} anggota
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/toko/${store.slug}`} className="btn-ghost">
            <ExternalLink size={14} /> Lihat toko
          </Link>
          <button
            type="button"
            onClick={toggleOpen}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
              store.isOpen
                ? "border border-navy/10 bg-white text-navy/70 hover:border-red-300 hover:text-red-700"
                : "bg-emerald-700 text-white shadow-soft hover:bg-emerald-800"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${store.isOpen ? "bg-emerald-500" : "bg-white"}`} />
            {store.isOpen ? "Tutup toko" : "Buka toko"}
          </button>
          <button
            type="button"
            onClick={doLogout}
            aria-label="Keluar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/10 text-navy/65 transition hover:border-red-300 hover:text-red-700"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
        <nav aria-label="Menu dashboard" className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:px-0">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-navy text-white shadow-soft" : "text-navy/65 hover:bg-white hover:text-navy"
                }`}
              >
                <Icon size={16} />
                {label}
                {id === "orders" && pending > 0 && (
                  <span className={`ml-auto rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-accent text-white" : "bg-accent-100 text-price"}`}>
                    {pending}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {tab === "overview" && <OverviewTab store={store} orders={orders || []} />}
          {tab === "orders" && <OrdersTab store={store} />}
          {tab === "products" && <ProductsTab store={store} />}
          {tab === "store" && <StoreProfileForm store={store} />}
        </div>
      </div>
    </section>
  );
}
