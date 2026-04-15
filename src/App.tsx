import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { lazy, Suspense } from "react";

// ─── Eagerly-loaded customer pages ───────────────────────────────────────────
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetail";
import Category from "./pages/Category";
import Search from "./pages/Search";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import TrackOrder from "./pages/TrackOrder";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import SizeGuide from "./pages/SizeGuide";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Careers from "./pages/Careers";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Products from "./pages/Products";
import NewArrivals from "./pages/NewArrivals";
import Chat from "./pages/Chat";
import Loyalty from "./pages/Loyalty";
import Compare from "./pages/Compare";
import PayflexInfo from "./pages/PayflexInfo";
import NotFound from "./pages/NotFound";

// ─── Lazy-loaded admin pages (separate chunk — never sent to customers) ───────
const Admin = lazy(() => import("./pages/Admin"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminSuppliers = lazy(() => import("./pages/AdminSuppliers"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminDiscounts = lazy(() => import("./pages/AdminDiscounts"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AdminMonitoring = lazy(() => import("./pages/AdminMonitoring"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

// ─── Lazy-loaded WordPress integration (optional) ─────────────────────────────
const WordPressPage = lazy(() => import("./pages/WordPressPage"));
const WordPressProducts = lazy(() => import("./pages/WordPressProducts"));
const WordPressAdmin = lazy(() => import("./pages/WordPressAdmin"));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">
    Loading…
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <FloatingChatButton />
        <Routes>
          {/* ── Customer routes ────────────────────────────────────────── */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/products" element={<Products />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/payflex" element={<PayflexInfo />} />

          {/* ── Admin routes (lazy — own JS chunk) ────────────────────── */}
          <Route path="/admin" element={<Suspense fallback={<AdminFallback />}><Admin /></Suspense>} />
          <Route path="/admin/products" element={<Suspense fallback={<AdminFallback />}><AdminProducts /></Suspense>} />
          <Route path="/admin/suppliers" element={<Suspense fallback={<AdminFallback />}><AdminSuppliers /></Suspense>} />
          <Route path="/admin/categories" element={<Suspense fallback={<AdminFallback />}><AdminCategories /></Suspense>} />
          <Route path="/admin/orders" element={<Suspense fallback={<AdminFallback />}><AdminOrders /></Suspense>} />
          <Route path="/admin/discounts" element={<Suspense fallback={<AdminFallback />}><AdminDiscounts /></Suspense>} />
          <Route path="/admin/monitoring" element={<Suspense fallback={<AdminFallback />}><AdminMonitoring /></Suspense>} />
          <Route path="/admin/analytics" element={<Suspense fallback={<AdminFallback />}><Analytics /></Suspense>} />
          <Route path="/admin/settings" element={<Suspense fallback={<AdminFallback />}><AdminSettings /></Suspense>} />

          {/* ── WordPress integration (lazy) ───────────────────────────── */}
          <Route path="/wp/page/:slug" element={<Suspense fallback={<AdminFallback />}><WordPressPage /></Suspense>} />
          <Route path="/wp/products" element={<Suspense fallback={<AdminFallback />}><WordPressProducts /></Suspense>} />
          <Route path="/wp/admin" element={<Suspense fallback={<AdminFallback />}><WordPressAdmin /></Suspense>} />

          {/* ── Catch-all ─────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
