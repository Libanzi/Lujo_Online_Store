-- Add INSERT policy for order_items so users can create items for their own orders
CREATE POLICY "Users can insert items for their own orders"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);