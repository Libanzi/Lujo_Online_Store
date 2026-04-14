import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ThemeColor {
  id: string;
  color_name: string;
  color_label: string;
  hsl_value: string;
  hex_value: string;
  sort_order: number;
}

export const useThemeColors = () => {
  const [colors, setColors] = useState<ThemeColor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchColors = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setColors(data || []);
    } catch (error) {
      console.error("Error fetching theme colors:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateColor = async (id: string, updates: Partial<ThemeColor>) => {
    try {
      const { error } = await supabase
        .from("theme_settings")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setColors((prev) =>
        prev.map((color) =>
          color.id === id ? { ...color, ...updates } : color
        )
      );

      toast({
        title: "Color updated",
        description: "Theme color has been updated successfully.",
      });

      return true;
    } catch (error) {
      console.error("Error updating color:", error);
      toast({
        title: "Error",
        description: "Failed to update theme color.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Apply colors to CSS variables
  const applyColors = () => {
    const root = document.documentElement;
    colors.forEach((color) => {
      root.style.setProperty(`--${color.color_name}`, color.hsl_value);
    });
  };

  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    if (colors.length > 0) {
      applyColors();
    }
  }, [colors]);

  return { colors, loading, updateColor, refetch: fetchColors };
};

// Helper to convert hex to HSL
export const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};
