import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { alert_type, function_name, error_rate, error_message, details }: AlertRequest = await req.json();

    // Get all admin users
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admin users found to notify');
      return new Response(JSON.stringify({ message: 'No admins to notify' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get admin emails
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .in('id', adminRoles.map(r => r.user_id));

    if (profileError) {
      console.error('Error fetching admin profiles:', profileError);
      throw profileError;
    }

    const adminEmails = profiles?.map(p => p.email) || [];

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(JSON.stringify({ message: 'No admin emails found' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prepare email content based on alert type
    let subject = '';
    let htmlContent = '';

    switch (alert_type) {
      case 'high_error_rate':
        subject = `⚠️ High Error Rate Alert: ${function_name}`;
        htmlContent = `
          <h2>High Error Rate Detected</h2>
          <p><strong>Function:</strong> ${function_name}</p>
          <p><strong>Error Rate:</strong> ${error_rate}%</p>
          <p><strong>Threshold:</strong> 50%</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <h3>Details:</h3>
          <pre>${JSON.stringify(details, null, 2)}</pre>
          <p>Please investigate this issue immediately.</p>
        `;
        break;
      
      case 'critical_function_failure':
        subject = `🚨 Critical Function Failure: ${function_name}`;
        htmlContent = `
          <h2>Critical Function Failure</h2>
          <p><strong>Function:</strong> ${function_name}</p>
          <p><strong>Error:</strong> ${error_message}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <h3>Details:</h3>
          <pre>${JSON.stringify(details, null, 2)}</pre>
          <p>This requires immediate attention!</p>
        `;
        break;
      
      case 'performance_degradation':
        subject = `⚠️ Performance Degradation: ${function_name}`;
        htmlContent = `
          <h2>Performance Degradation Detected</h2>
          <p><strong>Function:</strong> ${function_name}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <h3>Metrics:</h3>
          <pre>${JSON.stringify(details, null, 2)}</pre>
          <p>Function performance has degraded significantly.</p>
        `;
        break;
    }

    // Send emails to all admins
    const emailPromises = adminEmails.map(email =>
      resend.emails.send({
        from: "Alerts <onboarding@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      })
    );

    await Promise.all(emailPromises);

    console.log(`Alert sent to ${adminEmails.length} admins for ${function_name}`);

    return new Response(JSON.stringify({ 
      success: true,
      admins_notified: adminEmails.length 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-admin-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
