import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Get low stock products (threshold: 10 or less)
    const { data: lowStockProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock_quantity")
      .lte("stock_quantity", 10)
      .eq("is_active", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw productsError;
    }

    if (!lowStockProducts || lowStockProducts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No low stock products found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!inner(email, full_name)
      `)
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      throw adminError;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("No admin users found to notify");
      return new Response(
        JSON.stringify({ message: "No admin users to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email HTML
    const productsList = lowStockProducts
      .map(
        (p) => `<li><strong>${p.name}</strong> - Only ${p.stock_quantity} units left</li>`
      )
      .join("");

    const emailHtml = `
      <h2>Low Stock Alert</h2>
      <p>The following products are running low on stock and need attention:</p>
      <ul>
        ${productsList}
      </ul>
      <p>Please review and restock these items to avoid running out.</p>
      <p>View and manage inventory in your admin dashboard.</p>
    `;

    // Send emails to all admins
    const emailPromises = adminUsers.map((admin: any) =>
      resend.emails.send({
        from: "Store Alerts <onboarding@resend.dev>",
        to: [admin.profiles.email],
        subject: `Low Stock Alert - ${lowStockProducts.length} Products Need Attention`,
        html: emailHtml,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Sent ${successCount} notifications, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        lowStockCount: lowStockProducts.length,
        notificationsSent: successCount,
        notificationsFailed: failureCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-low-stock function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
