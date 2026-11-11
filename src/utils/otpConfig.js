// Saklar verifikasi OTP WhatsApp di checkout.
// Default: MATI (pesanan langsung dibuat tanpa OTP, mis. saat kuota Fonnte habis).
// Untuk mengaktifkan lagi, set VITE_OTP_ENABLED=true lalu build ulang.
export const OTP_ENABLED = String(import.meta.env.VITE_OTP_ENABLED || "").trim().toLowerCase() === "true";
