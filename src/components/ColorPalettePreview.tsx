import { useState } from "react";
import { useThemeColors, hexToHsl, ThemeColor } from "@/hooks/useThemeColors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Check, X, Loader2 } from "lucide-react";

const ColorPalettePreview = () => {
  const { colors, loading, updateColor } = useThemeColors();
  const [editingColor, setEditingColor] = useState<ThemeColor | null>(null);
  const [tempHex, setTempHex] = useState("");
  const [tempLabel, setTempLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEdit = (color: ThemeColor) => {
    setEditingColor(color);
    setTempHex(color.hex_value);
    setTempLabel(color.color_label);
  };

  const handleSave = async () => {
    if (!editingColor) return;

    setSaving(true);
    const hslValue = hexToHsl(tempHex);
    const success = await updateColor(editingColor.id, {
      hex_value: tempHex,
      hsl_value: hslValue,
      color_label: tempLabel,
    });

    if (success) {
      setEditingColor(null);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingColor(null);
    setTempHex("");
    setTempLabel("");
  };

  if (loading) {
    return (
      <div className="p-8 bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-background border-b border-border">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Theme Color Palette
          </h2>
          <span className="text-sm text-muted-foreground">
            Admin Only - Click a color to edit
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          {colors.map((color) => (
            <Dialog
              key={color.id}
              open={editingColor?.id === color.id}
              onOpenChange={(open) => !open && handleCancel()}
            >
              <DialogTrigger asChild>
                <button
                  onClick={() => handleEdit(color)}
                  className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105"
                >
                  <div
                    className="w-20 h-20 rounded-lg shadow-lg border border-border relative overflow-hidden"
                    style={{ backgroundColor: color.hex_value }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                      <Pencil className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="mt-2 text-sm font-medium text-foreground">
                    {color.sort_order}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {color.color_label}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {color.hex_value}
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Color {color.sort_order}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-lg border border-border shadow-md"
                      style={{ backgroundColor: tempHex }}
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label htmlFor="colorLabel">Label</Label>
                        <Input
                          id="colorLabel"
                          value={tempLabel}
                          onChange={(e) => setTempLabel(e.target.value)}
                          placeholder="Color label"
                        />
                      </div>
                      <div>
                        <Label htmlFor="colorPicker">Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="colorPicker"
                            value={tempHex}
                            onChange={(e) => setTempHex(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border border-border"
                          />
                          <Input
                            value={tempHex}
                            onChange={(e) => setTempHex(e.target.value)}
                            placeholder="#000000"
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    HSL: {hexToHsl(tempHex)}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPalettePreview;
