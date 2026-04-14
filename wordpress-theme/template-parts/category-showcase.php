<?php
/**
 * Category Showcase Template Part
 * 
 * @package Lujo_Store
 */

if (!class_exists('WooCommerce')) {
    return;
}

// Get product categories
$args = array(
    'taxonomy' => 'product_cat',
    'hide_empty' => true,
    'number' => 4,
    'orderby' => 'count',
    'order' => 'DESC',
);

$categories = get_terms($args);

if (empty($categories) || is_wp_error($categories)) {
    return;
}
?>

<section class="category-showcase py-16" style="background-color: hsl(var(--background));">
    <div class="container">
        
        <div class="section-header text-center mb-4">
            <h2 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; margin-bottom: 1rem;">
                <?php esc_html_e('Shop by Category', 'lujo-store'); ?>
            </h2>
            <p style="font-size: 1.125rem; color: hsl(var(--muted-foreground)); max-width: 600px; margin: 0 auto;">
                <?php esc_html_e('Explore our curated collections', 'lujo-store'); ?>
            </p>
        </div>

        <div class="categories-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 3rem;">
            
            <?php foreach ($categories as $category) : 
                $thumbnail_id = get_term_meta($category->term_id, 'thumbnail_id', true);
                $image_url = $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : wc_placeholder_img_src();
                $category_link = get_term_link($category);
            ?>
            
            <a href="<?php echo esc_url($category_link); ?>" class="category-card" style="text-decoration: none; color: inherit;">
                <div class="category-card-inner" style="position: relative; border-radius: 1rem; overflow: hidden; background-color: hsl(var(--card)); border: 1px solid hsl(var(--border)); transition: all 0.3s ease; cursor: pointer;">
                    
                    <div class="category-image" style="position: relative; aspect-ratio: 4/3; overflow: hidden;">
                        <img src="<?php echo esc_url($image_url); ?>" 
                             alt="<?php echo esc_attr($category->name); ?>"
                             style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);"></div>
                    </div>
                    
                    <div class="category-content" style="padding: 1.5rem;">
                        <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">
                            <?php echo esc_html($category->name); ?>
                        </h3>
                        <?php if ($category->description) : ?>
                            <p style="color: hsl(var(--muted-foreground)); margin-bottom: 0.75rem; line-height: 1.6;">
                                <?php echo esc_html(wp_trim_words($category->description, 15)); ?>
                            </p>
                        <?php endif; ?>
                        <span style="color: hsl(var(--luxury-gold)); font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem;">
                            <?php esc_html_e('Explore', 'lujo-store'); ?>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </span>
                    </div>
                    
                </div>
            </a>
            
            <?php endforeach; ?>
            
        </div>
        
    </div>
</section>

<style>
.category-card:hover .category-card-inner {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.category-card:hover .category-image img {
    transform: scale(1.05);
}

@media (max-width: 768px) {
    .categories-grid {
        grid-template-columns: 1fr;
    }
}
</style>
