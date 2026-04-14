-- Create email rate limiting table
CREATE TABLE IF NOT EXISTS public.email_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  recipient_email text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_email_rate_limits_user_sent 
ON public.email_rate_limits(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_rate_limits_cleanup 
ON public.email_rate_limits(sent_at);

-- Enable RLS on email_rate_limits
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can insert/manage rate limits
CREATE POLICY "System can manage email rate limits"
ON public.email_rate_limits FOR ALL
USING (true);

-- Admins can view all rate limits
CREATE POLICY "Admins can view email rate limits"
ON public.email_rate_limits FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create edge function monitoring table
CREATE TABLE IF NOT EXISTS public.function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  execution_time_ms integer,
  status text NOT NULL, -- 'success', 'error', 'timeout'
  error_message text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_method text,
  request_path text,
  response_status integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_function_logs_created 
ON public.function_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_function_logs_function_status 
ON public.function_logs(function_name, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_function_logs_user 
ON public.function_logs(user_id, created_at DESC);

-- Enable RLS on function_logs
ALTER TABLE public.function_logs ENABLE ROW LEVEL SECURITY;

-- System can insert logs
CREATE POLICY "System can insert function logs"
ON public.function_logs FOR INSERT
WITH CHECK (true);

-- Admins can view all logs
CREATE POLICY "Admins can view all function logs"
ON public.function_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete old logs
CREATE POLICY "Admins can delete function logs"
ON public.function_logs FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to check email rate limit
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
  p_user_id uuid,
  p_email_type text,
  p_max_per_hour integer DEFAULT 5,
  p_max_per_day integer DEFAULT 20
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count_hour integer;
  v_count_day integer;
BEGIN
  -- Count emails in last hour
  SELECT COUNT(*) INTO v_count_hour
  FROM public.email_rate_limits
  WHERE user_id = p_user_id
    AND email_type = p_email_type
    AND sent_at > NOW() - INTERVAL '1 hour';
  
  -- Count emails in last day
  SELECT COUNT(*) INTO v_count_day
  FROM public.email_rate_limits
  WHERE user_id = p_user_id
    AND email_type = p_email_type
    AND sent_at > NOW() - INTERVAL '24 hours';
  
  -- Return false if limits exceeded
  IF v_count_hour >= p_max_per_hour OR v_count_day >= p_max_per_day THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create function to record email send
CREATE OR REPLACE FUNCTION public.record_email_send(
  p_user_id uuid,
  p_email_type text,
  p_recipient_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_rate_limits (user_id, email_type, recipient_email)
  VALUES (p_user_id, p_email_type, p_recipient_email);
END;
$$;

-- Create function to clean up old rate limit records (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_email_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_rate_limits
  WHERE sent_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Enable realtime for function_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.function_logs;