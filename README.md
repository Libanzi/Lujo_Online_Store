# LUJO Lifestyle Hub

Premium minimalist South African luxury lifestyle brand — production-ready eCommerce platform built on React 18, Vite, Tailwind CSS, shadcn/ui, and Supabase.

---

## Quick Start

```sh
# 1. Clone the repository
git clone https://github.com/Libanzi/Lujo_Online_Store.git
cd Lujo_Online_Store

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 4. Start development server (http://localhost:8080)
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Where to find it | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API (anon/public key) | ✅ |
| `VITE_PAYFLEX_SANDBOX` | `true` for dev/staging, `false` for production | ✅ |

### Supabase Edge Function Secrets

Set these via `supabase secrets set KEY=value` or the Supabase Dashboard → Edge Functions → Secrets. **Do not** put them in `.env`.

| Secret | Where to get it |
|---|---|
| `PAYFLEX_API_KEY` | https://merchant.payflex.co.za |
| `PAYFLEX_API_SECRET` | https://merchant.payflex.co.za |
| `PAYFLEX_SANDBOX` | `true` / `false` |
| `PAYFAST_MERCHANT_ID` | https://www.payfast.co.za/registration |
| `PAYFAST_MERCHANT_KEY` | https://www.payfast.co.za/registration |
| `PAYFAST_PASSPHRASE` | Your PayFast passphrase |
| `RESEND_API_KEY` | https://resend.com |
| `HCAPTCHA_SECRET` | https://www.hcaptcha.com |

---

## Database Setup

### Apply all migrations

```sh
# Using the Supabase CLI (recommended)
supabase db push

# Or apply individually in Supabase SQL Editor
# supabase/migrations/*.sql  (run in timestamp order)
```

### Create your admin user

After registering through `/auth`, grant admin privileges:

```sql
-- Run in Supabase SQL Editor
INSERT INTO public.user_roles (user_id, role)
VALUES ('<your-auth-uid>', 'admin');
```

Find your `auth.uid()` in Supabase Dashboard → Authentication → Users.

### Regenerate TypeScript types (after schema changes)

```sh
supabase gen types typescript \
  --project-id <your-project-id> \
  > src/integrations/supabase/types.ts
```

---

## Edge Function Deployment

```sh
# Deploy all edge functions
supabase functions deploy process-payfast-payment
supabase functions deploy process-payflex-payment
supabase functions deploy payflex-webhook
supabase functions deploy send-order-email
supabase functions deploy export-orders-to-supplier

# Deploy all at once
supabase functions deploy
```

---

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set these environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_PAYFLEX_SANDBOX` → `false`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Framework preset: **Vite**

Add a `vercel.json` for SPA routing (all paths → `index.html`):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Payment Gateways

| Gateway | Type | SA Support | Config |
|---|---|---|---|
| **PayFast** | Redirect (card, EFT, SnapScan, Mobicred) | Native | `PAYFAST_*` secrets |
| **Payflex** | BNPL — 4 × zero-interest (R100–R24,000) | Native | `PAYFLEX_*` secrets |
| **Cash on Delivery** | COD | Yes | No config needed |
| Stripe | Card (dormant) | No | `STRIPE_*` secrets (optional) |

Payflex shows automatically when cart total is between **R100 and R24,000**. Instalments are calculated as `total / 4`, zero interest, zero fees.

---

## Dropshipping

1. **Apply the migration** — `supabase/migrations/20260415000000_add_dropshipping.sql` creates the `suppliers` table and adds `supplier_id`, `cost_price`, `supplier_sku`, `is_dropship` columns to `products`.

2. **Add suppliers** — Admin Panel → Suppliers → New Supplier.

3. **Link products to suppliers** — Admin Panel → Products → edit a product → select supplier, enter cost price and supplier SKU.

4. **Export orders for a supplier** — Admin Panel → Orders → select supplier from the dropdown → Export CSV. The CSV contains all `pending`/`processing` orders with that supplier's line items.

---

## Admin Panel

| Route | Description |
|---|---|
| `/admin` | Dashboard — KPIs, low stock alerts, reorder suggestions |
| `/admin/products` | Product CRUD with image upload, pricing, inventory, supplier |
| `/admin/categories` | Category management |
| `/admin/orders` | Order management, status updates, supplier CSV export |
| `/admin/suppliers` | Supplier CRUD for dropshipping |
| `/admin/discounts` | Promotional discount codes |
| `/admin/analytics` | Performance charts (recharts) |
| `/admin/monitoring` | Edge function real-time logs and security events |
| `/admin/settings` | Site settings — thresholds, notification channels |

---

## Build & Performance

```sh
# Production build
npm run build

# Preview production build locally
npm run preview
```

The bundle is split into separate chunks for optimal caching:
- `vendor-react` — React, React DOM, React Router
- `vendor-supabase` — Supabase JS client
- `vendor-radix` — All Radix UI primitives
- `vendor-recharts` — Charts library (lazy — only admin analytics)
- `vendor-forms` — React Hook Form + Zod
- `vendor-query` — TanStack Query

All admin routes are lazy-loaded — admin code is **never sent to customers**.

---

## Project Structure

```
src/
├── components/          # Shared UI components (Navigation, Hero, Footer, etc.)
├── hooks/               # Custom React hooks (useAdmin, useCart, useWishlist, etc.)
├── integrations/
│   └── supabase/        # Supabase client + generated TypeScript types
├── lib/                 # Utilities (cn, formatPrice, etc.)
└── pages/               # Route-level components (customer + admin)

supabase/
├── functions/           # Deno edge functions
│   ├── process-payfast-payment/
│   ├── process-payflex-payment/
│   ├── payflex-webhook/
│   ├── send-order-email/
│   └── export-orders-to-supplier/
└── migrations/          # Timestamped PostgreSQL migrations (21+)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5 (SWC) |
| Styling | Tailwind CSS 3.4, shadcn/ui (Radix UI) |
| Typography | Cormorant Garamond (headings) + Jost (body) |
| State | TanStack Query v5, React Context |
| Backend | Supabase (PostgreSQL, Auth, Storage, Deno Edge Functions) |
| Email | Resend |
| Bot protection | hCaptcha |
| Deployment | Vercel (frontend) + Supabase Cloud (backend) |

---

## Licence

Private — all rights reserved. LUJO Lifestyle Hub © 2026.
