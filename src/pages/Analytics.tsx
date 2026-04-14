import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: any[];
  topProducts: any[];
  revenueByMonth: any[];
  ordersByStatus: any[];
}

export default function Analytics() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentOrders: [],
    topProducts: [],
    revenueByMonth: [],
    ordersByStatus: [],
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    } else if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadAnalytics = async () => {
    try {
      // Get total revenue and orders
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, created_at, payment_status");

      const paidOrders = orders?.filter(o => o.payment_status === 'completed') || [];
      const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0);

      // Get total customers
      const { count: customersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get top products
      const { data: topProducts } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          product:products(name, price, image_url)
        `);

      const productSales = topProducts?.reduce((acc: any, item: any) => {
        const id = item.product_id;
        if (!acc[id]) {
          acc[id] = {
            ...item.product,
            totalSold: 0,
            revenue: 0,
          };
        }
        acc[id].totalSold += item.quantity;
        acc[id].revenue += item.quantity * item.product.price;
        return acc;
      }, {});

      const sortedProducts = Object.values(productSales || {})
        .sort((a: any, b: any) => b.totalSold - a.totalSold)
        .slice(0, 5);

      // Calculate revenue by month
      const monthlyRevenue = paidOrders.reduce((acc: any, order) => {
        const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += order.total_amount;
        return acc;
      }, {});

      const revenueByMonth = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue,
      }));

      // Calculate orders by status
      const statusCounts = orders?.reduce((acc: any, order) => {
        const status = order.payment_status || 'pending';
        if (!acc[status]) {
          acc[status] = 0;
        }
        acc[status]++;
        return acc;
      }, {});

      const ordersByStatus = Object.entries(statusCounts || {}).map(([status, count]) => ({
        status,
        count,
      }));

      setAnalytics({
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalCustomers: customersCount || 0,
        totalProducts: productsCount || 0,
        recentOrders: recentOrders || [],
        topProducts: sortedProducts,
        revenueByMonth,
        ordersByStatus,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading analytics...</p>
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
        <div className="container">
          <h1 className="text-4xl font-bold mb-8">Analytics Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{analytics.totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalProducts}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topProducts.map((product: any, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.totalSold} sold · R{product.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analytics.topProducts.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No sales data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentOrders.map((order) => (
                    <div key={order.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">{order.profiles.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R{order.total_amount.toFixed(2)}</p>
                        <p className={`text-xs ${
                          order.status === 'completed' ? 'text-green-600' :
                          order.status === 'pending' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analytics.recentOrders.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No orders yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Revenue Trend Chart */}
            {analytics.revenueByMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R${value.toFixed(2)}`} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Products Chart */}
            {analytics.topProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Products Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${value} units`} />
                      <Legend />
                      <Bar dataKey="totalSold" fill="hsl(var(--primary))" name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Status Distribution */}
          {analytics.ordersByStatus.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.ordersByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.status}: ${entry.count}`}
                    >
                      {analytics.ordersByStatus.map((entry, index) => {
                        const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
