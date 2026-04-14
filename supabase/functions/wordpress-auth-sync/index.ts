import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SecurityLogger, checkRateLimit } from "../_shared/security-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const WordPressAuthSchema = z.object({
  wordpressToken: z.string()
    .min(1, "WordPress token is required")
    .max(2000, "Token too long"),
  wordpressUrl: z.string()
    .url("Invalid WordPress URL")
    .min(1, "WordPress URL is required")
    .max(500, "URL too long")
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      "URL must start with http:// or https://"
    ),
});

interface WordPressUser {
  id: number;
  email: string;
  name: string;
  username: string;
}

serve(async (req) => {
  const logger = new SecurityLogger('wordpress-auth-sync', req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.logRequest(req.method);

    // Rate limiting: 10 requests per 5 minutes per IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`wp-auth:${clientIp}`, 10, 5 * 60 * 1000)) {
      logger.logSuspiciousActivity('rate_limit_exceeded', {
        identifier: clientIp,
        limit: '10 requests per 5 minutes',
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    const body = await req.json();
    
    // Check for suspicious patterns
    const suspiciousCheck = logger.detectSuspiciousPatterns(JSON.stringify(body));
    if (suspiciousCheck.isSuspicious) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Validate input with Zod
    const validation = WordPressAuthSchema.safeParse(body);
    if (!validation.success) {
      logger.logValidationFailure(validation.error.errors, body);
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid input',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    logger.logValidationSuccess(validation.data);

    const { wordpressToken, wordpressUrl } = validation.data;

    // Verify WordPress JWT token and get user info
    const wpResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${wordpressToken}`,
      },
    });

    if (!wpResponse.ok) {
      logger.logAuthFailure('invalid_wordpress_token');
      throw new Error('Invalid WordPress token');
    }

    const wpUser: WordPressUser = await wpResponse.json();

    // Validate WordPress user response
    if (!wpUser.email || !wpUser.id) {
      logger.logAuthFailure('invalid_wordpress_user_data');
      throw new Error('Invalid WordPress user data');
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user exists in Supabase
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      logger.logError(listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email === wpUser.email);

    let supabaseUser;
    
    if (existingUser) {
      supabaseUser = existingUser;
      logger.logAuthSuccess(supabaseUser.id);
      console.log('Existing Supabase user found:', supabaseUser.id);
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: wpUser.email,
        email_confirm: true,
        user_metadata: {
          full_name: wpUser.name,
          wordpress_id: wpUser.id,
          wordpress_username: wpUser.username,
        }
      });

      if (createError) {
        logger.logError(createError);
        throw createError;
      }

      supabaseUser = newUser.user;
      logger.logAuthSuccess(supabaseUser.id);
      console.log('New Supabase user created:', supabaseUser.id);
    }

    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: wpUser.email,
    });

    if (sessionError) {
      logger.logError(sessionError);
      throw sessionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          user_metadata: supabaseUser.user_metadata,
        },
        authUrl: sessionData.properties.action_link,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)));
    console.error('Error in wordpress-auth-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
