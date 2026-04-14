import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SecurityLogger, checkRateLimit } from "../_shared/security-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const PayFastPaymentSchema = z.object({
  orderId: z.string()
    .uuid("Invalid order ID format"),
  amount: z.number()
    .positive("Amount must be positive")
    .finite("Amount must be a valid number")
    .max(1000000, "Amount too large"),
  returnUrl: z.string()
    .url("Invalid return URL")
    .max(500, "Return URL too long"),
  cancelUrl: z.string()
    .url("Invalid cancel URL")
    .max(500, "Cancel URL too long"),
  notifyUrl: z.string()
    .url("Invalid notify URL")
    .max(500, "Notify URL too long"),
});

serve(async (req) => {
  const logger = new SecurityLogger('process-payfast-payment', req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.logRequest(req.method);

    // Rate limiting: 10 requests per minute per IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`payfast:${clientIp}`, 10, 60 * 1000)) {
      logger.logSuspiciousActivity('rate_limit_exceeded', {
        identifier: clientIp,
        limit: '10 requests per minute',
      });
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.' 
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body = await req.json();
    
    // Check for suspicious patterns
    const suspiciousCheck = logger.detectSuspiciousPatterns(JSON.stringify(body));
    if (suspiciousCheck.isSuspicious) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate input with Zod
    const validation = PayFastPaymentSchema.safeParse(body);
    if (!validation.success) {
      logger.logValidationFailure(validation.error.errors, body);
      return new Response(
        JSON.stringify({ 
          error: validation.error.errors[0]?.message || 'Invalid input' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    logger.logValidationSuccess(validation.data);

    const { orderId, amount, returnUrl, cancelUrl, notifyUrl } = validation.data;

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, profiles!inner(*)')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    // Verify user owns this order
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user || user.id !== order.user_id) {
      logger.logAuthFailure('unauthorized_order_access', user?.email);
      throw new Error('Unauthorized');
    }

    logger.logAuthSuccess(user.id);

    // PayFast configuration
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
    const merchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY');
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE');

    if (!merchantId || !merchantKey || !passphrase) {
      logger.logError('PayFast credentials not configured');
      throw new Error('PayFast credentials not configured');
    }

    // Build PayFast payment data
    const paymentData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: order.profiles?.full_name?.split(' ')[0] || 'Customer',
      name_last: order.profiles?.full_name?.split(' ').slice(1).join(' ') || '',
      email_address: order.profiles?.email || 'customer@example.com',
      m_payment_id: orderId,
      amount: amount.toFixed(2),
      item_name: `Order ${order.order_number}`,
      item_description: `Payment for order ${order.order_number}`,
    };

    // Generate signature
    const signature = await generateSignature(paymentData, passphrase);

    // Update order with payment method
    await supabaseClient
      .from('orders')
      .update({ 
        payment_method: 'payfast',
        payment_status: 'pending'
      })
      .eq('id', orderId);

    console.log('PayFast payment initiated for order:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: 'https://www.payfast.co.za/eng/process',
        paymentData: {
          ...paymentData,
          signature,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    console.error('Error processing PayFast payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateSignature(data: Record<string, string>, passphrase: string): Promise<string> {
  const sortedData = Object.keys(data)
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  const signatureString = `${sortedData}&passphrase=${encodeURIComponent(passphrase)}`;

  const msgBuffer = new TextEncoder().encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return signature;
}
