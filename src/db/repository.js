async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Permintaan gagal. Silakan coba lagi.");
  return data;
}

const body = (value) => JSON.stringify(value);
const params = (values) => new URLSearchParams(
  Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")
).toString();

export const ORDER_STATUS = {
  pending: "Baru",
  accepted: "Diterima",
  processing: "Diproses",
  done: "Selesai",
};
export const NEXT_STATUS = {
  pending: ["accepted", "Terima"],
  accepted: ["processing", "Proses"],
  processing: ["done", "Selesai"],
};
export const STATUS_TONE = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-violet-100 text-violet-700",
  processing: "bg-sky-100 text-sky-700",
  done: "bg-emerald-100 text-emerald-700",
};

export function normalizeCode(input = "") {
  const match = input.trim().toUpperCase().match(/^(?:MD)?[\s-]*(\d{1,4})$/);
  return match ? `MD-${match[1].padStart(4, "0")}` : null;
}

export const subscribe = (callback) => {
  const events = new EventSource("/api/events");
  events.addEventListener("change", callback);
  return () => events.close();
};

export const getSession = () => request("/session");
export const register = (values) => request("/auth/register", { method: "POST", body: body(values) });
export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: body({ email, password }) });
export const logout = () => request("/auth/logout", { method: "POST" });

export const getStores = () => request("/stores");
export const getStoreBySlug = (slug) => request(`/stores/slug/${encodeURIComponent(slug)}`);
export const getStoreById = (id) => request(`/stores/id/${encodeURIComponent(id)}`);
export const findStoreByCode = (input) => {
  const code = normalizeCode(input);
  return code ? request(`/stores/code/${encodeURIComponent(code)}`) : Promise.resolve(null);
};
export const setStoreOpen = (storeId, isOpen) =>
  request(`/stores/${encodeURIComponent(storeId)}/open`, { method: "PATCH", body: body({ isOpen }) });
export const updateStore = (storeId, patch) =>
  request(`/stores/${encodeURIComponent(storeId)}`, { method: "PATCH", body: body(patch) });

export const getProducts = (storeId) => request(`/products?${params({ storeId })}`);
export const getProductsByIds = (ids = []) =>
  ids.some((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    ? request(`/products?${params({
      ids: ids.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)).join(","),
    })}`)
    : Promise.resolve([]);
export const searchProducts = (options = {}) =>
  request(`/products/search?${params({
    q: options.q,
    category: options.category,
    sort: options.sort,
    onlyOpen: options.onlyOpen ? "true" : undefined,
    onlyAvailable: options.onlyAvailable ? "true" : undefined,
  })}`);
export const setProductStock = (id, inStock) =>
  request(`/products/${encodeURIComponent(id)}/stock`, { method: "PATCH", body: body({ inStock }) });
export const createProduct = (storeId, data) =>
  request(`/stores/${encodeURIComponent(storeId)}/products`, { method: "POST", body: body(data) });
export const updateProduct = (id, data) =>
  request(`/products/${encodeURIComponent(id)}`, { method: "PATCH", body: body(data) });
export const deleteProduct = (id) =>
  request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" });

export const placeOrder = (order) => request("/orders", { method: "POST", body: body(order) });
export const getOrdersByIds = (ids = []) =>
  ids.length ? request(`/orders?${params({ ids: ids.join(",") })}`) : Promise.resolve([]);
export const getOrders = (storeId) => request(`/stores/${encodeURIComponent(storeId)}/orders`);
export const updateOrderStatus = (id, status) =>
  request(`/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", body: body({ status }) });
export const getStoreStats = (storeId) => request(`/stores/${encodeURIComponent(storeId)}/stats`);
export const getMarketStats = () => request("/stats");

// --- OTP WhatsApp ---------------------------------------------------------
// Dipakai oleh form verifikasi nomor (lihat src/components/OtpForm.jsx).

export class OtpApiError extends Error {
  constructor(message, { status, reason, retryAfter, remainingAttempts } = {}) {
    super(message);
    this.name = "OtpApiError";
    this.status = status;
    this.reason = reason;
    this.retryAfter = retryAfter;
    this.remainingAttempts = remainingAttempts;
  }
}

async function otpRequest(path, payload) {
  let response;
  try {
    response = await fetch(`/api/otp${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OtpApiError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.", {
      reason: "NETWORK_ERROR",
    });
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success) {
    throw new OtpApiError(data?.error || "Permintaan OTP gagal. Silakan coba lagi.", {
      status: response.status,
      reason: data?.reason,
      retryAfter: data?.retryAfter,
      remainingAttempts: data?.remainingAttempts,
    });
  }

  return data;
}

/** Kirim kode OTP ke nomor WhatsApp. */
export const sendOtp = (phoneNumber) => otpRequest("/send", { phoneNumber });

/** Cocokkan kode OTP yang diinput pengguna. */
export const verifyOtp = (phoneNumber, code) => otpRequest("/verify", { phoneNumber, code });

