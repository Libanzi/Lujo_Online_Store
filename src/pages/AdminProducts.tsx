import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LowStockAlert } from "@/components/LowStockAlert";
import { useAdmin } from "@/hooks/useAdmin";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X, TrendingUp, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  cost_price: number | null;
  image_url: string;
  category_id: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_dropship: boolean;
  badge: string | null;
  slug: string;
  supplier_id: string | null;
  supplier_sku: string | null;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  original_price: "",
  cost_price: "",
  category_id: "",
  stock_quantity: "",
  is_active: true,
  is_featured: false,
  is_dropship: false,
  badge: "",
  slug: "",
  supplier_id: "",
  supplier_sku: "",
};

const AdminProducts = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadProducts();
      loadCategories();
      loadSuppliers();
    }
  }, [adminLoading, isAdmin]);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading products", variant: "destructive" });
    } else {
      setProducts((data as any) || []);
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers" as any)
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setSuppliers((data as Supplier[]) || []);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error: any) {
      toast({ title: "Error uploading image", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview("");
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      cost_price: product.cost_price?.toString() || "",
      category_id: product.category_id || "",
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active,
      is_featured: product.is_featured ?? false,
      is_dropship: product.is_dropship ?? false,
      badge: product.badge || "",
      slug: product.slug,
      supplier_id: product.supplier_id || "",
      supplier_sku: product.supplier_sku || "",
    });
    setImagePreview(product.image_url);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = editingProduct?.image_url || "";
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) imageUrl = uploadedUrl;
      else return;
    }

    const sellingPrice = parseFloat(formData.price);
    const costPrice = formData.cost_price ? parseFloat(formData.cost_price) : null;

    const productData: any = {
      name: formData.name,
      description: formData.description,
      price: sellingPrice,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      cost_price: costPrice,
      image_url: imageUrl,
      category_id: formData.category_id || null,
      stock_quantity: parseInt(formData.stock_quantity),
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      is_dropship: formData.is_dropship,
      badge: formData.badge || null,
      slug: formData.slug,
      supplier_id: formData.supplier_id || null,
      supplier_sku: formData.supplier_sku || null,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
      if (error) {
        toast({ title: "Error updating product", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Product updated successfully" });
        loadProducts();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("products").insert([productData]);
      if (error) {
        toast({ title: "Error creating product", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Product created successfully" });
        loadProducts();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product deleted successfully" });
      loadProducts();
    }
  };

  const calcMargin = () => {
    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost_price);
    if (!price || !cost || cost <= 0) return null;
    const margin = ((price - cost) / price) * 100;
    return margin;
  };

  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  const margin = calcMargin();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">Manage Products</h1>
              <p className="text-muted-foreground mt-1">{products.length} products total</p>
            </div>
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <LowStockAlert />

          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{editingProduct ? "Edit Product" : "Add New Product"}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="slug">URL Slug *</Label>
                      <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required placeholder="e.g., my-product-name" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Selling Price (R) *</Label>
                      <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="original_price">Compare-at Price (R)</Label>
                      <Input id="original_price" type="number" step="0.01" min="0" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} placeholder="Strikethrough price" />
                    </div>
                    <div>
                      <Label htmlFor="cost_price">Cost Price (R)</Label>
                      <Input id="cost_price" type="number" step="0.01" min="0" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} placeholder="Your cost from supplier" />
                    </div>
                  </div>

                  {/* Margin indicator */}
                  {margin !== null && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${margin >= 30 ? "bg-green-50 text-green-700" : margin >= 10 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        Profit margin: <strong>{margin.toFixed(1)}%</strong>
                        {" "}(R{(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)} per unit)
                      </span>
                    </div>
                  )}

                  {/* Stock & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock Quantity *</Label>
                      <Input id="stock" type="number" min="0" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select id="category" className="w-full rounded-md border border-input bg-background px-3 py-2 h-10" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                        <option value="">Select category</option>
                        {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="badge">Badge</Label>
                      <Input id="badge" value={formData.badge} onChange={(e) => setFormData({ ...formData, badge: e.target.value })} placeholder="e.g., New, Sale, Hot" />
                    </div>
                  </div>

                  {/* Dropshipping section */}
                  <div className="border border-dashed border-border rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">Dropshipping</h4>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <input type="checkbox" id="is_dropship" checked={formData.is_dropship} onChange={(e) => setFormData({ ...formData, is_dropship: e.target.checked })} className="rounded" />
                      <Label htmlFor="is_dropship">This is a dropshipped product</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <select id="supplier" className="w-full rounded-md border border-input bg-background px-3 py-2 h-10" value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}>
                          <option value="">No supplier</option>
                          {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="supplier_sku">Supplier SKU</Label>
                        <Input id="supplier_sku" value={formData.supplier_sku} onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })} placeholder="Supplier's product code" />
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  <div>
                    <Label htmlFor="image">Product Image</Label>
                    <div className="mt-2">
                      {imagePreview && (
                        <div className="relative w-32 h-32 mb-2">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                          <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => { setImageFile(null); setImagePreview(""); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                      <p className="text-xs text-muted-foreground mt-1">Recommended: 800×1000px, JPG or PNG</p>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" />
                      <Label htmlFor="is_active">Active (visible in store)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="is_featured" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="rounded" />
                      <Label htmlFor="is_featured">Featured (shown on homepage)</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={uploading} className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary">
                      {uploading ? "Uploading image..." : editingProduct ? "Update Product" : "Create Product"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <p className="text-muted-foreground">Loading products...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <Card key={product.id} className={!product.is_active ? "opacity-60" : ""}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {(product as any).is_featured && <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">Featured</Badge>}
                        {(product as any).is_dropship && <Badge variant="outline" className="text-xs">Dropship</Badge>}
                        {!product.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{product.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-[hsl(var(--luxury-gold))] font-bold">R{product.price.toFixed(2)}</span>
                        {(product as any).cost_price && (
                          <span className="text-muted-foreground">
                            Cost: R{Number((product as any).cost_price).toFixed(2)}
                            {" · "}
                            <span className="text-green-600">
                              {(((product.price - (product as any).cost_price) / product.price) * 100).toFixed(0)}% margin
                            </span>
                          </span>
                        )}
                        <span className="text-muted-foreground">Stock: {product.stock_quantity}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="icon" variant="outline" onClick={() => handleEdit(product)} title="Edit product">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="destructive" title="Delete product">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{product.name}</strong>. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(product.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
};

export default AdminProducts;
