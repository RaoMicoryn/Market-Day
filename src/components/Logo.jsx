import { Link } from "react-router-dom";

export default function Logo({ light = false, className = "" }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-baseline gap-1.5 ${className}`}
    >
      <span
        className={`font-display text-[26px] font-extrabold italic leading-none tracking-[-1.6px] transition group-hover:text-accent sm:text-[28px] ${
          light ? "text-white" : "text-navy"
        }`}
      >
        market
      </span>
      <span className="translate-y-[-1px] rounded-md bg-accent px-1.5 py-1 text-[10px] font-extrabold uppercase leading-none tracking-[0.14em] text-white shadow-glow">
        day
      </span>
      <span className="sr-only">— beranda</span>
    </Link>
  );
}
