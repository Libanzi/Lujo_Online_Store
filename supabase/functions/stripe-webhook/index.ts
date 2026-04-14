import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No stripe signature found');
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;
    
    if (webhookSecret) {
      // Verify webhook signature
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
    }

    console.log(`Processing webhook event: ${event.type}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        
        if (!orderId) {
          console.error('No order_id in session metadata');
          break;
        }

        console.log(`Checkout completed for order: ${orderId}`);

        // Update order payment status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            status: 'processing',
            payment_reference: session.payment_intent as string,
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order:', updateError);
        } else {
          console.log('Order updated successfully');
          
          // Send email notification
          const { error: emailError } = await supabase.functions.invoke('send-order-email', {
            body: { orderId, type: 'status_update' }
          });
          
          if (emailError) {
            console.error('Error sending email:', emailError);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find order by payment reference
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_reference', paymentIntent.id)
          .maybeSingle();

        if (orders) {
          await supabase
            .from('orders')
            .update({ payment_status: 'completed' })
            .eq('id', orders.id);
          
          console.log(`Payment succeeded for order: ${orders.id}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find order by payment reference
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_reference', paymentIntent.id)
          .maybeSingle();

        if (orders) {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', orders.id);
          
          console.log(`Payment failed for order: ${orders.id}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Find order by payment reference
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_reference', charge.payment_intent as string)
          .maybeSingle();

        if (orders) {
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'refunded',
              status: 'cancelled'
            })
            .eq('id', orders.id);
          
          console.log(`Charge refunded for order: ${orders.id}`);
          
          // Send email notification
          const { error: emailError } = await supabase.functions.invoke('send-order-email', {
            body: { orderId: orders.id, type: 'status_update' }
          });
          
          if (emailError) {
            console.error('Error sending email:', emailError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
