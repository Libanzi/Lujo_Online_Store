import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Heart, Users, Award } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Our Story</h1>
          
          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-lg">
              Founded in 2020, LUJO was born from a simple belief: luxury should be accessible to everyone. 
              We set out to create a platform where premium quality meets affordable prices, making everyday 
              luxury a reality for all.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 my-12 not-prose">
              <div className="text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
                <h3 className="text-xl font-semibold mb-2">Passion</h3>
                <p className="text-muted-foreground">We're passionate about bringing you the finest products</p>
              </div>
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-muted-foreground">Building a community of luxury enthusiasts</p>
              </div>
              <div className="text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
                <h3 className="text-xl font-semibold mb-2">Quality</h3>
                <p className="text-muted-foreground">Uncompromising quality in every product</p>
              </div>
            </div>
            
            <p>
              Today, LUJO serves thousands of customers worldwide, offering everything from fashion and 
              electronics to home decor and beauty products. Our commitment remains the same: to provide 
              exceptional quality at prices that don't break the bank.
            </p>
            
            <p>
              We carefully curate each product, working directly with manufacturers to ensure you get 
              the best value. Our team tests every item before it reaches our catalog, so you can shop 
              with confidence.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
