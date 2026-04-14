-- Enable realtime for products table to track stock changes
ALTER PUBLICATION supabase_realtime ADD TABLE products;