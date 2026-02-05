import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ exists: false, hasLoggedIn: false });
    }

    const supabase = await createServiceClient();
    
    // Check if user exists and has logged in before
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ exists: false, hasLoggedIn: false });
    }

    // User exists - check if they've ever logged in
    const hasLoggedIn = user.last_sign_in_at !== null;
    
    return NextResponse.json({ 
      exists: true, 
      hasLoggedIn 
    });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json({ exists: false, hasLoggedIn: false });
  }
}
