-- Create function to atomically increment discount code usage
-- This prevents race conditions where multiple checkouts could bypass max_uses limit
CREATE OR REPLACE FUNCTION public.increment_discount_uses(discount_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atomically increment uses_count
  -- The CHECK constraint will prevent exceeding max_uses
  UPDATE public.discount_codes
  SET uses_count = uses_count + 1
  WHERE code = discount_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
  -- If no rows updated, the discount is invalid
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired discount code';
  END IF;
END;
$$;