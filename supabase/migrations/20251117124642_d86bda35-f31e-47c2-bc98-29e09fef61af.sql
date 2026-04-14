-- Add category_mappings field to wordpress_settings table
ALTER TABLE public.wordpress_settings
ADD COLUMN category_mappings jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.wordpress_settings.category_mappings IS 'Maps WordPress category slugs to Supabase category UUIDs';