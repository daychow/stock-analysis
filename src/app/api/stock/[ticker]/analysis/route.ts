import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchFinancials, fetchNews, fetchCompetitors } from "@/lib/yahoo-finance";
import { analyzeStock } from "@/lib/openrouter";

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

  try {
    const [quote, financials, news, competitors] = await Promise.all([
      fetchStockQuote(ticker),
      fetchFinancials(ticker),
      fetchNews(ticker),
      fetchCompetitors(ticker),
    ]);

    const analysis = await analyzeStock(quote, financials, competitors, news, apiKey);
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to analyze ${ticker}` },
      { status: 500 }
    );
  }
}
