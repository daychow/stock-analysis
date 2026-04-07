import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/yahoo-finance";
import { CacheHelper } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  const cache = new CacheHelper(null);

  const cached = await cache.get(`news:${ticker}`);
  if (cached) return NextResponse.json(cached);

  try {
    const news = await fetchNews(ticker);
    await cache.set(`news:${ticker}`, { news }, 3600);
    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch news for ${ticker}` },
      { status: 500 }
    );
  }
}
