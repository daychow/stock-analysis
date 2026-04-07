import { NextRequest, NextResponse } from "next/server";
import { fetchFinancials } from "@/lib/yahoo-finance";
import { CacheHelper } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  const cache = new CacheHelper(null);

  const cached = await cache.get(`financials:${ticker}`);
  if (cached) return NextResponse.json(cached);

  try {
    const financials = await fetchFinancials(ticker);
    await cache.set(`financials:${ticker}`, financials, 86400);
    return NextResponse.json(financials);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch financials for ${ticker}` },
      { status: 500 }
    );
  }
}
