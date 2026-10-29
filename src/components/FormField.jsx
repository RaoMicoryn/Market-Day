const base =
  "w-full rounded-xl border bg-navy/[0.03] px-3.5 py-2.5 text-sm text-ink outline-none transition duration-200 placeholder:text-navy/65 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10";

export default function FormField({ label, name, value, onChange, error, hint, multiline = false, className = "", ...rest }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={name} className="text-[13px] font-bold text-navy">
          {label}
        </label>
        {hint && <span className="text-[11px] text-navy/65">{hint}</span>}
      </div>
      <Tag
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={multiline ? 4 : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${base} ${error ? "border-red-400 bg-red-50/40" : "border-navy/10"} ${multiline ? "resize-y" : ""}`}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-[11px] font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
