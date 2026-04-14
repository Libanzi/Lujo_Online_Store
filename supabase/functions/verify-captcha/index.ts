import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SecurityLogger } from "../_shared/security-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const VerifyCaptchaSchema = z.object({
  token: z.string()
    .min(1, "Captcha token is required")
    .max(2000, "Token too long"),
});

serve(async (req) => {
  const logger = new SecurityLogger('verify-captcha', req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.logRequest(req.method);

    const body = await req.json();
    
    // Validate input
    const validation = VerifyCaptchaSchema.safeParse(body);
    if (!validation.success) {
      logger.logValidationFailure(validation.error.errors, body);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid captcha token',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    logger.logValidationSuccess(validation.data);

    const { token } = validation.data;
    const secretKey = Deno.env.get('HCAPTCHA_SECRET_KEY');

    if (!secretKey) {
      logger.logError('hCaptcha secret key not configured');
      throw new Error('Captcha verification not configured');
    }

    // Verify with hCaptcha
    const verifyResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.success) {
      logger.logAuthSuccess('captcha_verified');
      console.log('Captcha verified successfully');
    } else {
      logger.logAuthFailure('captcha_verification_failed', verifyData['error-codes']?.join(', '));
      console.log('Captcha verification failed:', verifyData['error-codes']);
    }

    return new Response(
      JSON.stringify({
        success: verifyData.success,
        challenge_ts: verifyData.challenge_ts,
        hostname: verifyData.hostname,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: verifyData.success ? 200 : 400,
      }
    );

  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    console.error('Error verifying captcha:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error verifying captcha',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
