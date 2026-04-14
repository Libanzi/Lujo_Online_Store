<?php
/**
 * LUJO REST API
 * 
 * Provides REST API endpoints for frontend integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class LUJO_API {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Loyalty endpoints
        register_rest_route('lujo/v1', '/loyalty/(?P<user_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_loyalty_data'),
            'permission_callback' => array($this, 'check_user_permissions')
        ));
        
        register_rest_route('lujo/v1', '/loyalty/redeem', array(
            'methods' => 'POST',
            'callback' => array($this, 'redeem_points'),
            'permission_callback' => array($this, 'check_user_permissions')
        ));
        
        // Reorder endpoints
        register_rest_route('lujo/v1', '/reorder/suggestions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_reorder_suggestions'),
            'permission_callback' => array($this, 'check_admin_permissions')
        ));
    }
    
    /**
     * Get loyalty data
     */
    public function get_loyalty_data($request) {
        $user_id = $request['user_id'];
        
        // Verify user can access their own data or is admin
        if (get_current_user_id() != $user_id && !current_user_can('manage_woocommerce')) {
            return new WP_Error('forbidden', 'Access denied', array('status' => 403));
        }
        
        $loyalty = LUJO_Loyalty::get_instance();
        $data = $loyalty->get_user_loyalty($user_id);
        
        return rest_ensure_response($data);
    }
    
    /**
     * Redeem points
     */
    public function redeem_points($request) {
        $user_id = get_current_user_id();
        $points = intval($request->get_param('points'));
        
        if ($points < 100) {
            return new WP_Error('invalid_points', 'Minimum 100 points required', array('status' => 400));
        }
        
        // Process redemption (simplified)
        $loyalty = LUJO_Loyalty::get_instance();
        $user_loyalty = $loyalty->get_user_loyalty($user_id);
        
        if ($user_loyalty->current_points < $points) {
            return new WP_Error('insufficient_points', 'Insufficient points', array('status' => 400));
        }
        
        return rest_ensure_response(array('message' => 'Points redeemed successfully'));
    }
    
    /**
     * Get reorder suggestions
     */
    public function get_reorder_suggestions() {
        $reorder = LUJO_Reorder::get_instance();
        $suggestions = $reorder->get_pending_suggestions();
        
        return rest_ensure_response($suggestions);
    }
    
    /**
     * Check user permissions
     */
    public function check_user_permissions() {
        return is_user_logged_in();
    }
    
    /**
     * Check admin permissions
     */
    public function check_admin_permissions() {
        return current_user_can('manage_woocommerce');
    }
}
