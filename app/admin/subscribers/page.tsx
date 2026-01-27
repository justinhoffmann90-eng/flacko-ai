import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";

interface SubscriptionRow {
  id: string;
  users: { 
    email: string; 
    x_handle: string;
    discord_user_id: string | null;
    discord_username: string | null;
  } | null;
  status: string;
  price_tier: number;
  price_amount: number;
  locked_price_cents: number | null;
  created_at: string;
  current_period_end: string | null;
}

export default async function AdminSubscribersPage() {
  const supabase = await createClient();

  // Fetch all subscribers with their subscription info
  const { data: subscriptionsData } = await supabase
    .from("subscriptions")
    .select(`
      *,
      users (email, x_handle, discord_user_id, discord_username)
    `)
    .order("created_at", { ascending: false });

  const subscriptions = (subscriptionsData || []) as SubscriptionRow[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "comped":
        return "green";
      case "past_due":
        return "yellow";
      case "canceled":
        return "red";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground mt-2">
            {subscriptions.length} total subscribers
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Discord</th>
                  <th className="text-left py-3 px-4">Tier</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Subscribed</th>
                  <th className="text-left py-3 px-4">Period End</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const user = sub.users;
                  return (
                    <tr key={sub.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{user?.email || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {user?.x_handle || "No handle"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(sub.status) as "green" | "yellow" | "red" | "secondary"}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {user?.discord_user_id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-sm">{user.discord_username || "Linked"}</span>
                          </div>
                        ) : (
                          <span className="text-yellow-500">Not linked</span>
                        )}
                      </td>
                      <td className="py-3 px-4">Tier {sub.price_tier}</td>
                      <td className="py-3 px-4">
                        {sub.locked_price_cents ? formatCurrency(sub.locked_price_cents) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {sub.current_period_end
                          ? formatDate(sub.current_period_end)
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(!subscriptions || subscriptions.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No subscribers yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
