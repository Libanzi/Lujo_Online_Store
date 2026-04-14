-- Create alert settings table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_rate_threshold integer NOT NULL DEFAULT 50,
  execution_time_threshold integer NOT NULL DEFAULT 5000,
  slack_webhook_url text,
  discord_webhook_url text,
  email_alerts_enabled boolean NOT NULL DEFAULT true,
  slack_alerts_enabled boolean NOT NULL DEFAULT false,
  discord_alerts_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage alert settings
CREATE POLICY "Admins can manage alert settings"
ON public.alert_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.alert_settings (error_rate_threshold, execution_time_threshold)
VALUES (50, 5000)
ON CONFLICT DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_alert_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_alert_settings_updated_at
BEFORE UPDATE ON public.alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_alert_settings_updated_at();