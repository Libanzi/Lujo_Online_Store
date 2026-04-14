import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

interface Discount {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminDiscounts() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    min_purchase_amount: 0,
    max_uses: "",
    expires_at: "",
    is_active: true,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    } else if (isAdmin) {
      loadDiscounts();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading discounts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase_amount: 0,
      max_uses: "",
      expires_at: "",
      is_active: true,
    });
  };

  const handleEdit = (discount: Discount) => {
    setFormData({
      id: discount.id,
      code: discount.code,
      description: discount.description || "",
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      min_purchase_amount: discount.min_purchase_amount,
      max_uses: discount.max_uses?.toString() || "",
      expires_at: discount.expires_at ? new Date(discount.expires_at).toISOString().split('T')[0] : "",
      is_active: discount.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const discountData = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_purchase_amount: formData.min_purchase_amount,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      };

      if (formData.id) {
        const { error } = await supabase
          .from("discount_codes")
          .update(discountData)
          .eq("id", formData.id);

        if (error) throw error;

        toast({
          title: "Discount updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("discount_codes")
          .insert(discountData);

        if (error) throw error;

        toast({
          title: "Discount created successfully",
        });
      }

      resetForm();
      loadDiscounts();
    } catch (error: any) {
      toast({
        title: "Error saving discount",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;

    try {
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Discount deleted successfully",
      });

      loadDiscounts();
    } catch (error: any) {
      toast({
        title: "Error deleting discount",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-6xl">
          <h1 className="text-4xl font-bold mb-8">Manage Discount Codes</h1>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Discount Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., SAVE20"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Discount Type *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="value">
                      Discount Value * ({formData.discount_type === 'percentage' ? '%' : 'R'})
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="min">Minimum Purchase (R)</Label>
                    <Input
                      id="min"
                      type="number"
                      step="0.01"
                      value={formData.min_purchase_amount}
                      onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max">Maximum Uses (optional)</Label>
                    <Input
                      id="max"
                      type="number"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expires">Expiry Date (optional)</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Internal description for this discount code"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {formData.id ? "Update Discount" : "Create Discount"}
                  </Button>
                  {formData.id && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Discount Codes</h2>
            {discounts.map((discount) => (
              <Card key={discount.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{discount.code}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          discount.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {discount.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {discount.description && (
                        <p className="text-muted-foreground mb-2">{discount.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>{" "}
                          {discount.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>{" "}
                          {discount.discount_type === 'percentage' 
                            ? `${discount.discount_value}%` 
                            : `R${discount.discount_value}`}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min Purchase:</span>{" "}
                          R{discount.min_purchase_amount}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Uses:</span>{" "}
                          {discount.uses_count}
                          {discount.max_uses ? ` / ${discount.max_uses}` : ' / ∞'}
                        </div>
                      </div>
                      {discount.expires_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Expires: {new Date(discount.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(discount)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(discount.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {discounts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No discount codes yet. Create one above.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
