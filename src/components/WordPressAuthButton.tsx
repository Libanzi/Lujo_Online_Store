import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const WordPressAuthButton = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wordpressUrl, setWordpressUrl] = useState("");
  const [wordpressToken, setWordpressToken] = useState("");
  const { toast } = useToast();

  const handleWordPressLogin = async () => {
    if (!wordpressUrl || !wordpressToken) {
      toast({
        title: "Missing Information",
        description: "Please provide both WordPress URL and token",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Call the edge function to sync WordPress user
      const { data, error } = await supabase.functions.invoke('wordpress-auth-sync', {
        body: { wordpressToken, wordpressUrl },
      });

      if (error) throw error;

      if (data.success && data.authUrl) {
        // Use the magic link to sign in
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to generate authentication link');
      }

    } catch (error: any) {
      console.error('WordPress auth error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate with WordPress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Sign in with WordPress
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>WordPress Authentication</DialogTitle>
          <DialogDescription>
            Enter your WordPress site URL and JWT token to sync your account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="wp-url">WordPress Site URL</Label>
            <Input
              id="wp-url"
              placeholder="https://your-wordpress-site.com"
              value={wordpressUrl}
              onChange={(e) => setWordpressUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-token">WordPress JWT Token</Label>
            <Input
              id="wp-token"
              type="password"
              placeholder="Your WordPress JWT token"
              value={wordpressToken}
              onChange={(e) => setWordpressToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your token from your WordPress profile or using the JWT Authentication plugin
            </p>
          </div>
          <Button 
            onClick={handleWordPressLogin} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
