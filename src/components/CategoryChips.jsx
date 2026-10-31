import { CATEGORIES, CATEGORY_META } from "../data/products";

export default function CategoryChips({ value, onChange, className = "", includeAll = true }) {
  return (
    <div
      className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 ${className}`}
      role="group"
      aria-label="Filter kategori"
    >
      {includeAll && (
        <button type="button" onClick={() => onChange("")} aria-pressed={value === ""} className={value === "" ? "chip-on" : "chip"}>
          Semua
        </button>
      )}
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={value === c ? "chip-on" : "chip"}
        >
          <span aria-hidden="true">{CATEGORY_META[c]?.emoji}</span>
          {CATEGORY_META[c]?.short || c}
        </button>
      ))}
    </div>
  );
}
