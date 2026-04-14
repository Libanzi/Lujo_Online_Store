import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SecurityLogger, checkRateLimit } from "../_shared/security-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const ValidateDiscountSchema = z.object({
  code: z.string()
    .trim()
    .min(1, "Discount code is required")
    .max(50, "Discount code too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid discount code format"),
  subtotal: z.number()
    .positive("Subtotal must be positive")
    .finite("Subtotal must be a valid number")
    .max(1000000, "Subtotal too large"),
});

serve(async (req) => {
  const logger = new SecurityLogger('validate-discount', req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.logRequest(req.method);

    // Rate limiting: 20 requests per minute per IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`discount:${clientIp}`, 20, 60 * 1000)) {
      logger.logSuspiciousActivity('rate_limit_exceeded', {
        identifier: clientIp,
        limit: '20 requests per minute',
      });
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Too many requests. Please try again later.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
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
          valid: false, 
          error: 'Invalid request' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Validate input with Zod
    const validation = ValidateDiscountSchema.safeParse(body);
    if (!validation.success) {
      logger.logValidationFailure(validation.error.errors, body);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: validation.error.errors[0]?.message || 'Invalid input' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    logger.logValidationSuccess(validation.data);

    const { code, subtotal } = validation.data;

    // Get discount code
    const { data: discount, error: discountError } = await supabaseClient
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (discountError || !discount) {
      logger.logAuthFailure('invalid_discount_code', code);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid or expired discount code' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if expired
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      logger.logAuthFailure('expired_discount_code', code);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This discount code has expired' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check max uses
    if (discount.max_uses && discount.uses_count >= discount.max_uses) {
      logger.logAuthFailure('discount_max_uses_reached', code);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This discount code has reached its usage limit' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check minimum purchase amount
    if (discount.min_purchase_amount && subtotal < discount.min_purchase_amount) {
      logger.logAuthFailure('discount_min_purchase_not_met', code);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Minimum purchase amount of R${discount.min_purchase_amount} required` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = (subtotal * discount.discount_value) / 100;
    } else {
      discountAmount = discount.discount_value;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    logger.logAuthSuccess(`discount_validated:${code}`);
    console.log('Discount validated:', code, 'Amount:', discountAmount);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        discount: {
          code: discount.code,
          description: discount.description,
          type: discount.discount_type,
          value: discount.discount_value,
          amount: discountAmount,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    console.error('Error validating discount:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Error validating discount code' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
