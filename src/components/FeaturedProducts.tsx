import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  badge: string | null;
  slug: string;
  stock_quantity: number;
  category?: string;
}

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProducts();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(4);
    
    if (data) setProducts(data);
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart.",
      });
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        }, {
          onConflict: "user_id,product_id",
        });

      if (error) throw error;

      toast({
        title: "Added to cart!",
        description: "Item has been added to your cart.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground text-lg">Hand-picked luxury items just for you</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
              {/* Image container */}
              <div className="relative overflow-hidden aspect-[3/4]">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                  onClick={() => navigate(`/product/${product.slug}`)}
                />
                {/* Quick add overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <Button
                    className="w-full bg-white text-black hover:bg-primary hover:text-white transition-colors font-medium"
                    onClick={() => addToCart(product.id)}
                  >
                    Quick Add
                  </Button>
                </div>
                {/* Badges */}
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                    {product.badge}
                  </span>
                )}
                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <span className="absolute top-3 left-3 bg-destructive text-white text-xs px-2 py-1 rounded-full">
                    Only {product.stock_quantity} left
                  </span>
                )}
                {/* Wishlist */}
                <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                  <Heart className="h-4 w-4" />
                </button>
              </div>

              {/* Product info */}
              <div className="p-4">
                {product.category && (
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{product.category}</p>
                )}
                <h3
                  className="font-serif text-lg font-medium mb-2 line-clamp-1 cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-semibold">R{product.price.toFixed(2)}</p>
                      {product.original_price && (
                        <span className="text-sm text-muted-foreground line-through">R{product.original_price.toFixed(2)}</span>
                      )}
                    </div>
                    {product.price >= 100 && product.price <= 24000 && (
                      <p className="text-xs text-[#00B8D9]">
                        or 4 x R{(product.price / 4).toFixed(2)} with <strong>Payflex</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2"
            onClick={() => navigate("/products")}
          >
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};
