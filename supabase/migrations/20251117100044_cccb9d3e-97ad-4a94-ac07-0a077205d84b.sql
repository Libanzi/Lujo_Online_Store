-- Update RLS policies to use 'authenticated' role instead of 'public' for user data tables
-- This improves defense-in-depth security for sensitive user data

-- loyalty_points table
DROP POLICY IF EXISTS "System can insert points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can update points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Users can view their own points" ON public.loyalty_points;

CREATE POLICY "System can insert points"
ON public.loyalty_points FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update points"
ON public.loyalty_points FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own points"
ON public.loyalty_points FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- loyalty_transactions table
DROP POLICY IF EXISTS "System can insert transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;

CREATE POLICY "System can insert transactions"
ON public.loyalty_transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
ON public.loyalty_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- order_items table
DROP POLICY IF EXISTS "Users can insert items for their own orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

CREATE POLICY "Users can insert items for their own orders"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
));

-- orders table
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- order_status_history table
DROP POLICY IF EXISTS "Users can view their order history" ON public.order_status_history;

CREATE POLICY "Users can view their order history"
ON public.order_status_history FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_status_history.order_id
  AND orders.user_id = auth.uid()
));