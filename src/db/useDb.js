import { useEffect, useState } from "react";
import { getSession, subscribe } from "./repository";

// Jalankan fetcher, lalu jalankan ulang otomatis setiap ada perubahan data (real-time).
export function useDb(fetcher, deps = [], options) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    const run = () =>
      fetcher()
        .then((data) => alive && setState({ data, loading: false, error: null }))
        .catch((error) => alive && setState({ data: null, loading: false, error }));

    run();
    const off = subscribe(run, options);
    return () => {
      alive = false;
      off();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

export function useSession() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    let active = true;
    const refresh = () => getSession().then((value) => active && setSession(value));
    refresh().catch((error) => {
      console.error("Gagal memuat sesi penjual:", error);
      if (active) setSession(null);
    });
    const off = subscribe(() => refresh().catch((error) => console.error("Gagal memperbarui sesi penjual:", error)));
    return () => {
      active = false;
      off();
    };
  }, []);
  return session;
}

// Debounce nilai (dipakai untuk pencarian live).
export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
