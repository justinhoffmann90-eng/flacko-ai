import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch TSLA quote" }, { status: 502 });
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    const price = Number(meta?.regularMarketPrice);
    const previousClose = Number(meta?.chartPreviousClose);

    if (!Number.isFinite(price)) {
      return NextResponse.json({ error: "Invalid TSLA quote response" }, { status: 502 });
    }

    const change = Number.isFinite(previousClose) ? price - previousClose : 0;
    const changePct = Number.isFinite(previousClose) && previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return NextResponse.json({
      price,
      change,
      changePct,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[api/quote/tsla] fetch failed", error);
    return NextResponse.json({ error: "Failed to fetch TSLA quote" }, { status: 500 });
  }
}
