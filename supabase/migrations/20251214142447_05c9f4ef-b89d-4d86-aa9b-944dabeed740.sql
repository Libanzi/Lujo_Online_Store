-- Create theme_settings table for storing customizable theme colors
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color_name text NOT NULL UNIQUE,
  color_label text NOT NULL,
  hsl_value text NOT NULL,
  hex_value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view theme settings (needed for the app to render colors)
CREATE POLICY "Anyone can view theme settings"
ON public.theme_settings
FOR SELECT
USING (true);

-- Only admins can manage theme settings
CREATE POLICY "Admins can manage theme settings"
ON public.theme_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_theme_settings_updated_at();

-- Insert default color palette
INSERT INTO public.theme_settings (color_name, color_label, hsl_value, hex_value, sort_order) VALUES
('color-1', 'Deep Black', '0 0% 9%', '#171717', 1),
('color-2', 'Charcoal', '0 0% 20%', '#333333', 2),
('color-3', 'Gray', '0 0% 45%', '#737373', 3),
('color-4', 'Light Gray', '0 0% 70%', '#B3B3B3', 4),
('color-5', 'Gold', '38 92% 50%', '#F5A623', 5),
('color-6', 'Champagne', '43 74% 66%', '#E4C580', 6),
('color-7', 'Off White', '0 0% 96%', '#F5F5F5', 7),
('color-8', 'Pure White', '0 0% 100%', '#FFFFFF', 8);