# LUJO React Store WordPress Plugin

This plugin embeds your LUJO React e-commerce application within WordPress.

## Installation

1. **Build your React app:**
   ```bash
   npm run build
   ```

2. **Host your build files:**
   - Upload the contents of the `dist` folder to a CDN or your web server
   - Note the public URL where your files are hosted

3. **Update plugin configuration:**
   - Open `lujo-react-store.php`
   - Update the `LUJO_REACT_APP_URL` constant with your hosted app URL
   - Update the CSS and JS paths in the `enqueue_scripts` method to match your build output

4. **Install the plugin:**
   - Zip the `wordpress-plugin` folder
   - Upload to WordPress via Plugins > Add New > Upload Plugin
   - Activate the plugin

## Usage

### Basic Shortcode

Add the store to any page or post using:

```
[lujo-store]
```

### With Page Parameter

You can specify which page of your React app to show:

```
[lujo-store page="products"]
[lujo-store page="cart"]
[lujo-store page="checkout"]
```

### Full-Width Store Page

Create a new page in WordPress with this shortcode, then optionally use a full-width page template.

## Configuration

### Update React App for WordPress Integration

In your React app's `vite.config.ts`, you may need to adjust the base path:

```typescript
export default defineConfig({
  base: '/path-to-your-assets/',
  // ... rest of config
});
```

### Handling Routes

The React app uses React Router. To make WordPress aware of React routes:

1. Create a WordPress page for each major route (Products, Cart, etc.)
2. Add the shortcode to each page
3. Pass the appropriate page parameter

## WordPress Integration Features

The plugin automatically passes WordPress data to your React app via the `lujoWPData` global object:

- `ajaxUrl`: WordPress AJAX endpoint
- `nonce`: Security nonce for AJAX requests
- `currentUser`: Current WordPress user ID
- `siteUrl`: WordPress site URL

Access in React:
```typescript
declare global {
  interface Window {
    lujoWPData?: {
      ajaxUrl: string;
      nonce: string;
      currentUser: number;
      siteUrl: string;
    };
  }
}

const wpData = window.lujoWPData;
```

## Styling

The plugin loads your React app's CSS. If you need to adjust styles for WordPress integration:

1. Add WordPress-specific styles to your React app
2. Use the `.lujo-react-root` class as a namespace
3. Override WordPress theme styles as needed

## Troubleshooting

### Assets Not Loading

- Check that `LUJO_REACT_APP_URL` points to the correct location
- Verify CORS settings on your asset host
- Check browser console for 404 errors

### Routes Not Working

- Ensure your WordPress permalink structure is set to "Post name"
- Consider using hash routing in React Router for easier WordPress integration

### Styles Conflicting

- Add CSS specificity to your React components
- Use CSS modules or styled-components to isolate styles
- Wrap your React app in a namespace div

## Development

For local development:

1. Run your React dev server: `npm run dev`
2. Update `LUJO_REACT_APP_URL` to `http://localhost:8080`
3. Enable CORS in your Vite config if needed

## Support

For issues related to:
- React app functionality: Check your React app repository
- WordPress integration: Open an issue in this plugin's repository
