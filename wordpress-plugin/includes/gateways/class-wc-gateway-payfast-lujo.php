<?php
/**
 * PayFast Payment Gateway for LUJO
 */

if (!defined('ABSPATH')) {
    exit;
}

class WC_Gateway_PayFast_LUJO extends WC_Payment_Gateway {
    
    public function __construct() {
        $this->id = 'payfast_lujo';
        $this->method_title = __('PayFast (LUJO)', 'lujo-backend');
        $this->method_description = __('Accept payments via PayFast - South African payment gateway', 'lujo-backend');
        $this->has_fields = false;
        
        $this->init_form_fields();
        $this->init_settings();
        
        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');
        $this->merchant_id = $this->get_option('merchant_id');
        $this->merchant_key = $this->get_option('merchant_key');
        $this->passphrase = $this->get_option('passphrase');
        $this->testmode = 'yes' === $this->get_option('testmode');
        
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action('woocommerce_api_wc_gateway_payfast_lujo', array($this, 'check_payfast_response'));
    }
    
    /**
     * Initialize form fields
     */
    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title' => __('Enable/Disable', 'lujo-backend'),
                'type' => 'checkbox',
                'label' => __('Enable PayFast Payment', 'lujo-backend'),
                'default' => 'no'
            ),
            'title' => array(
                'title' => __('Title', 'lujo-backend'),
                'type' => 'text',
                'description' => __('Payment method title shown to customers', 'lujo-backend'),
                'default' => __('PayFast', 'lujo-backend'),
                'desc_tip' => true
            ),
            'description' => array(
                'title' => __('Description', 'lujo-backend'),
                'type' => 'textarea',
                'description' => __('Payment method description shown to customers', 'lujo-backend'),
                'default' => __('Pay securely with PayFast - South Africa\'s leading payment gateway', 'lujo-backend'),
                'desc_tip' => true
            ),
            'merchant_id' => array(
                'title' => __('Merchant ID', 'lujo-backend'),
                'type' => 'text',
                'description' => __('Your PayFast Merchant ID', 'lujo-backend'),
                'default' => '',
                'desc_tip' => true
            ),
            'merchant_key' => array(
                'title' => __('Merchant Key', 'lujo-backend'),
                'type' => 'text',
                'description' => __('Your PayFast Merchant Key', 'lujo-backend'),
                'default' => '',
                'desc_tip' => true
            ),
            'passphrase' => array(
                'title' => __('Passphrase', 'lujo-backend'),
                'type' => 'password',
                'description' => __('Your PayFast Passphrase (for security)', 'lujo-backend'),
                'default' => '',
                'desc_tip' => true
            ),
            'testmode' => array(
                'title' => __('Test Mode', 'lujo-backend'),
                'type' => 'checkbox',
                'label' => __('Enable Test Mode', 'lujo-backend'),
                'default' => 'yes',
                'description' => __('Use PayFast sandbox for testing', 'lujo-backend')
            )
        );
    }
    
    /**
     * Process payment
     */
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        
        $payfast_url = $this->testmode ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
        
        $data = array(
            'merchant_id' => $this->merchant_id,
            'merchant_key' => $this->merchant_key,
            'return_url' => $this->get_return_url($order),
            'cancel_url' => $order->get_cancel_order_url(),
            'notify_url' => WC()->api_request_url('WC_Gateway_PayFast_LUJO'),
            'name_first' => $order->get_billing_first_name(),
            'name_last' => $order->get_billing_last_name(),
            'email_address' => $order->get_billing_email(),
            'm_payment_id' => $order_id,
            'amount' => number_format($order->get_total(), 2, '.', ''),
            'item_name' => sprintf(__('Order #%s', 'lujo-backend'), $order->get_order_number()),
            'item_description' => sprintf(__('Payment for order #%s', 'lujo-backend'), $order->get_order_number())
        );
        
        // Generate signature
        $signature = $this->generate_signature($data, $this->passphrase);
        $data['signature'] = $signature;
        
        // Build query string
        $query_string = http_build_query($data);
        
        return array(
            'result' => 'success',
            'redirect' => $payfast_url . '?' . $query_string
        );
    }
    
    /**
     * Generate PayFast signature
     */
    private function generate_signature($data, $passphrase = null) {
        // Create parameter string
        $pfOutput = '';
        foreach ($data as $key => $val) {
            if ($key !== 'signature') {
                $pfOutput .= $key . '=' . urlencode(trim($val)) . '&';
            }
        }
        
        // Remove last ampersand
        $getString = substr($pfOutput, 0, -1);
        
        if ($passphrase !== null) {
            $getString .= '&passphrase=' . urlencode(trim($passphrase));
        }
        
        return md5($getString);
    }
    
    /**
     * Check PayFast response (IPN)
     */
    public function check_payfast_response() {
        $posted = wp_unslash($_POST);
        
        // Verify signature
        $signature = $posted['signature'];
        unset($posted['signature']);
        
        $calculated_signature = $this->generate_signature($posted, $this->passphrase);
        
        if ($signature !== $calculated_signature) {
            wp_die('Invalid signature', 'PayFast IPN', array('response' => 400));
        }
        
        // Get order
        $order_id = intval($posted['m_payment_id']);
        $order = wc_get_order($order_id);
        
        if (!$order) {
            wp_die('Order not found', 'PayFast IPN', array('response' => 404));
        }
        
        // Check payment status
        if ($posted['payment_status'] === 'COMPLETE') {
            $order->payment_complete($posted['pf_payment_id']);
            $order->add_order_note(sprintf(__('PayFast payment completed. Transaction ID: %s', 'lujo-backend'), $posted['pf_payment_id']));
        } else {
            $order->update_status('failed', sprintf(__('PayFast payment failed: %s', 'lujo-backend'), $posted['payment_status']));
        }
        
        exit;
    }
}
