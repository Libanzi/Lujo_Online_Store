import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { status, token, orderAmount, merchantReference } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Map Payflex status to our order status
    const statusMap: Record<string, string> = {
      'APPROVED': 'payment_received',
      'DECLINED': 'payment_failed',
      'ABANDONED': 'cancelled',
      'EXPIRED': 'payment_failed',
    };

    const orderStatus = statusMap[status] || 'pending';

    // Update order by payment_reference (Payflex token)
    const { error } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_reference: token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', merchantReference);

    if (error) throw error;

    // If payment approved, send confirmation email
    if (status === 'APPROVED') {
      await supabase.functions.invoke('send-order-email', {
        body: { orderId: merchantReference, type: 'confirmation' }
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payflex webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
