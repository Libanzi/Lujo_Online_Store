import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWordPressPosts } from "@/hooks/useWordPressPosts";
import { useWordPressProducts } from "@/hooks/useWordPressProducts";
import { Loader2, RefreshCw, ExternalLink, Database, FileText, Package, Settings as SettingsIcon, History } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WordPressSettings } from "@/components/WordPressSettings";
import { WordPressSyncHistory } from "@/components/WordPressSyncHistory";
import { WordPressCategoryMapper } from "@/components/WordPressCategoryMapper";

const WordPressAdmin = () => {
  const { toast } = useToast();
  const [wordpressUrl, setWordpressUrl] = useState("https://your-wordpress-site.com");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMode, setSyncMode] = useState<'full' | 'incremental'>('incremental');
  
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useWordPressPosts(1, 50);
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useWordPressProducts(1, 50);

  const handleProductSync = async () => {
    setSyncLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('wordpress-product-sync', {
        body: { 
          wordpressUrl,
          syncMode,
          syncCategories: true
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sync Completed",
          description: data.message,
        });
        
        // Refetch products to show updated data
        refetchProducts();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">WordPress Management</h1>
            <p className="text-muted-foreground">
              Manage your WordPress content and sync products to the database
            </p>
          </div>

          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="settings">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="category-mapper">
                <Database className="mr-2 h-4 w-4" />
                Category Mapper
              </TabsTrigger>
              <TabsTrigger value="sync">
                <Database className="mr-2 h-4 w-4" />
                Manual Sync
              </TabsTrigger>
              <TabsTrigger value="posts">
                <FileText className="mr-2 h-4 w-4" />
                Blog Posts
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="mr-2 h-4 w-4" />
                WP Products
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <WordPressSettings />
            </TabsContent>

            <TabsContent value="history">
              <WordPressSyncHistory />
            </TabsContent>

            <TabsContent value="category-mapper">
              <WordPressCategoryMapper />
            </TabsContent>

            <TabsContent value="sync" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Product Sync</CardTitle>
                  <CardDescription>
                    Trigger an immediate product and category sync from WordPress. Configure automatic sync in Settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="wp-url">WordPress Site URL</Label>
                    <Input
                      id="wp-url"
                      value={wordpressUrl}
                      onChange={(e) => setWordpressUrl(e.target.value)}
                      placeholder="https://your-wordpress-site.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sync Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={syncMode === 'incremental' ? 'default' : 'outline'}
                        onClick={() => setSyncMode('incremental')}
                      >
                        Incremental (New Only)
                      </Button>
                      <Button
                        variant={syncMode === 'full' ? 'default' : 'outline'}
                        onClick={() => setSyncMode('full')}
                      >
                        Full (Update All)
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      {syncMode === 'incremental' 
                        ? "Incremental sync will only add new products that don't exist in the database."
                        : "Full sync will update all existing products and add new ones. This may overwrite local changes."
                      }
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleProductSync} 
                    disabled={syncLoading || !wordpressUrl}
                    className="w-full"
                  >
                    {syncLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing Products...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Products
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sync Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Products must have the custom post type 'lujo_product'</p>
                  <p>• Only active products (is_active = '1') will be synced</p>
                  <p>• Product slugs are used to match existing products</p>
                  <p>• Featured images will be imported as product images</p>
                  <p>• Product metadata (price, stock, badges) will be synced</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>WordPress Blog Posts</CardTitle>
                    <CardDescription>
                      {posts?.length || 0} posts available
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchPosts()}
                    disabled={postsLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {postsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : posts && posts.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <div
                            key={post.id}
                            className="flex items-start justify-between border-b pb-4 last:border-0"
                          >
                            <div className="flex-1">
                              <h3 
                                className="font-semibold mb-1"
                                dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                              />
                              <p className="text-sm text-muted-foreground">
                                {new Date(post.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No posts found. Check your WordPress configuration.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>WordPress Products</CardTitle>
                    <CardDescription>
                      {products?.length || 0} active products
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchProducts()}
                    disabled={productsLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : products && products.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-start gap-4 border-b pb-4 last:border-0"
                          >
                            {product._embedded?.["wp:featuredmedia"]?.[0] && (
                              <img
                                src={product._embedded["wp:featuredmedia"][0].source_url}
                                alt={product.title.rendered}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h3 
                                className="font-semibold mb-1"
                                dangerouslySetInnerHTML={{ __html: product.title.rendered }}
                              />
                              <div className="flex items-center gap-2 text-sm">
                                {product.product_meta?.price && (
                                  <span className="font-medium">
                                    R{product.product_meta.price}
                                  </span>
                                )}
                                {product.product_meta?.badge && (
                                  <Badge variant="secondary">
                                    {product.product_meta.badge}
                                  </Badge>
                                )}
                                {product.product_meta?.stock && (
                                  <span className="text-muted-foreground">
                                    Stock: {product.product_meta.stock}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No products found. Check your WordPress configuration.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WordPressAdmin;
