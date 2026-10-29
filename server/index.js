import "dotenv/config";
import bcrypt from "bcryptjs";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import otpRouter from "./routes/otp.js";
import { validateWhatsAppNumber } from "./lib/validator.js";
import { parseStockQuantity } from "./lib/productStock.js";

const app = express();
const PgSession = connectPgSimple(session);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATEGORIES = ["Makanan Berat", "Minuman", "Snack", "Paket Bundling"];
const subscribers = new Set();

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET belum diatur. Isi dengan nilai acak yang panjang di file .env.");
}

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    store: new PgSession({ pool, tableName: "user_sessions", createTableIfMissing: true }),
    name: "market.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

const sendChange = () => {
  for (const response of subscribers) response.write("event: change\ndata: {}\n\n");
};
const fail = (res, status, message) => res.status(status).json({ error: message });
const norm = (value = "") => String(value).trim().toLowerCase();
const normalizeCode = (input = "") => {
  const match = input.trim().toUpperCase().match(/^(?:MD)?[\s-]*(\d{1,4})$/);
  return match ? `MD-${match[1].padStart(4, "0")}` : null;
};
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "toko";
const optionsText = (options = {}) =>
  [options.ice, options.spicy, options.toppings?.length ? `+ ${options.toppings.map((t) => t.name).join(", ")}` : ""]
    .filter(Boolean)
    .join(" · ");
const validateToppings = (toppings) => {
  if (!Array.isArray(toppings)) return null;
  const names = new Set();
  const validated = [];
  for (const topping of toppings) {
    if (!topping || typeof topping !== "object") return null;
    if (typeof topping.name !== "string" || !topping.name.trim() || topping.name.trim().length > 60) return null;
    if (topping.price === "" || topping.price === null || topping.price === undefined) return null;
    if (!Number.isSafeInteger(Number(topping.price)) || Number(topping.price) < 0) return null;
    const name = topping.name.trim();
    if (names.has(name.toLocaleLowerCase())) return null;
    names.add(name.toLocaleLowerCase());
    validated.push({ name, price: Number(topping.price) });
  }
  return validated;
};

function requireOwner(req, res, storeId) {
  if (!req.session.user || req.session.user.storeId !== storeId) {
    fail(res, 403, "Kamu tidak punya akses ke toko ini.");
    return false;
  }
  return true;
}

const STORE_SELECT = `
  select s.id, s.slug, s.code, s.name, s.kelas, s.bio, s.members, s.logo, s.cover,
    s.is_open as "isOpen", s.joined_at as "joinedAt",
    (select count(*)::int from products p where p.store_id = s.id) as "productCount",
    (select count(*)::int from orders o where o.store_id = s.id) as "orderCount",
    (select coalesce(sum(oi.qty), 0)::int from orders o join order_items oi on oi.order_id = o.id
      where o.store_id = s.id and o.status = 'done') as "soldCount"
  from stores s`;

const ORDER_SELECT = `
  select o.id, o.store_id as "storeId", s.name as "storeName", o.customer_id as "customerId",
    o.queue_no as "queueNo", o.method, o.note, o.total, o.status, o.created_at as "createdAt",
    c.name as "customerName", c.kelas as "customerClass", c.phone as "customerPhone",
    (select count(*)::int from orders ahead
      where ahead.store_id = o.store_id and ahead.created_at < o.created_at and ahead.status <> 'done') as ahead,
    coalesce(json_agg(json_build_object(
      'id', oi.id, 'productId', oi.product_id, 'name', oi.name, 'price', oi.price, 'qty', oi.qty,
      'options', oi.options, 'optionsObj', oi.options_obj, 'note', oi.note
    )) filter (where oi.id is not null), '[]'::json) as items
  from orders o
  join stores s on s.id = o.store_id
  join customers c on c.id = o.customer_id
  left join order_items oi on oi.order_id = o.id`;

function withCustomer(order) {
  return {
    ...order,
    customer: order.customerName
      ? { name: order.customerName, kelas: order.customerClass, phone: order.customerPhone }
      : undefined,
  };
}

async function ordersByIds(ids) {
  const validIds = ids.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
  if (!validIds.length) return [];
  const result = await pool.query(
    `${ORDER_SELECT} where o.id = any($1::uuid[]) group by o.id, s.name, c.id order by o.created_at desc`,
    [validIds]
  );
  const orders = result.rows;
  return orders.map((order) => {
    const qty = order.items.reduce((total, item) => total + item.qty, 0);
    const minutes = order.status === "done" ? 0 : order.status === "processing" ? 3 + qty * 2 : 5 + order.ahead * 4 + qty * 2;
    return { ...order, minutes };
  });
}

// SSE hanya tersedia saat server Express berjalan penuh (lokal/Render).
// Di Vercel (serverless) koneksi panjang tidak didukung; frontend memakai polling.
if (!process.env.VERCEL) {
  app.get("/api/events", (req, res) => {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();
    res.write("retry: 5000\n\n");
    subscribers.add(res);
    req.on("close", () => subscribers.delete(res));
  });
}

app.get("/api/session", (req, res) => res.json(req.session.user || null));

// Verifikasi nomor WhatsApp lewat OTP (Fonnte).
app.use("/api/otp", otpRouter);

app.post("/api/auth/register", async (req, res, next) => {
  const { nama = "", email = "", password = "", namaToko = "", kelas = "" } = req.body;
  const identifier = norm(email);
  if (!nama.trim() || !namaToko.trim() || !kelas.trim()) return fail(res, 400, "Semua kolom wajib diisi.");
  if (identifier.length < 3 || /\s/.test(identifier)) return fail(res, 400, "Email/username minimal 3 karakter tanpa spasi.");
  if (identifier.includes("@") && !/^\S+@\S+\.\S+$/.test(identifier)) return fail(res, 400, "Format email tidak valid.");
  if (password.length < 6) return fail(res, 400, "Password minimal 6 karakter.");

  const client = await pool.connect();
  try {
    await client.query("begin");
    const passwordHash = await bcrypt.hash(password, 12);
    const accountResult = await client.query(
      "insert into accounts (email, name, password_hash) values ($1, $2, $3) returning id",
      [identifier, nama.trim(), passwordHash]
    );
    const accountId = accountResult.rows[0].id;
    let code;
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = `MD-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      const used = await client.query("select 1 from stores where code = $1", [candidate]);
      if (!used.rowCount) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Tidak berhasil membuat kode toko. Silakan coba lagi.");
    const baseSlug = slugify(namaToko.trim());
    const slugResult = await client.query("select 1 from stores where slug = $1", [baseSlug]);
    const slug = slugResult.rowCount ? `${baseSlug}-${code.slice(3)}` : baseSlug;
    const storeResult = await client.query(
      `insert into stores (owner_id, slug, code, name, kelas, members)
       values ($1, $2, $3, $4, $5, $6) returning id, slug, code, name, kelas, bio, members, logo, cover,
       is_open as "isOpen", joined_at as "joinedAt"`,
      [accountId, slug, code, namaToko.trim(), kelas.trim(), [nama.trim()]]
    );
    await client.query("commit");
    const store = storeResult.rows[0];
    req.session.user = { accountId, storeId: store.id };
    req.session.save((error) => {
      if (error) return next(error);
      sendChange();
      res.status(201).json(store);
    });
  } catch (error) {
    await client.query("rollback");
    if (error.code === "23505") return fail(res, 409, "Email/username atau nama toko sudah dipakai.");
    next(error);
  } finally {
    client.release();
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const result = await pool.query(
      `select a.id as "accountId", a.password_hash as "passwordHash", s.id as "storeId"
       from accounts a join stores s on s.owner_id = a.id where a.email = $1`,
      [norm(req.body.email)]
    );
    const account = result.rows[0];
    if (!account || !(await bcrypt.compare(req.body.password || "", account.passwordHash))) {
      return fail(res, 401, "Email/username atau password salah.");
    }
    req.session.user = { accountId: account.accountId, storeId: account.storeId };
    req.session.save((error) => {
      if (error) return next(error);
      sendChange();
      res.json(req.session.user);
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("market.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    sendChange();
    res.status(204).end();
  });
});

app.get("/api/stores", async (req, res, next) => {
  try {
    const result = await pool.query(`${STORE_SELECT} order by s.joined_at desc`);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/stores/slug/:slug", async (req, res, next) => {
  try {
    const result = await pool.query(`${STORE_SELECT} where s.slug = $1`, [req.params.slug]);
    res.json(result.rows[0] || null);
  } catch (error) {
    next(error);
  }
});

app.get("/api/stores/id/:id", async (req, res, next) => {
  try {
    const result = await pool.query(`${STORE_SELECT} where s.id = $1`, [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (error) {
    next(error);
  }
});

app.get("/api/stores/code/:code", async (req, res, next) => {
  try {
    const code = normalizeCode(req.params.code);
    if (!code) return res.json(null);
    const result = await pool.query(`${STORE_SELECT} where s.code = $1`, [code]);
    res.json(result.rows[0] || null);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/stores/:id/open", async (req, res, next) => {
  if (!requireOwner(req, res, req.params.id)) return;
  try {
    const result = await pool.query(
      'update stores set is_open = $2 where id = $1 returning id',
      [req.params.id, Boolean(req.body.isOpen)]
    );
    if (!result.rowCount) return fail(res, 404, "Toko tidak ditemukan.");
    sendChange();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/stores/:id", async (req, res, next) => {
  if (!requireOwner(req, res, req.params.id)) return;
  const { name, kelas, bio, logo, cover, members } = req.body;
  if (typeof name !== "string" || !name.trim()) return fail(res, 400, "Nama toko wajib diisi.");
  if (name.trim().length > 40) return fail(res, 400, "Nama toko maksimal 40 karakter.");
  try {
    const result = await pool.query(
      `update stores set name = $2, kelas = $3, bio = $4, logo = $5, cover = $6, members = $7
       where id = $1 returning id, slug, code, name, kelas, bio, members, logo, cover,
       is_open as "isOpen", joined_at as "joinedAt"`,
      [req.params.id, name.trim(), String(kelas || "").trim(), String(bio || "").slice(0, 240),
        logo || "", cover || "", Array.isArray(members) ? members.map((member) => String(member).trim()).filter(Boolean).slice(0, 10) : []]
    );
    if (!result.rowCount) return fail(res, 404, "Toko tidak ditemukan.");
    sendChange();
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return fail(res, 409, "Nama toko sudah dipakai toko lain.");
    next(error);
  }
});

app.get("/api/products", async (req, res, next) => {
  try {
    if (req.query.ids) {
      const ids = String(req.query.ids).split(",").filter(Boolean);
      const result = await pool.query(
        `select p.id, p.store_id as "storeId", p.name, p.category, p.price, p.toppings, p.description, p.image,
          p.stock_quantity as "stockQuantity",
          (p.in_stock and (p.stock_quantity is null or p.stock_quantity > 0)) as "inStock",
          p.created_at as "createdAt" from products p where p.id = any($1::uuid[])`,
        [ids]
      );
      return res.json(result.rows);
    }
    const result = await pool.query(
      `select id, store_id as "storeId", name, category, price, toppings, description, image,
        stock_quantity as "stockQuantity",
        (in_stock and (stock_quantity is null or stock_quantity > 0)) as "inStock",
        created_at as "createdAt" from products where store_id = $1 order by created_at desc`,
      [req.query.storeId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/search", async (req, res, next) => {
  const { q = "", category = "", sort = "recommended", onlyOpen = "false", onlyAvailable = "false" } = req.query;
  const ordering = {
    recommended: "s.is_open desc, (p.in_stock and (p.stock_quantity is null or p.stock_quantity > 0)) desc, sold desc, p.name asc",
    newest: "p.created_at desc",
    "price-asc": "p.price asc",
    "price-desc": "p.price desc",
    name: "p.name asc",
  }[sort] || "s.is_open desc, (p.in_stock and (p.stock_quantity is null or p.stock_quantity > 0)) desc, sold desc, p.name asc";
  try {
    const result = await pool.query(
      `select p.id, p.store_id as "storeId", p.name, p.category, p.price, p.toppings, p.description, p.image,
        p.stock_quantity as "stockQuantity",
        (p.in_stock and (p.stock_quantity is null or p.stock_quantity > 0)) as "inStock",
        p.created_at as "createdAt", s.name as "storeName", s.slug as "storeSlug",
        s.code as "storeCode", s.is_open as "storeOpen",
        (select coalesce(sum(oi.qty), 0)::int from order_items oi join orders o on o.id = oi.order_id
          where oi.product_id = p.id and o.status = 'done') as sold
       from products p join stores s on s.id = p.store_id
       where ($1 = '' or p.category = $1)
         and ($2::boolean is false or s.is_open)
         and ($3::boolean is false or (p.in_stock and (p.stock_quantity is null or p.stock_quantity > 0)))
         and ($4 = '' or concat_ws(' ', p.name, p.description, s.name, p.category) ilike '%' || $4 || '%')
       order by ${ordering}`,
      [category, onlyOpen === "true", onlyAvailable === "true", String(q)]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/stores/:storeId/products", async (req, res, next) => {
  if (!requireOwner(req, res, req.params.storeId)) return;
  const { name = "", price, category, description = "", image = "", toppings = [], stockQuantity } = req.body;
  if (!name.trim()) return fail(res, 400, "Nama produk wajib diisi.");
  if (!(Number(price) > 0)) return fail(res, 400, "Harga harus lebih dari 0.");
  if (!CATEGORIES.includes(category)) return fail(res, 400, "Kategori tidak valid.");
  const stock = parseStockQuantity(stockQuantity);
  if (!stock.valid) return fail(res, 400, "Stok harus berupa bilangan bulat 0 atau lebih.");
  const validatedToppings = validateToppings(toppings);
  if (!validatedToppings) return fail(res, 400, "Periksa kembali nama dan harga topping.");
  try {
    const result = await pool.query(
      `insert into products (store_id, name, price, category, description, image, toppings, stock_quantity)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, store_id as "storeId", name, price, category, description, image, toppings,
         stock_quantity as "stockQuantity",
         (in_stock and (stock_quantity is null or stock_quantity > 0)) as "inStock",
         created_at as "createdAt"`,
      [req.params.storeId, name.trim().slice(0, 60), Math.round(Number(price)), category,
        description.trim().slice(0, 400), image, JSON.stringify(validatedToppings), stock.value]
    );
    sendChange();
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/products/:id", async (req, res, next) => {
  const { name = "", price, category, description = "", image = "", toppings = [], stockQuantity } = req.body;
  if (!name.trim()) return fail(res, 400, "Nama produk wajib diisi.");
  if (!(Number(price) > 0)) return fail(res, 400, "Harga harus lebih dari 0.");
  if (!CATEGORIES.includes(category)) return fail(res, 400, "Kategori tidak valid.");
  const stock = parseStockQuantity(stockQuantity);
  if (!stock.valid) return fail(res, 400, "Stok harus berupa bilangan bulat 0 atau lebih.");
  const validatedToppings = validateToppings(toppings);
  if (!validatedToppings) return fail(res, 400, "Periksa kembali nama dan harga topping.");
  try {
    const owner = await pool.query("select store_id from products where id = $1", [req.params.id]);
    if (!owner.rowCount) return fail(res, 404, "Produk tidak ditemukan.");
    if (!requireOwner(req, res, owner.rows[0].store_id)) return;
    const result = await pool.query(
      `update products set name = $2, price = $3, category = $4, description = $5, image = $6, toppings = $7,
         stock_quantity = $8
       where id = $1 returning id, store_id as "storeId", name, price, category, description, image, toppings,
         stock_quantity as "stockQuantity",
         (in_stock and (stock_quantity is null or stock_quantity > 0)) as "inStock",
         created_at as "createdAt"`,
      [req.params.id, name.trim().slice(0, 60), Math.round(Number(price)), category,
        description.trim().slice(0, 400), image, JSON.stringify(validatedToppings), stock.value]
    );
    sendChange();
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/products/:id/stock", async (req, res, next) => {
  try {
    const owner = await pool.query("select store_id from products where id = $1", [req.params.id]);
    if (!owner.rowCount) return fail(res, 404, "Produk tidak ditemukan.");
    if (!requireOwner(req, res, owner.rows[0].store_id)) return;
    if (req.body.inStock === true) {
      const result = await pool.query(
        `update products set in_stock = true where id = $1 and (stock_quantity is null or stock_quantity > 0)
         returning id`,
        [req.params.id]
      );
      if (!result.rowCount) return fail(res, 409, "Tambahkan stok sebelum menandai produk tersedia.");
    } else {
      await pool.query("update products set in_stock = false where id = $1", [req.params.id]);
    }
    sendChange();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", async (req, res, next) => {
  try {
    const owner = await pool.query("select store_id from products where id = $1", [req.params.id]);
    if (!owner.rowCount) return fail(res, 404, "Produk tidak ditemukan.");
    if (!requireOwner(req, res, owner.rows[0].store_id)) return;
    await pool.query("delete from products where id = $1", [req.params.id]);
    sendChange();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  const { customer, items, method = "pickup" } = req.body;
  const phoneCheck = validateWhatsAppNumber(customer?.wa);
  if (!phoneCheck.valid) return fail(res, 400, phoneCheck.message);
  const phone = phoneCheck.local;
  if (!customer?.nama?.trim() || !customer?.kelas?.trim()) return fail(res, 400, "Nama dan kelas wajib diisi.");
  if (!["pickup", "delivery"].includes(method)) return fail(res, 400, "Metode pengambilan tidak valid.");
  if (!Array.isArray(items) || !items.length) return fail(res, 400, "Keranjang masih kosong.");

  const client = await pool.connect();
  try {
    await client.query("begin");
    const customerResult = await client.query(
      `insert into customers (phone, name, kelas) values ($1, $2, $3)
       on conflict (phone) do update set name = excluded.name, kelas = excluded.kelas returning id`,
      [phone, customer.nama.trim(), customer.kelas.trim()]
    );
    const customerId = customerResult.rows[0].id;
    const grouped = new Map();
    const orderedItems = [...items].sort((a, b) =>
      String(a.product?.id || "").localeCompare(String(b.product?.id || ""))
    );
    const productIds = [...new Set(orderedItems.map((entry) => String(entry.product?.id || "")))];
    if (productIds.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) {
      throw Object.assign(new Error("Produk sudah tidak tersedia."), { status: 400 });
    }
    const productStores = await client.query(
      "select id, store_id as \"storeId\" from products where id = any($1::uuid[]) order by id",
      [productIds]
    );
    if (productStores.rowCount !== productIds.length) {
      throw Object.assign(new Error("Produk sudah tidak tersedia."), { status: 400 });
    }
    const storeIds = [...new Set(productStores.rows.map((product) => product.storeId))].sort();
    const lockedStores = await client.query(
      `select id, name, is_open as "isOpen" from stores where id = any($1::uuid[])
       order by id for share`,
      [storeIds]
    );
    if (lockedStores.rowCount !== storeIds.length) {
      throw Object.assign(new Error("Toko sudah tidak tersedia."), { status: 400 });
    }
    const storesById = new Map(lockedStores.rows.map((store) => [store.id, store]));

    for (const entry of orderedItems) {
      const productResult = await client.query(
        `select p.id, p.store_id as "storeId", p.name, p.category, p.price, p.toppings,
          p.in_stock as "inStock", p.stock_quantity as "stockQuantity", s.name as "storeName"
         from products p join stores s on s.id = p.store_id where p.id = $1 for update of p`,
        [entry.product?.id]
      );
      const product = productResult.rows[0];
      if (!product) throw Object.assign(new Error("Produk sudah tidak tersedia."), { status: 400 });
      if (!storesById.get(product.storeId)?.isOpen) {
        throw Object.assign(new Error(`${product.storeName} sedang tutup.`), { status: 400 });
      }
      const qty = Math.max(1, Math.min(99, Math.round(Number(entry.qty) || 1)));
      if (!product.inStock) {
        throw Object.assign(new Error(`Maaf, "${product.name}" sedang tidak tersedia. Coba pilih produk lain ya.`), { status: 409 });
      }
      if (product.stockQuantity !== null && product.stockQuantity < qty) {
        const message = product.stockQuantity === 0
          ? `Maaf, stok "${product.name}" baru saja habis saat kamu checkout. Coba pilih produk lain ya.`
          : `Maaf, stok "${product.name}" tinggal ${product.stockQuantity}. Kurangi jumlah pesananmu atau pilih produk lain ya.`;
        throw Object.assign(new Error(message), { status: 409 });
      }
      if (product.stockQuantity !== null) {
        await client.query(
          "update products set stock_quantity = stock_quantity - $2 where id = $1",
          [product.id, qty]
        );
      }
      const options = entry.options && typeof entry.options === "object" ? entry.options : {};
      if (!Array.isArray(options.toppings || [])) {
        throw Object.assign(new Error("Pilihan topping tidak valid."), { status: 400 });
      }
      const selectedNames = new Set();
      const toppings = (options.toppings || []).map((selected) => {
        if (!selected || typeof selected.name !== "string") {
          throw Object.assign(new Error("Pilihan topping tidak valid."), { status: 400 });
        }
        const configured = product.toppings.find((topping) => topping.name === selected.name);
        if (!configured) throw Object.assign(new Error("Topping pilihan sudah tidak tersedia."), { status: 400 });
        if (selectedNames.has(configured.name)) {
          throw Object.assign(new Error("Pilihan topping tidak boleh duplikat."), { status: 400 });
        }
        selectedNames.add(configured.name);
        return configured;
      });
      const optionsObj = { ...options, toppings };
      const price = product.price + toppings.reduce((total, topping) => total + topping.price, 0);
      const orderItem = {
        productId: product.id,
        name: product.name,
        price,
        qty,
        options: optionsText(optionsObj),
        optionsObj,
        note: String(entry.note || "").trim().slice(0, 80),
      };
      if (!grouped.has(product.storeId)) grouped.set(product.storeId, { storeName: product.storeName, items: [] });
      grouped.get(product.storeId).items.push(orderItem);
    }

    const createdIds = [];
    for (const [storeId, group] of grouped) {
      const sequence = await client.query("select nextval('order_queue_seq') as number");
      const queueNo = `MD-${String(sequence.rows[0].number).padStart(3, "0")}`;
      const total = group.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const orderResult = await client.query(
        `insert into orders (store_id, customer_id, queue_no, method, note, total)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [storeId, customerId, queueNo, method, String(customer.note || "").trim().slice(0, 200), total]
      );
      const orderId = orderResult.rows[0].id;
      createdIds.push(orderId);
      for (const item of group.items) {
        await client.query(
          `insert into order_items (order_id, product_id, name, price, qty, options, options_obj, note)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [orderId, item.productId, item.name, item.price, item.qty, item.options, JSON.stringify(item.optionsObj), item.note]
        );
      }
    }
    await client.query("commit");
    const orders = await ordersByIds(createdIds);
    sendChange();
    res.status(201).json(orders);
  } catch (error) {
    await client.query("rollback");
    if (error.status) return fail(res, error.status, error.message);
    next(error);
  } finally {
    client.release();
  }
});

app.get("/api/orders", async (req, res, next) => {
  try {
    const ids = String(req.query.ids || "").split(",").filter(Boolean);
    res.json(await ordersByIds(ids));
  } catch (error) {
    next(error);
  }
});

app.get("/api/stores/:storeId/orders", async (req, res, next) => {
  if (!requireOwner(req, res, req.params.storeId)) return;
  try {
    const result = await pool.query(
      `${ORDER_SELECT} where o.store_id = $1 group by o.id, s.name, c.id order by o.created_at desc`,
      [req.params.storeId]
    );
    res.json(result.rows.map(withCustomer));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id/status", async (req, res, next) => {
  const valid = ["pending", "accepted", "processing", "done"];
  if (!valid.includes(req.body.status)) return fail(res, 400, "Status tidak valid.");
  try {
    const order = await pool.query("select store_id from orders where id = $1", [req.params.id]);
    if (!order.rowCount) return fail(res, 404, "Pesanan tidak ditemukan.");
    if (!requireOwner(req, res, order.rows[0].store_id)) return;
    await pool.query("update orders set status = $2 where id = $1", [req.params.id, req.body.status]);
    sendChange();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/stores/:storeId/stats", async (req, res, next) => {
  if (!requireOwner(req, res, req.params.storeId)) return;
  try {
    const result = await pool.query(
      `${ORDER_SELECT} where o.store_id = $1 group by o.id, s.name, c.id order by o.created_at desc`,
      [req.params.storeId]
    );
    const orders = result.rows;
    const done = orders.filter((order) => order.status === "done");
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      return date;
    });
    const revenueByDay = days.map((date) => {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return done.filter((order) => new Date(order.createdAt) >= date && new Date(order.createdAt) < next)
        .reduce((sum, order) => sum + order.total, 0);
    });
    const sold = new Map();
    for (const order of done) {
      for (const item of order.items) {
        const current = sold.get(item.productId) || { name: item.name, qty: 0, revenue: 0 };
        current.qty += item.qty;
        current.revenue += item.price * item.qty;
        sold.set(item.productId, current);
      }
    }
    const revenue = done.reduce((sum, order) => sum + order.total, 0);
    const statusCounts = Object.fromEntries(["pending", "accepted", "processing", "done"]
      .map((status) => [status, orders.filter((order) => order.status === status).length]));
    res.json({
      revenue,
      orderCount: orders.length,
      doneCount: done.length,
      avgOrder: done.length ? Math.round(revenue / done.length) : 0,
      pendingRevenue: orders.filter((order) => order.status !== "done").reduce((sum, order) => sum + order.total, 0),
      soldPortions: done.reduce((sum, order) => sum + order.items.reduce((qty, item) => qty + item.qty, 0), 0),
      days: days.map((date) => date.toLocaleDateString("id-ID", { weekday: "short" })),
      revenueByDay,
      topProducts: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
      statusCounts,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/stats", async (req, res, next) => {
  try {
    const result = await pool.query(
      `select
        (select count(*)::int from stores where is_open) as stores,
        (select count(*)::int from stores) as "totalStores",
        (select count(*)::int from products) as products,
        (select count(*)::int from orders) as orders,
        (select coalesce(sum(oi.qty), 0)::int from order_items oi join orders o on o.id = oi.order_id
          where o.status = 'done') as sold`
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use("/api", (req, res) => fail(res, 404, "Endpoint tidak ditemukan."));

// Saat berjalan lokal, Express juga menyajikan hasil build Vite.
// Di Vercel, file statis dilayani langsung oleh platform (outputDirectory: dist).
if (!process.env.VERCEL) {
  app.use(express.static(path.resolve(__dirname, "../dist")));
  app.get("*splat", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.resolve(__dirname, "../dist/index.html"));
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.code === "23505") return fail(res, 409, "Data tersebut sudah digunakan.");
  fail(res, 500, "Terjadi kesalahan pada server.");
});

const port = Number(process.env.PORT || 3000);
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Market app running on http://localhost:${port}`));
}

export default app;
