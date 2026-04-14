    <footer id="colophon" class="site-footer" style="background-color: hsl(var(--luxury-navy)); color: hsl(var(--background)); padding: 4rem 0 2rem;">
        <div class="container">
            <div class="footer-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
                
                <!-- About Section -->
                <div class="footer-widget">
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: hsl(var(--luxury-gold));">
                        <?php bloginfo('name'); ?>
                    </h3>
                    <p style="opacity: 0.9; line-height: 1.8;">
                        <?php
                        $description = get_bloginfo('description');
                        echo $description ? esc_html($description) : esc_html__('Luxury made simple. Discover curated collections of premium products.', 'lujo-store');
                        ?>
                    </p>
                </div>

                <!-- Quick Links -->
                <div class="footer-widget">
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: hsl(var(--luxury-gold));">
                        <?php esc_html_e('Quick Links', 'lujo-store'); ?>
                    </h3>
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'footer',
                        'menu_class' => 'footer-menu',
                        'container' => 'ul',
                        'fallback_cb' => function() {
                            echo '<ul class="footer-menu">';
                            echo '<li><a href="' . esc_url(home_url('/shop')) . '">Shop</a></li>';
                            echo '<li><a href="' . esc_url(home_url('/about')) . '">About</a></li>';
                            echo '<li><a href="' . esc_url(home_url('/contact')) . '">Contact</a></li>';
                            echo '</ul>';
                        },
                    ));
                    ?>
                </div>

                <!-- Customer Service -->
                <div class="footer-widget">
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: hsl(var(--luxury-gold));">
                        <?php esc_html_e('Customer Service', 'lujo-store'); ?>
                    </h3>
                    <ul class="footer-menu">
                        <li><a href="<?php echo esc_url(home_url('/shipping')); ?>"><?php esc_html_e('Shipping Info', 'lujo-store'); ?></a></li>
                        <li><a href="<?php echo esc_url(home_url('/returns')); ?>"><?php esc_html_e('Returns', 'lujo-store'); ?></a></li>
                        <li><a href="<?php echo esc_url(home_url('/faq')); ?>"><?php esc_html_e('FAQ', 'lujo-store'); ?></a></li>
                        <li><a href="<?php echo esc_url(home_url('/track-order')); ?>"><?php esc_html_e('Track Order', 'lujo-store'); ?></a></li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div class="footer-widget">
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: hsl(var(--luxury-gold));">
                        <?php esc_html_e('Contact Us', 'lujo-store'); ?>
                    </h3>
                    <ul style="list-style: none; padding: 0; opacity: 0.9;">
                        <li style="margin-bottom: 0.5rem;">
                            <?php
                            $admin_email = get_option('admin_email');
                            echo esc_html($admin_email);
                            ?>
                        </li>
                        <li style="margin-bottom: 0.5rem;">+27 (0) 123 456 789</li>
                        <li>South Africa</li>
                    </ul>
                </div>

                <?php if (is_active_sidebar('footer-widget-area')) : ?>
                    <div class="footer-widget">
                        <?php dynamic_sidebar('footer-widget-area'); ?>
                    </div>
                <?php endif; ?>

            </div>

            <!-- Copyright -->
            <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 2rem; text-align: center; opacity: 0.8;">
                <p>
                    &copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. 
                    <?php esc_html_e('All rights reserved.', 'lujo-store'); ?>
                </p>
            </div>
        </div>
    </footer>

</div><!-- #page -->

<?php wp_footer(); ?>

<style>
.footer-menu {
    list-style: none;
    padding: 0;
}

.footer-menu li {
    margin-bottom: 0.5rem;
}

.footer-menu a {
    color: hsl(var(--background));
    opacity: 0.9;
    transition: opacity 0.3s ease;
    text-decoration: none;
}

.footer-menu a:hover {
    opacity: 1;
    color: hsl(var(--luxury-gold));
}

@media (max-width: 768px) {
    .footer-content {
        grid-template-columns: 1fr;
    }
}
</style>

</body>
</html>
