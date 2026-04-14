<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
    <a class="skip-link screen-reader-text" href="#main-content">
        <?php esc_html_e('Skip to content', 'lujo-store'); ?>
    </a>

    <header id="masthead" class="site-header">
        <nav class="main-navigation">
            <div class="container">
                <div class="nav-wrapper" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0;">
                    
                    <!-- Logo -->
                    <div class="site-branding">
                        <?php if (has_custom_logo()) : ?>
                            <?php the_custom_logo(); ?>
                        <?php else : ?>
                            <a href="<?php echo esc_url(home_url('/')); ?>" class="site-title">
                                <h1 style="margin: 0; font-size: 1.5rem; font-weight: 700;">
                                    <?php bloginfo('name'); ?>
                                </h1>
                            </a>
                        <?php endif; ?>
                    </div>

                    <!-- Primary Navigation -->
                    <div class="nav-menu">
                        <?php
                        wp_nav_menu(array(
                            'theme_location' => 'primary',
                            'menu_class' => 'primary-menu',
                            'container' => false,
                            'fallback_cb' => false,
                        ));
                        ?>
                    </div>

                    <!-- Cart and User Actions -->
                    <div class="nav-actions" style="display: flex; gap: 1rem; align-items: center;">
                        
                        <?php if (class_exists('WooCommerce')) : ?>
                            <!-- Search -->
                            <a href="<?php echo esc_url(home_url('/shop')); ?>" class="nav-icon" aria-label="<?php esc_attr_e('Search', 'lujo-store'); ?>">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </a>

                            <!-- Cart -->
                            <a href="<?php echo esc_url(wc_get_cart_url()); ?>" class="nav-icon cart-icon" aria-label="<?php esc_attr_e('View cart', 'lujo-store'); ?>">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="8" cy="21" r="1"></circle>
                                    <circle cx="19" cy="21" r="1"></circle>
                                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                                </svg>
                                <?php if (WC()->cart->get_cart_contents_count() > 0) : ?>
                                    <span class="cart-count" style="position: absolute; top: -5px; right: -5px; background: hsl(var(--luxury-gold)); color: hsl(var(--primary)); border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600;">
                                        <?php echo WC()->cart->get_cart_contents_count(); ?>
                                    </span>
                                <?php endif; ?>
                            </a>
                        <?php endif; ?>

                        <!-- User Account -->
                        <a href="<?php echo is_user_logged_in() ? esc_url(wc_get_account_endpoint_url('dashboard')) : esc_url(wp_login_url()); ?>" class="nav-icon" aria-label="<?php esc_attr_e('My account', 'lujo-store'); ?>">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </a>

                        <!-- Mobile Menu Toggle -->
                        <button class="mobile-menu-toggle" aria-label="<?php esc_attr_e('Toggle menu', 'lujo-store'); ?>" style="display: none; background: none; border: none; cursor: pointer;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                </div>
            </div>
        </nav>
    </header>
