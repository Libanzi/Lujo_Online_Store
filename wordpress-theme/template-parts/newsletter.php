<?php
/**
 * Newsletter Section Template Part
 * 
 * @package Lujo_Store
 */
?>

<section class="newsletter-section py-16" style="background: linear-gradient(135deg, hsl(var(--luxury-navy)) 0%, hsl(var(--primary)) 100%); color: hsl(var(--background));">
    <div class="container">
        
        <div class="newsletter-content" style="max-width: 600px; margin: 0 auto; text-center;">
            
            <h2 style="font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; margin-bottom: 1rem;">
                <?php esc_html_e('Stay Updated', 'lujo-store'); ?>
            </h2>
            
            <p style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 2rem; line-height: 1.8;">
                <?php esc_html_e('Subscribe to our newsletter for exclusive offers and the latest updates.', 'lujo-store'); ?>
            </p>
            
            <form id="newsletter-form" class="newsletter-form" style="display: flex; gap: 0.75rem; max-width: 500px; margin: 0 auto;">
                <input 
                    type="email" 
                    name="newsletter_email" 
                    id="newsletter_email"
                    placeholder="<?php esc_attr_e('Enter your email', 'lujo-store'); ?>"
                    required
                    style="flex: 1; padding: 0.875rem 1.25rem; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); font-size: 1rem; background-color: hsl(var(--background)); color: hsl(var(--foreground));"
                >
                <button 
                    type="submit" 
                    class="btn btn-primary"
                    style="padding: 0.875rem 1.75rem; white-space: nowrap;"
                >
                    <?php esc_html_e('Subscribe', 'lujo-store'); ?>
                </button>
            </form>
            
            <div id="newsletter-message" style="margin-top: 1rem; display: none; padding: 0.75rem; border-radius: 0.5rem;"></div>
            
            <p style="font-size: 0.875rem; opacity: 0.8; margin-top: 1.5rem;">
                <?php esc_html_e('We respect your privacy. Unsubscribe at any time.', 'lujo-store'); ?>
            </p>
            
        </div>
        
    </div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newsletter-form');
    const messageDiv = document.getElementById('newsletter-message');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('newsletter_email').value;
            const formData = new FormData();
            formData.append('action', 'lujo_newsletter');
            formData.append('email', email);
            formData.append('nonce', lujoAjax.nonce);
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '<?php esc_html_e('Subscribing...', 'lujo-store'); ?>';
            submitBtn.disabled = true;
            
            fetch(lujoAjax.ajax_url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                messageDiv.style.display = 'block';
                
                if (data.success) {
                    messageDiv.style.backgroundColor = 'hsl(var(--luxury-gold))';
                    messageDiv.style.color = 'hsl(var(--primary))';
                    messageDiv.textContent = data.data.message;
                    form.reset();
                } else {
                    messageDiv.style.backgroundColor = 'hsl(var(--destructive))';
                    messageDiv.style.color = 'hsl(var(--destructive-foreground))';
                    messageDiv.textContent = data.data.message;
                }
                
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            })
            .catch(error => {
                console.error('Error:', error);
                messageDiv.style.display = 'block';
                messageDiv.style.backgroundColor = 'hsl(var(--destructive))';
                messageDiv.style.color = 'hsl(var(--destructive-foreground))';
                messageDiv.textContent = '<?php esc_html_e('An error occurred. Please try again.', 'lujo-store'); ?>';
                
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        });
    }
});
</script>

<style>
@media (max-width: 640px) {
    .newsletter-form {
        flex-direction: column;
    }
    
    .newsletter-form button {
        width: 100%;
    }
}
</style>
