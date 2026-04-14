<?php
/**
 * Lujo Store Theme Functions
 * 
 * @package Lujo_Store
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Theme Setup
 */
function lujo_store_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption'));
    add_theme_support('customize-selective-refresh-widgets');
    add_theme_support('responsive-embeds');
    
    // WooCommerce support
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'lujo-store'),
        'footer' => __('Footer Menu', 'lujo-store'),
    ));
}
add_action('after_setup_theme', 'lujo_store_setup');

/**
 * Enqueue Scripts and Styles
 */
function lujo_store_enqueue_scripts() {
    // Google Fonts
    wp_enqueue_style('lujo-google-fonts', 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap', array(), null);
    
    // Theme stylesheet
    wp_enqueue_style('lujo-store-style', get_stylesheet_uri(), array(), '1.0.0');
    
    // Custom CSS
    wp_enqueue_style('lujo-store-custom', get_template_directory_uri() . '/assets/css/custom.css', array('lujo-store-style'), '1.0.0');
    
    // WooCommerce overrides
    if (class_exists('WooCommerce')) {
        wp_enqueue_style('lujo-store-woocommerce', get_template_directory_uri() . '/assets/css/woocommerce.css', array('lujo-store-style'), '1.0.0');
    }
    
    // Scripts
    wp_enqueue_script('lujo-store-navigation', get_template_directory_uri() . '/assets/js/navigation.js', array('jquery'), '1.0.0', true);
    wp_enqueue_script('lujo-store-main', get_template_directory_uri() . '/assets/js/main.js', array('jquery'), '1.0.0', true);
    
    // Localize script for AJAX
    wp_localize_script('lujo-store-main', 'lujoAjax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('lujo_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'lujo_store_enqueue_scripts');

/**
 * Register Widget Areas
 */
function lujo_store_widgets_init() {
    register_sidebar(array(
        'name' => __('Footer Widget Area', 'lujo-store'),
        'id' => 'footer-widget-area',
        'description' => __('Appears in the footer section', 'lujo-store'),
        'before_widget' => '<div class="footer-widget">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
}
add_action('widgets_init', 'lujo_store_widgets_init');

/**
 * WooCommerce Customizations
 */

// Change number of products displayed per page
add_filter('loop_shop_per_page', function() {
    return 12;
}, 20);

// Modify WooCommerce pagination
add_filter('woocommerce_pagination_args', function($args) {
    $args['prev_text'] = '&larr; Previous';
    $args['next_text'] = 'Next &rarr;';
    return $args;
});

// Add wrapper for WooCommerce content
remove_action('woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10);
remove_action('woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10);

add_action('woocommerce_before_main_content', function() {
    echo '<div class="container woocommerce-content">';
}, 10);

add_action('woocommerce_after_main_content', function() {
    echo '</div>';
}, 10);

/**
 * Custom Functions for Features
 * 
 * Note: These are placeholder functions. You'll need to implement:
 * - Loyalty program logic
 * - Reorder suggestions based on order history
 * - Product comparison functionality
 * - PayFast payment gateway integration
 */

// Get featured products
function lujo_get_featured_products($limit = 4) {
    if (!class_exists('WooCommerce')) {
        return array();
    }
    
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => $limit,
        'meta_query' => array(
            array(
                'key' => '_featured',
                'value' => 'yes'
            )
        )
    );
    
    return new WP_Query($args);
}

// Get new arrival products
function lujo_get_new_arrivals($limit = 8) {
    if (!class_exists('WooCommerce')) {
        return array();
    }
    
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => $limit,
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    return new WP_Query($args);
}

// Newsletter subscription handler
function lujo_handle_newsletter_subscription() {
    check_ajax_referer('lujo_nonce', 'nonce');
    
    $email = sanitize_email($_POST['email']);
    
    if (!is_email($email)) {
        wp_send_json_error(array('message' => 'Invalid email address'));
    }
    
    // TODO: Integrate with your email marketing service
    // For now, store in WordPress options or custom table
    $subscribers = get_option('lujo_newsletter_subscribers', array());
    
    if (in_array($email, $subscribers)) {
        wp_send_json_error(array('message' => 'Email already subscribed'));
    }
    
    $subscribers[] = $email;
    update_option('lujo_newsletter_subscribers', $subscribers);
    
    wp_send_json_success(array('message' => 'Successfully subscribed!'));
}
add_action('wp_ajax_lujo_newsletter', 'lujo_handle_newsletter_subscription');
add_action('wp_ajax_nopriv_lujo_newsletter', 'lujo_handle_newsletter_subscription');

/**
 * Custom Post Types and Taxonomies
 */

// Register custom taxonomy for product categories if needed
// (WooCommerce already provides product_cat)

/**
 * Admin Customizations
 */

// Add custom admin menu for theme settings
function lujo_admin_menu() {
    add_theme_page(
        'Lujo Store Settings',
        'Theme Settings',
        'manage_options',
        'lujo-settings',
        'lujo_settings_page'
    );
}
add_action('admin_menu', 'lujo_admin_menu');

function lujo_settings_page() {
    ?>
    <div class="wrap">
        <h1>Lujo Store Settings</h1>
        <p>Configure your theme settings here.</p>
        <?php
        // TODO: Add theme options form
        // - Loyalty program settings
        // - Payment gateway configurations
        // - Email templates
        // - Alert settings
        ?>
    </div>
    <?php
}

/**
 * Security Enhancements
 */

// Disable XML-RPC if not needed
add_filter('xmlrpc_enabled', '__return_false');

// Remove WordPress version from head
remove_action('wp_head', 'wp_generator');

// Sanitize all outputs
function lujo_sanitize_output($content) {
    return wp_kses_post($content);
}
