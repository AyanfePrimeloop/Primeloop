-- ============================================================
-- MIGRATION 18: New client prices
-- Run this in the Supabase SQL Editor. It is safe to run more than once.
--
-- Why: at the old prices a client paid about 38% less than the old WhatsApp
-- packages for the same work, and the AI check on each screenshot costs about
-- as much as the margin on a like. This raises what CLIENTS pay for likes,
-- comments, shares, saves, views, reposts, replies and bookmarks.
--
-- It does NOT touch engager_payout (what engagers earn) or follows/subscribes
-- (already priced with a healthy margin).
--
-- Result on Facebook: 30 likes + 30 comments + 30 shares = N1,500 (was N930).
-- ============================================================
update pricing_rules as p set client_price = v.price, updated_at = now()
from (values
  ('facebook','like',10), ('facebook','comment',22), ('facebook','share',18),
  ('instagram','like',10), ('instagram','comment',24), ('instagram','share',19), ('instagram','save',16),
  ('tiktok','like',9), ('tiktok','comment',26), ('tiktok','share',16), ('tiktok','watch',11),
  ('x','like',9), ('x','reply',24), ('x','repost',18), ('x','bookmark',13),
  ('youtube','like',11), ('youtube','comment',29), ('youtube','watch',24)
) as v(platform, action, price)
where p.platform = v.platform and p.action = v.action;

-- Check: should list 18 rows with the new prices
select platform, action, client_price, engager_payout from pricing_rules order by platform, action;
