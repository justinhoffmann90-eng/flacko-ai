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
      const hash = window.location.hash;
      const queryParams = new URLSearchParams(window.location.search);

      // Check for error in hash first
      if (hash.includes("error=")) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorDesc = hashParams.get("error_description") || "Link is invalid or expired";
        setError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        setDebugInfo("Error in URL hash");
        setPageState("error");
        return;
      }

      // Check for error in query params
      if (queryParams.get("error")) {
        const errorCode = queryParams.get("error");
        if (errorCode === "link_expired") {
          setError("This link has expired or already been used. Please request a new one.");
        } else {
          const errorDesc = queryParams.get("error_description") || "Link is invalid or expired";
          setError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        }
        setDebugInfo("Error in URL query params");
        setPageState("error");
        return;
      }

      // Handle token_hash in query params (modern Supabase recovery flow)
      const tokenHash = queryParams.get("token_hash");
      const type = queryParams.get("type");
      if (tokenHash && type) {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "recovery" | "magiclink" | "email",
        });

        if (verifyError) {
          console.error("verifyOtp error:", verifyError);
          setError(`Failed to verify: ${verifyError.message}`);
          setDebugInfo(`verifyOtp failed: ${verifyError.message}`);
          setPageState("error");
          return;
        }

        if (data.session) {
          console.log("Session established via token_hash for:", data.session.user.email);
          setUserEmail(data.session.user.email || "");
          window.history.replaceState(null, "", "/reset-password");
          setPageState("form");
          return;
        }
      }

      // Handle PKCE code in query params
      const code = queryParams.get("code");
      if (code) {
        const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);

        if (codeError) {
          console.error("Code exchange error:", codeError);
          setError(`Failed to verify: ${codeError.message}`);
          setDebugInfo(`Code exchange failed: ${codeError.message}`);
          setPageState("error");
          return;
        }

        if (data.session) {
          console.log("Session established via code for:", data.session.user.email);
          setUserEmail(data.session.user.email || "");
          window.history.replaceState(null, "", "/reset-password");
          setPageState("form");
          return;
        }
      }

      // Check for tokens in hash (legacy Supabase implicit flow)
      if (hash.includes("access_token=")) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("setSession error:", sessionError);
            setError(`Failed to verify: ${sessionError.message}`);
            setDebugInfo(`setSession failed: ${sessionError.message}`);
            setPageState("error");
            return;
          }

          if (data.session) {
            console.log("Session established for:", data.session.user.email);
            setUserEmail(data.session.user.email || "");
            window.history.replaceState(null, "", "/reset-password");
            setPageState("form");
            return;
          }
        }
      }

      // No URL tokens - check for existing session (e.g., redirected from /auth/callback)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log("Existing session found");
        setUserEmail(session.user.email || "");
        setPageState("form");
        return;
      }

      // No session, no tokens - invalid state
      setError("No valid session found. Please request a new password link.");
      setDebugInfo("No tokens and no existing session");
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
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full"
            onClick={() => router.push("/forgot-password")}
          >
            Request New Link
          </Button>
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
