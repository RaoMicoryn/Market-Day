import test from "node:test";
import assert from "node:assert/strict";
import { parseStockQuantity } from "./productStock.js";

test("stok kosong berarti tidak dibatasi", () => {
  assert.deepEqual(parseStockQuantity(undefined), { valid: true, value: null });
  assert.deepEqual(parseStockQuantity(null), { valid: true, value: null });
  assert.deepEqual(parseStockQuantity(""), { valid: true, value: null });
});

test("menerima stok berupa bilangan bulat nonnegatif", () => {
  assert.deepEqual(parseStockQuantity(0), { valid: true, value: 0 });
  assert.deepEqual(parseStockQuantity("12"), { valid: true, value: 12 });
});

test("menolak stok negatif, pecahan, nonangka, dan melebihi batas PostgreSQL integer", () => {
  for (const value of [-1, "-1", 1.5, "1.5", "abc", " ", 2_147_483_648]) {
    assert.deepEqual(parseStockQuantity(value), { valid: false, value: null }, String(value));
  }
});
