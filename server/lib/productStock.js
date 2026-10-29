const MAX_STOCK = 2_147_483_647;

export function parseStockQuantity(value) {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: null };
  }

  const quantity = typeof value === "number" || (typeof value === "string" && value.trim() !== "")
    ? Number(value)
    : Number.NaN;

  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > MAX_STOCK) {
    return { valid: false, value: null };
  }

  return { valid: true, value: quantity };
}
