# market day — katalog multi-booth

Katalog jajanan dari berbagai booth. Pembeli bisa memesan dari beberapa booth sekaligus, mendapat nomor antrean, lalu memantau status pesanan. Penjual punya dashboard untuk mengelola menu, stok, pesanan, dan omzet.

Dibangun dengan **React 18 + Vite 8 + Express + Neon PostgreSQL + Tailwind CSS 3**. Data aplikasi disimpan di Neon; keranjang dan preferensi pembeli disimpan di browser.

---

## Menyiapkan Neon

1. Buat project database di [Neon](https://neon.tech/) dan salin connection string.
2. Salin `.env.example` menjadi `.env`.
3. Isi `DATABASE_URL` dengan connection string Neon dan tetapkan `SESSION_SECRET` dengan string acak yang panjang.
4. Isi `FONNTE_TOKEN` dengan token perangkat Fonnte agar OTP WhatsApp bisa dikirim (lihat [Verifikasi OTP WhatsApp](#verifikasi-otp-whatsapp-fonnte)).
5. Opsional: isi `VITE_SELLER_WHATSAPP` dengan nomor WhatsApp admin/penjual agar pembeli otomatis diarahkan ke chat penjual setelah OTP berhasil.
6. Pasang dependensi, siapkan skema, lalu jalankan aplikasi:

   ```bash
   npm install
   npm run db:setup
   npm run dev
   ```

Gunakan Node.js **20.19+** atau **22.12+**. Data yang sebelumnya tersimpan di browser tidak otomatis disalin ke Neon.
Frontend berjalan di `http://localhost:5173`, API di `http://localhost:3000`. Data toko dan menu dimulai kosong. Daftarkan booth untuk mulai mengisi katalog.

Jalankan `npm test` untuk menguji aturan validasi nomor WhatsApp (`server/lib/validator.test.js`).

Untuk production, jalankan `npm run build`, lalu `npm start`. Server Express melayani API dan folder `dist/` dari origin yang sama. Jangan taruh connection string Neon di kode frontend atau variabel `VITE_*`.

## Deploy ke Vercel

Repo ini sudah siap dideploy sebagai satu project Vercel (frontend statis + API Express sebagai function):

1. Import repo di Vercel. Vercel memakai `vercel.json`: setiap deploy menjalankan `npm run db:setup` lalu `npm run build`, dengan output `dist`.
2. Isi **Environment Variables** di Project Settings:

   ```env
   DATABASE_URL=postgresql://...   # pakai connection string pooled dari Neon
   SESSION_SECRET=string-acak-panjang
   FONNTE_TOKEN=token-fonnte
   OTP_SECRET=string-acak-lain
   VITE_SELLER_WHATSAPP=08xxxxxxxxxx   # opsional
   ```

3. Klik **Deploy** atau **Redeploy**. Migrasi skema idempoten berjalan otomatis sebelum build, termasuk menambahkan kolom stok; stok produk lama tetap tidak dibatasi.

Cara kerjanya:

- `vercel.json` mengarahkan semua `/api/*` ke satu Vercel Function di `api/index.js`, lalu handler meneruskan rute satu tingkat maupun bertingkat ke aplikasi Express yang sama seperti di lokal. Pola ini menjaga jumlah function tetap di bawah batas paket Hobby.
- `vercel.json` mengarahkan rute non-API ke `index.html` (SPA) dan menetapkan timeout function 30 detik.
- Di Vercel, frontend langsung memakai polling 15 detik tanpa mencoba SSE `/api/events`, yang tidak didukung serverless. Di server Express biasa, pembaruan tetap memakai SSE (`src/db/repository.js`).
- Pool PostgreSQL dibatasi 1 koneksi per instance (`server/db.js`) agar koneksi Neon tidak habis.

---

## Halaman

| Rute | Isi |
| --- | --- |
| `/` | Hero, CTA penjual, kode toko, kategori, direktori booth, katalog |
| `/cari` | Pencarian + filter kategori/status + urutan + pagination (`?q=`, `?kategori=`) |
| `/toko/:slug` | Profil booth, pencarian & filter internal, deep link produk (`?produk=id`) |
| `/wishlist` | Produk yang disimpan, urutkan, hapus semua |
| `/pesanan` | Riwayat pesanan pembeli + pelacakan status + pesan ulang |
| `/checkout` | Data pembeli, ambil di booth / antar ke kelas, ringkasan |
| `/verifikasi` | Verifikasi OTP WhatsApp 6 digit; pesanan dibuat setelah kode valid |
| `/dashboard/login` | Login penjual |
| `/dashboard/register` | Daftar booth baru (dapat kode toko otomatis) |
| `/dashboard` | Ringkasan omzet, grafik 7 hari, pesanan, produk, profil toko |
| `*` | Halaman 404 |

### Fitur pembeli
- Autocomplete pencarian (produk + booth), riwayat pencarian, ⌘K / Ctrl+K.
- Filter kategori, hanya booth buka, hanya yang tersedia; urutan harga/terbaru/nama.
- Keranjang dipisah otomatis per booth, opsi rasa/topping, catatan per item.
- Nomor antrean (`MD-0xx`) + pelacak status melalui pembaruan server.
- Checkout dua langkah: isi data → verifikasi OTP WhatsApp → pesanan dibuat (data checkout disimpan sementara di `sessionStorage`, tahan refresh, kedaluwarsa 30 menit).
- Produk dengan stok terbatas menampilkan jumlah tersisa; stok dipotong atomik saat checkout berhasil. Jika beberapa pembeli berebut unit terakhir, hanya transaksi pertama yang mendapatkannya dan transaksi lain diberi pesan untuk memilih produk lain.
- Wishlist, riwayat pesanan, dan tombol **Pesan lagi**.
- Data pembeli terakhir diingat untuk checkout berikutnya.

### Fitur penjual
- Buka/tutup booth (booth tutup tidak bisa menerima pesanan).
- Kelola produk: tambah, ubah, hapus, atur jumlah stok atau stok tidak dibatasi, switch ketersediaan, atur topping per produk tanpa batas jumlah, upload gambar (maks 400 KB).
- Pesanan: filter status, cari nama/nomor, terima semua, ubah status, ekspor CSV, hubungi pembeli via WhatsApp.
- Statistik: omzet, jumlah pesanan, rata-rata transaksi, nilai pesanan aktif, produk terlaris, grafik 7 hari.
- Profil toko: nama, kelas, anggota, bio, logo, banner.

---

## Struktur

```
src/
  components/          # Header, Hero, kartu, drawer, checkout, OtpForm, dashboard/*
  context/             # Cart, Wishlist, Toast, Confirm
  data/products.js     # kategori, topping, helper format
  db/
    repository.js      # klien API (termasuk sendOtp/verifyOtp)
    useDb.js           # hook reaktif (subscribe ke event perubahan DB)
  pages/               # Home, Store, Search, Wishlist, Orders, Verify, Dashboard, auth, 404
  hooks/               # usePageTitle, useShopping, useOtpVerification
  utils/               # phone, pendingOrder (data sementara selama verifikasi OTP)
server/
  index.js             # Express API, autentikasi sesi, akses database
  schema.sql           # skema PostgreSQL untuk Neon
  migrate.js           # menerapkan skema ke database
  lib/
    otpStore.js        # simpan & verifikasi hash OTP (5 menit, rate limit)
    phone.js           # normalisasi nomor WhatsApp
  routes/otp.js        # POST /api/otp/send & /api/otp/verify
  services/fonnte.js   # pengiriman OTP via Fonnte
```

### Penyimpanan browser

| Key | Isi |
| --- | --- |
| `mrpl:cart:v3` | isi keranjang |
| `mrpl:wishlist:v1` | id produk yang disimpan |
| `mrpl:recent:v1` | riwayat pencarian |
| `mrpl:customer:v1` | data pembeli terakhir |
| `mrpl:myorders` | id tiket pesanan untuk pelacakan |

Data toko, produk, akun penjual, pelanggan, dan pesanan disimpan di Neon. Sesi penjual menggunakan cookie `HttpOnly`; operasi database selalu lewat API server.

---

## Verifikasi OTP WhatsApp (Fonnte)

API mengirim kode OTP 6 digit lewat WhatsApp menggunakan [Fonnte](https://fonnte.com).

### Konfigurasi

1. Buat perangkat di dashboard Fonnte, lalu salin tokennya.
2. Tambahkan ke `.env`:

   ```env
   FONNTE_TOKEN=token-perangkat-fonnte
   # Opsional; bila kosong server memakai SESSION_SECRET.
   OTP_SECRET=string-acak-yang-panjang
   ```

3. Jalankan `npm run db:setup`. Tabel `otp_codes` juga dibuat otomatis saat endpoint pertama kali dipakai.

### `POST /api/otp/send`

```json
{ "phoneNumber": "081234567890" }
```

Nomor boleh ditulis `08…`, `628…`, atau `+62…` (spasi, titik, dan tanda hubung diabaikan). Server menormalkan ke `628…`, membuat kode acak 6 digit, menyimpan hash + waktu kedaluwarsa 5 menit, lalu mengirim pesan:

> Kode OTP Market Day: 728111. Berlaku 5 menit. Jangan bagikan kode ini ke siapapun.

#### Validasi nomor (anti-troll)

Validasi berjalan **sebelum** kode dibuat dan sebelum Fonnte dipanggil (`server/lib/validator.js`), jadi nomor iseng tidak memakai kuota WhatsApp:

1. Dibersihkan dari spasi, `-`, `.`, `(`, `)`, dan `+`; awalan `62` / `+62` / `8` diseragamkan menjadi `08`.
2. Panjang total **10–13 digit** dan diawali `08`.
3. Prefix harus milik operator seluler Indonesia: Telkomsel (`0811–0813`, `0821–0823`, `0851–0853`), Indosat (`0814–0816`, `0855–0858`), XL (`0817–0819`, `0859`, `0877–0878`), Axis (`0831–0833`, `0838`), Tri (`0895–0899`), Smartfren (`0881–0889`).
4. Ditolak bila berpola iseng: angka sama berulang (`081111111111`, `080000000000`), angka berurutan naik/turun minimal 6 digit (`081234567890`, `08987654321`), atau blok angka berulang (`081212121212`).

Respons `400` untuk nomor tidak valid, dengan pesan spesifik di `error`:

| `reason` | Arti |
| --- | --- |
| `EMPTY` | Nomor kosong |
| `TOO_SHORT` / `TOO_LONG` | Di luar 10–13 digit |
| `NOT_MOBILE` | Tidak diawali `08` |
| `UNKNOWN_OPERATOR` | Prefix bukan operator seluler yang dikenal |
| `REPEATED_DIGITS` | Angka sama berulang (contoh: `081111111111`) |
| `SEQUENTIAL_DIGITS` | Angka berurutan (contoh: `081234567890`) |
| `REPEATED_PATTERN` | Pola blok berulang (contoh: `081212121212`) |
| `DUMMY_NUMBER` | Nomor dummy yang sering dipakai untuk iseng |

Contoh respons:

```json
{
  "success": false,
  "error": "Nomor ini tidak valid (angka berurutan). Masukkan nomor WhatsApp aktif yang benar.",
  "reason": "SEQUENTIAL_DIGITS"
}
```

Respons `200`:

```json
{ "success": true, "message": "OTP sent successfully", "expiresIn": 300 }
```

### `POST /api/otp/verify`

```json
{ "phoneNumber": "081234567890", "code": "728111" }
```

Respons `200` bila cocok:

```json
{ "success": true, "message": "Nomor WhatsApp berhasil diverifikasi.", "phoneNumber": "6281234567890" }
```

Bila gagal, respons berbentuk `{ "success": false, "error": "…", "reason": "…" }`:

| `reason` | Status | Arti |
| --- | --- | --- |
| `INVALID_OTP_FORMAT` | 400 | Kode bukan 6 digit angka |
| `OTP_NOT_FOUND` | 400 | Belum minta kode / kode sudah dipakai |
| `OTP_INVALID` | 400 | Kode salah; `remainingAttempts` menunjukkan sisa percobaan |
| `OTP_EXPIRED` | 400 | Lewat 5 menit |
| `OTP_ATTEMPTS_EXCEEDED` | 429 | 5 kali salah; minta kode baru |
| `OTP_COOLDOWN` | 429 | Kirim ulang kurang dari 60 detik; `retryAfter` dalam detik |
| `OTP_RATE_LIMITED` | 429 | Lebih dari 5 kiriman per jam; `retryAfter` dalam detik |
| `FONNTE_NOT_CONFIGURED` | 500 | `FONNTE_TOKEN` belum diisi |
| `FONNTE_REJECTED` / `FONNTE_TIMEOUT` / `FONNTE_UNREACHABLE` | 502 | Fonnte gagal dihubungi/menolak |

### Keamanan

- Kode tidak pernah disimpan atau dikembalikan dalam bentuk asli; hanya HMAC-SHA256 dengan `OTP_SECRET` (fallback `SESSION_SECRET`).
- Kode sekali pakai, kedaluwarsa 5 menit, maksimal 5 percobaan, jeda 60 detik antar kiriman, maksimal 5 kiriman per jam per nomor.
- Perbandingan hash memakai `timingSafeEqual`; kode dibatalkan bila Fonnte gagal mengirim.

### Integrasi frontend

Alur checkout memakai halaman khusus `/verifikasi` (`src/pages/VerifyPage.jsx`):

1. `/checkout` menyimpan data pembeli + metode ke `sessionStorage` (`src/utils/pendingOrder.js`) lalu pindah ke `/verifikasi`.
2. `/verifikasi` mengirim OTP otomatis saat dibuka (dilewati bila kode terakhir dikirim < 60 detik lalu), menampilkan 6 kotak digit, dan menyediakan kirim ulang.
3. Setelah OTP valid, pesanan baru dikirim ke `POST /api/orders`, keranjang dikosongkan, dan nomor antrean ditampilkan.
4. Kalau pengguna kembali ke `/checkout`, form terisi lagi dari data sementara.
5. Bila `VITE_SELLER_WHATSAPP` diisi, layar sukses menampilkan tombol konfirmasi dan otomatis membuka WhatsApp penjual (5 detik) dengan pesan berisi nama, nomor antrean, dan total.

Komponen `src/components/OtpForm.jsx` juga tersedia bila butuh form verifikasi mandiri (input nomor, kirim kode, hitung mundur, kirim ulang, verifikasi):

```jsx
import { useState } from "react";
import OtpForm from "../components/OtpForm";

export default function ContohVerifikasi() {
  const [wa, setWa] = useState("");
  const [verified, setVerified] = useState(false);

  return (
    <>
      <OtpForm
        phoneNumber={wa}
        onPhoneNumberChange={setWa}
        onVerified={() => setVerified(true)}
      />
      {verified && <p>Nomor {wa} terverifikasi.</p>}
    </>
  );
}
```

Untuk form sendiri, gunakan hook `useOtpVerification({ phoneNumber, onVerified })` atau fungsi `sendOtp` / `verifyOtp` dari `src/db/repository.js`.

---

## Aksesibilitas & kualitas

Diuji dengan Lighthouse (desktop & mobile) pada beranda, katalog, halaman toko, wishlist, checkout, pesanan, dashboard (semua tab), login, register, dan 404:

- **Accessibility 100**, **Best Practices 100**, **SEO 100**.
- Kontras teks minimal 4.5:1 (token `text-navy/65` untuk teks sekunder).
- Fokus terlihat, target sentuh ≥ 24 px, `prefers-reduced-motion` dihormati, skip-link tersedia.
- Tidak ada overflow horizontal pada lebar 402 px.
