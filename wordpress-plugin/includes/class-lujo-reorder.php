<?php
/**
 * LUJO Reorder Suggestions
 * 
 * Handles automated reorder suggestions based on sales velocity
 */

if (!defined('ABSPATH')) {
    exit;
}

class LUJO_Reorder {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Schedule cron jobs
        if (!wp_next_scheduled('lujo_generate_reorder_suggestions')) {
            wp_schedule_event(strtotime('02:00:00'), 'daily', 'lujo_generate_reorder_suggestions');
        }
        
        add_action('lujo_generate_reorder_suggestions', array($this, 'generate_suggestions'));
        add_action('wp_ajax_lujo_dismiss_suggestion', array($this, 'ajax_dismiss_suggestion'));
        add_action('admin_notices', array($this, 'show_admin_notices'));
    }
    
    /**
     * Generate reorder suggestions
     */
    public function generate_suggestions() {
        global $wpdb;
        
        // Get all active products
        $products = wc_get_products(array(
            'status' => 'publish',
            'limit' => -1
        ));
        
        $suggestions = array();
        
        foreach ($products as $product) {
            // Skip if not managing stock
            if (!$product->managing_stock()) {
                continue;
            }
            
            $product_id = $product->get_id();
            $current_stock = $product->get_stock_quantity();
            
            // Calculate sales velocity (units per day) over last 30 days
            $sales_velocity = $this->calculate_sales_velocity($product_id, 30);
            
            if ($sales_velocity <= 0) {
                continue;
            }
            
            // Calculate days until stockout
            $days_until_stockout = floor($current_stock / $sales_velocity);
            
            // Only suggest if stockout within 30 days
            if ($days_until_stockout > 30) {
                continue;
            }
            
            // Calculate suggested reorder quantity (30 days worth + 10% buffer)
            $suggested_quantity = ceil(($sales_velocity * 30) * 1.1);
            
            // Determine priority
            if ($days_until_stockout <= 7) {
                $priority = 'high';
            } elseif ($days_until_stockout <= 14) {
                $priority = 'medium';
            } else {
                $priority = 'low';
            }
            
            $suggestions[] = array(
                'product_id' => $product_id,
                'current_stock' => $current_stock,
                'sales_velocity' => $sales_velocity,
                'days_until_stockout' => $days_until_stockout,
                'suggested_reorder_quantity' => $suggested_quantity,
                'priority' => $priority,
                'status' => 'pending'
            );
        }
        
        // Delete old pending suggestions
        $table = $wpdb->prefix . 'lujo_reorder_suggestions';
        $wpdb->query("DELETE FROM $table WHERE status = 'pending'");
        
        // Insert new suggestions
        foreach ($suggestions as $suggestion) {
            $wpdb->insert($table, $suggestion);
        }
        
        // Send email notification to admins
        if (!empty($suggestions)) {
            $this->send_admin_notification($suggestions);
        }
        
        return $suggestions;
    }
    
    /**
     * Calculate sales velocity
     */
    private function calculate_sales_velocity($product_id, $days = 30) {
        global $wpdb;
        
        $start_date = date('Y-m-d', strtotime("-{$days} days"));
        
        $query = $wpdb->prepare("
            SELECT SUM(oim.meta_value) as total_quantity
            FROM {$wpdb->prefix}woocommerce_order_items oi
            INNER JOIN {$wpdb->prefix}woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id
            INNER JOIN {$wpdb->prefix}woocommerce_order_itemmeta oim_product ON oi.order_item_id = oim_product.order_item_id
            INNER JOIN {$wpdb->prefix}posts p ON oi.order_id = p.ID
            WHERE oim.meta_key = '_qty'
            AND oim_product.meta_key = '_product_id'
            AND oim_product.meta_value = %d
            AND p.post_type = 'shop_order'
            AND p.post_status IN ('wc-completed', 'wc-processing')
            AND p.post_date >= %s
        ", $product_id, $start_date);
        
        $result = $wpdb->get_var($query);
        $total_quantity = $result ? intval($result) : 0;
        
        return $total_quantity / $days;
    }
    
    /**
     * Get pending suggestions
     */
    public function get_pending_suggestions() {
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_reorder_suggestions';
        
        return $wpdb->get_results("
            SELECT * FROM $table 
            WHERE status = 'pending' 
            ORDER BY priority = 'high' DESC, priority = 'medium' DESC, days_until_stockout ASC
        ");
    }
    
    /**
     * Show admin notices for reorder suggestions
     */
    public function show_admin_notices() {
        $screen = get_current_screen();
        if ($screen->id !== 'dashboard' && $screen->id !== 'edit-product') {
            return;
        }
        
        $suggestions = $this->get_pending_suggestions();
        if (empty($suggestions)) {
            return;
        }
        
        $high_priority = array_filter($suggestions, function($s) { return $s->priority === 'high'; });
        
        if (!empty($high_priority)) {
            ?>
            <div class="notice notice-error is-dismissible">
                <h3><?php esc_html_e('Urgent: Stock Running Low!', 'lujo-backend'); ?></h3>
                <p><?php echo sprintf(esc_html__('You have %d products that need immediate restocking:', 'lujo-backend'), count($high_priority)); ?></p>
                <ul>
                    <?php foreach ($high_priority as $suggestion): ?>
                        <?php $product = wc_get_product($suggestion->product_id); ?>
                        <li>
                            <strong><?php echo esc_html($product->get_name()); ?></strong> - 
                            <?php echo sprintf(esc_html__('Only %d days of stock remaining. Suggested reorder: %d units', 'lujo-backend'), 
                                $suggestion->days_until_stockout, 
                                $suggestion->suggested_reorder_quantity); ?>
                            <a href="<?php echo esc_url(admin_url('post.php?post=' . $suggestion->product_id . '&action=edit')); ?>" 
                               class="button button-small"><?php esc_html_e('Edit Product', 'lujo-backend'); ?></a>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=lujo-reorder-suggestions')); ?>" 
                       class="button button-primary"><?php esc_html_e('View All Suggestions', 'lujo-backend'); ?></a>
                </p>
            </div>
            <?php
        }
    }
    
    /**
     * AJAX dismiss suggestion
     */
    public function ajax_dismiss_suggestion() {
        check_ajax_referer('lujo_reorder_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
        }
        
        $suggestion_id = intval($_POST['suggestion_id']);
        
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_reorder_suggestions';
        
        $wpdb->update(
            $table,
            array('status' => 'dismissed'),
            array('id' => $suggestion_id)
        );
        
        wp_send_json_success(array('message' => 'Suggestion dismissed'));
    }
    
    /**
     * Send admin notification
     */
    private function send_admin_notification($suggestions) {
        $admin_email = get_option('admin_email');
        $high_priority = array_filter($suggestions, function($s) { return $s['priority'] === 'high'; });
        
        if (empty($high_priority)) {
            return;
        }
        
        $subject = sprintf('[LUJO] Urgent: %d Products Need Restocking', count($high_priority));
        
        $message = "The following products are running low on stock:\n\n";
        
        foreach ($high_priority as $suggestion) {
            $product = wc_get_product($suggestion['product_id']);
            $message .= sprintf(
                "- %s: %d days until stockout (Current: %d, Suggested reorder: %d)\n",
                $product->get_name(),
                $suggestion['days_until_stockout'],
                $suggestion['current_stock'],
                $suggestion['suggested_reorder_quantity']
            );
        }
        
        $message .= "\nPlease review and restock as needed.\n\n";
        $message .= "View all suggestions: " . admin_url('admin.php?page=lujo-reorder-suggestions');
        
        wp_mail($admin_email, $subject, $message);
    }
}
