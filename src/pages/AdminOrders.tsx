import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { useAdmin } from "@/hooks/useAdmin";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  payment_method?: string;
}

const AdminOrders = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadOrders();
      loadSuppliers();
    }
  }, [adminLoading, isAdmin]);

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers" as any)
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setSuppliers((data as { id: string; name: string }[]) || []);
  };

  const handleExportSupplierOrders = async () => {
    if (!selectedSupplier) {
      toast({ title: "Please select a supplier first", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-orders-to-supplier", {
        body: { supplierId: selectedSupplier },
      });
      if (error) throw error;
      if (!data?.csv || data.count === 0) {
        toast({ title: "No pending orders for this supplier" });
        return;
      }
      // Trigger CSV download
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exported ${data.count} order line(s)` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          product:products (
            name,
            image_url
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading orders", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch user profiles for each order
    const ordersWithProfiles = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", order.user_id)
          .maybeSingle();

        return {
          ...order,
          user_email: profile?.email || "Unknown",
          user_name: profile?.full_name || "Unknown",
        };
      })
    );

    setOrders(ordersWithProfiles);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error updating order", variant: "destructive" });
    } else {
      // Add status history entry
      await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          status: newStatus,
          notes: `Status updated to ${newStatus}`,
        });

      // Send email notification based on status
      const emailType = newStatus === 'shipped' ? 'shipped' : 'status_update';
      const { error: emailError } = await supabase.functions.invoke('send-order-email', {
        body: { orderId, type: emailType }
      });

      if (emailError) {
        console.error('Error sending email notification:', emailError);
      }

      toast({ title: "Order status updated and customer notified" });
      loadOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
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
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold">Manage Orders</h1>
            {suppliers.length > 0 && (
              <div className="flex items-center gap-2">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleExportSupplierOrders}
                  disabled={exporting || !selectedSupplier}
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            )}
          </div>

          {/* Payment Method Breakdown */}
          {!loading && orders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {(() => {
                const breakdown = orders.reduce((acc, order) => {
                  const method = order.payment_method || 'cod';
                  acc[method] = (acc[method] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const methodLabels: Record<string, string> = {
                  cod: 'Cash on Delivery',
                  payfast: 'PayFast',
                  payflex: 'Payflex BNPL',
                  stripe: 'Stripe',
                };

                const methodColors: Record<string, string> = {
                  cod: 'bg-yellow-500',
                  payfast: 'bg-blue-500',
                  payflex: 'bg-[#00B8D9]',
                  stripe: 'bg-purple-500',
                };

                return Object.entries(breakdown).map(([method, count]) => (
                  <Card key={method}>
                    <CardContent className="p-4 text-center">
                      <div className={`w-3 h-3 rounded-full ${methodColors[method] || 'bg-gray-500'} mx-auto mb-2`} />
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{methodLabels[method] || method}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((count / orders.length) * 100).toFixed(0)}% of orders
                      </p>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          )}

          {loading ? (
            <p>Loading orders...</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Order #{order.order_number}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString()} at{" "}
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Customer: {order.user_name} ({order.user_email})
                        </p>
                        {order.payment_method && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Payment: <span className="font-medium capitalize">{order.payment_method === 'payflex' ? 'Payflex BNPL' : order.payment_method}</span>
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold mb-2">Shipping Address:</p>
                        <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Total Amount:</p>
                        <p className="text-lg text-[hsl(var(--luxury-gold))]">
                          R{order.total_amount.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setModalOpen(true);
                          }}
                          className="w-full"
                        >
                          Manage Order
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
      
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onUpdate={loadOrders}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default AdminOrders;
