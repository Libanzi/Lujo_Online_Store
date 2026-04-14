import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ReorderSuggestion {
  id: string;
  product_id: string;
  current_stock: number;
  sales_velocity: number;
  suggested_reorder_quantity: number;
  days_until_stockout: number;
  priority: string;
  status: string;
  product: {
    name: string;
    image_url: string;
  };
}

export function ReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reorder_suggestions")
        .select(`
          *,
          product:products(name, image_url)
        `)
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("days_until_stockout", { ascending: true });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error: any) {
      console.error("Error loading suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-reorder-suggestions");
      
      if (error) throw error;
      
      toast({
        title: "Suggestions generated",
        description: "Reorder suggestions have been updated based on current sales data.",
      });
      
      loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Error generating suggestions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const markAsOrdered = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from("reorder_suggestions")
        .update({ status: "completed" })
        .eq("id", suggestionId);

      if (error) throw error;

      toast({ title: "Marked as ordered" });
      loadSuggestions();
    } catch (error: any) {
      toast({
        title: "Error updating suggestion",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading suggestions...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Reorder Suggestions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generateSuggestions}
              disabled={generating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? "Generating..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Suggestions</AlertTitle>
              <AlertDescription>
                No reorder suggestions at this time. Click refresh to generate new suggestions based on sales data.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={suggestion.product.image_url}
                        alt={suggestion.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{suggestion.product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Current Stock: {suggestion.current_stock} units
                            </p>
                          </div>
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority} Priority
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Sales Velocity</p>
                            <p className="font-medium">{suggestion.sales_velocity.toFixed(1)} units/day</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days Until Stockout</p>
                            <p className="font-medium">{suggestion.days_until_stockout} days</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Suggested Order</p>
                            <p className="font-medium">{suggestion.suggested_reorder_quantity} units</p>
                          </div>
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsOrdered(suggestion.id)}
                            >
                              Mark as Ordered
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
