import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Star } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  description: string;
  badge: string | null;
  specifications: Array<{ spec_name: string; spec_value: string }>;
  avg_rating: number;
  review_count: number;
}

export default function Compare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productIds = searchParams.get("products")?.split(",") || [];
    if (productIds.length === 0) {
      navigate("/products");
      return;
    }
    loadProducts(productIds);
  }, [searchParams]);

  const loadProducts = async (productIds: string[]) => {
    try {
      const { data: productsData, error } = await supabase
        .from("products")
        .select(`
          *,
          specifications:product_specifications(spec_name, spec_value)
        `)
        .in("id", productIds);

      if (error) throw error;

      // Get reviews for each product
      const productsWithReviews = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: reviews } = await supabase
            .from("product_reviews")
            .select("rating")
            .eq("product_id", product.id)
            .eq("is_approved", true);

          const avg_rating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

          return {
            ...product,
            avg_rating,
            review_count: reviews?.length || 0,
          };
        })
      );

      setProducts(productsWithReviews);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (productId: string) => {
    const currentIds = searchParams.get("products")?.split(",") || [];
    const newIds = currentIds.filter(id => id !== productId);
    
    if (newIds.length === 0) {
      navigate("/products");
    } else {
      navigate(`/compare?products=${newIds.join(",")}`);
    }
  };

  // Get all unique specification names
  const allSpecNames = Array.from(
    new Set(
      products.flatMap(p => p.specifications?.map(s => s.spec_name) || [])
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading comparison...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Product Comparison</h1>
            <Button variant="outline" onClick={() => navigate("/products")}>
              Back to Products
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-w-max">
              {products.map((product) => (
                <Card key={product.id} className="min-w-[280px]">
                  <CardHeader className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeProduct(product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                    {product.badge && (
                      <Badge className="mb-2">{product.badge}</Badge>
                    )}
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">R{product.price.toFixed(2)}</p>
                        {product.original_price && (
                          <p className="text-sm text-muted-foreground line-through">
                            R{product.original_price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rating</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-medium">
                            {product.avg_rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({product.review_count} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{product.description}</p>
                    </div>

                    {/* Specifications */}
                    {allSpecNames.map((specName) => {
                      const spec = product.specifications?.find(
                        s => s.spec_name === specName
                      );
                      return (
                        <div key={specName}>
                          <p className="text-sm text-muted-foreground mb-1">{specName}</p>
                          <p className="text-sm font-medium">
                            {spec?.spec_value || "—"}
                          </p>
                        </div>
                      );
                    })}

                    <Button
                      className="w-full"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {products.length < 2 && (
            <Card className="mt-8">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Add at least 2 products to compare. Go back to the products page and select more items.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
