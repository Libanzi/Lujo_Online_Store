import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Heart, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  badge: string | null;
  slug: string;
  stock_quantity: number | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type SortOption = "relevance" | "price_asc" | "price_desc" | "newest";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    checkUser();
    loadCategories();
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get("q");
    if (searchQuery) {
      setQuery(searchQuery);
      searchProducts(searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [allProducts, priceRange, selectedCategories, sortBy, inStockOnly]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name, slug").order("name");
    setCategories(data || []);
  };

  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setAllProducts([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url, badge, slug, stock_quantity, category_id")
        .eq("is_active", true)
        .ilike("name", `%${searchQuery}%`);

      if (error) throw error;
      const products = data || [];
      setAllProducts(products);

      // Calculate max price for slider
      if (products.length > 0) {
        const max = Math.ceil(Math.max(...products.map((p) => p.price)) / 100) * 100;
        const clampedMax = Math.max(max, 100);
        setMaxPrice(clampedMax);
        setPriceRange([0, clampedMax]);
      }
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

  const applyFilters = () => {
    let results = [...allProducts];

    // Price filter
    results = results.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Category filter
    if (selectedCategories.length > 0) {
      results = results.filter((p) => p.category_id && selectedCategories.includes(p.category_id));
    }

    // In-stock filter
    if (inStockOnly) {
      results = results.filter((p) => (p.stock_quantity ?? 0) > 0);
    }

    // Sort
    switch (sortBy) {
      case "price_asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        // Keep original order (already ordered by created_at desc from Supabase)
        break;
      case "relevance":
      default:
        break;
    }

    setFilteredProducts(results);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    setSelectedCategories([]);
    setSortBy("relevance");
    setInStockOnly(false);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    sortBy !== "relevance" ||
    inStockOnly;

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
        const { error } = await supabase.from("cart_items").insert({
          product_id: productId,
          quantity: 1,
          user_id: user.id,
        });
        if (error) throw error;
      }

      toast({ title: "Added to cart", description: `${productName} added to your cart.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const searchQuery = searchParams.get("q");

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-7xl">
          <h1 className="text-4xl font-serif font-light mb-8">Search Products</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for luxury products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 h-12"
              />
              <Button type="submit" size="lg" className="px-8">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {searchQuery && (
            <div className="flex lg:hidden items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? "Searching..." : `${filteredProducts.length} result${filteredProducts.length !== 1 ? "s" : ""}`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </div>
          )}

          {searchQuery ? (
            <div className="flex gap-8">
              {/* Filter Sidebar */}
              <aside
                className={`
                  ${showFilters ? "block" : "hidden"} lg:block
                  w-full lg:w-64 shrink-0 space-y-6
                  lg:sticky lg:top-24 lg:self-start
                `}
              >
                <div className="bg-card border border-border rounded-xl p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Clear all
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sort By</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  {allProducts.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Price Range
                      </Label>
                      <Slider
                        min={0}
                        max={maxPrice}
                        step={50}
                        value={priceRange}
                        onValueChange={(v) => setPriceRange(v as [number, number])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>R{priceRange[0].toLocaleString()}</span>
                        <span>R{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Categories
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {categories.map((cat) => (
                          <div key={cat.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`cat-${cat.id}`}
                              checked={selectedCategories.includes(cat.id)}
                              onCheckedChange={() => toggleCategory(cat.id)}
                            />
                            <label
                              htmlFor={`cat-${cat.id}`}
                              className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed"
                            >
                              {cat.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* In Stock */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="in-stock"
                      checked={inStockOnly}
                      onCheckedChange={(v) => setInStockOnly(!!v)}
                    />
                    <label htmlFor="in-stock" className="text-sm cursor-pointer">
                      In stock only
                    </label>
                  </div>
                </div>
              </aside>

              {/* Results */}
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <p className="text-muted-foreground text-lg mb-2">
                        No products found for "{searchQuery}"
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-primary underline"
                        >
                          Clear filters to see more results
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "
                      {searchQuery}"
                      {hasActiveFilters && " (filtered)"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                        >
                          <div
                            className="relative overflow-hidden aspect-[3/4] cursor-pointer"
                            onClick={() => navigate(`/product/${product.slug}`)}
                          >
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Quick add overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                              <Button
                                className="w-full bg-white text-black hover:bg-primary hover:text-white transition-colors font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product.id, product.name);
                                }}
                              >
                                Quick Add
                              </Button>
                            </div>
                            {product.badge && (
                              <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                                {product.badge}
                              </span>
                            )}
                            {(product.stock_quantity ?? 0) <= 5 && (product.stock_quantity ?? 0) > 0 && (
                              <span className="absolute top-3 left-3 bg-destructive text-white text-xs px-2 py-1 rounded-full">
                                Only {product.stock_quantity} left
                              </span>
                            )}
                            <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                              <Heart className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="p-4">
                            <h3
                              className="font-serif text-lg font-medium mb-2 line-clamp-1 cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/product/${product.slug}`)}
                            >
                              {product.name}
                            </h3>
                            <div>
                              <div className="flex items-baseline gap-2">
                                <p className="text-lg font-semibold text-[hsl(var(--luxury-gold))]">
                                  R{product.price.toFixed(2)}
                                </p>
                                {product.original_price && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    R{product.original_price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {product.price >= 100 && product.price <= 24000 && (
                                <p className="text-xs text-[#00B8D9]">
                                  or 4 × R{(product.price / 4).toFixed(2)} with <strong>Payflex</strong>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <SearchIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-xl font-serif text-muted-foreground">
                  Enter a search query to discover products
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
