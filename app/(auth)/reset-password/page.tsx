"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageState, setPageState] = useState<"loading" | "form" | "success" | "error">("loading");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const initializeAuth = useCallback(async () => {
    try {
      // Since we're now going through /api/auth/callback first,
      // we should have a valid session already
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("Session found for:", session.user.email);
        setUserEmail(session.user.email || "");
        setPageState("form");
        return;
      }

      // No session - they accessed this page directly without a valid link
      setError("No valid session found. Please request a new password link.");
      setDebugInfo("No active session - link may have expired");
      setPageState("error");
      
    } catch (err) {
      console.error("Init error:", err);
      setError("Something went wrong. Please try again.");
      setDebugInfo(`Exception: ${err}`);
      setPageState("error");
    }
  }, [supabase]);

  useEffect(() => {
    // Small delay to ensure hash is available
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, [initializeAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Re-authenticate with the new password to ensure cookies are properly set
      if (userEmail) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: password,
        });
        
        if (signInError) {
          console.error("Re-auth error (non-critical):", signInError);
          // Continue anyway - password was updated
        }
      }

      setPageState("success");
      
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh(); // Force server-side refresh to pick up new session
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Verifying your link...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Unable to Verify Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          {process.env.NODE_ENV === "development" && debugInfo && (
            <p className="text-xs text-muted-foreground">Debug: {debugInfo}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>You're All Set! 🎉</CardTitle>
          <CardDescription>Your password has been created</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              Taking you to your dashboard...
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Form state
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to Flacko AI</CardTitle>
        <CardDescription>Create a password to access your trading dashboard</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
