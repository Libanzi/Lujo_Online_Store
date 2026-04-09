# LUJO LIFESTYLE HUB — CLAUDE CODE MASTER EXECUTION BLUEPRINT
**Version:** 2.0 | **Stack:** React + Vite + TypeScript + Supabase + Tailwind CSS  
**Target:** World-class SA luxury e-commerce with Payflex BNPL integration

---

## CONTEXT HANDOFF FOR CLAUDE CODE

You are taking over a partially built luxury e-commerce store called **Lujo Lifestyle Hub**. The codebase is React 18 + Vite + TypeScript + Supabase + Tailwind CSS + shadcn/ui. It already has: product listings, cart, basic checkout (PayFast + COD), admin panel, loyalty points, discounts, blog, and hCaptcha.

**Your mission:** Elevate this into a best-in-class South African luxury online store by implementing the following improvements in sequence. Every change must be production-ready, type-safe, and non-breaking.

---

## PHASE 1 — PAYFLEX BNPL INTEGRATION (PRIORITY 1)

### 1.1 What is Payflex?
Payflex is South Africa's leading Buy Now Pay Later (BNPL) provider. Customers pay in 4 zero-interest instalments over 6 weeks. Payflex handles underwriting — the merchant receives full payment upfront. Integration is via redirect (similar to PayFast).

### 1.2 New Supabase Edge Function: `process-payflex-payment`

Create file: `supabase/functions/process-payflex-payment/index.ts`

```typescript
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
    const instalment = Math.round(amountInCents / 4);

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
```

### 1.3 New Supabase Edge Function: `payflex-webhook`

Create file: `supabase/functions/payflex-webhook/index.ts`

```typescript
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
```

### 1.4 Database Migration for Payflex

Create file: `supabase/migrations/[timestamp]_add_payflex_fields.sql`

```sql
-- Add payment_reference and payment_method columns if not exists
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Update status enum to include payflex states
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'payment_pending', 'payment_received', 'payment_failed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));
```

### 1.5 Checkout Page — Add Payflex Payment Option

In `src/pages/Checkout.tsx`, add Payflex as a payment method alongside PayFast and COD:

**FIND** the `paymentMethod` RadioGroup section and **REPLACE** with:

```tsx
// Add this import at top
import { CreditCard, Truck, Layers } from "lucide-react";

// Add this state
const [payflex, setPayflex] = useState({ eligible: false, instalmentAmount: 0 });

// Add this effect after loadCart
useEffect(() => {
  const total = calculateTotal();
  setPayflex({
    eligible: total >= 100 && total <= 24000,
    instalmentAmount: total / 4,
  });
}, [cartItems, appliedDiscount]);

// Add this handler
const handlePayflexPayment = async (orderId: string, total: number) => {
  const user = (await supabase.auth.getUser()).data.user;
  const { data, error } = await supabase.functions.invoke('process-payflex-payment', {
    body: {
      orderId,
      amount: total,
      customerEmail: user?.email,
      customerName: user?.user_metadata?.full_name || user?.email,
      returnUrl: `${window.location.origin}/orders?payflex=success`,
      cancelUrl: `${window.location.origin}/checkout?payflex=cancelled`,
    },
  });
  if (error || !data?.redirectUrl) throw new Error('Payflex payment initiation failed');
  window.location.href = data.redirectUrl;
};
```

**Payment method radio group replacement:**

```tsx
<RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
  
  {/* Cash on Delivery */}
  <div className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
    paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
  }`}>
    <RadioGroupItem value="cod" id="cod" />
    <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
      <Truck className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="font-semibold">Cash on Delivery</p>
        <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
      </div>
    </Label>
  </div>

  {/* PayFast */}
  <div className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
    paymentMethod === 'payfast' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
  }`}>
    <RadioGroupItem value="payfast" id="payfast" />
    <Label htmlFor="payfast" className="flex items-center gap-3 cursor-pointer flex-1">
      <CreditCard className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="font-semibold">PayFast</p>
        <p className="text-sm text-muted-foreground">Credit/debit card, EFT, SnapScan, Zapper</p>
      </div>
    </Label>
  </div>

  {/* Payflex BNPL */}
  <div className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
    !payflex.eligible ? 'opacity-50 cursor-not-allowed' : ''
  } ${paymentMethod === 'payflex' ? 'border-[#00B8D9] bg-[#00B8D9]/5' : 'border-border hover:border-[#00B8D9]/50'}`}>
    <RadioGroupItem value="payflex" id="payflex" disabled={!payflex.eligible} />
    <Label htmlFor="payflex" className={`flex items-center gap-3 flex-1 ${payflex.eligible ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
      <Layers className="h-5 w-5 text-[#00B8D9]" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">Payflex</p>
          <span className="text-xs bg-[#00B8D9] text-white px-2 py-0.5 rounded-full font-medium">Buy Now, Pay Later</span>
        </div>
        {payflex.eligible ? (
          <p className="text-sm text-muted-foreground">
            4 x <strong className="text-foreground">R{payflex.instalmentAmount.toFixed(2)}</strong> — zero interest, zero fees
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Available for orders R100 – R24,000
          </p>
        )}
      </div>
      {payflex.eligible && (
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">First payment today</p>
          <p className="font-bold text-[#00B8D9]">R{payflex.instalmentAmount.toFixed(2)}</p>
        </div>
      )}
    </Label>
  </div>
</RadioGroup>

{/* Payflex instalment breakdown — shown when selected */}
{paymentMethod === 'payflex' && payflex.eligible && (
  <div className="mt-3 rounded-xl bg-[#00B8D9]/10 border border-[#00B8D9]/20 p-4">
    <p className="text-sm font-semibold text-[#00B8D9] mb-2">Payflex Payment Schedule</p>
    <div className="grid grid-cols-4 gap-2 text-center">
      {[0, 2, 4, 6].map((weeks, i) => (
        <div key={i} className="bg-white dark:bg-background rounded-lg p-2 border border-[#00B8D9]/20">
          <p className="text-xs text-muted-foreground">{i === 0 ? 'Today' : `Week ${weeks}`}</p>
          <p className="font-bold text-sm">R{payflex.instalmentAmount.toFixed(2)}</p>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground mt-2 text-center">
      ✓ No interest · ✓ No fees · ✓ Subject to Payflex approval
    </p>
  </div>
)}
```

**In `handleCheckout`, add Payflex case to the payment processing block:**

```tsx
} else if (paymentMethod === 'payflex') {
  await handlePayflexPayment(order.id, totalAmount);
  return; // redirect handled inside
```

---

## PHASE 2 — UI/UX ELEVATION (LUXURY AESTHETIC OVERHAUL)

### 2.1 CSS Variables — Luxury Palette

In `src/index.css`, update the `:root` and `.dark` blocks:

```css
:root {
  /* Lujo Luxury — Ivory & Deep Noir */
  --background: 40 20% 98%;
  --foreground: 0 0% 8%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 8%;
  --primary: 35 85% 45%;        /* Rich amber-gold */
  --primary-foreground: 0 0% 100%;
  --secondary: 40 15% 92%;
  --secondary-foreground: 0 0% 15%;
  --muted: 40 15% 94%;
  --muted-foreground: 0 0% 45%;
  --accent: 35 85% 45%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 40 20% 88%;
  --input: 40 20% 88%;
  --ring: 35 85% 45%;
  --radius: 0.75rem;
  --luxury-gold: 35 85% 45%;
  --luxury-cream: 40 30% 96%;
  --luxury-charcoal: 0 0% 12%;
}

.dark {
  --background: 0 0% 6%;
  --foreground: 40 20% 95%;
  --card: 0 0% 9%;
  --card-foreground: 40 20% 95%;
  --primary: 35 80% 55%;
  --primary-foreground: 0 0% 6%;
  --secondary: 0 0% 14%;
  --secondary-foreground: 40 20% 85%;
  --muted: 0 0% 14%;
  --muted-foreground: 0 0% 55%;
  --border: 0 0% 18%;
  --input: 0 0% 18%;
}

/* Luxury typography */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

body {
  font-family: 'Jost', sans-serif;
  letter-spacing: 0.01em;
}

h1, h2, h3, .font-serif {
  font-family: 'Cormorant Garamond', serif;
}

/* Luxury scroll */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }

/* Gold shimmer animation */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.gold-shimmer {
  background: linear-gradient(90deg, hsl(35,85%,45%) 0%, hsl(45,95%,65%) 50%, hsl(35,85%,45%) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}
```

### 2.2 Navigation Enhancement

In `src/components/Navigation.tsx`, add:
- Sticky on scroll with backdrop blur
- Trust badges row (free shipping, returns, secure payment, Payflex badge)
- Category mega-menu on hover

Add above the existing `<nav>`:
```tsx
{/* Trust Bar */}
<div className="bg-foreground text-background text-xs py-2">
  <div className="container mx-auto flex justify-center gap-8 items-center">
    <span>🚚 Free shipping over R850</span>
    <span className="hidden sm:inline">↩ 30-day returns</span>
    <span className="hidden md:inline">🔒 Secure checkout</span>
    <span className="hidden md:inline flex items-center gap-1">
      <span className="text-[#00B8D9] font-semibold">Payflex</span> — pay in 4
    </span>
  </div>
</div>
```

### 2.3 Product Card — Luxury Redesign

Replace `src/components/FeaturedProducts.tsx` product card markup to include:
- Quick-add to cart on hover overlay
- Payflex instalment price display
- Wishlist heart icon
- "Low stock" urgency badge
- Image zoom on hover

**Core card pattern:**
```tsx
<div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
  {/* Image container */}
  <div className="relative overflow-hidden aspect-[3/4]">
    <img 
      src={product.image_url} 
      alt={product.name}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    />
    {/* Quick add overlay */}
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
      <Button 
        className="w-full bg-white text-black hover:bg-primary hover:text-white transition-colors font-medium"
        onClick={() => handleAddToCart(product.id)}
      >
        Quick Add
      </Button>
    </div>
    {/* Badges */}
    {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
      <span className="absolute top-3 left-3 bg-destructive text-white text-xs px-2 py-1 rounded-full">
        Only {product.stock_quantity} left
      </span>
    )}
    {/* Wishlist */}
    <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
      <Heart className="h-4 w-4" />
    </button>
  </div>

  {/* Product info */}
  <div className="p-4">
    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{product.category}</p>
    <h3 className="font-serif text-lg font-medium mb-2 line-clamp-1">{product.name}</h3>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold">R{product.price.toFixed(2)}</p>
        {product.price >= 100 && product.price <= 24000 && (
          <p className="text-xs text-[#00B8D9]">
            or 4 × R{(product.price / 4).toFixed(2)} with <strong>Payflex</strong>
          </p>
        )}
      </div>
    </div>
  </div>
</div>
```

### 2.4 Hero Section Overhaul

In `src/components/Hero.tsx` — Replace with a full-screen editorial hero:

```tsx
// Full-screen split layout with animated text reveal
<section className="relative min-h-screen flex items-center overflow-hidden">
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
  
  {/* Decorative gold line */}
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary to-transparent" />

  <div className="container mx-auto px-4 py-24 grid lg:grid-cols-2 gap-12 items-center relative z-10">
    {/* Left: Copy */}
    <div className="space-y-8">
      <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium animate-fade-in">
        South Africa's Luxury Destination
      </p>
      <h1 className="font-serif text-6xl md:text-8xl font-light leading-[1.05] animate-slide-up">
        Live<br />
        <em className="gold-shimmer not-italic">Differently</em>
      </h1>
      <p className="text-muted-foreground text-lg max-w-md leading-relaxed animate-fade-in">
        Curated luxury for those who know. Beauty, fashion, tech, and home — delivered to your door.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
        <Button size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-none px-10 h-14 text-sm tracking-widest uppercase">
          Explore Collection
        </Button>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="text-[#00B8D9] font-semibold">Payflex available</span>
          <span>— pay in 4 instalments</span>
        </div>
      </div>
    </div>

    {/* Right: Hero image */}
    <div className="relative hidden lg:block">
      <div className="aspect-[4/5] rounded-2xl overflow-hidden">
        <img src="/hero-main.jpg" alt="Lujo Lifestyle" className="w-full h-full object-cover" />
      </div>
      {/* Floating stat card */}
      <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-xl">
        <p className="text-2xl font-serif font-semibold">2,400+</p>
        <p className="text-xs text-muted-foreground">Happy customers</p>
      </div>
    </div>
  </div>
</section>
```

---

## PHASE 3 — PERFORMANCE & CONVERSION OPTIMISATION

### 3.1 Product Page — Payflex Widget

In `src/pages/ProductDetail.tsx`, add below the price:

```tsx
{/* Payflex widget */}
{product.price >= 100 && product.price <= 24000 && (
  <div className="rounded-xl border border-[#00B8D9]/30 bg-[#00B8D9]/5 p-4 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">
        Pay with <span className="text-[#00B8D9] font-bold">Payflex</span>
      </p>
      <p className="text-xs text-muted-foreground">
        4 × R{(product.price / 4).toFixed(2)} — zero interest, zero fees
      </p>
    </div>
    <div className="grid grid-cols-4 gap-1">
      {[1,2,3,4].map(i => (
        <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          i === 1 ? 'bg-[#00B8D9] text-white' : 'bg-[#00B8D9]/20 text-[#00B8D9]'
        }`}>{i}</div>
      ))}
    </div>
  </div>
)}
```

### 3.2 Cart Page — Payflex Summary

In `src/pages/Cart.tsx`, add to the order summary:

```tsx
{total >= 100 && total <= 24000 && (
  <div className="mt-4 rounded-xl bg-[#00B8D9]/10 border border-[#00B8D9]/20 p-3 text-sm">
    <p className="font-medium text-[#00B8D9]">💳 Payflex eligible</p>
    <p className="text-muted-foreground text-xs mt-1">
      Split into 4 payments of <strong>R{(total / 4).toFixed(2)}</strong> — zero interest
    </p>
  </div>
)}
```

### 3.3 Search — Algolia-Ready Structure

In `src/pages/Search.tsx`, add filter sidebar:
- Price range slider
- Category filters  
- Rating filter
- Sort by: Relevance, Price (asc/desc), Newest, Best selling

### 3.4 New Page: `/payflex-info`

Create `src/pages/PayflexInfo.tsx`:

```tsx
export default function PayflexInfo() {
  return (
    <div className="container mx-auto py-16 max-w-2xl">
      <h1 className="font-serif text-4xl mb-4">Shop Now, Pay Later with Payflex</h1>
      <p className="text-muted-foreground mb-8">
        Lujo Lifestyle Hub has partnered with Payflex to give you flexible payment options on every purchase.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {['Choose Payflex at checkout', 'Get instant approval', 'Pay 25% today', 'Pay the rest over 6 weeks'].map((step, i) => (
          <div key={i} className="text-center p-4 rounded-xl bg-muted">
            <div className="w-10 h-10 rounded-full bg-[#00B8D9] text-white font-bold text-lg flex items-center justify-center mx-auto mb-2">
              {i + 1}
            </div>
            <p className="text-sm">{step}</p>
          </div>
        ))}
      </div>

      <h2 className="font-serif text-2xl mb-4">Frequently Asked Questions</h2>
      {/* FAQ accordion */}
    </div>
  );
}
```

Add route in `src/App.tsx`: `<Route path="/payflex" element={<PayflexInfo />} />`

---

## PHASE 4 — ADMIN PANEL UPGRADES

### 4.1 Payment Method Analytics

In `src/pages/AdminOrders.tsx`, add payment method breakdown chart:

```tsx
// Group orders by payment_method and show pie chart using recharts
const paymentBreakdown = orders.reduce((acc, order) => {
  const method = order.payment_method || 'cod';
  acc[method] = (acc[method] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

### 4.2 Admin Settings — Payflex Toggle

In `src/pages/AdminSettings.tsx`, add:

```tsx
<div className="flex items-center justify-between p-4 border rounded-xl">
  <div>
    <p className="font-medium">Payflex BNPL</p>
    <p className="text-sm text-muted-foreground">Allow customers to pay in 4 instalments</p>
  </div>
  <Switch 
    checked={settings.payflex_enabled}
    onCheckedChange={(val) => updateSetting('payflex_enabled', val)}
  />
</div>
```

---

## PHASE 5 — NEW DATABASE MIGRATIONS

### 5.1 Site Settings Table

```sql
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('payflex_enabled', 'true'::jsonb),
  ('payflex_sandbox', 'true'::jsonb),
  ('free_shipping_threshold', '850'::jsonb),
  ('store_name', '"Lujo Lifestyle Hub"'::jsonb),
  ('store_currency', '"ZAR"'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

### 5.2 Wishlist Table

```sql
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON wishlists
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## PHASE 6 — ENVIRONMENT VARIABLES

### 6.1 Add to `.env` (local development)

```env
# Existing
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# New: Payflex
VITE_PAYFLEX_SANDBOX=true
```

### 6.2 Add to Supabase Edge Function Secrets

Run these in Supabase Dashboard → Edge Functions → Secrets:

```
PAYFLEX_API_KEY=your_payflex_merchant_id
PAYFLEX_API_SECRET=your_payflex_secret
PAYFLEX_SANDBOX=true
```

**Payflex registration:** Apply at `https://www.payflex.co.za/merchants` — approval takes 2-5 business days. Sandbox credentials available immediately on registration.

---

## EXECUTION ORDER FOR CLAUDE CODE

Run these tasks in this exact sequence:

```
TASK 1: Database migrations
  → Run all SQL migrations in /supabase/migrations/
  → Verify orders table has payment_reference, payment_method columns
  → Create wishlists table
  → Create site_settings table

TASK 2: Payflex Edge Functions
  → Create supabase/functions/process-payflex-payment/index.ts (code above)
  → Create supabase/functions/payflex-webhook/index.ts (code above)
  → Deploy: supabase functions deploy process-payflex-payment
  → Deploy: supabase functions deploy payflex-webhook

TASK 3: CSS/Theme overhaul
  → Update src/index.css with luxury palette + Google Fonts import
  → Update tailwind.config.ts to add gold, cream, charcoal colors

TASK 4: Checkout page — Payflex integration
  → Update src/pages/Checkout.tsx
  → Add Payflex payment option UI
  → Wire handlePayflexPayment function
  → Add instalment breakdown display

TASK 5: Navigation trust bar
  → Update src/components/Navigation.tsx
  → Add trust bar above nav

TASK 6: Product cards — Payflex price display
  → Update src/components/FeaturedProducts.tsx
  → Add instalment line below price
  → Update src/pages/ProductDetail.tsx
  → Add Payflex widget

TASK 7: Cart page — Payflex eligibility notice
  → Update src/pages/Cart.tsx

TASK 8: Hero section
  → Update src/components/Hero.tsx with editorial luxury layout

TASK 9: New PayflexInfo page
  → Create src/pages/PayflexInfo.tsx
  → Add route to src/App.tsx

TASK 10: Admin — payment analytics
  → Update src/pages/AdminOrders.tsx with payment method chart
  → Update src/pages/AdminSettings.tsx with Payflex toggle

TASK 11: Build & verify
  → npm run build
  → Fix any TypeScript errors
  → Verify no console errors
```

---

## QUALITY CHECKLIST

Before considering complete, verify:

- [ ] Payflex option visible in checkout for orders R100–R24,000
- [ ] Instalment amount (total ÷ 4) displays correctly everywhere
- [ ] Payflex option disabled/hidden for ineligible cart totals
- [ ] PayFast and COD still work (no regressions)
- [ ] Webhook endpoint handles APPROVED, DECLINED, ABANDONED, EXPIRED
- [ ] Order status updates correctly after Payflex callback
- [ ] Trust bar visible on mobile and desktop
- [ ] Luxury fonts loaded (Cormorant Garamond + Jost)
- [ ] Gold colour consistent across all components
- [ ] Payflex blue (#00B8D9) consistent where Payflex is referenced
- [ ] TypeScript build passes with 0 errors
- [ ] Dark mode tested and functional

---

## KNOWN ISSUES IN CURRENT CODEBASE (fix during execution)

1. **Missing `payment_method` column** — Checkout page uses payment method but orders table may not have the column. Migration in Phase 5 fixes this.
2. **Stripe functions exist** — `process-stripe-payment` and `stripe-webhook` exist but Stripe is not a SA-primary gateway. Leave in place but do not surface in UI.
3. **WordPress sync** — WordPress-related hooks exist but WordPress backend is optional. Do not break this integration.
4. **hCaptcha** — Already integrated. Payflex flow must also complete captcha before redirect.

---

## PAYFLEX BRAND GUIDELINES (use consistently)

- Brand colour: `#00B8D9` (teal-blue)
- Logo text: "Payflex" (capital P only)
- Tagline options: "Buy Now, Pay Later" / "Pay in 4" / "4 × zero interest"
- Always show instalment amount when displaying Payflex
- Always show disclaimer: "Subject to Payflex approval"
- Never call it "Layby" — it is BNPL (different UX/positioning)

---

*Blueprint prepared by Claude for Lujo Lifestyle Hub | April 2026*
*Stack: React 18 + Vite + TypeScript + Supabase + Tailwind CSS + shadcn/ui*
