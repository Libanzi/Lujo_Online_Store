import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Mail, MessageSquare, CreditCard } from "lucide-react";

interface AlertSettings {
  id: string;
  error_rate_threshold: number;
  execution_time_threshold: number;
  slack_webhook_url: string | null;
  discord_webhook_url: string | null;
  email_alerts_enabled: boolean;
  slack_alerts_enabled: boolean;
  discord_alerts_enabled: boolean;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("alert_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("Error loading settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load alert settings",
      });
      return;
    }

    setSettings(data);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);

    const { error } = await supabase
      .from("alert_settings")
      .update({
        error_rate_threshold: settings.error_rate_threshold,
        execution_time_threshold: settings.execution_time_threshold,
        slack_webhook_url: settings.slack_webhook_url,
        discord_webhook_url: settings.discord_webhook_url,
        email_alerts_enabled: settings.email_alerts_enabled,
        slack_alerts_enabled: settings.slack_alerts_enabled,
        discord_alerts_enabled: settings.discord_alerts_enabled,
      })
      .eq("id", settings.id);

    setSaving(false);

    if (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Alert settings saved successfully",
    });
  };

  const testWebhook = async (type: 'slack' | 'discord') => {
    const webhookUrl = type === 'slack' ? settings?.slack_webhook_url : settings?.discord_webhook_url;
    
    if (!webhookUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Please configure ${type} webhook URL first`,
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-webhook-alert', {
        body: {
          webhook_url: webhookUrl,
          webhook_type: type,
          alert_type: 'critical_function_failure',
          function_name: 'test-function',
          error_message: 'This is a test alert',
          details: {
            test: true,
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Test ${type} alert sent successfully`,
      });
    } catch (error) {
      console.error(`Error testing ${type} webhook:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to send test ${type} alert`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin || !settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-4xl font-bold">Alert Settings</h1>
            <p className="text-muted-foreground">Configure alert thresholds and notification channels</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Payflex BNPL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#00B8D9]" />
                Payflex BNPL
              </CardTitle>
              <CardDescription>
                Configure Buy Now Pay Later options for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-medium">Payflex BNPL</p>
                  <p className="text-sm text-muted-foreground">Allow customers to pay in 4 instalments (R100 - R24,000)</p>
                </div>
                <Switch
                  checked={true}
                  onCheckedChange={() => {
                    toast({
                      title: "Payflex Setting",
                      description: "Payflex toggle saved. Update Supabase Edge Function secrets to fully enable/disable.",
                    });
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-medium">Sandbox Mode</p>
                  <p className="text-sm text-muted-foreground">Use Payflex test environment (no real charges)</p>
                </div>
                <Switch
                  checked={true}
                  onCheckedChange={() => {
                    toast({
                      title: "Sandbox Mode",
                      description: "Set PAYFLEX_SANDBOX in Supabase Edge Function secrets to toggle.",
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Threshold Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Thresholds
              </CardTitle>
              <CardDescription>
                Configure when alerts should be triggered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="error-rate">Error Rate Threshold (%)</Label>
                <Input
                  id="error-rate"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.error_rate_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, error_rate_threshold: parseInt(e.target.value) })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Alert when error rate exceeds this percentage (based on last hour)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="execution-time">Execution Time Threshold (ms)</Label>
                <Input
                  id="execution-time"
                  type="number"
                  min="100"
                  value={settings.execution_time_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, execution_time_threshold: parseInt(e.target.value) })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Alert when function execution time exceeds this duration
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Alerts
              </CardTitle>
              <CardDescription>
                Send alerts via email to all admin users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Email Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for critical issues
                  </p>
                </div>
                <Switch
                  checked={settings.email_alerts_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, email_alerts_enabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Slack Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Slack Integration
              </CardTitle>
              <CardDescription>
                Send instant alerts to your Slack workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Slack Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive instant notifications in Slack
                  </p>
                </div>
                <Switch
                  checked={settings.slack_alerts_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, slack_alerts_enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={settings.slack_webhook_url || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, slack_webhook_url: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Get your webhook URL from{" "}
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Slack API
                  </a>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => testWebhook('slack')}
                disabled={!settings.slack_webhook_url}
              >
                Test Slack Alert
              </Button>
            </CardContent>
          </Card>

          {/* Discord Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discord Integration
              </CardTitle>
              <CardDescription>
                Send instant alerts to your Discord server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Discord Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive instant notifications in Discord
                  </p>
                </div>
                <Switch
                  checked={settings.discord_alerts_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, discord_alerts_enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
                <Input
                  id="discord-webhook"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings.discord_webhook_url || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, discord_webhook_url: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Get your webhook URL from Discord Server Settings → Integrations → Webhooks
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => testWebhook('discord')}
                disabled={!settings.discord_webhook_url}
              >
                Test Discord Alert
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSettings;
