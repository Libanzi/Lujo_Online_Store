/**
 * Main Theme JavaScript
 * 
 * @package Lujo_Store
 */

(function($) {
    'use strict';

    // Document ready
    $(document).ready(function() {
        
        // Initialize smooth scroll
        initSmoothScroll();
        
        // Initialize lazy loading
        initLazyLoad();
        
        // Initialize wishlist functionality
        initWishlist();
        
        // Initialize quick view
        initQuickView();
        
    });

    /**
     * Smooth scroll for anchor links
     */
    function initSmoothScroll() {
        $('a[href^="#"]').on('click', function(e) {
            const target = $(this.getAttribute('href'));
            if (target.length) {
                e.preventDefault();
                $('html, body').stop().animate({
                    scrollTop: target.offset().top - 80
                }, 800);
            }
        });
    }

    /**
     * Lazy load images
     */
    function initLazyLoad() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Wishlist functionality
     */
    function initWishlist() {
        $('.wishlist-btn').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = $(this);
            const productId = button.data('product-id');
            
            // Toggle wishlist state
            button.toggleClass('active');
            
            // Update icon
            const svg = button.find('svg');
            if (button.hasClass('active')) {
                svg.attr('fill', 'currentColor');
                showNotification('Added to wishlist');
            } else {
                svg.attr('fill', 'none');
                showNotification('Removed from wishlist');
            }
            
            // TODO: Send AJAX request to save wishlist state
            // This requires creating a custom wishlist table and endpoint
        });
    }

    /**
     * Quick view functionality
     */
    function initQuickView() {
        $('.quick-view-btn').on('click', function(e) {
            e.preventDefault();
            const productId = $(this).data('product-id');
            
            // TODO: Implement quick view modal
            // This requires creating a modal template and AJAX endpoint
            console.log('Quick view for product:', productId);
        });
    }

    /**
     * Show notification toast
     */
    function showNotification(message, type = 'success') {
        const notification = $('<div class="notification"></div>')
            .addClass(type)
            .text(message)
            .css({
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '1rem 1.5rem',
                borderRadius: '0.5rem',
                backgroundColor: type === 'success' ? 'hsl(var(--luxury-gold))' : 'hsl(var(--destructive))',
                color: type === 'success' ? 'hsl(var(--primary))' : 'hsl(var(--destructive-foreground))',
                zIndex: 9999,
                animation: 'slideIn 0.3s ease-out'
            });
        
        $('body').append(notification);
        
        setTimeout(() => {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }

    // Add animation keyframes
    $('<style>')
        .text(`
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `)
        .appendTo('head');

})(jQuery);
