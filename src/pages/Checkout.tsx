import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingBag, CreditCard, Truck, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { HCaptchaComponent, HCaptchaHandle } from "@/components/HCaptcha";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const captchaRef = useRef<HCaptchaHandle>(null);
  const [payflex, setPayflex] = useState({ eligible: false, instalmentAmount: 0 });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      loadCart();
    } else {
      navigate("/auth");
    }
  };

  const loadCart = async () => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product:products (
            id,
            name,
            price,
            image_url
          )
        `);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        navigate("/cart");
        return;
      }
      
      setCartItems(data);
    } catch (error: any) {
      toast({
        title: "Error loading cart",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const total = calculateTotal();
    setPayflex({
      eligible: total >= 100 && total <= 24000,
      instalmentAmount: total / 4,
    });
  }, [cartItems, appliedDiscount]);

  const handlePayflexPayment = async (orderId: string, total: number) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase.functions.invoke('process-payflex-payment', {
      body: {
        orderId,
        amount: total,
        customerEmail: user?.email,
        customerName: user?.user_metadata?.full_name || user?.email,
        returnUrl: `${window.location.origin}/orders?payflex=success`,
        cancelUrl: `${window.location.origin}/checkout?payflex=cancelled`,
      },
    });
    if (error || !data?.redirectUrl) throw new Error('Payflex payment initiation failed');
    window.location.href = data.redirectUrl;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = appliedDiscount?.amount || 0;
    return Math.max(0, subtotal - discountAmount);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setCheckingDiscount(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-discount', {
        body: {
          code: discountCode,
          subtotal: calculateSubtotal(),
        },
      });

      if (error) throw error;

      if (data.valid) {
        setAppliedDiscount(data.discount);
        toast({
          title: "Discount applied!",
          description: `You saved R${data.discount.amount.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Invalid discount code",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error applying discount",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCheckingDiscount(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a shipping address",
        variant: "destructive",
      });
      return;
    }

    // Trigger captcha verification
    if (!captchaToken) {
      captchaRef.current?.execute();
      return;
    }

    setSubmitting(true);

    try {
      // Verify captcha token
      const { data: captchaResult, error: captchaError } = await supabase.functions.invoke('verify-captcha', {
        body: { token: captchaToken },
      });

      if (captchaError || !captchaResult?.success) {
        throw new Error('Captcha verification failed. Please try again.');
      }

      const orderNumber = `ORD-${Date.now()}`;
      const totalAmount = calculateTotal();
      const discountAmount = appliedDiscount?.amount || 0;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          status: "pending",
          discount_code: appliedDiscount?.code || null,
          discount_amount: discountAmount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Increment discount uses atomically if applied
      if (appliedDiscount?.code) {
        // Use PostgreSQL's atomic increment to prevent race conditions
        const { error: discountError } = await supabase.rpc('increment_discount_uses', {
          discount_code: appliedDiscount.code
        });
        
        if (discountError) {
          console.error('Error incrementing discount uses:', discountError);
          // Don't fail the order if discount increment fails, just log it
        }
      }

      // Process payment based on method
      if (paymentMethod === 'cod') {
        // Cash on Delivery - no payment gateway needed
        await supabase
          .from('orders')
          .update({ 
            payment_method: 'cod',
            payment_status: 'pending'
          })
          .eq('id', order.id);

        // Clear cart
        await supabase
          .from("cart_items")
          .delete()
          .in("id", cartItems.map(item => item.id));

        // Send order confirmation email
        await supabase.functions.invoke('send-order-email', {
          body: {
            orderId: order.id,
            type: 'confirmation',
          },
        }).catch(console.error);

        // Process loyalty points
        await supabase.functions.invoke('process-loyalty-points', {
          body: {
            userId: user.id,
            orderId: order.id,
            orderAmount: totalAmount,
          },
        }).catch(console.error);

        toast({
          title: "Order placed successfully!",
          description: "You will pay cash on delivery. We'll contact you soon.",
        });

        navigate("/orders?success=true");
      } else if (paymentMethod === 'payfast') {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          'process-payfast-payment',
          {
            body: {
              orderId: order.id,
              amount: totalAmount,
              returnUrl: `${window.location.origin}/orders?success=true`,
              cancelUrl: `${window.location.origin}/checkout?cancelled=true`,
              notifyUrl: `${window.location.origin}/api/payfast-webhook`,
            },
          }
        );

        if (paymentError) throw paymentError;

        // Redirect to PayFast
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentData.paymentUrl;
        Object.entries(paymentData.paymentData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else if (paymentMethod === 'payflex') {
        await handlePayflexPayment(order.id, totalAmount);
        return; // redirect handled inside
      } else if (paymentMethod === 'stripe') {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          'process-stripe-payment',
          {
            body: {
              orderId: order.id,
              successUrl: `${window.location.origin}/orders?success=true`,
              cancelUrl: `${window.location.origin}/checkout?cancelled=true`,
            },
          }
        );

        if (paymentError) throw paymentError;

        // Redirect to Stripe Checkout
        window.location.href = paymentData.sessionUrl;
      } else if (paymentMethod === 'paypal') {
        // PayPal integration placeholder
        toast({
          title: "PayPal integration coming soon",
          description: "This payment method will be available shortly",
        });
        setSubmitting(false);
        return;
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error processing payment",
        description: error.message,
        variant: "destructive",
      });
      // Reset captcha on error
      setCaptchaToken("");
      captchaRef.current?.resetCaptcha();
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Shipping & Payment</h2>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div>
                      <Label htmlFor="address">Shipping Address</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your full shipping address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        required
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>Payment Method</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2 space-y-3">
                        {/* Cash on Delivery */}
                        <div className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                            <Truck className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">Cash on Delivery</p>
                              <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                            </div>
                          </Label>
                        </div>

                        {/* PayFast */}
                        <div className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          paymentMethod === 'payfast' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <RadioGroupItem value="payfast" id="payfast" />
                          <Label htmlFor="payfast" className="flex items-center gap-3 cursor-pointer flex-1">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-semibold">PayFast</p>
                              <p className="text-sm text-muted-foreground">Credit/debit card, EFT, SnapScan, Zapper</p>
                            </div>
                          </Label>
                        </div>

                        {/* Payflex BNPL */}
                        <div className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          !payflex.eligible ? 'opacity-50 cursor-not-allowed' : ''
                        } ${paymentMethod === 'payflex' ? 'border-[#00B8D9] bg-[#00B8D9]/5' : 'border-border hover:border-[#00B8D9]/50'}`}>
                          <RadioGroupItem value="payflex" id="payflex" disabled={!payflex.eligible} />
                          <Label htmlFor="payflex" className={`flex items-center gap-3 flex-1 ${payflex.eligible ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <Layers className="h-5 w-5 text-[#00B8D9]" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">Payflex</p>
                                <span className="text-xs bg-[#00B8D9] text-white px-2 py-0.5 rounded-full font-medium">Buy Now, Pay Later</span>
                              </div>
                              {payflex.eligible ? (
                                <p className="text-sm text-muted-foreground">
                                  4 x <strong className="text-foreground">R{payflex.instalmentAmount.toFixed(2)}</strong> — zero interest, zero fees
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Available for orders R100 - R24,000
                                </p>
                              )}
                            </div>
                            {payflex.eligible && (
                              <div className="text-right hidden sm:block">
                                <p className="text-xs text-muted-foreground">First payment today</p>
                                <p className="font-bold text-[#00B8D9]">R{payflex.instalmentAmount.toFixed(2)}</p>
                              </div>
                            )}
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Payflex instalment breakdown */}
                      {paymentMethod === 'payflex' && payflex.eligible && (
                        <div className="mt-3 rounded-xl bg-[#00B8D9]/10 border border-[#00B8D9]/20 p-4">
                          <p className="text-sm font-semibold text-[#00B8D9] mb-2">Payflex Payment Schedule</p>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[0, 2, 4, 6].map((weeks, i) => (
                              <div key={i} className="bg-white dark:bg-background rounded-lg p-2 border border-[#00B8D9]/20">
                                <p className="text-xs text-muted-foreground">{i === 0 ? 'Today' : `Week ${weeks}`}</p>
                                <p className="font-bold text-sm">R{payflex.instalmentAmount.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            No interest - No fees - Subject to Payflex approval
                          </p>
                        </div>
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
                      size="lg"
                      disabled={submitting}
                    >
                      {submitting ? "Processing..." : paymentMethod === 'cod' ? "Place Order" : "Continue to Payment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          R{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Discount Code */}
                  <div className="border-t pt-4 space-y-2">
                    <Label htmlFor="discount">Discount Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discount"
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        disabled={!!appliedDiscount}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={checkingDiscount || !!appliedDiscount || !discountCode.trim()}
                      >
                        {checkingDiscount ? "..." : appliedDiscount ? "✓" : "Apply"}
                      </Button>
                    </div>
                    {appliedDiscount && (
                      <div className="flex items-center justify-between text-sm text-green-600">
                        <span>✓ {appliedDiscount.description || appliedDiscount.code}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedDiscount(null);
                            setDiscountCode("");
                          }}
                          className="underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedDiscount.code})</span>
                        <span>-R{appliedDiscount.amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        R{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
