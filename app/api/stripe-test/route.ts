import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const keyInfo = {
    length: key.length,
    prefix: key.substring(0, 8),
    suffix: key.substring(key.length - 4),
    hasWhitespace: key !== key.trim(),
    hasNewline: key.includes("\n"),
  };
  
  try {
    const stripe = new Stripe(key.trim());
    
    // Simple API call to test connectivity
    const balance = await stripe.balance.retrieve();
    
    return NextResponse.json({ 
      success: true, 
      available: balance.available,
      keyInfo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    return NextResponse.json({ 
      error: message,
      keyInfo,
    }, { status: 500 });
  }
}
