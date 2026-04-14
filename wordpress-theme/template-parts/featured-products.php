<?php
/**
 * Featured Products Template Part
 * 
 * @package Lujo_Store
 */

if (!class_exists('WooCommerce')) {
    return;
}

$featured_products = lujo_get_featured_products(4);

if (!$featured_products->have_posts()) {
    return;
}
?>

<section class="featured-products py-16" style="background-color: hsl(var(--secondary) / 0.3);">
    <div class="container">
        
        <div class="section-header text-center mb-4">
            <h2 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; margin-bottom: 1rem;">
                <?php esc_html_e('Featured Products', 'lujo-store'); ?>
            </h2>
            <p style="font-size: 1.125rem; color: hsl(var(--muted-foreground)); max-width: 600px; margin: 0 auto;">
                <?php esc_html_e('Handpicked favorites from our collection', 'lujo-store'); ?>
            </p>
        </div>

        <div class="products-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 3rem;">
            
            <?php while ($featured_products->have_posts()) : $featured_products->the_post(); 
                global $product;
            ?>
            
            <div class="product-card" style="background-color: hsl(var(--card)); border-radius: 1rem; overflow: hidden; border: 1px solid hsl(var(--border)); transition: all 0.3s ease;">
                
                <div class="product-image" style="position: relative; aspect-ratio: 1; overflow: hidden;">
                    <a href="<?php the_permalink(); ?>">
                        <?php echo woocommerce_get_product_thumbnail('large'); ?>
                    </a>
                    
                    <?php if ($product->is_on_sale()) : ?>
                        <span class="sale-badge" style="position: absolute; top: 0.5rem; left: 0.5rem; background-color: hsl(var(--luxury-gold)); color: hsl(var(--primary)); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">
                            <?php esc_html_e('Sale', 'lujo-store'); ?>
                        </span>
                    <?php endif; ?>
                    
                    <button class="wishlist-btn" style="position: absolute; top: 0.5rem; right: 0.5rem; background-color: hsl(var(--background) / 0.8); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="product-content" style="padding: 1.5rem;">
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
                        <a href="<?php the_permalink(); ?>" style="color: inherit; text-decoration: none;">
                            <?php the_title(); ?>
                        </a>
                    </h3>
                    
                    <div class="product-price" style="margin-bottom: 1rem;">
                        <?php echo $product->get_price_html(); ?>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="<?php the_permalink(); ?>" class="btn btn-primary" style="flex: 1; text-align: center;">
                            <?php esc_html_e('View', 'lujo-store'); ?>
                        </a>
                        <?php
                        echo sprintf(
                            '<a href="%s" data-quantity="1" class="btn btn-outline" data-product_id="%s" data-product_sku="%s" style="width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="8" cy="21" r="1"></circle>
                                    <circle cx="19" cy="21" r="1"></circle>
                                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                                </svg>
                            </a>',
                            esc_url($product->add_to_cart_url()),
                            esc_attr($product->get_id()),
                            esc_attr($product->get_sku())
                        );
                        ?>
                    </div>
                </div>
                
            </div>
            
            <?php endwhile; wp_reset_postdata(); ?>
            
        </div>
        
    </div>
</section>

<style>
.product-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.product-card .product-image img {
    transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
    transform: scale(1.05);
}

.wishlist-btn:hover {
    background-color: hsl(var(--background));
}

.product-price {
    font-size: 1.125rem;
    font-weight: 600;
    color: hsl(var(--primary));
}

.product-price del {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    margin-right: 0.5rem;
}

.product-price ins {
    text-decoration: none;
    color: hsl(var(--luxury-gold));
}

@media (max-width: 768px) {
    .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
}
</style>
