import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CompareButton } from "@/components/CompareButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <h1 className="text-4xl font-bold mb-8">All Products</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative overflow-hidden aspect-square">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.badge && (
                    <span className="absolute top-2 left-2 bg-[hsl(var(--luxury-gold))] text-primary px-3 py-1 text-xs font-semibold rounded-full">
                      {product.badge}
                    </span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold">R{product.price}</span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        R{product.original_price}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary"
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      View
                    </Button>
                    <CompareButton productId={product.id} />
                    <Button size="icon" variant="outline">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
