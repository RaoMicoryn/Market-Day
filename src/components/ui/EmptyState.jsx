export default function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-[26px] border border-dashed border-navy/10 bg-white/70 px-6 py-14 text-center shadow-card backdrop-blur-sm ${className}`}>
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-navy-50 to-white text-navy/45 shadow-sm ring-1 ring-navy/[0.06]">
          <Icon size={26} />
        </span>
      )}
      <h2 className="font-display text-base font-extrabold tracking-tight text-navy">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-navy/55">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
