import { useState } from "react";
import { Plus, Users, X } from "lucide-react";

const MAX_NAME = 40;

/**
 * Input anggota kelompok berbentuk "chip".
 * - Enter / koma / tombol Tambah untuk menambah nama
 * - Klik X (atau Backspace saat input kosong) untuk menghapus
 * - `leading`: nama tetap di awal daftar (tidak bisa dihapus), dipakai saat pendaftaran
 */
export default function MembersInput({
  value = [],
  onChange,
  max = 10,
  leading = "",
  label = "Anggota kelompok",
  hint,
  placeholder = "Ketik nama anggota, lalu Enter",
  className = "",
}) {
  const [draft, setDraft] = useState("");
  const total = value.length + (leading ? 1 : 0);
  const full = total >= max;

  const addNames = (raw) => {
    const incoming = raw
      .split(/[,\n]/)
      .map((n) => n.trim().slice(0, MAX_NAME))
      .filter(Boolean);
    if (!incoming.length) return;
    const seen = new Set([leading, ...value].filter(Boolean).map((n) => n.toLowerCase()));
    const next = [...value];
    for (const name of incoming) {
      if (leading ? next.length + 1 >= max : next.length >= max) break;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      next.push(name);
    }
    onChange(next);
  };

  const commit = () => {
    addNames(draft);
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (/[,\n]/.test(text)) {
      e.preventDefault();
      addNames(text);
    }
  };

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor="members-input" className="text-[13px] font-bold text-navy">
          {label}
        </label>
        <span className="flex items-center gap-1 text-[11px] text-navy/65">
          <Users size={11} /> {hint ?? `${total}/${max} anggota`}
        </span>
      </div>

      <div className="rounded-xl border border-navy/10 bg-navy/[0.03] p-2.5 transition focus-within:border-accent focus-within:bg-white focus-within:ring-4 focus-within:ring-accent/10">
        <ul className="flex flex-wrap gap-1.5">
          {leading && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">
              {leading}
              <span className="rounded-full bg-white/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide">Kamu</span>
            </li>
          )}
          {value.map((name, i) => (
            <li
              key={`${name}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-navy/10 bg-white py-1 pl-3 pr-1 text-xs font-semibold text-navy shadow-sm"
            >
              <span className="max-w-[12rem] truncate">{name}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                aria-label={`Hapus ${name}`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-navy/50 transition hover:bg-red-50 hover:text-red-700"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>

        <div className={`flex items-center gap-2 ${total ? "mt-2" : ""}`}>
          <input
            id="members-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={commit}
            disabled={full}
            maxLength={MAX_NAME}
            placeholder={full ? `Maksimal ${max} anggota` : placeholder}
            enterKeyHint="done"
            className="min-h-10 min-w-0 flex-1 bg-transparent px-1 text-base text-ink outline-none placeholder:text-navy/50 disabled:cursor-not-allowed sm:text-sm"
          />
          <button
            type="button"
            onClick={commit}
            disabled={full || !draft.trim()}
            className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-accent px-3 text-xs font-bold text-white transition hover:bg-price active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={13} /> Tambah
          </button>
        </div>
      </div>
    </div>
  );
}