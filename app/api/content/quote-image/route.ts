import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const maxDuration = 30;

const VIEWPORT = {
  width: 1200,
  height: 675,
  deviceScaleFactor: 2,
};

function generateQuoteHTML(quote: string, author: string, style: string) {
  const modeColors: Record<string, { glow: string; accent: string }> = {
    red: { glow: "rgba(239,68,68,0.4)", accent: "#ef4444" },
    orange: { glow: "rgba(249,115,22,0.4)", accent: "#f97316" },
    yellow: { glow: "rgba(234,179,8,0.4)", accent: "#eab308" },
    green: { glow: "rgba(34,197,94,0.4)", accent: "#22c55e" },
    neutral: { glow: "rgba(255,255,255,0.15)", accent: "#ffffff" },
  };

  const colors = modeColors[style] || modeColors.neutral;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 1200px;
      height: 675px;
      background: #000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    /* Subtle grid texture */
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 50px 50px;
    }
    
    /* Glow orbs */
    .orb-1 {
      position: absolute;
      width: 400px;
      height: 400px;
      background: ${colors.glow};
      border-radius: 50%;
      filter: blur(120px);
      top: -100px;
      right: -100px;
      opacity: 0.6;
    }
    
    .orb-2 {
      position: absolute;
      width: 300px;
      height: 300px;
      background: ${colors.glow};
      border-radius: 50%;
      filter: blur(100px);
      bottom: -50px;
      left: -50px;
      opacity: 0.4;
    }
    
    /* Card */
    .card {
      position: relative;
      width: 1000px;
      padding: 60px 80px;
      background: rgba(10,10,10,0.8);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      box-shadow: 
        0 0 60px ${colors.glow},
        inset 0 0 60px rgba(0,0,0,0.5);
    }
    
    /* Quote mark */
    .quote-mark {
      position: absolute;
      top: 30px;
      left: 50px;
      font-size: 120px;
      font-weight: 700;
      color: ${colors.accent};
      opacity: 0.15;
      line-height: 1;
    }
    
    /* Quote text */
    .quote {
      font-size: 36px;
      font-weight: 500;
      color: #fff;
      line-height: 1.5;
      text-align: center;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    
    /* Author */
    .author {
      font-size: 18px;
      font-weight: 600;
      color: ${colors.accent};
      text-align: center;
      letter-spacing: 0.05em;
    }
    
    /* Footer */
    .footer {
      position: absolute;
      bottom: 30px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
    }
    
    .logo {
      font-size: 16px;
      font-weight: 600;
      color: rgba(255,255,255,0.5);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .logo svg {
      width: 20px;
      height: 20px;
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="orb-1"></div>
  <div class="orb-2"></div>
  
  <div class="card">
    <div class="quote-mark">"</div>
    <div class="quote">${escapeHtml(quote)}</div>
    <div class="author">— ${escapeHtml(author)}</div>
  </div>
  
  <div class="footer">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 19l2 2"/>
      </svg>
      flacko.ai
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function renderHtmlToPng(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buffer = await page.screenshot({ type: "png" });
    return buffer as Buffer;
  } finally {
    await browser.close();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    const body = await request.json();
    const { quote, author = "Flacko AI", style = "neutral" } = body;

    if (!quote) {
      return NextResponse.json({ error: "Quote is required" }, { status: 400 });
    }

    const html = generateQuoteHTML(quote, author, style);
    const png = await renderHtmlToPng(html);

    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename=flacko-quote-${Date.now()}.png`,
      },
    });
  } catch (error) {
    console.error("Quote image error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}
