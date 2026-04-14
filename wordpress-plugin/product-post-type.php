<?php
/**
 * Product Custom Post Type Registration
 * Add this to your WordPress theme's functions.php or as a separate plugin
 */

// Register Product Custom Post Type
function lujo_register_product_cpt() {
    $labels = array(
        'name' => 'Products',
        'singular_name' => 'Product',
        'add_new' => 'Add New Product',
        'add_new_item' => 'Add New Product',
        'edit_item' => 'Edit Product',
        'new_item' => 'New Product',
        'view_item' => 'View Product',
        'search_items' => 'Search Products',
        'not_found' => 'No products found',
        'not_found_in_trash' => 'No products found in trash',
        'menu_name' => 'LUJO Products'
    );

    $args = array(
        'labels' => $labels,
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true, // Critical for REST API access
        'rest_base' => 'lujo-products',
        'rest_controller_class' => 'WP_REST_Posts_Controller',
        'menu_icon' => 'dashicons-cart',
        'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt'),
        'rewrite' => array('slug' => 'products'),
        'capability_type' => 'post',
        'show_in_menu' => true,
    );

    register_post_type('lujo_product', $args);
}
add_action('init', 'lujo_register_product_cpt');

// Register Product Category Taxonomy
function lujo_register_product_taxonomy() {
    $labels = array(
        'name' => 'Product Categories',
        'singular_name' => 'Product Category',
        'search_items' => 'Search Categories',
        'all_items' => 'All Categories',
        'parent_item' => 'Parent Category',
        'parent_item_colon' => 'Parent Category:',
        'edit_item' => 'Edit Category',
        'update_item' => 'Update Category',
        'add_new_item' => 'Add New Category',
        'new_item_name' => 'New Category Name',
        'menu_name' => 'Categories',
    );

    register_taxonomy('lujo_product_category', array('lujo_product'), array(
        'hierarchical' => true,
        'labels' => $labels,
        'show_ui' => true,
        'show_in_rest' => true, // Critical for REST API
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'product-category'),
    ));
}
add_action('init', 'lujo_register_product_taxonomy');

// Add custom meta boxes for product fields
function lujo_add_product_meta_boxes() {
    add_meta_box(
        'lujo_product_details',
        'Product Details',
        'lujo_product_details_callback',
        'lujo_product',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'lujo_add_product_meta_boxes');

// Meta box callback
function lujo_product_details_callback($post) {
    wp_nonce_field('lujo_product_details', 'lujo_product_details_nonce');
    
    $price = get_post_meta($post->ID, '_lujo_price', true);
    $original_price = get_post_meta($post->ID, '_lujo_original_price', true);
    $stock = get_post_meta($post->ID, '_lujo_stock', true);
    $badge = get_post_meta($post->ID, '_lujo_badge', true);
    $is_active = get_post_meta($post->ID, '_lujo_is_active', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="lujo_price">Price (R)</label></th>
            <td><input type="number" step="0.01" id="lujo_price" name="lujo_price" value="<?php echo esc_attr($price); ?>" class="regular-text" required /></td>
        </tr>
        <tr>
            <th><label for="lujo_original_price">Original Price (R)</label></th>
            <td><input type="number" step="0.01" id="lujo_original_price" name="lujo_original_price" value="<?php echo esc_attr($original_price); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="lujo_stock">Stock Quantity</label></th>
            <td><input type="number" id="lujo_stock" name="lujo_stock" value="<?php echo esc_attr($stock ?: '0'); ?>" class="regular-text" required /></td>
        </tr>
        <tr>
            <th><label for="lujo_badge">Badge</label></th>
            <td>
                <select id="lujo_badge" name="lujo_badge">
                    <option value="">None</option>
                    <option value="New" <?php selected($badge, 'New'); ?>>New</option>
                    <option value="Sale" <?php selected($badge, 'Sale'); ?>>Sale</option>
                    <option value="Hot" <?php selected($badge, 'Hot'); ?>>Hot</option>
                    <option value="Featured" <?php selected($badge, 'Featured'); ?>>Featured</option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="lujo_is_active">Active</label></th>
            <td>
                <input type="checkbox" id="lujo_is_active" name="lujo_is_active" value="1" <?php checked($is_active, '1'); ?> />
                <span class="description">Uncheck to hide from store</span>
            </td>
        </tr>
    </table>
    <?php
}

// Save product meta
function lujo_save_product_meta($post_id) {
    if (!isset($_POST['lujo_product_details_nonce']) || 
        !wp_verify_nonce($_POST['lujo_product_details_nonce'], 'lujo_product_details')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if (isset($_POST['lujo_price'])) {
        update_post_meta($post_id, '_lujo_price', sanitize_text_field($_POST['lujo_price']));
    }

    if (isset($_POST['lujo_original_price'])) {
        update_post_meta($post_id, '_lujo_original_price', sanitize_text_field($_POST['lujo_original_price']));
    }

    if (isset($_POST['lujo_stock'])) {
        update_post_meta($post_id, '_lujo_stock', intval($_POST['lujo_stock']));
    }

    if (isset($_POST['lujo_badge'])) {
        update_post_meta($post_id, '_lujo_badge', sanitize_text_field($_POST['lujo_badge']));
    }

    $is_active = isset($_POST['lujo_is_active']) ? '1' : '0';
    update_post_meta($post_id, '_lujo_is_active', $is_active);
}
add_action('save_post_lujo_product', 'lujo_save_product_meta');

// Expose custom fields in REST API
function lujo_register_product_meta_rest() {
    register_rest_field('lujo_product', 'product_meta', array(
        'get_callback' => function($object) {
            return array(
                'price' => get_post_meta($object['id'], '_lujo_price', true),
                'original_price' => get_post_meta($object['id'], '_lujo_original_price', true),
                'stock' => get_post_meta($object['id'], '_lujo_stock', true),
                'badge' => get_post_meta($object['id'], '_lujo_badge', true),
                'is_active' => get_post_meta($object['id'], '_lujo_is_active', true),
            );
        },
        'schema' => array(
            'description' => 'Product metadata',
            'type' => 'object',
        ),
    ));
}
add_action('rest_api_init', 'lujo_register_product_meta_rest');

// Add product columns to admin list
function lujo_product_columns($columns) {
    $new_columns = array();
    $new_columns['cb'] = $columns['cb'];
    $new_columns['title'] = $columns['title'];
    $new_columns['thumbnail'] = 'Image';
    $new_columns['price'] = 'Price';
    $new_columns['stock'] = 'Stock';
    $new_columns['badge'] = 'Badge';
    $new_columns['active'] = 'Active';
    $new_columns['date'] = $columns['date'];
    return $new_columns;
}
add_filter('manage_lujo_product_posts_columns', 'lujo_product_columns');

// Populate custom columns
function lujo_product_column_content($column, $post_id) {
    switch ($column) {
        case 'thumbnail':
            $thumbnail = get_the_post_thumbnail($post_id, array(50, 50));
            echo $thumbnail ?: '—';
            break;
        case 'price':
            $price = get_post_meta($post_id, '_lujo_price', true);
            echo $price ? 'R ' . number_format($price, 2) : '—';
            break;
        case 'stock':
            $stock = get_post_meta($post_id, '_lujo_stock', true);
            echo $stock ?: '0';
            break;
        case 'badge':
            $badge = get_post_meta($post_id, '_lujo_badge', true);
            echo $badge ?: '—';
            break;
        case 'active':
            $is_active = get_post_meta($post_id, '_lujo_is_active', true);
            echo $is_active === '1' ? '✓' : '✗';
            break;
    }
}
add_action('manage_lujo_product_posts_custom_column', 'lujo_product_column_content', 10, 2);
