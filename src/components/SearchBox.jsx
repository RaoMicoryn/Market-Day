import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Loader2, Search, Store, X } from "lucide-react";
import ProductImage from "./ProductImage";
import { StoreLogo } from "./StoreCard";
import { formatRupiah } from "../data/products";
import { getStores, searchProducts } from "../db/repository";
import { useDebounced } from "../db/useDb";

const RECENT_KEY = "mrpl:recent:v1";
const readRecent = () => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const pushRecent = (term) => {
  const t = term.trim();
  if (!t) return;
  const next = [t, ...readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};
export default function SearchBox({ autoFocus = false, onNavigate, className = "" }) {
  const navigate = useNavigate();
  const listId = useId();
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const debounced = useDebounced(q, 200);

  useEffect(() => {
    const term = debounced.trim();
    if (!term) {
      setProducts([]);
      setStores([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    Promise.all([searchProducts({ q: term }), getStores()])
      .then(([ps, ss]) => {
        if (!alive) return;
        setProducts(ps.slice(0, 4));
        const t = term.toLowerCase();
        setStores(
          ss
            .filter((s) => [s.name, s.code, s.kelas].some((x) => String(x).toLowerCase().includes(t)))
            .slice(0, 3)
        );
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debounced]);

  useEffect(() => {
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const finish = () => {
    setOpen(false);
    inputRef.current?.blur();
    onNavigate?.();
  };

  const goTerm = (term) => {
    const t = term.trim();
    if (!t) return;
    pushRecent(t);
    setRecent(readRecent());
    navigate(`/cari?q=${encodeURIComponent(t)}`);
    finish();
  };
  const goStore = (s) => {
    pushRecent(q.trim() || s.name);
    navigate(`/toko/${s.slug}`);
    finish();
  };
  const goProduct = (p) => {
    pushRecent(q.trim() || p.name);
    navigate(`/toko/${p.storeSlug}?produk=${p.id}`);
    finish();
  };

  const items = [
    ...products.map((p) => ({ key: `p-${p.id}`, run: () => goProduct(p) })),
    ...stores.map((s) => ({ key: `s-${s.id}`, run: () => goStore(s) })),
  ];
  const showPanel = open && (q.trim().length > 0 || recent.length > 0);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) items[active].run();
      else goTerm(q);
    }
  };

  const highlight = (index) => (active === index ? "bg-navy-50" : "hover:bg-navy-50");

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && items[active]) items[active].run();
          else goTerm(q);
        }}
      >
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/65" />
        <input
          ref={inputRef}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari produk, toko, atau kode..."
          aria-label="Cari produk atau toko"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-12 w-full rounded-full border border-navy/10 bg-navy/[0.04] pl-11 pr-11 text-base text-ink outline-none transition placeholder:text-navy/65 focus:border-accent/60 focus:bg-white focus:ring-4 focus:ring-accent/10 sm:h-11 sm:text-sm"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setActive(-1);
              inputRef.current?.focus();
            }}
            aria-label="Hapus pencarian"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-navy/65 transition hover:bg-navy/5 hover:text-navy active:scale-90"
          >
            <X size={15} />
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-navy/10 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-navy/65 sm:block">
            ⌘K
          </span>
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60dvh] animate-pop overflow-y-auto rounded-2xl border border-navy/[0.07] bg-white p-2 shadow-lift sm:max-h-[70vh]"
        >
          {!q.trim() ? (
            <div className="p-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-navy/65">Pencarian terakhir</p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(RECENT_KEY);
                    setRecent([]);
                  }}
                  className="text-[11px] font-semibold text-navy/65 hover:text-price"
                >
                  Hapus
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recent.length === 0 && <p className="text-xs text-navy/65">Pencarian yang kamu gunakan akan tampil di sini.</p>}
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => goTerm(r)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy/70 transition hover:bg-navy-100 hover:text-navy"
                  >
                    <Clock size={12} /> {r}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-sm text-navy/65">
              <Loader2 size={15} className="animate-spin" /> Mencari “{q}”...
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-sm font-semibold text-navy">Tidak ada hasil untuk “{q}”</p>
              <p className="mt-1 text-xs text-navy/65">Coba kata kunci lain atau cek kode toko yang kamu punya.</p>
            </div>
          ) : (
            <>
              {products.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-navy/65">Produk</p>
                  {products.map((p, i) => (
                    <button
                      key={p.id}
                      id={`${listId}-${i}`}
                      type="button"
                      role="option"
                      aria-selected={active === i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => goProduct(p)}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${highlight(i)}`}
                    >
                      <ProductImage product={p} className="h-10 w-10 shrink-0 rounded-lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy">{p.name}</span>
                        <span className="block truncate text-xs text-navy/65">
                          {p.storeName} · {p.category}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-price">{formatRupiah(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
              {stores.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-navy/65">Toko</p>
                  {stores.map((s, i) => {
                    const index = products.length + i;
                    return (
                      <button
                        key={s.id}
                        id={`${listId}-${index}`}
                        type="button"
                        role="option"
                        aria-selected={active === index}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => goStore(s)}
                        className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${highlight(index)}`}
                      >
                        <StoreLogo store={s} className="h-10 w-10 text-sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-navy">{s.name}</span>
                          <span className="block truncate text-xs text-navy/65">
                            {s.kelas} · {s.code}
                          </span>
                        </span>
                        <Store size={15} className="shrink-0 text-navy/30" />
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => goTerm(q)}
                className="mt-1 flex w-full items-center justify-between rounded-xl bg-navy px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700"
              >
                Lihat semua hasil untuk “{q.trim()}” <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
