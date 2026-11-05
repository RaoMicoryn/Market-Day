import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    const base = "Tribiz Fest";
    document.title = title ? `${title} · ${base}` : `${base} — pesan tanpa antre`;
  }, [title]);
}
