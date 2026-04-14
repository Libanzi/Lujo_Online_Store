-- Add payment_reference and payment_method columns if not exists
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Update status enum to include payflex states
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'payment_pending', 'payment_received', 'payment_failed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('payflex_enabled', 'true'::jsonb),
  ('payflex_sandbox', 'true'::jsonb),
  ('free_shipping_threshold', '850'::jsonb),
  ('store_name', '"Lujo Lifestyle Hub"'::jsonb),
  ('store_currency', '"ZAR"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON wishlists
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
