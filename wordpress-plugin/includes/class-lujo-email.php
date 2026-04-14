<?php
/**
 * LUJO Email Handler
 * 
 * Handles email sending with rate limiting
 */

if (!defined('ABSPATH')) {
    exit;
}

class LUJO_Email {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Email rate limit cleanup cron
        if (!wp_next_scheduled('lujo_cleanup_email_limits')) {
            wp_schedule_event(time(), 'daily', 'lujo_cleanup_email_limits');
        }
        
        add_action('lujo_cleanup_email_limits', array($this, 'cleanup_old_email_limits'));
    }
    
    /**
     * Check email rate limit
     */
    public function check_rate_limit($user_id, $email_type, $max_per_hour = 5, $max_per_day = 20) {
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_email_rate_limits';
        
        // Count emails sent in last hour
        $count_hour = $wpdb->get_var($wpdb->prepare("
            SELECT COUNT(*) FROM $table 
            WHERE user_id = %d 
            AND email_type = %s 
            AND sent_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ", $user_id, $email_type));
        
        if ($count_hour >= $max_per_hour) {
            return false;
        }
        
        // Count emails sent in last 24 hours
        $count_day = $wpdb->get_var($wpdb->prepare("
            SELECT COUNT(*) FROM $table 
            WHERE user_id = %d 
            AND email_type = %s 
            AND sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ", $user_id, $email_type));
        
        if ($count_day >= $max_per_day) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Record email send
     */
    public function record_email_send($user_id, $email_type, $recipient_email) {
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_email_rate_limits';
        
        $wpdb->insert($table, array(
            'user_id' => $user_id,
            'email_type' => $email_type,
            'recipient_email' => $recipient_email
        ));
    }
    
    /**
     * Send email with rate limiting
     */
    public function send_email($to, $subject, $message, $user_id, $email_type) {
        // Check rate limit
        if (!$this->check_rate_limit($user_id, $email_type)) {
            return new WP_Error('rate_limit', 'Email rate limit exceeded');
        }
        
        // Send email
        $result = wp_mail($to, $subject, $message);
        
        if ($result) {
            // Record send
            $this->record_email_send($user_id, $email_type, $to);
        }
        
        return $result;
    }
    
    /**
     * Cleanup old email rate limits
     */
    public function cleanup_old_email_limits() {
        global $wpdb;
        $table = $wpdb->prefix . 'lujo_email_rate_limits';
        
        $wpdb->query("DELETE FROM $table WHERE sent_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");
    }
}
