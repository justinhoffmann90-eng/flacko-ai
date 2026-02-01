"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, FileText, Users } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  x_handle: string | null;
  discord_user_id: string | null;
  discord_username: string | null;
  created_at: string;
  subscription?: {
    status: string;
    stripe_subscription_id: string | null;
    current_period_end: string | null;
  };
}

export default function AdminSubscribersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setError(null);
    try {
      const response = await fetch("/api/admin/subscribers");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log("Loaded users:", data.users?.length || 0);
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error loading users:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Are you sure you want to delete ${email}?\n\nThis will:\n- Delete the user account\n- Cancel their subscription\n- Remove all their data\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(userId);
    try {
      const response = await fetch(`/api/admin/subscribers/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      // Remove from UI
      setUsers(users.filter(u => u.id !== userId));
    } catch (error: any) {
      alert(`Error deleting user: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getStatusColor(status?: string): "green" | "yellow" | "red" | "secondary" {
    switch (status) {
      case "active":
      case "comped":
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
  }

  // Count stats
  const totalUsers = users.length;
  const discordLinked = users.filter(u => u.discord_user_id).length;
  const activeSubscriptions = users.filter(u =>
    u.subscription && ["active", "comped", "trialing"].includes(u.subscription.status)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-black/20 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-lg font-bold text-blue-400">Subscribers</div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 text-sm">
                <Link href="/admin/reports" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Upload Report
                </Link>
                <Link href="/admin/subscribers" className="px-3 py-2 rounded bg-white/10 text-white">
                  Subscribers
                </Link>
                <Link href="/admin/command-center" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Command Center
                </Link>
                <Link href="/admin/dashboard/roles" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Roles
                </Link>
                <Link href="/admin/dashboard/docs" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Docs
                </Link>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div className="text-lg font-bold text-blue-400">
                  {new Date().toLocaleTimeString("en-US", {
                    timeZone: "America/Chicago",
                    hour12: true,
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 mb-8 space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground mt-2">
              {totalUsers} total • {activeSubscriptions} active • {discordLinked} Discord linked
            </p>
          </div>
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Discord</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const status = user.subscription?.status || "none";
                  const hasIssues = !user.discord_user_id || status === "none" || status === "past_due";

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
                        <Badge variant={getStatusColor(status)}>
                          {status}
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
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user.id, user.email)}
                          disabled={deleting === user.id}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          {deleting === user.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
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
    </div>
  );
}
