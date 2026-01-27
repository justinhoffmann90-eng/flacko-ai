"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/dashboard/header";

// Keep supabase client for auth-related operations only
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, LogOut, CreditCard, Lock } from "lucide-react";

interface UserSettings {
  cash_available: number | null;
  alerts_enabled: boolean;
  email_new_reports: boolean;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [cashAvailable, setCashAvailable] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [emailNewReports, setEmailNewReports] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      // Dev bypass check
      const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

      if (devBypass) {
        // In dev mode, load from localStorage
        const savedSettings = localStorage.getItem("dev_settings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setCashAvailable(settings.cash_available?.toString() || "");
          setAlertsEnabled(settings.alerts_enabled ?? true);
          setEmailNewReports(settings.email_new_reports ?? true);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/user/settings");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        
        const data = await res.json();
        const settings = data.settings as UserSettings | null;
        
        if (settings) {
          setCashAvailable(settings.cash_available?.toString() || "");
          setAlertsEnabled(settings.alerts_enabled ?? true);
          setEmailNewReports(settings.email_new_reports ?? true);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }

      setLoading(false);
    };

    fetchSettings();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

    try {
      // In dev mode, save to localStorage
      if (devBypass) {
        localStorage.setItem("dev_settings", JSON.stringify({
          cash_available: cashAvailable ? parseInt(cashAvailable) : null,
          alerts_enabled: alertsEnabled,
          email_new_reports: emailNewReports,
        }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        return;
      }

      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cash_available: cashAvailable ? parseInt(cashAvailable) : null,
          alerts_enabled: alertsEnabled,
          email_new_reports: emailNewReports,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/user/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Failed to open billing portal");
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Settings" showNotifications={false} />
        <main className="px-4 py-6 max-w-lg mx-auto">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" showNotifications={false} />
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {success && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settings saved successfully!</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Trading Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Profile</CardTitle>
            <CardDescription>
              Set your available capital to see personalized position sizing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cashAvailable">Cash Available</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="cashAvailable"
                  type="number"
                  placeholder="50000"
                  value={cashAvailable}
                  onChange={(e) => setCashAvailable(e.target.value)}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Total cash available to deploy
              </p>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Lock className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Your financial information is private and never shared with anyone.</span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your email preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when price hits key levels
                </p>
              </div>
              <Switch
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Report Emails</p>
                <p className="text-sm text-muted-foreground">
                  Daily notification when report is published
                </p>
              </div>
              <Switch
                checked={emailNewReports}
                onCheckedChange={setEmailNewReports}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageBilling}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </main>
    </>
  );
}
