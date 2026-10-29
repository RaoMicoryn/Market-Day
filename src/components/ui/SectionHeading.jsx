export default function SectionHeading({ eyebrow, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-navy/65">{description}</p>}
      </div>
      {action}
    </div>
  );
}
