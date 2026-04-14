import { Button } from "@/components/ui/button";
import { GitCompare, Check } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CompareButtonProps {
  productId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CompareButton({ productId, variant = "outline", size = "sm" }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, count, maxItems, compareItems } = useCompare();
  const { toast } = useToast();
  const navigate = useNavigate();
  const inCompare = isInCompare(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCompare) {
      removeFromCompare(productId);
      toast({
        title: "Removed from comparison",
        description: "Product removed from compare list",
      });
    } else {
      const added = addToCompare(productId);
      if (added) {
        toast({
          title: "Added to comparison",
          description: `${count + 1}/${maxItems} products selected`,
          action: count >= 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/compare?products=${compareItems.join(",")},${productId}`)}
            >
              Compare Now
            </Button>
          ) : undefined,
        });
      } else {
        toast({
          title: "Cannot add",
          description: `Maximum ${maxItems} products can be compared`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className="gap-2"
    >
      {inCompare ? (
        <>
          <Check className="h-4 w-4" />
          <span className="hidden sm:inline">In Compare</span>
        </>
      ) : (
        <>
          <GitCompare className="h-4 w-4" />
          <span className="hidden sm:inline">Compare</span>
        </>
      )}
    </Button>
  );
}
