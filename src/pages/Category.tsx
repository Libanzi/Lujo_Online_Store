import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  badge: string | null;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function Category() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
    loadCategoryAndProducts();
  }, [slug]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadCategoryAndProducts = async () => {
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      if (categoryData) {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", categoryData.id)
          .eq("is_active", true);

        if (productsError) throw productsError;
        setProducts(productsData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error loading category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, productName: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({
            product_id: productId,
            quantity: 1,
            user_id: user.id,
          });

        if (error) throw error;
      }

      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading category...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-2">Category not found</h2>
              <Button onClick={() => navigate("/")}>Back to Home</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground">{category.description}</p>
            )}
          </div>

          {products.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No products in this category yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative" onClick={() => navigate(`/product/${product.slug}`)}>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-64 object-cover rounded-t"
                      />
                      {product.badge && (
                        <Badge className="absolute top-4 left-4">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 
                        className="font-semibold mb-2 cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/product/${product.slug}`)}
                      >
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[hsl(var(--luxury-gold))] font-bold">
                          R{product.price.toFixed(2)}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            R{product.original_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => addToCart(product.id, product.name)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button size="icon" variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
