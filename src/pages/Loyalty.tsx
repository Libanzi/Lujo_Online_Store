import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Gift, TrendingUp, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoyaltyData {
  current_points: number;
  lifetime_points: number;
  tier: {
    name: string;
    discount_percentage: number;
    benefits: string[];
  };
  next_tier?: {
    name: string;
    min_points: number;
  };
  transactions: any[];
}

export default function Loyalty() {
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to view your loyalty rewards.",
          variant: "destructive",
        });
        return;
      }

      // Get user's loyalty points
      const { data: pointsData } = await supabase
        .from("loyalty_points")
        .select(`
          current_points,
          lifetime_points,
          tier:loyalty_tiers(name, discount_percentage, benefits, min_points)
        `)
        .eq("user_id", user.id)
        .single();

      // Get all tiers to find next tier
      const { data: allTiers } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .order("min_points", { ascending: true });

      // Get transaction history
      const { data: transactions } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      let nextTier = null;
      if (pointsData && allTiers) {
        const currentTierPoints = pointsData.tier.min_points;
        nextTier = allTiers.find(t => t.min_points > currentTierPoints);
      }

      setLoyaltyData({
        current_points: pointsData?.current_points || 0,
        lifetime_points: pointsData?.lifetime_points || 0,
        tier: pointsData?.tier || { name: "Bronze", discount_percentage: 0, benefits: [] },
        next_tier: nextTier,
        transactions: transactions || [],
      });
    } catch (error: any) {
      console.error("Error loading loyalty data:", error);
      toast({
        title: "Error loading loyalty data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case "bronze": return "bg-amber-700";
      case "silver": return "bg-gray-400";
      case "gold": return "bg-yellow-500";
      case "platinum": return "bg-purple-500";
      default: return "bg-primary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading your rewards...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Loyalty Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Make your first purchase to join our loyalty program!
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const progressToNextTier = loyaltyData.next_tier
    ? ((loyaltyData.lifetime_points / loyaltyData.next_tier.min_points) * 100)
    : 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Loyalty Rewards</h1>

          {/* Current Tier Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  Your Tier
                </CardTitle>
                <Badge className={getTierColor(loyaltyData.tier.name)}>
                  {loyaltyData.tier.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Available Points</p>
                  <p className="text-3xl font-bold">{loyaltyData.current_points}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime Points</p>
                  <p className="text-3xl font-bold">{loyaltyData.lifetime_points}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Current Benefits:</p>
                <ul className="list-disc list-inside space-y-1">
                  {loyaltyData.tier.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{benefit}</li>
                  ))}
                </ul>
              </div>

              {loyaltyData.next_tier && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Progress to {loyaltyData.next_tier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {loyaltyData.lifetime_points} / {loyaltyData.next_tier.min_points}
                    </p>
                  </div>
                  <Progress value={progressToNextTier} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {loyaltyData.next_tier.min_points - loyaltyData.lifetime_points} points to go!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How to Earn Points */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                How to Earn Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Make Purchases</p>
                    <p className="text-sm text-muted-foreground">
                      Earn points on every order based on your tier level
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Points History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loyaltyData.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{transaction.description || transaction.transaction_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={transaction.points > 0 ? "default" : "destructive"}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </Badge>
                  </div>
                ))}
                {loyaltyData.transactions.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No transactions yet. Make a purchase to start earning!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
