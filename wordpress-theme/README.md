# Lujo Store WordPress Theme

A modern, luxury-focused WooCommerce theme converted from a Lovable React/Supabase e-commerce platform.

## Installation Instructions

1. **Download and Extract**
   - Download all theme files
   - Create a folder named `lujo-store`
   - Place all files inside this folder

2. **Create ZIP File**
   - Compress the `lujo-store` folder into a ZIP file
   - Make sure the folder structure is: `lujo-store.zip` → `lujo-store/` → theme files

3. **Upload to WordPress**
   - Go to WordPress Admin → Appearance → Themes
   - Click "Add New" → "Upload Theme"
   - Upload `lujo-store.zip`
   - Click "Install Now" and then "Activate"

4. **Install Required Plugins**
   - WooCommerce (required for e-commerce functionality)
   - Contact Form 7 or WPForms (for contact forms)
   - Yoast SEO (recommended for SEO)

## Theme Features

### Included
- ✅ Modern, responsive design
- ✅ WooCommerce integration
- ✅ Product grid and listings
- ✅ Hero section
- ✅ Category showcase
- ✅ Featured products
- ✅ Newsletter subscription
- ✅ Mobile-responsive navigation
- ✅ Custom color scheme matching original design
- ✅ AJAX newsletter handling

### Features Requiring Additional Development

The following features from your original Lovable app need manual implementation:

#### 1. **Loyalty Program**
- Create custom database tables for points tracking
- Implement points calculation on orders
- Add reward redemption functionality
- **Recommended Plugin**: WooCommerce Points and Rewards

#### 2. **Reorder Suggestions**
- Implement order history analysis
- Create automated stock monitoring
- Add reorder notification system
- **Requires**: Custom PHP development or plugins like "WooCommerce Smart Suggest"

#### 3. **Product Comparison**
- Add comparison functionality
- Create comparison table template
- **Recommended Plugin**: YITH WooCommerce Compare

#### 4. **Payment Gateways**

**PayFast (South African Gateway)**:
- Install WooCommerce PayFast Gateway plugin
- Configure merchant ID, merchant key, and passphrase in WooCommerce settings
- Test in sandbox mode before going live

**Stripe**:
- Install WooCommerce Stripe Gateway plugin
- Add your Stripe API keys
- Configure payment settings

**Cash on Delivery**:
- Already included in WooCommerce core
- Enable in WooCommerce → Settings → Payments

#### 5. **Product Reviews**
- WooCommerce includes basic reviews
- For advanced features, use plugins like "YITH WooCommerce Advanced Reviews"

#### 6. **Email Integration**
- Configure WordPress email settings
- For better deliverability, use plugins like:
  - WP Mail SMTP
  - SendGrid
  - Mailgun

#### 7. **Security Features**

**hCaptcha Integration**:
- Install "hCaptcha for WordPress" plugin
- Add your site key and secret key
- Enable on forms

**Rate Limiting**:
- Use security plugins like:
  - Wordfence Security
  - Limit Login Attempts Reloaded
  - iThemes Security

#### 8. **Admin Monitoring Dashboard**
- Requires custom plugin development
- Alternative: Use existing plugins:
  - Query Monitor (for performance)
  - WP Activity Log (for user activity)
  - Custom PHP dashboard (needs development)

#### 9. **WordPress Product Sync**
- Your original app synced WordPress products to Supabase
- In WordPress theme, products are managed directly in WooCommerce
- No sync needed - WooCommerce is now the source of truth

## Configuration Steps

### 1. Theme Customizer
Go to Appearance → Customize to configure:
- Site identity (logo, title, tagline)
- Colors (if you want to override defaults)
- Menus
- Widgets

### 2. Set Home Page
1. Go to Pages → Add New
2. Title: "Home"
3. Template: Select "Home Page" from Page Attributes
4. Publish
5. Go to Settings → Reading
6. Set "A static page" and select "Home" as Homepage

### 3. Create Menus
1. Go to Appearance → Menus
2. Create "Primary Menu" and assign to "Primary Menu" location
3. Create "Footer Menu" and assign to "Footer Menu" location
4. Add pages: Shop, About, Contact, etc.

### 4. WooCommerce Setup
1. Go to WooCommerce → Settings
2. Complete the setup wizard
3. Configure:
   - Store address (South Africa)
   - Currency (ZAR - South African Rand)
   - Payment methods (PayFast, Stripe, COD)
   - Shipping zones and rates

### 5. Add Products
1. Go to Products → Add New
2. Add product details, images, prices
3. Set categories
4. For featured products, check "Featured" in product data

### 6. Newsletter Integration
Current implementation stores emails in WordPress options. For production:
- Install Mailchimp plugin
- Or integrate with your email service provider
- Update the AJAX handler in functions.php

## File Structure

```
lujo-store/
├── style.css                 # Main stylesheet with theme info
├── functions.php             # Theme functions and hooks
├── index.php                 # Main template file
├── header.php                # Header template
├── footer.php                # Footer template
├── page-home.php             # Home page template
├── template-parts/           # Reusable template parts
│   ├── hero.php
│   ├── category-showcase.php
│   ├── featured-products.php
│   └── newsletter.php
├── assets/
│   ├── css/
│   │   ├── custom.css        # Custom styles
│   │   └── woocommerce.css   # WooCommerce overrides
│   └── js/
│       ├── navigation.js     # Navigation functionality
│       └── main.js           # Main JavaScript
└── README.md                 # This file
```

## Customization

### Colors
Edit CSS variables in `style.css`:
```css
:root {
  --luxury-gold: 45 100% 51%;
  --luxury-navy: 222 47% 11%;
  /* ... more colors */
}
```

### Layout
Modify template parts in `template-parts/` folder

### Functionality
Add custom functions in `functions.php`

## Support

For WooCommerce issues: https://woocommerce.com/support/
For WordPress issues: https://wordpress.org/support/

## License

GPL v2 or later

## Credits

- Original design: Lovable React/Supabase platform
- Conversion: WordPress theme
- WooCommerce: Automattic
