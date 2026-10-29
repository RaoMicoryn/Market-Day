import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const WishlistCtx = createContext(null);
export const useWishlist = () => useContext(WishlistCtx);

const KEY = "mrpl:wishlist:v1";
const isSeedProduct = (id) => /^p(?:[1-9]|1\d|2[0-4])$/.test(id);
const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v.filter((id) => !isSeedProduct(id)) : [];
  } catch {
    return [];
  }
};

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids]);

  const toggle = useCallback((id) => {
    setIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]));
  }, []);
  const has = useCallback((id) => ids.includes(id), [ids]);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(() => ({ ids, count: ids.length, toggle, has, clear }), [ids, toggle, has, clear]);
  return <WishlistCtx.Provider value={value}>{children}</WishlistCtx.Provider>;
}
