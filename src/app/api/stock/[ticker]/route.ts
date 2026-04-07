import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote, fetchPriceHistory } from "@/lib/yahoo-finance";
import type { Period } from "@/lib/yahoo-finance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as Period) ?? "1mo";

  try {
    const [quote, history] = await Promise.all([
      fetchStockQuote(ticker),
      fetchPriceHistory(ticker, period),
    ]);
    return NextResponse.json({ ...quote, history });
  } catch {
    return NextResponse.json(
      { error: `Failed to fetch stock data for ${ticker}` },
      { status: 500 }
    );
  }
}
