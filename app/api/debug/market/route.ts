import { NextResponse } from "next/server";
import { getMarketSnapshot, getCurrentQuote } from "@/lib/price/yahoo-finance";

// Debug endpoint to test live market data fetch
// DELETE THIS AFTER DEBUGGING
export async function GET() {
  try {
    console.log("[DEBUG] Testing market data fetch...");
    
    // Test individual quote
    const tslaQuote = await getCurrentQuote("TSLA");
    console.log("[DEBUG] TSLA quote:", tslaQuote);
    
    // Test full snapshot
    const snapshot = await getMarketSnapshot();
    console.log("[DEBUG] Full snapshot:", snapshot);
    
    return NextResponse.json({
      success: true,
      tslaQuote,
      snapshot,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG] Market data fetch error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
