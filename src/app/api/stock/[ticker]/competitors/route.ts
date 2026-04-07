import { NextRequest, NextResponse } from "next/server";
import { fetchCompetitors } from "@/lib/yahoo-finance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const competitors = await fetchCompetitors(ticker);
    return NextResponse.json({ competitors });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch competitors for ${ticker}` },
      { status: 500 }
    );
  }
}
