import { useEffect, useState } from "react";
import { CATEGORY_META } from "../data/products";

// Foto produk -> fallback lokal -> placeholder berwarna (tidak pernah kotak abu-abu kosong).
export default function ProductImage({ product, className = "", zoom = false }) {
  const sources = [product.image, product.local].filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [product.id, product.image]);
  const meta = CATEGORY_META[product.category];

  return (
    <div
      className={`relative overflow-hidden ${
        meta ? `bg-gradient-to-br ${meta.tone}` : "bg-navy-50"
      } ${className}`}
    >
      {sources[i] ? (
        <img
          src={sources[i]}
          alt={product.name}
          loading="lazy"
          onError={() => setI((n) => n + 1)}
          className={`h-full w-full object-cover ${zoom ? "transition-transform duration-700 ease-out group-hover:scale-110" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" aria-hidden="true">
          <span className="text-4xl drop-shadow-sm sm:text-5xl">{meta?.emoji || "🍽️"}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy/65">{meta?.short || "Menu"}</span>
        </div>
      )}
    </div>
  );
}
