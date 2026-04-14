import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SecurityLogger, checkRateLimit } from "../_shared/security-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const StripePaymentSchema = z.object({
  orderId: z.string()
    .uuid("Invalid order ID format"),
  successUrl: z.string()
    .url("Invalid success URL")
    .max(500, "Success URL too long"),
  cancelUrl: z.string()
    .url("Invalid cancel URL")
    .max(500, "Cancel URL too long"),
});

serve(async (req) => {
  const logger = new SecurityLogger('process-stripe-payment', req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.logRequest(req.method);

    // Rate limiting: 10 requests per minute per IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`stripe:${clientIp}`, 10, 60 * 1000)) {
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
    const validation = StripePaymentSchema.safeParse(body);
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

    const { orderId, successUrl, cancelUrl } = validation.data;

    // Get order details with items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (
            name,
            image_url
          )
        )
      `)
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

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      logger.logError('Stripe key not configured');
      throw new Error('Stripe key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Create line items for Stripe
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: 'zar',
        product_data: {
          name: item.product.name,
          images: item.product.image_url ? [item.product.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
      },
    });

    // Update order with payment method
    await supabaseClient
      .from('orders')
      .update({ 
        payment_method: 'stripe',
        payment_status: 'pending',
        payment_reference: session.id
      })
      .eq('id', orderId);

    console.log('Stripe checkout session created for order:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    console.error('Error processing Stripe payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
