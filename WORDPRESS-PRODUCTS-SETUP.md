# WordPress Products & Authentication Setup Guide

This guide explains how to set up WordPress as a CMS for managing your product catalog and syncing user authentication with your React e-commerce store.

## Part 1: Product Management via WordPress

### Setup Steps

1. **Install the Product Custom Post Type**
   - Copy the contents of `wordpress-plugin/product-post-type.php`
   - Add to your WordPress theme's `functions.php` OR create a separate plugin
   - Activate the plugin if you created a separate one

2. **Create Products in WordPress**
   - Go to WordPress Admin > LUJO Products > Add New
   - Fill in the product details:
     - **Title:** Product name
     - **Content:** Full product description (supports rich text)
     - **Featured Image:** Main product image
     - **Price:** Current selling price in Rands (R)
     - **Original Price:** Pre-discount price (optional)
     - **Stock Quantity:** Available inventory
     - **Badge:** Optional badge (New, Sale, Hot, Featured)
     - **Active:** Check to show in store
   - Assign to Product Categories

3. **Configure Your React App**
   - Open `src/lib/wordpress.ts`
   - Update `WORDPRESS_API_URL` to your WordPress site:
   ```typescript
   export const WORDPRESS_API_URL = "https://your-wordpress-site.com/wp-json/wp/v2";
   ```

4. **Enable CORS (if needed)**
   Add to your WordPress `functions.php`:
   ```php
   add_action('rest_api_init', function() {
       remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
       add_filter('rest_pre_serve_request', function($value) {
           header('Access-Control-Allow-Origin: *');
           header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
           header('Access-Control-Allow-Credentials: true');
           return $value;
       });
   }, 15);
   ```

### How It Works

**WordPress manages:**
- Product catalog (name, description, images, pricing)
- Product categories and taxonomy
- Inventory/stock levels
- Product visibility (active/inactive)

**React/Supabase handles:**
- Shopping cart
- Checkout process
- Order management
- User accounts (with WordPress sync)
- Payment processing

### WordPress REST API Endpoints

Your products are accessible via:
- All products: `https://your-site.com/wp-json/wp/v2/lujo-products`
- Single product: `https://your-site.com/wp-json/wp/v2/lujo-products?slug=product-slug`
- Categories: `https://your-site.com/wp-json/wp/v2/lujo_product_category`

### Product Fields Exposed in API

```json
{
  "id": 123,
  "title": { "rendered": "Product Name" },
  "content": { "rendered": "Full description..." },
  "excerpt": { "rendered": "Short description..." },
  "slug": "product-slug",
  "product_meta": {
    "price": "499.99",
    "original_price": "699.99",
    "stock": "50",
    "badge": "Sale",
    "is_active": "1"
  },
  "_embedded": {
    "wp:featuredmedia": [{ "source_url": "image.jpg" }],
    "wp:term": [[{ "name": "Category Name" }]]
  }
}
```

---

## Part 2: WordPress Authentication Sync

### Overview

Customers can log in through WordPress and seamlessly access their e-commerce account. User data syncs between WordPress and Supabase.

### Setup Steps

1. **Install JWT Authentication for WordPress**
   - Install the "JWT Authentication for WP REST API" plugin
   - Configure JWT secret in `wp-config.php`:
   ```php
   define('JWT_AUTH_SECRET_KEY', 'your-secure-secret-key-here');
   define('JWT_AUTH_CORS_ENABLE', true);
   ```

2. **Configure Supabase Edge Function**
   - The edge function `wordpress-auth-sync` is already created
   - It automatically syncs WordPress users to Supabase
   - No additional configuration needed

3. **Add WordPress Login to Your React App**
   - The `WordPressAuthButton` component has been added
   - It's already integrated into the Auth page
   - Users can click "Sign in with WordPress"

### How Authentication Sync Works

1. **User logs into WordPress** and gets a JWT token
2. **User clicks "Sign in with WordPress"** in your React app
3. **Token is sent to Supabase edge function** (`wordpress-auth-sync`)
4. **Edge function:**
   - Validates token with WordPress API
   - Checks if user exists in Supabase
   - Creates Supabase user if new
   - Generates Supabase session
5. **User is logged into React app** with synced account

### Getting WordPress JWT Token

Users can get their JWT token by:

**Option 1: Using WordPress REST API**
```bash
curl -X POST https://your-site.com/wp-json/jwt-auth/v1/token \
  -d "username=user@example.com" \
  -d "password=userpassword"
```

**Option 2: Create a WordPress page with form**
```php
// Add to a WordPress page template
$args = array(
    'method' => 'POST',
    'body' => array(
        'username' => $_POST['username'],
        'password' => $_POST['password']
    )
);
$response = wp_remote_post(site_url('/wp-json/jwt-auth/v1/token'), $args);
$token = json_decode($response['body'])->token;
```

**Option 3: User Profile Page**
Create a custom field in user profile to display their JWT token.

### Synced User Data

When a WordPress user syncs:
- **Email:** WordPress email → Supabase email
- **Name:** WordPress display name → Supabase user_metadata.full_name
- **WordPress ID:** Stored in user_metadata.wordpress_id
- **Username:** Stored in user_metadata.wordpress_username

### Security Considerations

1. **JWT tokens should be short-lived** (configure expiration in WordPress)
2. **Use HTTPS** for all API communications
3. **Store JWT secret securely** in wp-config.php
4. **Enable CORS only for your domains**
5. **Rate limit authentication endpoints**

---

## Part 3: Hybrid Architecture

### Recommended Workflow

1. **Content Management:** WordPress admin
   - Marketing team creates products
   - Manages descriptions, images, pricing
   - Controls product visibility

2. **E-commerce Operations:** React + Supabase
   - Customers browse products (from WordPress)
   - Add to cart (stored in Supabase)
   - Checkout (processed via Supabase)
   - Orders tracked (in Supabase)

3. **User Management:** WordPress + Supabase Sync
   - Users can sign up via WordPress or React
   - Authentication syncs between systems
   - User profiles accessible in both

### Data Flow Example

```
WordPress (Product Creation)
    ↓ REST API
React App (Product Display)
    ↓ User adds to cart
Supabase (Cart Storage)
    ↓ User checks out
Supabase (Order Processing)
    ↓ Order confirmation
WordPress (Optional: Stock update via webhook)
```

---

## Testing

### Test Product Management

1. Create a test product in WordPress
2. Visit your React app's products page
3. Verify product appears correctly
4. Check that price, image, and stock display properly

### Test Authentication Sync

1. Create a WordPress user account
2. Get JWT token using WordPress REST API
3. Click "Sign in with WordPress" in React app
4. Enter WordPress URL and token
5. Verify successful login and data sync

---

## Troubleshooting

### Products Not Appearing

- Check `WORDPRESS_API_URL` in `src/lib/wordpress.ts`
- Verify WordPress REST API is accessible (visit in browser)
- Check that products have "Active" checked
- Verify CORS headers are configured

### Authentication Fails

- Confirm JWT plugin is installed and configured
- Check JWT_AUTH_SECRET_KEY is set in wp-config.php
- Verify Supabase edge function is deployed
- Check browser console for error messages

### CORS Errors

- Add CORS headers in WordPress (see setup steps)
- Verify your domain is allowed
- Check browser network tab for blocked requests

---

## Advanced: Automatic Stock Sync

To automatically update WordPress stock when orders are placed:

1. Create a WordPress webhook endpoint
2. Call from Supabase edge function after successful order
3. Update product stock using WordPress REST API

```typescript
// In your order processing edge function
await fetch(`${WORDPRESS_API_URL}/lujo-products/${productId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${WP_ADMIN_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    meta: {
      _lujo_stock: newStockQuantity
    }
  })
});
```

---

## Support Resources

- WordPress REST API: https://developer.wordpress.org/rest-api/
- JWT Authentication Plugin: https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- React Query: https://tanstack.com/query/latest
