<?php
/**
 * Hero Section Template Part
 * 
 * @package Lujo_Store
 */
?>

<section class="hero-section" style="position: relative; min-height: 600px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: linear-gradient(135deg, hsl(var(--luxury-navy)) 0%, hsl(var(--primary)) 100%);">
    
    <!-- Background Pattern -->
    <div class="hero-pattern" style="position: absolute; inset: 0; opacity: 0.1; background-image: radial-gradient(circle at 2px 2px, hsl(var(--luxury-gold)) 1px, transparent 0); background-size: 40px 40px;"></div>
    
    <!-- Content -->
    <div class="container" style="position: relative; z-index: 10;">
        <div class="hero-content text-center animate-fade-in" style="max-width: 800px; margin: 0 auto; color: hsl(var(--background));">
            
            <h1 class="hero-title" style="font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; margin-bottom: 1.5rem; line-height: 1.2;">
                <?php
                $hero_title = get_theme_mod('lujo_hero_title', 'Luxury Made Simple');
                echo esc_html($hero_title);
                ?>
            </h1>
            
            <p class="hero-description" style="font-size: clamp(1rem, 2vw, 1.25rem); margin-bottom: 2.5rem; opacity: 0.95; line-height: 1.8;">
                <?php
                $hero_description = get_theme_mod('lujo_hero_description', 'Discover our curated collection of premium products designed for those who appreciate quality and elegance.');
                echo esc_html($hero_description);
                ?>
            </p>
            
            <div class="hero-actions" style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="<?php echo esc_url(home_url('/shop')); ?>" class="btn btn-primary" style="padding: 0.875rem 2rem; font-size: 1rem; border-radius: 0.5rem;">
                    <?php esc_html_e('Shop Now', 'lujo-store'); ?>
                </a>
                <a href="<?php echo esc_url(home_url('/shop')); ?>" class="btn btn-outline" style="padding: 0.875rem 2rem; font-size: 1rem; border-radius: 0.5rem; background-color: transparent; border: 2px solid hsl(var(--luxury-gold)); color: hsl(var(--background));">
                    <?php esc_html_e('Explore Collections', 'lujo-store'); ?>
                </a>
            </div>
            
        </div>
    </div>
    
    <!-- Decorative Elements -->
    <div style="position: absolute; top: 20%; right: 10%; width: 200px; height: 200px; background: radial-gradient(circle, hsl(var(--luxury-gold) / 0.2) 0%, transparent 70%); border-radius: 50%; filter: blur(60px);"></div>
    <div style="position: absolute; bottom: 20%; left: 10%; width: 300px; height: 300px; background: radial-gradient(circle, hsl(var(--luxury-champagne) / 0.15) 0%, transparent 70%); border-radius: 50%; filter: blur(80px);"></div>
    
</section>

<style>
@media (max-width: 768px) {
    .hero-section {
        min-height: 500px;
        padding: 3rem 1rem;
    }
    
    .hero-actions {
        flex-direction: column;
        align-items: stretch;
    }
    
    .hero-actions .btn {
        width: 100%;
    }
}
</style>
