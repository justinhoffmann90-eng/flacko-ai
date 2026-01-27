import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    // Simple API call to test connectivity
    const balance = await stripe.balance.retrieve();
    
    return NextResponse.json({ 
      success: true, 
      available: balance.available,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ 
      error: message,
      keyExists: !!process.env.STRIPE_SECRET_KEY,
    }, { status: 500 });
  }
}
