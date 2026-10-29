import test from "node:test";
import assert from "node:assert/strict";
import { imageFileToDataUrl, MAX_IMAGE_FILE_BYTES } from "./imageUpload.js";

test("menolak file gambar yang lebih besar dari 2 MB", async () => {
  await assert.rejects(
    imageFileToDataUrl({ type: "image/png", size: MAX_IMAGE_FILE_BYTES + 1 }),
    { message: "Ukuran file maksimal 2 MB." }
  );
});

test("menolak file yang bukan gambar", async () => {
  await assert.rejects(
    imageFileToDataUrl({ type: "text/plain", size: 10 }),
    { message: "Pilih file gambar yang valid." }
  );
});
