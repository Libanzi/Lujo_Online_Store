import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Newsletter = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary via-[hsl(var(--luxury-charcoal))] to-primary">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">Join the Lujo Club</h2>
          <p className="text-lg mb-8 text-primary-foreground/80">
            Get exclusive access to new arrivals, special offers, and style inspiration. Plus R100 off your first order!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email"
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary font-semibold">
              Subscribe
            </Button>
          </div>
          
          <p className="text-xs text-primary-foreground/60 mt-4">
            By subscribing, you agree to our Privacy Policy and Terms of Service
          </p>
        </div>
      </div>
    </section>
  );
};
