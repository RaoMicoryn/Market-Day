import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { unitPrice } from "../data/products";
import { useToast } from "./ToastContext";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

const CART_KEY = "mrpl:cart:v3";
const LEGACY_CART_KEY = "mrpl:cart:v2";
const TRACK_KEY = "mrpl:myorders";
const CUSTOMER_KEY = "mrpl:customer:v1";
const isSeedProduct = (id) => /^p(?:[1-9]|1\d|2[0-4])$/.test(id);
const isSeedOrder = (id) => /^o(?:[1-9]|1[0-4])$/.test(id);

const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const readCart = () => {
  const current = read(CART_KEY, null);
  if (Array.isArray(current)) return current.filter((i) => i?.product?.id && !isSeedProduct(i.product.id));
  const legacy = read(LEGACY_CART_KEY, []);
  return Array.isArray(legacy)
    ? legacy.filter((i) => i?.product?.id && !isSeedProduct(i.product.id))
    : [];
};
const readTrackIds = () => {
  const ids = read(TRACK_KEY, []);
  return Array.isArray(ids) ? ids.filter((id) => !isSeedOrder(id)) : [];
};
// Varian berbeda (es/pedas/topping) = baris keranjang berbeda
const keyOf = (id, o = {}) =>
  `${id}|${o.ice || ""}|${o.spicy || ""}|${(o.toppings || [])
    .map((t) => t.name)
    .sort()
    .join(",")}`;

export function CartProvider({ children }) {
  // item: { key, product, qty, options, unit, note }
  const [cart, setCart] = useState(readCart);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trackIds, setTrackIds] = useState(readTrackIds);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [customer, setCustomer] = useState(() => read(CUSTOMER_KEY, { nama: "", kelas: "", wa: "", note: "" }));
  const toast = useToast();
  const lastAdded = useRef(null);

  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem(TRACK_KEY, JSON.stringify(trackIds)), [trackIds]);

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const total = useMemo(() => cart.reduce((n, i) => n + i.unit * i.qty, 0), [cart]);
  const groups = useMemo(() => {
    const map = new Map();
    cart.forEach((i) => {
      const id = i.product.storeId || i.product.storeName || "lainnya";
      if (!map.has(id)) map.set(id, { id, name: i.product.storeName || "Toko", items: [] });
      map.get(id).items.push(i);
    });
    return [...map.values()];
  }, [cart]);

  const notify = (message, options) => toast(message, options);

  const addSilently = (product, { options = {}, qty = 1 } = {}) => {
    const key = keyOf(product.id, options);
    const alreadyInCart = cart.reduce(
      (total, item) => total + (item.product.id === product.id ? item.qty : 0),
      0
    );
    if (product.stockQuantity != null && alreadyInCart + qty > product.stockQuantity) {
      notify(
        product.stockQuantity === 0
          ? `${product.name} sedang habis.`
          : `Stok ${product.name} tinggal ${product.stockQuantity}. Kurangi jumlah di keranjang.`,
        { type: "warning" }
      );
      return false;
    }
    lastAdded.current = { id: product.id, key };
    setCart((c) =>
      c.some((i) => i.key === key)
        ? c.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
        : [...c, { key, product, qty, options, unit: unitPrice(product.price, options), note: "" }]
    );
    return true;
  };

  const addToCart = (product, config) => {
    if (!addSilently(product, config)) return false;
    notify(`${product.name} masuk keranjang`, { type: "success" });
    return true;
  };

  const changeQty = (key, delta) => {
    const item = cart.find((entry) => entry.key === key);
    if (!item) return;
    const productQty = cart.reduce(
      (total, entry) => total + (entry.product.id === item.product.id ? entry.qty : 0),
      0
    );
    if (delta > 0 && item.product.stockQuantity != null && productQty + delta > item.product.stockQuantity) {
      notify(`Stok ${item.product.name} tinggal ${item.product.stockQuantity}.`, { type: "warning" });
      return;
    }
    setCart((c) => c.map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  };
  const removeItem = (key) => setCart((c) => c.filter((i) => i.key !== key));
  const setNote = (key, note) => setCart((c) => c.map((i) => (i.key === key ? { ...i, note } : i)));

  const saveCustomer = (data) => {
    setCustomer(data);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
  };

  const openTracker = (ids) => {
    // Simpan riwayat: pesanan baru ditambahkan, bukan menimpa pesanan lama.
    if (ids?.length) setTrackIds((prev) => [...new Set([...ids, ...prev])]);
    setTrackerOpen(true);
  };

  const value = {
    cart,
    groups,
    cartCount,
    total,
    addToCart,
    addSilently,
    changeQty,
    removeItem,
    setNote,
    clear: () => setCart([]),
    notify,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    trackIds,
    trackerOpen,
    openTracker,
    closeTracker: () => setTrackerOpen(false),
    customer,
    saveCustomer,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
