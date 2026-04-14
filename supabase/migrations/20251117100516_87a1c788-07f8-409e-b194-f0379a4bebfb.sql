-- Add database constraint to prevent discount codes from exceeding max_uses
-- This protects against race conditions where concurrent checkouts could bypass the limit

ALTER TABLE public.discount_codes
ADD CONSTRAINT check_uses_not_exceed_max
CHECK (uses_count <= max_uses OR max_uses IS NULL);

-- Create index for better performance on discount code lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code_active 
ON public.discount_codes(code) 
WHERE is_active = true;