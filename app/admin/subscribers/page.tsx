import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  x_handle: string;
  discord_user_id: string | null;
  discord_username: string | null;
  created_at: string;
  subscriptions: {
    id: string;
    status: string;
    stripe_subscription_id: string | null;
    current_period_end: string | null;
  }[] | null;
}

export default async function AdminSubscribersPage() {
  const supabase = await createClient();

  // Fetch all users with their subscription info (if any)
  const { data: usersData } = await supabase
    .from("users")
    .select(`
      id,
      email,
      x_handle,
      discord_user_id,
      discord_username,
      created_at,
      subscriptions (id, status, stripe_subscription_id, current_period_end)
    `)
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  const users = (usersData || []) as UserRow[];

  const getSubscriptionStatus = (subs: UserRow["subscriptions"]) => {
    if (!subs || subs.length === 0) return { status: "none", label: "No subscription" };
    const sub = subs[0];
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
    const sub = u.subscriptions?.[0];
    return sub && ["active", "comped", "trialing"].includes(sub.status);
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            {totalUsers} total users • {activeSubscriptions} active • {discordLinked} Discord linked
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Subscription</th>
                  <th className="text-left py-3 px-4">Discord</th>
                  <th className="text-left py-3 px-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const subInfo = getSubscriptionStatus(user.subscriptions);
                  const hasIssues = !user.discord_user_id || subInfo.status === "none" || subInfo.status === "past_due";
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={`border-b hover:bg-muted/50 ${hasIssues ? "bg-yellow-500/5" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.x_handle || "No handle"}
                          </p>
                        </div>
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
