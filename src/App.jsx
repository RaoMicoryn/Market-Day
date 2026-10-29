import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import CheckoutPage from "./components/CheckoutPage";
import CartDrawer from "./components/CartDrawer";
import OrderTracker from "./components/OrderTracker";
import HomePage from "./pages/HomePage";
import StorePage from "./pages/StorePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import DashboardPage from "./pages/DashboardPage";
import WishlistPage from "./pages/WishlistPage";
import OrdersPage from "./pages/OrdersPage";
import VerifyPage from "./pages/VerifyPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useCart } from "./context/CartContext";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

function CheckoutRoute() {
  const { cart, total, changeQty } = useCart();
  return <CheckoutPage cart={cart} total={total} onChangeQty={changeQty} />;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[500] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Lewati ke konten
      </a>
      <ScrollManager />
      <Header />
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/toko/:slug" element={<StorePage />} />
          <Route path="/cari" element={<SearchPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/pesanan" element={<OrdersPage />} />
          <Route path="/checkout" element={<CheckoutRoute />} />
          <Route path="/verifikasi" element={<VerifyPage />} />
          <Route path="/dashboard/login" element={<LoginPage />} />
          <Route path="/dashboard/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <CartDrawer />
      <OrderTracker />
    </div>
  );
}
