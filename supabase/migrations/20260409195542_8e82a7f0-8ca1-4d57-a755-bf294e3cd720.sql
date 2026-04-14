
-- ============================================
-- CRITICAL FIX 1: email_rate_limits
-- ============================================
DROP POLICY IF EXISTS "System can manage email rate limits" ON public.email_rate_limits;
DROP POLICY IF EXISTS "Admins can view email rate limits" ON public.email_rate_limits;

CREATE POLICY "Service role can manage email rate limits"
ON public.email_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view email rate limits"
ON public.email_rate_limits FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- CRITICAL FIX 2: function_logs
-- ============================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'function_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.function_logs;
  END IF;
END $$;

DROP POLICY IF EXISTS "System can insert function logs" ON public.function_logs;
DROP POLICY IF EXISTS "Admins can view all function logs" ON public.function_logs;
DROP POLICY IF EXISTS "Admins can delete function logs" ON public.function_logs;

CREATE POLICY "Service role can insert function logs"
ON public.function_logs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Admins can view all function logs"
ON public.function_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete function logs"
ON public.function_logs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- CRITICAL FIX 3: wordpress_sync_history
-- ============================================
DROP POLICY IF EXISTS "System can insert sync history" ON public.wordpress_sync_history;
DROP POLICY IF EXISTS "System can update sync history" ON public.wordpress_sync_history;
DROP POLICY IF EXISTS "Admins can view all sync history" ON public.wordpress_sync_history;

CREATE POLICY "Service role can insert sync history"
ON public.wordpress_sync_history FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update sync history"
ON public.wordpress_sync_history FOR UPDATE TO service_role USING (true);

CREATE POLICY "Admins can view all sync history"
ON public.wordpress_sync_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- WARNING FIXES: Scope admin policies to authenticated
-- ============================================

-- alert_settings
DROP POLICY IF EXISTS "Admins can manage alert settings" ON public.alert_settings;
CREATE POLICY "Admins can manage alert settings"
ON public.alert_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- categories
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- discount_codes
DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
CREATE POLICY "Admins can manage discount codes"
ON public.discount_codes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- loyalty_tiers
DROP POLICY IF EXISTS "Admins can manage loyalty tiers" ON public.loyalty_tiers;
CREATE POLICY "Admins can manage loyalty tiers"
ON public.loyalty_tiers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- order_status_history
DROP POLICY IF EXISTS "Admins can insert order history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can view all order history" ON public.order_status_history;

CREATE POLICY "Admins can insert order history"
ON public.order_status_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all order history"
ON public.order_status_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- orders
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- product_reviews
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.product_reviews;

CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own reviews"
ON public.product_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.product_reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.product_reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- product_specifications
DROP POLICY IF EXISTS "Admins can manage product specifications" ON public.product_specifications;
CREATE POLICY "Admins can manage product specifications"
ON public.product_specifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- reorder_suggestions
DROP POLICY IF EXISTS "Admins can manage reorder suggestions" ON public.reorder_suggestions;
CREATE POLICY "Admins can manage reorder suggestions"
ON public.reorder_suggestions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- theme_settings
DROP POLICY IF EXISTS "Admins can manage theme settings" ON public.theme_settings;
CREATE POLICY "Admins can manage theme settings"
ON public.theme_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- wordpress_settings
DROP POLICY IF EXISTS "Admins can manage WordPress settings" ON public.wordpress_settings;
CREATE POLICY "Admins can manage WordPress settings"
ON public.wordpress_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
