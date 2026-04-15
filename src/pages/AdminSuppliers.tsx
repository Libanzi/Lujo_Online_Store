import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useAdmin } from "@/hooks/useAdmin";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Trash2, Plus, X, Truck, Globe, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Supplier {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  name: "",
  contact_email: "",
  contact_phone: "",
  website: "",
  notes: "",
  is_active: true,
};

const AdminSuppliers = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadSuppliers();
    }
  }, [adminLoading, isAdmin]);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers" as any)
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error loading suppliers", variant: "destructive" });
    } else {
      setSuppliers((data as Supplier[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingSupplier(null);
    setShowForm(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_email: supplier.contact_email || "",
      contact_phone: supplier.contact_phone || "",
      website: supplier.website || "",
      notes: supplier.notes || "",
      is_active: supplier.is_active,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Supplier name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      contact_email: formData.contact_email.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      website: formData.website.trim() || null,
      notes: formData.notes.trim() || null,
      is_active: formData.is_active,
    };

    if (editingSupplier) {
      const { error } = await supabase
        .from("suppliers" as any)
        .update(payload)
        .eq("id", editingSupplier.id);

      if (error) {
        toast({ title: "Error updating supplier", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Supplier updated successfully" });
        loadSuppliers();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("suppliers" as any).insert([payload]);

      if (error) {
        toast({ title: "Error creating supplier", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Supplier created successfully" });
        loadSuppliers();
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("suppliers" as any).delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting supplier", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Supplier deleted successfully" });
      loadSuppliers();
    }
  };

  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">Suppliers</h1>
              <p className="text-muted-foreground mt-1">
                Manage your dropshipping suppliers
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          {/* Supplier Form */}
          {showForm && (
            <Card className="mb-8 border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{editingSupplier ? "Edit Supplier" : "New Supplier"}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="s-name">
                        Supplier Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="s-name"
                        placeholder="e.g., Cape Town Wholesale Ltd"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="s-email">Contact Email</Label>
                      <Input
                        id="s-email"
                        type="email"
                        placeholder="supplier@example.com"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="s-phone">Contact Phone</Label>
                      <Input
                        id="s-phone"
                        type="tel"
                        placeholder="+27 21 000 0000"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="s-website">Website</Label>
                      <Input
                        id="s-website"
                        type="url"
                        placeholder="https://supplier.co.za"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="s-notes">Notes</Label>
                      <Textarea
                        id="s-notes"
                        placeholder="Lead times, minimum order quantities, special terms..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="s-active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="s-active">Supplier is active</Label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary"
                    >
                      {saving ? "Saving..." : editingSupplier ? "Update Supplier" : "Create Supplier"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Supplier List */}
          {loading ? (
            <p className="text-muted-foreground">Loading suppliers...</p>
          ) : suppliers.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <h2 className="text-xl font-semibold mb-2">No suppliers yet</h2>
                <p className="text-muted-foreground mb-4">
                  Add your first dropshipping supplier to get started.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className={!supplier.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">{supplier.name}</h3>
                          {!supplier.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                          {supplier.contact_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {supplier.contact_email}
                            </span>
                          )}
                          {supplier.contact_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {supplier.contact_phone}
                            </span>
                          )}
                          {supplier.website && (
                            <a
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              {supplier.website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                        {supplier.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {supplier.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEdit(supplier)}
                          title="Edit supplier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" title="Delete supplier">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove <strong>{supplier.name}</strong> from your supplier list.
                                Products linked to this supplier will keep their data but lose the supplier
                                association. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(supplier.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
};

export default AdminSuppliers;
