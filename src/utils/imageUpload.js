export const MAX_IMAGE_FILE_BYTES = 2 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 1024 * 1024;
const WEBP_QUALITIES = [0.9, 0.82, 0.74, 0.66, 0.58];
const MAX_DIMENSION = 2048;

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca gambar. Coba pilih file lain."));
    reader.readAsDataURL(blob);
  });
}

function canvasToWebp(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengompres gambar. Coba file gambar lain."));
          return;
        }
        if (blob.type !== "image/webp") {
          reject(new Error("Browser tidak mendukung kompresi gambar. Coba browser lain."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

export async function imageFileToDataUrl(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Pilih file gambar yang valid.");
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error("Ukuran file maksimal 2 MB.");
  }
  if (file.size <= MAX_STORED_IMAGE_BYTES) {
    return readAsDataUrl(file);
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak dapat memproses gambar.");

    for (let resize = 0; resize < 5; resize += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale * (0.82 ** resize)));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale * (0.82 ** resize)));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of WEBP_QUALITIES) {
        const compressed = await canvasToWebp(canvas, quality);
        if (compressed.size <= MAX_STORED_IMAGE_BYTES) {
          return await readAsDataUrl(compressed);
        }
      }
    }
  } catch (error) {
    throw new Error(error.message || "Gagal memproses gambar. Coba file gambar lain.");
  } finally {
    bitmap?.close();
  }

  throw new Error("Gambar tidak dapat dikompres ke ukuran yang aman. Coba gambar lain.");
}
