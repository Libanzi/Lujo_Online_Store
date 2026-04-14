import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock_quantity")
      .eq("is_active", true);

    if (productsError) throw productsError;

    // Calculate sales velocity for each product (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const suggestions = [];

    for (const product of products || []) {
      // Get order items for this product in the last 30 days
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          quantity,
          order:orders!inner(created_at, payment_status)
        `)
        .eq("product_id", product.id)
        .gte("order.created_at", thirtyDaysAgo.toISOString())
        .eq("order.payment_status", "completed");

      if (!orderItems || orderItems.length === 0) continue;

      // Calculate total quantity sold
      const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // Calculate daily sales velocity
      const salesVelocity = totalSold / 30;

      // Calculate days until stockout
      const daysUntilStockout = salesVelocity > 0
        ? Math.floor(product.stock_quantity / salesVelocity)
        : 999;

      // Only create suggestions for products that will run out soon
      if (daysUntilStockout <= 30 && salesVelocity > 0) {
        // Calculate suggested reorder quantity (30 days worth + buffer)
        const suggestedQuantity = Math.ceil(salesVelocity * 30 * 1.2);

        // Determine priority
        let priority = "low";
        if (daysUntilStockout <= 7) {
          priority = "high";
        } else if (daysUntilStockout <= 14) {
          priority = "medium";
        }

        suggestions.push({
          product_id: product.id,
          current_stock: product.stock_quantity,
          sales_velocity: salesVelocity,
          suggested_reorder_quantity: suggestedQuantity,
          days_until_stockout: daysUntilStockout,
          priority,
          status: "pending",
        });
      }
    }

    // Delete old pending suggestions
    await supabase
      .from("reorder_suggestions")
      .delete()
      .eq("status", "pending");

    // Insert new suggestions
    if (suggestions.length > 0) {
      const { error: insertError } = await supabase
        .from("reorder_suggestions")
        .insert(suggestions);

      if (insertError) throw insertError;
    }

    console.log(`Generated ${suggestions.length} reorder suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions_count: suggestions.length,
        suggestions,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating reorder suggestions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
