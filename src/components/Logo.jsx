import { Link } from "react-router-dom";

export default function Logo({ light = false, badge = false, className = "" }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-1.5 sm:gap-2 ${className}`}
    >
      {badge && (
        <>
          <img
            src="/assets/badge.png"
            alt="SMK Tri Ratna Jakarta"
            className="h-6 w-6 shrink-0 rounded-full object-contain sm:h-9 sm:w-9"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span
            aria-hidden="true"
            className={`select-none text-sm font-normal leading-none sm:text-lg ${
              light ? "text-white/25" : "text-navy/25"
            }`}
          >
            |
          </span>
        </>
      )}
      <img
        src="/logo-tribiz.png"
        alt="Tribiz Fest"
        className="h-8 w-auto shrink-0 object-contain sm:h-10"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <span
        className={`font-display text-[20px] font-extrabold italic leading-none tracking-[-1px] transition group-hover:text-accent sm:text-[26px] ${
          light ? "text-white" : "text-navy"
        }`}
      >
        Tribiz Fest
      </span>
      <span className="sr-only">— beranda</span>
    </Link>
  );
}
