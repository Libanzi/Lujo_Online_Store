import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
}

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [notifying, setNotifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkLowStock();
    
    // Set up real-time subscription for stock changes
    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => checkLowStock()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkLowStock = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .lte("stock_quantity", 10)
        .eq("is_active", true)
        .order("stock_quantity", { ascending: true });

      if (error) throw error;
      setLowStockProducts(data || []);
    } catch (error) {
      console.error("Error checking low stock:", error);
    }
  };

  const sendNotifications = async () => {
    setNotifying(true);
    try {
      const { error } = await supabase.functions.invoke('notify-low-stock');
      
      if (error) throw error;
      
      toast({
        title: "Notifications sent",
        description: "All admins have been notified about low stock products.",
      });
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Failed to send notifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setNotifying(false);
    }
  };

  if (lowStockProducts.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Low Stock Alert</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {lowStockProducts.length} {lowStockProducts.length === 1 ? 'product is' : 'products are'} running low on stock:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-3">
          {lowStockProducts.slice(0, 3).map((product) => (
            <li key={product.id}>
              {product.name} - Only {product.stock_quantity} left
            </li>
          ))}
          {lowStockProducts.length > 3 && (
            <li>and {lowStockProducts.length - 3} more...</li>
          )}
        </ul>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/admin/products")}
          >
            Manage Inventory
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={sendNotifications}
            disabled={notifying}
          >
            <Mail className="h-4 w-4 mr-2" />
            {notifying ? "Sending..." : "Notify Admins"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
