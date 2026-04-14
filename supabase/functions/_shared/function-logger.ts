import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface LogEntry {
  function_name: string;
  execution_time_ms?: number;
  status: 'success' | 'error' | 'timeout';
  error_message?: string;
  user_id?: string;
  request_method?: string;
  request_path?: string;
  response_status?: number;
  metadata?: Record<string, any>;
}

export class FunctionLogger {
  private supabase: SupabaseClient;
  private functionName: string;
  private startTime: number;

  constructor(functionName: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.functionName = functionName;
    this.startTime = Date.now();
  }

  async logSuccess(data: Partial<LogEntry> = {}) {
    const executionTime = Date.now() - this.startTime;
    await this.log({
      status: 'success',
      execution_time_ms: executionTime,
      response_status: data.response_status || 200,
      ...data,
    });
  }

  async logError(error: Error | string, data: Partial<LogEntry> = {}) {
    const executionTime = Date.now() - this.startTime;
    const errorMessage = error instanceof Error ? error.message : error;
    await this.log({
      status: 'error',
      execution_time_ms: executionTime,
      error_message: errorMessage,
      response_status: data.response_status || 500,
      ...data,
    });

    // Check if we need to send an alert for this error
    await this.checkAndSendAlert(errorMessage, executionTime, data);
  }

  private async checkAndSendAlert(errorMessage: string, executionTime: number, data: Partial<LogEntry>) {
    try {
      // Get alert settings
      const { data: settings, error: settingsError } = await this.supabase
        .from('alert_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError || !settings) {
        console.error('Error fetching alert settings:', settingsError);
        return;
      }

      // Check error rate for this function in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentLogs, error } = await this.supabase
        .from('function_logs')
        .select('status')
        .eq('function_name', this.functionName)
        .gte('created_at', oneHourAgo);

      if (error) {
        console.error('Error checking alert conditions:', error);
        return;
      }

      const totalCalls = recentLogs?.length || 0;
      const errorCalls = recentLogs?.filter(log => log.status === 'error').length || 0;
      
      // Check if error rate exceeds threshold
      if (totalCalls >= 10 && (errorCalls / totalCalls) * 100 > settings.error_rate_threshold) {
        const errorRate = Math.round((errorCalls / totalCalls) * 100);
        await this.sendAlert('high_error_rate', settings, {
          error_rate: errorRate,
          total_calls: totalCalls,
          error_calls: errorCalls,
          recent_error: errorMessage,
        });
      }

      // Check if execution time exceeds threshold
      if (executionTime > settings.execution_time_threshold) {
        await this.sendAlert('performance_degradation', settings, {
          execution_time_ms: executionTime,
          threshold_ms: settings.execution_time_threshold,
        });
      }

      // For critical functions, always alert on any error
      const criticalFunctions = ['process-stripe-payment', 'process-payfast-payment', 'wordpress-auth-sync'];
      if (criticalFunctions.includes(this.functionName)) {
        await this.sendAlert('critical_function_failure', settings, {
          error_message: errorMessage,
          metadata: data.metadata,
        });
      }
    } catch (alertError) {
      console.error('Error in alert checking:', alertError);
    }
  }

  private async sendAlert(alertType: string, settings: any, details: Record<string, any>) {
    try {
      // Send email alert if enabled
      if (settings.email_alerts_enabled) {
        await this.supabase.functions.invoke('send-admin-alert', {
          body: {
            alert_type: alertType,
            function_name: this.functionName,
            error_rate: details.error_rate,
            error_message: details.error_message,
            details,
          },
        });
      }

      // Send Slack alert if enabled
      if (settings.slack_alerts_enabled && settings.slack_webhook_url) {
        await this.supabase.functions.invoke('send-webhook-alert', {
          body: {
            webhook_url: settings.slack_webhook_url,
            webhook_type: 'slack',
            alert_type: alertType,
            function_name: this.functionName,
            error_rate: details.error_rate,
            error_message: details.error_message,
            details,
          },
        });
      }

      // Send Discord alert if enabled
      if (settings.discord_alerts_enabled && settings.discord_webhook_url) {
        await this.supabase.functions.invoke('send-webhook-alert', {
          body: {
            webhook_url: settings.discord_webhook_url,
            webhook_type: 'discord',
            alert_type: alertType,
            function_name: this.functionName,
            error_rate: details.error_rate,
            error_message: details.error_message,
            details,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private async log(entry: Partial<LogEntry>) {
    try {
      await this.supabase.from('function_logs').insert({
        function_name: this.functionName,
        ...entry,
      });
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }
}

// Email rate limiting helper
export async function checkAndRecordEmailLimit(
  userId: string | undefined,
  emailType: string,
  recipientEmail: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!userId) {
    return { allowed: true }; // System emails without user context bypass rate limit
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check rate limit
  const { data: canSend, error: checkError } = await supabase.rpc(
    'check_email_rate_limit',
    {
      p_user_id: userId,
      p_email_type: emailType,
      p_max_per_hour: 5,
      p_max_per_day: 20,
    }
  );

  if (checkError) {
    console.error('Error checking email rate limit:', checkError);
    return { allowed: true }; // Fail open to not block legitimate emails
  }

  if (!canSend) {
    return {
      allowed: false,
      reason: 'Email rate limit exceeded. Maximum 5 emails per hour or 20 per day.',
    };
  }

  // Record the email send
  const { error: recordError } = await supabase.rpc('record_email_send', {
    p_user_id: userId,
    p_email_type: emailType,
    p_recipient_email: recipientEmail,
  });

  if (recordError) {
    console.error('Error recording email send:', recordError);
  }

  return { allowed: true };
}
