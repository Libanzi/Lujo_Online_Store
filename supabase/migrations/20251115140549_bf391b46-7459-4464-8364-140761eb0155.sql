-- Create loyalty reward tiers table
CREATE TABLE public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  discount_percentage NUMERIC NOT NULL,
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create loyalty points table
CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier_id UUID REFERENCES public.loyalty_tiers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create loyalty transactions table
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reorder suggestions table
CREATE TABLE public.reorder_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  sales_velocity NUMERIC NOT NULL,
  suggested_reorder_quantity INTEGER NOT NULL,
  days_until_stockout INTEGER,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product specifications table for comparison
CREATE TABLE public.product_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_name TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_tiers
CREATE POLICY "Anyone can view loyalty tiers"
  ON public.loyalty_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage loyalty tiers"
  ON public.loyalty_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for loyalty_points
CREATE POLICY "Users can view their own points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all points"
  ON public.loyalty_points FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert points"
  ON public.loyalty_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update points"
  ON public.loyalty_points FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reorder_suggestions
CREATE POLICY "Admins can manage reorder suggestions"
  ON public.reorder_suggestions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for product_specifications
CREATE POLICY "Anyone can view product specifications"
  ON public.product_specifications FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product specifications"
  ON public.product_specifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default loyalty tiers
INSERT INTO public.loyalty_tiers (name, min_points, discount_percentage, benefits) VALUES
  ('Bronze', 0, 0, ARRAY['Earn 1 point per R10 spent', 'Birthday bonus points']),
  ('Silver', 500, 5, ARRAY['Earn 1.5 points per R10 spent', '5% discount on all orders', 'Early access to sales']),
  ('Gold', 1500, 10, ARRAY['Earn 2 points per R10 spent', '10% discount on all orders', 'Free shipping', 'Priority support']),
  ('Platinum', 3000, 15, ARRAY['Earn 3 points per R10 spent', '15% discount on all orders', 'Free express shipping', 'Exclusive products', 'VIP support']);

-- Create function to update loyalty points updated_at
CREATE OR REPLACE FUNCTION update_loyalty_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_points_timestamp
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points_updated_at();

-- Create function to update reorder suggestions updated_at
CREATE OR REPLACE FUNCTION update_reorder_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reorder_suggestions_timestamp
  BEFORE UPDATE ON public.reorder_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_reorder_suggestions_updated_at();