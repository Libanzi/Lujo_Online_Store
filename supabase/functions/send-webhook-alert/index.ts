import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookAlertRequest {
  webhook_url: string;
  webhook_type: 'slack' | 'discord';
  alert_type: 'high_error_rate' | 'critical_function_failure' | 'performance_degradation';
  function_name: string;
  error_rate?: number;
  error_message?: string;
  details: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      webhook_url, 
      webhook_type, 
      alert_type, 
      function_name, 
      error_rate, 
      error_message, 
      details 
    }: WebhookAlertRequest = await req.json();

    let webhookPayload;

    if (webhook_type === 'slack') {
      webhookPayload = buildSlackPayload(alert_type, function_name, error_rate, error_message, details);
    } else if (webhook_type === 'discord') {
      webhookPayload = buildDiscordPayload(alert_type, function_name, error_rate, error_message, details);
    } else {
      throw new Error('Invalid webhook type');
    }

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }

    console.log(`${webhook_type} alert sent successfully for ${function_name}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-webhook-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function buildSlackPayload(
  alertType: string,
  functionName: string,
  errorRate?: number,
  errorMessage?: string,
  details?: Record<string, any>
) {
  let color = '#ff0000';
  let emoji = '🚨';
  let title = '';
  let text = '';

  switch (alertType) {
    case 'high_error_rate':
      color = '#ff9900';
      emoji = '⚠️';
      title = `${emoji} High Error Rate Alert`;
      text = `*Function:* ${functionName}\n*Error Rate:* ${errorRate}%\n*Time:* ${new Date().toISOString()}`;
      break;
    case 'critical_function_failure':
      color = '#ff0000';
      emoji = '🚨';
      title = `${emoji} Critical Function Failure`;
      text = `*Function:* ${functionName}\n*Error:* ${errorMessage}\n*Time:* ${new Date().toISOString()}`;
      break;
    case 'performance_degradation':
      color = '#ffcc00';
      emoji = '⚠️';
      title = `${emoji} Performance Degradation`;
      text = `*Function:* ${functionName}\n*Time:* ${new Date().toISOString()}`;
      break;
  }

  return {
    attachments: [
      {
        color,
        title,
        text,
        fields: [
          {
            title: 'Details',
            value: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
            short: false,
          },
        ],
        footer: 'Edge Function Monitor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

function buildDiscordPayload(
  alertType: string,
  functionName: string,
  errorRate?: number,
  errorMessage?: string,
  details?: Record<string, any>
) {
  let color = 0xff0000;
  let emoji = '🚨';
  let title = '';
  let description = '';

  switch (alertType) {
    case 'high_error_rate':
      color = 0xff9900;
      emoji = '⚠️';
      title = `${emoji} High Error Rate Alert`;
      description = `**Function:** ${functionName}\n**Error Rate:** ${errorRate}%\n**Time:** ${new Date().toISOString()}`;
      break;
    case 'critical_function_failure':
      color = 0xff0000;
      emoji = '🚨';
      title = `${emoji} Critical Function Failure`;
      description = `**Function:** ${functionName}\n**Error:** ${errorMessage}\n**Time:** ${new Date().toISOString()}`;
      break;
    case 'performance_degradation':
      color = 0xffcc00;
      emoji = '⚠️';
      title = `${emoji} Performance Degradation`;
      description = `**Function:** ${functionName}\n**Time:** ${new Date().toISOString()}`;
      break;
  }

  return {
    embeds: [
      {
        title,
        description,
        color,
        fields: [
          {
            name: 'Details',
            value: `\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\``,
          },
        ],
        footer: {
          text: 'Edge Function Monitor',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

serve(handler);
