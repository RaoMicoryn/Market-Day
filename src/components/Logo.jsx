import { Link } from "react-router-dom";

export default function Logo({ light = false, className = "" }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-2 ${className}`}
    >
      <img
        src="/logo-tribiz.png"
        alt="Tribiz Fest"
        className="h-8 w-auto shrink-0 object-contain sm:h-10"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <span
        className={`font-display text-[22px] font-extrabold italic leading-none tracking-[-1px] transition group-hover:text-accent sm:text-[26px] ${
          light ? "text-white" : "text-navy"
        }`}
      >
        Tribiz Fest
      </span>
      <span className="sr-only">— beranda</span>
    </Link>
  );
}
