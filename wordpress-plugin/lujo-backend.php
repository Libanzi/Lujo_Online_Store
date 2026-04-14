<?php
/**
 * Plugin Name: LUJO Backend
 * Plugin URI: https://lujostore.com
 * Description: Complete backend functionality for LUJO e-commerce store including loyalty program, reorder suggestions, payment integrations, and admin features
 * Version: 1.0.0
 * Author: LUJO Store
 * Author URI: https://lujostore.com
 * Text Domain: lujo-backend
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('LUJO_BACKEND_VERSION', '1.0.0');
define('LUJO_BACKEND_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LUJO_BACKEND_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LUJO_BACKEND_PLUGIN_FILE', __FILE__);

/**
 * Main LUJO Backend Class
 */
class LUJO_Backend {
    
    /**
     * Single instance of the class
     */
    private static $instance = null;
    
    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->load_dependencies();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('plugins_loaded', array($this, 'check_dependencies'));
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Load dependencies
     */
    private function load_dependencies() {
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/class-lujo-loyalty.php';
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/class-lujo-reorder.php';
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/class-lujo-payments.php';
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/class-lujo-admin.php';
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/class-lujo-email.php';
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/class-lujo-security.php';
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/class-lujo-api.php';
    }
    
    /**
     * Check dependencies
     */
    public function check_dependencies() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return false;
        }
        return true;
    }
    
    /**
     * WooCommerce missing notice
     */
    public function woocommerce_missing_notice() {
        ?>
        <div class="notice notice-error">
            <p><?php esc_html_e('LUJO Backend requires WooCommerce to be installed and activated.', 'lujo-backend'); ?></p>
        </div>
        <?php
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        if (!$this->check_dependencies()) {
            return;
        }
        
        // Initialize components
        LUJO_Loyalty::get_instance();
        LUJO_Reorder::get_instance();
        LUJO_Payments::get_instance();
        LUJO_Admin::get_instance();
        LUJO_Email::get_instance();
        LUJO_Security::get_instance();
        LUJO_API::get_instance();
        
        // Load text domain
        load_plugin_textdomain('lujo-backend', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Activate plugin
     */
    public function activate() {
        // Create custom tables
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        
        // Loyalty points table
        $table_name = $wpdb->prefix . 'lujo_loyalty_points';
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            current_points int(11) NOT NULL DEFAULT 0,
            lifetime_points int(11) NOT NULL DEFAULT 0,
            tier varchar(50) DEFAULT 'Bronze',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        // Loyalty transactions table
        $table_name = $wpdb->prefix . 'lujo_loyalty_transactions';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            order_id bigint(20) UNSIGNED,
            points int(11) NOT NULL,
            transaction_type varchar(20) NOT NULL,
            description text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY order_id (order_id)
        ) $charset_collate;";
        
        // Reorder suggestions table
        $table_name = $wpdb->prefix . 'lujo_reorder_suggestions';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id bigint(20) UNSIGNED NOT NULL,
            current_stock int(11) NOT NULL,
            sales_velocity decimal(10,2) NOT NULL,
            days_until_stockout int(11),
            suggested_reorder_quantity int(11) NOT NULL,
            priority varchar(20) DEFAULT 'medium',
            status varchar(20) DEFAULT 'pending',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY product_id (product_id)
        ) $charset_collate;";
        
        // Email rate limits table
        $table_name = $wpdb->prefix . 'lujo_email_rate_limits';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            email_type varchar(50) NOT NULL,
            recipient_email varchar(255) NOT NULL,
            sent_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY email_type (email_type)
        ) $charset_collate;";
        
        // Function logs table
        $table_name = $wpdb->prefix . 'lujo_function_logs';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            function_name varchar(100) NOT NULL,
            status varchar(20) NOT NULL,
            execution_time_ms int(11),
            error_message text,
            user_id bigint(20) UNSIGNED,
            request_method varchar(10),
            request_path varchar(255),
            response_status int(11),
            metadata longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY function_name (function_name),
            KEY status (status)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Set default options
        add_option('lujo_backend_version', LUJO_BACKEND_VERSION);
        add_option('lujo_loyalty_enabled', true);
        add_option('lujo_reorder_enabled', true);
        add_option('lujo_payfast_enabled', false);
        add_option('lujo_stripe_enabled', false);
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Deactivate plugin
     */
    public function deactivate() {
        // Clear scheduled crons
        wp_clear_scheduled_hook('lujo_generate_reorder_suggestions');
        wp_clear_scheduled_hook('lujo_notify_low_stock');
        wp_clear_scheduled_hook('lujo_cleanup_email_limits');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
}

// Initialize plugin
function lujo_backend() {
    return LUJO_Backend::get_instance();
}

// Start the plugin
lujo_backend();
