import { formatCompact } from "../../data/products";

export default function SalesChart({ labels = [], values = [] }) {
  const max = Math.max(...values, 1);
  const total = values.reduce((n, v) => n + v, 0);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy/65">Omzet 7 hari terakhir</p>
          <p className="font-display text-2xl font-extrabold text-navy">{formatCompact(total)}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          {values.filter((v) => v > 0).length} hari ada pesanan
        </span>
      </div>

      <div className="flex h-36 items-end gap-1.5 sm:gap-2" role="img" aria-label="Grafik omzet tujuh hari terakhir">
        {values.map((v, i) => (
          <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[9px] font-bold text-navy/65 opacity-0 transition group-hover:opacity-100">
              {formatCompact(v)}
            </span>
            <div
              className={`w-full rounded-t-md transition-all duration-500 ${
                v > 0 ? "bg-gradient-to-t from-accent to-amber-300" : "bg-navy-50"
              } group-hover:brightness-105`}
              style={{ height: `${Math.max(v > 0 ? 8 : 3, (v / max) * 100)}%` }}
              title={`${labels[i]}: ${v}`}
            />
            <span className="text-[9px] font-semibold uppercase text-navy/65">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
