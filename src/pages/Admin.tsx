import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LowStockAlert } from "@/components/LowStockAlert";
import { ReorderSuggestions } from "@/components/ReorderSuggestions";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Layers, ShoppingBag, Percent, BarChart3, Activity, TrendingUp, Settings, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You do not have permission to access this page.
              </p>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
          
          <LowStockAlert />
          
          <div className="mb-8">
            <ReorderSuggestions />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/products")}>
              <CardHeader>
                <Package className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage product listings, images, and inventory
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/categories")}>
              <CardHeader>
                <Layers className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organize products into categories
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/orders")}>
              <CardHeader>
                <ShoppingBag className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View and manage customer orders
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/discounts")}>
              <CardHeader>
                <Percent className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Discount Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create and manage promotional discount codes
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/analytics")}>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View sales reports and business insights
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/monitoring")}>
              <CardHeader>
                <Activity className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Function Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Real-time monitoring of edge functions and security logs
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/analytics")}>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Performance trends and detailed insights with charts
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/settings")}>
              <CardHeader>
                <Settings className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Alert Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure alert thresholds and notification channels
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/wp/admin")}>
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mb-2" />
                <CardTitle>WordPress Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage WordPress content and sync products
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
