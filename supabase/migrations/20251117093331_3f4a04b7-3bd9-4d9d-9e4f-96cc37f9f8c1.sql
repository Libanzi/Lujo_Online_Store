-- Drop existing policies on wishlists
DROP POLICY IF EXISTS "Users can delete from their own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert into their own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlists;

-- Create new policies that explicitly block anonymous access
CREATE POLICY "Authenticated users can view their own wishlist"
ON public.wishlists
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert into their own wishlist"
ON public.wishlists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete from their own wishlist"
ON public.wishlists
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny all anonymous access
CREATE POLICY "Deny all anonymous access to wishlists"
ON public.wishlists
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);