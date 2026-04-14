import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { orderId, amount, customerEmail, customerName, returnUrl, cancelUrl } = await req.json();

    // Validate inputs
    if (!orderId || !amount || !customerEmail || amount < 100) {
      return new Response(JSON.stringify({ error: 'Invalid payment parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Payflex minimum order is R100, max R24,000
    if (amount > 24000) {
      return new Response(JSON.stringify({ error: 'Amount exceeds Payflex maximum of R24,000' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const PAYFLEX_API_KEY = Deno.env.get('PAYFLEX_API_KEY') ?? '';
    const PAYFLEX_API_SECRET = Deno.env.get('PAYFLEX_API_SECRET') ?? '';
    const PAYFLEX_BASE_URL = Deno.env.get('PAYFLEX_SANDBOX') === 'true'
      ? 'https://api.payflex.co.za/sandbox'
      : 'https://api.payflex.co.za';

    // Step 1: Get Payflex OAuth token
    const tokenResponse = await fetch(`${PAYFLEX_BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: PAYFLEX_API_KEY,
        client_secret: PAYFLEX_API_SECRET,
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Payflex authentication failed');
    }

    const { access_token } = await tokenResponse.json();

    // Step 2: Create Payflex order
    const [firstName, ...lastNameParts] = (customerName || 'Customer').split(' ');
    const amountInCents = Math.round(amount * 100);

    const payflexPayload = {
      consumer: {
        phoneNumber: '',
        givenNames: firstName,
        surname: lastNameParts.join(' ') || firstName,
        email: customerEmail,
      },
      billing: {
        name: customerName,
        line1: 'South Africa',
        suburb: '',
        state: '',
        postcode: '0000',
        countryCode: 'ZA',
        phoneNumber: '',
      },
      shipping: {
        name: customerName,
        line1: 'South Africa',
        suburb: '',
        state: '',
        postcode: '0000',
        countryCode: 'ZA',
        phoneNumber: '',
      },
      items: [{
        name: `Lujo Order #${orderId.slice(0, 8).toUpperCase()}`,
        sku: orderId,
        quantity: 1,
        price: { amount: amountInCents, currency: 'ZAR' },
      }],
      merchant: {
        redirectConfirmUrl: returnUrl,
        redirectCancelUrl: cancelUrl,
      },
      taxAmount: { amount: 0, currency: 'ZAR' },
      shippingAmount: { amount: 0, currency: 'ZAR' },
      orderAmount: { amount: amountInCents, currency: 'ZAR' },
      orderDetail: {
        merchantReference: orderId,
      },
    };

    const orderResponse = await fetch(`${PAYFLEX_BASE_URL}/v2/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify(payflexPayload),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Payflex order creation error:', errorText);
      throw new Error('Failed to create Payflex order');
    }

    const payflexOrder = await orderResponse.json();

    // Update order in Supabase with Payflex token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await supabase
      .from('orders')
      .update({
        payment_method: 'payflex',
        payment_reference: payflexOrder.token,
        status: 'payment_pending',
      })
      .eq('id', orderId);

    return new Response(JSON.stringify({
      redirectUrl: payflexOrder.redirectCheckoutUrl,
      token: payflexOrder.token,
      instalments: {
        total: amount,
        each: (amount / 4).toFixed(2),
        count: 4,
        currency: 'ZAR',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payflex payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
