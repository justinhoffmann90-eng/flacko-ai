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
import { CheckCircle, LogOut, CreditCard, Lock, ExternalLink } from "lucide-react";

interface UserSettings {
  cash_available: number | null;
  alerts_enabled: boolean;
  email_new_reports: boolean;
}

interface DiscordInfo {
  user_id: string | null;
  username: string | null;
}

const DISCORD_INVITE_URL = "https://discord.gg/WuDSbQFbfW";
const DISCORD_CLIENT_ID = "1465761828461216028";

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
  
  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Discord state
  const [discord, setDiscord] = useState<DiscordInfo | null>(null);

  useEffect(() => {
    // Check for Discord callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get("discord_linked") === "true") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }
    if (params.get("discord_error")) {
      setError(`Discord linking failed: ${params.get("discord_error")}`);
      window.history.replaceState({}, "", "/settings");
    }

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
        
        // Set Discord info
        if (data.discord) {
          setDiscord(data.discord);
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

  const [billingLoading, setBillingLoading] = useState(false);

  const handleManageBilling = async () => {
    setBillingLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/billing-portal", { method: "POST" });
      
      if (!res.ok) {
        const data = await res.json();
        if (data.error === "No subscription found") {
          setError("No active subscription found. Please contact support if you believe this is an error.");
        } else {
          setError(`Billing error: ${data.error || `HTTP ${res.status}`}`);
        }
        return;
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to get billing portal URL. Please try again.");
      }
    } catch (err) {
      console.error("Billing portal error:", err);
      setError("Failed to open billing portal. Please try again.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      setPasswordError("Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLinkDiscord = () => {
    // Build Discord OAuth URL
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/discord/callback`);
    const scope = "identify";
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = url;
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

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordSuccess && (
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Password updated successfully!</AlertDescription>
              </Alert>
            )}
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>
            <Button 
              onClick={handleChangePassword} 
              variant="outline"
              className="w-full" 
              disabled={passwordSaving || !newPassword || !confirmNewPassword}
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Discord */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </CardTitle>
            <CardDescription>
              Join our community for alerts and discussion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {discord?.username ? (
              // Connected state
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-500">Connected</p>
                    <p className="text-sm text-muted-foreground">@{discord.username}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Not connected state
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Link your Discord to get the <strong>Subscriber</strong> role and access private channels.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(DISCORD_INVITE_URL, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Discord Server
                  </Button>
                  
                  <Button
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                    onClick={handleLinkDiscord}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Link Discord Account
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              disabled={billingLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {billingLoading ? "Loading..." : "Manage Billing"}
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
