import { ShoppingCart, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const MiniCart = ({ isOpen, onClose }: MiniCartProps) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCartItems();
    }
  }, [isOpen]);

  const loadCartItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .limit(5);

    if (!error && data) {
      setCartItems(data);
    }
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    } else {
      loadCartItems();
      toast({
        title: "Removed",
        description: "Item removed from cart",
      });
    }
  };

  // Placeholder total - in production would fetch product prices
  const total = cartItems.reduce((sum, item) => sum + 299.99 * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Your cart is empty
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 border border-border rounded-md">
                  <div className="w-20 h-20 bg-secondary rounded-md flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Product #{item.product_id.slice(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-accent">R299.99</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 space-y-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Subtotal:</span>
            <span className="text-accent">R{total.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => {
              navigate("/cart");
              onClose();
            }}
          >
            View Cart
          </Button>
          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => {
              navigate("/checkout");
              onClose();
            }}
          >
            Checkout
          </Button>
        </div>
      </div>
    </>
  );
};
