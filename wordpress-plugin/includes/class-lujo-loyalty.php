<?php
/**
 * LUJO Loyalty Program
 * 
 * Handles customer loyalty points, tiers, and rewards
 */

if (!defined('ABSPATH')) {
    exit;
}

class LUJO_Loyalty {
    
    private static $instance = null;
    
    private $tiers = array(
        'Bronze' => array(
            'min_points' => 0,
            'multiplier' => 1.0,
            'discount' => 0,
            'benefits' => array('Earn 1 point per R10 spent')
        ),
        'Silver' => array(
            'min_points' => 500,
            'multiplier' => 1.5,
            'discount' => 5,
            'benefits' => array('Earn 1.5 points per R10 spent', '5% discount on all orders')
        ),
        'Gold' => array(
            'min_points' => 2000,
            'multiplier' => 2.0,
            'discount' => 10,
            'benefits' => array('Earn 2 points per R10 spent', '10% discount on all orders', 'Free shipping')
        ),
        'Platinum' => array(
            'min_points' => 5000,
            'multiplier' => 3.0,
            'discount' => 15,
            'benefits' => array('Earn 3 points per R10 spent', '15% discount on all orders', 'Free shipping', 'Priority support')
        )
    );
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('woocommerce_order_status_completed', array($this, 'process_loyalty_points'), 10, 1);
        add_action('woocommerce_checkout_create_order', array($this, 'apply_loyalty_discount'), 10, 2);
        add_action('wp_ajax_lujo_redeem_points', array($this, 'ajax_redeem_points'));
        add_shortcode('lujo_loyalty_dashboard', array($this, 'render_loyalty_dashboard'));
    }
    
    /**
     * Get user loyalty data
     */
    public function get_user_loyalty($user_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_loyalty_points';
        
        $loyalty = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d",
            $user_id
        ));
        
        if (!$loyalty) {
            // Create new loyalty record
            $wpdb->insert($table, array(
                'user_id' => $user_id,
                'current_points' => 0,
                'lifetime_points' => 0,
                'tier' => 'Bronze'
            ));
            
            return $this->get_user_loyalty($user_id);
        }
        
        return $loyalty;
    }
    
    /**
     * Process loyalty points when order is completed
     */
    public function process_loyalty_points($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        
        $user_id = $order->get_user_id();
        if (!$user_id) {
            return;
        }
        
        // Check if points already processed
        if ($order->get_meta('_loyalty_points_processed')) {
            return;
        }
        
        $loyalty = $this->get_user_loyalty($user_id);
        $tier_data = $this->tiers[$loyalty->tier];
        
        // Calculate points: 1 point per R10, multiplied by tier multiplier
        $order_total = $order->get_total();
        $points_earned = floor(($order_total / 10) * $tier_data['multiplier']);
        
        // Update loyalty points
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_loyalty_points';
        
        $new_current_points = $loyalty->current_points + $points_earned;
        $new_lifetime_points = $loyalty->lifetime_points + $points_earned;
        
        // Check for tier upgrade
        $new_tier = $this->calculate_tier($new_lifetime_points);
        
        $wpdb->update(
            $table,
            array(
                'current_points' => $new_current_points,
                'lifetime_points' => $new_lifetime_points,
                'tier' => $new_tier
            ),
            array('user_id' => $user_id)
        );
        
        // Record transaction
        $this->record_transaction($user_id, $order_id, $points_earned, 'earned', 
            sprintf('Earned %d points from order #%s', $points_earned, $order->get_order_number()));
        
        // Mark as processed
        $order->update_meta_data('_loyalty_points_processed', true);
        $order->update_meta_data('_loyalty_points_earned', $points_earned);
        $order->save();
        
        // Send notification if tier upgraded
        if ($new_tier !== $loyalty->tier) {
            $this->send_tier_upgrade_email($user_id, $new_tier);
        }
    }
    
    /**
     * Calculate tier based on lifetime points
     */
    private function calculate_tier($lifetime_points) {
        foreach (array_reverse($this->tiers, true) as $tier => $data) {
            if ($lifetime_points >= $data['min_points']) {
                return $tier;
            }
        }
        return 'Bronze';
    }
    
    /**
     * Record loyalty transaction
     */
    private function record_transaction($user_id, $order_id, $points, $type, $description) {
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_loyalty_transactions';
        
        $wpdb->insert($table, array(
            'user_id' => $user_id,
            'order_id' => $order_id,
            'points' => $points,
            'transaction_type' => $type,
            'description' => $description
        ));
    }
    
    /**
     * Apply loyalty discount at checkout
     */
    public function apply_loyalty_discount($order, $data) {
        $user_id = $order->get_user_id();
        if (!$user_id) {
            return;
        }
        
        $loyalty = $this->get_user_loyalty($user_id);
        $tier_data = $this->tiers[$loyalty->tier];
        
        if ($tier_data['discount'] > 0) {
            $discount_amount = ($order->get_subtotal() * $tier_data['discount']) / 100;
            $order->add_item(new WC_Order_Item_Fee(array(
                'name' => sprintf('%s Tier Discount (%d%%)', $loyalty->tier, $tier_data['discount']),
                'total' => -$discount_amount,
                'tax_class' => '',
            )));
        }
    }
    
    /**
     * AJAX redeem points
     */
    public function ajax_redeem_points() {
        check_ajax_referer('lujo_loyalty_nonce', 'nonce');
        
        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(array('message' => 'User not logged in'));
        }
        
        $points_to_redeem = intval($_POST['points']);
        if ($points_to_redeem < 100) {
            wp_send_json_error(array('message' => 'Minimum 100 points required for redemption'));
        }
        
        $loyalty = $this->get_user_loyalty($user_id);
        if ($loyalty->current_points < $points_to_redeem) {
            wp_send_json_error(array('message' => 'Insufficient points'));
        }
        
        // Generate coupon: 100 points = R10
        $coupon_amount = $points_to_redeem / 10;
        $coupon_code = 'LOYALTY_' . strtoupper(wp_generate_password(8, false));
        
        $coupon = new WC_Coupon();
        $coupon->set_code($coupon_code);
        $coupon->set_amount($coupon_amount);
        $coupon->set_discount_type('fixed_cart');
        $coupon->set_individual_use(true);
        $coupon->set_usage_limit(1);
        $coupon->set_usage_limit_per_user(1);
        $coupon->set_date_expires(strtotime('+30 days'));
        $coupon->save();
        
        // Deduct points
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_loyalty_points';
        $wpdb->update(
            $table,
            array('current_points' => $loyalty->current_points - $points_to_redeem),
            array('user_id' => $user_id)
        );
        
        // Record transaction
        $this->record_transaction($user_id, null, -$points_to_redeem, 'redeemed', 
            sprintf('Redeemed %d points for R%s coupon: %s', $points_to_redeem, $coupon_amount, $coupon_code));
        
        wp_send_json_success(array(
            'message' => 'Points redeemed successfully',
            'coupon_code' => $coupon_code,
            'coupon_amount' => $coupon_amount
        ));
    }
    
    /**
     * Render loyalty dashboard shortcode
     */
    public function render_loyalty_dashboard() {
        if (!is_user_logged_in()) {
            return '<p>Please log in to view your loyalty dashboard.</p>';
        }
        
        $user_id = get_current_user_id();
        $loyalty = $this->get_user_loyalty($user_id);
        $tier_data = $this->tiers[$loyalty->tier];
        
        // Get recent transactions
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_loyalty_transactions';
        $transactions = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY created_at DESC LIMIT 10",
            $user_id
        ));
        
        ob_start();
        ?>
        <div class="lujo-loyalty-dashboard">
            <div class="loyalty-summary">
                <h2>Your Loyalty Status</h2>
                <div class="loyalty-tier <?php echo esc_attr(strtolower($loyalty->tier)); ?>">
                    <span class="tier-badge"><?php echo esc_html($loyalty->tier); ?> Tier</span>
                    <span class="tier-discount"><?php echo esc_html($tier_data['discount']); ?>% Discount</span>
                </div>
                <div class="loyalty-points">
                    <div class="points-card">
                        <h3>Current Points</h3>
                        <p class="points-value"><?php echo esc_html($loyalty->current_points); ?></p>
                    </div>
                    <div class="points-card">
                        <h3>Lifetime Points</h3>
                        <p class="points-value"><?php echo esc_html($loyalty->lifetime_points); ?></p>
                    </div>
                </div>
                <div class="loyalty-benefits">
                    <h3>Your Benefits</h3>
                    <ul>
                        <?php foreach ($tier_data['benefits'] as $benefit): ?>
                            <li><?php echo esc_html($benefit); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
            
            <div class="loyalty-redeem">
                <h3>Redeem Points</h3>
                <p>100 points = R10 coupon</p>
                <form id="lujo-redeem-form">
                    <input type="number" name="points" min="100" step="100" placeholder="Points to redeem" required>
                    <button type="submit">Redeem</button>
                </form>
                <div id="redeem-message"></div>
            </div>
            
            <div class="loyalty-transactions">
                <h3>Recent Activity</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Points</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($transactions as $transaction): ?>
                            <tr>
                                <td><?php echo esc_html(date('Y-m-d', strtotime($transaction->created_at))); ?></td>
                                <td><?php echo esc_html($transaction->transaction_type); ?></td>
                                <td class="<?php echo $transaction->points > 0 ? 'positive' : 'negative'; ?>">
                                    <?php echo esc_html($transaction->points > 0 ? '+' : ''); ?><?php echo esc_html($transaction->points); ?>
                                </td>
                                <td><?php echo esc_html($transaction->description); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#lujo-redeem-form').on('submit', function(e) {
                e.preventDefault();
                
                $.ajax({
                    url: '<?php echo admin_url('admin-ajax.php'); ?>',
                    type: 'POST',
                    data: {
                        action: 'lujo_redeem_points',
                        nonce: '<?php echo wp_create_nonce('lujo_loyalty_nonce'); ?>',
                        points: $('input[name="points"]').val()
                    },
                    success: function(response) {
                        if (response.success) {
                            $('#redeem-message').html('<div class="success">Your coupon code: <strong>' + response.data.coupon_code + '</strong></div>');
                            setTimeout(function() { location.reload(); }, 2000);
                        } else {
                            $('#redeem-message').html('<div class="error">' + response.data.message + '</div>');
                        }
                    }
                });
            });
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Send tier upgrade email
     */
    private function send_tier_upgrade_email($user_id, $new_tier) {
        $user = get_userdata($user_id);
        $tier_data = $this->tiers[$new_tier];
        
        $subject = sprintf('Congratulations! You\'ve reached %s Tier', $new_tier);
        $message = sprintf(
            "Hi %s,\n\nCongratulations! You've been upgraded to %s tier in our loyalty program.\n\nYour new benefits:\n%s\n\nThank you for being a valued customer!\n\nBest regards,\nLUJO Store",
            $user->display_name,
            $new_tier,
            implode("\n", $tier_data['benefits'])
        );
        
        wp_mail($user->user_email, $subject, $message);
    }
}
