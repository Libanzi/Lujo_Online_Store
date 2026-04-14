# WordPress Integration Guide

This document explains how to integrate WordPress with your LUJO React e-commerce application.

## Two Integration Methods

### 1. Headless WordPress CMS (Current Implementation)

Your React app fetches content from WordPress via the REST API while maintaining full control of the frontend.

#### Setup Steps:

1. **Configure WordPress URL:**
   - Open `src/lib/wordpress.ts`
   - Update `WORDPRESS_API_URL` with your WordPress site URL:
   ```typescript
   export const WORDPRESS_API_URL = "https://your-wordpress-site.com/wp-json/wp/v2";
   ```

2. **Enable WordPress REST API:**
   - Ensure your WordPress site has REST API enabled (enabled by default)
   - Install "WP REST API Controller" plugin for enhanced API features (optional)

3. **Configure CORS (if needed):**
   Add to your WordPress theme's `functions.php`:
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

4. **Create Content in WordPress:**
   - Log into WordPress admin
   - Create blog posts with featured images
   - Content will automatically appear in your React app

#### Features Available:

- **Blog Posts:** Managed in WordPress, displayed in React
- **Pages:** Create WordPress pages, fetch via API
- **Featured Images:** Automatically displayed in post cards
- **Categories & Tags:** Use WordPress taxonomy (extend hooks to fetch)
- **Custom Fields:** Add with ACF plugin and extend the API client

---

### 2. WordPress Plugin Embedding (Created)

Embed your entire React app within WordPress using a plugin and shortcode.

#### Setup Steps:

1. **Build Your React App:**
   ```bash
   npm run build
   ```

2. **Host the Build:**
   - Upload `dist` folder contents to your server or CDN
   - Note the public URL (e.g., `https://cdn.yoursite.com/lujo-store/`)

3. **Configure Plugin:**
   - Open `wordpress-plugin/lujo-react-store.php`
   - Update line 23:
   ```php
   define('LUJO_REACT_APP_URL', 'https://cdn.yoursite.com/lujo-store');
   ```

4. **Update Asset Paths:**
   - Check your build output for actual filenames
   - Update CSS/JS paths in the `enqueue_scripts` method (lines 44-55)

5. **Install Plugin:**
   - Zip the `wordpress-plugin` folder
   - Upload via WordPress: Plugins > Add New > Upload Plugin
   - Activate the plugin

6. **Use Shortcode:**
   - Create a new WordPress page
   - Add shortcode: `[lujo-store]`
   - Publish and view

#### Shortcode Options:

```
[lujo-store]                    // Default home page
[lujo-store page="products"]    // Products page
[lujo-store page="cart"]        // Shopping cart
```

---

## Current React Pages Using WordPress

### Blog Page (`/blog`)
- Fetches posts from WordPress REST API
- Displays post title, excerpt, featured image, and date
- Links to individual blog posts
- Shows loading skeletons while fetching
- Error handling for API failures

### Blog Post Page (`/blog/:slug`)
- Displays full blog post content
- Shows featured image
- Renders WordPress HTML content
- Back to blog navigation

---

## Extending WordPress Integration

### Add Custom Post Types

1. Register in WordPress:
```php
function create_product_cpt() {
    register_post_type('products', array(
        'show_in_rest' => true, // Enable REST API
        // ... other options
    ));
}
add_action('init', 'create_product_cpt');
```

2. Create hook in React:
```typescript
export const useWordPressProducts = () => {
  return useQuery({
    queryKey: ["wordpress-products"],
    queryFn: () => fetch(`${WORDPRESS_API_URL}/products`).then(r => r.json()),
  });
};
```

### Add Custom Fields (ACF Integration)

1. Install Advanced Custom Fields in WordPress
2. Enable ACF in REST API:
```php
// functions.php
add_filter('acf/rest_api/field_settings/show_in_rest', '__return_true');
```

3. Access in React:
```typescript
const post = await fetchWordPressPost(slug);
const customField = post.acf?.custom_field_name;
```

### Add WordPress Authentication

Implement JWT authentication for protected content:

1. Install "JWT Authentication for WP REST API" plugin
2. Configure JWT secret in wp-config.php
3. Update React API client to include JWT token

---

## Best Practices

### Content Management Strategy

- **WordPress handles:** Blog posts, marketing pages, SEO content
- **React handles:** E-commerce functionality, user interactions, checkout
- **Supabase handles:** Product catalog, orders, user data

### Performance Optimization

1. **Cache WordPress responses:**
```typescript
export const useWordPressPosts = () => {
  return useQuery({
    queryKey: ["wordpress-posts"],
    queryFn: () => fetchWordPressPosts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
```

2. **Use CDN for WordPress media**
3. **Enable WordPress caching plugins** (WP Rocket, W3 Total Cache)

### SEO Considerations

- Use WordPress SEO plugins (Yoast, Rank Math) for blog content
- Implement React Helmet for dynamic meta tags
- Consider server-side rendering for blog pages if needed

---

## Troubleshooting

### CORS Errors
- Add CORS headers in WordPress (see Setup Steps)
- Use WordPress CORS plugin as alternative

### 404 Errors on WordPress API
- Check permalink structure in WordPress (Settings > Permalinks)
- Ensure REST API is not blocked by security plugins

### Plugin Assets Not Loading
- Verify build output paths match plugin configuration
- Check browser console for 404s
- Ensure CDN/hosting allows CORS

### Content Not Updating
- Clear React Query cache
- Clear WordPress cache
- Check WordPress API directly in browser

---

## Development Workflow

1. **Content creators:** Use WordPress admin to manage blog posts
2. **Developers:** Build features in React, push updates
3. **Deployment:** 
   - WordPress content updates automatically via API
   - React app requires rebuild and redeployment
   - Plugin requires reactivation after updates

---

## Security Notes

- WordPress API is public by default
- Protect sensitive endpoints with authentication
- Use WordPress security plugins
- Keep WordPress and plugins updated
- Use environment variables for API URLs
- Validate and sanitize all WordPress content in React

---

## Need Help?

- WordPress REST API Docs: https://developer.wordpress.org/rest-api/
- React Query Docs: https://tanstack.com/query/latest
- Plugin Development: https://developer.wordpress.org/plugins/
