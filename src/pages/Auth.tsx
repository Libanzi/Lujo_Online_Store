import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { WordPressAuthButton } from "@/components/WordPressAuthButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HCaptchaComponent, HCaptchaHandle } from "@/components/HCaptcha";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<string>("");
  const [rateLimitWarning, setRateLimitWarning] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const captchaRef = useRef<HCaptchaHandle>(null);

  // Check password strength
  const checkPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) {
      setPasswordStrength("");
      return;
    }
    if (pwd.length < 8) {
      setPasswordStrength("weak");
      return;
    }
    
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength <= 2) setPasswordStrength("weak");
    else if (strength === 3) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side password validation for signup
    if (!isLogin) {
      if (password.length < 8) {
        toast({
          title: "Password too short",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        return;
      }
      
      if (passwordStrength === "weak") {
        toast({
          title: "Weak password",
          description: "Please use a stronger password with uppercase, lowercase, numbers, and special characters.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Trigger captcha verification
    if (!captchaToken) {
      captchaRef.current?.execute();
      return;
    }
    
    setLoading(true);
    setRateLimitWarning(false);

    try {
      // Verify captcha token
      const { data: captchaResult, error: captchaError } = await supabase.functions.invoke('verify-captcha', {
        body: { token: captchaToken },
      });

      if (captchaError || !captchaResult?.success) {
        throw new Error('Captcha verification failed. Please try again.');
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Check for rate limiting errors
          if (error.message.includes("rate limit") || error.message.includes("too many")) {
            setRateLimitWarning(true);
            throw new Error("Too many login attempts. Please wait a few minutes before trying again.");
          }
          throw error;
        }
        
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          // Check for rate limiting or weak password errors
          if (error.message.includes("rate limit") || error.message.includes("too many")) {
            setRateLimitWarning(true);
            throw new Error("Too many signup attempts. Please wait a few minutes before trying again.");
          }
          if (error.message.includes("password") && error.message.includes("breach")) {
            throw new Error("This password has been found in a data breach. Please choose a different password.");
          }
          throw error;
        }

        toast({
          title: "Account created!",
          description: "Welcome to Lujo. You can now start shopping.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      // Reset captcha on error
      setCaptchaToken("");
      captchaRef.current?.resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    // Auto-submit form after captcha verification
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const handleCaptchaError = () => {
    setCaptchaToken("");
    toast({
      title: "Captcha Error",
      description: "Failed to load captcha. Please refresh the page.",
      variant: "destructive",
    });
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4">
      <Card className="w-full max-w-md border-[hsl(var(--luxury-gold))]/20">
        <CardHeader className="text-center">
          <div className="mb-4">
            <span className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--luxury-gold))] to-[hsl(var(--luxury-champagne))] bg-clip-text text-transparent">
              LUJO
            </span>
          </div>
          <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your Lujo account" : "Join Lujo and start shopping"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rateLimitWarning && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Too many authentication attempts. Please wait a few minutes before trying again.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password {!isLogin && "(min. 8 characters)"}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!isLogin) checkPasswordStrength(e.target.value);
                }}
                required
                minLength={8}
              />
              {!isLogin && password && (
                <p className={`text-xs mt-1 ${
                  passwordStrength === "weak" ? "text-destructive" :
                  passwordStrength === "medium" ? "text-yellow-600" :
                  "text-green-600"
                }`}>
                  Password strength: {passwordStrength || "checking..."}
                </p>
              )}
            </div>

            <HCaptchaComponent
              ref={captchaRef}
              onVerify={handleCaptchaVerify}
              onError={handleCaptchaError}
              onExpire={handleCaptchaExpire}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <WordPressAuthButton />

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-[hsl(var(--luxury-gold))] transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
