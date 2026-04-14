

## Security Hardening Plan

### Critical Fixes (3)

1. **`email_rate_limits` — remove public read/write policy**
   - Drop the "System can manage email rate limits" policy (allows ALL for public with `true`)
   - Replace with service-role-only INSERT (via `WITH CHECK (true)` scoped to `service_role`) and admin-only SELECT

2. **`function_logs` — disable Realtime broadcast**
   - Remove `function_logs` from `supabase_realtime` publication if present
   - The INSERT policy (`true` for public) is needed by edge functions using service_role, but scope it to `service_role` role

3. **`wordpress_sync_history` — restrict anonymous writes**
   - Scope INSERT and UPDATE policies to `service_role` instead of public with `true`

### Warning Fixes — Scope policies to `authenticated` instead of `public`

These tables have admin policies on `public` role that should be `authenticated`:
- `alert_settings` — ALL policy
- `categories` — INSERT/UPDATE/DELETE admin policies
- `discount_codes` — ALL admin policy
- `loyalty_tiers` — ALL admin policy
- `order_status_history` — INSERT/SELECT admin policies
- `orders` — UPDATE/SELECT admin policies
- `product_reviews` — ALL admin policy, plus user INSERT/UPDATE/DELETE
- `product_specifications` — ALL admin policy
- `products` — all admin policies
- `reorder_suggestions` — ALL admin policy
- `theme_settings` — ALL admin policy
- `user_roles` — all admin policies
- `wordpress_settings` — ALL admin policy

For each: DROP the existing `public`-role policy, recreate with `authenticated` role.

Public SELECT policies (e.g., "Anyone can view categories") remain on `public` as they serve unauthenticated visitors.

### Auth Hardening

4. **Enable leaked password protection (HIBP check)** via `cloud--configure_auth` tool

### Implementation

Single migration with ~40 DROP/CREATE POLICY statements. No code changes needed — all policies are database-level.

