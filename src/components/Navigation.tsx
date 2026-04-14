import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, User, Heart, Menu, LogOut, Package, X, Shield, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { MiniCart } from "./MiniCart";
import { AuthModal } from "./AuthModal";
import { useAdmin } from "@/hooks/useAdmin";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadCartCount();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadCartCount();
      } else {
        setCartCount(0);
      }
    });

    // Handle scroll for sticky header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const loadCartCount = async () => {
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true });
    setCartCount(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setIsSearchExpanded(false);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: "Shop", path: "/products" },
    { label: "New Arrivals", path: "/new-arrivals" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <>
      <header className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        {/* Trust Bar */}
        <div className="bg-foreground text-background text-xs py-2">
          <div className="container mx-auto flex justify-center gap-8 items-center">
            <span className="flex items-center gap-1">Free shipping over R850</span>
            <span className="hidden sm:inline flex items-center gap-1">30-day returns</span>
            <span className="hidden md:inline flex items-center gap-1">Secure checkout</span>
            <span className="hidden md:inline flex items-center gap-1">
              <span className="text-[#00B8D9] font-semibold">Payflex</span> — pay in 4
            </span>
          </div>
        </div>

        {/* Main Header */}
        <div className={`border-b border-border transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Navigation Links (Desktop) */}
              <nav className="hidden lg:flex items-center gap-6 flex-1">
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="text-sm font-medium hover:text-accent transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              {/* Mobile: Hamburger Menu */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* Center: Logo */}
              <a 
                href="/" 
                className="flex items-center justify-center lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2"
              >
                <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[hsl(var(--luxury-gold))] to-[hsl(var(--luxury-champagne))] bg-clip-text text-transparent">
                  LUJO
                </span>
              </a>

              {/* Right: Icons */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                {/* Search - Desktop */}
                {isSearchExpanded ? (
                  <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 animate-in fade-in slide-in-from-right duration-300">
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                      autoFocus
                    />
                    <Button type="submit" size="icon" variant="ghost">
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setIsSearchExpanded(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </form>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSearchExpanded(true)}
                    className="hidden md:flex"
                    title="Search"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}

                {/* Wishlist */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/wishlist")} 
                  className="hidden md:flex" 
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </Button>

                {/* Admin Panel (only for admins) */}
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/admin")} 
                    className="hidden md:flex" 
                    title="Admin Panel"
                  >
                    <Shield className="h-5 w-5 text-[hsl(var(--luxury-gold))]" />
                  </Button>
                )}

                {/* Cart with Mini Cart */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative" 
                  onClick={() => setIsMiniCartOpen(true)} 
                  title="Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>

                {/* Account */}
                {user ? (
                  <div className="hidden md:flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate("/loyalty")} 
                      title="Loyalty Rewards"
                    >
                      <Award className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate("/orders")} 
                      title="Orders"
                    >
                      <Package className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleSignOut} 
                      title="Sign Out"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="hidden md:flex" 
                    title="Sign In"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background animate-in slide-in-from-top duration-300">
            <div className="container mx-auto py-4 px-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(link.path);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {link.label}
                </Button>
              ))}

              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => { 
                  navigate("/wishlist"); 
                  setIsMobileMenuOpen(false); 
                }}
              >
                <Heart className="h-5 w-5 mr-2" />
                Wishlist
              </Button>

              {isAdmin && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => { 
                    navigate("/admin"); 
                    setIsMobileMenuOpen(false); 
                  }}
                >
                  <Shield className="h-5 w-5 mr-2 text-[hsl(var(--luxury-gold))]" />
                  Admin Panel
                </Button>
              )}

              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => { 
                      navigate("/orders"); 
                      setIsMobileMenuOpen(false); 
                    }}
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Orders
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => { 
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false); 
                  }}
                >
                  <User className="h-5 w-5 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mini Cart Popup */}
      <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
