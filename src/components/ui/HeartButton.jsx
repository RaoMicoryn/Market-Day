import { Heart } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { useToast } from "../../context/ToastContext";

export default function HeartButton({ product, className = "", size = 16 }) {
  const { has, toggle } = useWishlist();
  const toast = useToast();
  const active = has(product.id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Hapus ${product.name} dari wishlist` : `Simpan ${product.name} ke wishlist`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(product.id);
        toast(active ? `${product.name} dihapus dari wishlist` : `${product.name} disimpan ke wishlist`, {
          type: active ? "info" : "success",
          duration: 2200,
        });
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition duration-200 active:scale-90 ${
        active
          ? "border-red-100 bg-white text-red-700 shadow-soft"
          : "border-white/40 bg-white/80 text-navy/65 hover:text-red-700"
      } ${className}`}
    >
      <Heart size={size} fill={active ? "currentColor" : "none"} strokeWidth={2.2} />
    </button>
  );
}
