import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    const base = "market day";
    document.title = title ? `${title} · ${base}` : `${base} — jajan tanpa antre`;
  }, [title]);
}
