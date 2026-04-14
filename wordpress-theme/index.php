<?php
/**
 * Main Template File
 * 
 * @package Lujo_Store
 * @since 1.0.0
 */

get_header();
?>

<main id="main-content" class="site-main">
    
    <?php
    // Hero Section
    get_template_part('template-parts/hero');
    
    // Category Showcase
    get_template_part('template-parts/category-showcase');
    
    // Featured Products
    get_template_part('template-parts/featured-products');
    
    // Newsletter Section
    get_template_part('template-parts/newsletter');
    ?>
    
</main>

<?php
get_footer();
