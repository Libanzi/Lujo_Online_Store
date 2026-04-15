import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { supplierId } = await req.json();

    if (!supplierId) {
      return new Response(JSON.stringify({ error: "supplierId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch orders containing products from this supplier
    const { data: orderItems, error } = await supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        price,
        order:orders (
          id,
          order_number,
          created_at,
          status,
          shipping_address,
          total_amount,
          payment_method
        ),
        product:products (
          id,
          name,
          slug,
          supplier_sku,
          supplier_id,
          cost_price
        )
      `)
      .in("order.status", ["pending", "processing", "payment_received"])
      .eq("product.supplier_id", supplierId);

    if (error) throw error;

    // Filter out nulls (items where product belongs to a different supplier)
    const validItems = (orderItems || []).filter(
      (item: any) => item.product?.supplier_id === supplierId && item.order
    );

    if (validItems.length === 0) {
      return new Response(JSON.stringify({ csv: "", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build CSV
    const headers = [
      "Order Number",
      "Order Date",
      "Order Status",
      "Product Name",
      "Supplier SKU",
      "Quantity",
      "Unit Price (R)",
      "Line Total (R)",
      "Shipping Address",
      "Payment Method",
    ];

    const rows = validItems.map((item: any) => [
      item.order.order_number,
      new Date(item.order.created_at).toISOString().split("T")[0],
      item.order.status,
      item.product.name,
      item.product.supplier_sku || "",
      item.quantity,
      Number(item.price).toFixed(2),
      (Number(item.price) * Number(item.quantity)).toFixed(2),
      `"${(item.order.shipping_address || "").replace(/"/g, '""')}"`,
      item.order.payment_method || "cod",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    return new Response(
      JSON.stringify({
        csv: csvContent,
        count: validItems.length,
        filename: `lujo-orders-supplier-${supplierId.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.csv`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Export orders error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
