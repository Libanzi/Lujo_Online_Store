import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Truck, RotateCcw, Shield } from "lucide-react";

const Shipping = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Shipping & Returns</h1>
          
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Truck className="h-8 w-8 text-[hsl(var(--luxury-gold))]" />
                <h2 className="text-2xl font-semibold">Shipping Information</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p>We offer free standard shipping on all orders over R500. Orders are typically processed within 1-2 business days.</p>
                <ul>
                  <li><strong>Standard Shipping:</strong> 5-7 business days</li>
                  <li><strong>Express Shipping:</strong> 2-3 business days</li>
                  <li><strong>Overnight Shipping:</strong> Next business day</li>
                </ul>
              </div>
            </section>
            
            <section>
              <div className="flex items-center gap-3 mb-4">
                <RotateCcw className="h-8 w-8 text-[hsl(var(--luxury-gold))]" />
                <h2 className="text-2xl font-semibold">Return Policy</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p>We accept returns within 30 days of delivery. Items must be unused and in original packaging.</p>
                <ul>
                  <li>Free returns on all orders</li>
                  <li>Full refund within 5-7 business days</li>
                  <li>Easy return process through your account</li>
                </ul>
              </div>
            </section>
            
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-8 w-8 text-[hsl(var(--luxury-gold))]" />
                <h2 className="text-2xl font-semibold">Shipping Protection</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p>All orders are insured against loss or damage during shipping. If your order arrives damaged, contact us immediately for a replacement.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shipping;
