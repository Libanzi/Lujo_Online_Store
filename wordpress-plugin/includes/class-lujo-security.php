<?php
/**
 * LUJO Security
 * 
 * Handles security features including rate limiting and input validation
 */

if (!defined('ABSPATH')) {
    exit;
}

class LUJO_Security {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Add security headers
        add_action('send_headers', array($this, 'add_security_headers'));
        
        // Sanitize WordPress content
        add_filter('the_content', array($this, 'sanitize_content'), 999);
    }
    
    /**
     * Add security headers
     */
    public function add_security_headers() {
        if (!is_admin()) {
            header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('X-XSS-Protection: 1; mode=block');
        }
    }
    
    /**
     * Sanitize content
     */
    public function sanitize_content($content) {
        return wp_kses_post($content);
    }
    
    /**
     * Validate email
     */
    public function validate_email($email) {
        return is_email($email);
    }
    
    /**
     * Validate phone
     */
    public function validate_phone($phone) {
        return preg_match('/^[0-9\s\+\-\(\)]+$/', $phone);
    }
    
    /**
     * Generate secure token
     */
    public function generate_token($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Hash password
     */
    public function hash_password($password) {
        return wp_hash_password($password);
    }
    
    /**
     * Verify password
     */
    public function verify_password($password, $hash) {
        return wp_check_password($password, $hash);
    }
}
