import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyModeCard } from "@/lib/content/daily-mode-card";
import { generateEODAccuracyCard } from "@/lib/content/eod-accuracy-card";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

const VIEWPORT = {
  width: 1200,
  height: 675,
  deviceScaleFactor: 2,
};

async function renderHtmlToPng(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buffer = await page.screenshot({ type: "png", fullPage: true });
    return buffer as Buffer;
  } finally {
    await browser.close();
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const date = searchParams.get("date");
    const shouldDownload = searchParams.get("download") === "1";

    if (!type || !date) {
      return new NextResponse("Missing type or date parameter", { status: 400 });
    }

    if (type === "mode-card") {
      const origin = new URL(request.url).origin;
      const imageResponse = await fetch(`${origin}/api/cards/mode?date=${date}`);
      if (!imageResponse.ok) {
        return new NextResponse("Failed to fetch mode card", { status: 500 });
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      const headers = new Headers({
        "Content-Type": "image/png",
      });
      if (shouldDownload) {
        headers.set("Content-Disposition", `attachment; filename=tsla-mode-${date}.png`);
      }
      return new NextResponse(arrayBuffer, { headers });
    }

    if (type === "daily-mode-card") {
      const result = await generateDailyModeCard(date);
      if (result.error || !result.html) {
        return new NextResponse(result.error || "Failed to generate card", { status: 400 });
      }
      const png = await renderHtmlToPng(result.html);
      const headers = new Headers({
        "Content-Type": "image/png",
      });
      if (shouldDownload) {
        headers.set("Content-Disposition", `attachment; filename=tsla-levels-${date}.png`);
      }
      return new NextResponse(png, { headers });
    }

    if (type === "eod-accuracy-card") {
      const result = await generateEODAccuracyCard(date);
      if (result.error || !result.html) {
        return new NextResponse(result.error || "Failed to generate card", { status: 400 });
      }
      const png = await renderHtmlToPng(result.html);
      const headers = new Headers({
        "Content-Type": "image/png",
      });
      if (shouldDownload) {
        headers.set("Content-Disposition", `attachment; filename=tsla-accuracy-${date}.png`);
      }
      return new NextResponse(png, { headers });
    }

    return new NextResponse("Unknown type", { status: 400 });
  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
