// Handler bersama untuk semua route /api di Vercel.
// Import dilakukan saat request (bukan saat modul dimuat) supaya kegagalan
// konfigurasi — misalnya environment variable belum diisi — tetap dibalas
// JSON yang bisa dibaca, bukan halaman 500 kosong.
let appPromise;

const getApp = () => {
  appPromise ??= import("../server/index.js").then((mod) => mod.default);
  return appPromise;
};

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("[api] gagal memuat aplikasi:", error);
    res.status(500).json({
      error: "Server belum siap. Periksa environment variables di Vercel.",
      detail: String(error?.message || error).slice(0, 300),
    });
  }
}
