<?php
/**
 * LUJO Admin
 * 
 * Handles admin dashboard, settings, and monitoring
 */

if (!defined('ABSPATH')) {
    exit;
}

class LUJO_Admin {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('LUJO Backend', 'lujo-backend'),
            __('LUJO Backend', 'lujo-backend'),
            'manage_woocommerce',
            'lujo-backend',
            array($this, 'render_dashboard'),
            'dashicons-store',
            56
        );
        
        add_submenu_page(
            'lujo-backend',
            __('Dashboard', 'lujo-backend'),
            __('Dashboard', 'lujo-backend'),
            'manage_woocommerce',
            'lujo-backend',
            array($this, 'render_dashboard')
        );
        
        add_submenu_page(
            'lujo-backend',
            __('Loyalty Program', 'lujo-backend'),
            __('Loyalty Program', 'lujo-backend'),
            'manage_woocommerce',
            'lujo-loyalty',
            array($this, 'render_loyalty_page')
        );
        
        add_submenu_page(
            'lujo-backend',
            __('Reorder Suggestions', 'lujo-backend'),
            __('Reorder Suggestions', 'lujo-backend'),
            'manage_woocommerce',
            'lujo-reorder-suggestions',
            array($this, 'render_reorder_page')
        );
        
        add_submenu_page(
            'lujo-backend',
            __('Function Logs', 'lujo-backend'),
            __('Function Logs', 'lujo-backend'),
            'manage_woocommerce',
            'lujo-function-logs',
            array($this, 'render_logs_page')
        );
        
        add_submenu_page(
            'lujo-backend',
            __('Settings', 'lujo-backend'),
            __('Settings', 'lujo-backend'),
            'manage_options',
            'lujo-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'lujo-') === false) {
            return;
        }
        
        wp_enqueue_style('lujo-admin', LUJO_BACKEND_PLUGIN_URL . 'assets/css/admin.css', array(), LUJO_BACKEND_VERSION);
        wp_enqueue_script('lujo-admin', LUJO_BACKEND_PLUGIN_URL . 'assets/js/admin.js', array('jquery'), LUJO_BACKEND_VERSION, true);
        
        wp_localize_script('lujo-admin', 'lujoAdmin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lujo_admin_nonce')
        ));
    }
    
    /**
     * Render dashboard
     */
    public function render_dashboard() {
        global $wpdb;
        
        // Get statistics
        $loyalty_table = $wpdb->prefix . 'lujo_loyalty_points';
        $reorder_table = $wpdb->prefix . 'lujo_reorder_suggestions';
        
        $total_customers = $wpdb->get_var("SELECT COUNT(*) FROM $loyalty_table");
        $total_points_issued = $wpdb->get_var("SELECT SUM(lifetime_points) FROM $loyalty_table");
        $pending_reorders = $wpdb->get_var("SELECT COUNT(*) FROM $reorder_table WHERE status = 'pending'");
        $high_priority_reorders = $wpdb->get_var("SELECT COUNT(*) FROM $reorder_table WHERE status = 'pending' AND priority = 'high'");
        
        ?>
        <div class="wrap lujo-dashboard">
            <h1><?php esc_html_e('LUJO Backend Dashboard', 'lujo-backend'); ?></h1>
            
            <div class="lujo-stats">
                <div class="stat-card">
                    <h3><?php esc_html_e('Loyalty Customers', 'lujo-backend'); ?></h3>
                    <p class="stat-value"><?php echo esc_html(number_format($total_customers)); ?></p>
                </div>
                
                <div class="stat-card">
                    <h3><?php esc_html_e('Total Points Issued', 'lujo-backend'); ?></h3>
                    <p class="stat-value"><?php echo esc_html(number_format($total_points_issued)); ?></p>
                </div>
                
                <div class="stat-card">
                    <h3><?php esc_html_e('Pending Reorders', 'lujo-backend'); ?></h3>
                    <p class="stat-value"><?php echo esc_html(number_format($pending_reorders)); ?></p>
                </div>
                
                <div class="stat-card <?php echo $high_priority_reorders > 0 ? 'urgent' : ''; ?>">
                    <h3><?php esc_html_e('High Priority Reorders', 'lujo-backend'); ?></h3>
                    <p class="stat-value"><?php echo esc_html(number_format($high_priority_reorders)); ?></p>
                </div>
            </div>
            
            <div class="lujo-quick-actions">
                <h2><?php esc_html_e('Quick Actions', 'lujo-backend'); ?></h2>
                <a href="<?php echo esc_url(admin_url('admin.php?page=lujo-reorder-suggestions')); ?>" class="button button-primary">
                    <?php esc_html_e('View Reorder Suggestions', 'lujo-backend'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('admin.php?page=lujo-loyalty')); ?>" class="button">
                    <?php esc_html_e('Manage Loyalty Program', 'lujo-backend'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('admin.php?page=lujo-function-logs')); ?>" class="button">
                    <?php esc_html_e('View Function Logs', 'lujo-backend'); ?>
                </a>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render loyalty page
     */
    public function render_loyalty_page() {
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_loyalty_points';
        
        $customers = $wpdb->get_results("
            SELECT lp.*, u.user_email, u.display_name 
            FROM $table lp
            INNER JOIN {$wpdb->users} u ON lp.user_id = u.ID
            ORDER BY lp.lifetime_points DESC
            LIMIT 100
        ");
        
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Loyalty Program', 'lujo-backend'); ?></h1>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Customer', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Email', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Tier', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Current Points', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Lifetime Points', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Member Since', 'lujo-backend'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($customers as $customer): ?>
                        <tr>
                            <td><?php echo esc_html($customer->display_name); ?></td>
                            <td><?php echo esc_html($customer->user_email); ?></td>
                            <td><span class="tier-badge <?php echo esc_attr(strtolower($customer->tier)); ?>"><?php echo esc_html($customer->tier); ?></span></td>
                            <td><?php echo esc_html(number_format($customer->current_points)); ?></td>
                            <td><?php echo esc_html(number_format($customer->lifetime_points)); ?></td>
                            <td><?php echo esc_html(date('Y-m-d', strtotime($customer->created_at))); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
    
    /**
     * Render reorder page
     */
    public function render_reorder_page() {
        $reorder = LUJO_Reorder::get_instance();
        $suggestions = $reorder->get_pending_suggestions();
        
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Reorder Suggestions', 'lujo-backend'); ?></h1>
            
            <p>
                <button id="lujo-generate-suggestions" class="button button-primary">
                    <?php esc_html_e('Generate New Suggestions', 'lujo-backend'); ?>
                </button>
            </p>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Priority', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Product', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Current Stock', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Days Until Stockout', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Suggested Reorder Qty', 'lujo-backend'); ?></th>
                        <th><?php esc_html_e('Actions', 'lujo-backend'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($suggestions as $suggestion): ?>
                        <?php $product = wc_get_product($suggestion->product_id); ?>
                        <tr class="priority-<?php echo esc_attr($suggestion->priority); ?>">
                            <td><span class="priority-badge <?php echo esc_attr($suggestion->priority); ?>"><?php echo esc_html(ucfirst($suggestion->priority)); ?></span></td>
                            <td>
                                <a href="<?php echo esc_url(admin_url('post.php?post=' . $suggestion->product_id . '&action=edit')); ?>">
                                    <?php echo esc_html($product->get_name()); ?>
                                </a>
                            </td>
                            <td><?php echo esc_html($suggestion->current_stock); ?></td>
                            <td><?php echo esc_html($suggestion->days_until_stockout); ?> days</td>
                            <td><?php echo esc_html($suggestion->suggested_reorder_quantity); ?></td>
                            <td>
                                <a href="<?php echo esc_url(admin_url('post.php?post=' . $suggestion->product_id . '&action=edit')); ?>" class="button button-small">
                                    <?php esc_html_e('Edit Product', 'lujo-backend'); ?>
                                </a>
                                <button class="button button-small lujo-dismiss-suggestion" data-id="<?php echo esc_attr($suggestion->id); ?>">
                                    <?php esc_html_e('Dismiss', 'lujo-backend'); ?>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#lujo-generate-suggestions').on('click', function() {
                var button = $(this);
                button.prop('disabled', true).text('Generating...');
                
                $.post(ajaxurl, {
                    action: 'lujo_generate_reorder_suggestions',
                    nonce: '<?php echo wp_create_nonce('lujo_admin_nonce'); ?>'
                }, function() {
                    location.reload();
                });
            });
            
            $('.lujo-dismiss-suggestion').on('click', function() {
                var button = $(this);
                var suggestionId = button.data('id');
                
                $.post(ajaxurl, {
                    action: 'lujo_dismiss_suggestion',
                    nonce: '<?php echo wp_create_nonce('lujo_reorder_nonce'); ?>',
                    suggestion_id: suggestionId
                }, function() {
                    button.closest('tr').fadeOut();
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * Render logs page
     */
    public function render_logs_page() {
        // TODO: Implement function logs viewing
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Function Logs', 'lujo-backend'); ?></h1>
            <p><?php esc_html_e('Function logging will be displayed here.', 'lujo-backend'); ?></p>
        </div>
        <?php
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (isset($_POST['lujo_save_settings'])) {
            check_admin_referer('lujo_settings_nonce');
            
            update_option('lujo_loyalty_enabled', isset($_POST['loyalty_enabled']));
            update_option('lujo_reorder_enabled', isset($_POST['reorder_enabled']));
            
            echo '<div class="notice notice-success"><p>' . esc_html__('Settings saved.', 'lujo-backend') . '</p></div>';
        }
        
        $loyalty_enabled = get_option('lujo_loyalty_enabled', true);
        $reorder_enabled = get_option('lujo_reorder_enabled', true);
        
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('LUJO Backend Settings', 'lujo-backend'); ?></h1>
            
            <form method="post">
                <?php wp_nonce_field('lujo_settings_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php esc_html_e('Loyalty Program', 'lujo-backend'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="loyalty_enabled" value="1" <?php checked($loyalty_enabled); ?>>
                                <?php esc_html_e('Enable loyalty program', 'lujo-backend'); ?>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php esc_html_e('Reorder Suggestions', 'lujo-backend'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="reorder_enabled" value="1" <?php checked($reorder_enabled); ?>>
                                <?php esc_html_e('Enable automated reorder suggestions', 'lujo-backend'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button type="submit" name="lujo_save_settings" class="button button-primary">
                        <?php esc_html_e('Save Settings', 'lujo-backend'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
}
