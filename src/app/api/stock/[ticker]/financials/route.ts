import { NextRequest, NextResponse } from "next/server";
import { fetchFinancials } from "@/lib/yahoo-finance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const financials = await fetchFinancials(ticker);
    return NextResponse.json(financials);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch financials for ${ticker}` },
      { status: 500 }
    );
  }
}
