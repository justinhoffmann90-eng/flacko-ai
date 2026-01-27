"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail } from "lucide-react";

export default function WelcomePage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get email from URL params if present
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Welcome to Flacko AI!</CardTitle>
          <CardDescription>Your subscription is now active</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Check your email
            </div>
            <p className="text-sm text-muted-foreground">
              We sent a link to {email ? <strong>{email}</strong> : "your email"} to set your password and access your dashboard.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Check your spam folder</strong> if you don&apos;t see it within a few minutes.
            </p>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Didn&apos;t get the email?</p>
            <Link href="/forgot-password" className="text-foreground underline">
              Request a new link
            </Link>
          </div>

          <div className="pt-2">
            <Button asChild className="w-full" variant="outline">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
