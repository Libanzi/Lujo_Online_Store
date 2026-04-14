import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Heart, Search as SearchIcon } from "lucide-react";
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

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
    const searchQuery = searchParams.get("q");
    if (searchQuery) {
      setQuery(searchQuery);
      searchProducts(searchQuery);
    }
  }, [searchParams]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .ilike("name", `%${searchQuery}%`);

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error searching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-6xl">
          <h1 className="text-4xl font-bold mb-8">Search Products</h1>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : products.length === 0 && query ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  No products found for "{query}"
                </p>
              </CardContent>
            </Card>
          ) : products.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  Enter a search query to find products
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                Found {products.length} product{products.length !== 1 ? "s" : ""} for "{query}"
              </p>
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
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
