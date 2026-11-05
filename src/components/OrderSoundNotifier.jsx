import { useEffect, useRef, useState } from "react";
import { getSession, getOrders } from "../db/repository";

const RING_URL = "/ring-tuturu.mp3";
const POLL_INTERVAL_MS = 5000;

/**
 * OrderSoundNotifier dipasang secara global (App.jsx) agar penjual/owner
 * mendapatkan notifikasi suara "ring" setiap ada pesanan baru, tanpa harus
 * membuka halaman dashboard. Audio hanya aktif untuk sesi penjual
 * (session.storeId terdefinisi) dan dibuka (unlock) saat interaksi pertama
 * pengguna karena kebijakan autoplay browser.
 */
export default function OrderSoundNotifier() {
  const audioRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const storeIdRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const baselinedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const unlock = () => {
      if (!enabled) {
        setEnabled(true);
        try {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => audioRef.current.pause()).catch(() => {});
          }
        } catch {}
      }
    };
    document.addEventListener("pointerdown", unlock, { once: true, passive: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, [enabled]);

  const playRing = () => {
    if (!enabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  useEffect(() => {
    let mounted = true;

    const loop = async () => {
      try {
        const session = await getSession();
        if (!mounted) return;
        if (!session || !session.storeId) {
          storeIdRef.current = null;
          baselinedRef.current = false;
          seenIdsRef.current = new Set();
          return;
        }

        if (session.storeId !== storeIdRef.current) {
          storeIdRef.current = session.storeId;
          baselinedRef.current = false;
          seenIdsRef.current = new Set();
        }

        const orders = await getOrders(session.storeId);
        if (!mounted) return;
        const ids = new Set((orders || []).map((o) => String(o.id)));

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
      } catch {
        // Gagal mengambil pesanan: diam saja, coba lagi pada siklus berikutnya.
      }
    };

    loop();
    timerRef.current = setInterval(loop, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled]);

  return <audio ref={audioRef} src={RING_URL} preload="auto" />;
}
