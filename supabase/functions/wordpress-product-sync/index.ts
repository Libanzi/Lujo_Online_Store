import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { FunctionLogger } from "../_shared/function-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WordPressSyncSchema = z.object({
  wordpressUrl: z.string().url("Invalid WordPress URL"),
  syncMode: z.enum(['full', 'incremental']).default('incremental'),
  categoryMapping: z.record(z.string()).optional(),
  syncCategories: z.boolean().default(true),
});

interface WordPressProduct {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  product_meta: {
    price: string;
    original_price: string;
    stock: string;
    badge: string;
    is_active: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
    }>;
    "wp:term"?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

serve(async (req) => {
  const logger = new FunctionLogger('wordpress-product-sync');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if this is a cron job (no auth header) or manual trigger
    const authHeader = req.headers.get('Authorization');
    const isCronJob = !authHeader || authHeader.includes(Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    
    let userId: string | null = null;
    let triggeredBy: 'cron' | 'manual' | 'admin' = isCronJob ? 'cron' : 'manual';

    // If not a cron job, verify admin access
    if (!isCronJob && authHeader) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        await logger.logError(new Error('Invalid user'), { 
          metadata: { context: 'user_verification' }
        });
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!roleData) {
        await logger.logError(new Error('Not an admin'), { 
          user_id: user.id,
          metadata: { context: 'admin_check' }
        });
        return new Response(
          JSON.stringify({ success: false, error: 'Admin access required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      userId = user.id;
      triggeredBy = 'admin';
    }

    // Get sync configuration
    let wordpressUrl: string = '';
    let syncMode: 'full' | 'incremental' = 'incremental';
    let syncCategories: boolean = true;

    // Try to parse request body
    let hasRequestBody = false;
    try {
      const body = await req.json();
      if (body && body.wordpressUrl) {
        const validation = WordPressSyncSchema.safeParse(body);
        if (validation.success) {
          wordpressUrl = validation.data.wordpressUrl;
          syncMode = validation.data.syncMode;
          syncCategories = validation.data.syncCategories;
          hasRequestBody = true;
        }
      }
    } catch {
      // No body or invalid JSON, will use settings
    }

    // If no body, fetch from settings table (for cron jobs)
    if (!hasRequestBody) {
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('wordpress_settings')
        .select('*')
        .single();

      if (settingsError || !settings || !settings.auto_sync_enabled) {
        return new Response(
          JSON.stringify({ success: false, error: 'No WordPress settings configured or auto-sync disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      wordpressUrl = settings.wordpress_url;
      syncMode = settings.sync_mode as 'full' | 'incremental';
      syncCategories = settings.sync_categories;
    }

    // Create sync history entry
    const { data: syncHistoryEntry, error: historyError } = await supabaseAdmin
      .from('wordpress_sync_history')
      .insert({
        wordpress_url: wordpressUrl,
        sync_mode: syncMode,
        triggered_by: triggeredBy,
        user_id: userId,
        status: 'running'
      })
      .select()
      .single();

    if (historyError || !syncHistoryEntry) {
      console.error('Failed to create sync history:', historyError);
    }

    const syncHistoryId = syncHistoryEntry?.id;

    const syncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      categoriesCreated: 0,
      categoriesUpdated: 0,
      errors: [] as string[],
    };

    // Sync categories first if enabled
    if (syncCategories) {
      try {
        const categoriesResponse = await fetch(
          `${wordpressUrl}/wp-json/wp/v2/lujo_product_category?per_page=100`
        );

        if (categoriesResponse.ok) {
          const wpCategories = await categoriesResponse.json();
          
          for (const wpCategory of wpCategories) {
            try {
              const { data: existingCategory } = await supabaseAdmin
                .from('categories')
                .select('id, slug')
                .eq('slug', wpCategory.slug)
                .single();

              const categoryData = {
                name: wpCategory.name,
                slug: wpCategory.slug,
                description: wpCategory.description || null,
              };

              if (existingCategory) {
                const { error } = await supabaseAdmin
                  .from('categories')
                  .update(categoryData)
                  .eq('id', existingCategory.id);

                if (error) {
                  syncResults.errors.push(`Failed to update category ${wpCategory.slug}: ${error.message}`);
                } else {
                  syncResults.categoriesUpdated++;
                }
              } else {
                const { error } = await supabaseAdmin
                  .from('categories')
                  .insert(categoryData);

                if (error) {
                  syncResults.errors.push(`Failed to create category ${wpCategory.slug}: ${error.message}`);
                } else {
                  syncResults.categoriesCreated++;
                }
              }
            } catch (error: any) {
              syncResults.errors.push(`Error processing category ${wpCategory.slug}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        syncResults.errors.push(`Failed to fetch WordPress categories: ${error.message}`);
      }
    }

    // Fetch WordPress products
    const wpResponse = await fetch(
      `${wordpressUrl}/wp-json/wp/v2/lujo-products?per_page=100&_embed`
    );

    if (!wpResponse.ok) {
      await logger.logError(new Error('Failed to fetch WordPress products'), { 
        response_status: wpResponse.status,
        metadata: { url: wordpressUrl }
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch WordPress products' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const wpProducts: WordPressProduct[] = await wpResponse.json();
    
    // Filter active products only
    const activeProducts = wpProducts.filter(
      p => p.product_meta?.is_active === '1'
    );

    console.log('Fetched WordPress products:', { 
      total: wpProducts.length,
      active: activeProducts.length 
    });

    // Sync each product
    for (const wpProduct of activeProducts) {
      try {
        // Check if product exists
        const { data: existing } = await supabaseAdmin
          .from('products')
          .select('id, slug')
          .eq('slug', wpProduct.slug)
          .single();

        const productData = {
          name: wpProduct.title.rendered.replace(/<[^>]*>/g, ''),
          slug: wpProduct.slug,
          description: wpProduct.content.rendered,
          price: parseFloat(wpProduct.product_meta.price) || 0,
          original_price: wpProduct.product_meta.original_price 
            ? parseFloat(wpProduct.product_meta.original_price) 
            : null,
          stock_quantity: parseInt(wpProduct.product_meta.stock) || 0,
          badge: wpProduct.product_meta.badge || null,
          image_url: wpProduct._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
          is_active: true,
          category_id: null, // Will be set if category mapping exists
        };

        // Map WordPress category to Supabase category if provided
        if (wpProduct._embedded?.["wp:term"]?.[0]?.[0]?.slug) {
          const wpCategorySlug = wpProduct._embedded["wp:term"][0][0].slug;
          
          // Try to find matching category in Supabase
          const { data: category } = await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('slug', wpCategorySlug)
            .single();
          
          if (category) {
            productData.category_id = category.id;
          }
        }

        if (existing) {
          // Update existing product
          if (syncMode === 'full') {
            const { error } = await supabaseAdmin
              .from('products')
              .update(productData)
              .eq('id', existing.id);

            if (error) {
              syncResults.errors.push(`Failed to update ${wpProduct.slug}: ${error.message}`);
            } else {
              syncResults.updated++;
            }
          } else {
            syncResults.skipped++;
          }
        } else {
          // Create new product
          const { error } = await supabaseAdmin
            .from('products')
            .insert(productData);

          if (error) {
            syncResults.errors.push(`Failed to create ${wpProduct.slug}: ${error.message}`);
          } else {
            syncResults.created++;
          }
        }
      } catch (error: any) {
        syncResults.errors.push(`Error processing ${wpProduct.slug}: ${error.message}`);
      }
    }

    // Update sync history with results
    if (syncHistoryId) {
      await supabaseAdmin
        .from('wordpress_sync_history')
        .update({
          sync_completed_at: new Date().toISOString(),
          status: syncResults.errors.length > 0 ? 'partial' : 'success',
          products_created: syncResults.created,
          products_updated: syncResults.updated,
          products_skipped: syncResults.skipped,
          categories_created: syncResults.categoriesCreated,
          categories_updated: syncResults.categoriesUpdated,
          errors: syncResults.errors
        })
        .eq('id', syncHistoryId);
    }

    await logger.logSuccess({
      metadata: syncResults
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: syncResults,
        message: `Sync completed: ${syncResults.created} products created, ${syncResults.updated} updated, ${syncResults.skipped} skipped. Categories: ${syncResults.categoriesCreated} created, ${syncResults.categoriesUpdated} updated`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    // Update sync history as failed if we have the ID
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Try to get the sync history ID from earlier in the flow
      // This is a best-effort attempt to mark the sync as failed
      const { data: lastSync } = await supabaseAdmin
        .from('wordpress_sync_history')
        .select('id')
        .eq('status', 'running')
        .order('sync_started_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSync) {
        await supabaseAdmin
          .from('wordpress_sync_history')
          .update({
            sync_completed_at: new Date().toISOString(),
            status: 'failed',
            errors: [error.message]
          })
          .eq('id', lastSync.id);
      }
    } catch {
      // Ignore errors in error handler
    }

    await logger.logError(error, { 
      metadata: { context: 'main_handler' }
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
