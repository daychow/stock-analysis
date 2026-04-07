export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { fetchCompetitors } from "@/lib/yahoo-finance";
import { CacheHelper } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  const cache = new CacheHelper(null);

  const cached = await cache.get(`competitors:${ticker}`);
  if (cached) return NextResponse.json(cached);

  try {
    const competitors = await fetchCompetitors(ticker);
    await cache.set(`competitors:${ticker}`, { competitors }, 604800);
    return NextResponse.json({ competitors });
  } catch {
    return NextResponse.json(
      { error: `Failed to fetch competitors for ${ticker}` },
      { status: 500 }
    );
  }
}
