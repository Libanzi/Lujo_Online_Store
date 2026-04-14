import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useWordPressProducts } from "@/hooks/useWordPressProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { sanitizeHTML } from "@/lib/sanitize";
import { Heart } from "lucide-react";

const WordPressProducts = () => {
  const { data: products, isLoading, error } = useWordPressProducts(1, 12);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <h1 className="text-4xl font-bold mb-8">WordPress Products</h1>
          
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-64" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Unable to Load Products</h2>
              <p className="text-muted-foreground">
                Please check your WordPress configuration in src/lib/wordpress.ts
              </p>
            </div>
          )}

          {products && products.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative overflow-hidden aspect-square">
                    {product._embedded?.["wp:featuredmedia"]?.[0] && (
                      <img 
                        src={product._embedded["wp:featuredmedia"][0].source_url} 
                        alt={product._embedded["wp:featuredmedia"][0].alt_text || product.title.rendered}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    )}
                    {product.product_meta?.badge && (
                      <span className="absolute top-2 left-2 bg-[hsl(var(--luxury-gold))] text-primary px-3 py-1 text-xs font-semibold rounded-full">
                        {product.product_meta.badge}
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
                    <h3 
                      className="font-semibold mb-2 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(product.title.rendered) }}
                    />
                    <div className="flex items-center gap-2 mb-3">
                      {product.product_meta?.price && (
                        <>
                          <span className="text-lg font-bold">
                            R{product.product_meta.price}
                          </span>
                          {product.product_meta.original_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              R{product.product_meta.original_price}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {product.product_meta?.stock && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Stock: {product.product_meta.stock}
                      </p>
                    )}
                    <div 
                      className="text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(product.excerpt.rendered) }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {products && products.length === 0 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No Products Found</h2>
              <p className="text-muted-foreground">
                There are currently no active products in your WordPress site.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WordPressProducts;
