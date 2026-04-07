export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchFinancials, fetchNews, fetchCompetitors } from "@/lib/yahoo-finance";
import { analyzeStock } from "@/lib/openrouter";
import { CacheHelper } from "@/lib/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 }
    );
  }

  const cache = new CacheHelper(null);

  const cached = await cache.get(`analysis:${ticker}`);
  if (cached) return NextResponse.json(cached);

  try {
    const [quote, financials, news, competitors] = await Promise.all([
      fetchStockQuote(ticker),
      fetchFinancials(ticker),
      fetchNews(ticker),
      fetchCompetitors(ticker),
    ]);

    const analysis = await analyzeStock(quote, financials, competitors, news, apiKey);
    await cache.set(`analysis:${ticker}`, analysis, 86400);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to analyze ${ticker}: ${message}` },
      { status: 500 }
    );
  }
}
