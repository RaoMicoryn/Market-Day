export default function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-navy/10 bg-white/60 px-6 py-14 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy/65">
          <Icon size={26} />
        </span>
      )}
      <h2 className="text-base font-bold text-navy">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-navy/65">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
