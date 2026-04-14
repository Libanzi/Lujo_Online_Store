/**
 * Navigation JavaScript
 * 
 * @package Lujo_Store
 */

(function($) {
    'use strict';

    // Mobile menu toggle
    $('.mobile-menu-toggle').on('click', function() {
        $('.nav-menu').toggleClass('active');
        $(this).toggleClass('active');
        
        // Toggle icon
        const svg = $(this).find('svg');
        if ($(this).hasClass('active')) {
            svg.html(`
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            `);
        } else {
            svg.html(`
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            `);
        }
    });

    // Close mobile menu when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.main-navigation').length) {
            $('.nav-menu').removeClass('active');
            $('.mobile-menu-toggle').removeClass('active');
        }
    });

    // Sticky header on scroll
    let lastScroll = 0;
    const header = $('.site-header');
    
    $(window).on('scroll', function() {
        const currentScroll = $(this).scrollTop();
        
        if (currentScroll > 100) {
            header.addClass('scrolled');
        } else {
            header.removeClass('scrolled');
        }
        
        // Hide/show header on scroll
        if (currentScroll > lastScroll && currentScroll > 300) {
            header.css('transform', 'translateY(-100%)');
        } else {
            header.css('transform', 'translateY(0)');
        }
        
        lastScroll = currentScroll;
    });

})(jQuery);
