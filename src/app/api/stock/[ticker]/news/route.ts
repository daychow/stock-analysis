import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/yahoo-finance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  try {
    const news = await fetchNews(ticker);
    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch news for ${ticker}` },
      { status: 500 }
    );
  }
}
