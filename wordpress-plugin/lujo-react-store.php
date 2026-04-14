<?php
/**
 * Plugin Name: LUJO React Store
 * Plugin URI: https://your-site.com
 * Description: Embeds the LUJO React e-commerce application within WordPress
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://your-site.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: lujo-react-store
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('LUJO_REACT_STORE_VERSION', '1.0.0');
define('LUJO_REACT_STORE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LUJO_REACT_STORE_PLUGIN_URL', plugin_dir_url(__FILE__));

// Your React app build URL (update this after building your React app)
define('LUJO_REACT_APP_URL', 'https://your-react-app-url.com');

class LUJO_React_Store {
    
    public function __construct() {
        add_action('init', array($this, 'register_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    /**
     * Register the [lujo-store] shortcode
     */
    public function register_shortcode() {
        add_shortcode('lujo-store', array($this, 'render_store'));
    }
    
    /**
     * Enqueue React app scripts and styles
     */
    public function enqueue_scripts() {
        // Only load on pages that have the shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'lujo-store')) {
            // Enqueue React app CSS (update path after build)
            wp_enqueue_style(
                'lujo-react-store-css',
                LUJO_REACT_APP_URL . '/assets/index.css',
                array(),
                LUJO_REACT_STORE_VERSION
            );
            
            // Enqueue React app JS (update path after build)
            wp_enqueue_script(
                'lujo-react-store-js',
                LUJO_REACT_APP_URL . '/assets/index.js',
                array(),
                LUJO_REACT_STORE_VERSION,
                true
            );
            
            // Pass WordPress data to React app
            wp_localize_script('lujo-react-store-js', 'lujoWPData', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('lujo-react-store'),
                'currentUser' => wp_get_current_user()->ID,
                'siteUrl' => get_site_url(),
            ));
        }
    }
    
    /**
     * Render the React app container
     */
    public function render_store($atts) {
        $atts = shortcode_atts(array(
            'page' => 'home',
        ), $atts);
        
        ob_start();
        ?>
        <div id="lujo-react-root" data-page="<?php echo esc_attr($atts['page']); ?>">
            <!-- React app will mount here -->
            <div style="text-align: center; padding: 40px;">
                Loading LUJO Store...
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Initialize the plugin
new LUJO_React_Store();

/**
 * Activation hook
 */
function lujo_react_store_activate() {
    // Flush rewrite rules on activation
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'lujo_react_store_activate');

/**
 * Deactivation hook
 */
function lujo_react_store_deactivate() {
    // Clean up if needed
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'lujo_react_store_deactivate');
