create extension if not exists pgcrypto;

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references accounts(id) on delete cascade,
  slug text not null unique,
  code text not null unique check (code ~ '^MD-[0-9]{4}$'),
  name text not null unique,
  kelas text not null default '',
  bio text not null default '',
  members text[] not null default '{}',
  logo text not null default '',
  cover text not null default '',
  is_open boolean not null default true,
  joined_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  category text not null check (category in ('Makanan Berat', 'Minuman', 'Snack', 'Paket Bundling')),
  price integer not null check (price > 0),
  toppings jsonb not null default '[]'::jsonb,
  description text not null default '',
  image text not null default '',
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);
alter table products add column if not exists toppings jsonb not null default '[]'::jsonb;
create index if not exists products_store_idx on products (store_id, created_at desc);
create index if not exists products_search_idx
  on products using gin (to_tsvector('simple', name || ' ' || description));

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null,
  kelas text not null default '',
  created_at timestamptz not null default now()
);

do $$ begin
  create type order_status as enum ('pending', 'accepted', 'processing', 'done');
exception when duplicate_object then null; end $$;

create sequence if not exists order_queue_seq;
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  customer_id uuid not null references customers(id),
  queue_no text not null unique,
  method text not null default 'pickup' check (method in ('pickup', 'delivery')),
  note text not null default '',
  total integer not null check (total >= 0),
  status order_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists orders_store_idx on orders (store_id, created_at desc);
create index if not exists orders_customer_idx on orders (customer_id, created_at desc);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  price integer not null check (price >= 0),
  qty integer not null check (qty > 0),
  options text not null default '',
  options_obj jsonb not null default '{}'::jsonb,
  note text not null default ''
);
create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists user_sessions (
  sid varchar primary key,
  sess json not null,
  expire timestamp(6) not null
);
create index if not exists user_sessions_expire_idx on user_sessions (expire);

-- Kode OTP WhatsApp (dihapus otomatis setelah dipakai/kedaluwarsa).
create table if not exists otp_codes (
  phone text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0 check (attempts >= 0),
  send_count smallint not null default 1 check (send_count >= 0),
  window_started_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists otp_codes_expires_idx on otp_codes (expires_at);
