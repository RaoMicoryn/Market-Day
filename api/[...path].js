// Vercel Function: seluruh /api/* ditangani aplikasi Express yang sama dengan lokal.
// Catch-all ini membuat /api/stats, /api/otp/send, dst. tetap sampai ke router Express.
import app from "../server/index.js";

export default app;
