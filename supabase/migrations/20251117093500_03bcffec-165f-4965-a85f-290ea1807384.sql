-- Fix cart_items: block anonymous access
DROP POLICY IF EXISTS "Users can delete from their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert into their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Deny all anonymous access to cart_items" ON public.cart_items;

CREATE POLICY "Authenticated users can view their own cart"
ON public.cart_items FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert into their own cart"
ON public.cart_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own cart"
ON public.cart_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete from their own cart"
ON public.cart_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Deny all anonymous access to cart_items"
ON public.cart_items AS RESTRICTIVE FOR ALL TO anon
USING (false);

-- Fix profiles, user_roles, loyalty tables, orders - add explicit anon blocks if not exists
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny all anonymous access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny all anonymous access to loyalty_points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Deny all anonymous access to loyalty_transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Deny all anonymous access to orders" ON public.orders;
DROP POLICY IF EXISTS "Deny all anonymous access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Deny all anonymous access to order_status_history" ON public.order_status_history;

CREATE POLICY "Deny all anonymous access to profiles"
ON public.profiles AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE POLICY "Deny all anonymous access to user_roles"
ON public.user_roles AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE POLICY "Deny all anonymous access to loyalty_points"
ON public.loyalty_points AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE POLICY "Deny all anonymous access to loyalty_transactions"
ON public.loyalty_transactions AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE POLICY "Deny all anonymous access to orders"
ON public.orders AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE POLICY "Deny all anonymous access to order_items"
ON public.order_items AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE POLICY "Deny all anonymous access to order_status_history"
ON public.order_status_history AS RESTRICTIVE FOR ALL TO anon USING (false);