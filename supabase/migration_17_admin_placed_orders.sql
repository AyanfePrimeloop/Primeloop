-- ============================================================
-- MIGRATION 17: Orders placed by an admin on a client's behalf
-- Run this in the Supabase SQL Editor. It is safe to run more than once.
--
-- Adds four optional columns to orders. Orders the clients place themselves
-- leave all four empty, so nothing about the normal checkout changes.
-- ============================================================

-- The admin who placed it. Null means the client ordered for themselves.
alter table orders add column if not exists placed_by text;

-- 'paystack' (the client pays the link) or 'manual' (the super-admin recorded a
-- payment received another way, e.g. bank transfer). Null on client orders.
alter table orders add column if not exists payment_method text;

-- The Paystack payment link, kept so an admin can re-send it while unpaid.
alter table orders add column if not exists payment_url text;

-- For manual payments: how the money arrived (bank, reference, who received it).
alter table orders add column if not exists payment_note text;

create index if not exists orders_placed_by_idx on orders (created_at desc) where placed_by is not null;
