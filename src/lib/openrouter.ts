// src/lib/openrouter.ts
import type { StockQuote, FinancialsData, CompetitorSummary, NewsArticle, AIAnalysisResult } from "./types";

export function buildAnalysisPrompt(
  quote: StockQuote, financials: FinancialsData,
  competitors: CompetitorSummary[], news: NewsArticle[]
): string {
  const bsRows = financials.balanceSheet
    .map(b => `${b.year}: Assets=$${fmt(b.totalAssets)}, Liabilities=$${fmt(b.totalLiabilities)}, Equity=$${fmt(b.shareholdersEquity)}, D/E=${b.debtToEquity.toFixed(2)}`)
    .join("\n");

  const isRows = financials.incomeStatement
    .map(i => `${i.year}: Revenue=$${fmt(i.totalRevenue)}, Net Income=$${fmt(i.netIncome)}, Gross Margin=${i.grossMargin.toFixed(1)}%, Net Margin=${i.netMargin.toFixed(1)}%`)
    .join("\n");

  const cfRows = financials.cashFlow
    .map(c => `${c.year}: Operating CF=$${fmt(c.operatingCashFlow)}, CapEx=$${fmt(c.capitalExpenditure)}, FCF=$${fmt(c.freeCashFlow)}`)
    .join("\n");

  const growthSection = [
    financials.revenueGrowth.length > 0 ? `Revenue: ${financials.revenueGrowth.map(g => `${g > 0 ? "+" : ""}${g}%`).join(", ")}` : null,
    financials.netIncomeGrowth.length > 0 ? `Net Income: ${financials.netIncomeGrowth.map(g => `${g > 0 ? "+" : ""}${g}%`).join(", ")}` : null,
    financials.fcfGrowth.length > 0 ? `FCF: ${financials.fcfGrowth.map(g => `${g > 0 ? "+" : ""}${g}%`).join(", ")}` : null,
  ].filter(Boolean).join("\n");

  const compRows = competitors
    .map(c => `${c.ticker} (${c.name}): Market Cap=$${fmt(c.marketCap)}, P/E=${c.trailingPE.toFixed(1)}, P/B=${c.priceToBook.toFixed(1)}, Assets=$${fmt(c.totalAssets)}, Liabilities=$${fmt(c.totalLiabilities)}`)
    .join("\n");

  const newsRows = news.slice(0, 5).map(n => `- ${n.title}`).join("\n");

  return `Analyze the following stock and provide an investment recommendation.

## Company: ${quote.name} (${quote.ticker})
- Sector: ${quote.sector}
- Industry: ${quote.industry}
- Current Price: ${quote.currency} ${quote.price}
- Business: ${quote.description}

## Valuation Metrics
Market Cap: $${fmt(quote.marketCap)}
Trailing P/E: ${quote.trailingPE.toFixed(1)} | Forward P/E: ${quote.forwardPE.toFixed(1)}
P/B: ${quote.priceToBook.toFixed(1)} | EV/EBITDA: ${quote.evToEbitda.toFixed(1)}
Dividend Yield: ${quote.dividendYield.toFixed(1)}%

## Balance Sheet (last 3 years)
${bsRows}

## Income Statement (last 3 years)
${isRows}

## Cash Flow (last 3 years)
${cfRows}

## Growth Rates (YoY)
${growthSection}

## Competitor Valuations
${compRows}

## Recent News
${newsRows}

請用繁體中文回覆。Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "summary": "2-3句公司概況（繁體中文）",
  "strengths": ["強項1", "強項2", "強項3"],
  "weaknesses": ["弱項1", "弱項2", "弱項3"],
  "competitor_comparison": "3-4句同競爭對手嘅比較分析（繁體中文）",
  "recommendation": "BUY or WATCH or SELL",
  "recommendation_reason": "2-3句建議原因（繁體中文）",
  "risk_factors": ["風險1", "風險2"]
}`;
}

function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  return n.toFixed(0);
}

export function parseAnalysisResponse(raw: string): AIAnalysisResult {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  return JSON.parse(cleaned) as AIAnalysisResult;
}

export async function analyzeStock(
  quote: StockQuote, financials: FinancialsData,
  competitors: CompetitorSummary[], news: NewsArticle[],
  apiKey: string, model: string = "google/gemma-4-31b-it"
): Promise<AIAnalysisResult> {
  const prompt = buildAnalysisPrompt(quote, financials, competitors, news);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a financial analyst. Respond only with the requested JSON format. All text content must be in Traditional Chinese (繁體中文)." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return parseAnalysisResponse(content);
}
