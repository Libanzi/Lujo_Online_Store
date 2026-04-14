-- Create WordPress settings table
CREATE TABLE IF NOT EXISTS public.wordpress_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_url TEXT NOT NULL,
  sync_mode TEXT NOT NULL DEFAULT 'incremental' CHECK (sync_mode IN ('full', 'incremental')),
  sync_categories BOOLEAN NOT NULL DEFAULT true,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_schedule TEXT NOT NULL DEFAULT '0 3 * * *',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wordpress_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wordpress_settings
CREATE POLICY "Admins can manage WordPress settings"
  ON public.wordpress_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can read WordPress settings"
  ON public.wordpress_settings
  FOR SELECT
  USING (true);

-- Create WordPress sync history table
CREATE TABLE IF NOT EXISTS public.wordpress_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
  wordpress_url TEXT NOT NULL,
  sync_mode TEXT NOT NULL,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,
  categories_created INTEGER DEFAULT 0,
  categories_updated INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  triggered_by TEXT NOT NULL DEFAULT 'manual' CHECK (triggered_by IN ('manual', 'cron', 'admin')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wordpress_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wordpress_sync_history
CREATE POLICY "Admins can view all sync history"
  ON public.wordpress_sync_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert sync history"
  ON public.wordpress_sync_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sync history"
  ON public.wordpress_sync_history
  FOR UPDATE
  USING (true);

-- Create function to update wordpress_settings updated_at
CREATE OR REPLACE FUNCTION update_wordpress_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for wordpress_settings
CREATE TRIGGER update_wordpress_settings_updated_at
  BEFORE UPDATE ON public.wordpress_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_wordpress_settings_updated_at();

-- Insert default settings (will be used by cron)
INSERT INTO public.wordpress_settings (wordpress_url, sync_mode, sync_categories, auto_sync_enabled)
VALUES ('https://your-wordpress-site.com', 'full', true, true)
ON CONFLICT DO NOTHING;