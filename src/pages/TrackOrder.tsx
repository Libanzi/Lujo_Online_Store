import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, Clock, Truck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "processing":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your order number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            product:products (
              name,
              image_url,
              price
            )
          ),
          order_status_history (
            *
          )
        `)
        .eq("order_number", orderNumber.trim())
        .maybeSingle();

      if (error) throw error;

      if (!order) {
        toast({
          title: "Order not found",
          description: "No order found with this order number. Please check and try again.",
          variant: "destructive",
        });
        setOrderData(null);
        return;
      }

      // Sort status history by date
      if (order.order_status_history) {
        order.order_status_history.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      setOrderData(order);
      toast({
        title: "Order found",
        description: "Your order details are displayed below",
      });
    } catch (error: any) {
      console.error("Error tracking order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to track order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-4xl">
          <div className="text-center mb-8">
            <Package className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
            <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order number to track your shipment
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Order Number *
                  </label>
                  <Input
                    placeholder="e.g., ORD-1234567890"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address (optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email is optional if you're logged in
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary"
                  disabled={loading}
                >
                  {loading ? "Tracking..." : "Track Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {orderData && (
            <div className="space-y-6">
              {/* Order Status */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Order {orderData.order_number}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Placed on{" "}
                        {new Date(orderData.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(orderData.status)}>
                      <span className="flex items-center gap-2">
                        {getStatusIcon(orderData.status)}
                        {orderData.status.charAt(0).toUpperCase() +
                          orderData.status.slice(1)}
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">
                        R{orderData.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Status</p>
                      <p className="font-semibold capitalize">
                        {orderData.payment_status || "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-semibold capitalize">
                        {orderData.payment_method === 'cod' ? 'Cash on Delivery' : orderData.payment_method || "N/A"}
                      </p>
                    </div>
                    {orderData.tracking_number && (
                      <div>
                        <p className="text-muted-foreground">Tracking Number</p>
                        <p className="font-semibold">
                          {orderData.tracking_number}
                        </p>
                      </div>
                    )}
                  </div>

                  {orderData.shipping_address && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">
                        Shipping Address
                      </p>
                      <p className="text-sm whitespace-pre-line">
                        {orderData.shipping_address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {orderData.order_items?.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            R{item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {orderData.discount_amount > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Discount ({orderData.discount_code})
                      </span>
                      <span className="text-green-600 font-semibold">
                        -R{orderData.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status History */}
              {orderData.order_status_history &&
                orderData.order_status_history.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Order Timeline
                      </h3>
                      <div className="space-y-4">
                        {orderData.order_status_history.map(
                          (history: any, index: number) => (
                            <div
                              key={history.id}
                              className="flex gap-4 relative"
                            >
                              {index !==
                                orderData.order_status_history.length - 1 && (
                                <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
                              )}
                              <div className="flex-shrink-0">
                                {getStatusIcon(history.status)}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-medium capitalize">
                                  {history.status}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    history.created_at
                                  ).toLocaleString()}
                                </p>
                                {history.notes && (
                                  <p className="text-sm mt-1">
                                    {history.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
