export const dynamic = 'force-dynamic';

import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  email: string;
  x_handle: string | null;
  discord_user_id: string | null;
  discord_username: string | null;
  created_at: string;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

export default async function AdminSubscribersPage() {
  const supabase = await createServiceClient();

  // Fetch all non-admin users
  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id, email, x_handle, discord_user_id, discord_username, created_at")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  if (usersError) {
    return (
      <div className="p-8">
        <p className="text-red-500">Error loading users: {usersError.message}</p>
      </div>
    );
  }

  // Fetch all subscriptions
  const { data: subsData } = await supabase
    .from("subscriptions")
    .select("id, user_id, status, stripe_subscription_id, current_period_end");

  const users = (usersData || []) as UserRow[];
  const subscriptions = (subsData || []) as SubscriptionRow[];

  // Create a map of user_id -> subscription
  const subsByUser = new Map<string, SubscriptionRow>();
  for (const sub of subscriptions) {
    // Keep the most recent/active subscription per user
    const existing = subsByUser.get(sub.user_id);
    if (!existing || sub.status === 'active' || sub.status === 'comped') {
      subsByUser.set(sub.user_id, sub);
    }
  }

  const getSubscriptionStatus = (userId: string) => {
    const sub = subsByUser.get(userId);
    if (!sub) return { status: "none", label: "No subscription" };
    return { status: sub.status, label: sub.status };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "comped":
        return "green";
      case "trialing":
        return "green";
      case "past_due":
        return "yellow";
      case "canceled":
      case "none":
        return "red";
      default:
        return "secondary";
    }
  };

  // Count stats
  const totalUsers = users.length;
  const discordLinked = users.filter(u => u.discord_user_id).length;
  const activeSubscriptions = users.filter(u => {
    const sub = subsByUser.get(u.id);
    return sub && ["active", "comped", "trialing"].includes(sub.status);
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground mt-2">
            {totalUsers} total • {activeSubscriptions} active • {discordLinked} Discord linked
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Handle</th>
                  <th className="text-left py-3 px-4">Stripe</th>
                  <th className="text-left py-3 px-4">Discord</th>
                  <th className="text-left py-3 px-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const subInfo = getSubscriptionStatus(user.id);
                  const hasIssues = !user.discord_user_id || subInfo.status === "none" || subInfo.status === "past_due";
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={`border-b hover:bg-muted/50 ${hasIssues ? "bg-yellow-500/5" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium">{user.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.x_handle || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(subInfo.status) as "green" | "yellow" | "red" | "secondary"}>
                          {subInfo.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {user.discord_user_id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-sm">{user.discord_username || "Linked"}</span>
                          </div>
                        ) : (
                          <span className="text-yellow-500">⚠ Not linked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No users yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
