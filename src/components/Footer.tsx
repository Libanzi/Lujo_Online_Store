import { Facebook, Instagram, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatModal } from "./ChatModal";
import { useState } from "react";

export const Footer = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
    <footer className="bg-primary text-primary-foreground">
      <div className="container px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--luxury-gold))] to-[hsl(var(--luxury-champagne))] bg-clip-text text-transparent mb-4">
              LUJO
            </h3>
            <p className="text-primary-foreground/70 text-sm">
              Luxury Made Simple. Premium products at accessible prices for everyday living.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="/new-arrivals" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">New Arrivals</a></li>
              <li><a href="/category/fashion-apparel" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Fashion & Apparel</a></li>
              <li><a href="/category/home-lifestyle" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Home & Lifestyle</a></li>
              <li><a href="/category/electronics" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Electronics</a></li>
              <li><a href="/category/beauty-care" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Beauty & Care</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="/contact" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Contact Us</a></li>
              <li><a href="/track-order" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Track Order</a></li>
              <li><a href="/shipping" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Shipping & Returns</a></li>
              <li><a href="/faq" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">FAQ</a></li>
              <li><a href="/size-guide" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Size Guide</a></li>
              <li>
                <Button 
                  variant="link" 
                  onClick={() => setIsChatOpen(true)}
                  className="h-auto p-0 text-sm text-primary-foreground/70 hover:text-[hsl(var(--luxury-gold))] font-normal"
                >
                  <MessageCircle className="h-4 w-4 mr-1 inline" />
                  Chat with Us
                </Button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="/about" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Our Story</a></li>
              <li><a href="/blog" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Blog</a></li>
              <li><a href="/careers" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Careers</a></li>
              <li><a href="/privacy" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Terms & Conditions</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-primary-foreground/60">
                © 2025 Lujo.com. All rights reserved.
              </p>
              <p className="text-xs text-primary-foreground/40 mt-1">
                Powered by Multijobscafe
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="#" className="text-primary-foreground/60 hover:text-[hsl(var(--luxury-gold))] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-[hsl(var(--luxury-gold))] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-[hsl(var(--luxury-gold))] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </footer>
    </>
  );
};
