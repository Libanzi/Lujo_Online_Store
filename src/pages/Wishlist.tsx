import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Trash2, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    slug: string;
    stock_quantity: number;
  };
}

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      loadWishlist();
    } else {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select(`
          id,
          product:products (
            id,
            name,
            price,
            image_url,
            slug,
            stock_quantity
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading wishlist",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setWishlistItems(items => items.filter(item => item.id !== itemId));

      toast({
        title: "Item removed",
        description: "Item has been removed from your wishlist.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addToCart = async (productId: string, productName: string) => {
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Sign in to view wishlist</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to see your wishlist.
              </p>
              <Button onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading wishlist...</p>
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
          <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>

          {wishlistItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Save your favorite items to your wishlist.
                </p>
                <Button onClick={() => navigate("/")}>
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <Card key={item.id} className="group">
                  <CardContent className="p-0">
                    <div 
                      className="relative cursor-pointer"
                      onClick={() => navigate(`/product/${item.product.slug}`)}
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-64 object-cover rounded-t"
                      />
                    </div>
                    <div className="p-4">
                      <h3 
                        className="font-semibold mb-2 cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/product/${item.product.slug}`)}
                      >
                        {item.product.name}
                      </h3>
                      <p className="text-[hsl(var(--luxury-gold))] font-bold mb-4">
                        R{item.product.price.toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => addToCart(item.product.id, item.product.name)}
                          disabled={item.product.stock_quantity === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
