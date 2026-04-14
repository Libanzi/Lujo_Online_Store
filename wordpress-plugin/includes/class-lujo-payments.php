<?php
/**
 * LUJO Payments
 * 
 * Handles PayFast and Stripe payment integrations
 */

if (!defined('ABSPATH')) {
    exit;
}

class LUJO_Payments {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Register payment gateways
        add_filter('woocommerce_payment_gateways', array($this, 'add_payment_gateways'));
        
        // Load gateway classes
        add_action('plugins_loaded', array($this, 'load_gateways'));
    }
    
    /**
     * Add payment gateways
     */
    public function add_payment_gateways($gateways) {
        $gateways[] = 'WC_Gateway_PayFast_LUJO';
        return $gateways;
    }
    
    /**
     * Load gateway classes
     */
    public function load_gateways() {
        if (!class_exists('WC_Payment_Gateway')) {
            return;
        }
        
        require_once LUJO_BACKEND_PLUGIN_DIR . 'includes/gateways/class-wc-gateway-payfast-lujo.php';
    }
}
