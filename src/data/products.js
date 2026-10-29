export const CATEGORIES = ["Makanan Berat", "Minuman", "Snack", "Paket Bundling"];

export const CATEGORY_META = {
  "Makanan Berat": {
    emoji: "🍝",
    short: "Makanan",
    desc: "Kenyang & hangat",
    tone: "from-orange-100 to-amber-50",
  },
  Minuman: {
    emoji: "🥤",
    short: "Minuman",
    desc: "Segar & dingin",
    tone: "from-sky-100 to-cyan-50",
  },
  Snack: {
    emoji: "🍟",
    short: "Snack",
    desc: "Camilan renyah",
    tone: "from-rose-100 to-orange-50",
  },
  "Paket Bundling": {
    emoji: "🎁",
    short: "Bundling",
    desc: "Lebih hemat",
    tone: "from-emerald-100 to-teal-50",
  },
};

export const CATEGORY_EMOJI = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([k, v]) => [k, v.emoji])
);

// Pilihan rasa tetap tersedia; topping dikonfigurasi pemilik untuk setiap produk.
export const ICE_LEVELS = ["Normal", "Sedikit Es", "Tanpa Es"];
export const SPICY_LEVELS = ["Tidak Pedas", "Sedang", "Pedas", "Extra Pedas"];
export const hasIce = (cat) => cat === "Minuman";
export const hasSpicy = (cat) => cat === "Makanan Berat" || cat === "Snack";

export const unitPrice = (price, options = {}) =>
  price + (options.toppings || []).reduce((n, t) => n + t.price, 0);
export const optionsText = (o = {}) =>
  [o.ice, o.spicy, o.toppings?.length ? `+ ${o.toppings.map((t) => t.name).join(", ")}` : ""]
    .filter(Boolean)
    .join(" · ");

export const SORT_OPTIONS = [
  { id: "recommended", label: "Rekomendasi" },
  { id: "newest", label: "Terbaru" },
  { id: "price-asc", label: "Harga terendah" },
  { id: "price-desc", label: "Harga tertinggi" },
  { id: "name", label: "Nama A–Z" },
];

export const formatRupiah = (n) => `Rp${Number(n || 0).toLocaleString("id-ID")}`;

export const formatCompact = (n) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

export const formatDateTime = (iso) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.round(h / 24);
  return d === 1 ? "kemarin" : `${d} hari lalu`;
};

export const imgFallback = (local) => (e) => {
  const img = e.currentTarget;
  if (local && !img.dataset.tried) {
    img.dataset.tried = "1";
    img.src = local;
  } else {
    img.style.display = "none";
  }
};
