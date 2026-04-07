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
    .map(i => `${i.year}: Revenue=$${fmt(i.totalRevenue)}, Net Income=$${fmt(i.netIncome)}, Gross Margin=${(i.grossMargin * 100).toFixed(1)}%, Net Margin=${(i.netMargin * 100).toFixed(1)}%`)
    .join("\n");

  const compRows = competitors
    .map(c => `${c.ticker} (${c.name}): Assets=$${fmt(c.totalAssets)}, Liabilities=$${fmt(c.totalLiabilities)}, Equity=$${fmt(c.shareholdersEquity)}`)
    .join("\n");

  const newsRows = news.slice(0, 5).map(n => `- ${n.title}`).join("\n");

  return `Analyze the following stock and provide an investment recommendation.

## Company: ${quote.name} (${quote.ticker})
- Sector: ${quote.sector}
- Industry: ${quote.industry}
- Current Price: ${quote.currency} ${quote.price}
- Business: ${quote.description}

## Balance Sheet (last 3 years)
${bsRows}

## Income Statement (last 3 years)
${isRows}

## Competitors
${compRows}

## Recent News
${newsRows}

Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "summary": "2-3 sentence company overview",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "competitor_comparison": "3-4 sentence comparison with competitors",
  "recommendation": "BUY or WATCH or SELL",
  "recommendation_reason": "2-3 sentence reasoning",
  "risk_factors": ["risk1", "risk2"]
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
  apiKey: string, model: string = "openai/gpt-4o-mini"
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
        { role: "system", content: "You are a financial analyst. Respond only with the requested JSON format." },
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
