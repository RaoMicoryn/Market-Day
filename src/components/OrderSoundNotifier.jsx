import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSession, getOrders, subscribe, ORDER_POLL_INTERVAL_MS } from "../db/repository";

const RING_URL = "/ring-tuturu.mp3";
// Notifikasi tidak perlu secepat tracker pesanan; polling berhenti otomatis saat tab tersembunyi.
const NOTIFIER_POLL_MS = Math.max(ORDER_POLL_INTERVAL_MS, 10_000);

/**
 * OrderSoundNotifier dipasang secara global (App.jsx) agar penjual/owner
 * mendapatkan notifikasi suara "ring" setiap ada pesanan baru, tanpa harus
 * membuka halaman dashboard. Audio hanya aktif untuk sesi penjual
 * (session.storeId terdefinisi) dan dibuka (unlock) saat interaksi pertama
 * pengguna karena kebijakan autoplay browser.
 *
 * Sesi hanya dicek saat berpindah halaman (bukan tiap beberapa detik), dan
 * pesanan hanya di-polling selama ada sesi penjual dan tab sedang terlihat.
 */
export default function OrderSoundNotifier() {
  const audioRef = useRef(null);
  const enabledRef = useRef(false);
  const seenIdsRef = useRef(new Set());
  const baselinedRef = useRef(false);
  const { pathname } = useLocation();
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    const unlock = () => {
      if (enabledRef.current) return;
      enabledRef.current = true;
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().then(() => audioRef.current.pause()).catch(() => {});
        }
      } catch {}
    };
    document.addEventListener("pointerdown", unlock, { once: true, passive: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  // Cek sesi penjual: sekali saat dimuat, lalu hanya saat pindah halaman (login/logout selalu berpindah halaman).
  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (active) setStoreId(session?.storeId || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!storeId) return undefined;
    let active = true;
    seenIdsRef.current = new Set();
    baselinedRef.current = false;

    const playRing = () => {
      if (!enabledRef.current || !audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    };

    const check = async () => {
      const orders = await getOrders(storeId); // error dilempar agar subscribe() menerapkan backoff
      if (!active) return;
      const ids = new Set((orders || []).map((order) => String(order.id)));

      if (!baselinedRef.current) {
        seenIdsRef.current = ids;
        baselinedRef.current = true;
        return;
      }
      for (const id of ids) {
        if (!seenIdsRef.current.has(id)) {
          playRing();
          break;
        }
      }
      seenIdsRef.current = ids;
    };

    check().catch(() => {});
    const off = subscribe(check, { pollIntervalMs: NOTIFIER_POLL_MS });
    return () => {
      active = false;
      off();
    };
  }, [storeId]);

  return <audio ref={audioRef} src={RING_URL} preload="none" />;
}
