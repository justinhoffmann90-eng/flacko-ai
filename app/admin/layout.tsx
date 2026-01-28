import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Check if user is admin
  const { data: userData } = await serviceSupabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  
  if (!userData?.is_admin) {
    redirect("/dashboard");
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
