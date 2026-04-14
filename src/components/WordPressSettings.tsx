import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Settings } from "lucide-react";

export const WordPressSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: '',
    wordpress_url: '',
    sync_mode: 'incremental' as 'full' | 'incremental',
    sync_categories: true,
    auto_sync_enabled: true,
    sync_schedule: '0 3 * * *',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('wordpress_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          wordpress_url: data.wordpress_url,
          sync_mode: data.sync_mode as 'full' | 'incremental',
          sync_categories: data.sync_categories,
          auto_sync_enabled: data.auto_sync_enabled,
          sync_schedule: data.sync_schedule,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load WordPress settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('wordpress_settings')
        .update({
          wordpress_url: settings.wordpress_url,
          sync_mode: settings.sync_mode,
          sync_categories: settings.sync_categories,
          auto_sync_enabled: settings.auto_sync_enabled,
          sync_schedule: settings.sync_schedule,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "WordPress settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          WordPress Sync Settings
        </CardTitle>
        <CardDescription>
          Configure automatic WordPress synchronization preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="wp-url">WordPress Site URL</Label>
          <Input
            id="wp-url"
            value={settings.wordpress_url}
            onChange={(e) => setSettings({ ...settings, wordpress_url: e.target.value })}
            placeholder="https://your-wordpress-site.com"
          />
          <p className="text-sm text-muted-foreground">
            The base URL of your WordPress installation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sync-mode">Sync Mode</Label>
          <Select
            value={settings.sync_mode}
            onValueChange={(value: 'full' | 'incremental') =>
              setSettings({ ...settings, sync_mode: value })
            }
          >
            <SelectTrigger id="sync-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incremental">Incremental (Add new products only)</SelectItem>
              <SelectItem value="full">Full (Update existing products)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Incremental only adds new products, Full updates existing ones too
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sync-categories">Sync Categories</Label>
            <p className="text-sm text-muted-foreground">
              Import WordPress product categories
            </p>
          </div>
          <Switch
            id="sync-categories"
            checked={settings.sync_categories}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, sync_categories: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync">Enable Automatic Sync</Label>
            <p className="text-sm text-muted-foreground">
              Run scheduled sync daily at 3:00 AM
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={settings.auto_sync_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, auto_sync_enabled: checked })
            }
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
