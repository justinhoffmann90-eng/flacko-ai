import { NextResponse } from "next/server";
import { sendDiscordMessage, sendReportNotification } from "@/lib/discord/client";
import { getAlertDiscordMessage, getNewReportDiscordMessage } from "@/lib/discord/templates";

// Test endpoint - remove in production
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "alert";

  if (type === "report") {
    // Test new report notification
    const message = getNewReportDiscordMessage({
      mode: "yellow",
      reportDate: new Date().toISOString().split("T")[0],
      closePrice: 431.66,
      changePct: 1.25,
      alerts: [
        { type: "upside", level_name: "R1", price: 435, action: "Trim 1/4 of position", reason: "" },
        { type: "upside", level_name: "R2", price: 445, action: "Trim another 1/4", reason: "" },
        { type: "downside", level_name: "S1", price: 425, action: "Add if held", reason: "" },
        { type: "downside", level_name: "S2", price: 415, action: "Max add zone", reason: "" },
      ],
    });

    const sent = await sendReportNotification(message);
    return NextResponse.json({ success: sent, type: "report" });
  }

  // Test buy the dip alert
  if (type === "dip" || type === "buy") {
    const message = getAlertDiscordMessage({
      alerts: [
        { type: "downside", level_name: "Daily 9 EMA / Low Vol Point", price: 444.00, action: "Add 1 bullet if price holds here", reason: "" },
      ],
      mode: "yellow",
      positioning: "Lean Bullish",
    });

    const sent = await sendDiscordMessage(message);
    return NextResponse.json({ success: sent, type: "dip" });
  }

  // Test price alert notification (take profit)
  const message = getAlertDiscordMessage({
    alerts: [
      { type: "upside", level_name: "R1", price: 435, action: "Trim 1/4 of position", reason: "" },
    ],
    mode: "yellow",
    positioning: "Lean Bullish",
  });

  const sent = await sendDiscordMessage(message);
  return NextResponse.json({ success: sent, type: "alert" });
}
