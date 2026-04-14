import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const ProcessLoyaltySchema = z.object({
  userId: z.string().uuid({ message: "userId must be a valid UUID" }),
  orderId: z.string().uuid({ message: "orderId must be a valid UUID" }),
  orderAmount: z.number()
    .positive({ message: "orderAmount must be positive" })
    .finite({ message: "orderAmount must be a finite number" })
    .max(1000000, { message: "orderAmount exceeds maximum allowed" }),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input
    const body = await req.json();
    const validationResult = ProcessLoyaltySchema.safeParse(body);
    
    if (!validationResult.success) {
      console.warn("Invalid loyalty points input:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format",
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, orderId, orderAmount } = validationResult.data;
    console.log(`Processing loyalty points for user ${userId}, order ${orderId}, amount R${orderAmount}`);

    // Get or create user's loyalty points record
    let { data: loyaltyPoints, error: fetchError } = await supabase
      .from("loyalty_points")
      .select(`
        *,
        tier:loyalty_tiers(*)
      `)
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If no loyalty record exists, create one with Bronze tier
    if (!loyaltyPoints) {
      const { data: bronzeTier } = await supabase
        .from("loyalty_tiers")
        .select("id")
        .eq("name", "Bronze")
        .single();

      const { data: newLoyalty, error: createError } = await supabase
        .from("loyalty_points")
        .insert({
          user_id: userId,
          current_points: 0,
          lifetime_points: 0,
          tier_id: bronzeTier?.id,
        })
        .select(`
          *,
          tier:loyalty_tiers(*)
        `)
        .single();

      if (createError) throw createError;
      loyaltyPoints = newLoyalty;
    }

    // Calculate points based on tier
    // Base: 1 point per R10
    // Silver: 1.5 points per R10
    // Gold: 2 points per R10
    // Platinum: 3 points per R10
    const tierName = loyaltyPoints.tier.name.toLowerCase();
    let pointsMultiplier = 1;
    
    switch (tierName) {
      case 'silver': pointsMultiplier = 1.5; break;
      case 'gold': pointsMultiplier = 2; break;
      case 'platinum': pointsMultiplier = 3; break;
    }

    const pointsEarned = Math.floor((orderAmount / 10) * pointsMultiplier);

    // Update loyalty points
    const newCurrentPoints = loyaltyPoints.current_points + pointsEarned;
    const newLifetimePoints = loyaltyPoints.lifetime_points + pointsEarned;

    // Check if user should be upgraded to a new tier
    const { data: allTiers } = await supabase
      .from("loyalty_tiers")
      .select("*")
      .order("min_points", { ascending: false });

    const newTier = allTiers?.find(tier => newLifetimePoints >= tier.min_points);

    const { error: updateError } = await supabase
      .from("loyalty_points")
      .update({
        current_points: newCurrentPoints,
        lifetime_points: newLifetimePoints,
        tier_id: newTier?.id || loyaltyPoints.tier_id,
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from("loyalty_transactions")
      .insert({
        user_id: userId,
        points: pointsEarned,
        transaction_type: "earned",
        order_id: orderId,
        description: `Earned ${pointsEarned} points from order`,
      });

    if (transactionError) throw transactionError;

    console.log(`Processed loyalty points for user ${userId}: ${pointsEarned} points earned`);

    return new Response(
      JSON.stringify({
        success: true,
        points_earned: pointsEarned,
        new_total: newCurrentPoints,
        tier: newTier?.name || loyaltyPoints.tier.name,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing loyalty points:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
