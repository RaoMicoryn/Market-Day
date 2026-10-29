import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Aksi belanja bersama. Produk wajib membawa storeId, storeName, dan storeOpen.
export function useShopping() {
  const navigate = useNavigate();
  const { addToCart, addSilently, notify } = useCart();
  const [selected, setSelected] = useState(null);

  const guard = (fn) => (p, config) => {
    if (p.storeOpen === false) return notify(`${p.storeName} sedang tutup.`);
    if (p.inStock === false) return notify(`${p.name} sedang habis.`);
    fn(p, config);
  };
  return {
    selected,
    setSelected,
    onAdd: guard(addToCart),
    onBuy: guard((p, config) => (addSilently(p, config), navigate("/checkout"))),
  };
}
