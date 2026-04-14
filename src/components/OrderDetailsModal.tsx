import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface OrderDetailsModalProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function OrderDetailsModal({ order, open, onOpenChange, onUpdate }: OrderDetailsModalProps) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);

    try {
      // Update order
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status,
          tracking_number: trackingNumber || null,
          notes: notes || null,
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Add status history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status,
        notes,
      });

      // Send email notification if status changed
      if (status !== order.status) {
        const emailType = status === 'shipped' ? 'shipped' : 'status_update';
        
        await supabase.functions.invoke('send-order-email', {
          body: {
            orderId: order.id,
            type: emailType,
          },
        }).catch((err) => {
          console.error('Email error:', err);
          // Don't fail the update if email fails
        });
      }

      toast({
        title: "Order updated successfully",
        description: "Customer has been notified via email",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {order.order_number}</DialogTitle>
          <DialogDescription>
            Update order status, add tracking information, and send notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <p className="text-sm">
              <span className="text-muted-foreground">Name:</span> {order.user_name}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span> {order.user_email}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Address:</span> {order.shipping_address}
            </p>
          </div>

          {/* Order Items */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>R{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>R{order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Update Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (visible to customer)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this order update..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={updating} className="flex-1">
                {updating ? "Updating..." : "Update & Notify Customer"}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
