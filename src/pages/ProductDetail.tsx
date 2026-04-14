import { ProductReviews } from "@/components/ProductReviews";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Heart, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  badge: string | null;
  stock_quantity: number;
  category: {
    name: string;
    slug: string;
  } | null;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
    loadProduct();
  }, [slug]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name, slug)
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);
    } catch (error: any) {
      toast({
        title: "Error loading product",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!product) return;

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", product.id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({
            product_id: product.id,
            quantity: quantity,
            user_id: user.id,
          });

        if (error) throw error;
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!product) return;

    try {
      const { data: existing } = await supabase
        .from("wishlists")
        .select("id")
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;

        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        });
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({
            product_id: product.id,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist.`,
        });
      }
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
          <p className="text-muted-foreground">Loading product...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-2">Product not found</h2>
              <p className="text-muted-foreground mb-6">
                The product you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate("/")}>
                Back to Home
              </Button>
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
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-auto rounded-lg"
              />
              {product.badge && (
                <Badge className="absolute top-4 left-4">
                  {product.badge}
                </Badge>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
                {product.category && (
                  <Button
                    variant="link"
                    className="px-0"
                    onClick={() => navigate(`/category/${product.category?.slug}`)}
                  >
                    {product.category.name}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-[hsl(var(--luxury-gold))]">
                  R{product.price.toFixed(2)}
                </span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    R{product.original_price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Payflex widget */}
              {product.price >= 100 && product.price <= 24000 && (
                <div className="rounded-xl border border-[#00B8D9]/30 bg-[#00B8D9]/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Pay with <span className="text-[#00B8D9] font-bold">Payflex</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      4 x R{(product.price / 4).toFixed(2)} — zero interest, zero fees
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 1 ? 'bg-[#00B8D9] text-white' : 'bg-[#00B8D9]/20 text-[#00B8D9]'
                      }`}>{i}</div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-muted-foreground">{product.description}</p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.stock_quantity} in stock
                </span>
              </div>

              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={addToCart}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={toggleWishlist}
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews Section */}
        <div className="container max-w-6xl mt-12">
          <ProductReviews productId={product.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
