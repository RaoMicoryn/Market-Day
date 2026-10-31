import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { copyText } from "../utils/clipboard";

export default function StoreCodeCard({ code, slug }) {
  const [copied, setCopied] = useState(""); // "code" | "link"

  const copy = async (kind) => {
    const ok = await copyText(kind === "code" ? code : `${window.location.origin}/toko/${slug}`);
    if (!ok) return;
    setCopied(kind);
    setTimeout(() => setCopied(""), 1800);
  };

  const share = () => {
    const text = `Kunjungi booth kami. Kode toko: ${code} — ${window.location.origin}/toko/${slug}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const btn =
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition duration-300 active:scale-95";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-700 to-navy-900 p-5 text-white shadow-soft sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Kode toko</p>
          <p className="mt-1 font-display text-3xl font-extrabold tracking-[0.18em] text-accent-300 sm:text-4xl" aria-label={`Kode toko ${code}`}>
            {code}
          </p>
          <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-white/50">
            Bagikan kode atau link ini agar pembeli langsung menemukan tokomu.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => copy("code")} className={`${btn} bg-accent text-white hover:bg-price`}>
            {copied === "code" ? <Check size={14} /> : <Copy size={14} />} {copied === "code" ? "Tersalin" : "Salin kode"}
          </button>
          <button type="button" onClick={() => copy("link")} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
            {copied === "link" ? <Check size={14} /> : <Link2 size={14} />} {copied === "link" ? "Tersalin" : "Salin link"}
          </button>
          <button type="button" onClick={share} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
