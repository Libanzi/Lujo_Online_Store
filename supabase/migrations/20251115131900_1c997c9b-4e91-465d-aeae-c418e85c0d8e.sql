-- Add payment and tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_reference text,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS notes text;

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order history"
ON order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_status_history.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order history"
ON order_status_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert order history"
ON order_status_history FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
ON product_reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "Users can insert their own reviews"
ON product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON product_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON product_reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
ON product_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_purchase_amount numeric DEFAULT 0,
  max_uses integer,
  uses_count integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discount codes"
ON discount_codes FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage discount codes"
ON discount_codes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add discount fields to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_code text,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Create trigger for updated_at on product_reviews
CREATE OR REPLACE FUNCTION update_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_reviews_updated_at();

-- Create trigger for updated_at on discount_codes
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON discount_codes
FOR EACH ROW
EXECUTE FUNCTION update_product_reviews_updated_at();

-- Allow users to create orders
CREATE POLICY "Users can create their own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);